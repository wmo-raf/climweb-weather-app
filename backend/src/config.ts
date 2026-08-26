import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  capFeedUrl: required('CAP_FEED_URL'),
  capAlertsSenderId: required('CAP_ALERTS_SENDER_ID'),
  appUserAgent: process.env.APP_USER_AGENT ?? 'climweb-alerts-backend',
  pollIntervalMinutes: Number(process.env.POLL_INTERVAL_MINUTES ?? 5),
  receiptCheckIntervalMinutes: Number(process.env.RECEIPT_CHECK_INTERVAL_MINUTES ?? 30),
  reminderIntervalMinutes: Number(process.env.REMINDER_INTERVAL_MINUTES ?? 180),
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN,
  webhookSecret: required('WEBHOOK_SECRET'),
  logDir: process.env.LOG_DIR ?? './logs',
};
