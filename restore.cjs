const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');
const start = c.indexOf('import jsPDF from \'jspdf\';');
c = c.substring(0, start) + `
                    });
                  })()}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && !selectedGroupName && !selectedVariantId && vehicleModels.length === 0 && (
        <div className="bg-white border border-slate-300 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-sm flex items-center justify-center mx-auto mb-4 border border-slate-300">
             <Settings className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#006699] mb-2">No Vehicle Models</h3>
          <p className="text-slate-600 max-w-sm mx-auto mt-2">Create a vehicle model and define its BOM (Bill of Materials) to automate inventory deductions during production.</p>
        </div>
      )}

      {!isFormOpen && !selectedGroupName && !selectedVariantId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(groupedModels).map(([mName, vars]) => (
            <GroupedModelCard key={mName} modelName={mName} variants={vars} onClick={() => setSelectedGroupName(mName)} />
          ))}
        </div>
      )}

      {!isFormOpen && selectedGroupName && !selectedVariantId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
      )}

      <DeleteConfirmationModal
        isOpen={showCancelConfirm}
        title="Cancel Changes"
        message="Are you sure you want to cancel? Any unsaved changes will be lost."
        confirmText="Yes, Cancel"
        onConfirm={() => {
          setIsFormOpen(false);
          setShowCancelConfirm(false);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {showMultiPartSelector && (
        <MultiPartSelectorModal
          parts={parts}
          existingPartNames={formData.bom.map(b => b.partName).filter(Boolean)}
          onAdd={handleAddMultipleParts}
          onClose={() => setShowMultiPartSelector(false)}
        />
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
