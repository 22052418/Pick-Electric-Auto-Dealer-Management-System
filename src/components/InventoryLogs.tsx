import React, { useState, useMemo } from 'react';
import { InventoryLog } from '../types';
import { Trash2, AlertTriangle, ArrowLeft, Search, Calendar as CalendarIcon, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface InventoryLogsProps {
  logs: InventoryLog[];
  onDeleteLogs: (ids: string[]) => Promise<void>;
  onBack: () => void;
}

export function InventoryLogs({ logs, onDeleteLogs, onBack }: InventoryLogsProps) {
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  
  const [isExporting, setIsExporting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const filteredAndSortedLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = 
          log.partName.toLowerCase().includes(appliedSearchTerm.toLowerCase()) || 
          (log.partNumber && log.partNumber.toLowerCase().includes(appliedSearchTerm.toLowerCase()));
        
        let matchesDate = true;
        if (appliedStartDate || appliedEndDate) {
          const logDate = new Date(log.createdAt).toISOString().split('T')[0];
          if (appliedStartDate && logDate < appliedStartDate) matchesDate = false;
          if (appliedEndDate && logDate > appliedEndDate) matchesDate = false;
        }

        return matchesSearch && matchesDate;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [logs, appliedSearchTerm, appliedStartDate, appliedEndDate]);

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate network latency for industry level feel
    await new Promise(resolve => setTimeout(resolve, 800));
    setAppliedSearchTerm(searchTerm);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setIsSearching(false);
  };


  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'PICK ELECTRIC AUTO PRIVATE LIMITED';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Stock Logs History', {
        views: [{ showGridLines: false }],
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '10:10', margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
        headerFooter: { firstFooter: '&LConfidential - Internal Use Only &RPage &P of &N', oddFooter: '&LConfidential - Internal Use Only &RPage &P of &N' }
      });

      sheet.columns = [
        { key: 'date', width: 25 },
        { key: 'part', width: 40 },
        { key: 'typeReason', width: 35 },
        { key: 'change', width: 15 }
      ];

      // HEADER SECTION
      sheet.mergeCells('A1:D1');
      const companyCell = sheet.getCell('A1');
      companyCell.value = 'PICK ELECTRIC AUTO PRIVATE LIMITED';
      companyCell.font = { name: 'Inter', size: 22, bold: true, color: { argb: 'FF0F172A' } };
      companyCell.alignment = { vertical: 'middle', horizontal: 'left' };

      sheet.mergeCells('A2:D2');
      const titleCell = sheet.getCell('A2');
      titleCell.value = 'STOCK LOGS HISTORY REPORT';
      titleCell.font = { name: 'Inter', size: 14, bold: true, color: { argb: 'FF334155' } };
      
      const today = new Date();
      const dateStr = today.toLocaleString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      
      sheet.mergeCells('A3:D3');
      const metaCell = sheet.getCell('A3');
      const dateRangeStr = (startDate || endDate) ? `${startDate || 'Start'} to ${endDate || 'End'}` : 'All Time';
      metaCell.value = `Generated: ${dateStr} | Date Range: ${dateRangeStr} | Search: ${searchTerm || 'None'}`;
      metaCell.font = { name: 'Inter', size: 10, italic: true, color: { argb: 'FF64748B' } };

      // Divider
      sheet.mergeCells('A4:D4');
      const dividerCell = sheet.getCell('A4');
      dividerCell.border = { bottom: { style: 'medium', color: { argb: 'FF0F172A' } } };

      sheet.addRow([]); // Row 5

      // DASHBOARD SECTION
      const dashTitlesRow = sheet.getRow(6);
      dashTitlesRow.values = ['Total Logs', 'Total Quantity Added', 'Total Quantity Reduced', 'Net Change'];
      dashTitlesRow.font = { name: 'Inter', size: 10, bold: true, color: { argb: 'FF64748B' } };
      dashTitlesRow.alignment = { horizontal: 'center', vertical: 'middle' };
      dashTitlesRow.height = 25;

      const added = filteredAndSortedLogs.filter(l => l.changeAmount > 0).reduce((sum, l) => sum + l.changeAmount, 0);
      const reduced = filteredAndSortedLogs.filter(l => l.changeAmount < 0).reduce((sum, l) => sum + Math.abs(l.changeAmount), 0);

      const dashValuesRow = sheet.getRow(7);
      dashValuesRow.values = [
        filteredAndSortedLogs.length,
        `+${added}`,
        `-${reduced}`,
        (added - reduced) > 0 ? `+${added - reduced}` : `${added - reduced}`
      ];
      dashValuesRow.font = { name: 'Inter', size: 16, bold: true, color: { argb: 'FF0F172A' } };
      dashValuesRow.alignment = { horizontal: 'center', vertical: 'middle' };
      dashValuesRow.height = 30;

      // Divider
      sheet.addRow([]); // Row 8
      const headerDividerCell = sheet.getCell('A8');
      sheet.mergeCells('A8:D8');
      headerDividerCell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      
      sheet.addRow([]); // Row 9

      // TABLE HEADERS (Row 10)
      const headerRow = sheet.getRow(10);
      headerRow.values = [
        'DATE & TIME',
        'PART DETAILS',
        'TYPE / REASON',
        'CHANGE'
      ];
      
      headerRow.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      ['A', 'B', 'C', 'D'].forEach(col => {
        const cell = sheet.getCell(`${col}10`);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF334155' } },
          bottom: { style: 'thin', color: { argb: 'FF334155' } },
          left: { style: 'thin', color: { argb: 'FF334155' } },
          right: { style: 'thin', color: { argb: 'FF334155' } },
        };
      });

      // Data Rows
      filteredAndSortedLogs.forEach((log) => {
        const row = sheet.addRow([
          new Date(log.createdAt).toLocaleString('en-IN'),
          `${log.partName}${log.partNumber ? ` (No: ${log.partNumber})` : ''}`,
          `${log.type === 'production' ? 'Used in Production' :
             log.type === 'sold_to_subdealer' ? 'Parts sold separately' :
             log.type === 'defective' ? 'Damaged / Defective' :
             log.type === 'import_stock' ? 'Import Initial Stock' :
             log.type === 'undo_import' ? 'Reverted Import' :
             'Manual Adjustment'}${log.reason ? ` - ${log.reason}` : ''}`,
          log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount.toString()

        ]);
        
        row.font = { name: 'Inter', size: 10, color: { argb: 'FF334155' } };
        
        // Alignments
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
        
        row.getCell(4).font = { 
          name: 'Inter', 
          size: 10, 
          bold: true,
          color: { argb: log.changeAmount > 0 ? 'FF059669' : 'FFE11D48' } // Emerald or Rose
        };

        // Borders
        ['A', 'B', 'C', 'D'].forEach(col => {
          row.getCell(col).border = {
            bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Stock_Logs_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate export file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLogs(filteredAndSortedLogs.map(log => log.id));
    } else {
      setSelectedLogs([]);
    }
  };

  const handleSelectLog = (id: string) => {
    setSelectedLogs(prev => 
      prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedLogs.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    await onDeleteLogs(selectedLogs);
    setSelectedLogs([]);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6 zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Stock Logs</h2>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-36">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-[38px] pl-3 pr-3 text-sm text-slate-700 bg-white border border-slate-300 rounded-sm shadow-sm focus:outline-none focus:border-blue-400/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                title="Date From"
              />
            </div>
            <span className="text-slate-400 text-sm">to</span>
            <div className="relative w-36">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-[38px] pl-3 pr-3 text-sm text-slate-700 bg-white border border-slate-300 rounded-sm shadow-sm focus:outline-none focus:border-blue-400/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                title="Date To"
              />
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className={`flex items-center justify-center shrink-0 w-[38px] h-[38px] bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 transition-colors shadow-sm ${isSearching ? 'opacity-70 cursor-not-allowed' : ''}`}
            title="Search logs"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search part name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="w-full h-[38px] pl-9 pr-4 text-sm text-slate-700 bg-white border border-slate-300 rounded-sm shadow-sm focus:outline-none focus:border-blue-400/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportToExcel}
              disabled={isExporting}
              className={`flex items-center justify-center shrink-0 w-[110px] h-[38px] px-4 border border-slate-300 bg-white text-slate-700 rounded-sm hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isExporting ? (
                <div className="w-4 h-4 mr-2 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
              )}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedLogs.length === 0}
              className={`flex items-center justify-center shrink-0 min-w-[100px] h-[38px] px-4 rounded-sm transition-colors shadow-sm text-sm font-medium whitespace-nowrap ${
                selectedLogs.length > 0
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="border border-slate-300 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] text-left border-collapse">
            <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-300 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={filteredAndSortedLogs.length > 0 && selectedLogs.length === filteredAndSortedLogs.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-3 py-4 border-b border-slate-300 w-10 text-center">S.No</th>
                <th className="px-6 py-4 border-b border-slate-300">Date & Time</th>
                <th className="px-6 py-4 border-b border-slate-300">Part</th>
                <th className="px-6 py-4 border-b border-slate-300">Type / Reason</th>
                <th className="px-6 py-4 border-b border-slate-300 text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 relative min-h-[200px]">
              {isSearching ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-500">Searching and filtering logs...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3 text-slate-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-base font-medium text-slate-800">No logs found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or date range.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedLogs.map((log, index) => (
                  <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${selectedLogs.includes(log.id) ? 'bg-indigo-50/50' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        checked={selectedLogs.includes(log.id)}
                        onChange={() => handleSelectLog(log.id)}
                      />
                    </td>
                    <td className="px-3 py-4 text-center text-slate-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-1 border-r border-slate-300 last:border-r-0">
                      <div className="font-medium text-slate-900">{log.partName}</div>
                      {log.partNumber && <div className="text-xs text-slate-500 font-mono">{log.partNumber}</div>}
                    </td>
                    <td className="px-2 py-1 border-r border-slate-300 last:border-r-0">
                      <div className="font-medium text-slate-800">{
                        log.type === 'production' ? 'Used in Production' :
                        log.type === 'sold_to_subdealer' ? 'Parts sold separately' :
                        log.type === 'defective' ? 'Damaged / Defective' :
                        log.type === 'import_stock' ? 'Import Initial Stock' :
                        log.type === 'undo_import' ? 'Reverted Import' :
                        'Manual Adjustment'
                      }</div>
                      {log.reason && <div className="text-xs text-slate-500">{log.reason}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.changeAmount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.changeAmount > 0 ? '+' : ''}{log.changeAmount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Logs"
        message={`Are you sure you want to delete ${selectedLogs.length} selected ${selectedLogs.length === 1 ? 'log' : 'logs'}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
