/**
 * Defense Proxy Server
 * Sits between the browser and the target login server.
 * Applies defense mechanisms (rate limiting, IP blocking, account lockout, etc.)
 * then forwards allowed requests to the real target.
 * Runs on port 10010.
 */
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 10010;
const DEFAULT_TARGET = process.env.TARGET_URL || 'http://localhost:10011/login';

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Defense configuration (mirrors the front-end DEFENSE_TYPES defaults)
// ---------------------------------------------------------------------------
const defenses = {
  rate_limit:        { enabled: true,  config: { maxRequests: 50, windowMs: 60_000 } },
  ip_blacklist:      { enabled: true,  config: { banThreshold: 100, banDuration: 300_000 } },
  captcha:           { enabled: false, config: { triggerAfter: 3 } },
  account_lockout:   { enabled: false, config: { maxAttempts: 5, lockDuration: 900_000 } },
  progressive_delay: { enabled: false, config: { baseDelay: 1000, multiplier: 2, maxDelay: 60_000 } },
  geo_blocking:      { enabled: false, config: { blockedCountries: ['RU', 'CN', 'NG'] } },
  honeypot:          { enabled: false, config: { trapAccounts: ['admin2', 'administrator', 'root', 'superuser'] } },
  behavioral:        { enabled: false, config: { minRequestInterval: 50 } },
};

// ---------------------------------------------------------------------------
// Tracking state
// ---------------------------------------------------------------------------
// ip → { timestamps: number[], count: number, blocked: boolean, unblockTime: number, failedAttempts: number }
const ipState = new Map();
// username → { count: number, locked: boolean, unlockTime: number }
const accountState = new Map();
// ip → current delay ms
const ipDelays = new Map();
// ip → honeypot hit count
const honeypotHits = new Map();
// ip → { intervals: number[], lastRequest: number }
const behavioralState = new Map();

// Stats
const stats = {
  rateLimitBlocks: 0,
  ipBans: 0,
  captchaChallenges: 0,
  accountLockouts: 0,
  geoBlocks: 0,
  honeypotDetections: 0,
  behavioralBlocks: 0,
  totalProbed: 0,
  totalBlocked: 0,
  totalForwarded: 0,
};

// ---------------------------------------------------------------------------
// Helper: get or create IP record
// ---------------------------------------------------------------------------
function getIp(ip) {
  if (!ipState.has(ip)) {
    ipState.set(ip, { timestamps: [], count: 0, blocked: false, unblockTime: 0, failedAttempts: 0 });
  }
  return ipState.get(ip);
}

function getAccount(username) {
  if (!accountState.has(username)) {
    accountState.set(username, { count: 0, locked: false, unlockTime: 0 });
  }
  return accountState.get(username);
}

