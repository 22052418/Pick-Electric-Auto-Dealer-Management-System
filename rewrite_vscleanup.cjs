const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/className="grid grid-cols-1 lg:grid-cols-2 gap-6"/g, 'className="grid grid-cols-1 lg:grid-cols-2 gap-4"');
c = c.replace(/className="p-1.5 bg-blue-50 text-\[#006699\] rounded-sm"/g, 'className="p-1 bg-[#3b5998] text-white border border-[#3b5998] rounded-sm"');
c = c.replace(/w-24 px-2 py-2 border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-slate-50 text-xs font-medium/g, 'w-24 px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-white ml-2');
c = c.replace(/text-slate-500 max-w-sm mx-auto font-medium/g, 'text-slate-600 max-w-sm mx-auto mt-2');
c = c.replace(/shadow-xl/g, 'shadow-md');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
