import React, { useState } from 'react';
import { Vehicle, VehicleModelSpec } from '../types';
import { Plus, Edit2, Trash2, X, Check, Save, Download, Upload, Filter, Calendar, CarFront, Search, RotateCcw, Loader2 } from 'lucide-react';
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
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [colorFilter, setColorFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  
  // Selection
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showMarkSoldConfirm, setShowMarkSoldConfirm] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lastImportedIds, setLastImportedIds] = useState<string[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

      const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    await new Promise(resolve => setTimeout(resolve, 50));

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        const columnMap: Record<string, string[]> = {
          'Model': ['model', 'vehicle model', 'vehicle', 'item'],
          'Chassis Number': ['chassis number', 'chassis no', 'chassis', 'vin', 'chassis #', 'vin number'],
          'Motor Number': ['motor number', 'motor no', 'motor', 'engine no', 'engine number', 'motor #'],
          'Production Date': ['production date', 'date', 'mfg date', 'manufacturing date', 'date of production'],
          'Color': ['color', 'colour', 'paint'],
          'Remarks': ['remarks', 'notes', 'comment', 'comments', 'description'],
          'Cost Price': ['cost price', 'cost', 'price', 'amount', 'value'],
          'Status': ['status', 'state']
        };

        const data = rawData.map((row: any) => {
          const cleanRow: any = { batteryNumbers: [] };
          let batteryIndexMap: {idx: number, val: string}[] = [];
          
          for (const rawKey of Object.keys(row)) {
            const val = typeof row[rawKey] === 'string' ? row[rawKey].trim() : String(row[rawKey]);
            const normalizedRowKey = rawKey.trim().toLowerCase();
            
            if (normalizedRowKey.includes('battery')) {
               const match = normalizedRowKey.match(/\d+/);
               const idx = match ? parseInt(match[0], 10) : 999;
               batteryIndexMap.push({ idx, val });
               continue;
            }
            
            let matchedKey = rawKey.trim();
            for (const [standardKey, aliases] of Object.entries(columnMap)) {
              if (aliases.some(alias => normalizedRowKey.includes(alias))) {
                matchedKey = standardKey;
                break;
              }
            }
            cleanRow[matchedKey] = typeof row[rawKey] === 'string' ? row[rawKey].trim() : row[rawKey];
          }
          
          batteryIndexMap.sort((a,b) => a.idx - b.idx);
          cleanRow.batteryNumbers = batteryIndexMap.map(b => b.val);
          return cleanRow;
        });

        let importedCount = 0;
        let skippedCount = 0;
        const newImportedIds: string[] = [];
        const vehiclesToAdd: any[] = [];
        
        for (const row of Object.values(data) as any[]) {
          const modelVal = row['Model'];
          let chassisVal = row['Chassis Number'];
          
          if (chassisVal && modelVal) {
            let prodDate = new Date().toISOString().split('T')[0];
            if (row['Production Date']) {
               const parsedD = new Date(row['Production Date']);
               if (!isNaN(parsedD.getTime())) {
                   const z = parsedD.getTimezoneOffset() * 60000;
                   const correctDate = new Date(parsedD.getTime() - z);
                   prodDate = correctDate.toISOString().split('T')[0];
               }
            }

            const newId = Date.now().toString() + Math.random().toString(36).substring(7);
            vehiclesToAdd.push({
                id: newId,
                model: String(modelVal),
                chassisNumber: String(chassisVal),
                motorNumber: row['Motor Number'] ? String(row['Motor Number']) : '',
                batteryNumbers: row.batteryNumbers || [],
                productionDate: prodDate,
                color: row['Color'] ? String(row['Color']) : 'Red',
                remarks: row['Remarks'] ? String(row['Remarks']) : '',
                costPrice: row['Cost Price'] ? Number(row['Cost Price']) : '',
                status: row['Status'] === 'Sold' ? 'Sold' : 'In Stock'
            });
            newImportedIds.push(newId);
          } else {
             skippedCount++;
          }
        }
        
        // Chunk processing for speed
        const chunkSize = 25;
        for (let i = 0; i < vehiclesToAdd.length; i += chunkSize) {
            const chunk = vehiclesToAdd.slice(i, i + chunkSize);
            await Promise.all(chunk.map(v => onAddVehicle(v)));
            importedCount += chunk.length;
        }

        setLastImportedIds(prev => [...prev, ...newImportedIds]);
        alert(`Successfully imported ${importedCount} vehicles!${skippedCount > 0 ? ` Skipped ${skippedCount} items with missing Model or Chassis Number.` : ''}`);
      } catch (error) {
        console.error("Error importing file", error);
        alert('Failed to parse the file. Please ensure it matches the professional export format.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => setIsImporting(false);
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };
  
  const handleUndoImport = async () => {
    if (lastImportedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to undo the last import? This will delete ${lastImportedIds.length} newly imported vehicles and restore their inventory.`)) {
      setIsUndoing(true);
      try {
        await Promise.all(lastImportedIds.map(id => onDeleteVehicle(id)));
        setLastImportedIds([]);
        alert('Undo successful! Vehicles and inventory restored.');
      } catch (err: any) {
        alert('Failed to undo import completely: ' + err.message);
      } finally {
        setIsUndoing(false);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-md shadow-xl flex flex-col items-center gap-4 max-w-sm w-full mx-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <div className="text-center">
                 <h3 className="text-lg font-bold text-slate-800">Importing Vehicles...</h3>
                 <p className="text-sm text-slate-500 mt-1">Please wait while verifying stock and allocating inventory. This might take a few moments for large files.</p>
              </div>
           </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300 pb-2">
        <h2 className="text-lg font-bold text-[#006699] uppercase tracking-wide">Vehicle Production</h2>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
                    {lastImportedIds.length > 0 && canAdd && (
            <button
               onClick={handleUndoImport}
               disabled={isUndoing}
               className={`px-4 py-1 text-[13px] font-bold border rounded-sm transition-colors shadow-sm flex items-center gap-1.5 ${isUndoing ? 'bg-slate-200 text-slate-500' : 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200'}`}
            >
               <RotateCcw className="w-3.5 h-3.5" />
               {isUndoing ? 'Undoing...' : 'Undo Import'}
            </button>
          )}
          {canAdd && (
            <button
              onClick={handleImportClick}

              className="px-4 py-1 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors text-[13px] font-medium"
            >
              Import
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-1 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors text-[13px] font-medium"
          >
            Export
          </button>
          {!isFormOpen && canAdd && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-1 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors text-[13px] font-medium"
            >
              Add New Vehicle
            </button>
          )}
        </div>
      </div>

      {!isFormOpen && (
        <div className="bg-[#f0f0f0] p-3 border border-slate-300 flex flex-wrap gap-x-6 gap-y-3 items-end relative">
          <div className="flex flex-col relative w-fit">
            <label className="text-[#cc0000] text-[11px] mb-1">FROM DATE</label>
            <div className="flex relative">
              <input 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
                className="w-[140px] px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10 bg-white" 
              />
              <div className="absolute right-0 top-0 bottom-0 w-[30px] flex items-center justify-center bg-[#f0f0f0] border-l border-slate-300 pointer-events-none rounded-r-sm z-20">
                <Calendar className="w-4 h-4 text-rose-600 fill-slate-200" />
              </div>
            </div>
          </div>
          <div className="flex flex-col relative w-fit">
            <label className="text-[#cc0000] text-[11px] mb-1">TO DATE</label>
            <div className="flex relative">
              <input 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
                className="w-[140px] px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10 bg-white" 
              />
              <div className="absolute right-0 top-0 bottom-0 w-[30px] flex items-center justify-center bg-[#f0f0f0] border-l border-slate-300 pointer-events-none rounded-r-sm z-20">
                <Calendar className="w-4 h-4 text-rose-600 fill-slate-200" />
              </div>
            </div>
          </div>
          <div className="flex flex-col relative w-fit justify-end">
            <button className="px-2 py-0.5 h-[26px] font-sans text-[12px] bg-gradient-to-b from-[#e4e4e4] to-[#c8c8c8] border border-slate-400 text-slate-900 hover:from-[#d4d4d4] hover:to-[#b8b8b8] transition-colors shadow-sm whitespace-nowrap mb-0.5">
              Get Details
            </button>
          </div>
          <div className="flex flex-col">
            <label className="text-[#cc0000] text-[11px] mb-1">COLOR</label>
            <div className="flex">
              <select 
                value={colorFilter} 
                onChange={e => setColorFilter(e.target.value)} 
                className="w-[130px] px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">-ALL-</option>
                {Array.from(new Set(vehicles.map(v => v.color))).sort().map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col border-r border-slate-300 pr-4">
            <label className="text-[#cc0000] text-[11px] mb-1">MODEL / SEARCH</label>
            <div className="flex h-[28px]">
              <input 
                type="text" 
                placeholder="Search..." 
                value={modelFilter} 
                onChange={e => setModelFilter(e.target.value)} 
                className="w-[160px] px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400" 
              />
              <button className="bg-[#3b5998] border border-[#3b5998] text-white px-2.5 rounded-sm hover:bg-[#2d4373] ml-1 flex items-center justify-center shadow-sm">
                <Search className="w-3.5 h-3.5 font-bold" />
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-end">
             <button 
                onClick={() => { setDateFrom(''); setDateTo(''); setColorFilter(''); setModelFilter(''); }}
                title="Reset Filters"
                className="h-[28px] w-[28px] mb-0.5 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm group"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
             </button>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white border border-slate-300 shadow-sm text-[13px] font-sans rounded-none">
          <div className="bg-[#dcdcdc] px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 uppercase tracking-normal">
              {editingId ? 'Edit Vehicle Entry' : 'Vehicle Details'}
            </h3>
            <button onClick={handleCancelIntent} className="text-slate-500 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
              
              <div className="flex flex-col">
                <label className="text-[#cc0000] mb-1 font-medium">VEHICLE MODEL</label>
                <select
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="" disabled>-SELECT-</option>
                  {Array.from(new Set(vehicleModels.map(m => m.name))).map(modelName => (
                    <option key={modelName} value={modelName}>{modelName}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[#cc0000] mb-1 font-medium">COLOR</label>
                <select
                  name="color"
                  required
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="" disabled>-SELECT-</option>
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

              <div className="flex flex-col">
                <label className="text-slate-600 mb-1 font-medium uppercase">Chassis Number</label>
                <input
                  type="text"
                  name="chassisNumber"
                  required
                  value={formData.chassisNumber}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-slate-600 mb-1 font-medium uppercase">Motor Number</label>
                <input
                  type="text"
                  name="motorNumber"
                  required
                  value={formData.motorNumber}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-slate-600 mb-1 font-medium uppercase">Production Date</label>
                <input
                  type="date"
                  name="productionDate"
                  required
                  value={formData.productionDate}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-slate-600 mb-1 font-medium uppercase">Cost Price (₹)</label>
                <input
                  type="number" step="0.01"
                  name="costPrice"
                  required
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-slate-600 mb-1 font-medium uppercase">Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks || ''}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-400"
                />
              </div>

              {(formData.batteryNumbers && formData.batteryNumbers.length > 0) && (
                <div className="md:col-span-4 bg-[#f8f8f8] p-3 border border-slate-200 mt-2">
                  <label className="block text-slate-600 mb-2 font-medium uppercase border-b border-slate-300 pb-1">Battery Serial Numbers</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                    {(formData.batteryNumbers || []).map((num, idx) => (
                      <div key={idx} className="flex flex-col">
                        <label className="text-slate-500 mb-1 text-[11px] uppercase">Battery {idx + 1}</label>
                        <input
                          type="text"
                          required
                          value={num}
                          onChange={(e) => {
                            const arr = [...(formData.batteryNumbers || [])];
                            arr[idx] = e.target.value.toUpperCase();
                            setFormData(prev => ({ ...prev, batteryNumbers: arr }));
                          }}
                          className="w-full px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors font-sans text-[13px]"
              >
                {editingId ? 'Update' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={handleCancelIntent}
                className="px-4 py-1.5 bg-[#e0e0e0] border border-slate-400 text-slate-800 hover:bg-[#d0d0d0] transition-colors font-sans text-[13px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-300 shadow-sm font-sans mb-10 overflow-hidden">
        <div className="bg-[#dcdcdc] px-3 py-2 border-b border-slate-300 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 uppercase tracking-normal text-sm flex items-center">
            Produced Vehicles <span className="ml-2 text-xs font-normal">({filteredVehicles.length})</span>
          </h3>
          <div className="flex gap-2">
            {canReduce && (
              <>
                <button
                  onClick={handleMarkAsSold}
                  disabled={selectedVehicles.length === 0}
                  className={`px-3 py-1 font-sans text-xs uppercase border ${
                    selectedVehicles.length > 0
                      ? 'bg-[#e0e0e0] border-slate-400 text-slate-800 hover:bg-[#d0d0d0]'
                      : 'bg-[#f0f0f0] border-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Mark as Sold
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedVehicles.length === 0}
                  className={`px-3 py-1 font-sans text-xs uppercase flex items-center border ${
                    selectedVehicles.length > 0
                      ? 'bg-[#e0e0e0] border-slate-400 text-slate-800 hover:bg-[#d0d0d0]'
                      : 'bg-[#f0f0f0] border-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] text-left border-collapse">
            <thead className="bg-[#ececec] border-b border-slate-300 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-3 py-2 border-r border-slate-300 w-10">
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    checked={filteredVehicles.length > 0 && selectedVehicles.length === filteredVehicles.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-3 py-2 border-r border-slate-300 w-10 text-center">S.No</th>
                <th className="px-3 py-2 border-r border-slate-300">Chassis No</th>
                <th className="px-3 py-2 border-r border-slate-300">Model</th>
                <th className="px-3 py-2 border-r border-slate-300">Batteries</th>
                <th className="px-3 py-2 border-r border-slate-300">Color</th>
                <th className="px-3 py-2 border-r border-slate-300">Date</th>
                <th className="px-3 py-2 border-r border-slate-300">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
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
                      className="hover:bg-slate-50 transition-colors group"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('input, button')) return;
                        setSelectedVehicleDetails(vehicle);
                      }}
                    >
                      <td className="px-3 py-2 border-r border-slate-300 w-10 text-center">
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={selectedVehicles.includes(vehicle.id)}
                          onChange={() => handleSelectVehicle(vehicle.id)}
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-slate-300 text-center text-slate-600">{index + 1}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-slate-800">{vehicle.chassisNumber}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-slate-800">{vehicle.model}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-slate-600 max-w-[200px] truncate" title={vehicle.batteryNumbers?.filter(b => !!b).join(', ')}>
                        {vehicle.batteryNumbers?.filter(b => !!b).length 
                           ? vehicle.batteryNumbers.filter(b => !!b).join(', ') 
                           : (vehicle.batteryNumbers?.length ? batteryName : 'None')}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-300">
                        <div className="flex flex-col">
                          <span className="text-slate-800">{vehicle.color}</span>
                          {vehicle.remarks && (
                            <span className="text-[10px] text-slate-500 italic truncate max-w-[120px]">{vehicle.remarks}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-slate-300 text-slate-600">{new Date(vehicle.productionDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2 border-r border-slate-300">
                        <span className="text-slate-800 font-bold uppercase">
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-2">
                          {canUpdate && (
                            <button
                              onClick={() => handleEdit(vehicle)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canReduce && (
                            <button
                              onClick={() => setVehicleToDelete(vehicle.id)}
                              className="text-red-600 hover:text-red-800"
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
            <div className="bg-white rounded-sm w-full max-w-2xl border border-slate-400 overflow-hidden shadow-md animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
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
                    <li className="flex items-center justify-between bg-[#f8f8f8] py-1.5 px-3 border border-slate-300 shadow-sm rounded-sm">
                      <span className="font-medium text-slate-700">Chassis Number</span>
                      <span className="font-mono font-bold text-slate-800">{v.chassisNumber}</span>
                    </li>
                    {v.motorNumber && (
                      <li className="flex items-center justify-between bg-[#f8f8f8] py-1.5 px-3 border border-slate-300 shadow-sm rounded-sm">
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
                        <li key={i} className="flex items-center justify-between bg-[#f8f8f8] py-1.5 px-3 border border-slate-300 shadow-sm rounded-sm">
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
                    <div className="border border-slate-300">
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
