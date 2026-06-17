// utils/validators.js

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(String(email).toLowerCase())
}

/**
 * Validate Tanzanian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone number
 */
export const isValidTZPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.startsWith('0') && cleaned.length === 10 || 
         cleaned.startsWith('255') && cleaned.length === 12
}

/**
 * Validate NIDA ID number (20 digits)
 * @param {string} id - ID number to validate
 * @returns {boolean} Is valid ID number
 */
export const isValidNIDA = (id) => {
  const cleaned = id.replace(/\D/g, '')
  return cleaned.length === 20
}

/**
 * Validate amount (positive number)
 * @param {number} amount - Amount to validate
 * @returns {boolean} Is valid amount
 */
export const isValidAmount = (amount) => {
  return !isNaN(amount) && amount > 0
}

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @returns {boolean} Is valid date
 */
export const isValidDate = (date) => {
  const dateObj = new Date(date)
  return dateObj instanceof Date && !isNaN(dateObj)
}