import type { FastifyInstance } from 'fastify';
import { pool } from '../db/pool';

export function registerHealthRoute(fastify: FastifyInstance) {
  fastify.get('/healthz', async (_request, reply) => {
    await pool.query('SELECT 1');
    return reply.code(200).send({ ok: true });
  });
}
