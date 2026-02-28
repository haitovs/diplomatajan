import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { parse } from 'node:url';
import { WebSocketServer } from 'ws';
import { z } from 'zod';

type DefenseConfig = {
  id: string;
  enabled: boolean;
  params: Record<string, string | number | boolean | string[]>;
};

type Scenario = {
  id: string;
  name: string;
  attackType: string;
  intensity: number;
  targetSurface: string;
  businessProfile: string;
  defenses: DefenseConfig[];
  createdAt: number;
  updatedAt: number;
};

type Run = {
  id: string;
  scenarioId: string;
  status: 'running' | 'stopped' | 'completed';
  startedAt: number;
  endedAt?: number;
  snapshots: Array<{
    label: 'baseline' | 'hardened';
    ts: number;
    totalRequests: number;
    blockedRequests: number;
    failedAuth: number;
    successfulLogins: number;
    peakRps: number;
    attackDuration: number;
  }>;
};

type RunEvent = {
  runId: string;
  ts: number;
  kind: 'traffic' | 'defense_action' | 'alert' | 'kpi';
  rps: number;
  blockedRate: number;
  authFailureRate: number;
  topOrigins: Array<{ country: string; count: number }>;
};

const scenarios = new Map<string, Scenario>();
const runs = new Map<string, Run>();
const runIntervals = new Map<string, NodeJS.Timeout>();
const eventBuffers = new Map<string, RunEvent[]>();

const scenarioSchema = z.object({
  name: z.string().min(1),
  attackType: z.string().min(1),
  intensity: z.number().min(1).max(20),
  targetSurface: z.enum(['login', 'api', 'mixed']),
  businessProfile: z.enum(['retail', 'fintech', 'education', 'saas']),
  defenses: z.array(
    z.object({
      id: z.string().min(1),
      enabled: z.boolean(),
      params: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
    }),
  ),
});

const recommendationPreset = [
  {
    id: 'rec-rate-limit',
    severity: 'critical',
    actionKey: 'enable_rate_limit',
    expectedRiskDropPct: 24,
    implementationEffort: 'low',
  },
  {
    id: 'rec-ip-blacklist',
    severity: 'high',
    actionKey: 'enable_ip_blacklist',
    expectedRiskDropPct: 17,
    implementationEffort: 'low',
  },
  {
    id: 'rec-account-lockout',
    severity: 'high',
    actionKey: 'enable_account_lockout',
    expectedRiskDropPct: 14,
    implementationEffort: 'medium',
  },
];

const buildTelemetryEvent = (runId: string): RunEvent => ({
  runId,
  ts: Date.now(),
  kind: 'kpi',
  rps: 40 + Math.round(Math.random() * 900),
  blockedRate: 15 + Math.round(Math.random() * 75),
  authFailureRate: 10 + Math.round(Math.random() * 55),
  topOrigins: [
    { country: 'RU', count: Math.round(Math.random() * 120) },
    { country: 'CN', count: Math.round(Math.random() * 90) },
    { country: 'US', count: Math.round(Math.random() * 60) },
  ],
});

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(jwt, { secret: process.env.JWT_SECRET || 'bastion-dev-secret' });

app.get('/api/v1/health', async () => ({ ok: true, ts: Date.now() }));

app.post('/api/v1/scenarios', async (request, reply) => {
  const parsed = scenarioSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Invalid scenario payload', details: parsed.error.flatten() });
  }

  const now = Date.now();
  const scenario: Scenario = {
    ...parsed.data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  scenarios.set(scenario.id, scenario);
  return reply.status(201).send(scenario);
});

app.get('/api/v1/scenarios/:id', async (request, reply) => {
  const params = request.params as { id: string };
  const scenario = scenarios.get(params.id);
  if (!scenario) return reply.status(404).send({ error: 'Scenario not found' });
  return scenario;
});

app.post('/api/v1/runs', async (request, reply) => {
  const body = request.body as { scenarioId: string };
  const scenario = scenarios.get(body.scenarioId);
  if (!scenario) return reply.status(404).send({ error: 'Scenario not found' });

  const run: Run = {
    id: randomUUID(),
    scenarioId: scenario.id,
    status: 'running',
    startedAt: Date.now(),
    snapshots: [],
  };

  runs.set(run.id, run);
  eventBuffers.set(run.id, []);

  const interval = setInterval(() => {
    const event = buildTelemetryEvent(run.id);
    const current = eventBuffers.get(run.id) || [];
    current.push(event);
    if (current.length > 240) current.shift();
    eventBuffers.set(run.id, current);
  }, 1000);

  runIntervals.set(run.id, interval);
  return reply.status(201).send(run);
});

app.post('/api/v1/runs/:id/stop', async (request, reply) => {
  const params = request.params as { id: string };
  const run = runs.get(params.id);
  if (!run) return reply.status(404).send({ error: 'Run not found' });

  const interval = runIntervals.get(run.id);
  if (interval) clearInterval(interval);

  run.status = 'stopped';
  run.endedAt = Date.now();
  return { ok: true, run };
});

app.get('/api/v1/runs/:id', async (request, reply) => {
  const params = request.params as { id: string };
  const run = runs.get(params.id);
  if (!run) return reply.status(404).send({ error: 'Run not found' });

  return {
    ...run,
    latestEvents: eventBuffers.get(run.id) || [],
  };
});

app.post('/api/v1/runs/:id/recommendations', async (request, reply) => {
  const params = request.params as { id: string };
  const run = runs.get(params.id);
  if (!run) return reply.status(404).send({ error: 'Run not found' });

  return {
    runId: run.id,
    items: recommendationPreset,
  };
});

app.post('/api/v1/reports/:runId/export', async (request, reply) => {
  const params = request.params as { runId: string };
  const query = request.query as { lang?: 'tk' | 'en' | 'both' };
  const run = runs.get(params.runId);
  if (!run) return reply.status(404).send({ error: 'Run not found' });

  const lang = query.lang || 'both';
  const scenario = scenarios.get(run.scenarioId);

  const markdown = [
    '# Bastion Twin Report',
    `Language mode: ${lang}`,
    `Scenario: ${scenario?.name || '-'}`,
    `Run ID: ${run.id}`,
    `Status: ${run.status}`,
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Recommendations',
    ...recommendationPreset.map((item) =>
      `- ${item.actionKey} (${item.severity}, ${item.expectedRiskDropPct}%, effort ${item.implementationEffort})`,
    ),
  ].join('\n');

  return reply.send({
    runId: run.id,
    lang,
    contentType: 'text/markdown',
    content: markdown,
  });
});

const httpServer = createServer((req, res) => {
  app.server.emit('request', req, res);
});

const wsServer = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const parsed = parse(request.url || '', true);
  const pathname = parsed.pathname || '';

  const match = pathname.match(/^\/api\/v1\/runs\/([^/]+)\/events$/);
  if (!match) {
    socket.destroy();
    return;
  }

  const runId = match[1];
  if (!runs.has(runId)) {
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit('connection', ws, runId);
  });
});

wsServer.on('connection', (ws, runId) => {
  const sendSnapshot = () => {
    const currentEvents = eventBuffers.get(runId as string) || [];
    ws.send(
      JSON.stringify({
        type: 'events',
        runId,
        events: currentEvents.slice(-20),
      }),
    );
  };

  sendSnapshot();
  const timer = setInterval(sendSnapshot, 1000);

  ws.on('close', () => clearInterval(timer));
});

const PORT = Number(process.env.PORT || 4051);
await app.ready();
httpServer.listen(PORT, () => {
  app.log.info(`Bastion API running on http://localhost:${PORT}`);
});
