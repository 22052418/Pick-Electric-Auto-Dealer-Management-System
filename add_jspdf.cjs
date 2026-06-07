const fs = require('fs');
let lines = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

// The best way is to redefine VariantDetailsView by replacing the entire function VariantDetailsView
const oldVariantStart = "function VariantDetailsView({";
const oldVariantEnd = "  function GroupedModelCard";
const startIndex = lines.indexOf(oldVariantStart);
const endIndex = lines.indexOf(oldVariantEnd);

const newVariantCode = `import jsPDF from 'jspdf';
import 'jspdf-autotable';

function VariantDetailsView({ model, parts, onEdit, onDelete, onClose }: { model: VehicleModelSpec, parts: Part[], onEdit: (m: VehicleModelSpec) => void, onDelete: (id: string) => void, onClose: () => void }) {
  const uniqueComponents = model.bom.length;
  const totalPartsQuantity = model.bom.reduce((sum, item) => {
    if (item.unit && item.unit !== 'Pieces') return sum + 1;
    return sum + item.quantity;
  }, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(\`Model Name: \${model.name} \${model.color || ''}\`, 14, 20);
    
    doc.setFontSize(10);
    doc.text(\`Description: \${model.description || 'N/A'}\`, 14, 28);
    doc.text(\`Total Parts: \${totalPartsQuantity}\`, 14, 34);
    doc.text(\`Unique Components: \${uniqueComponents}\`, 14, 40);

    const tableData = model.bom.map((part, index) => {
       const pObj = parts.find(p => p.name === part.partName);
       return [
         (index + 1).toString(),
         part.partName,
         pObj?.partNumber || '-',
         \`\${part.quantity} \${part.unit || 'pcs'}\`
       ];
    });

    (doc as any).autoTable({
      startY: 50,
      head: [['#', 'Part Name', 'Part Number', 'Quantity']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 153] }
    });

    doc.save(\`Variant_\${model.name.replace(/\\s+/g, '_')}\${model.color ? '_' + model.color : ''}.pdf\`);
  };

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
          <button onClick={exportPDF} className="px-3 py-1 font-sans text-[13px] bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors shadow-sm flex items-center gap-1.5"><Download className="w-4 h-4"/> Export PDF</button>
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

lines = lines.substring(0, startIndex) + newVariantCode + lines.substring(endIndex);

// move the imports to the top
if (lines.includes("import jsPDF from 'jspdf';")) {
  lines = lines.replace(/import jsPDF from 'jspdf';\nimport 'jspdf-autotable';\n\n/, "");
  lines = "import jsPDF from 'jspdf';\nimport 'jspdf-autotable';\n" + lines;
}

fs.writeFileSync('src/components/VehicleSpecifications.tsx', lines, 'utf8');
