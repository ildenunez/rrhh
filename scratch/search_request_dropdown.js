const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/app/page.js');
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('absence_type_id') || line.includes('dashboardData.absenceTypes') || line.includes('predefined_ranges')) {
    if (line.includes('select') || line.includes('map') || line.includes('option')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
