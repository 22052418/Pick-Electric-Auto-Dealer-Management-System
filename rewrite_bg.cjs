const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/p-4 bg-white/g, 'p-4 bg-[#f8f8f8]');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
