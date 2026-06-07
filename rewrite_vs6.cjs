const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/text-\[11px\] font-bold text-slate-600 uppercase tracking-wider bg-\[#e0e0e0\] px-2 py-0\.5 ml-2 border border-slate-300 rounded-sm text-slate-500 bg-slate-100 px-2 py-0\.5 rounded-sm ml-2 border border-slate-300/g, 'text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-[#e0e0e0] px-2 py-0.5 ml-2 border border-slate-300 rounded-sm');

const btnPrimary = 'px-3 py-1 font-sans text-[13px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] transition-colors shadow-sm disabled:opacity-50 text-center flex items-center justify-center h-[28px]';
const btnSecondary = 'px-4 py-1 h-[28px] font-sans text-[13px] bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors shadow-sm text-center flex items-center justify-center';

c = c.replace(/className="flex items-center px-2 py-1 text-\[13px\] bg-slate-900 text-white rounded-sm hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95 text-sm font-semibold"/g, `className="${btnPrimary}"`);
c = c.replace(/className="flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white rounded-sm hover:bg-slate-800 transition-all shadow-sm hover:shadow text-sm font-semibold w-full sm:w-auto"/g, `className="${btnPrimary} w-full sm:w-auto"`);
c = c.replace(/className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors w-full sm:w-auto text-center"/g, `className="${btnSecondary} w-full sm:w-auto"`);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
