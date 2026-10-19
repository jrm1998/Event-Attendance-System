'use strict';

const cron = require('node-cron');
const attendanceService = require('../services/attendanceService');
const qrRepo = require('../repositories/qrRepo');
const logger = require('../utils/logger');

/**
 * Runs every minute. Marks eligible students without a check-in record as
 * absent once the check-in window has been closed for the configured grace
 * period. Safe to run concurrently with submissions: only students without
 * any attendance row are touched, and events are stamped as finalized.
 */
function register() {
  cron.schedule('* * * * *', async () => {
    try {
      const marked = await attendanceService.finalizeAbsences();
      if (marked > 0) {
        logger.info(`[job] absence finalizer marked ${marked} student(s) absent`);
      }
    } catch (err) {
      logger.error('[job] absence finalizer failed:', err.message);
    }
  });

  // Housekeeping: expired QR tokens are kept 24h for audit, then purged.
  cron.schedule('23 * * * *', async () => {
    try {
      const purged = await qrRepo.purgeExpired();
      if (purged > 0) logger.info(`[job] purged ${purged} expired QR token(s)`);
    } catch (err) {
      logger.error('[job] QR purge failed:', err.message);
    }
  });

  logger.info('[job] attendance jobs scheduled (absence finalizer, QR purge)');
}

module.exports = { register };
