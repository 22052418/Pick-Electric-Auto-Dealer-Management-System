const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleProduction.tsx', 'utf8');

c = c.replace(/bg-white p-3 rounded-xl border border-slate-200 shadow-sm/g, 'bg-[#f8f8f8] py-1.5 px-3 border border-slate-300 shadow-sm rounded-sm');
c = c.replace(/bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden/g, 'bg-white rounded-sm w-full max-w-2xl border border-slate-400 overflow-hidden shadow-md');
c = c.replace(/overflow-hidden rounded-xl border border-slate-200 shadow-sm/g, 'border border-slate-300');

fs.writeFileSync('src/components/VehicleProduction.tsx', c, 'utf8');
