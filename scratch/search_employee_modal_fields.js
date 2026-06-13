const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/page.js');
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (idx > 6000 && idx < 6420) {
    if (line.includes('input') || line.includes('form') || line.includes('empForm') || line.includes('employeeForm') || line.includes('form-group')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
