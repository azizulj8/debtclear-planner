/**
 * Formats a number into Rupiah currency string.
 * @param {number|string} value - The number to format
 * @returns {string} Formatted string, e.g., "Rp 1.500.000"
 */
export function formatRupiah(value) {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value
  if (isNaN(num)) return ''

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Parses a Rupiah formatted string back to a number.
 * @param {string} value - The formatted string, e.g., "Rp 1.500.000"
 * @returns {number} The parsed number, e.g., 1500000
 */
export function parseRupiah(value) {
  if (!value) return 0
  const numStr = value.toString().replace(/[^0-9]/g, '')
  const parsed = parseInt(numStr, 10)
  return isNaN(parsed) ? 0 : parsed
}
