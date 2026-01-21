'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, Check, Trash2, Search, ChevronLeft, ChevronRight, FileText, Video, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string | null;
  createdAt: string;
}

interface VendorMediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: 'image' | 'video' | 'document' | 'all';
  folder?: string;
}

const ITEMS_PER_PAGE = 18;

export default function VendorMediaPicker({
  value,
  onChange,
  label = 'Select Media',
  accept = 'image',
  folder = 'vendor-uploads',
}: VendorMediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine accept attribute for file input
  const acceptAttribute = useMemo(() => {
    switch (accept) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'document':
        return '.pdf,.doc,.docx';
      default:
        return 'image/*,video/*,.pdf,.doc,.docx';
    }
  }, [accept]);

  // Filter media based on search query
  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return media;
    const query = searchQuery.toLowerCase();
    return media.filter(
      (item) =>
        item.originalName.toLowerCase().includes(query) ||
        item.filename.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query) ||
        (item.alt && item.alt.toLowerCase().includes(query))
    );
  }, [media, searchQuery]);

  // Paginate filtered media
  const paginatedMedia = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMedia.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMedia, currentPage]);

  const totalPages = Math.ceil(filteredMedia.length / ITEMS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch media when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const typeParam = accept !== 'all' ? `&type=${accept}` : '';
      const res = await fetch(`/api/vendor/media?limit=100${typeParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.media) {
          setMedia(data.media);
        } else if (Array.isArray(data)) {
          setMedia(data);
        }
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${files.length} file(s)...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      try {
        const res = await fetch('/api/vendor/media', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.media && data.media.length > 0) {
            const newMedia = data.media[0];
            setMedia((prev) => [newMedia, ...prev]);
            // If only one file uploaded, auto-select it
            if (files.length === 1) {
              onChange(newMedia.url);
              setIsOpen(false);
            }
          }
        } else {
          const error = await res.json();
          console.error(`Failed to upload ${file.name}:`, error.error);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [folder]);

  const handleSelect = (url: string) => {
    onChange(url);
    setIsOpen(false);
  };

  const handleRemove = () => {
    onChange('');
  };

  // Get icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-gray-400" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="w-8 h-8 text-gray-400" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('word')) {
      return <FileText className="w-8 h-8 text-gray-400" />;
    }
    return <File className="w-8 h-8 text-gray-400" />;
  };

  // Check if the file is an image
  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Current Preview */}
      {value ? (
        <div className="relative inline-block">
          <div className="w-48 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            {value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
              <img
                src={value}
                alt="Selected file"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-100 transition"
              title="Change file"
            >
              <ImageIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 transition"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate max-w-[192px]">{value}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
        >
          <ImageIcon className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-500">Select File</span>
        </button>
      )}

      {/* Media Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Select from Media Library</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptAttribute}
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            {/* Upload Area */}
            <div
              className={`m-4 border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-500'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-sm text-gray-600">{uploadProgress}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload className={`w-5 h-5 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-600">
                    {isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
                  </span>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, filename, or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-xs text-gray-500 mt-1">
                  Found {filteredMedia.length} file(s) matching "{searchQuery}"
                </p>
              )}
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-auto p-4 pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No files uploaded yet</p>
                  <p className="text-sm">Upload your first file above</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No files found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {paginatedMedia.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition group ${
                        value === item.url
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      title={item.originalName}
                    >
                      {isImage(item.mimeType) ? (
                        <img
                          src={item.url}
                          alt={item.alt || item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          {getFileIcon(item.mimeType)}
                        </div>
                      )}
                      {value === item.url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      {/* Hover overlay with filename */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition">
                        {item.originalName}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} ({filteredMedia.length} files)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
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

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
