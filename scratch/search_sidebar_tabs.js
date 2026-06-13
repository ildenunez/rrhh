const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/page.js');
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Mi Equipo') || line.includes('equipo') || line.includes('role ===') || line.includes('activeTab ===')) {
    if (line.includes('Tab') || line.includes('tab') || line.includes('Sidebar') || line.includes('sidebar')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
