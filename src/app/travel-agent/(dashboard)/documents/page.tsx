'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Upload, CheckCircle2, Clock, AlertCircle,
  X, Loader2, Eye, Trash2, ShieldCheck, AlertTriangle, CloudUpload,
  FileCheck, Download, Info, IdCard, Home, Landmark, Receipt,
  ArrowLeft, Plane, Building2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Document {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentNumber: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
}

interface DocTypeMeta {
  type: string;
  name: string;
  required: boolean;
  description: string;
  icon: string;
  hint: string;
}

const DOC_TYPES: DocTypeMeta[] = [
  {
    type: 'ADDRESS_PROOF',
    name: 'Address Proof',
    required: true,
    description: 'Utility bill, rent agreement, or any government address proof',
    icon: '🏠',
    hint: 'Must be less than 3 months old for utility bills',
  },
  {
    type: 'PAN_CARD',
    name: 'PAN Card',
    required: false,
    description: 'Agency PAN or proprietor PAN card',
    icon: '🪪',
    hint: 'Both sides of the PAN card in one image',
  },
  {
    type: 'GST_CERTIFICATE',
    name: 'GST Certificate',
    required: false,
    description: 'GST registration certificate from the government portal',
    icon: '🏛️',
    hint: 'Download from GST portal — gstin.gov.in',
  },
  {
    type: 'AGENCY_REGISTRATION',
    name: 'Agency Registration',
    required: false,
    description: 'Travel agency registration / trade license / partnership deed',
    icon: '📋',
    hint: 'Any of: Pvt Ltd cert, partnership deed, trade license',
  },
  {
    type: 'IATA_CERTIFICATE',
    name: 'IATA Certificate',
    required: false,
    description: 'IATA accreditation certificate (for ticketing agencies)',
    icon: '✈️',
    hint: 'Optional — only if you are IATA accredited',
  },
  {
    type: 'TRAVEL_AGENT_LICENSE',
    name: 'Travel Agent License',
    required: false,
    description: 'State / municipal travel agent licence, if applicable',
    icon: '🛂',
    hint: 'State tourism dept-issued licence',
  },
  {
    type: 'CANCELLED_CHEQUE',
    name: 'Cancelled Cheque',
    required: false,
    description: 'Cancelled cheque from your agency bank account',
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
  {
    type: 'OWNER_PAN',
    name: "Owner's PAN",
    required: false,
    description: "Proprietor or director's personal PAN card",
    icon: '🪪',
    hint: 'For proprietorship / individual agents',
  },
  {
    type: 'BANK_DETAILS',
    name: 'Bank Details',
    required: false,
    description: 'Bank statement or account verification document',
    icon: '🏦',
    hint: 'Recent bank statement showing your business name',
  },
];

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Outline icon per document type for the row list (purely presentational).
const ROW_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GST_CERTIFICATE: FileText,
  PAN_CARD: IdCard,
  ADDRESS_PROOF: Home,
  AGENCY_REGISTRATION: Landmark,
  IATA_CERTIFICATE: Plane,
  TRAVEL_AGENT_LICENSE: IdCard,
  CANCELLED_CHEQUE: Receipt,
  OWNER_AADHAAR: IdCard,
  OWNER_PAN: IdCard,
  BANK_DETAILS: Building2,
};

