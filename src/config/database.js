'use strict';

const mysql = require('mysql2/promise');
const config = require('./environment');

// timezone: 'Z' serializes JS Dates as UTC strings so every DATETIME in the
// database is consistently stored in UTC.
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  timezone: 'Z',
  charset: 'utf8mb4_unicode_ci',
  namedPlaceholders: true,
  decimalNumbers: false,
  dateStrings: false,
});

module.exports = pool;
