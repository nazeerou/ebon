// stores/reading.js
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

/* =========================================================
 * Normalize a reading object coming from the backend
 * so the frontend always works with the same shape.
 * ========================================================= */
function normalizeReading(r) {
  if (!r) return null
  return {
    id: r.id ?? null,
    previous_reading: Number(r.previous_reading ?? 0),
    current_reading: Number(r.current_reading ?? 0),
    difference: Number(r.difference ?? 0),
    reading_date: r.reading_date ?? null,
    machine_id: r.machine_id ?? null,
    machine: r.machine ?? null,
    created_by: r.created_by ?? null,
    creator: r.creator ?? null,
    image: r.image ?? null,
  }
}

/* =========================================================
 * Pull a single reading out of whatever the backend returned.
 * Handles:
 *   { data: { ...reading } }         ← single object
 *   { data: { data: [ ... ] } }      ← paginated envelope
 *   { data: [ ... ] }                ← raw array
 *   [ ... ]                          ← raw array at root
 * ========================================================= */
function extractOneReading(payload) {
  if (!payload) return null

  // Paginated envelope
  if (Array.isArray(payload.data)) {
    return payload.data[0] ?? null
  }

  // Single object
  if (payload.data && typeof payload.data === 'object' && payload.data.id) {
    return payload.data
  }

  // Direct object
  if (payload.id) return payload

  return null
}

