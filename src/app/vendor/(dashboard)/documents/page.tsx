'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Document {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentNumber: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
}

const documentTypes = [
  { type: 'GST_CERTIFICATE', name: 'GST Certificate', required: true, description: 'GST registration certificate' },
  { type: 'PAN_CARD', name: 'PAN Card', required: true, description: 'Business or proprietor PAN' },
  { type: 'BUSINESS_REGISTRATION', name: 'Business Registration', required: false, description: 'Company registration certificate' },
  { type: 'ADDRESS_PROOF', name: 'Address Proof', required: true, description: 'Utility bill, rent agreement, etc.' },
  { type: 'CANCELLED_CHEQUE', name: 'Cancelled Cheque', required: false, description: 'For bank verification' },
  { type: 'OWNER_AADHAAR', name: 'Owner Aadhaar', required: false, description: 'Owner/proprietor Aadhaar card' },
];

export default function VendorDocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/vendor/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getDocumentByType = (type: string) => {
    return documents.find((doc) => doc.documentType === type);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const openUploadModal = (docType: string) => {
    setSelectedDocType(docType);
    setDocumentNumber('');
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, WebP, and PDF files are allowed');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) return;

    setUploading(selectedDocType);

    try {
      // In production, upload to cloud storage and get URL
      // For now, we'll simulate with a placeholder URL
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', selectedDocType);
      formData.append('documentNumber', documentNumber);

      const res = await fetch('/api/vendor/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowUploadModal(false);
        fetchDocuments();
      } else {
        const error = await res.json();
        alert(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/vendor/documents/${docId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchDocuments();
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const openPreviewModal = (doc: Document) => {
    setPreviewDocument(doc);
    setShowPreviewModal(true);
  };

  const allRequiredUploaded = documentTypes
    .filter((dt) => dt.required)
    .every((dt) => getDocumentByType(dt.type));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Documents</h1>
          <p className="text-gray-600">Upload your business documents for verification</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Document Status</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            allRequiredUploaded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {allRequiredUploaded ? 'All Required Uploaded' : 'Documents Pending'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
            <div className="text-sm text-gray-600">Uploaded</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {documents.filter((d) => d.status === 'APPROVED').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {documents.filter((d) => d.status === 'PENDING').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {documents.filter((d) => d.status === 'REJECTED').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Required Documents</h3>
        </div>
        <div className="divide-y">
          {documentTypes.map((docType) => {
            const uploadedDoc = getDocumentByType(docType.type);
            return (
              <div key={docType.type} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      uploadedDoc ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <FileText className={`w-6 h-6 ${uploadedDoc ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{docType.name}</h4>
                        {docType.required && (
                          <span className="text-xs text-red-500">*Required</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{docType.description}</p>
                      {uploadedDoc?.documentNumber && (
                        <p className="text-xs text-gray-400 mt-1">
                          Number: {uploadedDoc.documentNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {uploadedDoc ? (
                      <>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(uploadedDoc.status)}`}>
                          {uploadedDoc.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPreviewModal(uploadedDoc)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          {uploadedDoc.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleDelete(uploadedDoc.id)}
                              className="p-2 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUploadModal(docType.type)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>

                {uploadedDoc?.status === 'REJECTED' && uploadedDoc.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {uploadedDoc.rejectionReason}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => openUploadModal(docType.type)}
                    >
                      Re-upload Document
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedDocType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                Upload {documentTypes.find((d) => d.type === selectedDocType)?.name}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Number (Optional)
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3 max-w-full">
                      <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]" title={selectedFile.name}>
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP, or PDF (max 5MB)</p>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !!uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showPreviewModal && previewDocument && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{previewDocument.documentName}</h2>
                <p className="text-sm text-gray-500">
                  {documentTypes.find((d) => d.type === previewDocument.documentType)?.name}
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Document Preview */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {previewDocument.documentUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDocument.documentUrl}
                  className="w-full h-full min-h-[600px] rounded-lg border"
                  title="Document Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={previewDocument.documentUrl}
                    alt={previewDocument.documentName}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                {getStatusIcon(previewDocument.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(previewDocument.status)}`}>
                  {previewDocument.status}
                </span>
              </div>
              <div className="flex gap-2">
                <a
                  href={previewDocument.documentUrl}
                  download
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                >
                  Download
                </a>
                <Button onClick={() => setShowPreviewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
