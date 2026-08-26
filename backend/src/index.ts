import { run } from 'graphile-worker';
import { config } from './config';
import { buildApp } from './app';
import { startScheduler } from './scheduler/cron';
import { pool } from './db/pool';
import { DISPATCH_ALERT_TASK, dispatchAlertTask } from './tasks/dispatch-alert';

async function main() {
  const app = buildApp();
  await app.listen({ port: config.port, host: '0.0.0.0' });
  startScheduler();

  // Schema is installed ahead of time by the `migrate` service (see
  // docker-compose.yml: `graphile-worker --schema-only`), not by this call
  // — run() only bootstraps its schema if it's missing, so this is a no-op
  // there and just starts listening for jobs. Shares the app's own pg pool
  // rather than opening a second one.
  await run({
    pgPool: pool,
    taskList: { [DISPATCH_ALERT_TASK]: dispatchAlertTask },
  });
}

main().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
