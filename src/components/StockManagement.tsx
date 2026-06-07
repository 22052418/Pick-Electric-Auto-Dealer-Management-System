import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleModelSpec, SubDealerSale, Sale, Part } from '../types';
import { Package, Plus, X, Save, Car, Check, RefreshCw, BarChart, Trash2, Info, ChevronDown, ChevronUp, Printer, ArrowLeft } from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface StockManagementProps {
  vehicles: Vehicle[];
  vehicleModels: VehicleModelSpec[];
  parts: Part[];
  subDealerSales: SubDealerSale[];
  sales: Sale[];
  onCreateSubDealerSale: (sale: Omit<SubDealerSale, 'id'>) => Promise<void>;
  onCompleteSubDealerSale: (req: SubDealerSale) => Promise<void>;
  onRevertSubDealerSale: (req: SubDealerSale) => Promise<void>;
  onDeleteSubDealerSale: (req: SubDealerSale) => Promise<void>;
}

export function StockManagement({
  vehicles,
  vehicleModels,
  parts,
  subDealerSales,
  sales,
  onCreateSubDealerSale,
  onCompleteSubDealerSale,
  onRevertSubDealerSale,
  onDeleteSubDealerSale
}: StockManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formData, setFormData] = useState<{
    subDealerName: string;
    subDealerAddress: string;
    subDealerPhone: string;
    totalAmount: number | '';
    remarks: string;
    models: { model: string; color: string; quantity: number | '' }[];
    parts: { partId: string; partName: string; quantity: number | '' }[];
  }>({
    subDealerName: '',
    subDealerAddress: '',
    subDealerPhone: '',
    totalAmount: '',
    remarks: '',
    models: [],
    parts: []
  });

  const hasUnsavedChanges = () => {
    return (
      formData.subDealerName !== '' ||
      formData.subDealerAddress !== '' ||
      formData.subDealerPhone !== '' ||
      formData.totalAmount !== '' ||
      formData.remarks !== '' ||
      formData.models.length > 0 ||
      formData.parts.length > 0
    );
  };

  const handleCancelIntent = () => {
    if (hasUnsavedChanges()) {
      setShowCancelConfirm(true);
    } else {
      setIsFormOpen(false);
      setFormData({ subDealerName: '', subDealerAddress: '', subDealerPhone: '', totalAmount: '', remarks: '', models: [], parts: [] });
    }
  };

  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingSubDealer, setViewingSubDealer] = useState<string | null>(null);

  const [revertingSaleReq, setRevertingSaleReq] = useState<SubDealerSale | null>(null);
  const [deletingSaleReq, setDeletingSaleReq] = useState<SubDealerSale | null>(null);

  const filteredSubDealerSales = useMemo(() => {
    return subDealerSales.filter(req => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (searchQuery && !req.subDealerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (dateFrom && new Date(req.requestDate) < new Date(dateFrom)) return false;
      if (dateTo && new Date(req.requestDate) > new Date(dateTo + 'T23:59:59Z')) return false;
      return true;
    }).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [subDealerSales, statusFilter, searchQuery, dateFrom, dateTo]);

  // Calculate stock by model
  const stockByModel = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => {
      if (v.status === 'In Stock') {
        counts[v.model] = (counts[v.model] || 0) + 1;
      }
    });
    return counts;
  }, [vehicles]);

  const stockByModelColor = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    vehicles.forEach(v => {
      if (v.status === 'In Stock') {
        const color = v.color || 'Any';
        if (!counts[v.model]) counts[v.model] = {};
        counts[v.model][color] = (counts[v.model][color] || 0) + 1;
        counts[v.model]['Total'] = (counts[v.model]['Total'] || 0) + 1;
      }
    });
    return counts;
  }, [vehicles]);

  const totalAvailableQty = useMemo(() => vehicles.filter(v => v.status === 'In Stock').length, [vehicles]);
  const totalVehiclesSold = useMemo(() => vehicles.filter(v => v.status === 'Sold').length, [vehicles]);
  
  const totalRevenue = useMemo(() => {
    const retailRevenue = sales.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const subDealerRevenue = subDealerSales
      .filter(s => s.status === 'completed')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    return retailRevenue + subDealerRevenue;
  }, [sales, subDealerSales]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate models and parts
    if (formData.models.length === 0 && formData.parts.length === 0) {
      alert("Please add at least one vehicle model or part.");
      return;
    }

    const validModels = formData.models.filter(m => m.model && typeof m.quantity === 'number' && m.quantity > 0) as { model: string; color: string; quantity: number }[];
    const validParts = formData.parts.filter(p => p.partId && typeof p.quantity === 'number' && p.quantity > 0) as { partId: string; partName: string; quantity: number }[];

    if (validModels.length === 0 && validParts.length === 0) {
      alert("Please ensure quantities are valid (greater than 0).");
      return;
    }

    // Group requested quantities
    const requestedModelsTotal: Record<string, number> = {};
    const requestedModelsColor: Record<string, Record<string, number>> = {};
    
    for (const m of validModels) {
      if (!requestedModelsTotal[m.model]) requestedModelsTotal[m.model] = 0;
      requestedModelsTotal[m.model] += m.quantity;
      
      if (m.color && m.color !== 'Any') {
        if (!requestedModelsColor[m.model]) requestedModelsColor[m.model] = {};
        if (!requestedModelsColor[m.model][m.color]) requestedModelsColor[m.model][m.color] = 0;
        requestedModelsColor[m.model][m.color] += m.quantity;
      }
    }

    // Checking available quantities globally and by color
    for (const model of Object.keys(requestedModelsTotal)) {
      const overallAvailable = stockByModel[model] || 0;
      if (requestedModelsTotal[model] > overallAvailable) {
        alert(`Cannot create request. Only ${overallAvailable} total available in stock for ${model}. You requested ${requestedModelsTotal[model]}.`);
        return;
      }
      
      if (requestedModelsColor[model]) {
        for (const color of Object.keys(requestedModelsColor[model])) {
          const colorAvailable = (stockByModelColor[model] && stockByModelColor[model][color]) || 0;
          if (requestedModelsColor[model][color] > colorAvailable) {
             alert(`Cannot create request. Only ${colorAvailable} available in stock for ${model} (${color}). You requested ${requestedModelsColor[model][color]}.`);
             return;
          }
        }
      }
    }

    // Group requested parts
    const requestedPartsTotal: Record<string, {name: string, quantity: number}> = {};
    for (const p of validParts) {
      if (!requestedPartsTotal[p.partId]) requestedPartsTotal[p.partId] = { name: p.partName, quantity: 0 };
      requestedPartsTotal[p.partId].quantity += p.quantity;
    }

    for (const partId of Object.keys(requestedPartsTotal)) {
      const invPart = parts.find(inv => inv.id === partId);
      const available = invPart ? invPart.quantity : 0;
      const requestedQty = requestedPartsTotal[partId].quantity;
      if (requestedQty > available) {
        alert(`Cannot create request. Only ${available} available in stock for ${requestedPartsTotal[partId].name}. You requested ${requestedQty}.`);
        return;
      }
    }

    try {
      await onCreateSubDealerSale({
        subDealerName: formData.subDealerName,
        subDealerAddress: formData.subDealerAddress,
        subDealerPhone: formData.subDealerPhone,
        models: validModels,
        parts: validParts,
        totalAmount: typeof formData.totalAmount === 'number' ? formData.totalAmount : 0,
        remarks: formData.remarks,
        status: 'pending',
        requestDate: new Date().toISOString()
      });
      setIsFormOpen(false);
      setFormData({ subDealerName: '', subDealerAddress: '', subDealerPhone: '', totalAmount: '', remarks: '', models: [], parts: [] });
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const addModelRow = () => {
    setFormData(prev => ({ ...prev, models: [...prev.models, { model: '', color: 'Any', quantity: '' }] }));
  };

  const updateModelRow = (index: number, field: 'model' | 'color' | 'quantity', value: any) => {
    setFormData(prev => {
      const newModels = [...prev.models];
      newModels[index] = { ...newModels[index], [field]: value };
      return { ...prev, models: newModels };
    });
  };

  const removeModelRow = (index: number) => {
    setFormData(prev => ({ ...prev, models: prev.models.filter((_, i) => i !== index) }));
  };

  const addPartRow = () => {
    setFormData(prev => ({ ...prev, parts: [...prev.parts, { partId: '', partName: '', quantity: '' }] }));
  };

  const updatePartRow = (index: number, field: 'partId' | 'quantity', value: any) => {
    setFormData(prev => {
      const newParts = [...prev.parts];
      if (field === 'partId') {
        const part = parts.find(p => p.id === value);
        newParts[index] = { ...newParts[index], partId: value, partName: part ? part.name : '' };
      } else {
        newParts[index] = { ...newParts[index], quantity: value };
      }
      return { ...prev, parts: newParts };
    });
  };

  const removePartRow = (index: number) => {
    setFormData(prev => ({ ...prev, parts: prev.parts.filter((_, i) => i !== index) }));
  };

  const toggleExpand = (id: string) => {
    setExpandedSaleId(prev => prev === id ? null : id);
  };

  const handlePrintInvoice = (req: SubDealerSale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print invoices');
      return;
    }
    
    // Fallbacks
    const reqModels = req.models || (req.vehicleModel ? [{ model: req.vehicleModel, quantity: req.quantity || 0 }] : []);
    const reqParts = req.parts || [];

    let printItemIndex = 1;
    let modelsHtml = '';
    reqModels.forEach(m => {
      let chassisHtml = '';
      if (req.status === 'completed' && m.selectedVehicles && m.selectedVehicles.length > 0) {
        chassisHtml = `<div style="font-size: 11px; color: #666; margin-top: 4px;">Chassis Number(s): ${m.selectedVehicles.map(v => v.chassisNumber).join(', ')}</div>`;
      }
      const modelColor = (m as any).color && (m as any).color !== 'Any' ? ` (${(m as any).color})` : '';
      modelsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${printItemIndex++}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${m.model}${modelColor}${chassisHtml}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${m.quantity}</td>
        </tr>
      `;
    });

    let partsHtml = '';
    reqParts.forEach(p => {
       partsHtml += `
         <tr>
           <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${printItemIndex++}</td>
           <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.partName} (Component/Part)</td>
           <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${p.quantity}</td>
         </tr>
       `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${req.subDealerName}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SUB-DEALER INVOICE</h1>
          </div>
          <div class="info">
            <div>
              <strong>Billed To:</strong><br/>
              ${req.subDealerName}<br/>
              ${req.subDealerAddress || ''}<br/>
              Phone: ${req.subDealerPhone || ''}
            </div>
            <div style="text-align: right;">
              <strong>Date:</strong> ${new Date(req.requestDate).toLocaleDateString()}<br/>
              <strong>Status:</strong> ${req.status.toUpperCase()}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 60px;">S.No</th>
                <th>Item / Description</th>
                <th style="text-align: center;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${modelsHtml}
              ${partsHtml}
            </tbody>
          </table>
          ${req.remarks ? `<div style="margin-top: 20px;"><strong>Remarks:</strong> ${req.remarks}</div>` : ''}
          <div style="margin-top: 30px; text-align: right; font-size: 1.2em;">
            <strong>Total Amount: </strong> ₹${(req.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <script>
            window.onload = function() { window.print(); window.setTimeout(function(){ window.close(); }, 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (viewingSubDealer) {
    const dealerSales = subDealerSales.filter(s => s.subDealerName === viewingSubDealer).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    const totalTransactions = dealerSales.length;
    const completedTransactions = dealerSales.filter(s => s.status === 'completed');
    const totalBought = completedTransactions.reduce((acc, sale) => {
      const models = sale.models || (sale.vehicleModel ? [{ model: sale.vehicleModel, quantity: sale.quantity || 0 }] : []);
      const parts = sale.parts || [];
      return acc + models.reduce((a, m) => a + m.quantity, 0) + parts.reduce((a, p) => a + p.quantity, 0);
    }, 0);
    const totalAmount = completedTransactions.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);

    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => setViewingSubDealer(null)} 
            className="p-2 bg-slate-100 text-slate-600 rounded-sm hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#006699] uppercase tracking-wide">{viewingSubDealer} Detailed History</h2>
            <p className="text-slate-500 mt-1">View all past and current requests and purchases.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#f0f0f0] p-4 border border-slate-300 mb-4">
             <div className="p-3 bg-blue-50 rounded-sm text-blue-600">
               <Package className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm font-medium text-slate-500">Total Transactions</p>
               <p className="text-2xl font-bold text-slate-800">{totalTransactions}</p>
             </div>
          </div>
          <div className="bg-[#f0f0f0] p-4 border border-slate-300 mb-4">
             <div className="p-3 bg-green-50 rounded-sm text-green-600">
               <Check className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm font-medium text-slate-500">Items Purchased</p>
               <p className="text-2xl font-bold text-slate-800">{totalBought}</p>
             </div>
          </div>
          <div className="bg-[#f0f0f0] p-4 border border-slate-300 mb-4">
             <div className="p-3 bg-amber-50 rounded-sm text-amber-600">
               <BarChart className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm font-medium text-slate-500">Total Billed</p>
               <p className="text-2xl font-bold text-slate-800">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 text-lg">Transaction History</h3>
          {dealerSales.map(req => {
            const requestModels = req.models || (req.vehicleModel ? [{ model: req.vehicleModel, quantity: req.quantity || 0 }] : []);
            const requestParts = req.parts || [];
            return (
              <div key={req.id} className="bg-white rounded-sm border border-slate-300 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${
                      req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                    <p className="text-sm text-slate-500 break-words line-clamp-2">{req.remarks || '-'}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-slate-800 text-lg">₹{(req.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-400">{new Date(req.requestDate).toLocaleDateString()}</p>
                    <button 
                      onClick={() => handlePrintInvoice(req)}
                      className="mt-2 text-xs flex items-center sm:justify-end text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Printer className="w-3 h-3 mr-1" />
                      Invoice/PDF
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requestModels.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-sm border border-slate-100">
                       <h6 className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-300 pb-1">Vehicles</h6>
                       <ul className="space-y-1">
                         {requestModels.map((m, i) => (
                           <li key={i} className="text-xs">
                             <div className="flex justify-between font-medium text-slate-700">
                               <span>{m.model} {(m as any).color && (m as any).color !== 'Any' ? `(${(m as any).color})` : ''}</span>
                               <span>x{m.quantity}</span>
                             </div>
                             {req.status === 'completed' && m.selectedVehicles && m.selectedVehicles.length > 0 && (
                               <div className="mt-1 text-[10px] text-slate-500 flex flex-wrap gap-1">
                                 {m.selectedVehicles.map((v: any) => (
                                   <span key={v.id} className="bg-white px-1 py-0.5 rounded border border-slate-300">{v.chassisNumber}</span>
                                 ))}
                               </div>
                             )}
                           </li>
                         ))}
                       </ul>
                    </div>
                  )}
                  {requestParts.length > 0 && (
                     <div className="bg-slate-50 p-3 rounded-sm border border-slate-100">
                       <h6 className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-300 pb-1">Parts</h6>
                       <ul className="space-y-1 text-xs">
                         {requestParts.map((p, i) => (
                           <li key={i} className="flex justify-between font-medium text-slate-700">
                             <span>{p.partName}</span>
                             <span>x{p.quantity}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-lg font-bold text-[#006699] uppercase tracking-wide">Stock Management</h2>
          <p className="text-slate-500 mt-1">Manage overall vehicle stock and sub-dealer bulk requests.</p>
        </div>
        {!isFormOpen && (
          <button
             onClick={() => setIsFormOpen(true)}
             className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Sub-Dealer Request
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-sm border border-slate-300 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <Plus className="w-24 h-24" />
          </div>
          <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center relative z-10">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-sm">
                <Plus className="w-4 h-4" />
              </div>
              Create Sub-Dealer Request
            </h3>
            <button onClick={handleCancelIntent} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-sm">
               <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Sub-Dealer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.subDealerName}
                  onChange={(e) => setFormData({ ...formData, subDealerName: e.target.value })}
                  className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                  placeholder="e.g. Metro Motors"
                />
              </div>
              
              <div>
                <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Phone Number</label>
                <input
                  type="text"
                  value={formData.subDealerPhone}
                  onChange={(e) => setFormData({ ...formData, subDealerPhone: e.target.value })}
                  className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                  placeholder="e.g. +91 9876543210"
                />
              </div>

               <div className="md:col-span-2 lg:col-span-1">
                <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Address</label>
                <input
                  type="text"
                  value={formData.subDealerAddress}
                  onChange={(e) => setFormData({ ...formData, subDealerAddress: e.target.value })}
                  className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                  placeholder="e.g. 123 Main St"
                />
              </div>

               <div>
                <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Total Amount (₹)</label>
                <input
                  type="number" step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, totalAmount: val === '' ? '' : parseFloat(val) })
                  }}
                  className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Remarks / Notes</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                  placeholder="Any additional details"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-8">
              {/* Models Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-slate-700">Vehicle Models Sold</h4>
                  <button type="button" onClick={addModelRow} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                    <Plus className="w-4 h-4 mr-1"/> Add Model
                  </button>
                </div>
                {formData.models.map((mRow, index) => {
                  const availableColorsObj = mRow.model ? stockByModelColor[mRow.model] : null;
                  const allAvailableColors = availableColorsObj ? Object.keys(availableColorsObj).filter(c => c !== 'Total') : [];
                  const absoluteMax = mRow.color === 'Any' || !mRow.color 
                    ? (stockByModel[mRow.model] || 0) 
                    : (availableColorsObj && availableColorsObj[mRow.color] ? availableColorsObj[mRow.color] : 0);
                  
                  let usedInOtherRows = 0;
                  const usedColorQuantities: Record<string, number> = {};
                  formData.models.forEach((otherRow, otherIndex) => {
                    if (otherIndex !== index && otherRow.model === mRow.model && typeof otherRow.quantity === 'number') {
                      if (mRow.color === 'Any' || otherRow.color === 'Any' || otherRow.color === mRow.color) {
                        usedInOtherRows += otherRow.quantity;
                      }
                      if (otherRow.color && otherRow.color !== 'Any') {
                        usedColorQuantities[otherRow.color] = (usedColorQuantities[otherRow.color] || 0) + otherRow.quantity;
                      }
                    }
                  });
                  
                  const maxAvailable = Math.max(0, absoluteMax - usedInOtherRows);

                  // Filter colors to only show those that have stock > 0 after considering other rows.
                  const filteredAvailableColors = allAvailableColors.filter(c => {
                    const avail = availableColorsObj?.[c] || 0;
                    const used = usedColorQuantities[c] || 0;
                    return (avail - used > 0) || c === mRow.color;
                  });

                  return (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 mb-3 p-3 bg-slate-50 border border-slate-300 rounded-sm items-center">
                      <div className="flex-1">
                        <select
                          required
                          value={mRow.model}
                          onChange={(e) => updateModelRow(index, 'model', e.target.value)}
                          className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                        >
                          <option value="" disabled>Select model...</option>
                          {vehicleModels.map(m => (
                            <option key={m.id} value={m.name}>{m.name} (Total Avail: {stockByModel[m.name] || 0})</option>
                          ))}
                        </select>
                      </div>
                      {mRow.model && (
                        <div className="w-full sm:w-40">
                          <select
                            value={mRow.color || 'Any'}
                            onChange={(e) => updateModelRow(index, 'color', e.target.value)}
                            className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                          >
                            <option value="Any">Any Color</option>
                            {filteredAvailableColors.map(c => {
                              const avail = availableColorsObj?.[c] || 0;
                              const used = usedColorQuantities[c] || 0;
                              const remaining = Math.max(0, avail - used);
                              return (
                                <option key={c} value={c}>{c} ({remaining} avail)</option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      <div className="w-full sm:w-32">
                        <input
                          type="number" step="0.01"
                          required
                          placeholder="Qty"
                          value={mRow.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateModelRow(index, 'quantity', val === '' ? '' : parseInt(val));
                          }}
                          className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      {mRow.model && typeof mRow.quantity === 'number' && mRow.quantity > maxAvailable && (
                        <div className="flex items-center text-xs font-medium text-red-600 w-full sm:w-auto">
                          Only {maxAvailable} available
                        </div>
                      )}
                      <button type="button" onClick={() => removeModelRow(index)} className="p-2 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-5 h-5"/>
                      </button>
                    </div>
                  );
                })}
                {formData.models.length === 0 && <p className="text-sm text-slate-400 italic">No vehicle models added.</p>}
              </div>

              {/* Parts Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-slate-700">Parts Sold</h4>
                  <button type="button" onClick={addPartRow} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                    <Plus className="w-4 h-4 mr-1"/> Add Part
                  </button>
                </div>
                {formData.parts.map((pRow, index) => {
                  const selectedPart = parts.find(p => p.id === pRow.partId);
                  return (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 mb-3 p-3 bg-slate-50 border border-slate-300 rounded-sm">
                      <div className="flex-1">
                        <select
                          required
                          value={pRow.partId}
                          onChange={(e) => updatePartRow(index, 'partId', e.target.value)}
                          className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                        >
                          <option value="" disabled>Select part...</option>
                          {parts.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Avail: {p.quantity})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-32">
                        <input
                          type="number" step="0.01"
                          required
                          placeholder="Qty"
                          value={pRow.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            updatePartRow(index, 'quantity', val === '' ? '' : parseInt(val));
                          }}
                          className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      {selectedPart && typeof pRow.quantity === 'number' && pRow.quantity > selectedPart.quantity && (
                        <div className="flex items-center text-xs font-medium text-red-600">
                          Only {selectedPart.quantity} available
                        </div>
                      )}
                      <button type="button" onClick={() => removePartRow(index)} className="p-2 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-5 h-5"/>
                      </button>
                    </div>
                  );
                })}
                {formData.parts.length === 0 && <p className="text-sm text-slate-400 italic">No parts added.</p>}
              </div>
            </div>
            
             <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
               <button
                type="button"
                onClick={handleCancelIntent}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors"
               >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Overview Metrics */}
       <h3 className="text-lg font-bold text-[#006699] uppercase tracking-wide mt-6 mb-4">Stock Overview</h3>
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#f0f0f0] p-4 border border-slate-300 mb-4">
           <div className="p-3 bg-blue-50 rounded-sm text-blue-600">
             <Car className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm font-medium text-slate-500">Available Qty of Vehicles</p>
             <p className="text-2xl font-bold text-slate-800">{totalAvailableQty}</p>
           </div>
        </div>

         <div className="bg-[#f0f0f0] p-4 border border-slate-300 mb-4">
           <div className="p-3 bg-green-50 rounded-sm text-green-600">
             <Check className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm font-medium text-slate-500">Vehicles Sold</p>
             <p className="text-2xl font-bold text-slate-800">{totalVehiclesSold}</p>
           </div>
        </div>

         <div className="bg-[#f0f0f0] p-4 border border-slate-300 mb-4">
           <div className="p-3 bg-amber-50 rounded-sm text-amber-600">
             <BarChart className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm font-medium text-slate-500">Total Revenue</p>
             <p className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
           </div>
        </div>
       </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(stockByModel).map(([model, count]) => (
          <div key={model} className="bg-[#f0f0f0] p-3 border border-slate-300 mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Model</span>
            <span className="text-md font-bold text-slate-800 truncate mb-2" title={model}>{model}</span>
            <span className="text-sm font-medium text-slate-600 inline-block bg-slate-100 rounded px-2 py-1 self-start">
              Qty: <span className="font-bold text-slate-800">{count}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Sub Dealer Requests */}
      <h3 className="text-lg font-bold text-[#006699] uppercase tracking-wide mt-6 mb-4">Sub-Dealer Requests</h3>
      
      <div className="bg-[#f0f0f0] p-3 border border-slate-300 mb-4">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div>
             <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Search Dealer</label>
             <input 
               type="text" 
               className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400" 
               placeholder="Search by name..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
           <div>
             <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Status</label>
             <select 
               className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
             >
               <option value="all">All</option>
               <option value="pending">Pending</option>
               <option value="completed">Completed</option>
             </select>
           </div>
           <div>
             <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Date From</label>
             <input 
               type="date" 
               className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
               value={dateFrom}
               onChange={(e) => setDateFrom(e.target.value)}
             />
           </div>
           <div>
             <label className="text-[#cc0000] text-[11px] mb-1 font-medium select-none uppercase">Date To</label>
             <input 
               type="date" 
               className="w-full px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400"
               value={dateTo}
               onChange={(e) => setDateTo(e.target.value)}
             />
           </div>
         </div>
      </div>

      <div className="border border-slate-300 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] text-left border-collapse">
            <thead className="bg-[#ececec] border-b border-slate-300 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                 <th className="px-2 py-1 border-r border-slate-300 last:border-r-0">S.No</th>
                 <th className="px-2 py-1 border-r border-slate-300 last:border-r-0">Date</th>
                 <th className="px-2 py-1 border-r border-slate-300 last:border-r-0">Sub-Dealer</th>
                 <th className="px-2 py-1 border-r border-slate-300 last:border-r-0">Contact</th>
                 <th className="px-2 py-1 border-r border-slate-300 last:border-r-0">Items</th>
                 <th className="px-2 py-1 border-r border-slate-300 last:border-r-0">Amount</th>
                 <th className="px-2 py-1 border-r border-slate-300 last:border-r-0">Remarks</th>
                 <th className="px-4 py-3 text-center">Status</th>
                 <th className="px-4 py-3 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSubDealerSales.length === 0 ? (
                 <tr>
                   <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                     No sub-dealer requests found matching criteria.
                   </td>
                 </tr>
               ) : (
                 filteredSubDealerSales.map((req, index) => {
                   const isExpanded = expandedSaleId === req.id;
                   
                   // Fallback for legacy records
                   const requestModels = req.models || (req.vehicleModel ? [{ model: req.vehicleModel, color: 'Any', quantity: req.quantity || 0 }] : []);
                   const requestParts = req.parts || [];
                   const totalItemsQty = requestModels.reduce((acc, m) => acc + m.quantity, 0) + requestParts.reduce((acc, p) => acc + p.quantity, 0);

                   return (
                     <React.Fragment key={req.id}>
                     <tr className={`hover:bg-[#ececec] transition-colors cursor-pointer group ${isExpanded ? 'bg-slate-50/50' : ''}`} onClick={() => toggleExpand(req.id)}>
                       <td className="px-4 py-4 text-slate-400 font-mono text-xs">
                         {index + 1}
                       </td>
                       <td className="px-4 py-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                         {new Date(req.requestDate).toLocaleDateString()}
                       </td>
                       <td className="px-4 py-4 font-medium text-slate-900 border-l border-transparent">
                          <button 
                            className="font-medium text-indigo-600 hover:text-indigo-700 flex items-center transition-colors"
                            onClick={(e) => { e.stopPropagation(); setViewingSubDealer(req.subDealerName); }}
                          >
                            {req.subDealerName}
                          </button>
                          <button 
                            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center mt-1 uppercase tracking-wider font-semibold transition-colors"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(req.id); }}
                          >
                            {isExpanded ? 'Hide Details' : 'View Quick Details'}
                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                          </button>
                       </td>
                       <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                         <div className="flex flex-col text-xs space-y-1">
                           <span className="font-mono text-slate-500">{req.subDealerPhone || '-'}</span>
                           <span className="truncate max-w-[150px] text-slate-400">{req.subDealerAddress || '-'}</span>
                         </div>
                       </td>
                       <td className="px-4 py-4 text-slate-700">
                         <span className="font-bold text-slate-800">{totalItemsQty}</span> <span className="text-xs text-slate-500 uppercase tracking-wider">items</span>
                       </td>
                       <td className="px-4 py-4 text-slate-800 font-bold whitespace-nowrap tracking-tight">₹{(req.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                       <td className="px-4 py-4 text-slate-500 text-xs truncate max-w-[150px]">{req.remarks || '-'}</td>
                       <td className="px-4 py-4 text-center">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                           req.status === 'completed'
                             ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                             : 'bg-amber-50 text-amber-700 border border-amber-100'
                         }`}>
                           {req.status === 'completed' ? 'Completed' : 'Pending'}
                         </span>
                       </td>
                       <td className="px-4 py-4 text-right">
                         <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                           {req.status === 'pending' ? (
                             <>
                               <button
                                 onClick={() => onCompleteSubDealerSale(req)}
                                 className="inline-flex items-center px-2 py-1.5 bg-green-600 text-white rounded-sm text-xs font-medium hover:bg-green-700 transition-colors"
                                 title="Complete"
                               >
                                 <Check className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={() => setDeletingSaleReq(req)}
                                 className="inline-flex items-center px-2 py-1.5 bg-red-500 text-white rounded-sm text-xs font-medium hover:bg-red-600 transition-colors"
                                 title="Delete Request"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           ) : (
                              <button
                               onClick={() => setRevertingSaleReq(req)}
                               className="inline-flex items-center px-3 py-1.5 bg-amber-500 text-white rounded-sm text-xs font-medium hover:bg-amber-600 transition-colors"
                               title="Revert to Pending"
                             >
                               <RefreshCw className="w-3.5 h-3.5 mr-1" />
                               Revert
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                     
                     {/* Expanded Row Details */}
                     {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0 border-b border-slate-300">
                            <div className="bg-slate-50 px-8 py-5 border-t border-slate-300/60 shadow-inner">
                              <div className="flex justify-between items-center mb-4">
                                <h5 className="font-semibold text-slate-800 text-sm flex items-center uppercase tracking-wider">
                                  <Info className="w-4 h-4 mr-2 text-slate-400" />
                                  Invoice & Details
                                </h5>
                                <button 
                                  onClick={() => handlePrintInvoice(req)}
                                  className="flex items-center text-sm px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-sm font-medium transition-colors"
                                >
                                  <Printer className="w-4 h-4 mr-1.5" />
                                  Print Invoice
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <h6 className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-300 pb-1">Vehicle Models</h6>
                                  {requestModels.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No vehicles.</p>
                                  ) : (
                                    <ul className="space-y-2">
                                      {requestModels.map((m, i) => (
                                        <li key={i} className="text-sm flex flex-col bg-white px-2 py-1 text-[13px] rounded shadow-sm border border-slate-100">
                                          <div className="flex justify-between">
                                            <span className="font-medium text-slate-700">{m.model}</span>
                                            <span className="font-semibold text-slate-800">x{m.quantity}</span>
                                          </div>
                                          {req.status === 'completed' && m.selectedVehicles && m.selectedVehicles.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                                              <span className="font-semibold block mb-1">Assigned Chassis No:</span>
                                              <div className="flex flex-wrap gap-1">
                                                {m.selectedVehicles.map((v: any) => (
                                                  <span key={v.id} className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-300">
                                                    {v.chassisNumber}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                <div>
                                  <h6 className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-300 pb-1">Parts & Components</h6>
                                  {requestParts.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No parts.</p>
                                  ) : (
                                    <ul className="space-y-1">
                                      {requestParts.map((p, i) => (
                                        <li key={i} className="text-sm flex justify-between bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                                          <span className="font-medium text-slate-700">{p.partName}</span>
                                          <span className="font-semibold text-slate-800">x{p.quantity}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                     )}
                     </React.Fragment>
                   )
                 })
               )}
            </tbody>
           </table>
         </div>
       </div>

      <ConfirmDialog
        isOpen={deletingSaleReq !== null}
        title="Delete Request"
        message="Are you sure you want to delete this sub-dealer request? This action cannot be undone."
        onConfirm={async () => {
          if (deletingSaleReq) {
            await onDeleteSubDealerSale(deletingSaleReq);
            setDeletingSaleReq(null);
          }
        }}
        onCancel={() => setDeletingSaleReq(null)}
      />

      <ConfirmDialog
        isOpen={revertingSaleReq !== null}
        title="Revert Request"
        message="Are you sure you want to revert this completed request back to pending? This will return the assigned vehicles and parts back to stock."
        confirmLabel="Revert"
        onConfirm={async () => {
          if (revertingSaleReq) {
            await onRevertSubDealerSale(revertingSaleReq);
            setRevertingSaleReq(null);
          }
        }}
        onCancel={() => setRevertingSaleReq(null)}
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this form. If you close now, your changes will be lost."
        confirmLabel="Discard Changes"
        onConfirm={() => {
          setIsFormOpen(false);
          setFormData({ subDealerName: '', subDealerAddress: '', subDealerPhone: '', totalAmount: '', remarks: '', models: [], parts: [] });
          setShowCancelConfirm(false);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
