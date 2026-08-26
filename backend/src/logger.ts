import path from 'node:path';
import pino from 'pino';
import { ecsFormat } from '@elastic/ecs-pino-format';
import { config } from './config';

// Shared logger for both Fastify's HTTP request logging (see app.ts) and
// domain events logged outside any request context (e.g. push dispatch
// results from cron jobs) — everything writes to the same ECS-formatted,
// daily-rotated file so it can be shipped to Elasticsearch/Kibana or any
// other ECS-compatible log pipeline.
export const logger = pino(
  ecsFormat(),
  pino.transport({
    target: 'pino-roll',
    options: {
      file: path.join(config.logDir, 'app.log'),
      frequency: 'daily',
      size: '20m',
      mkdir: true,
      limit: { count: 14 },
    },
  })
);
