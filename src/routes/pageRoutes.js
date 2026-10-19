'use strict';

const express = require('express');
const controller = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const studentController = require('../controllers/studentController');
const eventController = require('../controllers/eventController');
const userController = require('../controllers/userController');
const structureController = require('../controllers/structureController');
const attendanceController = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/', (req, res) => {
  if (req.user) return res.redirect(controller.homePathFor(req.user));
  return res.redirect('/login');
});

router.get('/login', controller.getLogin);
router.post('/login', controller.postLogin);
router.post('/logout', controller.postLogout);

router.get('/profile', requireAuth, controller.getProfile);
router.post('/profile/password', requireAuth, controller.postChangePassword);

// --- Admin pages -----------------------------------------------------------
router.get('/admin', requireAuth, requireRole('admin'), dashboardController.adminPage);
router.get('/admin/students', requireAuth, requireRole('admin'), studentController.listPage);
router.get('/admin/students/new', requireAuth, requireRole('admin'), studentController.formPage);
router.get('/admin/students/import', requireAuth, requireRole('admin'), studentController.importPage);
router.get('/admin/students/:id(\\d+)/edit', requireAuth, requireRole('admin'), studentController.formPage);
router.get('/admin/users', requireAuth, requireRole('admin'), userController.listPage);
router.get('/admin/structure', requireAuth, requireRole('admin'), structureController.structurePage);
router.get('/admin/events', requireAuth, requireRole('admin'), eventController.listPage);
router.get('/admin/events/new', requireAuth, requireRole('admin'), eventController.newPage);
router.get('/admin/events/:id(\\d+)/edit', requireAuth, requireRole('admin'), eventController.editPage);
router.get(
  '/admin/events/:id(\\d+)/attendance',
  requireAuth,
  requireRole('admin'),
  require('../middleware/authorize').requireEventAccess('id'),
  attendanceController.eventManagePage
);
router.get('/admin/review', requireAuth, requireRole('admin'), attendanceController.reviewQueuePage);
router.get('/admin/audit', requireAuth, requireRole('admin'), require('../controllers/reportController').auditPage);
router.get('/admin/reports', requireAuth, requireRole('admin'), require('../controllers/reportController').adminReportsPage);
router.get('/admin/settings', requireAuth, requireRole('admin'), require('../controllers/settingsController').settingsPage);
router.post('/admin/settings', requireAuth, requireRole('admin'), require('../controllers/settingsController').updateSettings);

// --- Teacher pages -----------------------------------------------------------
router.get('/teacher', requireAuth, requireRole('teacher'), dashboardController.teacherPage);
router.get('/teacher/events', requireAuth, requireRole('teacher'), dashboardController.teacherEventsPage);
router.get('/teacher/manual', requireAuth, requireRole('teacher'), require('../controllers/reportController').teacherManualPage);
router.get('/teacher/reports', requireAuth, requireRole('teacher'), require('../controllers/reportController').teacherReportsPage);
router.get(
  '/teacher/events/:id(\\d+)/attendance',
  requireAuth,
  requireRole('teacher'),
  require('../middleware/authorize').requireEventAccess('id'),
  attendanceController.eventManagePage
);

// --- QR display screens (admin + assigned teachers) ---------------------------
router.get('/admin/events/:id(\\d+)/qr', requireAuth, requireRole('admin'), require('../controllers/qrController').displayPage);
router.get('/teacher/events/:id(\\d+)/qr', requireAuth, requireRole('teacher'), require('../middleware/authorize').requireEventAccess('id'), require('../controllers/qrController').displayPage);

// --- Student pages ------------------------------------------------------------
router.get('/student', requireAuth, requireRole('student'), attendanceController.studentDashboardPage);
router.get('/student/events/:id(\\d+)', requireAuth, requireRole('student'), attendanceController.studentEventPage);
router.get('/student/events/:id(\\d+)/scan', requireAuth, requireRole('student'), attendanceController.studentScanPage);
router.get('/student/history', requireAuth, requireRole('student'), attendanceController.studentHistoryPage);

// --- Notifications (all roles) --------------------------------------------------
router.get('/notifications', requireAuth, require('../controllers/notificationController').notificationsPage);
router.get('/student/notifications', requireAuth, (req, res) => res.redirect('/notifications'));

module.exports = router;
