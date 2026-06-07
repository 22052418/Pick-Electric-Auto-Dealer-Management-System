import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Sale, Vehicle } from '../types';
import { Printer, Download, Search, FileText, Plus, X, Save, FileSpreadsheet, Upload, Info, Edit, Trash2, ArrowLeft, Mic, Clock, ChevronDown, Filter, Calendar, TrendingUp, MoreHorizontal, ChevronRight } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface InvoiceSystemProps {
  sales: Sale[];
  vehicles: Vehicle[];
  onAddSale?: (sale: Omit<Sale, 'id'>) => void;
  onUpdateSale?: (id: string, sale: Partial<Sale>) => void;
  onDeleteSale?: (id: string) => void;
}

const initialSaleForm: Omit<Sale, 'id' | 'invoiceId'> = {
  customerName: '',
  relationName: '',
  phoneNumber: '',
  address: '',
  postOffice: '',
  policeStation: '',
  districtPin: '',
  chassisNumber: '',
  vehicleModel: '',
  sellingPrice: 0,
  gstAmount: 0,
  totalAmount: 0,
  saleDate: new Date().toISOString().split('T')[0],
  wrcBookNo: '',
  keyNumber: '',
  batteryNumber: '',
  tyresMake: '',
  tyresNumber: '',
  hypothecation: '',
  salesPerson: '',
  deliveryFrom: 'Patna',
};

