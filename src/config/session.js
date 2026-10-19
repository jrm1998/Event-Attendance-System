'use strict';

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const config = require('./environment');

function createSessionMiddleware() {
  const store = new MySQLStore({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    createDatabaseTable: true,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
  });

  return session({
    name: 'att.sid',
    secret: config.session.secret,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: !!config.trustProxy,
    cookie: {
      httpOnly: true,
      secure: config.session.cookieSecure,
      sameSite: config.session.cookieSameSite,
      maxAge: config.session.ttlMinutes * 60 * 1000,
    },
  });
}

module.exports = createSessionMiddleware;
