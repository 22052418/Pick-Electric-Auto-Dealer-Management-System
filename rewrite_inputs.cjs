const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Make inputs consistent across files
    content = content.replace(/px-4 py-2 border border-slate-300 rounded-sm/g, 'px-2 py-1 text-[13px] border border-slate-300 rounded-sm bg-white');
    content = content.replace(/px-3 py-2 border border-slate-300 rounded-sm/g, 'px-2 py-1 text-[13px] border border-slate-300 rounded-sm bg-white');
    content = content.replace(/px-4 py-3 border border-slate-300 rounded-sm/g, 'px-2 py-1 text-[13px] border border-slate-300 rounded-sm bg-white');
    content = content.replace(/border-slate-200/g, 'border-slate-300');
    content = content.replace(/focus:ring-2 focus:ring-[a-z]+-\d+/g, 'focus:border-blue-400 focus:outline-none');
    
    // Label
    content = content.replace(/block text-sm font-medium text-slate-700/g, 'text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase');
    content = content.replace(/text-slate-600 font-medium mb-1/g, 'text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'VehicleProduction.tsx');

files.forEach(file => {
    processFile(path.join(dir, file));
});
