const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

const start = c.indexOf('function ModelCard(');
const end = c.indexOf('function GroupedModelCard(');

const newModelCard = `function ModelCard({ model, parts, onEdit, onDelete, onViewDetails }: { key?: string | number; model: VehicleModelSpec, parts: Part[], onEdit: (m: VehicleModelSpec) => void, onDelete: (id: string) => void, onViewDetails: () => void }) {
  const uniqueComponents = model.bom.length;
  const totalPartsQuantity = model.bom.reduce((sum, item) => {
    if (item.unit && item.unit !== 'Pieces') return sum + 1;
    return sum + item.quantity;
  }, 0);
  
  return (
      <div className="bg-[#f0f0f0] border border-slate-300 p-3 h-full flex flex-col group hover:bg-[#e8e8e8] transition-all rounded-sm relative">
        <div 
          className="flex-1 cursor-pointer"
          onClick={onViewDetails}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
               <div className="w-8 h-8 bg-white shadow-sm border border-slate-300 rounded-sm flex items-center justify-center shrink-0 text-[#006699]">
                 <Package className="w-4 h-4" />
               </div>
               <div className="pr-16">
                 <h3 className="text-[14px] font-bold text-[#006699] uppercase tracking-wide flex items-center flex-wrap gap-y-1">
                   {model.name} 
                   {model.color && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white px-1.5 py-0.5 ml-2 border border-slate-300 rounded shadow-sm" style={{ color: model.color }}>
                        <span 
                          className="w-2 h-2 rounded-full shadow-inner border border-slate-300" 
                          style={{ backgroundColor: model.color }} 
                        />
                        {model.color}
                      </span>
                    )}
                 </h3>
                 {model.description && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">{model.description}</p>}
               </div>
            </div>
            <div className="flex items-center gap-1.5 absolute top-3 right-3">
               <button
                 onClick={(e) => { e.stopPropagation(); onEdit(model); }}
                 className="p-1.5 text-slate-300 bg-[#333333] border border-[#222222] hover:text-white hover:bg-[#111111] transition-colors shadow-sm rounded-sm"
                 title="Edit Model"
               >
                 <Edit2 className="w-3.5 h-3.5" />
               </button>
               <button
                 onClick={(e) => { e.stopPropagation(); onDelete(model.id); }}
                 className="p-1.5 text-rose-200 bg-[#333333] border border-[#222222] hover:text-rose-400 hover:bg-[#111111] transition-colors shadow-sm rounded-sm"
                 title="Delete Model"
               >
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
             <div className="bg-slate-50 rounded-sm p-2 border border-slate-200">
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                 Total Qty
               </div>
               <div className="text-sm font-black text-slate-700 tracking-tight">{totalPartsQuantity}</div>
             </div>
             
             <div className="bg-slate-50 rounded-sm p-2 border border-slate-200">
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                 Unique Parts
               </div>
               <div className="text-sm font-black text-slate-700 tracking-tight">{uniqueComponents}</div>
             </div>
          </div>
        </div>
      </div>
  );
}
`;

c = c.substring(0, start) + newModelCard + c.substring(end);
fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
