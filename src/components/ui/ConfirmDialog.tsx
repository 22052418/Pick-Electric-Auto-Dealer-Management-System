import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex bg-rose-100 p-3 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <button 
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            {message}
          </p>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-100">
          <button 
            onClick={onCancel} 
            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm font-semibold shadow-sm"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-sm hover:shadow-md text-sm font-semibold flex items-center"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
