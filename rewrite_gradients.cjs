const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove any bg-gradient-to-... except if it's the #e4e4e4 one
    content = content.replace(/bg-gradient-to-\w\s+from-\w+-\d+\s+to-\w+-\d+/g, 'bg-[#3b5998] border border-[#3b5998] text-white hover:bg-[#2d4373]');
    // Also hover:from-sky-600 hover:to-blue-600
    content = content.replace(/hover:from-\w+-\d+\s+hover:to-\w+-\d+/g, '');
    
    // Check for ring and soft hover bounds
    content = content.replace(/hover:border-sky-500\/40/g, 'hover:border-slate-400');
    content = content.replace(/hover:border-sky-500\/30/g, 'hover:border-slate-400');
    content = content.replace(/border-sky-500\/10/g, 'border-slate-300');

    content = content.replace(/text-rose-500/g, 'text-[#cc0000]');

    // Strip animation and slide ins
    content = content.replace(/animate-in slide-in-from-[a-z]+-[0-9]+\s*(duration-[0-9]+)?/g, '');
    content = content.replace(/animate-in fade-in\s*(duration-[0-9]+)?/g, '');
    content = content.replace(/shadow-sm-sm/g, 'shadow-sm');

    fs.writeFileSync(filePath, content, 'utf8');
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'VehicleProduction.tsx');

files.forEach(file => {
    processFile(path.join(dir, file));
});
