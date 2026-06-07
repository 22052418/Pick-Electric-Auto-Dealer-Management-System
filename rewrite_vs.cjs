const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/text-2xl font-extrabold text-slate-900 tracking-tight/g, 'text-lg font-bold text-[#006699] uppercase tracking-wide');
c = c.replace(/text-slate-500 mt-1 mb-6/g, 'text-slate-500 mt-1');
c = c.replace(/space-y-6 max-w-7xl mx-auto/g, 'space-y-6 font-sans');
c = c.replace(/<div className="flex flex-col sm:flex-row justify-between sm:items-center">/g, '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300 pb-2">');

c = c.replace(/bg-white rounded-sm shadow-sm overflow-hidden border border-slate-300/g, 'bg-[#f0f0f0] p-3 border border-slate-300 relative');
c = c.replace(/bg-white rounded-sm shadow-sm border border-slate-300 p-6/g, 'bg-[#f0f0f0] p-3 border border-slate-300 relative');

// Model selection area and inputs
c = c.replace(/bg-slate-50 border border-slate-300 rounded-sm/g, 'bg-white border border-slate-300 rounded-sm');
c = c.replace(/bg-white border border-slate-300 p-4 rounded-sm/g, 'bg-[#f8f8f8] p-3 border border-slate-300 relative');

c = c.replace(/px-4 py-2/g, 'px-2 py-1 text-[13px]');
c = c.replace(/px-3 py-2/g, 'px-2 py-1 text-[13px]');
c = c.replace(/px-6 py-4/g, 'px-2 py-1 border-r border-slate-300 last:border-r-0');
c = c.replace(/px-4 py-3/g, 'px-2 py-1 border-r border-slate-300 last:border-r-0');

c = c.replace(/bg-blue-600/g, 'bg-[#3b5998]');
c = c.replace(/hover:bg-blue-700/g, 'hover:bg-[#2d4373]');
c = c.replace(/text-blue-600/g, 'text-[#006699]');

// Buttons
const btnPrimary = 'className="px-3 py-1 h-[28px] font-sans text-[13px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] transition-colors shadow-sm whitespace-nowrap mb-0.5 flex items-center gap-1.5"';
const btnSecondary = 'className="px-4 py-1 h-[28px] font-sans text-[13px] bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors shadow-sm ml-2"';

c = c.replace(/className="bg-\[#3b5998\] hover:bg-\[#2d4373\] text-white px-2 py-1 text-\[13px\] rounded-sm font-medium transition-all shadow-sm flex items-center gap-2"/g, btnPrimary);
c = c.replace(/className="bg-\[#3b5998\] text-white px-2 py-1 text-\[13px\] rounded-sm font-medium hover:bg-\[#2d4373\] transition-colors shadow-sm flex items-center gap-2"/g, btnPrimary);
c = c.replace(/className="bg-\[#3b5998\] hover:bg-\[#2d4373\] text-white px-2 py-1 text-\[13px\] rounded-sm font-medium transition-all shadow-sm hover:shadow-md"/g, btnPrimary);
c = c.replace(/className="bg-slate-100 text-slate-700 px-2 py-1 text-\[13px\] rounded-sm font-medium hover:bg-slate-200 transition-colors border border-slate-300"/g, btnSecondary);


// Headers for tables
c = c.replace(/bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-300/g, 'bg-[#ececec] border-b border-slate-300 text-slate-600 font-bold uppercase text-[11px]');
c = c.replace(/bg-slate-50\/80 text-slate-500 uppercase text-xs font-semibold whitespace-nowrap tracking-wider/g, 'bg-[#ececec] border-b border-slate-300 text-slate-600 font-bold uppercase text-[11px]');
c = c.replace(/bg-slate-50\/80 text-slate-500 uppercase text-\[11px\] font-semibold whitespace-nowrap tracking-wider/g, 'bg-[#ececec] border-b border-slate-300 text-slate-600 font-bold uppercase text-[11px]');


c = c.replace(/text-slate-800 font-semibold mb-1 block/g, 'text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase block');
c = c.replace(/block text-sm font-medium text-slate-700 mb-1/g, 'text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase block');
c = c.replace(/block text-[#cc0000]/g, 'text-[#cc0000]'); // if already updated

// Remove shadows and roundings
c = c.replace(/rounded-xl/g, 'rounded-sm');
c = c.replace(/rounded-2xl/g, 'rounded-sm');
c = c.replace(/rounded-lg/g, 'rounded-sm');
c = c.replace(/rounded-md/g, 'rounded-sm');
c = c.replace(/shadow-xl/g, 'shadow-md');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
