import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { config } from '../config';
import { parseFromXML } from '../cap/alert';
import { processAlert } from '../cap/process';

function isValidSecret(provided: string | undefined): boolean {
  if (!provided) {
    return false;
  }
  const expected = Buffer.from(config.webhookSecret);
  const actual = Buffer.from(provided);
  if (expected.length !== actual.length) {
    return false; // timingSafeEqual throws on length mismatch
  }
  return timingSafeEqual(expected, actual);
}

export function registerAlertsWebhookRoute(fastify: FastifyInstance) {
  fastify.post(
    '/api/alerts/webhook',
    {
      onRequest: async (request, reply) => {
        const secret = request.headers['x-webhook-secret'];
        if (typeof secret !== 'string' || !isValidSecret(secret)) {
          return reply.code(401).send({ error: 'unauthorized' });
        }
      },
    },
    async (request, reply) => {
      let alert;
      try {
        alert = await parseFromXML(request.body as string);
      } catch (error) {
        request.log.warn({ error }, '[webhook] failed to parse CAP XML payload');
        return reply.code(400).send({ error: 'invalid CAP XML' });
      }

      try {
        await processAlert(alert);
      } catch (error) {
        request.log.error({ error }, '[webhook] failed to process alert');
        return reply.code(500).send({ error: 'processing failed' });
      }

      return reply.code(200).send({ ok: true });
    }
  );
}
