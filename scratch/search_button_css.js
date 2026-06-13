const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/globals.css');
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('.btn') || line.includes('button')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
