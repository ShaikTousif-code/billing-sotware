/**
 * Date utility functions for converting UTC to local timezone
 * and formatting dates consistently across the application
 */

import { format as formatDateFns } from 'date-fns'

/**
 * Converts a UTC date string or Date object to local timezone Date
 * @param date - UTC date string (ISO format) or Date object
 * @returns Date object in local timezone
 */
export const utcToLocal = (date: string | Date | null | undefined): Date => {
  if (!date) return new Date()
  
  // If it's already a Date object, return it (it's already in local timezone when created)
  if (date instanceof Date) {
    return date
  }
  
  // If it's a string, parse it as UTC and convert to local
  // When you create a Date from an ISO string, it's automatically converted to local timezone
  let dateStr = date
  
  // Ensure the string has timezone information
  // If it doesn't end with 'Z' or have timezone offset, assume it's UTC
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    // If the string doesn't have timezone info, append 'Z' to indicate UTC
    if (dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
      dateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'
    }
  }
  
  const dateObj = new Date(dateStr)
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to utcToLocal:', date)
    return new Date()
  }
  
  return dateObj
}

/**
 * Formats a date to a readable date string (e.g., "Jan 15, 2024")
 * @param date - UTC date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  const localDate = utcToLocal(date)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  return localDate.toLocaleDateString(undefined, { ...defaultOptions, ...options })
}

/**
 * Formats a date to include time (e.g., "Jan 15, 2024, 3:30 PM")
 * @param date - UTC date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date-time string
 */
export const formatDateTime = (
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  const localDate = utcToLocal(date)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
  
  return localDate.toLocaleString(undefined, { ...defaultOptions, ...options })
}

/**
 * Formats a date to a short date string (e.g., "01/15/2024")
 * @param date - UTC date string or Date object
 * @returns Formatted short date string
 */
export const formatDateShort = (date: string | Date | null | undefined): string => {
  const localDate = utcToLocal(date)
  return localDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Formats a date to include time in 24-hour format (e.g., "2024-01-15 15:30")
 * @param date - UTC date string or Date object
 * @returns Formatted date-time string in 24-hour format
 */
export const formatDateTime24 = (date: string | Date | null | undefined): string => {
  const localDate = utcToLocal(date)
  return localDate.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Formats a date to a relative time string (e.g., "2 hours ago", "yesterday")
 * @param date - UTC date string or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  const localDate = utcToLocal(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - localDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 172800) return 'yesterday'
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(localDate)
}

/**
 * Formats a date for Indian locale (DD MMM YYYY)
 * @param date - UTC date string or Date object
 * @returns Formatted date string in Indian format
 */
export const formatDateIndian = (date: string | Date | null | undefined): string => {
  const localDate = utcToLocal(date)
  return localDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Formats a date-time for Indian locale (DD MMM YYYY, HH:MM AM/PM)
 * @param date - UTC date string or Date object
 * @returns Formatted date-time string in Indian format
 */
export const formatDateTimeIndian = (date: string | Date | null | undefined): string => {
  const localDate = utcToLocal(date)
  return localDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Gets the time portion of a date (e.g., "3:30 PM")
 * @param date - UTC date string or Date object
 * @returns Formatted time string
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  const localDate = utcToLocal(date)
  return localDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Formats a date for use in date-fns format function
 * This is a helper for components that use date-fns
 * @param date - UTC date string or Date object
 * @returns Date object suitable for date-fns
 */
export const getLocalDate = (date: string | Date | null | undefined): Date => {
  return utcToLocal(date)
}

/**
 * Formats a date using date-fns format function with local timezone conversion
 * @param date - UTC date string or Date object
 * @param formatString - date-fns format string (e.g., 'MMM dd, yyyy HH:mm:ss')
 * @returns Formatted date string
 */
export const formatToLocalTime = (
  date: string | Date | null | undefined,
  formatString: string
): string => {
  if (!date) return ''
  
  let dateObj: Date
  
  if (date instanceof Date) {
    dateObj = date
  } else {
    // Parse the date string - if it's UTC (ends with Z), JavaScript will auto-convert to local
    // If it doesn't have timezone info, we need to treat it as UTC
    let dateStr = date.toString().trim()
    
    // If the string doesn't have timezone info and looks like ISO format, assume UTC
    if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
      // Append 'Z' to indicate UTC
      dateStr = dateStr + 'Z'
    }
    
    dateObj = new Date(dateStr)
    
    // If parsing failed, try without modification
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date(date)
    }
  }
  
  // date-fns format uses the Date object's local timezone representation
  // The Date object already represents the time in local timezone when created from UTC string
  return formatDateFns(dateObj, formatString)
}

/**
 * Gets the start of today in local timezone (00:00:00)
 * @returns Date object representing start of today in local timezone
 */
export const getStartOfToday = (): Date => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  return start
}

/**
 * Gets the end of today in local timezone (23:59:59.999)
 * @returns Date object representing end of today in local timezone
 */
export const getEndOfToday = (): Date => {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return end
}

/**
 * Gets the start of a date in local timezone (00:00:00)
 * @param date - Date to get start of
 * @returns Date object representing start of the date in local timezone
 */
export const getStartOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

/**
 * Gets the end of a date in local timezone (23:59:59.999)
 * @param date - Date to get end of
 * @returns Date object representing end of the date in local timezone
 */
export const getEndOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

/**
 * Converts a local date to UTC ISO string for API calls
 * This converts the local date to UTC, preserving the actual moment in time
 * @param date - Local date to convert
 * @returns ISO string in UTC
 */
export const localDateToUTCISO = (date: Date): string => {
  // The date is already in local timezone
  // toISOString() converts it to UTC, which is what we want for API calls
  // This ensures the API receives the correct UTC time that corresponds to the local date
  return date.toISOString()
}

/**
 * Checks if two dates are on the same day in local timezone
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if dates are on the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = date1 instanceof Date ? date1 : utcToLocal(date1)
  const d2 = date2 instanceof Date ? date2 : utcToLocal(date2)
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

