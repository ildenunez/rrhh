const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('Altering table time_records...');
    await pool.query('ALTER TABLE time_records ADD COLUMN IF NOT EXISTS request_id INT REFERENCES requests(id) ON DELETE CASCADE;');
    console.log('Success!');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
