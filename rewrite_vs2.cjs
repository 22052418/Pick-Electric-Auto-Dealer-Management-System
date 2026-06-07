const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden"/g, 'className="absolute z-10 w-full mt-1 bg-[#f0f0f0] border border-slate-300 rounded-sm shadow-sm overflow-hidden"');
c = c.replace(/bg-white rounded-sm border border-slate-300\/80 hover:border-slate-300 overflow-hidden shadow-sm hover:shadow transition-all group flex flex-col h-full/g, 'bg-[#f0f0f0] border border-slate-300 mb-4 p-4');
c = c.replace(/bg-white rounded-sm shadow-sm w-full max-w-2xl max-h-\[85vh\] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200/g, 'bg-white rounded-sm border border-slate-400 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-md');
c = c.replace(/bg-white rounded-sm shadow-sm w-full max-w-3xl max-h-\[85vh\] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200/g, 'bg-white rounded-sm border border-slate-400 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-md');

c = c.replace(/bg-white rounded-sm border border-slate-300\/60 shadow-sm overflow-hidden transition-all /g, 'bg-[#f0f0f0] border border-slate-300 mb-6 p-4 pt-1');

c = c.replace(/py-3 px-4 bg-white border border-slate-300\/80 rounded-sm hover:border-slate-300 transition-colors shadow-sm/g, 'bg-[#f8f8f8] py-1.5 px-3 border border-slate-300 shadow-sm rounded-sm');

c = c.replace(/p-5 border-b border-slate-100 bg-slate-50\/50 flex justify-between items-center/g, 'p-3 flex justify-between items-center mb-2');

c = c.replace(/bg-white rounded-sm border border-slate-300 p-12 text-center shadow-sm/g, 'bg-[#f0f0f0] border border-slate-300 p-12 text-center shadow-sm');
c = c.replace(/bg-white border-slate-300 hover:border-slate-300 hover:shadow/g, 'bg-[#f0f0f0] border-slate-400 shadow-sm hover:bg-[#e8e8e8]');

c = c.replace(/p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50\/50/g, 'bg-[#dcdcdc] px-3 py-1.5 border-b border-slate-300 flex justify-between items-center');

c = c.replace(/className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"/g, 'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"');
c = c.replace(/className="flex gap-4 p-5"/g, 'className="flex gap-4 p-0 mt-4 mb-2"');

c = c.replace(/shadow-blue-100/g, 'shadow-sm');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
