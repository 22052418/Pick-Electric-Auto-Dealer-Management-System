import React, { useState, useMemo, useRef } from 'react';
import { Part } from '../types';
import { Plus, X, Save, AlertTriangle, Wrench, Edit2, Trash2, Search, Download, SlidersHorizontal, PackagePlus, ChevronDown, FileText, Printer, FileSpreadsheet, Loader2, Upload, CheckCircle2, ClipboardList } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface PartsInventoryProps {
  parts: Part[];
  inventoryLogs?: any[];
  onAddPart: (part: Omit<Part, 'id' | 'usedQuantity'>) => void;
  onUpdatePart: (part: Part) => void;
  onLogInventory?: (log: any) => Promise<void>;
  onDeletePart: (id: string) => void;
  onBulkAddParts?: (parts: Omit<Part, 'id' | 'usedQuantity'>[], fileHash: string) => Promise<void>;
  onBulkDeleteParts?: (ids: string[]) => Promise<void>;
  onUndoLastImport?: () => Promise<void>;
  lastImportTime?: number | null;
  lastStockUpdate?: number | null;
  userRole?: Partial<Part> | any;
  onViewLogs?: () => void;
}

const PART_NAMES = [
  'Battery',
  'Motor (BLDC)',
  'Controller',
  'Chassis',
  'Shock Absorber',
  'Leaf Spring',
  'Tyres'
];

const initialFormState = {
  partNumber: '',
  name: '',
  brand: '',
  quantity: '' as number | '',
  unit: 'Pieces' as 'Pieces' | 'Litres' | 'KGs',
  supplier: '',
  costPerUnit: '' as number | '',
};