// ---------------------------------------------------------------------------
// Defense check pipeline
// ---------------------------------------------------------------------------
function checkDefenses(ip, username, origin) {
  const now = Date.now();
  const responses = [];

  // 1. Geo-Blocking
  if (defenses.geo_blocking.enabled && origin) {
    const country = typeof origin === 'string' ? origin : origin.country;
    if (defenses.geo_blocking.config.blockedCountries.includes(country)) {
      stats.geoBlocks++;
      stats.totalBlocked++;
      return { blocked: true, statusCode: 403, defense: 'geo_blocking', message: `Country ${country} blocked`, responses: [{ defense: 'geo_blocking', action: 'blocked' }] };
    }
  }

  // 2. IP Blacklist
  if (defenses.ip_blacklist.enabled) {
    const rec = getIp(ip);
    if (rec.blocked) {
      if (now < rec.unblockTime) {
        stats.totalBlocked++;
        return { blocked: true, statusCode: 403, defense: 'ip_blacklist', message: `IP ${ip} is banned`, responses: [{ defense: 'ip_blacklist', action: 'blocked' }] };
      }
      rec.blocked = false;
      rec.count = 0;
    }
  }

  // 3. Honeypot
  if (defenses.honeypot.enabled && username) {
    if (defenses.honeypot.config.trapAccounts.includes(username.toLowerCase())) {
      const hits = (honeypotHits.get(ip) || 0) + 1;
      honeypotHits.set(ip, hits);
      stats.honeypotDetections++;
      responses.push({ defense: 'honeypot', action: 'detected', hits });
      if (hits >= 2) {
        banIp(ip, now);
        stats.totalBlocked++;
        return { blocked: true, statusCode: 403, defense: 'honeypot', message: 'Honeypot triggered', responses };
      }
    }
  }

  // 4. Behavioral analysis
  if (defenses.behavioral.enabled) {
    const pat = behavioralState.get(ip) || { intervals: [], lastRequest: 0 };
    if (pat.lastRequest > 0) {
      const interval = now - pat.lastRequest;
      pat.intervals.push(interval);
      if (pat.intervals.length > 20) pat.intervals.shift();
      const avg = pat.intervals.reduce((a, b) => a + b, 0) / pat.intervals.length;
      if (avg < defenses.behavioral.config.minRequestInterval && pat.intervals.length >= 5) {
        stats.behavioralBlocks++;
        stats.totalBlocked++;
        pat.lastRequest = now;
        behavioralState.set(ip, pat);
        return { blocked: true, statusCode: 403, defense: 'behavioral', message: 'Bot detected', responses: [{ defense: 'behavioral', action: 'blocked' }] };
      }
    }
    pat.lastRequest = now;
    behavioralState.set(ip, pat);
  }

  // 5. Rate limiting
  if (defenses.rate_limit.enabled) {
    const rec = getIp(ip);
    const windowMs = defenses.rate_limit.config.windowMs;
    rec.timestamps = rec.timestamps.filter(t => now - t < windowMs);
    rec.timestamps.push(now);
    if (rec.timestamps.length > defenses.rate_limit.config.maxRequests) {
      stats.rateLimitBlocks++;
      rec.count++;
      if (defenses.ip_blacklist.enabled && rec.count >= defenses.ip_blacklist.config.banThreshold) {
        banIp(ip, now);
        responses.push({ defense: 'ip_blacklist', action: 'banned' });
      }
      stats.totalBlocked++;
      return { blocked: true, statusCode: 429, defense: 'rate_limit', message: 'Rate limit exceeded', responses: [{ defense: 'rate_limit', action: 'limited' }, ...responses] };
    }
  }

  // 6. Progressive delay
  let delay = 0;
  if (defenses.progressive_delay.enabled) {
    delay = ipDelays.get(ip) || 0;
    if (delay > 0) {
      responses.push({ defense: 'progressive_delay', action: 'delayed', delay });
    }
  }

  // 7. Account lockout
  if (defenses.account_lockout.enabled && username) {
    const acc = getAccount(username);
    if (acc.locked) {
      if (now < acc.unlockTime) {
        stats.totalBlocked++;
        return { blocked: true, statusCode: 423, defense: 'account_lockout', message: `Account ${username} is locked`, responses: [{ defense: 'account_lockout', action: 'locked' }] };
      }
      acc.locked = false;
      acc.count = 0;
    }
  }

  // 8. CAPTCHA
  if (defenses.captcha.enabled && username) {
    const rec = getIp(ip);
    if ((rec.failedAttempts || 0) >= defenses.captcha.config.triggerAfter) {
      stats.captchaChallenges++;
      stats.totalBlocked++;
      return { blocked: true, statusCode: 428, defense: 'captcha', message: 'CAPTCHA required', responses: [{ defense: 'captcha', action: 'required' }] };
    }
  }

  return { blocked: false, delay, responses };
}

function banIp(ip, now) {
  const rec = getIp(ip);
  rec.blocked = true;
  rec.unblockTime = now + defenses.ip_blacklist.config.banDuration;
  stats.ipBans++;
}

