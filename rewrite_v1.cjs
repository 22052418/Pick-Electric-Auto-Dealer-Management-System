const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(/import {/, "import {\n  ArrowLeft,\n  Download,");

// Update top-level state
c = c.replace(
  /const \[selectedGroupName, setSelectedGroupName\] = useState<string \| null>\(null\);/g,
  "const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);\n  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);"
);

// handleEdit update
c = c.replace(
  /const handleEdit = \(model: VehicleModelSpec\) => \{/g,
  `const handleEdit = (model: VehicleModelSpec) => {\n    setSelectedVariantId(null);`
);

// handleCancelIntent update
c = c.replace(
  /const handleCancelIntent = \(\) => \{/g,
  `const handleCancelIntent = () => {\n    if (editingId) { setEditingId(null); setIsFormOpen(false); return; }`
);


// We define a new component VariantDetailsView
const variantDetailsCode = `
function VariantDetailsView({ model, parts, onEdit, onDelete, onClose }: { model: VehicleModelSpec, parts: Part[], onEdit: (m: VehicleModelSpec) => void, onDelete: (id: string) => void, onClose: () => void }) {
  const uniqueComponents = model.bom.length;
  const totalPartsQuantity = model.bom.reduce((sum, item) => {
    if (item.unit && item.unit !== 'Pieces') return sum + 1;
    return sum + item.quantity;
  }, 0);

  return (
    <div className="bg-[#f0f0f0] border border-slate-300 flex flex-col shadow-sm">
      <div className="bg-[#dcdcdc] px-4 py-2 border-b border-slate-300 flex justify-between items-center text-[13px] font-sans">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white shadow-sm border border-slate-300 rounded-sm flex items-center justify-center shrink-0 text-[#006699]">
            <Info className="w-4 h-4" />
          </div>
          <div>
             <h3 className="text-md font-bold text-[#006699] uppercase tracking-wide">
                {model.name} {model.color && <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-[#e0e0e0] px-2 py-0.5 ml-2 border border-slate-300 rounded-sm">{model.color}</span>}
             </h3>
             <p className="text-[11px] font-medium text-slate-500 mt-0.5">{totalPartsQuantity} Total Parts &bull; {uniqueComponents} Unique Components</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { onEdit(model); }} className="px-3 py-1 font-sans text-[13px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] transition-colors shadow-sm flex items-center gap-1.5"><Edit2 className="w-4 h-4"/> Edit</button>
          <button onClick={() => { window.print(); }} className="px-3 py-1 font-sans text-[13px] bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors shadow-sm flex items-center gap-1.5"><Download className="w-4 h-4"/> Export PDF</button>
          <button onClick={() => { onDelete(model.id); }} className="px-3 py-1 font-sans text-[13px] hover:bg-rose-100 bg-rose-50 text-rose-600 border border-slate-400 transition-colors shadow-sm flex items-center gap-1.5"><Trash2 className="w-4 h-4"/> Delete</button>
        </div>
      </div>
      <div className="overflow-y-auto p-4 bg-[#f8f8f8]">
         {model.bom.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-300 rounded-sm bg-white m-4">
              <p className="text-slate-500 font-medium">No parts configured for this model.</p>
            </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {model.bom.map((part, idx) => {
               const pObj = parts.find(p => p.name === part.partName);
               const pNum = pObj?.partNumber;
               return (
                  <div key={idx} className="flex justify-between items-center bg-white py-1.5 px-3 border border-slate-300 shadow-sm rounded-sm text-[13px] hover:bg-[#f0f0f0] transition-colors">
                      <div className="flex flex-1 items-center gap-3 shrink min-w-0 pr-4">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 h-8 w-8 flex items-center justify-center rounded-sm uppercase shrink-0 border border-slate-300">{idx + 1}</span>
                        <div className="min-w-0 flex flex-col justify-center">
                          <div className="font-bold text-[#006699] truncate">{part.partName}</div>
                          {pNum && <div className="text-[10px] font-mono text-slate-500 truncate">{pNum}</div>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-4 border-l border-slate-300 h-full justify-center">
                        <span className="font-black text-slate-700 text-base">{part.quantity} <span className="font-medium text-slate-400 text-[10px] ml-0.5">{part.unit || 'pcs'}</span></span>
                      </div>
                  </div>
               );
             })}
           </div>
         )}
      </div>
      {model.description && (
        <div className="bg-[#f0f0f0] p-4 text-[13px] border-t border-slate-300 text-slate-600">
           <span className="font-bold text-[#006699]">Description: </span>{model.description}
        </div>
      )}
    </div>
  );
}
`;

c = c.replace(/function GroupedModelCard/g, variantDetailsCode + "\n  function GroupedModelCard");

// Fix ModelCard implementation
// Let's replace the whole ModelCard completely:
const startIndex = c.indexOf('function ModelCard(');
const endIndex = c.indexOf('function GroupedModelCard('); 

const newModelCard = `function ModelCard({ model, parts, onEdit, onDelete, onViewDetails }: { key?: string | number; model: VehicleModelSpec, parts: Part[], onEdit: (m: VehicleModelSpec) => void, onDelete: (id: string) => void, onViewDetails: () => void }) {
  const uniqueComponents = model.bom.length;
  const totalPartsQuantity = model.bom.reduce((sum, item) => {
    if (item.unit && item.unit !== 'Pieces') return sum + 1;
    return sum + item.quantity;
  }, 0);
  
  return (
      <div className="bg-[#f0f0f0] border border-slate-300 p-4 h-full flex flex-col group">
        <div 
          className="p-5 flex-1 cursor-pointer transition-colors hover:bg-slate-50/50 -m-4 mb-0"
          onClick={onViewDetails}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
               <div className="w-8 h-8 bg-white shadow-sm border border-slate-300 rounded-sm flex items-center justify-center shrink-0 text-slate-400">
                 <Info className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-md font-bold text-[#006699] uppercase tracking-wide">
                   {model.name} {model.color && <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-[#e0e0e0] px-2 py-0.5 ml-2 border border-slate-300 rounded-sm">{model.color}</span>}
                 </h3>
                 {model.description && <p className="text-[13px] text-slate-600 mt-1 line-clamp-2">{model.description}</p>}
               </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
             <div className="bg-slate-50 rounded-sm p-3 border border-slate-300">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                 <Package className="w-3.5 h-3.5" /> Total Qty
               </div>
               <div className="text-lg font-black text-slate-800 tracking-tight">{totalPartsQuantity}</div>
             </div>
             
             <div className="bg-slate-50 rounded-sm p-3 border border-slate-300">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                 <Cpu className="w-3.5 h-3.5" /> Unique Parts
               </div>
               <div className="text-lg font-black text-slate-800 tracking-tight">{uniqueComponents}</div>
             </div>
          </div>
        </div>
      </div>
  );
}
`;

c = c.substring(0, startIndex) + newModelCard + c.substring(endIndex);


const oldHeader = `<div className="space-y-6 font-sans w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300 pb-2">
        <h2 className="text-lg font-bold text-[#006699] uppercase tracking-wide">
          {selectedGroupName && !isFormOpen ? \`Model Variants - \${selectedGroupName}\` : 'Vehicle Models & BOM'}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          {selectedGroupName && !isFormOpen && (
            <button
               onClick={() => setSelectedGroupName(null)}
               className="px-4 py-1 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors text-[13px] font-medium"
            >
              Back to Models
            </button>
          )}
          {!isFormOpen && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-1 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors text-[13px] font-medium"
            >
              Add New Model
            </button>
          )}
        </div>
      </div>`;

const newHeader = `<div className="space-y-6 font-sans w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300 pb-2">
        <div className="flex items-center gap-3">
           {selectedGroupName && !isFormOpen && !selectedVariantId && (
            <button onClick={() => setSelectedGroupName(null)} className="p-1 hover:bg-[#e0e0e0] text-slate-600 rounded-sm transition-colors border border-transparent hover:border-slate-400" title="Back to Models">
              <ArrowLeft className="w-5 h-5" />
            </button>
           )}
           {selectedVariantId && !isFormOpen && (
            <button onClick={() => setSelectedVariantId(null)} className="p-1 hover:bg-[#e0e0e0] text-slate-600 rounded-sm transition-colors border border-transparent hover:border-slate-400" title="Back to Variants">
              <ArrowLeft className="w-5 h-5" />
            </button>
           )}
           <h2 className="text-lg font-bold text-[#006699] uppercase tracking-wide">
             {selectedVariantId && !isFormOpen ? 'Variant Details'
              : selectedGroupName && !isFormOpen ? \`Model Variants - \${selectedGroupName}\` 
              : 'Vehicle Models & BOM'}
           </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          {!isFormOpen && !selectedVariantId && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-1 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors text-[13px] font-medium hidden sm:block"
            >
              Add New Model
            </button>
          )}
          {selectedVariantId && !isFormOpen && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-1 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors text-[13px] font-medium hidden sm:block"
            >
              Add Another Variant
            </button>
          )}
        </div>
      </div>`;

c = c.replace(oldHeader, newHeader);


const oldList = `{!isFormOpen && !selectedGroupName && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedModels).map(([mName, vars]) => (
            <GroupedModelCard key={mName} modelName={mName} variants={vars} onClick={() => setSelectedGroupName(mName)} />
          ))}
        </div>
      )}

      {!isFormOpen && selectedGroupName && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groupedModels[selectedGroupName]?.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              parts={parts}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}`;

const newList = `{!isFormOpen && !selectedGroupName && !selectedVariantId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedModels).map(([mName, vars]) => (
            <GroupedModelCard key={mName} modelName={mName} variants={vars} onClick={() => setSelectedGroupName(mName)} />
          ))}
        </div>
      )}

      {!isFormOpen && selectedGroupName && !selectedVariantId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groupedModels[selectedGroupName]?.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              parts={parts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={() => setSelectedVariantId(model.id)}
            />
          ))}
        </div>
      )}

      {!isFormOpen && selectedVariantId && (
         <VariantDetailsView
            model={vehicleModels.find(m => m.id === selectedVariantId)!}
            parts={parts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClose={() => setSelectedVariantId(null)}
         />
      )}`;

c = c.replace(oldList, newList);

const oldEmpty = `{!isFormOpen && !selectedGroupName && vehicleModels.length === 0 && (`;
const newEmpty = `{!isFormOpen && !selectedGroupName && !selectedVariantId && vehicleModels.length === 0 && (`;
c = c.replace(oldEmpty, newEmpty);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
