'use strict';

const config = require('../config/environment');

function isValidTimezone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function nowUtc() {
  return new Date();
}

function toMysqlDatetime(date) {
  return date instanceof Date ? date : new Date(date);
}

/** Format a UTC Date in the school timezone: "MMM D, YYYY h:mm A" */
function formatDateTime(date, tz = config.school.timezone) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/** Short time-only format in the school timezone: "h:mm A" */
function formatTime(date, tz = config.school.timezone) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/** ISO date (YYYY-MM-DD) in the school timezone, for grouping by day. */
function dateKeyInTz(date, tz = config.school.timezone) {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  return parts;
}

module.exports = { isValidTimezone, nowUtc, toMysqlDatetime, formatDateTime, formatTime, dateKeyInTz };
