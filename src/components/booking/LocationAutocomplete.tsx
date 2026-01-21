'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useLocations, Location } from './useLocations';

interface LocationAutocompleteProps {
  value: string;
  locationId: string;
  onChange: (locationId: string, locationName: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  allowCustom?: boolean;
  serviceSlug?: string; // Optional service slug to filter locations
}

export function LocationAutocomplete({
  value,
  locationId,
  onChange,
  placeholder = 'Search location...',
  label,
  required = false,
  className = '',
  allowCustom = true,
  serviceSlug,
}: LocationAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { locations, isLoading } = useLocations({ serviceSlug });

  // Filter locations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = locations.filter(
        (location) =>
          location.name.toLowerCase().includes(query) ||
          location.state?.toLowerCase().includes(query)
      );
      setFilteredLocations(filtered);
    }
  }, [searchQuery, locations]);

  // Update search query when value prop changes
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setShowSuggestions(true);
    setHighlightedIndex(-1);

    // If custom allowed, update with the custom text (empty locationId indicates custom)
    if (allowCustom) {
      onChange('', newValue);
    } else if (locationId) {
      // Clear selection if user is typing and custom not allowed
      onChange('', '');
    }
  };

  const handleSelectLocation = (location: Location) => {
    setSearchQuery(location.name);
    onChange(location.id.toString(), location.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key for custom location even when no suggestions
    if (e.key === 'Enter' && allowCustom && searchQuery.trim()) {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredLocations.length) {
        handleSelectLocation(filteredLocations[highlightedIndex]);
      } else {
        // Use custom location text
        onChange('', searchQuery.trim());
        setShowSuggestions(false);
      }
      return;
    }

    if (!showSuggestions || filteredLocations.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredLocations.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredLocations.length) {
          handleSelectLocation(filteredLocations[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
          required={required}
          disabled={isLoading}
          autoComplete="off"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Location Icon */}
        {!isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && !isLoading && filteredLocations.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredLocations.map((location, index) => (
            <button
              key={location.id}
              type="button"
              onClick={() => handleSelectLocation(location)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                index === highlightedIndex ? 'bg-primary/10' : ''
              } ${index !== filteredLocations.length - 1 ? 'border-b border-gray-100' : ''}`}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{location.name}</div>
                {location.state && (
                  <div className="text-xs text-gray-500">{location.state}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showSuggestions && !isLoading && searchQuery.trim() !== '' && filteredLocations.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4">
          {allowCustom ? (
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">No matching locations found</p>
              <p className="text-green-600 text-sm font-medium">
                "{searchQuery}" will be used as your destination
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-500">No locations found for "{searchQuery}"</p>
          )}
        </div>
      )}
    </div>
  );
}
