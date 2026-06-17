// utils/formatters.js

/**
 * Format currency to Tanzanian Shilling (TZS)
 * @param {number} value - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'TZS 0'
  
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace('TZS', 'TZS')
}

/**
 * Format date to localized string
 * @param {string|Date} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }
  
  return new Intl.DateTimeFormat('sw-TZ', defaultOptions).format(dateObj)
}

/**
 * Format date to short format (dd/mm/yyyy)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted short date
 */
export const formatShortDate = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''
  
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Format date to time string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''
  
  return new Intl.DateTimeFormat('sw-TZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(dateObj)
}

/**
 * Format datetime to full string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''
  
  return new Intl.DateTimeFormat('sw-TZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

/**
 * Format number with commas
 * @param {number} value - The number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
  
  return new Intl.NumberFormat('sw-TZ').format(value)
}

/**
 * Format percentage
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0%'
  
  return new Intl.NumberFormat('sw-TZ', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100)
}

/**
 * Format phone number to Tanzanian format
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Check if it's a Tanzanian number (starts with 0 or 255)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+255 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  } else if (cleaned.startsWith('255') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  
  return phone
}

/**
 * Format ID number (NIDA/Zanzibar ID)
 * @param {string} id - The ID number to format
 * @returns {string} Formatted ID number
 */
export const formatIDNumber = (id) => {
  if (!id) return ''
  
  // Remove all non-numeric characters
  const cleaned = id.replace(/\D/g, '')
  
  // Format based on length (TZ IDs are typically 20 digits)
  if (cleaned.length === 20) {
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4-$5')
  }
  
  return id
}

/**
 * Truncate text with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return ''
  if (text.length <= length) return text
  
  return text.substring(0, length) + '...'
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format loan status to Swahili
 * @param {string} status - The loan status
 * @returns {string} Swahili status
 */
export const formatLoanStatus = (status) => {
  const statusMap = {
    'pending': 'Inasubiri',
    'active': 'Inaendelea',
    'paid': 'Imelipwa',
    'defaulted': 'Imechelewa',
    'rejected': 'Imekataliwa',
    'approved': 'Imeidhinishwa'
  }
  
  return statusMap[status] || status
}

/**
 * Format payment status to Swahili
 * @param {string} status - The payment status
 * @returns {string} Swahili status
 */
export const formatPaymentStatus = (status) => {
  const statusMap = {
    'pending': 'Inasubiri',
    'completed': 'Imekamilika',
    'failed': 'Imeshindikana',
    'partial': 'Sehemu'
  }
  
  return statusMap[status] || status
}

/**
 * Format collateral status to Swahili
 * @param {string} status - The collateral status
 * @returns {string} Swahili status
 */
export const formatCollateralStatus = (status) => {
  const statusMap = {
    'active': 'Inatumika',
    'taken': 'Imechukuliwa',
    'released': 'Imetolewa'
  }
  
  return statusMap[status] || status
}

/**
 * Format user role to Swahili
 * @param {string} role - The user role
 * @returns {string} Swahili role
 */
export const formatUserRole = (role) => {
  const roleMap = {
    'admin': 'Msimamizi',
    'loan_officer': 'Afisa Mkopo',
    'accountant': 'Mhasibu'
  }
  
  return roleMap[role] || role
}