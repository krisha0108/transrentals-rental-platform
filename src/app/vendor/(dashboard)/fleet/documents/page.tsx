'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Car,
  Shield,
  ScrollText,
  CreditCard,
  Plus,
  X,
  Eye,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

interface VehicleDocument {
  type: string;
  name: string;
  provider: string | null;
  validity: string | null;
  image: string | null;
  status: 'VALID' | 'EXPIRED' | 'NOT_UPLOADED';
}

interface Vehicle {
  id: string;
  vehicleName: string;
  registrationNumber: string | null;
  service: string;
  isVerified: boolean;
  documents: VehicleDocument[];
}

interface Summary {
  total: number;
  valid: number;
  expired: number;
  missing: number;
}

const docIcons: Record<string, React.ReactNode> = {
  INSURANCE: <Shield className="w-5 h-5" />,
  FITNESS: <CheckCircle className="w-5 h-5" />,
  PERMIT: <ScrollText className="w-5 h-5" />,
  RC: <CreditCard className="w-5 h-5" />,
};

const documentTypes = [
  { value: 'INSURANCE', label: 'Vehicle Insurance', needsValidity: true, providerLabel: 'Insurance Provider', providerPlaceholder: 'e.g. ICICI Lombard, New India Assurance' },
  { value: 'FITNESS', label: 'Fitness Certificate', needsValidity: true, providerLabel: '', providerPlaceholder: '' },
  { value: 'PERMIT', label: 'Vehicle Permit', needsValidity: false, providerLabel: 'Permit Type *', providerPlaceholder: 'e.g. National, State, Tourist' },
  { value: 'RC', label: 'Registration Certificate', needsValidity: false, providerLabel: 'Registration Number *', providerPlaceholder: 'e.g. MH01AB1234' },
];

