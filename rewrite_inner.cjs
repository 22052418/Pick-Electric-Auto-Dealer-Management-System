const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/className="p-5 border-b border-slate-300 flex justify-between items-start bg-slate-50\/50"/g, 'className="bg-[#dcdcdc] px-3 py-1.5 border-b border-slate-300 flex justify-between items-center"');

c = c.replace(/className="bg-white rounded-sm border border-slate-400 w-full max-w-3xl max-h-\[85vh\] flex flex-col overflow-hidden shadow-md" onClick=\{\(e\) => e.stopPropagation\(\)\}/g, 'className="bg-[#f0f0f0] border border-slate-400 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-md" onClick={(e) => e.stopPropagation()}');

c = c.replace(/className="flex-1 overflow-y-auto p-4 bg-slate-50\/30"/g, 'className="flex-1 overflow-y-auto p-4 bg-[#f8f8f8]"');

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
