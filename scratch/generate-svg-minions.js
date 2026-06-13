const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Helper to generate SVG string
function getMinionSVG(type) {
  let eyes = '';
  let mouth = '';
  let hair = '';
  let bodyColor = '#facc15'; // Minion Yellow
  let overallColor = '#2563eb'; // Blue
  let extraDecoration = '';

  switch (type) {
    case 'bob':
      // Short, two eyes, big smile
      eyes = `
        <!-- Left eye -->
        <circle cx="38" cy="40" r="12" fill="#fff" stroke="#94a3b8" stroke-width="3"/>
        <circle cx="38" cy="40" r="4" fill="#78350f"/>
        <!-- Right eye -->
        <circle cx="62" cy="40" r="12" fill="#fff" stroke="#94a3b8" stroke-width="3"/>
        <circle cx="62" cy="40" r="4" fill="#15803d"/>
        <!-- Goggle strap -->
        <rect x="5" y="36" width="90" height="8" rx="2" fill="#1e293b"/>
      `;
      mouth = `<path d="M 35 60 Q 50 75 65 60" stroke="#1e293b" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      break;

    case 'stuart':
      // One eye, flat hair, smirk
      eyes = `
        <!-- Goggle strap -->
        <rect x="5" y="36" width="90" height="8" rx="2" fill="#1e293b"/>
        <!-- One eye -->
        <circle cx="50" cy="40" r="15" fill="#fff" stroke="#94a3b8" stroke-width="4"/>
        <circle cx="50" cy="40" r="5" fill="#78350f"/>
      `;
      mouth = `<path d="M 40 60 Q 48 55 58 62" stroke="#1e293b" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      hair = `
        <path d="M 50 15 Q 35 5 20 18" stroke="#1e293b" stroke-width="2.5" fill="none"/>
        <path d="M 50 15 Q 65 5 80 18" stroke="#1e293b" stroke-width="2.5" fill="none"/>
      `;
      break;

    case 'kevin':
      // Tall, two eyes, sprout hair
      eyes = `
        <!-- Left eye -->
        <circle cx="39" cy="38" r="10" fill="#fff" stroke="#94a3b8" stroke-width="2.5"/>
        <circle cx="39" cy="38" r="3.5" fill="#78350f"/>
        <!-- Right eye -->
        <circle cx="61" cy="38" r="10" fill="#fff" stroke="#94a3b8" stroke-width="2.5"/>
        <circle cx="61" cy="38" r="3.5" fill="#78350f"/>
        <!-- Goggle strap -->
        <rect x="5" y="34" width="90" height="8" rx="2" fill="#1e293b"/>
      `;
      mouth = `<path d="M 38 58 Q 50 68 62 58" stroke="#1e293b" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      hair = `
        <path d="M 50 15 Q 50 2 52 2" stroke="#1e293b" stroke-width="3" fill="none"/>
        <path d="M 48 15 Q 45 3 43 4" stroke="#1e293b" stroke-width="2.5" fill="none"/>
        <path d="M 52 15 Q 55 3 57 4" stroke="#1e293b" stroke-width="2.5" fill="none"/>
      `;
      break;

    case 'kingbob':
      // Crown on top of Bob
      eyes = `
        <!-- Left eye -->
        <circle cx="38" cy="42" r="11" fill="#fff" stroke="#94a3b8" stroke-width="3"/>
        <circle cx="38" cy="42" r="3.5" fill="#78350f"/>
        <!-- Right eye -->
        <circle cx="62" cy="42" r="11" fill="#fff" stroke="#94a3b8" stroke-width="3"/>
        <circle cx="62" cy="42" r="3.5" fill="#15803d"/>
        <!-- Goggle strap -->
        <rect x="5" y="38" width="90" height="8" rx="2" fill="#1e293b"/>
      `;
      mouth = `<path d="M 35 62 Q 50 74 65 62" stroke="#1e293b" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      extraDecoration = `
        <!-- Crown -->
        <path d="M 25 22 L 30 5 L 42 14 L 50 2 L 58 14 L 70 5 L 75 22 Z" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
        <circle cx="30" cy="4" r="2.5" fill="#ef4444"/>
        <circle cx="50" cy="1.5" r="3.5" fill="#3b82f6"/>
        <circle cx="70" cy="4" r="2.5" fill="#ef4444"/>
        <!-- Crown jewels -->
        <rect x="35" y="16" width="6" height="4" rx="1" fill="#ef4444"/>
        <rect x="59" y="16" width="6" height="4" rx="1" fill="#10b981"/>
      `;
      break;

    case 'evil':
      // Purple body, crazy teeth, wild hair
      bodyColor = '#a855f7'; // Purple
      overallColor = '#1e1b4b'; // Dark blue/indigo overalls
      eyes = `
        <!-- Goggle strap -->
        <rect x="5" y="36" width="90" height="10" rx="2" fill="#0f172a"/>
        <!-- One big eye -->
        <circle cx="50" cy="40" r="16" fill="#fecdd3" stroke="#475569" stroke-width="4"/>
        <circle cx="50" cy="40" r="6" fill="#991b1b"/>
      `;
      mouth = `
        <!-- Angry mouth with underbite teeth -->
        <path d="M 35 65 Q 50 55 65 65" stroke="#0f172a" stroke-width="4.5" fill="none"/>
        <path d="M 40 63 L 42 57 L 44 63 Z" fill="#fff" stroke="#0f172a"/>
        <path d="M 46 62 L 49 55 L 52 62 Z" fill="#fff" stroke="#0f172a"/>
        <path d="M 54 63 L 57 57 L 60 63 Z" fill="#fff" stroke="#0f172a"/>
      `;
      hair = `
        <!-- Crazy wild purple hair -->
        <path d="M 50 15 Q 60 -10 75 0" stroke="#a855f7" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M 45 15 Q 30 -5 15 10" stroke="#a855f7" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path d="M 52 15 Q 48 -15 35 -5" stroke="#a855f7" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M 55 15 Q 70 -12 58 -10" stroke="#a855f7" stroke-width="4" fill="none" stroke-linecap="round"/>
      `;
      break;

    case 'mel':
      // Flat comb hair, half-closed eyes, determined smile
      eyes = `
        <!-- Left eye -->
        <circle cx="39" cy="40" r="11" fill="#fff" stroke="#94a3b8" stroke-width="2.5"/>
        <path d="M 29 34 L 49 37" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
        <circle cx="39" cy="40" r="3.5" fill="#78350f"/>
        <!-- Right eye -->
        <circle cx="61" cy="40" r="11" fill="#fff" stroke="#94a3b8" stroke-width="2.5"/>
        <path d="M 71 34 L 51 37" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
        <circle cx="61" cy="40" r="3.5" fill="#78350f"/>
        <!-- Goggle strap -->
        <rect x="5" y="36" width="90" height="8" rx="2" fill="#1e293b"/>
      `;
      mouth = `<path d="M 38 60 Q 50 66 62 60" stroke="#1e293b" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      hair = `
        <!-- Flat parted hair -->
        <path d="M 50 15 C 45 12 35 12 30 15" stroke="#1e293b" stroke-width="2" fill="none"/>
        <path d="M 50 15 C 55 12 65 12 70 15" stroke="#1e293b" stroke-width="2" fill="none"/>
        <path d="M 50 15 C 45 10 32 10 25 15" stroke="#1e293b" stroke-width="2" fill="none"/>
        <path d="M 50 15 C 55 10 68 10 75 15" stroke="#1e293b" stroke-width="2" fill="none"/>
      `;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <!-- Background Circle -->
    <circle cx="50" cy="50" r="48" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
    
    <!-- Body -->
    <rect x="25" y="22" width="50" height="52" rx="25" fill="${bodyColor}"/>
    
    <!-- Overalls -->
    <path d="M 25 55 L 75 55 L 75 72 C 75 73.5 73.5 74 72 74 L 28 74 C 26.5 74 25 73.5 25 72 Z" fill="${overallColor}"/>
    <!-- Strap Left -->
    <path d="M 25 50 L 37 55 L 34 58 L 25 52 Z" fill="${overallColor}"/>
    <!-- Strap Right -->
    <path d="M 75 50 L 63 55 L 66 58 L 75 52 Z" fill="${overallColor}"/>
    
    <!-- Hair -->
    ${hair}
    
    <!-- Eyes / Goggles -->
    ${eyes}
    
    <!-- Mouth -->
    ${mouth}

    <!-- Extra Decorations (Crown, etc.) -->
    ${extraDecoration}
  </svg>`;
}

const minionTypes = ['bob', 'stuart', 'kevin', 'kingbob', 'evil', 'mel'];

minionTypes.forEach(type => {
  const content = getMinionSVG(type);
  const filePath = path.join(destDir, `minion_${type}.svg`);
  fs.writeFileSync(filePath, content);
  console.log(`Generated minion_${type}.svg`);
});
