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
        absolute inset-y-0 left-0 z-40 w-[260px] bg-[#dcdcdc] text-slate-800 transform transition-transform duration-300 ease-in-out border-r border-slate-300 lg:translate-x-0 lg:static lg:inset-auto lg:h-full lg:flex lg:flex-col shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close button only */}
        <div className="flex items-center justify-end h-16 px-4 lg:hidden border-b border-slate-300 bg-[#ececec]">
          <button 
            className="p-2 rounded-sm text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 px-4 py-8 space-y-2 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="text-[10px] items-center flex font-bold tracking-[0.2em] text-slate-400 uppercase mb-5 ml-4">
            <span className="w-2 h-2 rounded-full bg-[#006699] mr-2"></span>
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
                  flex items-center w-full px-4 py-3 text-sm font-medium rounded-sm transition-all duration-300 group relative
                  ${isActive 
                    ? 'bg-[#006699] text-white shadow-none' 
                    : 'text-slate-600 hover:bg-[#c8c8c8] text-slate-800 border border-transparent'
                  }
                `}
              >
                <div className={`p-1.5 rounded-sm mr-3 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#006699]'}`}>
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
