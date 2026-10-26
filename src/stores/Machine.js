// stores/machineStore.js
import { defineStore } from 'pinia'
import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

/**
 * Build a FormData payload when files are present or when explicitly requested.
 * Laravel requires POST + _method=PUT for multipart updates.
 */
function buildFormData(data, method = null) {
  const fd = new FormData()

  const appendValue = (key, value) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (v instanceof File) {
          fd.append(`${key}[${i}]`, v)
        } else if (typeof v === 'object' && v !== null) {
          fd.append(`${key}[${i}]`, JSON.stringify(v))
        } else {
          fd.append(`${key}[]`, v)
        }
      })
    } else if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
      fd.append(key, JSON.stringify(value))
    } else {
      fd.append(key, value)
    }
  }

  Object.entries(data).forEach(([key, value]) => appendValue(key, value))

  if (method) fd.append('_method', method)
  return fd
}

function containsFiles(data) {
  if (!data || typeof data !== 'object') return false
  return Object.values(data).some((value) => {
    if (value instanceof File || value instanceof Blob) return true
    if (Array.isArray(value)) {
      return value.some((v) => v instanceof File || v instanceof Blob)
    }
    return false
  })
}

export const useMachineStore = defineStore('machine', {
  state: () => ({
    machines: [],
    currentMachine: null,
    loading: false,
    error: null,
    statistics: {
      total: 0,
      active: 0,
      maintenance: 0,
      inactive: 0,
      total_collections: 0,
      pending_readings: 0,
    },
    summary: {
      total_machines: 0,
      active_machines: 0,
      total_collections: 0,
      pending_readings: 0,
    },
  }),

  getters: {
    totalMachines: (state) => state.machines.length,
    activeMachines: (state) => state.machines.filter((m) => m.status === 'active').length,
    maintenanceMachines: (state) => state.machines.filter((m) => m.status === 'maintenance').length,
    inactiveMachines: (state) => state.machines.filter((m) => m.status === 'inactive').length,
    totalCollections: (state) =>
      state.machines.reduce((sum, m) => sum + (parseFloat(m.total_collections) || 0), 0),
  },

  actions: {
    /* ==================================================================
     |  READ ACTIONS — these hit the API
     * ================================================================== */

    async fetchMachines(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/machines`, { params })

        if (response.data.success) {
          this.machines = response.data.data.data || response.data.data || []
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch machines'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMachine(id) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/machines/${id}`)

        if (response.data.success) {
          this.currentMachine = response.data.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch machine'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchStatistics() {
      try {
        const response = await axios.get(`${API_URL}/machines/statistics`)

        if (response.data.success) {
          this.statistics = response.data.data.statistics
          this.summary = response.data.data.summary
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching machine statistics:', error)
        this.error = error.response?.data?.message || 'Failed to fetch statistics'
        throw error
      }
    },

    async fetchPendingReadings() {
      try {
        const response = await axios.get(`${API_URL}/machines/pending-readings`)

        if (response.data.success) {
          return response.data.data
        }
        return []
      } catch (error) {
        console.error('Error fetching pending readings:', error)
        this.error = error.response?.data?.message || 'Failed to fetch pending readings'
        throw error
      }
    },

    /* ==================================================================
     |  WRITE ACTIONS — NO auto refetch. Local state is patched in place.
     |  Caller receives the raw API response and shows the success toast.
     * ================================================================== */

    /**
     * Create a new machine.
     * Supports plain JSON or FormData (with files).
     * On success, inserts the created machine into the local `machines` array.
     */
    async createMachine(machineData) {
      try {
        const isFormData = machineData instanceof FormData
        const hasFiles = !isFormData && containsFiles(machineData)

        let payload = machineData
        let config = {}

        if (hasFiles) {
          payload = buildFormData(machineData)
          config.headers = { 'Content-Type': 'multipart/form-data' }
        } else if (isFormData) {
          config.headers = { 'Content-Type': 'multipart/form-data' }
        }

        const response = await axios.post(`${API_URL}/machines`, payload, config)

        // Patch local list in place — no refetch
        if (response.data?.success && response.data?.data) {
          const created = response.data.data
          if (created?.id) {
            const idx = this.machines.findIndex((m) => m.id === created.id)
            if (idx === -1) this.machines.unshift(created)
            else this.machines.splice(idx, 1, created)
          }
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create machine'
        throw error
      }
    },

    /**
     * Update an existing machine.
     * Multipart updates use POST + _method=PUT (Laravel method spoofing).
     * On success, replaces the record in `machines` and, if applicable, `currentMachine`.
     */
    async updateMachine(id, machineData) {
      try {
        const isFormData = machineData instanceof FormData
        const hasFiles = !isFormData && containsFiles(machineData)

        let payload = machineData
        let config = {}
        let isMultipart = false

        if (hasFiles) {
          payload = buildFormData(machineData, 'PUT')
          config.headers = { 'Content-Type': 'multipart/form-data' }
          isMultipart = true
        } else if (isFormData) {
          config.headers = { 'Content-Type': 'multipart/form-data' }
          isMultipart = true
        }

        const response = isMultipart
          ? await axios.post(`${API_URL}/machines/${id}`, payload, config)
          : await axios.put(`${API_URL}/machines/${id}`, payload, config)

        // Patch local state — no refetch
        if (response.data?.success && response.data?.data) {
          const updated = response.data.data
          if (updated?.id) {
            const idx = this.machines.findIndex((m) => m.id === updated.id)
            if (idx !== -1) this.machines.splice(idx, 1, updated)
          }
          if (this.currentMachine?.id === id) {
            this.currentMachine = updated
          }
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update machine'
        throw error
      }
    },

    /**
     * Update only the status field.
     * Returns the API response; caller shows the toast.
     */
    async updateMachineStatus(id, status) {
      return this.updateMachine(id, { status })
    },

    /**
     * Delete a single machine.
     * On success, removes it from the local `machines` array.
     */
    async deleteMachine(id) {
      try {
        const response = await axios.delete(`${API_URL}/machines/${id}`)

        if (response.data?.success) {
          this.machines = this.machines.filter((m) => m.id !== id)
          if (this.currentMachine?.id === id) this.currentMachine = null
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete machine'
        throw error
      }
    },

    /**
     * Bulk delete machines.
     * On success, removes them from the local `machines` array.
     */
    async bulkDeleteMachines(ids = []) {
      try {
        const response = await axios.post(`${API_URL}/machines/bulk-delete`, { ids })

        if (response.data?.success) {
          const set = new Set(ids)
          this.machines = this.machines.filter((m) => !set.has(m.id))
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Bulk delete failed'
        throw error
      }
    },

    /**
     * Export machines to CSV/Excel — triggers a browser download.
     * Does not touch store state.
     */
    async exportMachines(filters = {}) {
      try {
        const response = await axios.get(`${API_URL}/machines/export`, {
          params: filters,
          responseType: 'blob',
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'machines_export.csv'
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

    /**
     * Import machines from a file.
     * Does not touch store state — caller decides whether to refresh.
     */
    async importMachines(file) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post(`${API_URL}/machines/import`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Import failed'
        throw error
      }
    },

    /**
     * Clear everything (e.g., on logout).
     */
    clearAllData() {
      this.machines = []
      this.currentMachine = null
      this.loading = false
      this.error = null
      this.statistics = {
        total: 0,
        active: 0,
        maintenance: 0,
        inactive: 0,
        total_collections: 0,
        pending_readings: 0,
      }
      this.summary = {
        total_machines: 0,
        active_machines: 0,
        total_collections: 0,
        pending_readings: 0,
      }
    },
  },
})
