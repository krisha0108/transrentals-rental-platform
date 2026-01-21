'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
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
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string | null;
  folder: string | null;
  createdAt: string;
}

const ITEMS_PER_PAGE = 24;

export default function VendorMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [folders, setFolders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/vendor/media?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (folderFilter) url += `&folder=${encodeURIComponent(folderFilter)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMedia(data.media);
          setTotalItems(data.pagination?.total || data.media.length);
          setFolders(data.folders || []);
        }
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, typeFilter, folderFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, folderFilter]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(`Uploading ${files.length} file(s)...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'vendor-uploads');

      try {
        const res = await fetch('/api/vendor/media', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          console.error(`Failed to upload ${file.name}:`, error.error);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    setUploading(false);
    setUploadProgress(null);
    fetchMedia();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`/api/vendor/media?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
        setSelectedMedia(null);
        setTotalItems((prev) => prev - 1);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete file');
    }
  };

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600">Upload and manage your images, videos, and documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchMedia} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Upload Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-gray-600">{uploadProgress}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={`w-10 h-10 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-gray-600">
              {isDragOver ? 'Drop files here' : 'Drag and drop files here, or click to browse'}
            </p>
            <p className="text-sm text-gray-400">
              Supports images, videos, PDFs, and documents (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
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

          {/* Folder Filter */}
          {folders.length > 0 && (
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Folders</option>
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          )}

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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500 mb-4">
            {search || typeFilter || folderFilter
              ? 'Try adjusting your filters'
              : 'Upload your first file to get started'}
          </p>
          {!search && !typeFilter && !folderFilter && (
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          )}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-sm font-medium text-gray-900 truncate">{item.originalName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
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
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
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
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
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
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  {getFileIcon(selectedMedia.mimeType)}
                  <p className="mt-2 text-gray-600">{selectedMedia.mimeType}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
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
              <Button
                variant="outline"
                onClick={() => handleDelete(selectedMedia.id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button onClick={() => setSelectedMedia(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
