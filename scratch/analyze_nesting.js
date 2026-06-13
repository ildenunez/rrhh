const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/page.js');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// Find where app-container starts
const appContainerIdx = lines.findIndex(l => l.includes('app-container'));
console.log(`app-container starts at line: ${appContainerIdx + 1}`);

// Print lines around the end of the file
console.log("\nLast 30 lines of the file:");
for (let i = lines.length - 30; i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
