'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Upload, CheckCircle, CheckCircle2, Clock, AlertCircle,
  X, Loader2, Eye, Trash2, ShieldCheck, AlertTriangle, CloudUpload,
  FileCheck, FileClock, FileX, ChevronRight, Download, Info,
} from 'lucide-react';

interface Document {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentNumber: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  uploadedBy?: { id: string; name: string; role: string } | null;
}

const DOC_TYPES = [
  {
    type: 'GST_CERTIFICATE',
    name: 'GST Certificate',
    required: false,
    description: 'GST registration certificate from the government portal',
    icon: '🏛️',
    hint: 'Download from GST portal — gstin.gov.in',
  },
  {
    type: 'PAN_CARD',
    name: 'PAN Card',
    required: true,
    description: 'Business PAN or proprietor PAN card',
    icon: '🪪',
    hint: 'Both sides of the PAN card in one image',
  },
  {
    type: 'ADDRESS_PROOF',
    name: 'Address Proof',
    required: true,
    description: 'Utility bill, rent agreement, or any government address proof',
    icon: '🏠',
    hint: 'Must be less than 3 months old for utility bills',
  },
  {
    type: 'BUSINESS_REGISTRATION',
    name: 'Business Registration',
    required: false,
    description: 'Company registration certificate, partnership deed, or trade license',
    icon: '📋',
    hint: 'Any of: Pvt Ltd cert, partnership deed, trade license',
  },
  {
    type: 'CANCELLED_CHEQUE',
    name: 'Cancelled Cheque',
    required: false,
    description: 'Cancelled cheque from your business bank account for verification',
    icon: '🏦',
    hint: 'Business account preferred; must show IFSC & account number',
  },
  {
    type: 'OWNER_AADHAAR',
    name: "Owner's Aadhaar",
    required: false,
    description: "Proprietor or director's Aadhaar card (both sides)",
    icon: '🪪',
    hint: 'Both front and back — combine into a single image or PDF',
  },
];