const STATUS_CONFIG = {
  VERIFIED: {
    label: 'Verified',
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

export default function TravelAgentDocumentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; docType: string | null }>({ open: false, docType: null });
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/travel-agent/documents');
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.documents || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, []);

  // Reset the preview load-error whenever a different document is opened
  useEffect(() => { setPreviewError(false); }, [previewDoc?.id]);

  // Latest non-rejected document for a given type (or rejected if that's the only state)
  const getDoc = (type: string): Document | undefined => {
    const candidates = documents.filter((d) => d.documentType === type);
    return (
      candidates.find((d) => d.status === 'VERIFIED') ||
      candidates.find((d) => d.status === 'PENDING') ||
      candidates[0]
    );
  };

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
    if (!ALLOWED_MIME.includes(file.type)) { showToast({ type: 'error', title: 'Only JPG, PNG, WebP or PDF allowed' }); return; }
    if (file.size > MAX_FILE_BYTES) { showToast({ type: 'error', title: 'File must be under 10 MB' }); return; }
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

    // If a previous (non-rejected) record exists, delete it first to allow replacement
    const existing = getDoc(uploadModal.docType);
    if (existing && existing.status !== 'REJECTED') {
      if (existing.status === 'VERIFIED') {
        showToast({ type: 'error', title: 'Cannot replace a verified document. Contact support.' });
        return;
      }
      const confirmReplace = confirm('A pending document already exists for this type. Replace it?');
      if (!confirmReplace) return;
      const delRes = await fetch(`/api/travel-agent/documents?id=${existing.id}`, { method: 'DELETE' });
      if (!delRes.ok) {
        showToast({ type: 'error', title: 'Could not replace existing document' });
        return;
      }
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('documentType', uploadModal.docType);
      if (documentNumber) form.append('documentNumber', documentNumber);
      const res = await fetch('/api/travel-agent/documents', { method: 'POST', body: form });
      if (res.ok) {
        showToast({ type: 'success', title: 'Document uploaded successfully' });
        closeUpload();
        fetchDocuments();
      } else {
        const e = await res.json();
        showToast({ type: 'error', title: e.error || 'Upload failed' });
      }
    } catch {
      showToast({ type: 'error', title: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    const res = await fetch(`/api/travel-agent/documents?id=${docId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Document deleted' });
      fetchDocuments();
    } else {
      const j = await res.json();
      showToast({ type: 'error', title: j.error || 'Delete failed' });
    }
  };

  const totalUploaded = documents.length;
  const totalVerified = documents.filter((d) => d.status === 'VERIFIED').length;
  const totalPending  = documents.filter((d) => d.status === 'PENDING').length;
  const totalRejected = documents.filter((d) => d.status === 'REJECTED').length;
  const requiredDone  = DOC_TYPES.filter((dt) => dt.required).every((dt) => getDoc(dt.type)?.status !== undefined && getDoc(dt.type)?.status !== 'REJECTED');
  const selectedDocInfo = DOC_TYPES.find((d) => d.type === uploadModal.docType);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page Header ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 60%), radial-gradient(circle at 80% 20%, #14b8a6 0%, transparent 50%)' }} />
        <div className="relative px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-1.5 mb-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-[11px] font-semibold tracking-widest uppercase">Verification</span>
            </div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold">Agency Documents</h1>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-white/10 border border-white/15 text-slate-300 px-2 py-1 rounded-md">Travel Agent</span>
            </div>
            <p className="text-slate-400 text-sm mb-3">Upload and manage your documents for account verification</p>
            <p className="text-slate-500 text-xs">
              Required documents — {DOC_TYPES.filter((dt) => dt.required && getDoc(dt.type)).length} of {DOC_TYPES.filter((dt) => dt.required).length} uploaded
            </p>
          </div>

          {/* Stats blocks */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex gap-2.5 flex-wrap justify-end">
              {[
                { label: 'Uploaded', value: totalUploaded, color: 'bg-teal-900/60 border-teal-400/20 text-teal-300' },
                { label: 'Verified', value: totalVerified, color: 'bg-emerald-900/50 border-emerald-400/20 text-emerald-300' },
                { label: 'Pending',  value: totalPending,  color: 'bg-amber-900/40 border-amber-400/20 text-amber-300' },
                { label: 'Rejected', value: totalRejected, color: 'bg-rose-900/40 border-rose-400/20 text-rose-300' },
              ].map((s) => (
                <div key={s.label} className={`flex flex-col items-center min-w-[68px] px-4 py-2.5 rounded-xl border ${s.color}`}>
                  <span className="text-xl font-black">{s.value}</span>
                  <span className="text-[9px] font-semibold tracking-wide uppercase mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
            {requiredDone
              ? <span className="text-[10px] font-black text-emerald-400 tracking-wide">ALL REQUIRED DONE</span>
              : <span className="text-[10px] font-black text-amber-400 tracking-wide">INCOMPLETE</span>
            }
          </div>
        </div>
      </div>

      {/* ── Document List ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {DOC_TYPES.map((docType, idx) => {
          const doc = getDoc(docType.type);
          const cfg = doc ? STATUS_CONFIG[doc.status] : null;
          const StatusIcon = cfg?.icon;
          const RowIcon = ROW_ICONS[docType.type] || FileText;

          return (
            <div key={docType.type} className="flex flex-col lg:grid lg:grid-cols-[1.25fr_0.75fr_1.15fr] lg:items-center gap-4 px-5 sm:px-6 py-5">
              {/* Number + icon + title */}
              <div className="flex items-start gap-3 min-w-0">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                  !doc ? 'bg-gray-100' :
                  doc.status === 'VERIFIED' ? 'bg-emerald-50' :
                  doc.status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'
                }`}>
                  <RowIcon className={`w-5 h-5 ${
                    !doc ? 'text-gray-500' :
                    doc.status === 'VERIFIED' ? 'text-emerald-600' :
                    doc.status === 'REJECTED' ? 'text-red-500' : 'text-amber-600'
                  }`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900">{docType.name}</h3>
                    {docType.required ? (
                      <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full tracking-wide">REQ</span>
                    ) : (
                      <span className="text-[9px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full tracking-wide">OPT</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{docType.description}</p>
                </div>
              </div>

              {/* Info box: hint, or uploaded file info, or rejection reason */}
              <div className="min-w-0">
                {doc ? (
                  <div className={`px-3 py-2 rounded-xl ${cfg?.bg ?? 'bg-gray-50'} border ${cfg?.border ?? 'border-gray-200'}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {StatusIcon && <StatusIcon className={`w-3 h-3 shrink-0 ${cfg?.iconColor ?? 'text-gray-400'}`} />}
                      <span className="text-[11px] font-semibold text-gray-700 truncate">{doc.documentName}</span>
                      {cfg && (
                        <span className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    {doc.documentNumber && (
                      <p className="text-[9px] text-gray-400 mt-1">No. {doc.documentNumber}</p>
                    )}
                    {doc.status === 'REJECTED' && doc.rejectionReason && (
                      <p className="text-[9px] text-red-700 mt-1 leading-relaxed">
                        <strong>Reason: </strong>{doc.rejectionReason}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <Info className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-emerald-700 leading-snug">{docType.hint}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-col items-stretch gap-2">
                {!doc || doc.status === 'REJECTED' ? (
                  <>
                    <button
                      onClick={() => openUpload(docType.type)}
                      className={`w-full flex items-center justify-center gap-2.5 text-sm font-bold py-4 px-6 rounded-xl transition-colors ${
                        docType.required
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'border-2 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Upload className="w-4 h-4" /> {doc?.status === 'REJECTED' ? 'Re-upload Document' : `Upload Document${!docType.required ? ' (Optional)' : ''}`}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center">Accepted: JPG, PNG, WebP, PDF · Max size: 10 MB</p>
                  </>
                ) : (
                  <>
                    <div className="w-full flex gap-2">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      {doc.status !== 'VERIFIED' && (
                        <>
                          <button
                            onClick={() => openUpload(docType.type)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-semibold py-3 rounded-xl transition-colors"
                          >
                            <Upload className="w-4 h-4" /> Replace
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="w-11 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-xl transition-colors shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">Accepted: JPG, PNG, WebP, PDF · Max size: 10 MB</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Info strip ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
        <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-700 leading-relaxed">
          Documents marked <span className="text-red-500 font-bold">REQ</span> are mandatory for account approval.
          <span className="text-gray-500 font-bold"> OPT</span> documents are optional but recommended. ·
          <strong> Accepted formats:</strong> JPG, PNG, WebP, PDF · <strong>Max size:</strong> 10 MB per file ·
          After uploading, our team reviews documents within 1–2 business days.
        </p>
      </div>

      {/* ══════════════════════════════════════
          UPLOAD MODAL
      ══════════════════════════════════════ */}
      {uploadModal.open && selectedDocInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeUpload}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-xl">
                    {selectedDocInfo.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Upload {selectedDocInfo.name}</h3>
                    <p className="text-emerald-100 text-xs mt-0.5">{selectedDocInfo.description}</p>
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
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Dropzone */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 block">
                  File <span className="text-red-500">*</span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    dragOver
                      ? 'border-emerald-400 bg-emerald-50 scale-[1.01]'
                      : selectedFile
                      ? 'border-emerald-300 bg-emerald-50 cursor-default'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
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
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 px-4 text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-3">
                        <CloudUpload className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Drop file here or <span className="text-emerald-600">browse</span></p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP or PDF · Max 10 MB</p>
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
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${STATUS_CONFIG[previewDoc.status].bg}`}>
                  {React.createElement(STATUS_CONFIG[previewDoc.status].icon, {
                    className: `w-4 h-4 ${STATUS_CONFIG[previewDoc.status].iconColor}`,
                  })}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{previewDoc.documentName}</h3>
                  <p className="text-xs text-gray-400">
                    {DOC_TYPES.find((d) => d.type === previewDoc.documentType)?.name}
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
              {previewError ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-7 h-7 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Preview not available</h4>
                  <p className="text-xs text-gray-500 max-w-sm">
                    This file could not be loaded. It may have been moved or is temporarily unavailable.
                    Try opening it in a new tab or downloading it below.
                  </p>
                  <a
                    href={previewDoc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <Eye className="w-4 h-4" /> Open in new tab
                  </a>
                </div>
              ) : previewDoc.documentUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.documentUrl}
                  className="w-full h-full min-h-[500px] rounded-xl border border-gray-200"
                  title="Document Preview"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <img
                    src={previewDoc.documentUrl}
                    alt={previewDoc.documentName}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                    onError={() => setPreviewError(true)}
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
                className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-colors"
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