export function InvoiceSystem({ sales, vehicles, onAddSale, onUpdateSale, onDeleteSale }: InvoiceSystemProps) {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showMultiDeleteConfirm, setShowMultiDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState(initialSaleForm);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const availableVehicles = vehicles.filter(v => v.status === 'In Stock');
  const availableVehiclesForSelect = isEditing 
    ? vehicles.filter(v => v.status === 'In Stock' || v.chassisNumber === formData.chassisNumber)
    : availableVehicles;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
    let matchesDate = true;
    if (appliedStartDate) {
      matchesDate = matchesDate && sale.saleDate >= appliedStartDate;
    }
    if (appliedEndDate) {
      matchesDate = matchesDate && sale.saleDate <= appliedEndDate;
    }
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      // Mocking status logic: all our mock invoices are paid. Pending/Overdue returns empty for now.
      matchesStatus = statusFilter === 'paid';
    }
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  const selectedSale = sales.find(s => s.id === selectedSaleId);
  // Find vehicle to get motor power and battery type
  const vehicleDetails = selectedSale 
    ? vehicles.find(v => v.chassisNumber === selectedSale.chassisNumber) 
    : null;

  const handlePrint = () => {
    window.print();
    setTimeout(() => {
      setNotification({ 
        message: 'If the print dialog did not appear, please open the app in a new tab or use "Save as PDF".', 
        type: 'info' 
      });
    }, 500);
  };

  const handleDownloadPDF = async () => {
    const invoiceElement = document.getElementById('printable-invoice-content');
    if (!invoiceElement || !selectedSale) {
      setNotification({ message: 'Invoice content not found.', type: 'error' });
      return;
    }

    try {
      setNotification({ message: 'Generating PDF... Please wait.', type: 'info' });
      
      const imgData = await toJpeg(invoiceElement, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Calculate height based on A4 ratio and element proportions
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${selectedSale.invoiceId}.pdf`);
      setNotification({ message: 'PDF generated successfully!', type: 'success' });
    } catch (err) {
      console.error('PDF generation error:', err);
      setNotification({ message: 'Failed to generate PDF.', type: 'error' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  const numberToWords = (num: number): string => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if ((num = num || 0) === 0) return 'zero';

    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    
    let str = '';
    str += (n[1] != '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'crore ' : '';
    str += (n[2] != '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'lakh ' : '';
    str += (n[3] != '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'thousand ' : '';
    str += (n[4] != '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'hundred ' : '';
    str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    
    return str.trim().toUpperCase() + ' RUPEES ONLY';
  };

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
      setNotification({ message: "Please select a chassis number.", type: 'error' });
      return;
    }
    
    if (isEditing && selectedSaleId && onUpdateSale) {
      onUpdateSale(selectedSaleId, formData);
      setFormData(initialSaleForm);
      setIsEditing(false);
      setIsCreating(false);
    } else if (onAddSale) {
      const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
      const newSale = {
        ...formData,
        invoiceId,
      };
      onAddSale(newSale);
      setFormData(initialSaleForm);
      setIsCreating(false);
    }
  };

  const handleEditStart = () => {
    if (selectedSale) {
      setFormData({
        customerName: selectedSale.customerName,
        relationName: selectedSale.relationName || '',
        phoneNumber: selectedSale.phoneNumber,
        address: selectedSale.address,
        postOffice: selectedSale.postOffice || '',
        policeStation: selectedSale.policeStation || '',
        districtPin: selectedSale.districtPin || '',
        chassisNumber: selectedSale.chassisNumber,
        vehicleModel: selectedSale.vehicleModel || 'Pick Electric',
        sellingPrice: selectedSale.sellingPrice,
        gstAmount: selectedSale.gstAmount,
        totalAmount: selectedSale.totalAmount,
        saleDate: selectedSale.saleDate,
        wrcBookNo: selectedSale.wrcBookNo || '',
        keyNumber: selectedSale.keyNumber || '',
        batteryNumber: selectedSale.batteryNumber || '',
        tyresMake: selectedSale.tyresMake || '',
        tyresNumber: selectedSale.tyresNumber || '',
        hypothecation: selectedSale.hypothecation || '',
        salesPerson: selectedSale.salesPerson || '',
        deliveryFrom: selectedSale.deliveryFrom || 'Patna',
      });
      setIsEditing(true);
      setIsCreating(true);
    }
  };

  const handleDelete = () => {
    if (selectedSaleId && onDeleteSale) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (selectedSaleId && onDeleteSale) {
      onDeleteSale(selectedSaleId);
      setSelectedSaleId(null);
      setShowDeleteConfirm(false);
      setNotification({ message: 'Invoice deleted successfully', type: 'success' });
    }
  };

  const hasUnsavedChanges = () => {
    if (isCreating) {
      return JSON.stringify(formData) !== JSON.stringify(initialSaleForm);
    }
    if (isEditing && selectedSale) {
      const currentData = { ...formData };
      const originalData = { ...selectedSale, vehicleModel: selectedSale.vehicleModel || '' };
      delete (originalData as any).id;
      delete (originalData as any).invoiceId;
      return JSON.stringify(currentData) !== JSON.stringify(originalData);
    }
    return false;
  };

  const handleCancelIntent = () => {
    if (hasUnsavedChanges()) {
      setShowCancelConfirm(true);
    } else {
      confirmCancel();
    }
  };

  const confirmCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setFormData(initialSaleForm);
    setShowCancelConfirm(false);
  };

  const handleDownloadExcel = async () => {
    if (!selectedSale) return;

    try {
      setNotification({ message: 'Generating Excel... Please wait.', type: 'info' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Pick Electric Automobiles ERP';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Tax Invoice', {
        views: [{ showGridLines: false }],
        pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0.1, footer: 0.1 } },
        headerFooter: { firstFooter: '&LConfidential - Tax Invoice &RPage &P of &N', oddFooter: '&LConfidential - Tax Invoice &RPage &P of &N' }
      });

      // Columns
      sheet.columns = [
        { key: 'particulars', width: 28 },
        { key: 'hsn', width: 25 },
        { key: 'qty', width: 12 },
        { key: 'rate', width: 18 },
        { key: 'disc', width: 12 },
        { key: 'amount', width: 20 }
      ];

      // Helper function for borders
      const applyAllBorders = (cell: ExcelJS.Cell, style: ExcelJS.BorderStyle = 'thin') => {
        cell.border = { top: { style }, left: { style }, bottom: { style }, right: { style } };
      };

      // Header
      sheet.mergeCells('A1:F1');
      const companyCell = sheet.getCell('A1');
      companyCell.value = 'M/S PICK ELECTRIC AUTOMOBILES';
      companyCell.font = { name: 'Inter', size: 18, bold: true, color: { argb: 'FF0F172A' } };
      companyCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.mergeCells('A2:F2');
      const addressCell = sheet.getCell('A2');
      addressCell.value = 'Zero miles NH-30 Main Road Jakriyapur Bari Pahari Patna, Bihar 800007 | Mob: 9234741782';
      addressCell.font = { name: 'Inter', size: 9, color: { argb: 'FF334155' } };
      addressCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.mergeCells('A3:F3');
      const emailCell = sheet.getCell('A3');
      emailCell.value = 'Email: pickelectric.barh@gmail.com';
      emailCell.font = { name: 'Inter', size: 9, color: { argb: 'FF334155' } };
      emailCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.mergeCells('A4:F4');
      const dealerCell = sheet.getCell('A4');
      dealerCell.value = 'AUTHORIZED DEALER FOR PICK ELECTRIC AUTO PRIVATE LIMITED';
      dealerCell.font = { name: 'Inter', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      dealerCell.alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.mergeCells('A5:F5');
      const taxInvoiceTitle = sheet.getCell('A5');
      taxInvoiceTitle.value = 'TAX INVOICE';
      taxInvoiceTitle.font = { name: 'Inter', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      taxInvoiceTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      taxInvoiceTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      applyAllBorders(taxInvoiceTitle);

      sheet.mergeCells('A6:F6');
      const taxSubTitle = sheet.getCell('A6');
      taxSubTitle.value = 'ISSUED UNDER RULE 46 OF THE CENTRAL GOODS AND SERVICE TAX RULES, 2017';
      taxSubTitle.font = { name: 'Inter', size: 8, bold: true, color: { argb: 'FF475569' } };
      taxSubTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      taxSubTitle.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

      // Details Grid
      sheet.addRow([]);

      sheet.mergeCells('A8:C8');
      sheet.mergeCells('D8:F8');
      const custHead = sheet.getCell('A8');
      const invHead = sheet.getCell('D8');
      custHead.value = 'CUSTOMER DETAILS';
      invHead.value = 'INVOICE DETAILS';
      [custHead, invHead].forEach(c => {
        c.font = { name: 'Inter', size: 10, bold: true, color: { argb: 'FF1E293B' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        applyAllBorders(c);
      });

      const addDetailRow = (r: number, leftL: string, leftV: string, rightL: string, rightV: string) => {
        sheet.mergeCells(`B${r}:C${r}`);
        sheet.mergeCells(`E${r}:F${r}`);
        sheet.getCell(`A${r}`).value = leftL;
        sheet.getCell(`B${r}`).value = leftV;
        sheet.getCell(`D${r}`).value = rightL;
        sheet.getCell(`E${r}`).value = rightV;
        
        sheet.getCell(`A${r}`).font = { name: 'Inter', size: 9, bold: true, color: { argb: 'FF475569' } };
        sheet.getCell(`B${r}`).font = { name: 'Inter', size: 9, bold: true, color: { argb: 'FF0F172A' } };
        sheet.getCell(`D${r}`).font = { name: 'Inter', size: 9, bold: true, color: { argb: 'FF475569' } };
        sheet.getCell(`E${r}`).font = { name: 'Inter', size: 9, bold: true, color: { argb: 'FF0F172A' } };
        
        [sheet.getCell(`A${r}`), sheet.getCell(`B${r}`), sheet.getCell(`C${r}`), sheet.getCell(`D${r}`), sheet.getCell(`E${r}`), sheet.getCell(`F${r}`)].forEach(c => c.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' }, top: { style: 'thin' } });
      };

      const dateStr = new Date(selectedSale.saleDate).toLocaleDateString('en-GB').replace(/\//g, '.');
      
      addDetailRow(9, 'Customer Name:', selectedSale.customerName.toUpperCase(), 'Invoice No:', selectedSale.invoiceId);
      addDetailRow(10, 'S/O-WO/DO:', (selectedSale.relationName || '').toUpperCase(), 'Invoice Date:', dateStr);
      addDetailRow(11, 'Address:', selectedSale.address.toUpperCase(), 'GSTIN No:', '10ADPPY5004Q1Z2');
      addDetailRow(12, 'Mobile No:', selectedSale.phoneNumber, 'PAN No:', 'ADPPY5004Q');
      addDetailRow(13, 'State:', 'Bihar (Code: 10)', 'Dealer Code:', 'IN001SA10');

      sheet.addRow([]);
      sheet.mergeCells('A15:F15');
      const hypoCell = sheet.getCell('A15');
      hypoCell.value = `HYPOTHECATION WITH: ${selectedSale.hypothecation || 'N/A'}`;
      hypoCell.font = { name: 'Inter', size: 10, bold: true };
      applyAllBorders(hypoCell);

      sheet.addRow([]);

      // Main Table Header
      const tableHead = sheet.getRow(17);
      tableHead.values = ['MODEL DESCRIPTION', 'HSN/SAC', 'QTY', 'RATE (₹)', 'DISCOUNT', 'AMOUNT (₹)'];
      tableHead.height = 25;
      tableHead.eachCell((cell) => {
        cell.font = { name: 'Inter', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        applyAllBorders(cell);
      });

      // Item Row
      const itemRow = sheet.getRow(18);
      itemRow.values = [
        selectedSale.vehicleModel || 'Pick Electric Z',
        '8703.80.40',
        1,
        selectedSale.sellingPrice,
        '',
        Math.round(selectedSale.sellingPrice)
      ];
      itemRow.height = 20;
      itemRow.getCell(4).numFmt = '#,##0.00';
      itemRow.getCell(6).numFmt = '#,##0.00';
      itemRow.eachCell(c => applyAllBorders(c));

      // Details Sub-row
      sheet.mergeCells('A19:F19');
      const detailsSubCell = sheet.getCell('A19');
      detailsSubCell.value = `Chassis No: ${selectedSale.chassisNumber} | Motor No: ${vehicleDetails?.motorNumber || 'N/A'}\nBatteries: ${vehicleDetails?.batteryNumbers?.join(', ') || 'N/A'} | Color: ${vehicleDetails?.color || 'N/A'}`;
      detailsSubCell.font = { name: 'Inter', size: 8, color: { argb: 'FF475569' } };
      detailsSubCell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
      sheet.getRow(19).height = 30;
      applyAllBorders(detailsSubCell);
      applyAllBorders(sheet.getCell('F19'));

      // Empty rows for layout before total
      sheet.addRow(['', '', '', '', '', '']).eachCell(c => applyAllBorders(c));
      sheet.addRow(['', '', '', '', '', '']).eachCell(c => applyAllBorders(c));

      // Adding SGST / CGST rows if necessary directly or in tax section
      sheet.getRow(22).values = ['', '', '', 'SGST (2.5%)', '', parseFloat((selectedSale.gstAmount / 2).toFixed(2))];
      sheet.getRow(23).values = ['', '', '', 'CGST (2.5%)', '', parseFloat((selectedSale.gstAmount / 2).toFixed(2))];
      sheet.getRow(22).getCell(6).numFmt = '#,##0.00';
      sheet.getRow(23).getCell(6).numFmt = '#,##0.00';
      sheet.getRow(22).eachCell(c => applyAllBorders(c));
      sheet.getRow(23).eachCell(c => applyAllBorders(c));

      // Total Row
      const totalRow = sheet.getRow(24);
      totalRow.values = ['GRAND TOTAL', '', '', '', '', Math.round(selectedSale.totalAmount)];
      sheet.mergeCells('A24:D24');
      totalRow.font = { name: 'Inter', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      totalRow.getCell(1).alignment = { horizontal: 'right' };
      totalRow.getCell(6).numFmt = '#,##0.00';
      totalRow.eachCell(c => applyAllBorders(c));

      sheet.addRow([]);

      sheet.mergeCells('A26:F26');
      const wordsCell = sheet.getCell('A26');
      wordsCell.value = `Amount in Words: ${numberToWords(Math.round(selectedSale.totalAmount)).toUpperCase()} RUPEES ONLY.`;
      wordsCell.font = { name: 'Inter', size: 9, bold: true, color: { argb: 'FF334155' } };
      wordsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      applyAllBorders(wordsCell);

      sheet.addRow([]);

      // Tax Breakdown
      sheet.mergeCells('A28:B28');
      const taxHeader = sheet.getCell('A28');
      taxHeader.value = 'TAX BREAKDOWN';
      taxHeader.font = { name: 'Inter', size: 10, bold: true };
      applyAllBorders(taxHeader);

      const tHead = sheet.getRow(29);
      tHead.values = ['HSN/SAC', 'Taxable Value', 'SGST (2.5%)', 'CGST (2.5%)', 'IGST (0%)', 'Total Tax'];
      tHead.font = { name: 'Inter', size: 9, bold: true };
      tHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      tHead.eachCell(c => applyAllBorders(c));

      const tBody = sheet.getRow(30);
      tBody.values = [
        '8703.80.40',
        Math.round(selectedSale.sellingPrice),
        parseFloat((selectedSale.gstAmount / 2).toFixed(2)),
        parseFloat((selectedSale.gstAmount / 2).toFixed(2)),
        0,
        Math.round(selectedSale.gstAmount)
      ];
      tBody.font = { name: 'Inter', size: 9 };
      [2,3,4,5,6].forEach(i => tBody.getCell(i).numFmt = '#,##0.00');
      tBody.eachCell(c => applyAllBorders(c));

      sheet.addRow([]);

      // Footer
      sheet.mergeCells('A32:F32');
      const noteCell = sheet.getCell('A32');
      noteCell.value = 'NOTES: 1. Interest @ 24% p.a. will be charged if bill is not paid within 7 days. 2. Goods once sold will not be taken back. 3. All subjects to BARH jurisdiction only.';
      noteCell.font = { name: 'Inter', size: 8, italic: true, color: { argb: 'FF64748B' } };

      sheet.mergeCells('A36:C36');
      sheet.mergeCells('D36:F36');
      sheet.getCell('A36').value = 'Customer Signature';
      sheet.getCell('D36').value = 'For M/S Pick Electric Automobiles (Authorized Signatory)';
      sheet.getCell('A36').font = { name: 'Inter', size: 10, bold: true };
      sheet.getCell('D36').font = { name: 'Inter', size: 10, bold: true };
      sheet.getCell('D36').alignment = { horizontal: 'right' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Invoice_${selectedSale.invoiceId}.xlsx`);
      setNotification({ message: 'Excel generated successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to generate Excel.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white flex justify-between items-center z-50 min-w-[300px] ${notification.type === 'error' ? 'bg-rose-500' : notification.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 text-white hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Invoice?"
        message="Are you sure you want to delete this invoice? The associated vehicle will be marked as 'In Stock' again. This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showMultiDeleteConfirm}
        title="Delete Multiple Invoices?"
        message={`Are you sure you want to delete ${selectedInvoices.length} selected invoices? The associated vehicles will be marked as 'In Stock' again. This action cannot be undone.`}
        confirmLabel="Delete Selected"
        onConfirm={() => {
          if (onDeleteSale) {
            selectedInvoices.forEach(id => onDeleteSale(id));
            setSelectedInvoices([]);
            setNotification({ message: 'Selected invoices deleted successfully!', type: 'success' });
          }
          setShowMultiDeleteConfirm(false);
        }}
        onCancel={() => setShowMultiDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this form. If you close now, your changes will be lost."
        confirmLabel="Discard Changes"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <div className="mb-4 hidden no-print">
        {/* Placeholder to keep layout intact if needed */}
      </div>

      {/* Enterprise Dashboard Layout */}
      {!isCreating && !selectedSale && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 no-print">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                Invoice Management
              </h2>
              <p className="text-sm text-slate-500 mt-1">Manage and track your customer invoices effectively.</p>
            </div>
          </div>
          
          {/* 2-Layer Enterprise Header */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6 no-print">

            {/* Combined Toolbar */}
            <div className="px-5 py-4 border-b border-slate-100 bg-white flex flex-col gap-4">
               {/* Top Row: Smart Search */}
               <div className="flex justify-end w-full">
                  <div className="relative group w-full sm:w-[320px]">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                     </div>
                     <input
                        type="text"
                        className="block w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-normal h-10"
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                     <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                        {searchTerm && (
                           <button onClick={() => setSearchTerm('')} className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors">
                              <X className="w-3.5 h-3.5" />
                           </button>
                        )}
                     </div>
                  </div>
               </div>

               {/* Bottom Row: Date Pickers & Status Dropdown on Left, Actions on Right */}
               <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                     {/* Separate Date Pickers */}
                     <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden h-10 transition-all">
                           <div className="flex items-center pl-3 pr-2 h-full bg-slate-50 border-r border-slate-200 text-slate-500">
                              <Calendar className="w-4 h-4" />
                           </div>
                           <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="border-none bg-transparent text-sm font-medium text-slate-700 outline-none focus:ring-0 px-3 py-2 w-[125px] cursor-pointer"
                           />
                        </div>
                        
                        <span className="text-slate-300 font-medium px-0.5">→</span>
                        
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden h-10 transition-all">
                           <div className="flex items-center pl-3 pr-2 h-full bg-slate-50 border-r border-slate-200 text-slate-500">
                              <Calendar className="w-4 h-4" />
                           </div>
                           <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="border-none bg-transparent text-sm font-medium text-slate-700 outline-none focus:ring-0 px-3 py-2 w-[125px] cursor-pointer"
                           />
                        </div>
                        
                        <button
                           onClick={() => {
                              setAppliedStartDate(startDate);
                              setAppliedEndDate(endDate);
                           }}
                           className="flex items-center justify-center h-10 w-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors ml-0.5 border border-blue-100"
                           title="Search by Date"
                        >
                           <Search className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => { 
                              setStartDate(''); 
                              setEndDate(''); 
                              setAppliedStartDate(''); 
                              setAppliedEndDate(''); 
                           }}
                           disabled={!(startDate || endDate || appliedStartDate || appliedEndDate)}
                           className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center h-10 text-sm font-medium border border-transparent ml-0.5 min-w-[70px] ${
                              (startDate || endDate || appliedStartDate || appliedEndDate)
                                 ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                 : 'text-slate-300 opacity-50 cursor-not-allowed'
                           }`}
                           title="Clear Dates"
                        >
                           Clear
                        </button>
                     </div>

                     <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

                     {/* Status Dropdown */}
                     <div className="relative isolate">
                        <select
                           value={statusFilter}
                           onChange={(e) => setStatusFilter(e.target.value)}
                           className="appearance-none block w-[130px] pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-10 shadow-sm cursor-pointer"
                        >
                           <option value="all">All Status</option>
                           <option value="paid">Paid</option>
                           <option value="pending">Pending</option>
                           <option value="overdue">Overdue</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                           <ChevronDown className="w-4 h-4" />
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                     <div className="relative">
                     <button onClick={() => {
                        try {
                           const workbook = new ExcelJS.Workbook();
                           const sheet = workbook.addWorksheet('Invoices');
                           sheet.columns = [
                              { header: 'Invoice No', key: 'invoiceId', width: 20 },
                              { header: 'Date', key: 'saleDate', width: 15 },
                              { header: 'Customer', key: 'customerName', width: 30 },
                              { header: 'Chassis', key: 'chassisNumber', width: 20 },
                              { header: 'Total Value', key: 'totalAmount', width: 15 }
                           ];
                           
                           filteredSales.forEach(s => {
                              sheet.addRow({
                                 invoiceId: s.invoiceId,
                                 saleDate: s.saleDate,
                                 customerName: s.customerName,
                                 chassisNumber: s.chassisNumber,
                                 totalAmount: s.totalAmount
                              });
                           });
                           
                           workbook.xlsx.writeBuffer().then(buffer => {
                              saveAs(new Blob([buffer]), `Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
                              setNotification({ message: 'List exported successfully!', type: 'success' });
                           });
                        } catch (err) {
                           setNotification({ message: 'Failed to export list.', type: 'error' });
                        }
                     }} className="flex items-center justify-center min-w-[110px] px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm font-semibold h-10">
                        <Download className="w-4 h-4 mr-2 text-slate-500" />
                        Export
                        <ChevronDown className="w-3.5 h-3.5 ml-2 text-slate-400" />
                     </button>
                  </div>
                  
                  {onDeleteSale && (
                     <button
                        onClick={() => setShowMultiDeleteConfirm(true)}
                        disabled={selectedInvoices.length === 0}
                        className={`flex items-center justify-center min-w-[100px] px-4 py-2 border rounded-xl transition-colors shadow-sm text-sm font-bold h-10 ${
                           selectedInvoices.length > 0 
                              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70 cursor-not-allowed'
                        }`}
                     >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                     </button>
                  )}
                  
                  {onAddSale && (
                     <button
                        onClick={() => {
                           setIsCreating(true);
                           setSelectedSaleId(null);
                        }}
                        className="flex items-center justify-center min-w-[180px] px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm font-bold border border-blue-700/50 h-10"
                     >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create New Invoice
                     </button>
                  )}
               </div>
               </div>
            </div>
          </div>

          {/* Advanced Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-3 py-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={filteredSales.length > 0 && selectedInvoices.length === filteredSales.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedInvoices(filteredSales.map(s => s.id));
                          else setSelectedInvoices([]);
                        }}
                      />
                    </th>
                    <th className="px-3 py-4 w-10">S.No.</th>
                    <th className="px-6 py-4">Invoice No</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Model & Chassis</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="h-10 w-10 text-slate-300 mb-3" />
                          <p className="text-base font-medium text-slate-800">No invoices found</p>
                          <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale, index) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={selectedInvoices.includes(sale.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedInvoices(prev => [...prev, sale.id]);
                              else setSelectedInvoices(prev => prev.filter(id => id !== sale.id));
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-600 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => setSelectedSaleId(sale.id)}
                            className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {sale.invoiceId}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {new Date(sale.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedSaleId(sale.id)}>
                          <div className="text-sm font-semibold text-slate-900">{sale.customerName}</div>
                          <div className="text-xs text-slate-500 max-w-[200px] truncate">{sale.address}</div>
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedSaleId(sale.id)}>
                          <div className="text-sm font-medium text-slate-800">{sale.vehicleModel || 'Pick Electric Z'}</div>
                          <div className="text-xs font-mono text-slate-500">{sale.chassisNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Paid
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right cursor-pointer" onClick={() => setSelectedSaleId(sale.id)}>
                          <div className="text-sm font-extrabold text-slate-900">{formatCurrency(sale.totalAmount)}</div>
                          <div className="text-xs text-slate-500">Incl. GST</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedSaleId(sale.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View details">
                              <FileText className="w-4 h-4" />
                            </button>
                            {onUpdateSale && (
                              <button 
                                onClick={() => {
                                  setSelectedSaleId(sale.id);
                                  setTimeout(handleEditStart, 50);
                                }} 
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" 
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-600">
                 <div>Showing <span className="font-bold">{filteredSales.length}</span> entries</div>
                 <div className="flex space-x-1">
                    <button className="px-3 py-1 border border-slate-300 rounded bg-white disabled:opacity-50" disabled>Prev</button>
                    <button className="px-3 py-1 border border-blue-600 rounded bg-blue-600 text-white font-medium">1</button>
                    <button className="px-3 py-1 border border-slate-300 rounded bg-white disabled:opacity-50" disabled>Next</button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* When Create or Preview Mode */}
      {(isCreating || selectedSale) && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Work Area */}
          <div className="flex-1 w-full max-w-full overflow-hidden">
             {isCreating ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden no-print">
              <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-900 to-blue-800 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</h3>
                    <p className="text-blue-200 text-xs font-medium">Enterprise Wizard Workflow</p>
                  </div>
                </div>
                <button onClick={handleCancelIntent} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-0">
                <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto hidden sm:flex">
                   <div className="flex-1 py-4 px-6 text-center border-b-2 border-blue-600 font-bold flex flex-col items-center text-blue-700">
                     <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mb-1">1</span>
                     Customer
                   </div>
                   <div className="flex-1 py-4 px-6 text-center text-slate-500 font-medium flex flex-col items-center">
                     <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs mb-1">2</span>
                     Vehicle
                   </div>
                   <div className="flex-1 py-4 px-6 text-center text-slate-500 font-medium flex flex-col items-center">
                     <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs mb-1">3</span>
                     Pricing
                   </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Details */}
                    <div className="col-span-1 md:col-span-2 pb-2 border-b border-slate-100 font-bold text-slate-800 text-lg flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm">1</div>
                      Customer Profile & Details
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        name="customerName"
                        required
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition"
                        placeholder="Full Legal Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">S/O-WO/DO</label>
                      <input
                        type="text"
                        name="relationName"
                        value={formData.relationName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition"
                        placeholder="Father/Husband Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition"
                        placeholder="+91"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Post Office</label>
                      <input
                        type="text"
                        name="postOffice"
                        value={formData.postOffice}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition"
                        placeholder="PO"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Police Station</label>
                      <input
                        type="text"
                        name="policeStation"
                        value={formData.policeStation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition"
                        placeholder="PS"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">District & Pin</label>
                      <input
                        type="text"
                        name="districtPin"
                        value={formData.districtPin}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition"
                        placeholder="District - PIN Code"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Address *</label>
                      <textarea
                        name="address"
                        required
                        rows={2}
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition"
                        placeholder="Complete postal address"
                      />
                    </div>

                    {/* Vehicle Selection & Extra Specs */}
                    <div className="col-span-1 md:col-span-2 pb-2 border-b border-slate-100 font-bold text-slate-800 text-lg flex items-center mt-6">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mr-3 text-sm">2</div>
                      Vehicle & Model Details
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Chassis Number *</label>
                      <select
                        name="chassisNumber"
                        required
                        value={formData.chassisNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">-- Select Available Vehicle --</option>
                        {availableVehiclesForSelect.map(v => (
                          <option key={v.id} value={v.chassisNumber}>
                            {v.chassisNumber} ({v.color})
                          </option>
                        ))}
                      </select>
                      {availableVehiclesForSelect.length === 0 && (
                        <p className="text-xs text-rose-500 mt-1 font-medium">No vehicles in stock!</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Vehicle Model</label>
                      <input
                        type="text"
                        name="vehicleModel"
                        readOnly
                        value={formData.vehicleModel || 'Pick Electric'}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">WRC & Book No.</label>
                      <input
                        type="text"
                        name="wrcBookNo"
                        value={formData.wrcBookNo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="WRC/Book No"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Key Number</label>
                      <input
                        type="text"
                        name="keyNumber"
                        value={formData.keyNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Key #"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Hypothecation With (Optional)</label>
                      <input
                        type="text"
                        name="hypothecation"
                        value={formData.hypothecation}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Financier/Bank Name"
                      />
                    </div>

                    {/* Dealer / Sales Info */}
                    <div className="col-span-1 md:col-span-2 pb-2 border-b border-slate-100 font-bold text-slate-800 text-lg flex items-center mt-6">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mr-3 text-sm">3</div>
                      Sales & Pricing Details
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Sales Person</label>
                      <input
                        type="text"
                        name="salesPerson"
                        value={formData.salesPerson}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Sales Person Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery From</label>
                      <input
                        type="text"
                        name="deliveryFrom"
                        value={formData.deliveryFrom}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Location"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                      <input
                        type="number" step="0.01"
                        name="sellingPrice"
                        required
                        min="0"
                        value={formData.sellingPrice}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-semibold"
                        placeholder="Base Price"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Sale Date *</label>
                      <input
                        type="date"
                        name="saleDate"
                        required
                        value={formData.saleDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">GST (5%)</label>
                      <input
                        type="text"
                        readOnly
                        value={formatCurrency(formData.gstAmount)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 font-medium cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-blue-900 mb-1">Total Amount</label>
                      <input
                        type="text"
                        readOnly
                        value={formatCurrency(formData.totalAmount)}
                        className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg bg-blue-50 text-blue-700 font-bold cursor-not-allowed text-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleCancelIntent}
                      className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={availableVehiclesForSelect.length === 0}
                      className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                    >
                      {isEditing ? 'Save Changes' : (
                        <div className="flex items-center">
                           <Save className="w-4 h-4 mr-2" />
                           Generate Invoice
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : selectedSale ? (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 no-print">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedSaleId(null)}
                    className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium border border-slate-200 h-10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                  {onUpdateSale && (
                    <button
                      onClick={handleEditStart}
                      className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shadow-sm text-sm font-medium border border-slate-200 h-10"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  )}
                  {onDeleteSale && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors shadow-sm text-sm font-medium border border-rose-200 h-10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel Format
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Invoice
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save as PDF
                  </button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div id="printable-invoice-content" className="printable-invoice bg-white max-w-[950px] mx-auto text-sm leading-snug text-slate-800 font-sans shadow-lg rounded-sm sm:p-12 p-6 print:shadow-none print:p-0 print:w-full print:max-w-none print:rounded-none">
                 <div className="flex flex-col relative border border-slate-200">
                    
                    {/* Header Section */}
                    <div className="flex justify-between items-start bg-blue-900 text-white p-10 pb-8 rounded-t-lg">
                       <div className="flex-1">
                          <h1 className="text-3xl font-black tracking-tight text-white mb-2">PICK ELECTRIC AUTO PRIVATE LIMITED</h1>
                          <p className="text-white/90 font-medium mb-1">Industrial Estate, EV Manufacturing Hub, Sector 5</p>
                          <p className="text-white/90 mb-1">HQ | Mob: +91 9999999999</p>
                          <p className="text-white/90 mb-2">billing@pickelectricauto.com</p>
                          <p className="inline-block px-3 py-1 bg-white/10 text-white text-xs font-bold rounded mt-3 border border-white/20 uppercase tracking-widest">
                             Corporate ERP Invoice Document
                          </p>
                       </div>
                       <div className="text-right flex flex-col items-end">
                          <div className="mb-4 bg-white p-2 rounded">
                             <QRCode value={selectedSale.invoiceId} size={72} fgColor="#1e3a8a" />
                          </div>
                          <h2 className="text-2xl font-bold text-white uppercase tracking-widest mt-1">TAX INVOICE</h2>
                          <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider mt-1">Issued under Rule 46 of CGST 2017</p>
                       </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="flex">
                       <div className="w-1/2 p-8 border-r border-b border-slate-200 bg-white">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">CUSTOMER DETAILS</h3>
                          <div className="space-y-3">
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">Customer Name:</span><span className="font-bold text-slate-900 uppercase flex-1">{selectedSale.customerName}</span></div>
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">S/O-WO/DO:</span><span className="font-medium text-slate-800 uppercase flex-1">{selectedSale.relationName}</span></div>
                             <div className="flex items-start"><span className="w-32 text-slate-500 font-medium text-xs uppercase">Address:</span><span className="font-medium text-slate-800 uppercase flex-1">{selectedSale.address}</span></div>
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">Mobile No:</span><span className="font-medium text-slate-800 flex-1">{selectedSale.phoneNumber}</span></div>
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">State:</span><span className="font-medium text-slate-800 uppercase flex-1">Bihar (Code: 10)</span></div>
                          </div>
                       </div>
                       <div className="w-1/2 p-8 border-b border-slate-200 bg-slate-50">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">INVOICE INFORMATION</h3>
                          <div className="space-y-3 relative">
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">Invoice No:</span><span className="font-bold text-slate-900 flex-1">{selectedSale.invoiceId}</span></div>
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">Invoice Date:</span><span className="font-medium text-slate-800 flex-1">{new Date(selectedSale.saleDate).toLocaleDateString('en-GB').replace(/\//g, '.')}</span></div>
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">GSTIN No:</span><span className="font-medium text-slate-800 font-mono flex-1">10ADPPY5004Q1Z2</span></div>
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">PAN No:</span><span className="font-medium text-slate-800 font-mono flex-1">ADPPY5004Q</span></div>
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">Dealer Code:</span><span className="font-medium text-slate-800 flex-1">IN001SA10</span></div>
                             <div className="flex"><span className="w-32 text-slate-500 font-medium text-xs uppercase">Sales Person:</span><span className="font-medium text-slate-800 uppercase flex-1">{selectedSale.salesPerson || 'ASHOK'}</span></div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-[#f8fafc] px-8 py-4 border-b border-slate-200 flex items-center">
                       <span className="text-slate-500 font-bold mr-4 uppercase text-[10px] tracking-widest">HYPOTHECATION WITH:</span>
                       <span className="font-bold text-slate-900 text-sm uppercase">{selectedSale.hypothecation || 'N/A'}</span>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-[#1e293b] text-white border-b border-[#1e293b]">
                             <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider w-12 text-center border border-[#1e293b]">SL NO.</th>
                             <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider border border-[#1e293b]">VEHICLE MODEL & DETAILS</th>
                             <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider w-24 text-center border border-[#1e293b]">HSN/SAC</th>
                             <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider w-16 text-center border border-[#1e293b]">QTY</th>
                             <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider w-32 text-right border border-[#1e293b]">RATE</th>
                             <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider w-32 text-right border border-[#1e293b]">NET VALUE</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200">
                          <tr>
                             <td className="py-5 px-4 text-center font-bold text-slate-700 align-top border border-slate-200">1</td>
                             <td className="py-5 px-4 align-top border border-slate-200">
                                <div className="font-bold text-slate-900 text-[13px] uppercase mb-1">{selectedSale.vehicleModel || 'Pick Electric Z'}</div>
                                <p className="text-[10px] text-slate-500 mb-4 max-w-[340px] uppercase font-medium leading-relaxed">
                                   NEW PICK ELECTRIC AUTO THREE WHEELER (T) BATTERY OPERATED VEHICLE WITH TOOLS AND MANNUALS AS SUPPLIED BY THE MANUFACTURERS.
                                </p>
                                
                                <div className="border border-slate-200 rounded grid grid-cols-2 text-[10px] uppercase font-medium divide-y divide-slate-200">
                                   <div className="flex justify-between px-3 py-1.5"><span className="text-slate-500">Chassis No:</span><span className="font-bold text-slate-900">{selectedSale.chassisNumber}</span></div>
                                   <div className="flex justify-between px-3 py-1.5 border-l border-slate-200"><span className="text-slate-500">Motor No:</span><span className="font-bold text-slate-900">{vehicleDetails?.motorNumber || 'N/A'}</span></div>
                                   <div className="flex justify-between px-3 py-1.5"><span className="text-slate-500">Batteries:</span><span className="font-bold text-slate-900">{vehicleDetails?.batteryNumbers?.join(', ') || 'N/A'}</span></div>
                                   <div className="flex justify-between px-3 py-1.5 border-l border-slate-200"><span className="text-slate-500">Color:</span><span className="font-bold text-slate-900">{vehicleDetails?.color || 'RED'}</span></div>
                                   <div className="flex justify-between px-3 py-1.5 col-span-2"><span className="text-slate-500">Key No:</span><span className="font-bold text-slate-900">{selectedSale.keyNumber || 'N/A'}</span></div>
                                </div>
                             </td>
                             <td className="py-5 px-4 text-center text-slate-700 font-bold align-top border border-slate-200">8703.80.40</td>
                             <td className="py-5 px-4 text-center font-bold text-slate-900 align-top border border-slate-200">1</td>
                             <td className="py-5 px-4 text-right font-bold text-slate-700 align-top border border-slate-200">{selectedSale.sellingPrice.toFixed(2)}</td>
                             <td className="py-5 px-4 text-right font-bold text-slate-900 align-top border border-slate-200">{Math.round(selectedSale.sellingPrice).toFixed(2)}</td>
                          </tr>
                          
                          {/* Tax Included Rows shown inline instead of table to save space */}
                          <tr className="bg-[#f8fafc]">
                             <td colSpan={4} className="border border-slate-200"></td>
                             <td className="py-2 px-4 text-right text-slate-600 font-bold text-[11px] uppercase border border-slate-200">SGST (2.5%)</td>
                             <td className="py-2 px-4 text-right font-bold text-slate-800 border border-slate-200">{(selectedSale.gstAmount / 2).toFixed(2)}</td>
                          </tr>
                          <tr className="bg-[#f8fafc]">
                             <td colSpan={4} className="border border-slate-200"></td>
                             <td className="py-2 px-4 text-right text-slate-600 font-bold text-[11px] uppercase border border-slate-200">CGST (2.5%)</td>
                             <td className="py-2 px-4 text-right font-bold text-slate-800 border border-slate-200">{(selectedSale.gstAmount / 2).toFixed(2)}</td>
                          </tr>
                       </tbody>
                       <tfoot>
                          <tr className="bg-slate-50">
                             <td colSpan={4} className="py-4 px-4 border border-slate-200 bg-white">
                                <div className="flex flex-col">
                                   <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">AMOUNT IN WORDS</span>
                                   <span className="font-bold text-slate-800 text-xs">{numberToWords(Math.round(selectedSale.totalAmount)).toUpperCase()} RUPEES ONLY.</span>
                                </div>
                             </td>
                             <td className="py-4 px-4 text-right font-black text-[#1e3a8a] uppercase text-sm border-b border-t border-slate-200">GRAND TOTAL</td>
                             <td className="py-4 px-4 text-right font-black text-slate-900 text-lg border border-slate-200 bg-[#f8fafc]">₹{Math.round(selectedSale.totalAmount).toFixed(2)}</td>
                          </tr>
                       </tfoot>
                    </table>

                    {/* Tax Breakdown Matrix */}
                    <div className="bg-white">
                       <table className="w-full text-xs text-center border-t border-slate-200">
                          <thead className="bg-[#1e293b] text-white">
                             <tr>
                                <th className="py-2 px-2 font-bold uppercase tracking-wider border border-[#1e293b]">HSN/SAC</th>
                                <th className="py-2 px-2 font-bold uppercase tracking-wider border border-[#1e293b]">Taxable Value</th>
                                <th className="py-2 px-2 font-bold uppercase tracking-wider border border-[#1e293b]" colSpan={2}>SGST</th>
                                <th className="py-2 px-2 font-bold uppercase tracking-wider border border-[#1e293b]" colSpan={2}>CGST</th>
                                <th className="py-2 px-2 font-bold uppercase tracking-wider border border-[#1e293b]">Total Tax</th>
                             </tr>
                             <tr className="bg-slate-800 text-[10px]">
                                <th className="border border-[#1e293b]"></th>
                                <th className="border border-[#1e293b]"></th>
                                <th className="py-1 px-2 font-bold uppercase tracking-wider border border-[#1e293b] text-white/80">Rate</th>
                                <th className="py-1 px-2 font-bold uppercase tracking-wider border border-[#1e293b] text-white/80">Amount</th>
                                <th className="py-1 px-2 font-bold uppercase tracking-wider border border-[#1e293b] text-white/80">Rate</th>
                                <th className="py-1 px-2 font-bold uppercase tracking-wider border border-[#1e293b] text-white/80">Amount</th>
                                <th className="border border-[#1e293b]"></th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-800">
                             <tr>
                                <td className="py-3 px-2 font-bold border border-slate-200">8703.80.40</td>
                                <td className="py-3 px-2 border border-slate-200 font-bold text-slate-700">{Math.round(selectedSale.sellingPrice).toFixed(2)}</td>
                                <td className="py-3 px-2 border border-slate-200 text-slate-500 font-bold">2.5%</td>
                                <td className="py-3 px-2 border border-slate-200 font-bold text-slate-700">{(selectedSale.gstAmount / 2).toFixed(2)}</td>
                                <td className="py-3 px-2 border border-slate-200 text-slate-500 font-bold">2.5%</td>
                                <td className="py-3 px-2 border border-slate-200 font-bold text-slate-700">{(selectedSale.gstAmount / 2).toFixed(2)}</td>
                                <td className="py-3 px-2 border border-slate-200 font-bold text-slate-900 bg-[#f8fafc]">{Math.round(selectedSale.gstAmount).toFixed(2)}</td>
                             </tr>
                          </tbody>
                       </table>
                    </div>

                    {/* Footer / Terms */}
                    <div className="grid grid-cols-2 bg-white flex-1 min-h-[180px]">
                       <div className="p-8 border-r border-slate-200 text-[10px]">
                          <p className="font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">TERMS & CONDITIONS</p>
                          <ul className="list-disc pl-4 space-y-2 text-slate-600 font-medium border-l-2 border-transparent">
                             <li>Interest @ 24% p.a. will be charged if bill is not paid within 7 days.</li>
                             <li>Our responsibility ceases once goods have left our showroom/godown.</li>
                             <li>Goods once sold will not be taken back or exchanged.</li>
                             <li>Please check the goods before accepting delivery.</li>
                             <li>All subjects to BARH (PATNA) jurisdiction only.</li>
                          </ul>
                       </div>
                       <div className="p-8 relative flex flex-col justify-between bg-slate-50">
                          <div className="text-right">
                             <p className="font-black text-slate-800 text-sm">For PICK ELECTRIC AUTO PRIVATE LIMITED</p>
                             <p className="text-slate-400 text-[10px] mt-1 uppercase font-bold tracking-widest">(AUTHORIZED SIGNATORY)</p>
                          </div>
                          <div className="mt-16 flex justify-between items-end border-t border-slate-200 pt-4">
                             <div className="text-center w-40">
                                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-1">CUSTOMER SIGNATURE</p>
                             </div>
                             <div className="text-center w-40">
                                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-1">AUTHORIZED SEAL</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[600px] flex flex-col items-center justify-center p-8 text-center no-print">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No Invoice Selected</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Select a sale record from the list to view, print, or download its invoice.</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
