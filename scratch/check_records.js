const { query } = require('../src/lib/db');

async function test() {
  try {
    const res = await query('SELECT * FROM time_records ORDER BY id DESC LIMIT 20');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
