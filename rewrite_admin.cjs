const fs = require('fs');

let c = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

c = c.replace(/bg-white\/60 backdrop-blur-[^ ]+/g, 'bg-white');
c = c.replace(/transition-all shadow-sm hover:shadow/g, 'transition-colors shadow-sm');
c = c.replace(/animate-in zoom-in-95 duration-200/g, '');
c = c.replace(/animate-in slide-in-from-bottom-4 duration-300/g, '');
c = c.replace(/transform transition-all/g, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', c, 'utf8');
