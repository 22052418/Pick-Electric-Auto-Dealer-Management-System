const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/block text-\[#cc0000\]/g, 'text-[#cc0000]');
c = c.replace(/uppercase block/g, 'uppercase');
c = c.replace(/bg-slate-100 px-3 py-1 rounded-full/g, '');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
