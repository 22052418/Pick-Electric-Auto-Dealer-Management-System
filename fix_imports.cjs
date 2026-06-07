const fs = require('fs');
let lines = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8').split('\n');

// Find lucide imports and remove those bad imports
for (let i = 0; i < 15; i++) {
  if (lines[i] && lines[i].includes('ArrowLeft') && lines[i+1].includes('Download,')) {
    lines[i] = "";
    lines[i+1] = lines[i+1].replace('Download, ', ''); // remove Download,
  }
}

const lucideIndex = lines.findIndex(l => l.includes('from \'lucide-react\''));
if (lucideIndex !== -1) {
  lines.splice(lucideIndex, 0, "  ArrowLeft,", "  Download,");
}

fs.writeFileSync('src/components/VehicleSpecifications.tsx', lines.join('\n'), 'utf8');
