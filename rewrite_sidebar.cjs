const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Replace backgrounds
content = content.replace(/bg-white\/70 backdrop-blur-2xl text-slate-800 transform transition-transform duration-300 ease-in-out border-r border-green-500\/15.*lg:shadow-none/g, "bg-[#dcdcdc] text-slate-800 transform transition-transform duration-300 ease-in-out border-r border-slate-300 lg:translate-x-0 lg:static lg:inset-auto lg:h-full lg:flex lg:flex-col shadow-none");
content = content.replace(/border-b border-green-500\/10 bg-white\/50 backdrop-blur-sm/g, "border-b border-slate-300 bg-[#ececec]");
content = content.replace(/text-slate-400 hover:text-green-600 hover:bg-green-50/g, "text-slate-500 hover:text-slate-800 hover:bg-slate-200");
content = content.replace(/bg-green-400 mr-2 shadow-\[0_0_8px_rgba\(74,222,128,0\.8\)\]/g, "bg-[#006699] mr-2");

// Active state and inactive state for buttons
content = content.replace(/'bg-gradient-to-r from-green-500.*'/g, "'bg-[#006699] text-white shadow-none'");
content = content.replace(/'text-slate-500 hover:bg-white\/60 hover:text-green-700 border border-transparent hover:border-green-500\/10'/g, "'text-slate-600 hover:bg-[#c8c8c8] text-slate-800 border border-transparent'");
content = content.replace(/'bg-white\/20 text-white' : 'text-slate-400 group-hover:text-green-500 group-hover:bg-green-50\/50'/g, "'text-white' : 'text-slate-500 group-hover:text-[#006699]'");

// For Admin item
content = content.replace(/text-amber-[0-9]+/g, 'text-slate-600');
content = content.replace(/'bg-gradient-to-r from-amber[0-9\-a-z ]+.*'/g, "'bg-[#006699] text-white shadow-none'");
content = content.replace(/bg-amber-500[\/0-9 ]+.*'/g, "'bg-transparent text-slate-600'");

fs.writeFileSync('src/components/Sidebar.tsx', content, 'utf8');
