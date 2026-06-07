const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(
  /<div className="bg-\[#f0f0f0\] border border-slate-300 mb-4 p-4 cursor-pointer hover:bg-\[#e8e8e8\] transition-colors shadow-sm" onClick=\{onClick\}>/g,
  `<div className="bg-[#f0f0f0] border border-slate-300 p-4 cursor-pointer hover:bg-[#e8e8e8] transition-colors shadow-sm" onClick={onClick}>`
);

c = c.replace(
  /<div className="bg-\[#f0f0f0\] border border-slate-300 mb-4 p-4">/g,
  `<div className="bg-[#f0f0f0] border border-slate-300 p-4 h-full flex flex-col">`
);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
