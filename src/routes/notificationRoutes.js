'use strict';

const express = require('express');
const controller = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authenticate');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth, apiLimiter);

router.get('/', controller.listApi);
router.get('/unread-count', controller.unreadCountApi);
router.post('/mark-read', controller.markReadApi);
router.post('/mark-all-read', controller.markAllReadApi);
router.get('/preferences', controller.preferencesApi);
router.put('/preferences', controller.updatePreferencesApi);

module.exports = router;
