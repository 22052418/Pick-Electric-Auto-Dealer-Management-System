const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(
  /const \[isFormOpen, setIsFormOpen\] = useState\(false\);/g,
  "const [isFormOpen, setIsFormOpen] = useState(false);\n  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);"
);

c = c.replace(
  /const handleEdit = \(model: VehicleModelSpec\) => \{/g,
  `const handleEdit = (model: VehicleModelSpec) => {\n    setSelectedGroupName(null);`
);

let groupCode = `  const groupedModels = vehicleModels.reduce((acc, model) => {
    (acc[model.name] = acc[model.name] || []).push(model);
    return acc;
  }, {} as Record<string, VehicleModelSpec[]>);

  function GroupedModelCard({ modelName, variants, onClick }: { modelName: string, variants: VehicleModelSpec[], onClick: () => void }) {
    const totalParts = variants.reduce((acc, v) => acc + v.bom.length, 0);
    return (
      <div className="bg-[#f0f0f0] border border-slate-300 mb-4 p-4 cursor-pointer hover:bg-[#e8e8e8] transition-colors shadow-sm" onClick={onClick}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white shadow-sm border border-slate-300 rounded-sm flex items-center justify-center shrink-0 text-slate-400">
            <Package className="w-5 h-5 text-[#006699]" />
          </div>
          <div>
            <h3 className="text-md font-bold text-[#006699] uppercase tracking-wide">{modelName}</h3>
            <p className="text-[13px] text-slate-600 font-medium">{variants.length} Variant{variants.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    );
  }
`;

c = c.replace(
  /const uniqueParts = Array\.from\(new Set\(parts\.map\(p => p\.name\)\)\);/g,
  `const uniqueParts = Array.from(new Set(parts.map(p => p.name)));\n\n${groupCode}`
);

// Replace the vehicle models rendering
let renderBlockOld = `{!isFormOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicleModels.map(model => (
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

let renderBlockNew = `{!isFormOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedModels).map(([mName, vars]) => (
            <GroupedModelCard key={mName} modelName={mName} variants={vars} onClick={() => setSelectedGroupName(mName)} />
          ))}
        </div>
      )}

      {selectedGroupName && !isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-[#f0f0f0] border border-slate-400 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-md" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#dcdcdc] px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#006699] text-md uppercase tracking-wide">{selectedGroupName} - Variants</h3>
              </div>
              <button onClick={() => setSelectedGroupName(null)} className="p-1 px-2 text-[#cc0000] font-bold text-[13px] hover:bg-[#c8c8c8] border border-transparent hover:border-slate-400 transition-colors uppercase">
                <X className="w-4 h-4 inline-block -mt-0.5 mr-1"/> Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-white">
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
            </div>
          </div>
        </div>
      )}`;

c = c.replace(renderBlockOld, renderBlockNew);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
