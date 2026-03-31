'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import {
  DateFilterType,
  getDateRange,
  getFilterLabel,
  formatDateRangeDisplay,
  parseAPIDate,
  validateDateRange,
} from '@/lib/utils/dateFilters';

interface DateFilterDropdownProps {
  onFilterChange: (startDate: string | null, endDate: string | null) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function DateFilterDropdown({
  onFilterChange,
  initialStartDate,
  initialEndDate,
}: DateFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState(initialStartDate || '');
  const [customEndDate, setCustomEndDate] = useState(initialEndDate || '');
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selectedFilter with incoming props (fix for label not updating)
  useEffect(() => {
    if (!initialStartDate && !initialEndDate) {
      setSelectedFilter('all');
      setCustomStartDate('');
      setCustomEndDate('');
      return;
    }

    if (initialStartDate && initialEndDate) {
      // Update the custom dates
      setCustomStartDate(initialStartDate);
      setCustomEndDate(initialEndDate);

      // Check if the dates match any predefined filter
      const predefinedFilters: DateFilterType[] = [
        'today',
        'yesterday',
        'thisWeek',
        'lastWeek',
        'thisMonth',
        'lastMonth',
      ];

      let matchedFilter: DateFilterType | null = null;
      for (const filterType of predefinedFilters) {
        const range = getDateRange(filterType);
        if (range && range.startDate === initialStartDate && range.endDate === initialEndDate) {
          matchedFilter = filterType;
          break;
        }
      }

      // Set the selected filter to the matched predefined filter or 'custom'
      setSelectedFilter(matchedFilter || 'custom');
    }
  }, [initialStartDate, initialEndDate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInputs(false);
        setError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle predefined filter selection
  const handleFilterSelect = (filterType: DateFilterType) => {
    setError(null);

    if (filterType === 'all') {
      setSelectedFilter('all');
      setCustomStartDate('');
      setCustomEndDate('');
      setShowCustomInputs(false);
      onFilterChange(null, null);
      setIsOpen(false);
      return;
    }

    if (filterType === 'custom') {
      setShowCustomInputs(true);
      setSelectedFilter('custom');
      return;
    }

    const range = getDateRange(filterType);
    if (range) {
      setSelectedFilter(filterType);
      setCustomStartDate(range.startDate);
      setCustomEndDate(range.endDate);
      setShowCustomInputs(false);
      onFilterChange(range.startDate, range.endDate);
      setIsOpen(false);
    }
  };

  // Handle custom date range application
  const handleApplyCustomRange = () => {
    const validation = validateDateRange(customStartDate || null, customEndDate || null);

    if (!validation.valid) {
      setError(validation.error || 'Invalid date range');
      return;
    }

    if (!customStartDate || !customEndDate) {
      setError('Both start and end dates are required');
      return;
    }

    setError(null);
    setSelectedFilter('custom');
    onFilterChange(customStartDate, customEndDate);
    setIsOpen(false);
    setShowCustomInputs(false);
  };

  // Handle clear filter
  const handleClearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomInputs(false);
    setError(null);
    onFilterChange(null, null);
  };

  // Get display text for selected filter
  const getDisplayText = () => {
    if (selectedFilter === 'all') {
      return 'All Time';
    }

    if (selectedFilter === 'custom' && customStartDate && customEndDate) {
      const start = parseAPIDate(customStartDate);
      const end = parseAPIDate(customEndDate);
      return formatDateRangeDisplay(start, end);
    }

    return getFilterLabel(selectedFilter);
  };

  const filterOptions: { value: DateFilterType; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const hasActiveFilter = selectedFilter !== 'all';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
          hasActiveFilter
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>{getDisplayText()}</span>
        {hasActiveFilter ? (
          <span
            role="button"
            className="inline-flex"
            onClick={(e) => { e.stopPropagation(); handleClearFilter(e); }}
          >
            <X className="w-4 h-4 hover:text-emerald-900" />
          </span>
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {!showCustomInputs ? (
            <div className="py-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selectedFilter === option.value
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCustomInputs(false);
                    setError(null);
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCustomRange}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
