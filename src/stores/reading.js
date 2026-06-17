// stores/reading.js
import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
// const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

export const useReadingStore = defineStore('reading', {
  state: () => ({
    readings: [],
    currentReading: null,
    loading: false,
    error: null,
    isOnline: navigator.onLine,
    lastReadingForMachine: null, // 👈 added for storing last reading
  }),

  getters: {
    totalReadings: (state) => state.readings.length,
    getLastReadingForMachine: (state) => state.lastReadingForMachine,
  },

  actions: {
    async init() {
      if (this.isOnline) {
        await this.fetchReadings()
      }
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    },

    handleOnline() {
      this.isOnline = true
      this.fetchReadings()
    },

    handleOffline() {
      this.isOnline = false
      this.error = 'You are offline. Please check your internet connection.'
    },

    // Fetch all readings (with pagination, search, and optional machine_code)
    async fetchReadings(params = {}) {
      if (!this.isOnline) {
        this.error = 'No internet connection. Please connect to the internet.'
        throw new Error('No internet connection')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/readings`, { params })

        if (response.data.success) {
          const responseData = response.data.data
          this.readings = responseData.data || responseData || []
          return {
            success: true,
            data: responseData,
          }
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch readings'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 👇 NEW: Fetch the most recent reading for a specific machine code
    async fetchPreviousReadingByMachineCode(machineCode) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch reading.')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/readings`, {
          params: {
            machine_code: machineCode,
            per_page: 1,
          },
        })

        // ✅ Angalia response.success
        if (!response.data.success) {
          // Kama server imerudisha false, tupa kosa
          throw new Error(response.data.message || 'Failed to fetch reading')
        }

        // ✅ Sasa `data` inaweza kuwa object (last reading) au null
        const readingData = response.data.data

        if (!readingData) {
          // Hakuna usomaji uliopita
          this.lastReadingForMachine = null
          return null
        }

        // ✅ Hifadhi data ya usomaji
        this.lastReadingForMachine = {
          previous_reading: readingData.previous_reading || 0,
          current_reading: readingData.current_reading || 0,
          difference: readingData.difference || 0,
          reading_date: readingData.reading_date || null,
          machine_id: readingData.machine_id,
          machine: readingData.machine || null,
        }

        return this.lastReadingForMachine
      } catch (error) {
        console.error('Error fetching previous reading by machine code:', error)
        this.error = error.response?.data?.message || 'Failed to fetch previous reading'
        this.lastReadingForMachine = null
        throw error
      } finally {
        this.loading = false
      }
    },
    // 👇 Alternative: fetch previous reading by machine_id (if you already have it)
    async fetchPreviousReadingByMachineId(machineId) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch reading.')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/readings`, {
          params: {
            machine_id: machineId,
            per_page: 1,
          },
        })

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch reading')
        }

        const readingData = response.data.data

        if (!readingData) {
          this.lastReadingForMachine = null
          return null
        }

        this.lastReadingForMachine = {
          previous_reading: readingData.previous_reading || 0,
          current_reading: readingData.current_reading || 0,
          difference: readingData.difference || 0,
          reading_date: readingData.reading_date || null,
          machine_id: readingData.machine_id,
          machine: readingData.machine || null,
        }

        return this.lastReadingForMachine
      } catch (error) {
        console.error('Error fetching previous reading by machine ID:', error)
        this.error = error.response?.data?.message || 'Failed to fetch previous reading'
        this.lastReadingForMachine = null
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create a new reading (via OCR or manual entry)
    async createReading(readingData) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot create reading.')
      }

      try {
        const response = await axios.post(`${API_URL}/readings`, readingData)

        if (response.data.success) {
          await this.fetchReadings()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create reading'
        throw error
      }
    },

    // Delete a single reading
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
        console.error('Delete reading error:', error)
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

    // Fetch a single reading by ID
    async fetchReading(id) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch reading details.')
      }

      try {
        const response = await axios.get(`${API_URL}/readings/${id}`)

        if (response.data.success) {
          this.currentReading = response.data.data
          return this.currentReading
        }
        throw new Error('Reading not found')
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch reading'
        throw error
      }
    },

    // Export readings (CSV/Excel)
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

    // OCR-specific: send image and get reading (if backend supports)
    async processOCR(imageFile, machineId) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot process OCR.')
      }

      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('machine_id', machineId)

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

    // Clear all data (on logout)
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
    },
  },
})