export function PartsInventory({ parts, inventoryLogs, onAddPart, onUpdatePart, onLogInventory, onDeletePart, onBulkAddParts, onBulkDeleteParts, onUndoLastImport, lastImportTime, lastStockUpdate, userRole, onViewLogs }: PartsInventoryProps) {
  const isAdmin = true; // Temporary bypass for add parts
  const canAdd = true;
  const canReduce = true;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Part>>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasUnsavedChanges = () => {
    if (!editingId) {
      return JSON.stringify(formData) !== JSON.stringify(initialFormState);
    } else {
      const originalPart = parts.find(p => p.id === editingId);
      if (originalPart) {
        return JSON.stringify(formData) !== JSON.stringify(originalPart);
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
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error' | 'warning', title: string, text: string } | null>(null);

  // Selection
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);
  
  // Stock Adjustment
  const [stockAdjustId, setStockAdjustId] = useState<string | null>(null);
  const [stockAdjustType, setStockAdjustType] = useState<'in' | 'out'>('in');
  const [stockAdjustQuantity, setStockAdjustQuantity] = useState<number | ''>('');
  const [stockReduceReason, setStockReduceReason] = useState<string>('manual_adjustment'); // sold_to_subdealer, defective, manual_adjustment
  const [stockAdjustReference, setStockAdjustReference] = useState<string>('');

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Adequate', 'Low Stock'

  // Export
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isLowStock = p.quantity < 5;
      const matchesStatus = statusFilter === 'All' 
        ? true 
        : statusFilter === 'Low Stock' 
          ? isLowStock 
          : !isLowStock;

      return matchesSearch && matchesStatus;
    });
  }, [parts, searchTerm, statusFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'text' && value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'quantity' || name === 'costPerUnit' ? (value === '' ? '' : Number(value)) : finalValue 
    }));
  };

  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        setIsUpdating(true);
        // Simulate industry standard network animation delay
        await new Promise(r => setTimeout(r, 600));
        await onUpdatePart({ ...formData, id: editingId } as Part);
        setIsUpdating(false);
        setShowUpdateSuccess(true);
        setTimeout(() => {
          setShowUpdateSuccess(false);
          setEditingId(null);
          setFormData(initialFormState);
          setIsFormOpen(false);
        }, 1500);
      } else {
        await onAddPart(formData as Omit<Part, 'id' | 'usedQuantity'>);
        setFormData(initialFormState);
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error("Error saving part:", error);
      alert("Failed to save. Please try again.");
      setIsUpdating(false);
    }
  };

  const handleEdit = (part: Part) => {
    setFormData(part);
    setEditingId(part.id);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const confirmDelete = async () => {
    if (partToDelete) {
      try {
        await onDeletePart(partToDelete);
        setPartToDelete(null);
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const handleStockAdjustConfirm = async () => {
    if (!stockAdjustId || !stockAdjustQuantity || Number(stockAdjustQuantity) <= 0) return;
    try {
      const part = parts.find(p => p.id === stockAdjustId);
      if (part) {
        const amount = Number(stockAdjustQuantity);
        if (stockAdjustType === 'out') {
          if (amount > part.quantity) {
            alert(`Cannot reduce by ${amount}. Only ${part.quantity} in stock.`);
            return;
          }
          await onUpdatePart({ 
            ...part, 
            quantity: part.quantity - amount,
            usedQuantity: (part.usedQuantity || 0) + (stockReduceReason === 'sold_to_subdealer' || stockReduceReason === 'defective' ? amount : 0)
          });
          if (onLogInventory) {
            let logReason = 'Manual adjustment';
            if (stockReduceReason === 'sold_to_subdealer') logReason = 'Parts sold separately';
            if (stockReduceReason === 'defective') logReason = 'Damaged / Defective';
            if (stockAdjustReference) logReason += `: ${stockAdjustReference}`;
            
            await onLogInventory({
              partId: part.id,
              partName: part.name,
              partNumber: part.partNumber || '',
              changeAmount: -amount,
              type: stockReduceReason as any,
              reason: logReason,
              referenceId: stockAdjustReference,
              createdAt: Date.now()
            });
          }
        } else {
          await onUpdatePart({ ...part, quantity: part.quantity + amount });
          if (onLogInventory) {
            await onLogInventory({
              partId: part.id,
              partName: part.name,
              partNumber: part.partNumber || '',
              changeAmount: amount,
              type: 'manual_adjustment',
              reason: 'Added stock manually',
              createdAt: Date.now()
            });
          }
        }
      }
      setStockAdjustId(null);
      setStockAdjustQuantity('');
      setStockAdjustType('in');
      setStockReduceReason('manual_adjustment');
    } catch (err: any) {
      alert("Failed to adjust stock: " + err.message);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedParts(filteredParts.map(p => p.id));
    } else {
      setSelectedParts([]);
    }
  };

  const handleSelectPart = (id: string) => {
    setSelectedParts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedParts.length === 0) return;
    setShowDeleteSelectedConfirm(true);
  };

  const confirmDeleteSelected = async () => {
    setShowDeleteSelectedConfirm(false);
    try {
      if (onBulkDeleteParts) {
        await onBulkDeleteParts(selectedParts);
      } else {
        await Promise.all(
          selectedParts.map(id => onDeletePart(id))
        );
      }
      setSelectedParts([]);
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Small timeout to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'PICK ELECTRIC AUTO PRIVATE LIMITED';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Current Stock Inventory', {
        views: [{ showGridLines: false }],
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '10:10', margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
        headerFooter: { firstFooter: '&LConfidential - Internal Use Only &RPage &P of &N', oddFooter: '&LConfidential - Internal Use Only &RPage &P of &N' }
      });

      // Define columns
      sheet.columns = [
        { key: 'slno', width: 8 },
        { key: 'partno', width: 25 },
        { key: 'partname', width: 55 },
        { key: 'quantity', width: 25 },
        { key: 'rate', width: 22 },
        { key: 'value', width: 28 }
      ];

      // --- HEADER SECTION ---
      sheet.mergeCells('A1:F1');
      const companyCell = sheet.getCell('A1');
      companyCell.value = 'PICK ELECTRIC AUTO PRIVATE LIMITED';
      companyCell.font = { name: 'Arial', size: 22, bold: true, color: { argb: 'FF0F172A' } };
      companyCell.alignment = { vertical: 'middle', horizontal: 'left' };

      sheet.mergeCells('A2:F2');
      const titleCell = sheet.getCell('A2');
      titleCell.value = 'CURRENT STOCK INVENTORY REPORT';
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF334155' } };
      
      const today = new Date();
      const dateStr = today.toLocaleString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      
      sheet.mergeCells('A3:F3');
      const metaCell = sheet.getCell('A3');
      metaCell.value = `Generated: ${dateStr} | Status Filter: ${statusFilter} | Search Query: ${searchTerm || 'None'}`;
      metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };

      // Divider
      sheet.mergeCells('A4:F4');
      const dividerCell = sheet.getCell('A4');
      dividerCell.border = { bottom: { style: 'medium', color: { argb: 'FF0F172A' } } };

      sheet.addRow([]); // Row 5

      // --- DASHBOARD SECTION ---
      // Row 6: Titles
      const dashTitlesRow = sheet.getRow(6);
      dashTitlesRow.values = ['', 'Total Products', 'Total Quantity', 'Total Inventory Value', 'Low Stock Items', ''];
      dashTitlesRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF64748B' } };
      dashTitlesRow.alignment = { horizontal: 'center', vertical: 'middle' };
      dashTitlesRow.height = 25;

      // Row 7: Values
      const dashValuesRow = sheet.getRow(7);
      const totalInventoryValue = filteredParts.reduce((sum, part) => sum + (part.quantity * part.costPerUnit), 0);
      dashValuesRow.values = [
        '',
        filteredParts.length,
        filteredParts.reduce((sum, p) => sum + p.quantity, 0),
        totalInventoryValue,
        filteredParts.filter(p => p.quantity < 5).length,
        ''
      ];
      dashValuesRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0F172A' } };
      dashValuesRow.alignment = { horizontal: 'center', vertical: 'middle' };
      dashValuesRow.height = 30;
      
      dashValuesRow.getCell(3).numFmt = '#,##0.00';
      dashValuesRow.getCell(4).numFmt = '₹#,##0.00';
      // Low stock item formatting
      if (typeof dashValuesRow.getCell(5).value === 'number' && (dashValuesRow.getCell(5).value as number) > 0) {
        dashValuesRow.getCell(5).font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFDC2626' } };
      }

      // Add a box around dashboard
      for (let i = 2; i <= 5; i++) {
        dashTitlesRow.getCell(i).border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        dashTitlesRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        
        dashValuesRow.getCell(i).border = { left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        dashValuesRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }

      sheet.addRow([]); // Row 8
      sheet.addRow([]); // Row 9

      // --- TABLE HEADER ---
      // Row 10
      const headerRow = sheet.getRow(10);
      headerRow.values = ['SL NO.', 'PART NO.', 'PART NAME', 'QUANTITY', 'RATE', 'NET VALUE'];
      headerRow.height = 30;
      
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF1E293B' } },
          left: { style: 'medium', color: { argb: 'FF1E293B' } },
          bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
          right: { style: 'medium', color: { argb: 'FF1E293B' } }
        };
      });

      // --- DATA ROWS ---
      filteredParts.forEach((part, index) => {
        const isAlternate = index % 2 === 1;
        const totalValue = part.quantity * part.costPerUnit;
        
        const row = sheet.addRow([index + 1, part.partNumber || '-', part.name, part.quantity, part.costPerUnit, totalValue]);
        row.height = 25;
        
        row.eachCell((cell, colNumber) => {
          // Alignment
          cell.alignment = { vertical: 'middle', horizontal: (colNumber === 1 || colNumber === 4 || colNumber === 5 || colNumber === 6) ? 'center' : 'left', wrapText: true };
          
          let cellFillColor = isAlternate ? 'FFF8FAFC' : 'FFFFFFFF';
          
          // Number formatting and Conditional Formatting
          if (colNumber === 4) {
            cell.numFmt = '#,##0.00';
            cell.font = { name: 'Arial', size: 11, bold: part.quantity < 5 ? true : false, color: { argb: 'FF334155' } };
            
            if (part.quantity < 5) {
              cellFillColor = 'FFDC2626'; // Critical red background
              cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' }, bold: true };
            } else if (part.quantity < 20) {
              cellFillColor = 'FFFEF08A'; // Low stock orange/yellow
              cell.font = { ...cell.font, color: { argb: 'FF92400E' }, bold: true };
            } else {
              cellFillColor = 'FFDCFCE7'; // Healthy green
              cell.font = { ...cell.font, color: { argb: 'FF166534' } };
            }
          } else {
            cell.font = { name: 'Arial', size: 11, bold: colNumber === 1 || colNumber === 2 ? true : false, color: { argb: 'FF334155' } };
          }
          
          if (colNumber >= 5) {
            cell.numFmt = '₹#,##0.00';
            cell.font = { ...cell.font, bold: true };
          }

          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cellFillColor } };

          // Border for all cells
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      });

      // Freeze Panes (Header)
      sheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 10, activeCell: 'A11', showGridLines: false }
      ];

      // Export file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Current_Stock_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);

    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const currentTotalProducts = filteredParts.length;
  const currentTotalQuantity = filteredParts.reduce((sum, p) => sum + p.quantity, 0);
  const currentLowStock = filteredParts.filter(p => p.quantity < 5).length;

  const handleSaveAsPDF = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const today = new Date();
      const dateStr = today.toLocaleString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      // --- HEADER BLOCK ---
      doc.setFillColor(30, 58, 138); // Deep professional blue
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('PICK ELECTRIC AUTO PRIVATE LIMITED', 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Advanced Inventory & Supply Chain Intelligence', 14, 27);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('STOCK INVENTORY REPORT', pageWidth - 14, 20, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${dateStr}`, pageWidth - 14, 27, { align: 'right' });
      
      // --- METRICS SUMMARY ---
      let startY = 45;
      const totalInventoryVal = filteredParts.reduce((acc, part) => acc + (part.quantity * part.costPerUnit), 0);
      const lowStockCountVal = filteredParts.filter(p => p.quantity < 5).length;
      
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 14, startY);
      
      startY += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total SKU Authorized: ${filteredParts.length}`, 14, startY);
      doc.text(`Total Physical Stock: ${filteredParts.reduce((sum, p) => sum + p.quantity, 0).toLocaleString('en-IN')} Units`, 80, startY);
      doc.text(`Net Asset Value: Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalInventoryVal)}`, 146, startY);
      
      startY += 6;
      doc.text(`Critical Low-Stock Alerts: ${lowStockCountVal}`, 14, startY);
      
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, startY + 6, pageWidth - 14, startY + 6);
      
      startY += 16;
      
      // --- DATA TABLE ---
      const tableData = filteredParts.map((part, index) => {
        const totalValue = part.quantity * part.costPerUnit;
        return [
          index + 1,
          part.partNumber || '-',
          part.name,
          part.quantity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(part.costPerUnit),
          new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalValue)
        ];
      });

      autoTable(doc, {
        startY: startY,
        head: [['#', 'Part No.', 'Component Specification', 'Current Qty', 'Unit Cost (INR)', 'Net Value (INR)']],
        body: tableData,
        theme: 'grid',
        styles: { 
          font: 'helvetica',
          fontSize: 9, 
          cellPadding: 4,
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.1,
          textColor: [51, 65, 85] // slate-700
        },
        headStyles: { 
          fillColor: [15, 23, 42], // slate-900
          textColor: 255,
          fontStyle: 'bold',
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' }, // index
          1: { cellWidth: 35, fontStyle: 'bold', textColor: [15, 23, 42] }, // part number
          2: { cellWidth: 'auto' }, // specs
          3: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }, // qty
          4: { cellWidth: 32, halign: 'right' }, // cost
          5: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] } // net value
        },
        didDrawPage: (data) => {
          // --- FOOTER ---
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(148, 163, 184); // slate-400
          
          doc.text('CONFIDENTIAL - Strictly for Internal Corporate, Manufacturing, and Supply Chain Operations only.', 14, pageHeight - 10);
          doc.text(`Page ${(doc as any).internal.getNumberOfPages()}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }
      });
      
      const fileNameStr = `ERP_Inventory_Report_${today.toISOString().split('T')[0]}_T${today.getTime()}.pdf`;
      doc.save(fileNameStr);
      setShowExportMenu(false);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to generate high-quality ERP PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintReport = async (title: string = 'PDF') => {
    setIsExporting(true);
    try {
      // Small timeout to allow UI update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print/export the report.');
        return;
      }

      const today = new Date();
      const dateStr = today.toLocaleString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      let partRows = '';
      filteredParts.forEach((part, index) => {
        const isLow = part.quantity < 5;
        const totalValue = part.quantity * part.costPerUnit;
        const statusClass = isLow ? 'status-low' : 'status-ok';
        partRows += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${part.partNumber || '-'}</td>
            <td style="font-weight: 500;">${part.name}</td>
            <td style="text-align: center;">
              <span class="badge ${statusClass}">${part.quantity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </td>
            <td style="text-align: right;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(part.costPerUnit)}</td>
            <td style="text-align: right; font-weight: 500;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalValue)}</td>
          </tr>
        `;
      });

      const rootUrl = window.location.origin;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stock Inventory Report - ${today.toISOString().split('T')[0]}</title>
          <style>
            :root {
              --primary: #1e3a8a;
              --border: #e2e8f0;
              --bg: #f8fafc;
              --text: #334155;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
              background: #fff;
              color: var(--text);
              font-size: 13px;
              line-height: 1.5;
            }
            .report-container {
              max-width: 1200px;
              margin: 0 auto;
              background: #fff;
            }
            .header-block {
              background: #1e3a8a;
              color: white;
              padding: 24px 40px;
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .header-block h1 {
              margin: 0;
              font-size: 26px;
              font-weight: bold;
              letter-spacing: 0.5px;
            }
            .header-block p {
              margin: 0;
              font-size: 12px;
              opacity: 0.9;
            }
            .sub-header {
              padding: 24px 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .company-info h2 {
              font-size: 18px;
              font-weight: bold;
              color: #334155;
              margin: 0 0 8px 0;
              text-transform: uppercase;
            }
            .meta-info {
              text-align: right;
            }
            .meta-info p {
              margin: 0 0 4px 0;
              font-size: 11px;
              color: #64748b;
            }
            .summary-cards {
              display: flex;
              gap: 16px;
              margin: 0 40px 32px 40px;
            }
            .card {
              flex: 1;
              background: var(--bg);
              border: 1px solid var(--border);
              border-radius: 4px;
              padding: 16px;
              text-align: center;
            }
            .card-title {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .card-value {
              font-size: 18px;
              font-weight: bold;
              color: var(--primary);
            }
            
            .table-container {
              padding: 0 40px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 32px;
            }
            th { 
              background-color: #1e293b;
              color: #fff;
              text-align: left; 
              padding: 10px; 
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid #1e293b;
            }
            td { 
              padding: 10px; 
              border: 1px solid var(--border);
              color: var(--text);
              font-size: 12px;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            
            .badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 12px;
              display: inline-block;
            }
            .status-low {
              background: #fee2e2;
              color: #dc2626;
            }
            .status-ok {
              color: #166534;
              background: #dcfce7;
            }
            
            .footer {
              margin: 0 40px;
              padding: 16px 0;
              border-top: 1px solid var(--border);
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #94a3b8;
            }
            
            @media print {
              body {
                background: white;
              }
              .report-container {
                max-width: 100%;
              }
              .header-block {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                background: #1e3a8a !important;
                color: white !important;
              }
              th {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                background-color: #1e293b !important;
                color: white !important;
              }
              .card {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                background: #f8fafc !important;
              }
              .status-low {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                background: #fee2e2 !important;
                color: #dc2626 !important;
              }
              .status-ok {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                background: #dcfce7 !important;
                color: #166534 !important;
              }
              @page {
                size: A4 landscape;
                margin: 0.5cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header-block">
              <h1>PICK ELECTRIC AUTO PRIVATE LIMITED</h1>
              <p>Advanced Inventory & Supply Chain Intelligence</p>
            </div>
            
            <div class="sub-header">
              <div class="company-info">
                <h2>CURRENT STOCK INVENTORY REPORT</h2>
              </div>
              <div class="meta-info">
                <p>Generated: <strong>${dateStr}</strong> | Status Filter: <strong>${statusFilter}</strong> | Search Query: <strong>${searchTerm || 'None'}</strong></p>
              </div>
            </div>
            
            <div class="summary-cards">
              <div class="card">
                <div class="card-title">Total Products</div>
                <div class="card-value">${currentTotalProducts}</div>
              </div>
              <div class="card">
                <div class="card-title">Total Quantity</div>
                <div class="card-value">${currentTotalQuantity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div class="card" style="border-bottom: 3px solid #dc2626;">
                <div class="card-title">Low Stock Items</div>
                <div class="card-value" style="color: #dc2626;">${currentLowStock}</div>
              </div>
              <div class="card">
                <div class="card-title">Total Inventory Value</div>
                <div class="card-value">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalInventoryValue)}</div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 5%; text-align: center;">SL NO.</th>
                    <th style="width: 15%">PART NO.</th>
                    <th style="width: 45%">PART NAME</th>
                    <th style="width: 10%; text-align: center;">QUANTITY</th>
                    <th style="width: 10%; text-align: right;">RATE</th>
                    <th style="width: 15%; text-align: right;">NET VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  ${partRows || '<tr><td colspan="6" style="text-align: center; padding: 32px; color: #94a3b8;">No data available</td></tr>'}
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <div>&copy; ${today.getFullYear()} PICK ELECTRIC AUTO PRIVATE LIMITED. All rights reserved.</div>
              <div>Strictly Confidential / Internal Use Only</div>
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() { 
                window.print(); 
              }, 300); 
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onBulkAddParts) return;

    setIsImporting(true);
    setImportStatus('Loading Excel file...');
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file);
      setImportStatus('Reading rows...');
      const worksheet = workbook.worksheets[0];
      
      const newParts: Omit<Part, 'id' | 'usedQuantity'>[] = [];
      
      let headerMap: Record<string, number> = {};
      
      worksheet.eachRow((row, rowNumber) => {
        const rowValues = row.values as any[];
        
        if (rowNumber === 1) {
          // Map headers
          for (let i = 1; i < rowValues.length; i++) {
            const header = (rowValues[i]?.toString() || '').toLowerCase().trim();
            if (header.includes('name') || header.includes('particular')) headerMap['name'] = i;
            else if (header.includes('part no') || header.includes('part number')) headerMap['partNumber'] = i;
            else if (header.includes('qty') || header.includes('quantity')) headerMap['quantity'] = i;
            else if (header.includes('rate') || header.includes('cost') || header.includes('price')) headerMap['rate'] = i;
            else if (header.includes('brand')) headerMap['brand'] = i;
            else if (header.includes('suppli')) headerMap['supplier'] = i;
            else if (header.includes('unit')) headerMap['unit'] = i;
          }
          
          // Fallback if no matching headers found, assume columns: Name, Part No, Qty, Rate
          if (Object.keys(headerMap).length === 0) {
            headerMap = { name: 1, partNumber: 2, quantity: 3, rate: 4 };
          }
          return;
        }
        
        const partNumber = rowValues[headerMap['partNumber']]?.toString() || '';
        const name = rowValues[headerMap['name']]?.toString() || '';
        const qtyStrRaw = rowValues[headerMap['quantity']]?.toString() || '0';
        const rateStr = rowValues[headerMap['rate']]?.toString() || '0';
        const brand = rowValues[headerMap['brand']]?.toString() || '';
        const supplier = rowValues[headerMap['supplier']]?.toString() || '';
        const unitColStr = headerMap['unit'] ? (rowValues[headerMap['unit']]?.toString() || '') : '';
        
        if (name) {
          let quantity = parseFloat(qtyStrRaw.replace(/[^0-9.-]+/g,"")) || 0;
          let unit: 'Pieces' | 'Litres' | 'KGs' = 'Pieces';
          
          // Derive unit from explicit 'unit' column if present
          const lowerUnitCol = unitColStr.toLowerCase();
          if (lowerUnitCol.includes('kg')) unit = 'KGs';
          else if (lowerUnitCol.includes('liter') || lowerUnitCol.includes('litre') || lowerUnitCol.includes(' l') || lowerUnitCol.includes('ltr')) unit = 'Litres';
          else if (lowerUnitCol.includes('ml')) {
             unit = 'Litres';
             quantity = quantity / 1000;
          } else if (lowerUnitCol.includes('g') || lowerUnitCol.includes('gram')) {
             unit = 'KGs';
             quantity = quantity / 1000;
          }
          
          // If no unit column, try to infer from quantity string (e.g. "5 KGs", "500 ML")
          if (unit === 'Pieces' && qtyStrRaw) {
             const lowerQtyStr = qtyStrRaw.toLowerCase();
             if (lowerQtyStr.includes('kg')) unit = 'KGs';
             else if (lowerQtyStr.includes('liter') || lowerQtyStr.includes('litre') || lowerQtyStr.endsWith(' l') || lowerQtyStr.includes('ltr')) unit = 'Litres';
             else if (lowerQtyStr.includes('ml')) {
                unit = 'Litres';
                quantity = quantity / 1000;
             } else if (lowerQtyStr.includes('g') || lowerQtyStr.includes('gram')) {
                unit = 'KGs';
                quantity = quantity / 1000;
             }
          }
          
          // Finally, if it's paint, default to Litres if not piece explicitly
          if (unit === 'Pieces' && name.toLowerCase().includes('paint')) {
             unit = 'Litres';
          }

          const costPerUnit = parseFloat(rateStr.replace(/[^0-9.-]+/g,"")) || 0;
          
          newParts.push({
            name,
            partNumber,
            brand,
            unit,
            quantity: Number(quantity.toFixed(4)),
            costPerUnit,
            supplier
          });
        }
      });
      
      if (newParts.length > 0) {
        setImportStatus(`Uploading ${newParts.length} parts to database...`);
        const fileHash = JSON.stringify(newParts);
        await onBulkAddParts(newParts, fileHash);
        setImportMessage({ type: 'success', title: 'Import Successful', text: `Successfully imported ${newParts.length} parts in stock.` });
      } else {
        setImportMessage({ type: 'error', title: 'No Data Found', text: 'No valid parts found in the Excel file. Please ensure it follows the correct format.' });
      }
      
    } catch (error: any) {
      if (!error?.message?.startsWith('DUPLICATE_IMPORT:')) {
        console.error('Error importing excel:', error);
      }
      if (error.message && error.message.startsWith('DUPLICATE_IMPORT:')) {
        const timestamp = parseInt(error.message.split(':')[1], 10);
        const dateStr = new Date(timestamp).toLocaleString();
        setImportMessage({ type: 'warning', title: 'Already Imported', text: `This stock is already added on ${dateStr}. Please check the data to avoid duplication.` });
      } else {
        setImportMessage({ type: 'error', title: 'Import Failed', text: 'Failed to import Excel file. Please check the file format.' });
      }
    } finally {
      setIsImporting(false);
      setImportStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const totalInventoryValue = useMemo(() => {
    return parts.reduce((sum, part) => sum + (part.quantity * part.costPerUnit), 0);
  }, [parts]);

  const lowStockCount = useMemo(() => {
    return parts.filter(p => p.quantity < 5).length;
  }, [parts]);

  const totalUsedParts = useMemo(() => {
    return parts.reduce((sum, part) => sum + (part.usedQuantity || 0), 0);
  }, [parts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            Parts Inventory
            {lastStockUpdate && (
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                Updated: {new Date(lastStockUpdate).toLocaleString()}
              </span>
            )}
          </h2>
          <p className="text-slate-500 mt-1">Manage EV components, track usage, and monitor stock levels.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto relative">
          {lastImportTime && onUndoLastImport && (
            <button
              onClick={() => setShowUndoConfirm(true)}
              className="flex items-center px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
            >
              Undo Last Import
            </button>
          )}
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImportExcel}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
            disabled={isImporting || !onBulkAddParts}
          >
            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" /> : <Upload className="w-4 h-4 mr-2 text-slate-500" />}
            Import Excel
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" /> : <Download className="w-4 h-4 mr-2 text-slate-500" />}
              {isExporting ? 'Generating...' : 'Export Options'}
              <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
            </button>
            
            {showExportMenu && !isExporting && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    Export Format
                  </div>
                  <button
                    onClick={handleSaveAsPDF}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-3 text-slate-400" />
                    <span>Save as PDF</span>
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-t border-slate-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-3 text-slate-400" />
                    <span>Excel Spreadsheet</span>
                  </button>
                  <button
                    onClick={() => handlePrintReport('Print')}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors border-t border-slate-50"
                  >
                    <Printer className="w-4 h-4 mr-3 text-slate-400" />
                    <span>Print Report</span>
                  </button>
                </div>
              </>
            )}
          </div>
          {!isFormOpen && canAdd && (
            <>
              {onViewLogs && (
                <button
                  onClick={onViewLogs}
                  className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors shadow-sm text-sm font-medium whitespace-nowrap border border-indigo-100 mr-2"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Stock Logs
                </button>
              )}
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium whitespace-nowrap border border-slate-700"
              >
                <PackagePlus className="w-4 h-4 mr-2" />
                New Part
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Total Parts Types</h3>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{parts.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Total Inventory Value</h3>
            <span className="text-lg">₹</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalInventoryValue)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Total Used Parts</h3>
            <span className="text-lg text-slate-400">⚙️</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalUsedParts}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Low Stock Alerts</h3>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {lowStockCount}
          </p>
        </div>
      </div>

      {isFormOpen && !editingId && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Receive New Parts</h3>
            <button onClick={handleCancelIntent} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Part Number</label>
                <input
                  type="text"
                  name="partNumber"
                  value={formData.partNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="e.g. PN-101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Part Name / Product Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  list="partNamesList"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Select or enter part name"
                />
                <datalist id="partNamesList">
                  {PART_NAMES.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Acme Auto Parts (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number" step="0.01"
                    name="quantity"
                    required
                    min="1"
                    value={formData.quantity || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 50"
                  />
                  <select
                    name="unit"
                    value={formData.unit || 'Pieces'}
                    onChange={handleInputChange}
                    className="w-28 px-2 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm"
                  >
                    <option value="Pieces">Pieces</option>
                    <option value="Litres">Litres</option>
                    <option value="KGs">KGs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rate Per Part (₹)</label>
                <input
                  type="number" step="0.01"
                  name="costPerUnit"
                  required
                  min="0"
                  value={formData.costPerUnit || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1500"
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
                Save Inventory
              </button>
            </div>
          </form>
        </div>
      )}

      {isFormOpen && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-800">Edit Part Details</h3>
              <button onClick={handleCancelIntent} className="text-slate-400 hover:text-slate-600 rounded-full p-2 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 relative">
              {showUpdateSuccess && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Successfully Updated</h3>
                  <p className="text-slate-500 mt-2">The part info has been saved.</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Part Number</label>
                  <input
                    type="text"
                    name="partNumber"
                    value={formData.partNumber || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all shadow-sm"
                    placeholder="e.g. PN-101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Part Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    list="partNamesListModal"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all shadow-sm"
                    placeholder="Select or enter part name"
                  />
                  <datalist id="partNamesListModal">
                    {PART_NAMES.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all shadow-sm"
                    placeholder="e.g. Acme Auto Parts (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                  <input
                    type="number" step="0.01"
                    name="quantity"
                    required
                    min="1"
                    value={formData.quantity || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Rate Per Part (₹)</label>
                  <input
                    type="number" step="0.01"
                    name="costPerUnit"
                    required
                    min="0"
                    value={formData.costPerUnit || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end items-center gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelIntent}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`flex items-center justify-center h-10 px-6 bg-indigo-600 text-white rounded-lg transition-all font-medium text-sm shadow-sm min-w-[140px] ${isUpdating ? 'opacity-80 cursor-not-allowed bg-indigo-700' : 'hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30'}`}
                >
                  {isUpdating ? (
                    <div className="w-5 h-5 border-2 border-indigo-200/40 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Wrench className="w-5 h-5 text-slate-500 mr-2" />
            <h3 className="font-semibold text-slate-800">Current Stock</h3>
          </div>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="All">All Status</option>
              <option value="Adequate">Adequate</option>
              <option value="Low Stock">Low Stock</option>
            </select>

            {canReduce && (
              <button
                onClick={handleDeleteSelected}
                disabled={selectedParts.length === 0}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap min-w-[100px] ${
                  selectedParts.length > 0
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    checked={filteredParts.length > 0 && selectedParts.length === filteredParts.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 w-12 text-center">S.No</th>
                <th className="px-4 py-3 font-medium">Part Number</th>
                <th className="px-4 py-3 font-medium">Product Name</th>
                <th className="px-4 py-3 font-medium text-right">QTY</th>
                <th className="px-4 py-3 font-medium text-right">Rate/Part</th>
                <th className="px-4 py-3 font-medium text-right">Total Value</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? "No parts match your search." : "No parts in inventory."}
                  </td>
                </tr>
              ) : (
                filteredParts.map((part, index) => {
                  const isLowStock = part.quantity < 5;
                  const totalValue = part.quantity * part.costPerUnit;
                  return (
                    <tr key={part.id} className={`hover:bg-slate-50 transition-colors ${selectedParts.includes(part.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          checked={selectedParts.includes(part.id)}
                          onChange={() => handleSelectPart(part.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-sm">{part.partNumber || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {part.name}
                        {isLowStock && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700" title="Low Stock">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                          {part.quantity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500 ml-1">{part.unit || 'Pieces'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-right">{formatCurrency(part.costPerUnit)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 text-right">{formatCurrency(totalValue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end space-x-2">
                          {(canAdd || canReduce) && (
                            <button
                              onClick={() => setStockAdjustId(part.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                              title="Adjust Stock"
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>
                          )}
                          {(canAdd || canReduce) && (
                            <button
                              onClick={() => handleEdit(part)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
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
        isOpen={partToDelete !== null}
        title="Delete Part"
        message="Are you sure you want to delete this part? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPartToDelete(null)}
      />

      <ConfirmDialog
        isOpen={showUndoConfirm}
        title="Undo Last Import"
        message="Are you sure you want to undo the last import? This will remove added quantities and newly created parts."
        confirmLabel="Undo Import"
        onConfirm={async () => {
          setIsImporting(true);
          setShowUndoConfirm(false);
          try {
            if (onUndoLastImport) {
              await onUndoLastImport();
              setImportMessage({ type: 'success', title: 'Undo Successful', text: 'Last import was successfully reversed.' });
            }
          } catch (err: any) {
            setImportMessage({ type: 'error', title: 'Undo Failed', text: `Failed to undo last import: ${err.message}` });
          } finally {
            setIsImporting(false);
          }
        }}
        onCancel={() => setShowUndoConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteSelectedConfirm}
        title="Delete Selected Parts"
        message={`Are you sure you want to delete ${selectedParts.length} ${selectedParts.length === 1 ? 'part' : 'parts'}? This action cannot be undone.`}
        onConfirm={confirmDeleteSelected}
        onCancel={() => setShowDeleteSelectedConfirm(false)}
      />

      {/* Adjust Stock Modal */}
      {stockAdjustId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Adjust Stock</h3>
            </div>
            <p className="text-slate-600 mb-6 font-medium text-sm">
              Current Available: <span className="font-bold text-slate-800">{parts.find(p => p.id === stockAdjustId)?.quantity || 0}</span>
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${stockAdjustType === 'in' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setStockAdjustType('in')}
                >
                  Stock In
                </button>
                <button
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${stockAdjustType === 'out' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setStockAdjustType('out')}
                >
                  Stock Out
                </button>
              </div>

              {stockAdjustType === 'out' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Reduction</label>
                  <select 
                    value={stockReduceReason}
                    onChange={(e) => setStockReduceReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="sold_to_subdealer">Parts sold separately</option>
                    <option value="defective">Damaged / Defective</option>
                    <option value="manual_adjustment">Manual Adjustment</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {stockReduceReason === 'sold_to_subdealer' || stockReduceReason === 'defective' ? 'Will increment the used quantity stats.' : 'Will only decrease available stock.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number" step="0.01"
                  min="0.01"
                  value={stockAdjustQuantity}
                  onChange={(e) => setStockAdjustQuantity(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="e.g. 5"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Reference (Optional)</label>
                <input
                  type="text"
                  value={stockAdjustReference}
                  onChange={(e) => setStockAdjustReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder={stockReduceReason === 'sold_to_subdealer' ? "Sub-dealer name" : stockReduceReason === 'defective' ? "Defect detail" : "Any references"}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setStockAdjustId(null); setStockAdjustQuantity(''); setStockAdjustType('in'); setStockReduceReason('manual_adjustment'); setStockAdjustReference(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleStockAdjustConfirm}
                disabled={
                  !stockAdjustQuantity || 
                  Number(stockAdjustQuantity) <= 0 || 
                  (stockAdjustType === 'out' && Number(stockAdjustQuantity) > (parts.find(p => p.id === stockAdjustId)?.quantity || 0))
                }
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  stockAdjustType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Confirm {stockAdjustType === 'in' ? 'Add' : 'Reduce'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Status Overlay */}
      {importStatus && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Importing Parts</h3>
            <p className="text-slate-600 font-medium text-sm">
              {importStatus}
            </p>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {importMessage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            {importMessage.type === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />}
            {importMessage.type === 'error' && <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />}
            {importMessage.type === 'warning' && <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />}
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">{importMessage.title}</h3>
            <p className="text-slate-600 text-sm mb-6">
              {importMessage.text}
            </p>
            
            <button 
              onClick={() => setImportMessage(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}
