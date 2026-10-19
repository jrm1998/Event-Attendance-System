'use strict';

const express = require('express');
const controller = require('../controllers/authController');

const router = express.Router();

router.get('/session', controller.getSession);
router.get('/csrf', controller.getCsrf);
router.post('/login', controller.postLogin);
router.post('/logout', controller.postLogout);
router.post('/password', controller.postChangePassword);

module.exports = router;
