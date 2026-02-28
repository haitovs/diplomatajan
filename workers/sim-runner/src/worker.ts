import { Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'simulation-jobs',
  async (job) => {
    // Placeholder simulation worker: returns metadata for orchestration verification.
    return {
      jobId: job.id,
      runId: job.data?.runId,
      processedAt: Date.now(),
      status: 'ok',
    };
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`[sim-runner] completed job ${job.id}`);
});

worker.on('failed', (job, error) => {
  console.error(`[sim-runner] failed job ${job?.id}:`, error.message);
});
