import React, { useState } from 'react';
import { Vehicle, VehicleModelSpec } from '../types';
import { Plus, Edit2, Trash2, X, Check, Save, Download, Upload, Filter, Calendar, CarFront } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface VehicleProductionProps {
  vehicles: Vehicle[];
  vehicleModels: VehicleModelSpec[];
  onAddVehicle: (vehicle: Vehicle) => Promise<void> | void;
  onUpdateVehicle: (vehicle: Vehicle) => Promise<void> | void;
  onDeleteVehicle: (id: string) => Promise<void> | void;
  userRole?: Partial<Vehicle> | any;
}

const initialFormState: Omit<Vehicle, 'id'> = {
  model: '',
  chassisNumber: '',
  motorNumber: '',
  batteryNumbers: [''], // start with one battery slot
  productionDate: new Date().toISOString().split('T')[0],
  color: 'Red',
  costPrice: '',
  status: 'In Stock'
};

export function VehicleProduction({ vehicles, vehicleModels, onAddVehicle, onUpdateVehicle, onDeleteVehicle, userRole }: VehicleProductionProps) {
  const isAdmin = userRole?.role === 'admin';
  const canAdd = true;
  const canUpdate = true;
  const canReduce = true;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'> | Vehicle>(initialFormState);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  
  // Selection
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showMarkSoldConfirm, setShowMarkSoldConfirm] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Don't uppercase color
    let finalValue = value;
    if (type === 'text') {
      finalValue = name === 'color' || name === 'remarks' ? value : value.toUpperCase();
    }
    
    if (name === 'model' || name === 'color') {
       const newModel = name === 'model' ? finalValue : formData.model;
       const newColor = name === 'color' ? finalValue : formData.color;
       
       let selectedModelSpec = vehicleModels.find(m => m.name === newModel && m.color === newColor);
       if (!selectedModelSpec) {
          selectedModelSpec = vehicleModels.find(m => m.name === newModel && (!m.color || m.color === ''));
       }
       if (!selectedModelSpec) {
          selectedModelSpec = vehicleModels.find(m => m.name === newModel);
       }
       
       let requiredBatteries = 0;
       if (selectedModelSpec) {
          const batteryItem = selectedModelSpec.bom.find(item => item.partName.toLowerCase().includes('battery'));
          if (batteryItem) {
             requiredBatteries = batteryItem.quantity;
          }
       }
       if (requiredBatteries === 0) requiredBatteries = 1; // Default fallback
       
       setFormData(prev => {
         const currentBatteries = prev.batteryNumbers || [];
         const newBatteries = Array(requiredBatteries).fill('').map((_, i) => currentBatteries[i] || '');
         return {
           ...prev, 
           [name]: finalValue,
           batteryNumbers: newBatteries
         };
       });
    } else {
       setFormData((prev) => ({ ...prev, [name]: finalValue }));
    }
  };

  const hasUnsavedChanges = () => {
    if (!editingId) {
      return JSON.stringify(formData) !== JSON.stringify(initialFormState);
    } else {
      const originalVehicle = vehicles.find(v => v.id === editingId);
      if (originalVehicle) {
        return JSON.stringify(formData) !== JSON.stringify(originalVehicle);
      }
    }
    return false;
  };

  const handleCancelIntent = () => {
    if (hasUnsavedChanges()) {
      setShowCancelConfirm(true);
    } else {
      handleCancel();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const promise = editingId 
      ? onUpdateVehicle(formData as Vehicle) 
      : onAddVehicle({
          ...formData,
          id: Date.now().toString(),
        } as Vehicle);

    setIsFormOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
    
    try {
      await promise;
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Failed to save. Please try again.");
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData(vehicle);
    setEditingId(vehicle.id);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const filteredVehicles = vehicles.filter(v => {
    let match = true;
    if (dateFrom && new Date(v.productionDate) < new Date(dateFrom)) match = false;
    if (dateTo && new Date(v.productionDate) > new Date(dateTo)) match = false;
    if (colorFilter && v.color !== colorFilter) match = false;
    if (modelFilter && !v.model.toLowerCase().includes(modelFilter.toLowerCase())) match = false;
    return match;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVehicles(filteredVehicles.map(v => v.id));
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicles(prev => 
      prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
    );
  };

  const handleMarkAsSold = async () => {
    if (selectedVehicles.length === 0) return;
    setShowMarkSoldConfirm(true);
  };

  const confirmMarkAsSold = async () => {
    setShowMarkSoldConfirm(false);
    try {
      await Promise.all(
        selectedVehicles.map(async (id) => {
          const vehicle = vehicles.find(v => v.id === id);
          if (vehicle && vehicle.status !== 'Sold') {
            await onUpdateVehicle({ ...vehicle, status: 'Sold' });
          }
        })
      );
      setSelectedVehicles([]); // Clear selection after updating
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (vehicleToDelete) {
      try {
        await onDeleteVehicle(vehicleToDelete);
        setVehicleToDelete(null);
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedVehicles.length === 0) return;
    setShowDeleteSelectedConfirm(true);
  };

  const confirmDeleteSelected = async () => {
    setShowDeleteSelectedConfirm(false);
    try {
      await Promise.all(
        selectedVehicles.map(id => onDeleteVehicle(id))
      );
      setSelectedVehicles([]);
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredVehicles.map(v => ({
      'Model': v.model,
      'Chassis Number': v.chassisNumber,
      'Motor Number': v.motorNumber,
      'Production Date': new Date(v.productionDate).toLocaleDateString(),
      'Color': v.color,
      'Remarks': v.remarks || '',
      'Cost Price': v.costPrice
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Add Professional styling widths
    const wscols = [
      {wch: 15}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 12}, 
      {wch: 15}, {wch: 12}, {wch: 10}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Stock");
    
    const dStr = new Date().toISOString().split('T')[0];
    let fileNameDate = dStr;
    if (dateFrom && dateTo) fileNameDate = `${dateFrom}_to_${dateTo}`;
    else if (dateFrom) fileNameDate = `From_${dateFrom}`;
    else if (dateTo) fileNameDate = `To_${dateTo}`;

    XLSX.writeFile(wb, `Vehicle_Stock_Details_${fileNameDate}.xlsx`);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let importedCount = 0;
        data.forEach((row: any) => {
          if (row['Chassis Number'] && row['Model']) {
            let prodDate = new Date().toISOString().split('T')[0];
            // Format dates well from Excel if possible
            if (row['Production Date']) {
               const parsedD = new Date(row['Production Date']);
               if (!isNaN(parsedD.getTime())) prodDate = parsedD.toISOString().split('T')[0];
            }

            onAddVehicle({
              id: Date.now().toString() + Math.random().toString(36).substring(7),
              model: String(row['Model']),
              chassisNumber: String(row['Chassis Number']),
              motorNumber: row['Motor Number'] ? String(row['Motor Number']) : '',
              batteryNumbers: [],
              productionDate: prodDate,
              color: row['Color'] ? String(row['Color']) : 'Red',
              remarks: row['Remarks'] ? String(row['Remarks']) : '',
              costPrice: row['Cost Price'] ? Number(row['Cost Price']) : '',
              status: row['Status'] === 'Sold' ? 'Sold' : 'In Stock'
            });
            importedCount++;
          }
        });
        alert(`Successfully imported ${importedCount} vehicles!`);
      } catch (error) {
        console.error("Error importing file", error);
        alert('Failed to parse the file. Please ensure it matches the professional export format.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Vehicle Production</h2>
          <p className="text-slate-500 mt-1">Manage e-rickshaw manufacturing records and stock status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          {canAdd && (
            <button
              onClick={handleImportClick}
              className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          {!isFormOpen && canAdd && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Vehicle
            </button>
          )}
        </div>
      </div>

      {!isFormOpen && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1 w-full relative">
            <label className="text-xs font-medium text-slate-600">From Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex-1 space-y-1 w-full relative">
            <label className="text-xs font-medium text-slate-600">To Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex-1 space-y-1 w-full relative">
            <label className="text-xs font-medium text-slate-600">Color</label>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <select value={colorFilter} onChange={e => setColorFilter(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">All Colors</option>
                {Array.from(new Set(vehicles.map(v => v.color))).sort().map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 space-y-1 w-full relative">
            <label className="text-xs font-medium text-slate-600">Model</label>
            <input type="text" placeholder="Search Model..." value={modelFilter} onChange={e => setModelFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          {(dateFrom || dateTo || colorFilter || modelFilter) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setColorFilter(''); setModelFilter(''); }} className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Clear Filters
            </button>
          )}
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white rounded-[16px] border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <CarFront className="w-24 h-24" />
          </div>
          <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center relative z-10">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                <Plus className="w-4 h-4" />
              </div>
              {editingId ? 'Edit Vehicle Entry' : 'Add New Vehicle'}
            </h3>
            <button onClick={handleCancelIntent} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Model</label>
                <select
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Select a model</option>
                  {Array.from(new Set(vehicleModels.map(m => m.name))).map(modelName => (
                    <option key={modelName} value={modelName}>{modelName}</option>
                  ))}
                  {/* Provide fallback if list is entirely empty, or Pick Electric hardcode just in case? If the prompt says "which is added in the vehicle specifications by hand that vehicles should only showing", removing "Pick Electric" from hardcoded list is appropriate. */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <select
                  name="color"
                  required
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Select a color</option>
                  {(() => {
                     const colors = Array.from(new Set(vehicleModels.filter(m => m.name === formData.model && m.color).map(m => m.color as string)));
                     if (colors.length > 0) {
                       return colors.map(c => <option key={c} value={c}>{c}</option>);
                     }
                     return (
                       <>
                         <option value="Red">Red</option>
                         <option value="Green">Green</option>
                         <option value="Yellow">Yellow</option>
                         <option value="Blue">Blue</option>
                       </>
                     );
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chassis Number</label>
                <input
                  type="text"
                  name="chassisNumber"
                  required
                  value={formData.chassisNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. CHK123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motor Number</label>
                <input
                  type="text"
                  name="motorNumber"
                  required
                  value={formData.motorNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. MOT789012"
                />
              </div>

              <div className="col-span-full">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">Battery Serial Numbers</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(formData.batteryNumbers || []).map((num, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={num}
                        onChange={(e) => {
                          const arr = [...(formData.batteryNumbers || [])];
                          arr[idx] = e.target.value.toUpperCase();
                          setFormData(prev => ({ ...prev, batteryNumbers: arr }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Battery ${idx + 1} Number`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Production Date</label>
                <input
                  type="date"
                  name="productionDate"
                  required
                  value={formData.productionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 content-center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any extra remarks..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (₹)</label>
                <input
                  type="number" step="0.01"
                  name="costPrice"
                  required
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 105000"
                />
              </div>

            </div>
            
            <div className="mt-6 flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelIntent}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update Vehicle' : 'Save Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[16px] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center min-h-[72px]">
          <h3 className="font-bold text-slate-800 tracking-tight text-lg">Produced Vehicles <span className="ml-2 text-sm font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">{filteredVehicles.length}</span></h3>
          <div className="flex gap-2">
            {canReduce && (
              <>
                <button
                  onClick={handleMarkAsSold}
                  disabled={selectedVehicles.length === 0}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border min-w-[130px] ${
                    selectedVehicles.length > 0
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                  }`}
                >
                  Mark as Sold
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedVehicles.length === 0}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center border min-w-[100px] ${
                    selectedVehicles.length > 0
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    checked={filteredVehicles.length > 0 && selectedVehicles.length === filteredVehicles.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-3 py-3 w-10 text-center font-medium">S.No</th>
                <th className="px-4 py-3 font-medium">Chassis No</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Batteries</th>
                <th className="px-4 py-3 font-medium">Color</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No vehicles found. Try adjusting filters or click "Add New Vehicle" to add one.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle, index) => {
                  let batteryName = 'Battery';
                  let modelSpec = vehicleModels.find(m => m.name === vehicle.model && m.color === vehicle.color);
                  if (!modelSpec) {
                    modelSpec = vehicleModels.find(m => m.name === vehicle.model && (!m.color || m.color === ''));
                  }
                  if (!modelSpec) {
                    modelSpec = vehicleModels.find(m => m.name === vehicle.model);
                  }
                  if (modelSpec) {
                    const batteryItem = modelSpec.bom.find(item => item.partName.toLowerCase().includes('battery'));
                    if (batteryItem) batteryName = batteryItem.partName;
                  }

                  return (
                    <tr 
                      key={vehicle.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('input, button')) return;
                        setSelectedVehicleDetails(vehicle);
                      }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          checked={selectedVehicles.includes(vehicle.id)}
                          onChange={() => handleSelectVehicle(vehicle.id)}
                        />
                      </td>
                      <td className="px-3 py-3 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 font-mono tracking-tight">{vehicle.chassisNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{vehicle.model}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-medium text-slate-700">
                          {vehicle.batteryNumbers?.length ? batteryName : 'None'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <span 
                              className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm border border-slate-200"
                              style={{ backgroundColor: vehicle.color.toLowerCase() }}
                            ></span>
                            <span className="font-medium text-slate-700">{vehicle.color}</span>
                          </div>
                          {vehicle.remarks && (
                            <div className="text-[10px] text-slate-500 italic max-w-[120px] truncate" title={vehicle.remarks}>
                              {vehicle.remarks}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-medium">{new Date(vehicle.productionDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          vehicle.status === 'In Stock' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canUpdate && (
                            <button
                              onClick={() => handleEdit(vehicle)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canReduce && (
                            <button
                              onClick={() => setVehicleToDelete(vehicle.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showMarkSoldConfirm}
        title="Confirm Action"
        message={`Are you sure you want to mark ${selectedVehicles.length} ${selectedVehicles.length === 1 ? 'vehicle' : 'vehicles'} as sold?`}
        confirmLabel="Confirm"
        onConfirm={confirmMarkAsSold}
        onCancel={() => setShowMarkSoldConfirm(false)}
      />

      <ConfirmDialog
        isOpen={vehicleToDelete !== null}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setVehicleToDelete(null)}
      />

      <ConfirmDialog
        isOpen={showDeleteSelectedConfirm}
        title="Delete Selected Vehicles"
        message={`Are you sure you want to delete ${selectedVehicles.length} ${selectedVehicles.length === 1 ? 'vehicle' : 'vehicles'}? This action cannot be undone.`}
        onConfirm={confirmDeleteSelected}
        onCancel={() => setShowDeleteSelectedConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this form. If you close now, your changes will be lost."
        confirmLabel="Discard Changes"
        onConfirm={() => {
          handleCancel();
          setShowCancelConfirm(false);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* Vehicle Details Modal */}
      {selectedVehicleDetails && (() => {
        const v = selectedVehicleDetails;
        let modelSpec = vehicleModels.find(m => m.name === v.model && m.color === v.color);
        if (!modelSpec) modelSpec = vehicleModels.find(m => m.name === v.model && (!m.color || m.color === ''));
        if (!modelSpec) modelSpec = vehicleModels.find(m => m.name === v.model);
        
        let batteryName = 'Battery';
        if (modelSpec) {
          const bItem = modelSpec.bom.find(i => i.partName.toLowerCase().includes('battery'));
          if (bItem) batteryName = bItem.partName;
        }

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <CarFront className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">{v.model}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">Production Date: {new Date(v.productionDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicleDetails(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Color</p>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-2 shadow-sm border border-slate-200" style={{ backgroundColor: v.color.toLowerCase() }}></span>
                      <p className="font-semibold text-slate-800">{v.color}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Status</p>
                    <p className="font-semibold text-slate-800"><span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${v.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>{v.status}</span></p>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Vehicle Identification</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="font-medium text-slate-700">Chassis Number</span>
                      <span className="font-mono font-bold text-slate-800">{v.chassisNumber}</span>
                    </li>
                    {v.motorNumber && (
                      <li className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <span className="font-medium text-slate-700">Motor Number</span>
                        <span className="font-mono font-bold text-slate-800">{v.motorNumber}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {v.batteryNumbers && v.batteryNumbers.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Battery Information</h4>
                    <ul className="space-y-3">
                      {v.batteryNumbers.map((num, i) => (
                        <li key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <span className="font-medium text-slate-700">{batteryName} Serial {i + 1}</span>
                          <span className="font-mono font-bold text-indigo-600">{num}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {modelSpec && modelSpec.bom && modelSpec.bom.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Bill of Materials Used</h4>
                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-600 w-12 text-center">#</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Part Name</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Qty Used</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {modelSpec.bom.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{i + 1}</td>
                              <td className="px-4 py-3 font-medium text-slate-700">{item.partName}</td>
                              <td className="px-4 py-3 text-slate-700 font-medium text-right font-mono">{item.quantity} {item.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