function recordFailedAttempt(ip, username) {
  const now = Date.now();
  const rec = getIp(ip);
  rec.failedAttempts = (rec.failedAttempts || 0) + 1;

  if (username) {
    const acc = getAccount(username);
    acc.count++;
    if (defenses.account_lockout.enabled && acc.count >= defenses.account_lockout.config.maxAttempts) {
      acc.locked = true;
      acc.unlockTime = now + defenses.account_lockout.config.lockDuration;
      stats.accountLockouts++;
    }
  }

  if (defenses.progressive_delay.enabled) {
    const cur = ipDelays.get(ip) || defenses.progressive_delay.config.baseDelay;
    ipDelays.set(ip, Math.min(cur * defenses.progressive_delay.config.multiplier, defenses.progressive_delay.config.maxDelay));
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'defense-proxy', port: PORT, stats });
});

// Main probe endpoint
app.post('/api/probe', async (req, res) => {
  const { targetUrl, username, password, ip: clientIp, origin } = req.body;
  const ip = clientIp || req.ip || '127.0.0.1';

  stats.totalProbed++;

  // Run defense checks
  const check = checkDefenses(ip, username, origin);

  if (check.blocked) {
    return res.json({
      blocked: true,
      statusCode: check.statusCode,
      defense: check.defense,
      message: check.message,
      responseTime: 0,
      realResponse: false,
      defenseResponses: check.responses,
    });
  }

  // Apply progressive delay
  if (check.delay > 0) {
    await new Promise(r => setTimeout(r, Math.min(check.delay, 5000)));
  }

  // Forward to real target
  const target = targetUrl || DEFAULT_TARGET;
  const start = Date.now();

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const responseTime = Date.now() - start;
    const data = await upstream.json();

    stats.totalForwarded++;

    // Record failed attempts for defense tracking
    if (upstream.status === 401) {
      recordFailedAttempt(ip, username);
    }

    return res.json({
      blocked: false,
      statusCode: upstream.status,
      message: data.message || (upstream.ok ? 'Login successful' : 'Invalid credentials'),
      responseTime,
      realResponse: true,
      defenseResponses: check.responses,
    });
  } catch (err) {
    return res.status(502).json({
      blocked: false,
      statusCode: 502,
      message: `Target unreachable: ${err.message}`,
      responseTime: Date.now() - start,
      realResponse: false,
      defenseResponses: check.responses,
    });
  }
});

// Update defense configuration
app.post('/api/defenses', (req, res) => {
  const updates = req.body; // { rate_limit: { enabled: true, config: {...} }, ... }

  if (typeof updates !== 'object') {
    return res.status(400).json({ error: 'Expected object' });
  }

  for (const [key, value] of Object.entries(updates)) {
    if (defenses[key]) {
      if (typeof value.enabled === 'boolean') defenses[key].enabled = value.enabled;
      if (value.config && typeof value.config === 'object') {
        defenses[key].config = { ...defenses[key].config, ...value.config };
      }
    }
  }

  res.json({ ok: true, defenses });
});

// Get current defense state
app.get('/api/defenses', (_req, res) => {
  res.json({ defenses, stats });
});

// Reset all tracking state
app.post('/api/reset', (_req, res) => {
  ipState.clear();
  accountState.clear();
  ipDelays.clear();
  honeypotHits.clear();
  behavioralState.clear();
  Object.keys(stats).forEach(k => { stats[k] = 0; });
  res.json({ ok: true, message: 'All tracking state cleared' });
});

app.listen(PORT, () => {
  console.log(`[Proxy] Defense proxy running on http://localhost:${PORT}`);
  console.log(`[Proxy] Endpoints:`);
  console.log(`  POST /api/probe     — send attack probe`);
  console.log(`  GET  /api/health    — health check`);
  console.log(`  POST /api/defenses  — update defense config`);
  console.log(`  GET  /api/defenses  — get defense config`);
  console.log(`  POST /api/reset     — clear tracking state`);
});
