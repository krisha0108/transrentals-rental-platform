'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface SearchableSelectOption {
  id: string;
  label: string;
  subtitle?: string;
  value?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  icon,
  loading = false,
  emptyMessage = 'No options found',
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected option
  const selectedOption = options.find((opt) => opt.id === value);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-gray-900 cursor-pointer flex items-center justify-between bg-white hover:border-amber-400 transition"
        >
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {icon}
            </div>
          )}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition ${isOpen ? 'rotate-180' : ''
              }`}
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">{emptyMessage}</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-amber-50 transition flex items-center justify-between ${value === option.id ? 'bg-amber-50' : ''
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {option.label}
                      </div>
                      {option.subtitle && (
                        <div className="text-xs text-gray-500 truncate">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                    {value === option.id && (
                      <Check className="w-4 h-4 text-amber-600 ml-2 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
