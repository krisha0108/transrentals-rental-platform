/**
 * Data Export Utilities
 * Supports CSV and JSON export formats
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export interface ExportOptions {
  filename?: string;
  columns: ExportColumn[];
  data: any[];
  includeHeaders?: boolean;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(options: ExportOptions): string {
  const { columns, data, includeHeaders = true } = options;

  const rows: string[] = [];

  // Add headers
  if (includeHeaders) {
    const headers = columns.map((col) => escapeCSV(col.label));
    rows.push(headers.join(','));
  }

  // Add data rows
  data.forEach((item) => {
    const values = columns.map((col) => {
      let value = item[col.key];

      // Apply custom formatting if provided
      if (col.format && value !== null && value !== undefined) {
        value = col.format(value);
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Convert to string and escape
      return escapeCSV(String(value));
    });

    rows.push(values.join(','));
  });

  return rows.join('\n');
}

/**
 * Escape special characters in CSV
 */
function escapeCSV(value: string): string {
  // If value contains comma, quotes, or newlines, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape existing quotes by doubling them
    value = value.replace(/"/g, '""');
    return `"${value}"`;
  }
  return value;
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(options: ExportOptions) {
  const csv = convertToCSV(options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const filename = options.filename || 'export.csv';

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Download JSON file in browser
 */
export function downloadJSON(data: any, filename: string = 'export.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Format common data types for export
 */
export const formatters = {
  date: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  datetime: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  number: (value: any) => {
    if (value === null || value === undefined) return '';
    return Number(value).toLocaleString('en-US');
  },

  currency: (value: any, currency: string = 'INR') => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(Number(value));
  },

  percentage: (value: any) => {
    if (value === null || value === undefined) return '';
    return `${Number(value).toFixed(2)}%`;
  },

  boolean: (value: any) => {
    return value ? 'Yes' : 'No';
  },
};

/**
 * Prepare data for export with common transformations
 */
export function prepareExportData<T>(
  data: T[],
  transformers?: Record<string, (item: T) => any>
): any[] {
  if (!transformers) return data;

  return data.map((item) => {
    const transformed: any = { ...item };

    Object.entries(transformers).forEach(([key, transformer]) => {
      transformed[key] = transformer(item);
    });

    return transformed;
  });
}