export const useReadingStore = defineStore('reading', {
  state: () => ({
    readings: [],
    currentReading: null,
    loading: false,
    error: null,
    isOnline: navigator.onLine,
    lastReadingForMachine: null,

    // Kept so init() doesn't double-register listeners
    _listenersAttached: false,
  }),

  getters: {
    totalReadings: (state) => state.readings.length,
    getLastReadingForMachine: (state) => state.lastReadingForMachine,
  },

  actions: {
    /* =========================================================
     * Helper — attach user_id + business_id to any payload
     * ========================================================= */
    _attachUserContext(payload) {
      const authStore = useAuthStore()
      const userId = authStore.user?.id ?? null
      const businessId = authStore.user?.business_id ?? null

      if (payload instanceof FormData) {
        if (userId && !payload.has('user_id')) payload.append('user_id', userId)
        if (businessId && !payload.has('business_id')) payload.append('business_id', businessId)
        return payload
      }

      // Plain object — caller-provided values win
      return {
        ...(userId ? { user_id: userId } : {}),
        ...(businessId ? { business_id: businessId } : {}),
        ...payload,
      }
    },

    async init() {
      if (this.isOnline) {
        try {
          await this.fetchReadings()
        } catch (e) {
          // silently ignore — page-level errors will be shown elsewhere
        }
      }

      if (!this._listenersAttached) {
        window.addEventListener('online', this.handleOnline)
        window.addEventListener('offline', this.handleOffline)
        this._listenersAttached = true
      }
    },

    handleOnline() {
      this.isOnline = true
      this.fetchReadings().catch(() => {})
    },

    handleOffline() {
      this.isOnline = false
      this.error = 'You are offline. Please check your internet connection.'
    },

    /* =========================================================
     * Fetch all readings (paginated)
     * ========================================================= */
    async fetchReadings(params = {}) {
      if (!this.isOnline) {
        this.error = 'No internet connection. Please connect to the internet.'
        throw new Error('No internet connection')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/readings`, { params })
        const body = response.data

        if (body.success) {
          const responseData = body.data

          // Paginated: { data: [...], current_page, ... }
          if (responseData && Array.isArray(responseData.data)) {
            this.readings = responseData.data.map(normalizeReading)
            return { success: true, data: responseData }
          }

          // Single object or array
          if (Array.isArray(responseData)) {
            this.readings = responseData.map(normalizeReading)
            return { success: true, data: responseData }
          }

          if (responseData && responseData.id) {
            this.readings = [normalizeReading(responseData)]
            return { success: true, data: responseData }
          }

          // Empty
          this.readings = []
          return { success: true, data: responseData }
        }

        return body
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch readings'
        throw error
      } finally {
        this.loading = false
      }
    },

    /* =========================================================
     * Fetch the most recent reading for a specific machine code
     * ========================================================= */
    async fetchPreviousReadingByMachineCode(machineCode) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch reading.')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/readings`, {
          params: { machine_code: machineCode, per_page: 1 },
        })

        // Backend returns { success, data: <reading|null>, message }
        if (!response.data.success) {
          this.lastReadingForMachine = null
          return null
        }

        const raw = response.data.data
        const readingData = extractOneReading({ data: raw })

        if (!readingData) {
          this.lastReadingForMachine = null
          return null
        }

        this.lastReadingForMachine = normalizeReading(readingData)
        return this.lastReadingForMachine
      } catch (error) {
        // 422 = machine_code has no match → treat as "no previous reading"
        if (error.response?.status === 422) {
          this.lastReadingForMachine = null
          return null
        }

        console.error('Error fetching previous reading by machine code:', error)
        this.error = error.response?.data?.message || 'Failed to fetch previous reading'
        this.lastReadingForMachine = null
        throw error
      } finally {
        this.loading = false
      }
    },

    /* =========================================================
     * Fetch previous reading by machine_id (latest overall)
     * ========================================================= */
    async fetchPreviousReadingByMachineId(machineId) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch reading.')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/readings`, {
          params: { machine_id: machineId, per_page: 1 },
        })

        if (!response.data.success) {
          this.lastReadingForMachine = null
          return null
        }

        const raw = response.data.data
        const readingData = extractOneReading({ data: raw })

        if (!readingData) {
          this.lastReadingForMachine = null
          return null
        }

        this.lastReadingForMachine = normalizeReading(readingData)
        return this.lastReadingForMachine
      } catch (error) {
        if (error.response?.status === 422) {
          this.lastReadingForMachine = null
          return null
        }

        console.error('Error fetching previous reading by machine ID:', error)
        this.error = error.response?.data?.message || 'Failed to fetch previous reading'
        this.lastReadingForMachine = null
        throw error
      } finally {
        this.loading = false
      }
    },

    /* =========================================================
     * Fetch the latest reading BEFORE a given date for a specific machine
     * ========================================================= */
    async fetchPreviousReading(machineId, beforeDate) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch reading.')
      }

      this.loading = true
      this.error = null

      try {
        const params = {
          machine_id: machineId,
          per_page: 1,
          before_date: beforeDate,
          sort_by: 'reading_date',
          sort_order: 'desc',
        }

        const response = await axios.get(`${API_URL}/readings`, { params })

        if (!response.data.success) {
          return null
        }

        const raw = response.data.data
        return extractOneReading({ data: raw })
      } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 422) {
          return null
        }
        console.error('Error fetching previous reading:', error)
        this.error = error.response?.data?.message || 'Failed to fetch previous reading'
        throw error
      } finally {
        this.loading = false
      }
    },

    /* =========================================================
     * Create a new reading (OCR or manual entry)
     * user_id + business_id are injected automatically
     * ========================================================= */
    async createReading(readingData) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot create reading.')
      }

      try {
        const payload = this._attachUserContext(readingData)

        const config =
          payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}

        const response = await axios.post(`${API_URL}/readings`, payload, config)

        if (response.data.success) {
          await this.fetchReadings()
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create reading'
        throw error
      }
    },

    /* =========================================================
     * Delete a single reading
     * ========================================================= */
    async deleteReading(id) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot delete reading.')
      }

      try {
        const response = await axios.delete(`${API_URL}/readings/${id}`)

        if (response.data.success || response.data.status === 'success') {
          this.readings = this.readings.filter((r) => r.id !== id)
          if (this.currentReading?.id === id) {
            this.currentReading = null
          }
          return response.data
        }
        throw new Error(response.data.message || 'Failed to delete reading')
      } catch (error) {
        let errorMessage = 'Failed to delete reading'
        if (error.response?.data?.message) errorMessage = error.response.data.message
        else if (error.response?.data?.error) errorMessage = error.response.data.error
        else if (error.message) errorMessage = error.message

        if (error.response?.status === 403)
          errorMessage = 'You do not have permission to delete this reading'
        else if (error.response?.status === 404) errorMessage = 'Reading not found'

        const customError = new Error(errorMessage)
        customError.response = error.response
        throw customError
      }
    },

    /* =========================================================
     * Fetch a single reading by ID
     * ========================================================= */
    async fetchReading(id) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch reading details.')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/readings/${id}`)

        const data = response.data?.data ?? response.data

        if (data && data.id) {
          this.currentReading = normalizeReading(data)
          return this.currentReading
        }

        throw new Error(response.data.message || 'Reading not found')
      } catch (error) {
        let message = 'Failed to fetch reading'
        if (error.response) {
          const status = error.response.status
          if (status === 404) {
            message = 'Usomaji haupatikani'
          } else {
            message = error.response.data?.message || error.response.statusText || message
          }
        } else if (error.request) {
          message = 'Hakuna majibu kutoka server. Hakikisha umeunganishwa.'
        } else {
          message = error.message || message
        }
        this.error = message
        throw new Error(message)
      } finally {
        this.loading = false
      }
    },

    /* =========================================================
     * Export readings (CSV/Excel)
     * ========================================================= */
    async exportReadings(filters = {}) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot export.')
      }

      try {
        const response = await axios.get(`${API_URL}/readings/export`, {
          params: filters,
          responseType: 'blob',
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'readings_export.csv'
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (match && match[1]) filename = match[1].replace(/['"]/g, '')
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || 'Export failed'
        throw error
      }
    },

    /* =========================================================
     * OCR-specific — sends image + user context
     * ========================================================= */
    async processOCR(imageFile, machineId) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot process OCR.')
      }

      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('machine_id', machineId)

      // user_id + business_id attached automatically
      this._attachUserContext(formData)

      try {
        const response = await axios.post(`${API_URL}/readings/ocr`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'OCR processing failed'
        throw error
      }
    },

    /* =========================================================
     * Clear all data (on logout)
     * ========================================================= */
    clearAllData() {
      this.readings = []
      this.currentReading = null
      this.lastReadingForMachine = null
      this.loading = false
      this.error = null
    },

    cleanup() {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
      this._listenersAttached = false
    },
  },
})