const STATUS_CONFIG = {
  APPROVED: {
    label: 'Approved',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  PENDING: {
    label: 'Under Review',
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    icon: Clock,
    iconColor: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  REJECTED: {
    label: 'Rejected',
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-300',
    bg: 'bg-red-50',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    dot: 'bg-red-500',
  },
};

export default function VendorDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; docType: string | null }>({ open: false, docType: null });
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/vendor/documents');
      if (res.ok) setDocuments(await res.json());
    } catch {/* silent */}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const getDoc = (type: string) => documents.find(d => d.documentType === type);

  const openUpload = (type: string) => {
    setUploadModal({ open: true, docType: type });
    setDocumentNumber('');
    setSelectedFile(null);
  };

  const closeUpload = () => {
    setUploadModal({ open: false, docType: null });
    setSelectedFile(null);
    setDocumentNumber('');
  };

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5 MB'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { alert('Only JPG, PNG, WebP or PDF allowed'); return; }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadModal.docType) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('documentType', uploadModal.docType);
      form.append('documentNumber', documentNumber);
      const res = await fetch('/api/vendor/documents', { method: 'POST', body: form });
      if (res.ok) { closeUpload(); fetchDocuments(); }
      else { const e = await res.json(); alert(e.error || 'Upload failed'); }
    } catch { alert('Upload failed. Please try again.'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    const res = await fetch(`/api/vendor/documents/${docId}`, { method: 'DELETE' });
    if (res.ok) fetchDocuments();
    else alert('Delete failed');
  };

  const totalUploaded = documents.length;
  const totalApproved = documents.filter(d => d.status === 'APPROVED').length;
  const totalPending  = documents.filter(d => d.status === 'PENDING').length;
  const totalRejected = documents.filter(d => d.status === 'REJECTED').length;
  const requiredDone  = DOC_TYPES.filter(dt => dt.required).every(dt => getDoc(dt.type));
  const selectedDocInfo = DOC_TYPES.find(d => d.type === uploadModal.docType);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page Header ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 60%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)' }} />
        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase">Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">Business Documents</h1>
            <p className="text-slate-400 text-sm">Upload and manage your documents for account verification</p>
          </div>

          {/* Stats pills */}
          <div className="flex gap-3 shrink-0 flex-wrap">
            {[
              { label: 'Uploaded',  value: totalUploaded, color: 'bg-blue-500/20 border-blue-400/30 text-blue-300' },
              { label: 'Approved',  value: totalApproved, color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' },
              { label: 'Pending',   value: totalPending,  color: 'bg-amber-500/20 border-amber-400/30 text-amber-300' },
              { label: 'Rejected',  value: totalRejected, color: 'bg-red-500/20 border-red-400/30 text-red-300' },
            ].map(s => (
              <div key={s.label} className={`flex flex-col items-center px-5 py-3 rounded-xl border ${s.color}`}>
                <span className="text-2xl font-black">{s.value}</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Required docs progress bar */}
        <div className="relative px-6 sm:px-8 pb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">
              Required documents — {DOC_TYPES.filter(dt => dt.required && getDoc(dt.type)).length} of {DOC_TYPES.filter(dt => dt.required).length} uploaded
            </span>
            {requiredDone
              ? <span className="text-[10px] font-black text-emerald-400 tracking-wide">ALL REQUIRED DONE</span>
              : <span className="text-[10px] font-black text-amber-400 tracking-wide">INCOMPLETE</span>
            }
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${(DOC_TYPES.filter(dt => dt.required && getDoc(dt.type)).length / DOC_TYPES.filter(dt => dt.required).length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Document Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {DOC_TYPES.map(docType => {
          const doc = getDoc(docType.type);
          const cfg = doc ? STATUS_CONFIG[doc.status] : null;
          const StatusIcon = cfg?.icon;

          return (
            <div
              key={docType.type}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col transition-all ${
                !doc
                  ? 'border-gray-200 hover:border-blue-200 hover:shadow-md'
                  : doc.status === 'APPROVED'  ? 'border-emerald-200'
                  : doc.status === 'REJECTED'  ? 'border-red-200'
                  :                              'border-amber-200'
              }`}
            >
              {/* Card top accent */}
              <div className={`h-1 w-full ${
                !doc ? 'bg-gray-200' :
                doc.status === 'APPROVED' ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                doc.status === 'REJECTED' ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                'bg-gradient-to-r from-amber-400 to-orange-400'
              }`} />

              <div className="p-5 flex-1 flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      !doc ? 'bg-gray-100' :
                      doc.status === 'APPROVED' ? 'bg-emerald-50' :
                      doc.status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'
                    }`}>
                      {docType.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-gray-900">{docType.name}</h3>
                        {docType.required && (
                          <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full tracking-wide">REQ</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{docType.description}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  {doc && cfg && StatusIcon && (
                    <div className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>
                  )}
                </div>

                {/* Uploaded info */}
                {doc && (
                  <div className={`mb-3 px-3 py-2.5 rounded-xl ${cfg?.bg ?? 'bg-gray-50'} border ${cfg?.border ?? 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 shrink-0 ${cfg?.iconColor ?? 'text-gray-400'}`} />
                      <span className="text-xs font-semibold text-gray-700 truncate">{doc.documentName}</span>
                    </div>
                    {doc.documentNumber && (
                      <p className="text-[10px] text-gray-400 mt-1 ml-6">No. {doc.documentNumber}</p>
                    )}
                    {doc.uploadedBy && (
                      <span className="mt-1 ml-6 inline-block text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">
                        Uploaded by Manager
                      </span>
                    )}
                  </div>
                )}

                {/* Rejection reason */}
                {doc?.status === 'REJECTED' && doc.rejectionReason && (
                  <div className="mb-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-700 leading-relaxed">
                      <strong>Reason: </strong>{doc.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Not uploaded hint */}
                {!doc && (
                  <div className="mb-3 flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-600 leading-relaxed">{docType.hint}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  {!doc ? (
                    <button
                      onClick={() => openUpload(docType.type)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Document
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                      {doc.status !== 'APPROVED' && (
                        <>
                          <button
                            onClick={() => openUpload(docType.type)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {doc.status === 'REJECTED' ? 'Re-upload' : 'Replace'}
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="w-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-xl transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Info strip ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Accepted formats:</strong> JPG, PNG, WebP, PDF · <strong>Max size:</strong> 5 MB per file ·
          Documents marked <span className="text-red-500 font-bold">REQ</span> are mandatory for account approval.
          After uploading, our team reviews documents within 1–2 business days.
        </p>
      </div>

      {/* ══════════════════════════════════════
          UPLOAD MODAL
      ══════════════════════════════════════ */}
      {uploadModal.open && selectedDocInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeUpload}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-xl">
                    {selectedDocInfo.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Upload {selectedDocInfo.name}</h3>
                    <p className="text-blue-200 text-xs mt-0.5">{selectedDocInfo.description}</p>
                  </div>
                </div>
                <button onClick={closeUpload} className="text-white/70 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Document number */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                  Document Number <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Dropzone */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                  File <span className="text-red-500">*</span>
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    dragOver
                      ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                      : selectedFile
                      ? 'border-emerald-300 bg-emerald-50 cursor-default'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 px-4 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                        <CloudUpload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Drop file here or <span className="text-blue-600">browse</span></p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP or PDF · Max 5 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hint */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">{selectedDocInfo.hint}</p>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeUpload}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                >
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : <><Upload className="w-4 h-4" /> Upload</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PREVIEW MODAL
      ══════════════════════════════════════ */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${STATUS_CONFIG[previewDoc.status].bg}`}>
                  {React.createElement(STATUS_CONFIG[previewDoc.status].icon, {
                    className: `w-4 h-4 ${STATUS_CONFIG[previewDoc.status].iconColor}`
                  })}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{previewDoc.documentName}</h3>
                  <p className="text-xs text-gray-400">
                    {DOC_TYPES.find(d => d.type === previewDoc.documentType)?.name}
                  </p>
                </div>
                <span className={`ml-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[previewDoc.status].badge}`}>
                  {STATUS_CONFIG[previewDoc.status].label}
                </span>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Preview body */}
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              {previewDoc.documentUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.documentUrl} className="w-full h-full min-h-[500px] rounded-xl border border-gray-200" title="Document Preview" />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <img
                    src={previewDoc.documentUrl}
                    alt={previewDoc.documentName}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-white">
              <a
                href={previewDoc.documentUrl}
                download
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </a>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
