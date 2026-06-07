import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { LogOut, ChevronDown, User } from 'lucide-react';
import { auth } from '../firebase';

interface Props {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: UserRole | null;
  userEmail?: string | null;
}

export function Header({ currentView, setCurrentView, userRole, userEmail }: Props) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const permissions = userRole?.permissions || [];
  const isAdmin = userRole?.role === 'admin';
  const hasAccess = (view: string) => isAdmin || permissions.includes(view);

  const handleNav = (view: string) => {
    setCurrentView(view);
    setActiveDropdown(null);
  };

  return (
    <div className="flex flex-col w-full bg-white font-sans border-b border-slate-300">
      {/* Top Section */}
      <div className="flex justify-between items-end px-4 py-2 bg-white flex-wrap gap-4">
        {/* Logo Area */}
        <div className="flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Pick Electric Auto Pvt Ltd Logo" className="w-14 h-12 sm:w-16 sm:h-14 object-contain" style={{ imageRendering: 'high-quality', WebkitFontSmoothing: 'antialiased' }} />
          <div className="text-center font-sans mt-0.5 uppercase" style={{ lineHeight: '1.1' }}>
            <div className="text-[#e31837] font-black text-xs sm:text-[13px] tracking-tight antialiased">PICK ELECTRIC</div>
            <div className="text-[#0055a4] font-bold text-[0.5rem] sm:text-[8px] tracking-widest whitespace-nowrap mt-0.5 antialiased">AUTO PRIVATE LIMITED</div>
          </div>
        </div>

        {/* Right Info Area */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex border border-gray-300 text-[11px] text-gray-700 divide-x divide-gray-300 shadow-sm bg-white overflow-hidden rounded-sm">
            <div className="px-3 py-1.5 hover:bg-slate-50 hidden sm:block uppercase">{userRole?.dealershipName || 'M/S PICK ELECTRIC AUTO'}</div>
            <div className="px-3 py-1.5 hover:bg-slate-50 hidden sm:block">Branch Code: {userRole?.branchCode || '260016'}</div>
            <div className="px-3 py-1.5 hover:bg-slate-50 hidden sm:block">Branch: {userRole?.branchName || 'Patna'}</div>
            <div className="px-3 py-1.5 hover:bg-slate-50 hidden sm:block">Fin. Year: 2026-2027</div>
            <button 
              onClick={() => auth.signOut()}
              className="px-3 py-1.5 bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
            </button>
          </div>
          <h1 className="text-lg sm:text-[22px] font-bold uppercase tracking-tight text-black mt-1 mr-1">
            DEALER MANAGEMENT SYSTEM
          </h1>
        </div>
      </div>

      {/* Blue Navbar */}
      <div className="bg-[#0088cc] flex justify-between items-stretch text-white shadow-md relative z-50 flex-wrap">
        <div className="flex items-stretch text-sm uppercase font-medium flex-wrap">
          
          <button 
            className={`px-4 py-2.5 border-r border-white hover:bg-[#006699] transition-colors ${currentView === 'dashboard' ? 'bg-[#006699]' : ''}`}
            onClick={() => handleNav('dashboard')}
          >
            DASHBOARD
          </button>

          {(hasAccess('production') || hasAccess('specifications')) && (
            <div className="relative group flex items-stretch">
              <button 
                className="px-4 py-2.5 border-r border-white hover:bg-[#006699] flex items-center gap-1 transition-colors"
                onMouseEnter={() => setActiveDropdown('vehicles')}
                onMouseLeave={() => setActiveDropdown(null)}
                onClick={() => setActiveDropdown(activeDropdown === 'vehicles' ? null : 'vehicles')}
              >
                VEHICLES <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {activeDropdown === 'vehicles' && (
                <div 
                  className="absolute left-0 top-full bg-white border border-gray-200 shadow-sm min-w-[220px] py-1 text-sm normal-case font-normal text-gray-800"
                  onMouseEnter={() => setActiveDropdown('vehicles')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {hasAccess('production') && (
                    <button onClick={() => handleNav('production')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">Vehicle Production</button>
                  )}
                  {hasAccess('specifications') && (
                    <button onClick={() => handleNav('specifications')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-gray-100 transition-all hover:pl-5">Vehicle Specifications</button>
                  )}
                </div>
              )}
            </div>
          )}

          {(hasAccess('parts') || hasAccess('stock') || hasAccess('logs')) && (
            <div className="relative group flex items-stretch">
              <button 
                className="px-4 py-2.5 border-r border-white hover:bg-[#006699] flex items-center gap-1 transition-colors"
                onMouseEnter={() => setActiveDropdown('inventory')}
                onMouseLeave={() => setActiveDropdown(null)}
                onClick={() => setActiveDropdown(activeDropdown === 'inventory' ? null : 'inventory')}
              >
                INVENTORY <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {activeDropdown === 'inventory' && (
                <div 
                  className="absolute left-0 top-full bg-white border border-gray-200 shadow-sm min-w-[220px] py-1 text-sm normal-case font-normal text-gray-800"
                  onMouseEnter={() => setActiveDropdown('inventory')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {hasAccess('parts') && (
                    <button onClick={() => handleNav('parts')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">Parts Inventory</button>
                  )}
                  {hasAccess('stock') && (
                    <button onClick={() => handleNav('stock')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">Stock Management</button>
                  )}
                  {hasAccess('logs') && (
                    <button onClick={() => handleNav('logs')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-gray-100 transition-all hover:pl-5">Inventory Logs</button>
                  )}
                </div>
              )}
            </div>
          )}

          {(hasAccess('sales') || hasAccess('invoices')) && (
            <div className="relative group flex items-stretch">
              <button 
                className="px-4 py-2.5 border-r border-white hover:bg-[#006699] flex items-center gap-1 transition-colors"
                onMouseEnter={() => setActiveDropdown('sales')}
                onMouseLeave={() => setActiveDropdown(null)}
                onClick={() => setActiveDropdown(activeDropdown === 'sales' ? null : 'sales')}
              >
                SALES <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {activeDropdown === 'sales' && (
                <div 
                  className="absolute left-0 top-full bg-white border border-gray-200 shadow-sm min-w-[220px] py-1 text-sm normal-case font-normal text-gray-800"
                  onMouseEnter={() => setActiveDropdown('sales')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {hasAccess('sales') && (
                    <button onClick={() => handleNav('sales')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">Sales Management</button>
                  )}
                  {hasAccess('invoices') && (
                    <button onClick={() => handleNav('invoices')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-gray-100 transition-all hover:pl-5">Invoice System</button>
                  )}
                </div>
              )}
            </div>
          )}

          {hasAccess('reports') && (
            <button 
              className={`px-4 py-2.5 border-r border-white hover:bg-[#006699] transition-colors ${currentView === 'reports' ? 'bg-[#006699]' : ''}`}
              onClick={() => handleNav('reports')}
            >
              REPORTS
            </button>
          )}

          {isAdmin && (
            <div className="relative group flex items-stretch">
              <button 
                className={`px-4 py-2.5 border-r border-white hover:bg-[#006699] flex items-center gap-1 transition-colors ${currentView.startsWith('admin') ? 'bg-[#006699]' : ''}`}
                onMouseEnter={() => setActiveDropdown('admin')}
                onMouseLeave={() => setActiveDropdown(null)}
                onClick={() => setActiveDropdown(activeDropdown === 'admin' ? null : 'admin')}
              >
                ADMIN <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {activeDropdown === 'admin' && (
                <div 
                  className="absolute left-0 top-full bg-white border border-gray-200 shadow-sm min-w-[240px] py-1 text-sm normal-case font-normal text-gray-800"
                  onMouseEnter={() => setActiveDropdown('admin')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button onClick={() => handleNav('admin-all')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all font-semibold border-b-2">Admin Dashboard</button>
                  <button onClick={() => handleNav('admin-display-name')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">Change display name</button>
                  <button onClick={() => handleNav('admin-username-password')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">Change username & password</button>
                  <button onClick={() => handleNav('admin-staff')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">User Management</button>
                  <button onClick={() => handleNav('admin-support')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">Password Reset Requests</button>
                  <button onClick={() => handleNav('admin-helpdesk')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-b border-gray-100 last:border-0 hover:pl-5 transition-all">Help Desk Settings</button>
                  <button onClick={() => handleNav('admin-banners')} className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-[#0088cc] border-gray-100 hover:pl-5 transition-all">Banner Management</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-stretch text-sm flex-grow sm:flex-grow-0 justify-end mt-2 sm:mt-0">
          <div className="px-4 py-2.5 flex items-center gap-2 border-l border-white bg-[#007fb9]">
            <img src="/avatar.png" alt="User" className="w-[18px] h-[18px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <User className="w-[18px] h-[18px] hidden" />
            <span className="truncate max-w-[300px] font-medium text-[13px]">
              {userRole?.name ? `${userRole.name.toUpperCase()}-${userEmail?.split('@')[0]}` : (userEmail || 'USER')}
            </span>
          </div>
          <div className="px-4 py-2.5 bg-[#0099e6] font-medium flex items-center min-w-[200px] justify-center text-sm border-l border-white">
            {currentTime.toString().substring(0, 24)}
          </div>
        </div>
      </div>
    </div>
  );
}
