import Fastify, { type FastifyBaseLogger } from 'fastify';
import { registerDeviceRoutes } from './routes/devices';
import { registerHealthRoute } from './routes/health';
import { registerAlertsWebhookRoute } from './routes/alerts-webhook';
import { logger } from './logger';

export function buildApp() {
  // Cast to FastifyBaseLogger: pino's Logger type structurally satisfies it
  // at runtime (info/warn/error/debug/fatal/trace/silent/child), but its
  // stricter overloads (e.g. child()'s msgPrefix requirement) don't
  // typecheck as a drop-in FastifyBaseLogger, which otherwise makes
  // TypeScript infer the full pino type as Fastify's Logger generic and
  // breaks unrelated internal Fastify type checks.
  const fastify = Fastify({ loggerInstance: logger as unknown as FastifyBaseLogger });

  // Fastify only natively parses JSON/plain-text; the alerts webhook accepts
  // raw CAP XML bodies.
  fastify.addContentTypeParser(
    ['application/xml', 'text/xml'],
    { parseAs: 'string' },
    (_request, body, done) => {
      done(null, body);
    }
  );

  registerHealthRoute(fastify);
  registerDeviceRoutes(fastify);
  registerAlertsWebhookRoute(fastify);

  return fastify;
}
