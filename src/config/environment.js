'use strict';

const path = require('path');
require('dotenv').config();

function toInt(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) ? defaultValue : value;
}

function toFloat(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  const value = Number.parseFloat(raw);
  return Number.isNaN(value) ? defaultValue : value;
}

function toBool(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test' || !!process.env.VITEST;

let sessionSecret = process.env.SESSION_SECRET || '';
if (!sessionSecret && !isProduction) {
  // Ephemeral secret in development: sessions reset on restart, which is
  // acceptable locally but must never happen in production.
  sessionSecret = require('crypto').randomBytes(48).toString('hex');
}

const config = {
  env: nodeEnv,
  // Dynamic so validateEnvironment (and tests) always see the live NODE_ENV.
  get isProduction() {
    return (process.env.NODE_ENV || 'development') === 'production';
  },
  get isTest() {
    return (process.env.NODE_ENV || '') === 'test' || !!process.env.VITEST;
  },
  port: toInt('PORT', 3000),
  trustProxy: process.env.TRUST_PROXY || false,

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt('DB_PORT', 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_attendance',
    connectionLimit: toInt('DB_CONNECTION_LIMIT', 10),
  },

  session: {
    secret: sessionSecret,
    ttlMinutes: toInt('SESSION_TTL_MINUTES', 120),
    cookieSecure: isProduction ? true : toBool('COOKIE_SECURE', false),
    cookieSameSite: (process.env.COOKIE_SAMESITE || 'Lax'),
  },

  rateLimits: {
    login: {
      max: toInt('RATE_LIMIT_LOGIN_MAX', 10),
      windowMinutes: toInt('RATE_LIMIT_LOGIN_WINDOW_MINUTES', 15),
    },
    attendance: {
      max: toInt('RATE_LIMIT_ATTENDANCE_MAX', 20),
      windowMinutes: toInt('RATE_LIMIT_ATTENDANCE_WINDOW_MINUTES', 1),
    },
    api: {
      max: toInt('RATE_LIMIT_API_MAX', 300),
      windowMinutes: toInt('RATE_LIMIT_API_WINDOW_MINUTES', 1),
    },
  },

  loginSecurity: {
    maxFailedAttempts: toInt('LOGIN_MAX_FAILED_ATTEMPTS', 5),
    lockoutMinutes: toInt('LOGIN_LOCKOUT_MINUTES', 15),
  },

  qr: {
    rotationSeconds: toInt('QR_ROTATION_SECONDS', 45),
    tokenTtlSeconds: toInt('QR_TOKEN_TTL_SECONDS', 0) || toInt('QR_ROTATION_SECONDS', 45) + 5,
  },

  gps: {
    defaultRadiusMeters: toFloat('GPS_DEFAULT_RADIUS_METERS', 50),
    maxAccuracyMeters: toFloat('GPS_MAX_ACCURACY_METERS', 50),
    freshnessSeconds: toInt('GPS_FRESHNESS_SECONDS', 60),
    flagDistanceMultiplier: toFloat('GPS_FLAG_DISTANCE_MULTIPLIER', 1.5),
  },

  school: {
    name: process.env.SCHOOL_NAME || 'Sample Junior-Senior High School',
    timezone: process.env.SCHOOL_TIMEZONE || 'Asia/Manila',
  },

  seed: {
    adminUsername: process.env.SEED_ADMIN_USERNAME || 'admin',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || '',
    studentsPerSection: toInt('SEED_STUDENTS_PER_SECTION', 8),
  },

  smtp: {
    enabled: toBool('SMTP_ENABLED', false),
    host: process.env.SMTP_HOST || '',
    port: toInt('SMTP_PORT', 587),
    secure: toBool('SMTP_SECURE', false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'School Attendance System <no-reply@example.edu>',
  },

  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@example.edu',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
  uploadsDir: path.join(__dirname, '..', '..', 'public', 'uploads'),
  viewsDir: path.join(__dirname, '..', '..', 'views'),
  publicDir: path.join(__dirname, '..', '..', 'public'),
};

function validateEnvironment() {
  const errors = [];
  if (config.isProduction) {
    if (!process.env.SESSION_SECRET) {
      errors.push('SESSION_SECRET is required in production.');
    }
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters.');
    }
    if (!config.isTest && !config.session.cookieSecure) {
      errors.push('COOKIE_SECURE must be true in production (HTTPS-only cookies).');
    }
  }
  if (!config.db.database) errors.push('DB_NAME is required.');
  if (errors.length) {
    throw new Error(`Invalid environment configuration:\n  - ${errors.join('\n  - ')}`);
  }
}

module.exports = config;
module.exports.validateEnvironment = validateEnvironment;
