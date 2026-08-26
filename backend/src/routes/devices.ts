import type { FastifyInstance } from 'fastify';
import { upsertDeviceAreas } from '../db/devices.repo';

const MAX_ALERT_AREAS = 5;

interface AlertAreaBody {
  name: string;
  lat: number;
  lon: number;
}

interface RegisterDeviceBody {
  expoPushToken: string;
  // Areas the user explicitly chose to receive weather warnings for (see
  // lib/hooks/alert-areas.hook.ts) — already resolved to a lat/lon
  // client-side, not a live GPS position: these are the same fixed
  // coordinates for every user who picks that place, not a continuous
  // device location.
  areas: AlertAreaBody[];
  platform: 'ios' | 'android';
  appVersion?: string;
}

const alertAreaSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'lat', 'lon'],
  properties: {
    name: { type: 'string', minLength: 1 },
    lat: { type: 'number', minimum: -90, maximum: 90 },
    lon: { type: 'number', minimum: -180, maximum: 180 },
  },
};

const registerSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['expoPushToken', 'areas', 'platform'],
    properties: {
      expoPushToken: { type: 'string', minLength: 1 },
      areas: { type: 'array', items: alertAreaSchema, minItems: 1, maxItems: MAX_ALERT_AREAS },
      platform: { type: 'string', enum: ['ios', 'android'] },
      appVersion: { type: 'string' },
    },
  },
};

export function registerDeviceRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterDeviceBody }>(
    '/api/devices/register',
    { schema: registerSchema },
    async (request, reply) => {
      const { expoPushToken, areas, platform, appVersion } = request.body;
      await upsertDeviceAreas({ expoPushToken, areas, platform, appVersion });
      return reply.code(200).send({ ok: true });
    }
  );
}
