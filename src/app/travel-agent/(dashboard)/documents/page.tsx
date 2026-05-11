'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  X,
  UploadCloud,
  Image as ImageIcon,
  FileType2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
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

// Mirrors vendor's 3-required-docs pattern. Required count must match
// /api/travel-agent/documents auto-promote logic and the admin verify API.
const DOC_TYPES: DocTypeMeta[] = [
  {
    type: 'GST_CERTIFICATE',
    name: 'GST Certificate',
    required: true,
    description: 'GST registration certificate from the government portal',
    icon: '🏛️',
    hint: 'Download from GST portal — gstin.gov.in',
  },
  {
    type: 'PAN_CARD',
    name: 'PAN Card',
    required: true,
    description: 'Agency PAN or proprietor PAN card',
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

const REQUIRED_TYPES = DOC_TYPES.filter((t) => t.required).map((t) => t.type);
const REQUIRED_COUNT = REQUIRED_TYPES.length;

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function TravelAgentDocumentsPage() {
  const { showToast } = useToast();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; docType: string | null }>({
    open: false,
    docType: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const [docNumber, setDocNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/travel-agent/documents');
      if (res.ok) {
        const json = await res.json();
        setDocs(json.documents || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Latest non-rejected document for a given type (or rejected if that's the only state)
  const getDoc = (type: string): Document | undefined => {
    const candidates = docs.filter((d) => d.documentType === type);
    return (
      candidates.find((d) => d.status === 'VERIFIED') ||
      candidates.find((d) => d.status === 'PENDING') ||
      candidates[0]
    );
  };

  const requiredVerified = REQUIRED_TYPES.filter((t) => getDoc(t)?.status === 'VERIFIED').length;
  const requiredUploaded = REQUIRED_TYPES.filter((t) => {
    const d = getDoc(t);
    return d && d.status !== 'REJECTED';
  }).length;
  const allRequiredVerified = requiredVerified === REQUIRED_COUNT;

  const openUpload = (docType: string) => {
    setUploadModal({ open: true, docType });
    setFile(null);
    setDocNumber('');
  };

  const closeUpload = () => {
    setUploadModal({ open: false, docType: null });
    setFile(null);
    setDocNumber('');
  };

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_MIME.includes(f.type)) return 'Only JPG, PNG, WebP or PDF allowed';
    if (f.size > MAX_FILE_BYTES) return 'File must be under 10 MB';
    return null;
  };

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      showToast({ type: 'error', title: err });
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadModal.docType) return;

    // If a previous (non-rejected) record exists, delete it first to allow replacement
    const existing = getDoc(uploadModal.docType);
    if (existing && existing.status !== 'REJECTED') {
      const confirmReplace = confirm(
        `A ${existing.status === 'VERIFIED' ? 'verified' : 'pending'} document already exists for this type. Replace it?`,
      );
      if (!confirmReplace) return;
      if (existing.status === 'VERIFIED') {
        showToast({
          type: 'error',
          title: 'Cannot replace a verified document. Contact support.',
        });
        return;
      }
      const delRes = await fetch(`/api/travel-agent/documents?id=${existing.id}`, {
        method: 'DELETE',
      });
      if (!delRes.ok) {
        showToast({ type: 'error', title: 'Could not replace existing document' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('documentType', uploadModal.docType);
      if (docNumber) form.append('documentNumber', docNumber);

      const res = await fetch('/api/travel-agent/documents', { method: 'POST', body: form });
      if (res.ok) {
        showToast({ type: 'success', title: 'Document uploaded successfully' });
        closeUpload();
        await load();
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to upload document' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    const res = await fetch(`/api/travel-agent/documents?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Document deleted' });
      await load();
    } else {
      const j = await res.json();
      showToast({ type: 'error', title: j.error || 'Failed to delete' });
    }
  };

  const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const FileIcon = file?.type === 'application/pdf' ? FileType2 : ImageIcon;
  const selectedDocMeta = DOC_TYPES.find((d) => d.type === uploadModal.docType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* ── Page Header / KYC Progress ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-700 to-teal-900 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 60%), radial-gradient(circle at 80% 20%, #14b8a6 0%, transparent 50%)',
          }}
        />
        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              <span className="text-emerald-200 text-xs font-semibold tracking-widest uppercase">
                KYC Verification
              </span>
            </div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-emerald-100 text-sm mt-1.5 max-w-md">
              {allRequiredVerified
                ? 'All required documents are verified — you can proceed with the next step.'
                : `${requiredVerified} of ${REQUIRED_COUNT} required documents verified. Upload the rest to get fully approved.`}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 border border-white/20 shrink-0">
            <p className="text-xs uppercase tracking-wide text-emerald-200 mb-1 font-bold">
              Progress
            </p>
            <p className="text-3xl font-extrabold">
              {requiredVerified}
              <span className="text-emerald-300 text-base font-bold">/{REQUIRED_COUNT}</span>
            </p>
            <p className="text-[10px] text-emerald-200 mt-0.5">required verified</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 bg-white/10">
          <div
            className="absolute left-0 top-0 h-1 bg-emerald-400 transition-all duration-500"
            style={{ width: `${(requiredVerified / REQUIRED_COUNT) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Success banner when all required verified ── */}
      {allRequiredVerified && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-emerald-900">You&apos;re all set! 🎉</p>
            <p className="text-sm text-emerald-800 mt-1">
              All {REQUIRED_COUNT} required KYC documents have been verified by our team. You can
              now proceed to the next step.
            </p>
          </div>
          <Link
            href="/travel-agent/dashboard"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl shrink-0"
          >
            Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Required Documents Section ── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Required Documents</h2>
            <p className="text-xs text-gray-500">
              Mandatory for verification — {requiredUploaded} of {REQUIRED_COUNT} uploaded
            </p>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            REQUIRED
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DOC_TYPES.filter((t) => t.required).map((type) => (
            <DocCard
              key={type.type}
              meta={type}
              doc={getDoc(type.type)}
              onUpload={() => openUpload(type.type)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>

      {/* ── Optional Documents Section ── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Optional Documents</h2>
            <p className="text-xs text-gray-500">
              Add to strengthen your profile and unlock more features
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOC_TYPES.filter((t) => !t.required).map((type) => (
            <DocCard
              key={type.type}
              meta={type}
              doc={getDoc(type.type)}
              onUpload={() => openUpload(type.type)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>

      {/* ── Upload Modal ── */}
      {uploadModal.open && selectedDocMeta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeUpload}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-start justify-between">
              <div>
                <p className="text-xs text-emerald-100 font-semibold uppercase tracking-wide">
                  Upload Document
                </p>
                <h2 className="text-lg font-bold mt-0.5 flex items-center gap-2">
                  <span className="text-2xl">{selectedDocMeta.icon}</span>
                  {selectedDocMeta.name}
                  {selectedDocMeta.required && (
                    <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      REQUIRED
                    </span>
                  )}
                </h2>
                <p className="text-xs text-emerald-100 mt-1">{selectedDocMeta.description}</p>
              </div>
              <button
                type="button"
                onClick={closeUpload}
                className="text-white/70 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                💡 <strong>Tip:</strong> {selectedDocMeta.hint}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Document Number
                  <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. GSTIN or PAN number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl px-6 py-8 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/40'
                  }`}
                >
                  <UploadCloud
                    className={`w-9 h-9 mx-auto mb-2 ${
                      dragOver ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  />
                  <p className="text-sm font-semibold text-gray-700">
                    Drop your file here or{' '}
                    <span className="text-emerald-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WebP or PDF — up to 10 MB
                  </p>
                </div>
              ) : (
                <div className="border-2 border-emerald-200 bg-emerald-50/40 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0">
                    <FileIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-red-600 p-1 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={closeUpload}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !file}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2 rounded-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Document card (used for both required and optional sections) ──
function DocCard({
  meta,
  doc,
  onUpload,
  onDelete,
}: {
  meta: DocTypeMeta;
  doc: Document | undefined;
  onUpload: () => void;
  onDelete: (id: string) => void;
}) {
  const status = doc?.status;
  const baseCls =
    'bg-white rounded-2xl border p-5 transition-colors flex flex-col gap-3 h-full';
  const stateCls =
    status === 'VERIFIED'
      ? 'border-emerald-300 bg-emerald-50/50'
      : status === 'PENDING'
        ? 'border-amber-200 bg-amber-50/30'
        : status === 'REJECTED'
          ? 'border-red-300 bg-red-50/40'
          : 'border-gray-200 hover:border-emerald-300';

  return (
    <div className={`${baseCls} ${stateCls}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-xl shrink-0">
            {meta.icon}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{meta.name}</p>
            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{meta.description}</p>
          </div>
        </div>
        {meta.required && (
          <span className="text-[9px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded shrink-0">
            REQ
          </span>
        )}
      </div>

      {/* Status display */}
      {!doc ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          Not uploaded yet
        </div>
      ) : status === 'VERIFIED' ? (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
        </div>
      ) : status === 'PENDING' ? (
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
          <Clock className="w-3.5 h-3.5" /> Under review
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </div>
      )}

      {/* Rejection reason */}
      {doc?.status === 'REJECTED' && doc.rejectionReason && (
        <p className="text-xs text-red-700 bg-red-100/60 border border-red-200 rounded-lg px-2.5 py-1.5">
          <strong>Reason:</strong> {doc.rejectionReason}
        </p>
      )}

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2 pt-1">
        {!doc || status === 'REJECTED' ? (
          <button
            onClick={onUpload}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-lg"
          >
            <Upload className="w-3.5 h-3.5" />
            {status === 'REJECTED' ? 'Re-upload' : 'Upload'}
          </button>
        ) : (
          <>
            <a
              href={doc.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-emerald-300 font-semibold text-xs py-2 rounded-lg"
            >
              View
            </a>
            {status === 'PENDING' && (
              <>
                <button
                  onClick={onUpload}
                  className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs py-2 px-3 rounded-lg"
                  title="Replace"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold text-xs py-2 px-3 rounded-lg"
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
  );
}
