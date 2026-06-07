import React, { useState } from 'react';
import { VehicleModelSpec, Part, BOMPart } from '../types';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { 
  Info, 
  Settings, 
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Wrench,
  ChevronDown,
  ChevronUp,
  Search,
  IndianRupee,
  Package,
  Cpu
} from 'lucide-react';

interface VehicleSpecificationsProps {
  vehicleModels: VehicleModelSpec[];
  parts: Part[];
  onAddModel: (model: Omit<VehicleModelSpec, 'id'>) => Promise<void> | void;
  onUpdateModel: (model: VehicleModelSpec) => Promise<void> | void;
  onDeleteModel: (id: string) => Promise<void> | void;
}

function SearchablePartSelect({ parts, value, onChange }: { parts: Part[], value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.partNumber && p.partNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedPart = parts.find(p => p.name === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white shadow-sm font-medium text-slate-800 cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedPart ? (
           <span className="truncate flex items-center gap-2">
             {selectedPart.partNumber && <span className="text-xs font-mono font-bold text-slate-400">{selectedPart.partNumber}</span>}
             {selectedPart.name}
           </span>
        ) : (
           <span className="text-slate-400">Select Part Component...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              autoFocus
              placeholder="Search part or number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-slate-300"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredParts.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">No parts found</div>
            ) : (
              filteredParts.map(p => (
                <div 
                  key={p.id} 
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 flex items-center gap-2 ${value === p.name ? 'bg-slate-50 font-semibold' : ''}`}
                  onClick={() => {
                    onChange(p.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                   {p.partNumber && <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{p.partNumber}</span>}
                   {p.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiPartSelectorModal({ 
  parts, 
  existingPartNames, 
  onAdd, 
  onClose 
}: { 
  parts: Part[], 
  existingPartNames: string[], 
  onAdd: (partNames: string[]) => void, 
  onClose: () => void 
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredParts = parts.filter(p => 
    !existingPartNames.includes(p.name) && 
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.partNumber && p.partNumber.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Select Parts to Add</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Select multiple components to add them to the BOM.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-4 border-b border-slate-100 bg-white">
           <div className="relative">
             <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               autoFocus 
               placeholder="Search part name or number..." 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400" 
             />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
           {filteredParts.length === 0 ? (
             <div className="py-12 text-center">
               <p className="text-slate-500 font-medium">No available parts found matching "{search}"</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {filteredParts.map(p => {
                 const isSel = selected.has(p.name);
                 return (
                   <div 
                     key={p.id} 
                     onClick={() => {
                       const newSel = new Set(selected);
                       if (isSel) newSel.delete(p.name);
                       else newSel.add(p.name);
                       setSelected(newSel);
                     }} 
                     className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-4 transition-all shadow-sm
                       ${isSel ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400 shadow-blue-100' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow'}`}
                   >
                     <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors
                       ${isSel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                        {isSel && <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M3 7.5L5.5 10L11 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                     </div>
                     <div className="flex flex-col min-w-0">
                       {p.partNumber && <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block w-fit mb-1 border border-blue-100">{p.partNumber}</span>}
                       <span className={`text-sm font-semibold truncate ${isSel ? 'text-blue-900' : 'text-slate-700'}`}>{p.name}</span>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
        <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{selected.size} part{selected.size !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button 
              onClick={() => { onAdd(Array.from(selected)); onClose(); }} 
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:pointer-events-none" 
              disabled={selected.size === 0}
            >
              Add Selected Parts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelCard({ model, parts, onEdit, onDelete }: { key?: string | number; model: VehicleModelSpec, parts: Part[], onEdit: (m: VehicleModelSpec) => void, onDelete: (id: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const uniqueComponents = model.bom.length;
  const totalPartsQuantity = model.bom.reduce((sum, item) => {
    if (item.unit && item.unit !== 'Pieces') {
      return sum + 1;
    }
    return sum + item.quantity;
  }, 0);
  
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 overflow-hidden shadow-sm hover:shadow transition-all group flex flex-col h-full">
        <div 
          className="p-5 flex-1 cursor-pointer transition-colors hover:bg-slate-50/50"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
               <div className="p-2.5 bg-slate-900 shadow-sm rounded-xl text-white shrink-0">
                 <Info className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
                   {model.name} {model.color && <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md ml-2 border border-slate-200">{model.color}</span>}
                 </h3>
                 {model.description && <p className="text-sm text-slate-500 font-medium mt-1 leading-snug line-clamp-2">{model.description}</p>}
               </div>
            </div>
            <div className="flex items-center gap-1">
               <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center mr-2">
                 <button
                   onClick={(e) => { e.stopPropagation(); onEdit(model); }}
                   className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                   title="Edit Model"
                 >
                   <Edit2 className="w-4 h-4" />
                 </button>
                 <button
                   onClick={(e) => { e.stopPropagation(); onDelete(model.id); }}
                   className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                   title="Delete Model"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
               <ChevronDown className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
             <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                 <Package className="w-3.5 h-3.5" /> Total Qty
               </div>
               <div className="text-lg font-black text-slate-800 tracking-tight">{totalPartsQuantity}</div>
             </div>
             
             <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                 <Cpu className="w-3.5 h-3.5" /> Unique Parts
               </div>
               <div className="text-lg font-black text-slate-800 tracking-tight">{uniqueComponents}</div>
             </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-900 shadow-sm rounded-xl text-white shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
                    {model.name} {model.color && <span className="text-base font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md ml-2 border border-slate-200">{model.color}</span>}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{totalPartsQuantity} Total Parts • {uniqueComponents} Unique Components</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
               {model.bom.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white m-4">
                    <p className="text-slate-500 font-medium">No parts configured for this model.</p>
                  </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {model.bom.map((part, idx) => {
                     const pObj = parts.find(p => p.name === part.partName);
                     const pNum = pObj?.partNumber;
                     return (
                        <div key={idx} className="flex justify-between items-center py-3 px-4 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors shadow-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 h-8 w-8 flex items-center justify-center rounded-lg uppercase shrink-0 border border-slate-200/50">{idx + 1}</span>
                            <div className="flex flex-col min-w-0">
                              {pNum && (
                                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100/50 w-max mb-1">{pNum}</span>
                              )}
                              <span className="text-sm font-bold text-slate-800 truncate leading-tight">{part.partName}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end shrink-0 pl-4 border-l border-slate-100 h-full justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Qty</span>
                            <span className="text-lg font-black text-slate-700 leading-none">
                              {part.quantity} <span className="text-xs font-semibold text-slate-500 ml-0.5">{part.unit || 'pcs'}</span>
                            </span>
                          </div>
                        </div>
                     );
                   })}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function VehicleSpecifications({
  vehicleModels,
  parts,
  onAddModel,
  onUpdateModel,
  onDeleteModel
}: VehicleSpecificationsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showMultiPartSelector, setShowMultiPartSelector] = useState(false);
  const [bomSearchQuery, setBomSearchQuery] = useState('');
  const [formData, setFormData] = useState<Omit<VehicleModelSpec, 'id'>>({
    name: '',
    color: '',
    description: '',
    bom: []
  });

  const hasUnsavedChanges = () => {
    if (!editingId) {
      return formData.name !== '' || formData.color !== '' || formData.description !== '' || formData.bom.length > 0;
    } else {
      const originalModel = vehicleModels.find(m => m.id === editingId);
      if (originalModel) {
        const currentData = { name: formData.name, color: formData.color, description: formData.description, bom: formData.bom };
        const originalData = { name: originalModel.name, color: originalModel.color || '', description: originalModel.description || '', bom: [...originalModel.bom] };
        return JSON.stringify(currentData) !== JSON.stringify(originalData);
      }
    }
    return false;
  };

  const handleCancelIntent = () => {
    if (hasUnsavedChanges()) {
      setShowCancelConfirm(true);
    } else {
      setIsFormOpen(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', color: '', description: '', bom: [] });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (model: VehicleModelSpec) => {
    setFormData({
      name: model.name,
      color: model.color || '',
      description: model.description || '',
      bom: [...model.bom]
    });
    setEditingId(model.id);
    setIsFormOpen(true);
  };

  const handleAddMultipleParts = (partNames: string[]) => {
    const newBom = [...formData.bom];
    partNames.forEach(pName => {
      if (!newBom.some(b => b.partName === pName)) {
        const selectedInvPart = parts.find(p => p.name === pName);
        newBom.push({ 
          partId: selectedInvPart ? selectedInvPart.id : '', 
          partName: pName, 
          quantity: 1 
        });
      }
    });
    setFormData(prev => ({ ...prev, bom: newBom }));
  };

  const handleBOMChange = (index: number, field: keyof BOMPart, value: any) => {
    const newBom = [...formData.bom];
    if (field === 'partName') {
      // Find the corresponding part in inventory to set its name properly
      const selectedInvPart = parts.find(p => p.name === value);
      newBom[index] = {
        ...newBom[index],
        partName: value,
        partId: selectedInvPart ? selectedInvPart.id : ''
      };
    } else {
      newBom[index] = { ...newBom[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, bom: newBom }));
  };

  const handleRemoveBOMPart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bom: prev.bom.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await onUpdateModel({ ...formData, id: editingId } as VehicleModelSpec);
      } else {
        await onAddModel(formData);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (deletingId) {
      await onDeleteModel(deletingId);
      setDeletingId(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  // Get unique part names for datalist / dropdown
  const uniqueParts = Array.from(new Set(parts.map(p => p.name)));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vehicle Models & BOM</h2>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">Manage model specifications and Bill of Materials to automate inventory deductions.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95 text-sm font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Model
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden transition-all animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Vehicle Model' : 'Create New Model'}</h3>
            <button onClick={handleCancelIntent} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Model Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. Pick E-Rickshaw Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Color</label>
                <input
                  type="text"
                  required
                  value={formData.color || ''}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. Blue"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Detailed specifications or variants"
                />
              </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-800">Bill of Materials (BOM)</h4>
                </div>
                <div className="flex items-center gap-3">
                  {formData.bom.length > 0 && (
                    <div className="relative hidden sm:block">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search parts in BOM..."
                        value={bomSearchQuery}
                        onChange={(e) => setBomSearchQuery(e.target.value)}
                        className="w-64 pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 font-medium text-slate-700 placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMultiPartSelector(true)}
                    className="flex items-center px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Parts
                  </button>
                </div>
              </div>

              {formData.bom.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-slate-500 font-medium">No parts defined in BOM.</p>
                  <p className="text-slate-400 text-sm mt-1">Add parts that will be deducted automatically from inventory.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.bom.length > 0 && <div className="sm:hidden relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search parts in BOM..."
                        value={bomSearchQuery}
                        onChange={(e) => setBomSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 font-medium text-slate-700 placeholder:text-slate-400 transition-all"
                      />
                  </div>}
                  {(() => {
                    const filteredBom = formData.bom.map((item, idx) => ({ item, originalIndex: idx })).filter(({ item }) => {
                       if (!bomSearchQuery) return true;
                       const q = bomSearchQuery.toLowerCase();
                       const matchedPart = parts.find(p => p.name === item.partName);
                       return (item.partName || '').toLowerCase().includes(q) || (matchedPart?.partNumber && matchedPart.partNumber.toLowerCase().includes(q));
                    });
                    
                    if (filteredBom.length === 0) {
                      return (
                        <div className="py-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                          <p className="text-slate-500 font-medium">No parts found matching "{bomSearchQuery}"</p>
                        </div>
                      );
                    }

                    return filteredBom.map(({ item: bomItem, originalIndex: idx }) => {
                      const matchedPart = parts.find(p => p.name === bomItem.partName);
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-colors group">
                        <div className="flex-1 w-full flex items-center gap-3">
                          <div className="bg-slate-100 text-slate-500 w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-bold shrink-0 shadow-sm border border-slate-200">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{bomItem.partName || 'Unknown Part'}</div>
                            {matchedPart?.partNumber && (
                              <div className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-1 w-max">
                                {matchedPart.partNumber}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-full sm:w-48 shrink-0">
                          <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">Qty & Unit</label>
                          <div className="flex gap-2">
                            <input
                              type="number" step="0.001"
                              required
                              min="0.001"
                              value={bomItem.quantity === 0 && Boolean((bomItem as any)._isEmpty) ? '' : bomItem.quantity}
                              onChange={(e) => {
                                 const val = e.target.value;
                                 const updated = [...formData.bom];
                                 if (val === '') {
                                   updated[idx] = { ...updated[idx], quantity: 0, _isEmpty: true } as any;
                                 } else {
                                   updated[idx] = { ...updated[idx], quantity: Number(val), _isEmpty: false } as any;
                                 }
                                 setFormData({ ...formData, bom: updated });
                              }}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 shadow-sm font-bold text-slate-800 text-sm"
                            />
                            <select
                              value={bomItem.unit || 'Pieces'}
                              onChange={(e) => {
                                 const updated = [...formData.bom];
                                 updated[idx] = { ...updated[idx], unit: e.target.value as any };
                                 setFormData({ ...formData, bom: updated });
                              }}
                              className="w-24 px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 bg-slate-50 text-xs font-medium"
                            >
                              <option value="Pieces">pcs</option>
                              <option value="Litres">L</option>
                              <option value="ML">ml</option>
                              <option value="KGs">kg</option>
                              <option value="Grams">g</option>
                            </select>
                          </div>
                        </div>
                        <div className="pt-5 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveBOMPart(idx)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors group-hover:text-slate-400"
                            title="Remove Part"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelIntent}
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors w-full sm:w-auto text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm hover:shadow text-sm font-semibold w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update Model' : 'Save Model'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && vehicleModels.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
             <Settings className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Vehicle Models</h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">Create a vehicle model and define its BOM (Bill of Materials) to automate inventory deductions during production.</p>
        </div>
      )}

      {!isFormOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      )}

      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Delete Model"
        message="Are you sure you want to delete this vehicle model specification? This will not affect existing vehicles or history, but cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this form. If you close now, your changes will be lost."
        confirmLabel="Discard Changes"
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
