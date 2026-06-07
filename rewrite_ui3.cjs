const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove all rounded-xl, rounded-lg, rounded-2xl, rounded-[16px], etc.
    content = content.replace(/rounded-xl/g, 'rounded-sm');
    content = content.replace(/rounded-lg/g, 'rounded-sm');
    content = content.replace(/rounded-2xl/g, 'rounded-sm');
    content = content.replace(/rounded-\[16px\]/g, 'rounded-sm');
    content = content.replace(/rounded-md/g, 'rounded-sm');
    
    // 2. Adjust common panel / card styles 
    // Usually they are bg-white border border-slate-200 shadow-sm
    content = content.replace(/bg-white border border-slate-200 shadow-sm/g, 'bg-[#f0f0f0] border border-slate-300');
    content = content.replace(/bg-white border border-slate-100 shadow-sm/g, 'bg-[#f0f0f0] border border-slate-300');
    content = content.replace(/bg-white p-4/g, 'bg-[#f0f0f0] p-3');
    content = content.replace(/bg-white p-6/g, 'bg-[#f0f0f0] p-4');
    
    // 3. Make the large tables border-slate-300 and remove shadow var
    content = content.replace(/border-\[var\(--color-border\)\]/g, 'border-slate-300');
    content = content.replace(/shadow-\[var\(--shadow-sm\)\]/g, 'shadow-sm');

    // 4. Any remaining label text for inputs
    content = content.replace(/text-slate-700 font-medium/g, 'text-[#cc0000] text-[11px] font-medium uppercase');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'VehicleProduction.tsx');

files.forEach(file => {
    processFile(path.join(dir, file));
});