export default function FleetDocumentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, valid: 0, expired: 0, missing: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewImage, setViewImage] = useState<{ url: string; title: string } | null>(null);
  const [form, setForm] = useState({
    vendorFleetId: '', documentType: '', validity: '', provider: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/vendor/fleet/documents');
      const data = await res.json();
      if (res.ok && data.success) {
        setVehicles(data.vehicles || []);
        setSummary(data.summary || { total: 0, valid: 0, expired: 0, missing: 0 });
      } else {
        setError(data.error || 'Failed to fetch documents');
      }
    } catch {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedDocType = documentTypes.find((d) => d.value === form.documentType);

  const isFormValid = () => {
    if (!form.vendorFleetId || !form.documentType) return false;
    if (selectedDocType?.needsValidity && !form.validity) return false;
    if ((form.documentType === 'PERMIT' || form.documentType === 'RC') && !form.provider) return false;
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, WebP and PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendorFleetId', form.vendorFleetId);
      formData.append('documentType', form.documentType);
      if (form.validity) formData.append('validity', form.validity);
      if (form.provider) formData.append('provider', form.provider);
      if (selectedFile) formData.append('photo', selectedFile);

      const res = await fetch('/api/vendor/fleet/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        setForm({ vendorFleetId: '', documentType: '', validity: '', provider: '' });
        clearFile();
        setLoading(true);
        fetchData();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ vendorFleetId: '', documentType: '', validity: '', provider: '' });
    clearFile();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-[11px] font-semibold border border-green-200/60 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            Valid
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-full text-[11px] font-semibold border border-red-200/60 shadow-sm">
            <XCircle className="w-3 h-3 animate-pulse" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[11px] font-semibold border border-gray-200">
            <Clock className="w-3 h-3" /> Missing
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-100"></div>
          <Loader2 className="w-14 h-14 animate-spin text-emerald-600 absolute inset-0" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Documents', value: summary.total, icon: FileText, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Valid', value: summary.valid, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Expired', value: summary.expired, icon: XCircle, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-600' },
    { label: 'Missing', value: summary.missing, icon: Clock, gradient: 'from-gray-400 to-slate-500', bg: 'bg-gray-100', text: 'text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(10px) translateX(-6px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes wiggle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 7s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 1.2s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .shimmer-bg { background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
      `}</style>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-float-rev"></div>
          <div className="absolute right-1/3 top-1/2 w-24 h-24 bg-emerald-300/10 rounded-full blur-2xl animate-float-slow"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Fleet Documents</h1>
                <p className="text-emerald-100 mt-1 text-sm sm:text-base">Vehicle documents: Insurance, Fitness, Permit & RC</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl font-semibold shadow-md hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> Add Document
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {summaryCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up"
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${stat.gradient} group-hover:scale-150 group-hover:opacity-20 transition-all duration-500`}></div>
                <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                    <p className={`text-2xl sm:text-3xl font-bold mt-1 ${stat.text} group-hover:scale-110 origin-left transition-transform`}>{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expired Alert */}
        {summary.expired > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50 via-rose-50 to-red-50 animate-gradient-x border border-red-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-fade-up">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-200/40 rounded-full blur-2xl animate-float-slow"></div>
            <div className="relative w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <span className="absolute inset-0 rounded-xl bg-red-300/40 animate-ping"></span>
              <AlertTriangle className="relative w-6 h-6 text-red-600 animate-wiggle" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-red-800">Expired Documents!</h3>
              <p className="text-red-600 text-sm">{summary.expired} document(s) have expired. Renew them to avoid penalties.</p>
            </div>
          </div>
        )}

        {/* Vehicles List */}
        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-100 flex items-center justify-center">
              <Car className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles</h3>
            <p className="text-gray-500">Add vehicles to your fleet to manage their documents.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle, vIdx) => (
              <div
                key={vehicle.id}
                style={{ animationDelay: `${vIdx * 100}ms` }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden animate-fade-up group/v"
              >
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-emerald-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover/v:scale-110 group-hover/v:rotate-3 transition-all duration-300">
                      <div className="absolute inset-0 rounded-xl bg-emerald-400/40 blur-md opacity-0 group-hover/v:opacity-100 transition-opacity"></div>
                      <Car className="relative w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{vehicle.vehicleName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{vehicle.registrationNumber || 'No Reg.'} &bull; {vehicle.service}</p>
                    </div>
                  </div>
                  {vehicle.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
                  {vehicle.documents.map((doc, dIdx) => {
                    const themes: Record<string, { grad: string; bg: string; text: string; border: string; ring: string }> = {
                      INSURANCE: { grad: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'hover:ring-emerald-200' },
                      FITNESS: { grad: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'hover:ring-emerald-200' },
                      PERMIT: { grad: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'hover:ring-emerald-200' },
                      RC: { grad: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'hover:ring-emerald-200' },
                    };
                    const theme = themes[doc.type] || themes.INSURANCE;
                    const isMissing = doc.status === 'NOT_UPLOADED';
                    const isExpired = doc.status === 'EXPIRED';
                    return (
                      <div
                        key={doc.type}
                        style={{ animationDelay: `${dIdx * 80}ms` }}
                        className={`relative overflow-hidden rounded-xl border ${theme.border} bg-white p-3 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:ring-2 ${theme.ring} transition-all duration-300 group animate-pop-in`}
                      >
                        <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 bg-gradient-to-br ${theme.grad} group-hover:scale-150 group-hover:opacity-20 transition-all duration-500`}></div>
                        <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${theme.grad} flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300`}>
                              <span className="relative">{docIcons[doc.type]}</span>
                              {isMissing && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                              )}
                              {isExpired && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                              )}
                            </div>
                            {doc.image && (
                              <button
                                onClick={() => setViewImage({ url: doc.image!, title: `${vehicle.vehicleName} - ${doc.name}` })}
                                className={`p-1.5 ${theme.text} ${theme.bg} rounded-lg hover:scale-110 transition-transform`}
                                title="View Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-gray-900 mb-2 truncate">{doc.name}</p>
                          <div className="space-y-1.5">
                            {getStatusBadge(doc.status)}
                            {doc.validity && (
                              <p className="text-[11px] text-gray-500 leading-tight">
                                Valid till<br />
                                <span className="font-semibold text-gray-700">
                                  {new Date(doc.validity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </p>
                            )}
                            {doc.provider && (
                              <p className="text-[11px] text-gray-500 truncate" title={doc.provider}>{doc.provider}</p>
                            )}
                            {doc.image && (
                              <p className={`text-[11px] ${theme.text} flex items-center gap-1 font-semibold`}>
                                <ImageIcon className="w-3 h-3" /> Photo attached
                              </p>
                            )}
                            {isMissing && (
                              <button
                                onClick={() => { setForm({ vendorFleetId: vehicle.id, documentType: doc.type, validity: '', provider: '' }); setShowModal(true); }}
                                className={`mt-1 w-full text-[11px] font-semibold ${theme.text} ${theme.bg} hover:brightness-95 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-all`}
                              >
                                <Plus className="w-3 h-3" /> Upload
                              </button>
                            )}
                            {isExpired && (
                              <button
                                onClick={() => { setForm({ vendorFleetId: vehicle.id, documentType: doc.type, validity: '', provider: '' }); setShowModal(true); }}
                                className="mt-1 w-full text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-all"
                              >
                                <Plus className="w-3 h-3" /> Renew
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Document Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Add / Update Document</h2>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Vehicle *</label>
                    <select value={form.vendorFleetId} onChange={(e) => setForm({ ...form, vendorFleetId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm">
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber || 'No Reg.'})</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Document Type *</label>
                    <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value, validity: '', provider: '' })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm">
                      <option value="">Select document type</option>
                      {documentTypes.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                    </select>
                  </div>
                  {selectedDocType?.needsValidity && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Valid Till *</label>
                      <input type="date" value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm" />
                    </div>
                  )}
                  {selectedDocType && selectedDocType.providerLabel && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">{selectedDocType.providerLabel}</label>
                      <input type="text" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                        placeholder={selectedDocType.providerPlaceholder}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm" />
                    </div>
                  )}
                </div>

                {/* Photo Upload (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Document Photo <span className="text-gray-400 normal-case">(Optional)</span></label>
                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group"
                    >
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Upload className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click to upload photo</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP or PDF (max 5MB)</p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          ) : (
                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                              <FileText className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <button onClick={clearFile} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex gap-3 sticky bottom-0">
                <button onClick={closeModal} className="flex-1 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting || !isFormValid()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {submitting ? 'Saving...' : 'Save Document'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Document Image Modal */}
        {viewImage && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewImage(null)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{viewImage.title}</h3>
                <button onClick={() => setViewImage(null)} className="p-2 hover:bg-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
                {viewImage.url.endsWith('.pdf') ? (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-emerald-600" />
                    </div>
                    <p className="text-gray-600 mb-3 font-medium">PDF Document</p>
                    <a href={viewImage.url} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg inline-flex items-center gap-2 font-semibold transition-all">
                      <Eye className="w-4 h-4" /> Open PDF
                    </a>
                  </div>
                ) : (
                  <img src={viewImage.url} alt={viewImage.title} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
