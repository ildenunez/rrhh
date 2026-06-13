const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/page.js');
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('employee-shifts') || line.includes('handlePaintCell') || line.includes('paintCell') || line.includes('shiftAssignments')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
