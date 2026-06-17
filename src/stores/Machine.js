// stores/machineStore.js
import { defineStore } from 'pinia'
import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

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
    totalCollections: (state) => {
      return state.machines.reduce((sum, m) => sum + (parseFloat(m.total_collections) || 0), 0)
    },
  },

  actions: {
    // Fetch machines with pagination, filters, sorting
    async fetchMachines(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/machines`, { params })

        if (response.data.success) {
          this.machines = response.data.data.data || response.data.data || []
          if (response.data.data.current_page !== undefined) {
            // You may store pagination separately if needed
          }
          return response.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch machines'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch a single machine by ID
    async fetchMachine(id) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/machines/${id}`)

        if (response.data.success) {
          this.currentMachine = response.data.data
          return response.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch machine'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch dashboard statistics (summarized numbers)
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

    // Fetch machines that have no reading today (pending readings)
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

    // Create a new machine
    async createMachine(machineData) {
      try {
        const response = await axios.post(`${API_URL}/machines`, machineData)

        if (response.data.success) {
          await this.fetchMachines() // refresh list
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create machine'
        throw error
      }
    },

    // Update an existing machine
    async updateMachine(id, machineData) {
      try {
        const response = await axios.put(`${API_URL}/machines/${id}`, machineData)

        if (response.data.success) {
          await this.fetchMachines()
          if (this.currentMachine?.id === id) await this.fetchMachine(id)
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update machine'
        throw error
      }
    },

    // Update only machine status
    async updateMachineStatus(id, status) {
      return this.updateMachine(id, { status })
    },

    // Delete a machine
    async deleteMachine(id) {
      try {
        const response = await axios.delete(`${API_URL}/machines/${id}`)

        if (response.data.success) {
          await this.fetchMachines()
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete machine'
        throw error
      }
    },

    // Bulk delete machines
    async bulkDeleteMachines(ids) {
      try {
        const response = await axios.post(`${API_URL}/machines/bulk-delete`, { ids })

        if (response.data.success) {
          await this.fetchMachines()
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Bulk delete failed'
        throw error
      }
    },

    // Export machines to CSV/Excel
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

    // Import machines from file
    async importMachines(file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await axios.post(`${API_URL}/machines/import`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          await this.fetchMachines()
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Import failed'
        throw error
      }
    },

    // Clear all data (e.g., on logout)
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
