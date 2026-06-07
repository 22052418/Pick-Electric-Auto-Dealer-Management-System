const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/className="px-6 py-2.5 bg-slate-900 text-white rounded-sm text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:pointer-events-none"/g, 'className="px-3 py-1 font-sans text-[13px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] transition-colors shadow-sm disabled:opacity-50"');

c = c.replace(/className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50 transition-colors"/g, 'className="px-4 py-1 font-sans text-[13px] bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors shadow-sm"');

c = c.replace(/w-12 h-12 bg-white rounded-sm border border-slate-300 shadow-sm flex items-center justify-center shrink-0/g, 'w-10 h-10 bg-white rounded-sm border border-slate-300 shadow-sm flex items-center justify-center shrink-0');

c = c.replace(/p-3 bg-slate-900 shadow-sm rounded-sm text-white shrink-0/g, 'w-10 h-10 bg-white shadow-sm border border-slate-300 rounded-sm flex items-center justify-center shrink-0 text-slate-400');
c = c.replace(/p-2.5 bg-slate-900 shadow-sm rounded-sm text-white shrink-0/g, 'w-8 h-8 bg-white shadow-sm border border-slate-300 rounded-sm flex items-center justify-center shrink-0 text-slate-400');

c = c.replace(/border-slate-100/g, 'border-slate-300');
c = c.replace(/border-slate-200/g, 'border-slate-300');

c = c.replace(/text-\[13px\]\.5/g, 'text-[13px]');
c = c.replace(/bg-blue-50\/50/g, 'bg-slate-100');
c = c.replace(/border-blue-400 ring-1 ring-blue-400/g, 'border-slate-400');

c = c.replace(/text-lg font-bold text-slate-800 tracking-tight leading-tight/g, 'text-md font-bold text-[#006699] uppercase tracking-wide');
c = c.replace(/text-slate-500 font-medium pb-2 border-b/g, 'text-[#cc0000] text-[11px] font-medium pb-2 select-none uppercase block border-b');

c = c.replace(/text-sm font-semibold text-slate-500/g, 'text-[#cc0000] text-[11px] font-medium select-none uppercase');
c = c.replace(/text-base font-semibold/g, 'text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-[#e0e0e0] px-2 py-0.5 ml-2 border border-slate-300 rounded-sm');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
