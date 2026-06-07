import React, { useMemo, useState } from 'react';
import { Vehicle, Sale } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Download, Printer, Filter } from 'lucide-react';

interface ReportsProps {
  vehicles: Vehicle[];
  sales: Sale[];
}

export function Reports({ vehicles, sales }: ReportsProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  // Filtering
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      let valid = true;
      if (modelFilter) valid = valid && v.model.toLowerCase().includes(modelFilter.toLowerCase());
      if (dateFrom && dateTo) {
        try {
          valid = valid && v.productionDate >= dateFrom && v.productionDate <= dateTo;
        } catch { } // Ignore parse errors
      }
      return valid;
    });
  }, [vehicles, modelFilter, dateFrom, dateTo]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      let valid = true;
      if (modelFilter) valid = valid && s.vehicleModel.toLowerCase().includes(modelFilter.toLowerCase());
      if (dateFrom && dateTo) {
        valid = valid && s.saleDate >= dateFrom && s.saleDate <= dateTo;
      }
      return valid;
    });
  }, [sales, modelFilter, dateFrom, dateTo]);

  // Aggregate Data for Charts
  const productionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVehicles.forEach(v => {
      const month = v.productionDate.substring(0, 7); // YYYY-MM
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredVehicles]);

  const salesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSales.forEach(s => {
      const month = s.saleDate.substring(0, 7); // YYYY-MM
      counts[month] = (counts[month] || 0) + (s.totalAmount - s.gstAmount);
    });
    return Object.entries(counts).map(([month, revenue]) => ({ month, revenue })).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredSales]);

  // Totals
  const totalProduction = filteredVehicles.length;
  const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + s.sellingPrice, 0);
  
  // Very simplistic profit inference: Selling Price - Cost Price
  const totalProfit = useMemo(() => {
    return filteredSales.reduce((profit, s) => {
      const vehicle = vehicles.find(v => v.chassisNumber === s.chassisNumber);
      const cost = Number(vehicle?.costPrice) || 0;
      return profit + (s.sellingPrice - cost);
    }, 0);
  }, [filteredSales, vehicles]);

  const exportAsExcel = () => {
    const rows = [
      ['Date', 'Type', 'Model', 'Chassis', 'Amount', 'Profit'],
      ...filteredSales.map(s => {
        const v = vehicles.find(v => v.chassisNumber === s.chassisNumber);
        const profit = s.sellingPrice - (Number(v?.costPrice) || 0);
        return [s.saleDate, 'Sale', s.vehicleModel, s.chassisNumber, s.sellingPrice, profit];
      })
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0 text-sm">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-slate-500 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border-slate-300 rounded-sm p-2 border" />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border-slate-300 rounded-sm p-2 border" />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Model Filter</label>
              <input type="text" placeholder="e.g. Pick Electric" value={modelFilter} onChange={e => setModelFilter(e.target.value)} className="border-slate-300 rounded-sm p-2 border" />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button onClick={exportAsExcel} className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-sm hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
            <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors">
              <Printer className="w-4 h-4 mr-2" /> Print PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-6">
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total Production</h3>
          <p className="text-3xl font-bold text-slate-800">{totalProduction} Unit(s)</p>
        </div>
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-6">
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">₹{totalSalesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-6">
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total Profit (Est)</h3>
          <p className="text-3xl font-bold text-blue-600">₹{totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 font-sans">Monthly Production (Units)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 font-sans">Monthly Sales Revenue (₹)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
