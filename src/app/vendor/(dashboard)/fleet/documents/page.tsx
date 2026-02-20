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
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" /> Valid
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" /> Missing
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Documents</h1>
          <p className="text-gray-600">Vehicle documents: Insurance, Fitness, Permit & RC</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Document
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1"><FileText className="w-4 h-4" /><span className="text-sm">Total Documents</span></div>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1"><CheckCircle className="w-4 h-4" /><span className="text-sm">Valid</span></div>
          <p className="text-2xl font-bold text-green-600">{summary.valid}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1"><XCircle className="w-4 h-4" /><span className="text-sm">Expired</span></div>
          <p className="text-2xl font-bold text-red-600">{summary.expired}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Clock className="w-4 h-4" /><span className="text-sm">Missing</span></div>
          <p className="text-2xl font-bold text-gray-500">{summary.missing}</p>
        </div>
      </div>

      {/* Expired Alert */}
      {summary.expired > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Expired Documents!</h3>
            <p className="text-red-600 text-sm">{summary.expired} document(s) have expired. Renew them to avoid penalties.</p>
          </div>
        </div>
      )}

      {/* Vehicles List */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles</h3>
          <p className="text-gray-500">Add vehicles to your fleet to manage their documents.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.vehicleName}</h3>
                    <p className="text-sm text-gray-500">{vehicle.registrationNumber || 'No Reg.'} &bull; {vehicle.service}</p>
                  </div>
                </div>
                {vehicle.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x">
                {vehicle.documents.map((doc) => (
                  <div key={doc.type} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{docIcons[doc.type]}</span>
                        <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                      </div>
                      {doc.image && (
                        <button
                          onClick={() => setViewImage({ url: doc.image!, title: `${vehicle.vehicleName} - ${doc.name}` })}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {getStatusBadge(doc.status)}
                      {doc.validity && (
                        <p className="text-xs text-gray-500 mt-1">
                          Valid till: {new Date(doc.validity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {doc.provider && (
                        <p className="text-xs text-gray-400">{doc.provider}</p>
                      )}
                      {doc.image && (
                        <p className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                          <ImageIcon className="w-3 h-3" /> Photo attached
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add / Update Document</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select value={form.vendorFleetId} onChange={(e) => setForm({ ...form, vendorFleetId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.vehicleName} ({v.registrationNumber || 'No Reg.'})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value, validity: '', provider: '' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select document type</option>
                  {documentTypes.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                </select>
              </div>
              {selectedDocType?.needsValidity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Till *</label>
                  <input type="date" value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              {selectedDocType && selectedDocType.providerLabel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{selectedDocType.providerLabel}</label>
                  <input type="text" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    placeholder={selectedDocType.providerPlaceholder}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              {/* Photo Upload (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Photo <span className="text-gray-400">(Optional)</span></label>
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload photo</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP or PDF (max 5MB)</p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <button onClick={clearFile} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
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
            <div className="p-6 border-t flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !isFormValid()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? 'Saving...' : 'Save Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Image Modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewImage(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{viewImage.title}</h3>
              <button onClick={() => setViewImage(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
              {viewImage.url.endsWith('.pdf') ? (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">PDF Document</p>
                  <a href={viewImage.url} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2">
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
  );
}
