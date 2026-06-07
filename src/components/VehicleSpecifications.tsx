import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, Trash2, Edit2, ArrowLeft, Info, Download, Settings, Wrench, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VehicleModelSpec, Part } from '../types';

function DeleteConfirmationModal({ isOpen, title, message, confirmText, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, confirmText: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-lg max-w-sm w-full p-5 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-slate-600 text-sm">{message}</p>
        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onCancel} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-sm font-medium transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-sm font-medium transition-colors text-sm">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function MultiPartSelectorModal({ parts, existingPartNames, onAdd, onClose }: { parts: Part[], existingPartNames: string[], onAdd: (names: string[]) => void, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = parts.filter(p => !existingPartNames.includes(p.name) && (p.name.toLowerCase().includes(query.toLowerCase()) || (p.partNumber && p.partNumber.toLowerCase().includes(query.toLowerCase()))));

  const togglePart = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-300 rounded-sm shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh]">
        <div className="p-3 border-b border-slate-300 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-[#006699]">Select Parts for BOM</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-3 border-b border-slate-300">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Search parts by name or number..." value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 font-medium text-slate-700 transition-colors"
            />
          </div>
        </div>
        <div className="p-3 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map(p => {
              const isSel = selected.has(p.name);
              return (
                <div key={p.id} onClick={() => togglePart(p.name)} className={`flex items-center gap-2 p-2 border rounded-sm cursor-pointer transition-colors ${isSel ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={isSel} readOnly className="w-4 h-4 rounded-sm border-slate-300 text-blue-600" />
                  <div className="min-w-0 pr-1">
                    <div className="text-[12px] font-bold text-slate-800 truncate">{p.name}</div>
                    {p.partNumber && <div className="text-[10px] font-mono text-slate-500 truncate">{p.partNumber}</div>}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="col-span-full py-8 text-center text-sm font-medium text-slate-500">No parts found matching "{query}"</div>}
          </div>
        </div>
        <div className="p-3 border-t border-slate-300 bg-slate-50 flex justify-between items-center">
          <span className="text-sm font-bold text-[#006699]">{selected.size} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-[13px] font-bold text-slate-600 bg-[#e0e0e0] border border-slate-400 hover:bg-[#d0d0d0] rounded-sm transition-colors">Close</button>
            <button disabled={selected.size === 0} onClick={() => { onAdd(Array.from(selected)); onClose(); }} className="px-4 py-1.5 text-[13px] font-bold text-white bg-blue-600 border border-blue-700 hover:bg-blue-700 rounded-sm disabled:opacity-50 transition-colors">Add Selected</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupedModelCard({ modelName, variants, onClick }: { key?: React.Key, modelName: string, variants: VehicleModelSpec[], onClick: () => void }) {
  const totalParts = variants.reduce((acc, v) => acc + v.bom.length, 0);
  return (
    <div className="bg-white border border-slate-300 p-2 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm rounded-sm" onClick={onClick}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-slate-50 border border-slate-300 rounded-[2px] flex items-center justify-center shrink-0 text-slate-500">
          <Package className="w-4 h-4 text-[#006699]" />
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-[#006699] uppercase tracking-wide leading-tight">{modelName}</h3>
          <p className="text-[11px] text-slate-600 font-medium">{variants.length} Variant{variants.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}

function ModelCard({ model, parts, onEdit, onDelete, onViewDetails }: { key?: React.Key, model: VehicleModelSpec, parts: Part[], onEdit: (m: VehicleModelSpec) => void, onDelete: (id: string) => void, onViewDetails: () => void }) {
  const totalQty = model.bom.reduce((sum, b) => sum + (b.unit !== 'Pieces' ? 1 : b.quantity), 0);
  return (
    <div className="bg-white border border-slate-300 p-2 flex flex-col group hover:bg-slate-50 transition-colors relative shadow-sm rounded-sm">
      <div className="flex flex-col cursor-pointer" onClick={onViewDetails}>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-slate-50 border border-slate-300 rounded-[2px] flex items-center justify-center shrink-0 text-[#006699]">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div className="pr-14">
              <h3 className="text-[12px] font-bold text-[#006699] uppercase tracking-wide flex items-center gap-1.5 flex-wrap leading-tight mt-0.5">
                {model.name}
                {model.color && (
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-white px-1 py-0.5 border border-slate-300 shadow-sm" style={{ color: model.color }}>
                    <span className="w-1.5 h-1.5 border border-slate-300 rounded-sm" style={{ backgroundColor: model.color }} />
                    {model.color}
                  </span>
                )}
              </h3>
              {model.description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 font-medium">{model.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 absolute top-2 right-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(model); }} className="p-1.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm transition-colors shadow-sm" title="Edit Model"><Edit2 className="w-3 h-3" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(model.id); }} className="p-1.5 text-red-600 bg-white border border-slate-300 hover:bg-red-50 rounded-sm transition-colors shadow-sm" title="Delete Model"><Trash2 className="w-3 h-3" /></button>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2 border-t border-slate-200 pt-2">
          <div className="text-[10px] text-slate-500 font-medium"><span className="font-bold text-slate-700">{totalQty}</span> Qty</div>
          <div className="w-[1px] h-3 bg-slate-300"></div>
          <div className="text-[10px] text-slate-500 font-medium"><span className="font-bold text-slate-700">{model.bom.length}</span> Unique</div>
        </div>
      </div>
    </div>
  );
}

function VariantDetailsView({ model, parts, onEdit, onDelete, onClose }: { model: VehicleModelSpec, parts: Part[], onEdit: (m: VehicleModelSpec) => void, onDelete: (id: string) => void, onClose: () => void }) {
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Model: ${model.name} ${model.color || ''}`, 14, 20);
    const tableData = model.bom.map((b, i) => {
      const p = parts.find(x => x.name === b.partName);
      return [i + 1, p?.partNumber || '-', b.partName, b.quantity, b.unit || 'pcs'];
    });
    autoTable(doc, { startY: 30, head: [['S.No', 'Part No', 'Part Name', 'Qty', 'Unit']], body: tableData });
    doc.save(`${model.name}-bom.pdf`);
  };

  return (
    <div className="bg-white border border-slate-300 flex flex-col shadow-sm rounded-sm">
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-300 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center text-[13px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white shadow-sm border border-slate-300 rounded-sm flex items-center justify-center shrink-0 text-[#006699]">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#006699] uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
              {model.name}
              {model.color && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 border border-slate-300 rounded-sm shadow-sm" style={{ color: model.color }}>
                  <span className="w-2 h-2 rounded-full border border-slate-300 shadow-inner" style={{ backgroundColor: model.color }} />
                  {model.color}
                </span>
              )}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{model.bom.length} Unique Components</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button onClick={() => onEdit(model)} className="px-3 py-1 text-[12px] font-bold bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] rounded-sm transition-colors shadow-sm flex items-center gap-1.5"><Edit2 className="w-3.5 h-3.5"/> Edit</button>
          <button onClick={exportPDF} className="px-3 py-1 text-[12px] font-bold bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] rounded-sm transition-colors shadow-sm flex items-center gap-1.5"><Download className="w-3.5 h-3.5"/> Export PDF</button>
          <button onClick={() => onDelete(model.id)} className="px-3 py-1 text-[12px] font-bold bg-red-600 border border-red-700 text-white hover:bg-red-700 rounded-sm transition-colors shadow-sm flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5"/> Delete</button>
        </div>
      </div>
      <div className="overflow-y-auto p-2 bg-white max-h-[60vh]">
        {model.bom.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-300 rounded-sm bg-white m-2">
            <p className="text-slate-500 font-medium text-sm">No parts configured for this model.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {model.bom.map((part, idx) => {
              const pObj = parts.find(p => p.name === part.partName);
              const pNum = pObj?.partNumber;
              return (
                <div key={idx} className="flex justify-between items-center bg-white py-1.5 px-2 border border-slate-300 shadow-sm rounded-sm hover:bg-slate-50 transition-colors">
                  <div className="flex flex-1 items-center gap-2 min-w-0 pr-4">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 h-7 w-7 flex items-center justify-center rounded-sm uppercase shrink-0 border border-slate-300">{idx + 1}</span>
                    <div className="min-w-0 flex flex-col justify-center">
                      <div className="text-[12px] font-bold text-[#006699] truncate uppercase">{part.partName}</div>
                      {pNum && <div className="text-[10px] font-mono font-bold text-slate-500 truncate">{pNum}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-2 border-l border-slate-200 justify-center min-w-[50px]">
                    <span className="font-black text-slate-700 text-sm">{part.quantity} <span className="font-bold text-slate-400 text-[9px] uppercase ml-0.5">{part.unit || 'pcs'}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {model.description && (
        <div className="bg-slate-50 p-2 text-[11px] font-medium border-t border-slate-300 text-slate-600">
           <span className="font-bold text-[#006699]">Description: </span>{model.description}
        </div>
      )}
    </div>
  );
}

export function VehicleSpecifications({ vehicleModels, parts, onAddModel, onUpdateModel, onDeleteModel }: {
  vehicleModels: VehicleModelSpec[];
  parts: Part[];
  onAddModel: (model: Omit<VehicleModelSpec, 'id'>) => Promise<void>;
  onUpdateModel: (model: VehicleModelSpec) => Promise<void>;
  onDeleteModel: (id: string) => Promise<void>;
}) {
  const groupedModels: Record<string, VehicleModelSpec[]> = useMemo(() => {
    return vehicleModels.reduce((acc, curr) => {
      if (!acc[curr.name]) acc[curr.name] = [];
      acc[curr.name].push(curr);
      return acc;
    }, {} as Record<string, VehicleModelSpec[]>);
  }, [vehicleModels]);

  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<VehicleModelSpec, 'id'>>({ name: '', color: '', description: '', bom: [] });
  const [bomSearchQuery, setBomSearchQuery] = useState('');
  const [showMultiPartSelector, setShowMultiPartSelector] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setFormData({ name: selectedGroupName || '', color: '', description: '', bom: [] });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (model: VehicleModelSpec) => {
    setFormData({ name: model.name, color: model.color || '', description: model.description || '', bom: [...model.bom] });
    setEditingId(model.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await onDeleteModel(deletingId);
      if (selectedVariantId === deletingId) setSelectedVariantId(null);
    }
    setDeletingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await onUpdateModel({ ...formData, id: editingId });
    } else {
      await onAddModel(formData);
    }
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleCancelIntent = () => {
    if (formData.name || formData.bom.length > 0) setShowCancelConfirm(true);
    else setIsFormOpen(false);
  };

  const filteredBom = formData.bom.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => {
    if (!bomSearchQuery) return true;
    const q = bomSearchQuery.toLowerCase();
    const p = parts.find(part => part.name === item.partName);
    return item.partName.toLowerCase().includes(q) || (p && p.partNumber && p.partNumber.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4 font-sans w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300 pb-2">
        <div className="flex items-center gap-2">
          {selectedGroupName && !isFormOpen && !selectedVariantId && (
            <button onClick={() => setSelectedGroupName(null)} className="p-1 hover:bg-[#e0e0e0] text-slate-600 rounded-sm transition-colors" title="Back to Models"><ArrowLeft className="w-5 h-5"/></button>
          )}
          {selectedVariantId && !isFormOpen && (
            <button onClick={() => setSelectedVariantId(null)} className="p-1 hover:bg-[#e0e0e0] text-slate-600 rounded-sm transition-colors" title="Back to Variants"><ArrowLeft className="w-5 h-5"/></button>
          )}
          <h2 className="text-lg font-bold text-[#006699] uppercase tracking-wide">
            {selectedVariantId && !isFormOpen ? 'Variant Details' : selectedGroupName && !isFormOpen ? `Model Variants - ${selectedGroupName}` : 'Vehicle Models & BOM'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          {!isFormOpen && !selectedGroupName && !selectedVariantId && (
            <button onClick={handleOpenAdd} className="px-4 py-1.5 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors rounded-sm text-[13px] font-bold shadow-sm hidden sm:block">Add New Model</button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm mb-4 p-3 pt-0">
          <div className="p-2 flex justify-between items-center mb-1">
            <h3 className="font-bold text-[#006699] text-base">{editingId ? 'Edit Vehicle Model' : 'Create New Model'}</h3>
            <button type="button" onClick={handleCancelIntent} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-colors"><X className="w-4 h-4"/></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 border-b border-slate-200 pb-4">
              <div>
                <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1 block">Model Name</label>
                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-2 py-1.5 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 font-bold text-[#006699]" placeholder="e.g. E-Rickshaw Pro" />
              </div>
              <div>
                <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1 block">Color Code/Name</label>
                <input value={formData.color || ''} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full px-2 py-1.5 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 font-medium text-slate-700" placeholder="e.g. Blue" />
              </div>
              <div>
                <label className="text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-1 block">Description</label>
                <input value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-2 py-1.5 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 font-medium text-slate-700" placeholder="Optional notes" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#006699]" />
                  <h4 className="font-bold text-[#006699] text-[14px] uppercase tracking-wide">Bill of Materials</h4>
                </div>
                <div className="flex items-center gap-2">
                  {formData.bom.length > 0 && (
                    <div className="relative hidden sm:block">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={bomSearchQuery} onChange={e => setBomSearchQuery(e.target.value)} placeholder="Filter..." className="w-40 pl-8 pr-2 py-1 text-[12px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  )}
                  <button type="button" onClick={() => setShowMultiPartSelector(true)} className="px-3 py-1 bg-blue-50 text-[#006699] font-bold border border-blue-200 hover:bg-blue-100 rounded-sm flex items-center gap-1.5 text-[12px] transition-colors"><Plus className="w-3.5 h-3.5" /> Add Parts</button>
                </div>
              </div>

              {formData.bom.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-sm">
                  <p className="text-[13px] text-slate-500 font-medium">No parts selected for this BOM.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="hidden sm:flex text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 pb-1 border-b border-slate-200">
                    <div className="w-8 shrink-0 flex justify-center">S.N.</div>
                    <div className="w-[100px] shrink-0 pl-3">Part No</div>
                    <div className="flex-1 min-w-0">Part Name</div>
                    <div className="w-[100px] shrink-0 text-center">Qty</div>
                    <div className="w-[70px] shrink-0">Unit</div>
                    <div className="w-10 shrink-0"></div>
                  </div>
                  {filteredBom.length === 0 ? (
                    <div className="py-4 text-center text-[12px] text-slate-500 font-medium border border-slate-200 bg-slate-50 rounded-sm flex items-center justify-center">No parts visually match query.</div>
                  ) : filteredBom.map(({ item, originalIndex: idx }) => {
                    const p = parts.find(x => x.name === item.partName);
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 bg-white p-2 sm:py-1.5 sm:px-2 border border-slate-300 shadow-sm rounded-sm hover:bg-slate-50 transition-colors">
                        <div className="bg-slate-100 text-slate-500 w-8 h-8 sm:h-7 flex items-center justify-center rounded-sm text-[11px] font-bold shrink-0 border border-slate-200">{idx + 1}</div>
                        <div className="text-[11px] font-mono font-bold text-slate-500 sm:w-[100px] shrink-0 sm:pl-3 truncate uppercase tracking-wider hidden sm:block">{p?.partNumber || '-'}</div>
                        
                        <div className="flex-1 min-w-0 flex items-center h-8 sm:h-7 pl-0 sm:pl-1">
                          <div className="text-[13px] font-bold text-[#006699] truncate uppercase tracking-tight">{item.partName}</div>
                          <span className="sm:hidden text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1 ml-2 rounded-sm uppercase">{p?.partNumber}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0 sm:w-[220px]">
                          <div className="w-[100px] grow sm:grow-0">
                            <input
                              type="number" step="0.001" min="0.001" required
                              value={item.quantity || ''}
                              onChange={e => {
                                const v = e.target.value;
                                const b = [...formData.bom];
                                b[idx] = { ...b[idx], quantity: v ? Number(v) : 0 };
                                setFormData({ ...formData, bom: b });
                              }}
                              className="w-full px-2 py-1 h-8 sm:h-7 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 font-bold text-[#006699] text-center shadow-inner"
                            />
                          </div>
                          <div className="w-[74px] shrink-0">
                            <select
                              value={item.unit || 'Pieces'}
                              onChange={e => {
                                const b = [...formData.bom];
                                b[idx] = { ...b[idx], unit: e.target.value as any };
                                setFormData({ ...formData, bom: b });
                              }}
                              className="w-full px-1.5 py-1 h-8 sm:h-7 text-[11px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 font-bold text-slate-600 bg-slate-50 uppercase tracking-widest shadow-sm"
                            >
                              <option value="Pieces">PCS</option>
                              <option value="Litres">L</option>
                              <option value="ML">ML</option>
                              <option value="KGs">KG</option>
                              <option value="Grams">G</option>
                            </select>
                          </div>
                          <div className="w-9 shrink-0 flex justify-end">
                            <button type="button" onClick={() => {
                              const b = [...formData.bom];
                              b.splice(idx, 1);
                              setFormData({ ...formData, bom: b });
                            }} className="w-8 h-8 sm:h-7 flex items-center justify-center text-white bg-red-600 border border-red-700 hover:bg-red-700 rounded-sm transition-colors shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5 border-t border-slate-300 pt-3">
              <button type="button" onClick={handleCancelIntent} className="px-5 py-1.5 bg-[#e0e0e0] border border-slate-400 text-slate-800 font-bold text-[13px] rounded-sm hover:bg-[#d0d0d0] transition-colors shadow-sm">Cancel</button>
              <button type="submit" className="px-6 py-1.5 bg-[#006699] border border-[#005580] text-white font-bold text-[13px] rounded-sm hover:bg-[#005580] transition-colors shadow-sm">{editingId ? 'Save Changes' : 'Create Model'}</button>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && !selectedGroupName && !selectedVariantId && vehicleModels.length === 0 && (
        <div className="bg-white border border-slate-300 p-12 text-center rounded-sm shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-[#006699] rounded-sm flex items-center justify-center mx-auto mb-4 border border-slate-300 shadow-inner">
             <Settings className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#006699] uppercase tracking-wide mb-1">No Vehicle Models</h3>
          <p className="text-[13px] text-slate-500 font-medium max-w-sm mx-auto">Create a vehicle model and define its BOM (Bill of Materials) to automate inventory deductions during production.</p>
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
          {groupedModels[selectedGroupName]?.map((model, i) => (
            <ModelCard key={model.id || i} model={model} parts={parts} onEdit={handleEdit} onDelete={handleDelete} onViewDetails={() => setSelectedVariantId(model.id)} />
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

      <DeleteConfirmationModal isOpen={showCancelConfirm} title="Cancel Changes" message="Are you sure you want to cancel? Any unsaved changes will be lost." confirmText="Yes, Cancel" onConfirm={() => { setIsFormOpen(false); setShowCancelConfirm(false); }} onCancel={() => setShowCancelConfirm(false)} />
      <DeleteConfirmationModal isOpen={!!deletingId} title="Delete Model" message="Are you sure you want to delete this variant? This action cannot be undone." confirmText="Delete Variant" onConfirm={handleConfirmDelete} onCancel={() => setDeletingId(null)} />
      
      {showMultiPartSelector && (
        <MultiPartSelectorModal parts={parts} existingPartNames={formData.bom.map(b => b.partName).filter(Boolean)} onAdd={names => setFormData({ ...formData, bom: [...formData.bom, ...names.map(n => ({ partName: n, quantity: 1, unit: 'Pieces' as any }))] })} onClose={() => setShowMultiPartSelector(false)} />
      )}
    </div>
  );
}
