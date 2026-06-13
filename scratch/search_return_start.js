const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/page.js');
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('return (') && idx > 1400 && idx < 1535) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
