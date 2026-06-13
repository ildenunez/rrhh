const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/api/dashboard-data/route.js');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('employee_name') || line.includes('avatar_url') || line.includes('department_name')) {
    if (line.includes('SELECT') || line.includes('AS')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
