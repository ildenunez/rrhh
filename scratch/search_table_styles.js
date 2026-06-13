const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/page.js');
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('EMPLEADO') || line.includes('className="sticky-col"') || line.includes('sticky-col') || line.includes('border-collapse') || line.includes('custom-table')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
