import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dateFnsFormat } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely format a date string. Returns fallback if date is invalid.
 * @param dateValue - Date string, Date object, or number
 * @param formatString - Format string for date-fns
 * @param fallback - Fallback value if date is invalid (default: 'N/A')
 */
export function safeFormatDate(
  dateValue: string | Date | number | null | undefined,
  formatString: string,
  fallback: string = 'N/A'
): string {
  try {
    if (!dateValue) return fallback;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return fallback;
    return dateFnsFormat(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
}

/**
 * Convert an array of objects to a CSV string and trigger a browser download.
 * @param data Array of objects to export
 * @param filename Name of the downloaded file (e.g., 'report.csv')
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;

  // Extract headers
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  // Extract rows
  const rows = data.map(item => {
    return headers.map(header => {
      let value = item[header];
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value).replace(/"/g, '""'); // Escape inner quotes
        value = `"${value}"`;
      } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  
  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
