'use strict';

const express = require('express');
const controller = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authenticate');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth, apiLimiter);

// VAPID public key must be readable before a subscription exists.
router.get('/vapid-public', controller.vapidPublicApi);
router.post('/subscribe', controller.subscribeApi);
router.post('/unsubscribe', controller.unsubscribeApi);

module.exports = router;
