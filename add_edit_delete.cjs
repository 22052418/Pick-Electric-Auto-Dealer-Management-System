const fs = require('fs');
let lines = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

const regex = /(<div className="flex justify-between items-start">\s*<div className="flex items-start gap-4">[\s\S]*?<\/div>)\s*<\/div>/;

const replacement = `$1
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                 onClick={(e) => { e.stopPropagation(); onEdit(model); }}
                 className="p-2 text-slate-400 hover:text-[#006699] hover:bg-slate-100 rounded-sm transition-colors mr-1"
                 title="Edit Model"
               >
                 <Edit2 className="w-4 h-4" />
               </button>
               <button
                 onClick={(e) => { e.stopPropagation(); onDelete(model.id); }}
                 className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors"
                 title="Delete Model"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>`;

lines = lines.replace(regex, replacement);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', lines, 'utf8');
