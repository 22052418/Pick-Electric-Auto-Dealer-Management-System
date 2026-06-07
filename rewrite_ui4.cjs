const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/focus:ring-2 focus:ring-[a-z]+-\d+/g, 'focus:border-blue-400');
    content = content.replace(/px-3 py-2/g, 'px-2 py-1 text-[13px]');
    content = content.replace(/bg-white shadow-sm/g, 'bg-white');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'VehicleProduction.tsx');

files.forEach(file => {
    processFile(path.join(dir, file));
});
