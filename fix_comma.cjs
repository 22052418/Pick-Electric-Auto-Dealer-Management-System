const fs = require('fs');
let lines = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8').split('\n');

for (let i = 0; i < 25; i++) {
  if (lines[i].includes('  Cpu')) {
    lines[i] = lines[i].replace('  Cpu', '  Cpu,');
  }
}

fs.writeFileSync('src/components/VehicleSpecifications.tsx', lines.join('\n'), 'utf8');
