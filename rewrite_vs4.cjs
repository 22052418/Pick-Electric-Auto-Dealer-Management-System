const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/text-lg font-bold text-slate-800 tracking-tight leading-tight/g, 'text-md font-bold text-[#006699] uppercase tracking-wide');
c = c.replace(/text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm ml-2 border border-slate-300/g, 'text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-[#e0e0e0] px-2 py-0.5 ml-2 border border-slate-300 rounded-sm');
c = c.replace(/text-sm text-slate-500 font-medium mt-1 leading-snug line-clamp-2/g, 'text-[13px] text-slate-600 mt-1 line-clamp-2');

c = c.replace(/bg-slate-50 border-t border-slate-100 p-4 mt-auto/g, 'bg-[#e8e8e8] border-t border-slate-300 p-3 mt-auto');

c = c.replace(/grid grid-cols-2 gap-4 mb-4/g, 'grid grid-cols-2 gap-3 mb-3');
c = c.replace(/bg-white p-3 rounded-sm border border-slate-200 shadow-sm/g, 'bg-white p-2 border border-slate-300');
c = c.replace(/text-xs font-semibold text-slate-500 mb-1 block/g, 'text-[#cc0000] text-[11px] mb-0.5 font-medium select-none uppercase block');
c = c.replace(/font-bold text-slate-800/g, 'font-bold text-[#006699]');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
