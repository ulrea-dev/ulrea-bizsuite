/**
 * Number formatting utilities for better user experience
 */

/**
 * Formats a number string with commas for thousands separators
 * @param value - The numeric string to format
 * @returns Formatted string with commas
 */
export const formatNumberWithCommas = (value: string): string => {
  // Remove existing commas and non-numeric characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '');
  
  // Split by decimal point
  const parts = cleanValue.split('.');
  
  // Add commas to the integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Return formatted value, preserving decimal if it exists
  return parts.join('.');
};

/**
 * Removes commas from a formatted number string to get the raw numeric value
 * @param value - The formatted string with commas
 * @returns Clean numeric string
 */
export const removeCommas = (value: string): string => {
  return value.replace(/,/g, '');
};

/**
 * Parses a formatted number string to a number
 * @param value - The formatted string with commas
 * @returns Parsed number or 0 if invalid
 */
export const parseFormattedNumber = (value: string): number => {
  const cleanValue = removeCommas(value);
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};