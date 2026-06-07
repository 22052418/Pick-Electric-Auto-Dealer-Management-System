import React from 'react';
import { 
  BarChart3, 
  Car, 
  Settings, 
  Package, 
  ShoppingCart, 
  FileText, 
  Wrench, 
  PieChart,
  ShieldAlert,
  X,
  Zap
} from 'lucide-react';
import { UserRole } from '../types';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'specifications', label: 'Vehicle Models', icon: Settings },
  { id: 'production', label: 'Vehicle Production', icon: Car },
  { id: 'stock', label: 'Stock Management', icon: Package },
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'invoice', label: 'Invoice', icon: FileText },
  { id: 'parts', label: 'Parts Inventory', icon: Wrench },
  { id: 'reports', label: 'Reports', icon: PieChart },
];

export function Sidebar({ 
  currentView, 
  setCurrentView, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  userRole 
}: { 
  currentView: string; 
  setCurrentView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  userRole: UserRole | null;
}) {
  const isAdmin = userRole?.role === 'admin';

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        absolute inset-y-0 left-0 z-40 w-[260px] bg-white/70 backdrop-blur-2xl text-slate-800 transform transition-transform duration-300 ease-in-out border-r border-green-500/15 lg:translate-x-0 lg:static lg:inset-auto lg:h-full lg:flex lg:flex-col shadow-[10px_0_30px_rgba(34,197,94,0.1)] lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close button only */}
        <div className="flex items-center justify-end h-16 px-4 lg:hidden border-b border-green-500/10 bg-white/50 backdrop-blur-sm">
          <button 
            className="p-2 rounded-xl text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 px-4 py-8 space-y-2 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="text-[10px] items-center flex font-bold tracking-[0.2em] text-slate-400 uppercase mb-5 ml-4">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-2 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
            Main Menu
          </div>
          {navItems.map((item) => {
            // Check permissions
            const hasAccess = (() => {
              if (isAdmin) return true;
              if (item.id === 'production') return userRole?.permissions?.some(p => ['production', 'add_vehicle', 'reduce_vehicle', 'update_vehicle'].includes(p));
              if (item.id === 'parts') return userRole?.permissions?.some(p => ['parts', 'add_parts', 'reduce_parts'].includes(p));
              return userRole?.permissions?.includes(item.id);
            })();
            if (!hasAccess) return null;

            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  flex items-center w-full px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_16px_rgba(34,197,94,0.4)] hover:-translate-y-0.5' 
                    : 'text-slate-500 hover:bg-white/60 hover:text-green-700 border border-transparent hover:border-green-500/10'
                  }
                `}
              >
                <div className={`p-1.5 rounded-xl mr-3 transition-colors duration-300 ${isActive ? 'bg-white/20 text-white' : 'text-slate-400 group-hover:text-green-500 group-hover:bg-green-50/50'}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
