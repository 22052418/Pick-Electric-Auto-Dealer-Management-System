const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Make all rounded-XXX into rounded-sm, EXCEPT for rounded-full (as these are usually dots or avatar circles)
    content = content.replace(/rounded-(xl|2xl|3xl|md|lg)/g, 'rounded-sm');
    content = content.replace(/rounded-\[.*?\]/g, 'rounded-sm');

    // We want the whole system to use exactly the same UI font, lines, boxes, colour, buttons...
    // The "standard" button class from VehicleProduction.tsx:
    // "px-3 py-1 font-sans text-[13px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] transition-colors shadow-sm"
    // Also "bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0]"
    
    // Let's replace button gradients and colorful buttons
    content = content.replace(/bg-blue-600 hover:bg-blue-700 text-white/g, 'bg-[#3b5998] border border-[#3b5998] text-white hover:bg-[#2d4373]');
    content = content.replace(/bg-indigo-600 hover:bg-indigo-700 text-white/g, 'bg-[#3b5998] border border-[#3b5998] text-white hover:bg-[#2d4373]');
    content = content.replace(/bg-emerald-600 hover:bg-emerald-700 text-white/g, 'bg-[#3b5998] border border-[#3b5998] text-white hover:bg-[#2d4373]');
    content = content.replace(/bg-rose-600 hover:bg-rose-700 text-white/g, 'bg-[#cc0000] border border-[#cc0000] text-white hover:bg-[#aa0000]');
    content = content.replace(/bg-red-600 hover:bg-red-700 text-white/g, 'bg-[#cc0000] border border-[#cc0000] text-white hover:bg-[#aa0000]');
    content = content.replace(/bg-gradient-to-r from-sky-500 to-blue-500 text-white/g, 'bg-[#3b5998] border border-[#3b5998] text-white hover:bg-[#2d4373]');
    content = content.replace(/bg-gradient-to-r from-green-500 to-emerald-400 text-white/g, 'bg-[#3b5998] border border-[#3b5998] text-white hover:bg-[#2d4373]');
    
    // Replace big shadows
    content = content.replace(/shadow-2xl/g, 'shadow-sm');
    content = content.replace(/shadow-lg/g, 'shadow-sm');
    content = content.replace(/shadow-xl/g, 'shadow-sm');
    content = content.replace(/shadow-\[.*?\]/g, 'shadow-sm');

    // Add font-sans globally
    // We already have some of it
    
    // Box borders and backgrounds
    content = content.replace(/bg-white\/60 backdrop-blur-xl/g, 'bg-[#f0f0f0]');
    content = content.replace(/bg-white\/50 backdrop-blur-sm/g, 'bg-[#f0f0f0]');
    content = content.replace(/bg-slate-50\/80/g, 'bg-[#ececec]');
    content = content.replace(/border-green-500\/15/g, 'border-slate-300');
    content = content.replace(/border-sky-500\/20/g, 'border-slate-300');

    // Section headers 
    content = content.replace(/<div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">/g, '<div className="bg-[#dcdcdc] px-3 py-1.5 border-b border-slate-300 flex justify-between items-center mb-4 gap-4">');

    fs.writeFileSync(filePath, content, 'utf8');
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'VehicleProduction.tsx');

files.forEach(file => {
    processFile(path.join(dir, file));
});
