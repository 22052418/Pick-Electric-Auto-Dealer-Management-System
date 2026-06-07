import React, { useState, useMemo } from 'react';
import { Car, IndianRupee, BatteryCharging, Zap, ShoppingCart, CheckCircle2, TrendingUp, TrendingDown, Minus, Package, Box } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart } from 'recharts';
import { Vehicle, Sale, Part, SubDealerSale } from '../types';

interface DashboardCardsProps {
  vehicles?: Vehicle[];
  sales?: Sale[];
  parts?: Part[];
  subDealerSales?: SubDealerSale[];
}

export function DashboardCards({ 
  vehicles = [],
  sales = [],
  parts = [],
  subDealerSales = []
}: DashboardCardsProps) {
  
  const [vehicleTimePeriod, setVehicleTimePeriod] = useState<'month'|'year'>('month');
  const [partsTimePeriod, setPartsTimePeriod] = useState<'month'|'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const getPeriodKey = (dateStr: string, period: 'month' | 'year') => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown';
    if (period === 'year') {
      return d.getFullYear().toString();
    } else {
      return d.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
  };

  const vehicleChartData = useMemo(() => {
    const grouped: Record<string, { name: string, count: number, revenue: number, timestamp: number }> = {};
    sales.forEach(s => {
      if (!s.saleDate) return;
      const key = getPeriodKey(s.saleDate, vehicleTimePeriod);
      if(!grouped[key]) {
        grouped[key] = { name: key, count: 0, revenue: 0, timestamp: new Date(s.saleDate).setHours(0,0,0,0) };
      }
      grouped[key].count += 1;
      grouped[key].revenue += s.totalAmount || 0;
    });
    return Object.values(grouped).sort((a,b) => a.timestamp - b.timestamp).slice(-12);
  }, [sales, vehicleTimePeriod]);

  const partsChartData = useMemo(() => {
    const grouped: Record<string, { name: string, itemsCount: number, revenue: number, timestamp: number }> = {};
    subDealerSales.filter(s => s.status === 'completed').forEach(s => {
      if (!s.requestDate) return;
      const key = getPeriodKey(s.requestDate, partsTimePeriod);
      if(!grouped[key]) {
        grouped[key] = { name: key, itemsCount: 0, revenue: 0, timestamp: new Date(s.requestDate).setHours(0,0,0,0) };
      }
      
      let pCount = 0;
      if (s.parts) {
          pCount += s.parts.reduce((sum, p) => sum + (p.quantity || 0), 0);
      }
      if (s.models) {
          pCount += s.models.reduce((sum, m) => sum + (m.quantity || 0), 0);
      }
      if (s.quantity) {
          pCount += s.quantity; // legacy support
      }
      
      grouped[key].itemsCount += pCount;
      grouped[key].revenue += (s.totalAmount || 0);
    });
    return Object.values(grouped).sort((a,b) => a.timestamp - b.timestamp).slice(-12);
  }, [subDealerSales, partsTimePeriod]);

  // Aggregate Metrics
  const totalProducedCount = vehicles.length;
  const totalSoldCount = vehicles.filter(v => v.status === 'Sold').length;
  const availableStockCount = vehicles.filter(v => v.status === 'In Stock').length;

  const revenueFromVehicles = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const revenueFromParts = subDealerSales.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const totalPartsCount = parts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const uniquePartsCount = parts.length;

  const cards = [
    {
      title: 'Total Vehicles Produced',
      value: totalProducedCount.toLocaleString('en-IN'),
      icon: Car,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Total Vehicles Sold',
      value: totalSoldCount.toLocaleString('en-IN'),
      icon: ShoppingCart,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Available Vehicle Stock',
      value: availableStockCount.toLocaleString('en-IN'),
      icon: CheckCircle2,
      color: 'bg-sky-500',
      lightColor: 'bg-sky-50',
      textColor: 'text-sky-600',
    },
    {
      title: 'Revenue from Vehicles Sold',
      value: formatCurrency(revenueFromVehicles),
      icon: IndianRupee,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      title: 'Revenue from Parts Sold',
      value: formatCurrency(revenueFromParts),
      icon: IndianRupee,
      color: 'bg-fuchsia-500',
      lightColor: 'bg-fuchsia-50',
      textColor: 'text-fuchsia-600',
    },
    {
      title: 'Total Parts in Stock',
      value: totalPartsCount.toLocaleString('en-IN'),
      icon: Package,
      color: 'bg-rose-500',
      lightColor: 'bg-rose-50',
      textColor: 'text-rose-600',
    },
    {
      title: 'Different Types of Parts Available',
      value: uniquePartsCount.toLocaleString('en-IN'),
      icon: Box,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-8 w-full pb-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-[#f0f0f0] p-4 border border-slate-300 shadow-sm transition-all sm:rounded-sm hover:bg-[#e8e8e8]">
              <div className=""></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-2.5 rounded-sm ${card.lightColor} shadow-sm border border-slate-300`}>
                  <Icon className={`w-5 h-5 ${card.textColor}`} />
                </div>
              </div>
              
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">{card.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-[#006699] uppercase tracking-wide">{card.value}</h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        {/* Vehicles Sold & Revenue */}
        <div className="bg-[#f0f0f0] p-4 border border-slate-300 shadow-sm sm:rounded-sm">
          <div className="bg-[#dcdcdc] px-3 py-1.5 border-b border-slate-300 flex justify-between items-center mb-4 gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#006699] uppercase tracking-wide">Vehicles Sold & Revenue</h3>
              <p className="text-xs text-slate-500 mt-1">Industry-level view of retail vehicle sales.</p>
            </div>
            <select 
              value={vehicleTimePeriod} 
              onChange={e => setVehicleTimePeriod(e.target.value as any)}
              className="px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            {vehicleChartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">No vehicle sales data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={vehicleChartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => val.toLocaleString('en-IN')} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Revenue') return [formatCurrency(value as number), name];
                      return [value, 'Vehicles Sold'];
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="count" name="Vehicles Sold" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Parts Sold & Revenue */}
        <div className="bg-[#f0f0f0] p-4 border border-slate-300 shadow-sm sm:rounded-sm">
          <div className="bg-[#dcdcdc] px-3 py-1.5 border-b border-slate-300 flex justify-between items-center mb-4 gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#006699] uppercase tracking-wide">Revenue from Parts Sold</h3>
              <p className="text-xs text-slate-500 mt-1">Industry-level view of bulk parts/items moving to dealers.</p>
            </div>
            <select 
              value={partsTimePeriod} 
              onChange={e => setPartsTimePeriod(e.target.value as any)}
              className="px-2 py-1 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            {partsChartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">No sub-dealer sales data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={partsChartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => val.toLocaleString('en-IN')} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Revenue') return [formatCurrency(value as number), name];
                      return [value, 'Items Sold'];
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="itemsCount" name="Items Sold" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

