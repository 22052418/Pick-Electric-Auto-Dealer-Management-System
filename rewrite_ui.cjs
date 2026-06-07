const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'VehicleProduction.tsx');

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Check if the file is truly a page that needs changes
    if (content.includes('bg-white')) {
      content = content.replace(/className="text-2xl font-bold font-sans text-slate-800 tracking-tight[^"]*"/g, 'className="text-lg font-bold text-[#006699] uppercase tracking-wide"');
      content = content.replace(/className="text-2xl font-bold text-slate-800 tracking-tight[^"]*"/g, 'className="text-lg font-bold text-[#006699] uppercase tracking-wide"');
      content = content.replace(/className="text-xl font-bold text-slate-800 tracking-tight[^"]*"/g, 'className="text-lg font-bold text-[#006699] uppercase tracking-wide"');
      
      content = content.replace(/className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex/g, 'className="flex');
      content = content.replace(/className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"/g, 'className="font-sans"');
      content = content.replace(/<div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">/g, '<div>');
      content = content.replace(/className="space-y-6"/g, 'className="space-y-6 font-sans"');

      content = content.replace(/className="w-full text-sm text-left"/g, 'className="w-full text-[12px] text-left border-collapse"');
      content = content.replace(/className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold"/g, 'className="bg-[#ececec] border-b border-slate-300 text-slate-600 font-bold uppercase"');
      content = content.replace(/className="px-4 py-3"/g, 'className="px-2 py-1 border-r border-slate-300 last:border-r-0"');
      content = content.replace(/className="px-6 py-4"/g, 'className="px-2 py-1 border-r border-slate-300 last:border-r-0"');
      content = content.replace(/className="divide-y divide-slate-100"/g, 'className="divide-y divide-slate-200"');
      content = content.replace(/className="hover:bg-slate-50 transition-colors"/g, 'className="hover:bg-slate-50"');
      
      content = content.replace(/className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"/g, 'className="px-2 py-0.5 h-[26px] font-sans text-[12px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] shadow-sm flex items-center gap-1.5"');
      content = content.replace(/className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 w-fit"/g, 'className="px-2 py-0.5 h-[26px] font-sans text-[12px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] shadow-sm flex items-center gap-1.5 w-fit"');
      content = content.replace(/className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"/g, 'className="px-3 py-1 font-sans text-[13px] bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] shadow-sm"');
      content = content.replace(/className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"/g, 'className="px-4 py-1 font-sans text-[13px] bg-[#3b5998] border border-[#3b5998] text-white hover:bg-[#2d4373] shadow-sm"');
      
      content = content.replace(/className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/g, 'className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"');
      content = content.replace(/className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-\[200px\]"/g, 'className="px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"');
      content = content.replace(/className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500[^"]*"/g, 'className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"');
      content = content.replace(/className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/g, 'className="px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"');

      content = content.replace(/className="block text-sm font-medium text-slate-700 mb-1"/g, 'className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase"');

      fs.writeFileSync(path.join(dir, file), content, 'utf8');
    }
});
