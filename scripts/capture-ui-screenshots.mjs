import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const VIEWPORT = { width: 1720, height: 1400 };
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'docs', 'ui-screenshots');
const DEBUG_PORT = 9333;

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const writeBase64Png = async (outputPath, base64Data) => {
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(outputPath, buffer);
};

const clampRect = (rect) => {
  if (!rect) return null;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return {
    x: Math.max(0, Math.floor(rect.x)),
    y: Math.max(0, Math.floor(rect.y)),
    width,
    height,
  };
};

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.eventWaiters = new Map();
    this.openPromise = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });

    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const handler = this.pending.get(message.id);
        if (!handler) return;
        this.pending.delete(message.id);
        if (message.error) {
          handler.reject(new Error(message.error.message || 'CDP command failed'));
        } else {
          handler.resolve(message.result);
        }
        return;
      }

      const waiters = this.eventWaiters.get(message.method);
      if (!waiters || waiters.length === 0) return;
      waiters.forEach((resolve) => resolve(message.params || {}));
      this.eventWaiters.delete(message.method);
    });
  }

  async connect() {
    await this.openPromise;
  }

  send(method, params = {}) {
    this.id += 1;
    const messageId = this.id;
    this.ws.send(JSON.stringify({ id: messageId, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(messageId, { resolve, reject });
    });
  }

  waitForEvent(method, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);

      const wrappedResolve = (params) => {
        clearTimeout(timeout);
        resolve(params);
      };

      const waiters = this.eventWaiters.get(method) || [];
      waiters.push(wrappedResolve);
      this.eventWaiters.set(method, waiters);
    });
  }

  close() {
    this.ws.close();
  }
}

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}`);
  }
  return response.json();
};

const findChromePath = async () => {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  throw new Error('Chrome/Chromium binary not found. Set CHROME_BIN to a valid path.');
};

const startChrome = async () => {
  const chromePath = await findChromePath();
  const userDataDir = path.join('/tmp', 'soc-ui-screenshot-chrome');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
  ], {
    stdio: 'ignore',
  });

  return chrome;
};

const waitForDebugger = async () => {
  const endpoint = `http://127.0.0.1:${DEBUG_PORT}/json/version`;
  const start = Date.now();
  while (Date.now() - start < 15000) {
    try {
      await fetchJson(endpoint);
      return;
    } catch {
      await wait(200);
    }
  }
  throw new Error('Chrome debugger endpoint did not start in time.');
};

const openTarget = async (url) => {
  const endpoint = `http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(url)}`;
  return fetchJson(endpoint, { method: 'PUT' });
};

const evaluate = async (client, expression) => {
  const { result } = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  return result?.value;
};

const getPanelRect = async (client, hints) => {
  const expression = `
    (() => {
      const hints = ${JSON.stringify(hints)}.map((hint) => hint.toLowerCase());
      const headings = [...document.querySelectorAll('h1, h2, h3, h4')];
      const heading = headings.find((node) => {
        const text = (node.textContent || '').toLowerCase();
        return hints.some((hint) => text.includes(hint));
      });
      if (!heading) return null;

      const panel = heading.closest('.glass-panel') || heading.closest('section') || heading.parentElement;
      if (!panel) return null;

      panel.scrollIntoView({ block: 'center', inline: 'nearest' });
      const rect = panel.getBoundingClientRect();
      const width = Math.min(window.innerWidth - 2, rect.width + 16);
      const height = Math.min(window.innerHeight - 2, rect.height + 16);
      return {
        x: Math.max(0, rect.x + window.scrollX - 8),
        y: Math.max(0, rect.y + window.scrollY - 8),
        width,
        height
      };
    })();
  `;

  const rect = await evaluate(client, expression);
  return clampRect(rect);
};

const capture = async (client, outputPath, clip = null) => {
  const params = clip
    ? { format: 'png', fromSurface: true, clip: { ...clip, scale: 1 } }
    : { format: 'png', fromSurface: true };
  const { data } = await client.send('Page.captureScreenshot', params);
  await writeBase64Png(outputPath, data);
};

const captureVariant = async (client, variant) => {
  const variantDir = path.join(OUTPUT_DIR, variant.name);
  await ensureDir(variantDir);

  const targetInfo = await openTarget(variant.url);
  const targetClient = new CdpClient(targetInfo.webSocketDebuggerUrl);
  await targetClient.connect();

  await targetClient.send('Page.enable');
  await targetClient.send('Runtime.enable');
  await targetClient.send('Emulation.setDeviceMetricsOverride', {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  try {
    await targetClient.waitForEvent('Page.loadEventFired', 10000);
  } catch {
    // fall through to timed wait
  }
  await wait(3200);

  await capture(targetClient, path.join(variantDir, 'dashboard-full.png'));

  for (const panel of variant.panels) {
    const rect = await getPanelRect(targetClient, panel.hints);
    if (!rect) {
      console.warn(`[${variant.name}] missing panel: ${panel.id}`);
      continue;
    }
    await wait(180);
    await capture(targetClient, path.join(variantDir, `${panel.id}.png`), rect);
  }

  await targetClient.send('Page.close');
  targetClient.close();
};

const run = async () => {
  await ensureDir(OUTPUT_DIR);
  const chrome = await startChrome();
  await waitForDebugger();

  const rootTarget = await openTarget('about:blank');
  const rootClient = new CdpClient(rootTarget.webSocketDebuggerUrl);
  await rootClient.connect();

  await captureVariant(rootClient, {
    name: 'before',
    url: 'http://127.0.0.1:4174/index.legacy.html',
    panels: [
      { id: 'traffic', hints: ['Traffic Volume (RPS)'] },
      { id: 'control', hints: ['Control Center'] },
      { id: 'logs', hints: ['Traffic Logs'] },
    ],
  });

  await captureVariant(rootClient, {
    name: 'after',
    url: 'http://127.0.0.1:4173/',
    panels: [
      { id: 'traffic', hints: ['Network Traffic'] },
      { id: 'map', hints: ['Attack Origin Map'] },
      { id: 'control', hints: ['Command Center'] },
      { id: 'logs', hints: ['Traffic Logs'] },
    ],
  });

  rootClient.close();
  chrome.kill('SIGTERM');
};

run().then(() => {
  console.log('UI screenshots captured.');
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
