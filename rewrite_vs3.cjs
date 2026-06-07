const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10"/g, 'className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"');
c = c.replace(/className="p-6 sm:p-8"/g, 'className=""');
c = c.replace(/text-sm font-semibold text-slate-700 mb-2/g, 'text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase block');
c = c.replace(/block text-sm font-medium text-slate-700 mb-2/g, 'text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase block');

c = c.replace(/className="w-full px-2 py-1 text-\[13px\]\.5 bg-slate-50\/50 border border-slate-300 rounded-sm focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400"/g, 'className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-white"');

c = c.replace(/className="w-full px-3 py-2 bg-slate-50\/50 border border-slate-300 rounded-sm focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400"/g, 'className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-white"');

c = c.replace(/font-medium text-slate-800 mb-2/g, 'text-[#006699] font-bold text-[13px] uppercase mb-2');
c = c.replace(/text-slate-500 font-medium pb-2 border-b border-slate-200 block mb-4/g, 'text-slate-500 font-medium pb-2 border-b border-slate-300 block mb-4');

c = c.replace(/p-6 bg-slate-50\/50 flex justify-end gap-3/g, 'flex justify-end gap-3 pt-4 border-t border-slate-300 mt-4');

c = c.replace(/px-6 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors/g, 'px-4 py-1 h-[28px] font-sans text-[13px] bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors shadow-sm');

c = c.replace(/px-6 py-2.5 text-sm font-semibold bg-\[#3b5998\] text-white hover:bg-\[#2d4373\] rounded-sm transition-all shadow-sm flex items-center gap-2/g, 'px-3 py-1 h-[28px] font-sans text-[13px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] transition-colors shadow-sm flex items-center gap-1.5');

c = c.replace(/w-12 h-12 bg-white rounded-sm shadow-sm flex items-center justify-center shrink-0 border border-slate-100/g, 'w-10 h-10 bg-white rounded-sm border border-slate-300 shadow-sm flex items-center justify-center shrink-0');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
