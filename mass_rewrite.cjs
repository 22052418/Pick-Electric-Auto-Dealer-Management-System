const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Dashboard Cards specific replacements
    content = content.replace(/bg-white\/60 backdrop-blur-xl rounded-\[20px\] border border-green-500\/15 p-6 shadow-\[0_10px_30px_rgba\(0,0,0,0\.03\)\] hover:shadow-\[0_12px_40px_rgba\(34,197,94,0\.12\)\] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group/g, 'bg-[#f0f0f0] p-4 border border-slate-300 shadow-sm transition-all sm:rounded-sm hover:bg-[#e8e8e8]');
    content = content.replace(/bg-white\/60 backdrop-blur-xl rounded-\[20px\] border border-green-500\/15 p-6 shadow-\[0_10px_30px_rgba\(0,0,0,0\.03\)\] transition-all duration-300 hover:shadow-\[0_12px_40px_rgba\(34,197,94,0\.08\)\]/g, 'bg-[#f0f0f0] p-4 border border-slate-300 shadow-sm sm:rounded-sm');
    content = content.replace(/absolute inset-0 bg-gradient-to-br from-green-300\/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none/g, '');
    
    // Select elements
    content = content.replace(/text-xs bg-white\/50 backdrop-blur-md border border-green-500\/20 rounded-sm px-3 py-1\.5 text-slate-700 hover:bg-white\/80 focus:outline-none focus:border-blue-400\/50 transition-all cursor-pointer shadow-sm/g, 'px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-white');

    // Title / Headers
    content = content.replace(/text-sm font-semibold text-slate-900 uppercase tracking-widest/g, 'text-lg font-bold text-[#006699] uppercase tracking-wide');
    content = content.replace(/text-xs font-semibold text-slate-500 uppercase tracking-widest/g, 'text-xs font-bold text-slate-600 uppercase tracking-wider');

    // Clean up ring classes
    content = content.replace(/ring-1 ring-inset ring-white\/50 group-hover:scale-105 transition-transform duration-300 shadow-sm backdrop-blur-md/g, 'shadow-sm border border-slate-200');

    fs.writeFileSync(filePath, content, 'utf8');
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'VehicleProduction.tsx');

files.forEach(file => {
    processFile(path.join(dir, file));
});
