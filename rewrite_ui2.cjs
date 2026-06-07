const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'VehicleProduction.tsx');

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Cards / Containers
    content = content.replace(/className="[^"]*bg-white[^"]*p-6[^"]*rounded-x[l|2xl|md][^"]*shadow-sm[^"]*"/g, 'className="bg-[#f0f0f0] p-4 border border-slate-300 mb-4"');
    content = content.replace(/className="[^"]*bg-white[^"]*p-4[^"]*rounded-xl[^"]*shadow-sm[^"]*"/g, 'className="bg-[#f0f0f0] p-3 border border-slate-300 mb-4"');
    content = content.replace(/className="[^"]*bg-white[^"]*rounded-\[16px\][^"]*shadow-\[var\(--shadow-sm\)\].*?"/g, 'className="border border-slate-300 mb-8"');
    content = content.replace(/className="[^"]*bg-white[^"]*rounded-xl[^"]*overflow-hidden[^"]*"/g, 'className="border border-slate-300 mb-8"');

    // Table Headers
    content = content.replace(/className="bg-slate-50\/80 text-slate-500 uppercase text-\[11px\] font-semibold whitespace-nowrap tracking-wider border-b border-slate-100"/g, 'className="bg-[#ececec] border-b border-slate-300 text-slate-600 font-bold uppercase text-[11px]"');
    content = content.replace(/className="bg-slate-50\/80 text-slate-500 uppercase text-xs font-semibold whitespace-nowrap tracking-wider border-b border-slate-100"/g, 'className="bg-[#ececec] border-b border-slate-300 text-slate-600 font-bold uppercase text-[11px]"');
    
    // Form Inputs
    content = content.replace(/className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/g, 'className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"');
    content = content.replace(/className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/g, 'className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"');
    content = content.replace(/className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/g, 'className="px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"');
    
    // Quick Fixes for remaining headers
    content = content.replace(/className="text-lg font-semibold text-slate-800 mt-8 mb-4"/g, 'className="text-lg font-bold text-[#006699] uppercase tracking-wide mt-6 mb-4"');
    content = content.replace(/className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1"/g, 'className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase"');

    // Action buttons inside lists/tables
    content = content.replace(/className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"/g, 'className="text-blue-600 hover:text-blue-800 transition-colors p-1"');
    content = content.replace(/className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"/g, 'className="text-red-500 hover:text-red-700 transition-colors p-1"');
    
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
});
