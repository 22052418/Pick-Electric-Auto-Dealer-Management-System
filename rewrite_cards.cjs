const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

const s1 = c.indexOf('function ModelCard(');
const e1 = c.indexOf('function GroupedModelCard(');

const newModelCard = `function ModelCard({ model, parts, onEdit, onDelete, onViewDetails }: { key?: string | number; model: VehicleModelSpec, parts: Part[], onEdit: (m: VehicleModelSpec) => void, onDelete: (id: string) => void, onViewDetails: () => void }) {
  const uniqueComponents = model.bom.length;
  const totalPartsQuantity = model.bom.reduce((sum, item) => {
    if (item.unit && item.unit !== 'Pieces') return sum + 1;
    return sum + item.quantity;
  }, 0);
  
  return (
      <div className="bg-white border border-slate-300 p-2 flex flex-col group hover:bg-slate-50 transition-colors relative shadow-sm">
        <div 
          className="flex flex-col cursor-pointer"
          onClick={onViewDetails}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2">
               <div className="w-6 h-6 bg-slate-50 border border-slate-300 rounded-[2px] flex items-center justify-center shrink-0 text-[#006699]">
                 <Package className="w-3.5 h-3.5" />
               </div>
               <div className="pr-14">
                 <h3 className="text-[12px] font-bold text-[#006699] uppercase tracking-wide flex items-center flex-wrap gap-y-1 leading-tight mt-0.5">
                   {model.name} 
                   {model.color && (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-white px-1 py-0.5 ml-2 border border-slate-300 shadow-sm" style={{ color: model.color }}>
                        <span 
                          className="w-1.5 h-1.5 border border-slate-300" 
                          style={{ backgroundColor: model.color }} 
                        />
                        {model.color}
                      </span>
                    )}
                 </h3>
                 {model.description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 font-medium">{model.description}</p>}
               </div>
            </div>
            <div className="flex items-center gap-1 absolute top-2 right-2">
               <button
                 onClick={(e) => { e.stopPropagation(); onEdit(model); }}
                 className="p-1 text-slate-700 bg-[#e0e0e0] border border-slate-400 hover:bg-[#d0d0d0] transition-colors shadow-sm"
                 title="Edit Model"
               >
                 <Edit2 className="w-3 h-3" />
               </button>
               <button
                 onClick={(e) => { e.stopPropagation(); onDelete(model.id); }}
                 className="p-1 text-slate-700 bg-[#e0e0e0] border border-slate-400 hover:bg-[#d0d0d0] transition-colors shadow-sm"
                 title="Delete Model"
               >
                 <Trash2 className="w-3 h-3 text-rose-600" />
               </button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2 border-t border-slate-200 pt-2">
             <div className="text-[10px] text-slate-500 font-medium">
               <span className="font-bold text-slate-700">{totalPartsQuantity}</span> Qty
             </div>
             <div className="w-[1px] h-3 bg-slate-300"></div>
             <div className="text-[10px] text-slate-500 font-medium">
               <span className="font-bold text-slate-700">{uniqueComponents}</span> Unique
             </div>
          </div>
        </div>
      </div>
  );
}
`;

c = c.substring(0, s1) + newModelCard + c.substring(e1);

const s2 = c.indexOf('function GroupedModelCard(');
const e2 = c.indexOf('return (', c.indexOf('function GroupedModelCard(') + 30) + 400; // rough slice

const newGroupCode = `function GroupedModelCard({ modelName, variants, onClick }: { modelName: string, variants: VehicleModelSpec[], onClick: () => void }) {
    const totalParts = variants.reduce((acc, v) => acc + v.bom.length, 0);
    return (
      <div className="bg-white border border-slate-300 p-2 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm" onClick={onClick}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-50 border border-slate-300 rounded-[2px] flex items-center justify-center shrink-0 text-slate-500">
            <Package className="w-4 h-4 text-[#006699]" />
          </div>
          <div>
            <h3 className="text-[12px] font-bold text-[#006699] uppercase tracking-wide leading-tight">{modelName}</h3>
            <p className="text-[10px] text-slate-500 font-medium">{variants.length} Variant{variants.length !== 1 ? 's' : ''} &bull; {totalParts} total parts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
`;

c = c.substring(0, s2) + newGroupCode + c.substring(c.indexOf('return (', c.indexOf('function GroupedModelCard(') + 30) + 10);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
