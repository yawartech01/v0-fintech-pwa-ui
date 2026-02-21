import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// === Currency & Number Formatting ===

/**
 * Format INR currency with ₹ symbol
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format USDT amount with consistent decimals
 * Use 2-6 decimals based on amount size
 */
export function formatUSDT(amount: number): string {
  // For large amounts (>= 1), use 2 decimals
  if (amount >= 1) {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  // For small amounts (< 1), use up to 6 decimals
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

/**
 * Format number with specified decimals
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

// === Date & Time Formatting ===

/**
 * Format date as absolute timestamp
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Format date as relative time (e.g., "5 mins ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return formatDate(dateObj)
}

// === Address & Account Formatting ===

/**
 * Shorten blockchain address (show first/last N chars)
 */
export function shortenAddress(address: string, chars: number = 6): string {
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Mask bank account number (show only last 4 digits)
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber
  return `****${accountNumber.slice(-4)}`
}

// === Validation Helpers ===

/**
 * Validate IFSC code format
 */
export function isValidIFSC(ifsc: string): boolean {
  const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return regex.test(ifsc)
}

/**
 * Validate bank account number
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  return /^\d{9,18}$/.test(accountNumber)
}

/**
 * Validate TRC20 address format (basic)
 */
export function isValidTRC20Address(address: string): boolean {
  return address.length === 34 && address.startsWith('T')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// === Amount Validation ===

/**
 * Check if amount is valid (positive, not NaN, finite)
 */
export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && isFinite(amount) && amount > 0
}

/**
 * Check if user has sufficient balance
 */
export function hasSufficientBalance(required: number, available: number): boolean {
  return available >= required && required > 0
}
