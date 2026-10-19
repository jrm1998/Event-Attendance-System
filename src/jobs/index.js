'use strict';

// Background jobs are registered here. Jobs must be idempotent; they run on
// one server instance only (see deployment docs for multi-instance setups).
const logger = require('../utils/logger');

const jobs = [];

function registerCron(expression, name, fn) {
  const cron = require('node-cron');
  const task = cron.schedule(expression, async () => {
    try {
      await fn();
    } catch (err) {
      logger.error(`Job ${name} failed:`, err);
    }
  });
  jobs.push({ name, task });
  logger.info(`Job registered: ${name} (${expression})`);
}

function start() {
  logger.info('Background jobs starting...');
  // eslint-disable-next-line global-require
  require('./attendanceJobs').register(registerCron);
  require('./notificationJobs').register(registerCron);
}

function stopAll() {
  for (const job of jobs) {
    try {
      job.task.stop();
    } catch {
      /* already stopped */
    }
  }
}

module.exports = { start, stopAll, registerCron };
