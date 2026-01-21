'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  Search,
  X,
  RefreshCw,
  Grid,
  List,
  Eye,
  Copy,
  Check,
  FileText,
  Video,
  File,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Phone,
  Mail,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
}

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string | null;
  folder: string | null;
  vendorId: string;
  vendor: Vendor;
  createdAt: string;
}

const ITEMS_PER_PAGE = 24;

export default function AdminVendorDocumentsPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [vendors, setVendors] = useState<{ id: string; businessName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/admin/vendor-media?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (vendorFilter) url += `&vendorId=${vendorFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMedia(data.media);
          setTotalItems(data.pagination?.total || data.media.length);
          setVendors(data.vendors || []);
        }
      }
    } catch (error) {
      console.error('Error fetching vendor media:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, typeFilter, vendorFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, vendorFilter]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (mimeType.includes('pdf') || mimeType.includes('word')) return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Documents & Media</h1>
          <p className="text-gray-600">View all files uploaded by vendors</p>
        </div>
        <Button variant="outline" onClick={fetchMedia} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <File className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              <p className="text-sm text-gray-500">Total Files</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
              <p className="text-sm text-gray-500">Vendors with Files</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {media.filter((m) => m.mimeType.startsWith('image/')).length}
              </p>
              <p className="text-sm text-gray-500">Images (this page)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {media.filter((m) => m.mimeType.includes('pdf') || m.mimeType.includes('word')).length}
              </p>
              <p className="text-sm text-gray-500">Documents (this page)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files or vendor names..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Vendor Filter */}
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.businessName}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : media.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendor files found</h3>
          <p className="text-gray-500">
            {search || typeFilter || vendorFilter
              ? 'Try adjusting your filters'
              : 'Vendors have not uploaded any files yet'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedMedia(item)}
            >
              <div className="aspect-square bg-gray-100 relative">
                {isImage(item.mimeType) ? (
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getFileIcon(item.mimeType)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedia(item);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrl(item.url);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                  >
                    {copiedUrl === item.url ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-sm font-medium text-gray-900 truncate">{item.originalName}</p>
                <p className="text-xs text-gray-500 truncate">{item.vendor?.businessName}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">File</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vendor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Uploaded</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {media.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {isImage(item.mimeType) ? (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getFileIcon(item.mimeType)}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-900 truncate max-w-[200px]">
                        {item.originalName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.vendor?.businessName}</p>
                      <p className="text-xs text-gray-500">{item.vendor?.ownerName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.mimeType.split('/')[1]}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(item.size)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedMedia(item)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => copyUrl(item.url)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        {copiedUrl === item.url ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <a
                        href={item.url}
                        download
                        className="p-1.5 hover:bg-gray-100 rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} files
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900 truncate">{selectedMedia.originalName}</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {isImage(selectedMedia.mimeType) ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt || selectedMedia.filename}
                  className="max-w-full max-h-[50vh] mx-auto rounded-lg"
                />
              ) : selectedMedia.mimeType.startsWith('video/') ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-w-full max-h-[50vh] mx-auto rounded-lg"
                />
              ) : selectedMedia.mimeType.includes('pdf') ? (
                <iframe
                  src={selectedMedia.url}
                  className="w-full h-[50vh] rounded-lg border"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  {getFileIcon(selectedMedia.mimeType)}
                  <p className="mt-2 text-gray-600">{selectedMedia.mimeType}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              {/* Vendor Info */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Vendor Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>{selectedMedia.vendor?.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedMedia.vendor?.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedMedia.vendor?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedMedia.vendor?.email}</span>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Filename:</span>
                  <p className="font-medium truncate">{selectedMedia.filename}</p>
                </div>
                <div>
                  <span className="text-gray-500">Size:</span>
                  <p className="font-medium">{formatFileSize(selectedMedia.size)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium">{selectedMedia.mimeType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Uploaded:</span>
                  <p className="font-medium">
                    {new Date(selectedMedia.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">URL:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={window.location.origin + selectedMedia.url}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-100"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(selectedMedia.url)}
                  >
                    {copiedUrl === selectedMedia.url ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <a
                href={selectedMedia.url}
                download
                className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <Button onClick={() => setSelectedMedia(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
