import React, { useState, useMemo } from 'react';
import { Sale, Vehicle } from '../types';
import { Plus, X, Save, ShoppingCart, IndianRupee, Search } from 'lucide-react';

interface SalesManagementProps {
  sales: Sale[];
  vehicles: Vehicle[];
  onAddSale: (sale: Sale) => void;
}

const initialSaleForm: Omit<Sale, 'id' | 'invoiceId'> = {
  customerName: '',
  phoneNumber: '',
  address: '',
  chassisNumber: '',
  vehicleModel: '',
  sellingPrice: 0,
  gstAmount: 0,
  totalAmount: 0,
  saleDate: new Date().toISOString().split('T')[0],
};

export function SalesManagement({ sales, vehicles, onAddSale }: SalesManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialSaleForm);
  const [searchTerm, setSearchTerm] = useState('');

  const availableVehicles = vehicles.filter(v => v.status === 'In Stock');

  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales;
    const lower = searchTerm.toLowerCase();
    return sales.filter(s => 
      s.customerName.toLowerCase().includes(lower) || 
      s.chassisNumber.toLowerCase().includes(lower) ||
      s.invoiceId.toLowerCase().includes(lower)
    );
  }, [sales, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'chassisNumber') {
        const vehicle = availableVehicles.find(v => v.chassisNumber === value);
        if (vehicle) {
          updated.vehicleModel = vehicle.model;
        } else {
          updated.vehicleModel = '';
        }
      }
      
      if (name === 'sellingPrice') {
        const price = value === '' ? '' : parseFloat(value) || 0;
        updated.sellingPrice = price as any;
        updated.gstAmount = typeof price === 'number' ? price * 0.05 : 0;
        updated.totalAmount = typeof price === 'number' ? price + updated.gstAmount : 0;
      }
      
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.chassisNumber) {
      alert("Please select a chassis number.");
      return;
    }
    
    const newSale: Sale = {
      ...formData,
      id: Date.now().toString(),
      invoiceId: `INV-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
    };
    
    onAddSale(newSale);
    setFormData(initialSaleForm);
    setIsFormOpen(false);
  };

  const handleCancel = () => {
    setFormData(initialSaleForm);
    setIsFormOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Sales Management</h2>
          <p className="text-slate-500 mt-1">Record vehicle sales and generate invoices.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-[16px] border border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:shadow-md transition-all overflow-hidden relative group">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Record New Sale</h3>
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Customer Details */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-slate-100 font-medium text-slate-800">
                Customer Details
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  placeholder="+91"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  placeholder="Complete postal address"
                />
              </div>

              {/* Vehicle Selection */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-slate-100 font-medium text-slate-800 mt-2">
                Vehicle Details
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chassis Number</label>
                <select
                  name="chassisNumber"
                  required
                  value={formData.chassisNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Select Available Vehicle --</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.chassisNumber}>
                      {v.chassisNumber} ({v.color})
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">No vehicles in stock!</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Model</label>
                <input
                  type="text"
                  name="vehicleModel"
                  readOnly
                  value={formData.vehicleModel || 'Pick Electric'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Sale Details */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 pb-2 border-b border-slate-100 font-medium text-slate-800 mt-2">
                Pricing Details
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₹)</label>
                <input
                  type="number" step="0.01"
                  name="sellingPrice"
                  required
                  min="0"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  placeholder="Base Price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GST (5%)</label>
                <input
                  type="text"
                  readOnly
                  value={formatCurrency(formData.gstAmount)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount</label>
                <input
                  type="text"
                  readOnly
                  value={formatCurrency(formData.totalAmount)}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-emerald-50 text-emerald-700 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sale Date</label>
                <input
                  type="date"
                  name="saleDate"
                  required
                  value={formData.saleDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

            </div>
            
            <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={availableVehicles.length === 0}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                Confirm Sale
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white rounded-[16px] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <h3 className="font-bold text-slate-800 tracking-tight text-lg flex items-center">Sales Records <span className="ml-2 text-sm font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">{filteredSales.length}</span></h3>
          </div>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search customer or chassis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? "No sales match your search." : "No sales recorded yet."}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      {sale.invoiceId}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{sale.customerName}</div>
                      <div className="text-xs text-slate-500">{sale.phoneNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-900">{sale.vehicleModel}</div>
                      <div className="text-xs text-slate-500">Chassis: {sale.chassisNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(sale.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
