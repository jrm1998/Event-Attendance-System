'use strict';

const http = require('http');
const config = require('./config/environment');
const { validateEnvironment } = config;
const logger = require('./utils/logger');
const { createApp } = require('./app');
const sockets = require('./sockets');

async function main() {
  validateEnvironment();

  const { app, sessionMiddleware } = createApp();
  const server = http.createServer(app);
  const io = sockets.init(server, sessionMiddleware);
  app.set('io', io);

  // Background jobs (absence finalizer, reminders, cleanup) are started
  // separately so they can be disabled in tests.
  if (!config.isTest && process.env.DISABLE_JOBS !== '1') {
    require('./jobs').start();
  }

  server.listen(config.port, () => {
    logger.info(`${config.school.name} attendance system listening on http://localhost:${config.port} [${config.env}]`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      try {
        const db = require('./config/database');
        await db.end();
      } catch {
        /* pool may already be closed */
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});
