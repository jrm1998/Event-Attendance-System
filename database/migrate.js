/**
 * Migration runner.
 *
 *   npm run db:init      -> drops/recreates the database from database/schema.sql
 *                           and stamps 001_initial_schema.sql as applied.
 *                           DESTRUCTIVE: development use only.
 *   npm run db:migrate   -> applies any migration file in database/migrations/
 *                           that has not been recorded in schema_migrations.
 *
 * Migration files are plain .sql executed with multipleStatements enabled.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_attendance',
  multipleStatements: true,
  charset: 'utf8mb4_unicode_ci',
};

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function listMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function init() {
  const connection = await mysql.createConnection(config);
  try {
    console.log('[db:init] Applying database/schema.sql (drops existing data)...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schemaSql);
    // schema.sql always reflects every migration shipped so far, so stamp
    // all of them as applied to keep db:migrate a no-op after a fresh init.
    for (const file of listMigrationFiles()) {
      await connection.query(
        'INSERT INTO schema_migrations (filename) VALUES (?) ON DUPLICATE KEY UPDATE filename = filename',
        [file]
      );
    }
    console.log(`[db:init] Done. ${listMigrationFiles().length} migration(s) recorded as applied.`);
  } finally {
    await connection.end();
  }
}

async function migrate() {
  const connection = await mysql.createConnection({ ...config, database: config.database });
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_file (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    const [rows] = await connection.query('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.filename));
    const files = listMigrationFiles();

    let pending = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      pending += 1;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[db:migrate] Applying ${file}...`);
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      console.log(`[db:migrate] Applied ${file}`);
    }
    if (pending === 0) console.log('[db:migrate] Database is up to date.');
  } finally {
    await connection.end();
  }
}

(async () => {
  try {
    if (process.argv.includes('--init')) {
      await init();
    } else {
      await migrate();
    }
    process.exit(0);
  } catch (err) {
    console.error('[db] Migration failed:', err.message);
    process.exit(1);
  }
})();
