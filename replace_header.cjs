const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

const oldHeader = `<div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#006699] uppercase tracking-wide">Vehicle Models & BOM</h2>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">Manage model specifications and Bill of Materials to automate inventory deductions.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1 font-sans text-[13px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] transition-colors shadow-sm disabled:opacity-50 text-center flex items-center justify-center h-[28px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Model
          </button>
        )}
      </div>`;

const newHeader = `<div className="space-y-6 font-sans w-full">
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

c = c.replace(oldHeader, newHeader);

const oldList = `{!isFormOpen && (
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
            <div className="flex-1 overflow-y-auto p-4 bg-[#f8f8f8]">
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

const newList = `{!isFormOpen && !selectedGroupName && (
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

c = c.replace(oldList, newList);

const oldEmpty = `{!isFormOpen && vehicleModels.length === 0 && (`;
const newEmpty = `{!isFormOpen && !selectedGroupName && vehicleModels.length === 0 && (`;
c = c.replace(oldEmpty, newEmpty);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
