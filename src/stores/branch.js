// stores/branchStore.js
import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
// const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

export const useBranchStore = defineStore('branch', {
  state: () => ({
    branches: [],
    currentBranch: null,
    loading: false,
    error: null,
    statistics: {
      total: 0,
      active: 0,
      inactive: 0,
    },
    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: 10,
      total: 0,
    },
  }),

  getters: {
    // Basic getters
    totalBranches: (state) => state.statistics.total,
    activeBranches: (state) => state.statistics.active,
    inactiveBranches: (state) => state.statistics.inactive,

    // Current branch details
    currentBranchName: (state) => state.currentBranch?.branch_name || 'Tawi Kuu',
    currentBranchRegion: (state) => state.currentBranch?.region || '',
    currentBranchPhone: (state) => state.currentBranch?.phone || '',

    // Get branch by ID
    getBranchById: (state) => (id) => {
      return state.branches.find((branch) => branch.id === id)
    },
  },

  actions: {
    // Fetch branches with optional filters (search, status, pagination)
    async fetchBranches(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/branches`, { params })

        if (response.data.success) {
          // Handle paginated response
          const data = response.data.data
          if (data.data && Array.isArray(data.data)) {
            this.branches = data.data
            this.pagination = {
              currentPage: data.current_page,
              lastPage: data.last_page,
              perPage: data.per_page,
              total: data.total,
            }
          } else if (Array.isArray(data)) {
            this.branches = data
          } else {
            this.branches = []
          }

          // Update statistics
          await this.fetchStatistics()

          // Restore current branch if needed
          const savedBranchId = localStorage.getItem('selectedBranch')
          if (savedBranchId && !this.currentBranch) {
            const savedBranch = this.branches.find((b) => b.id === parseInt(savedBranchId))
            if (savedBranch) {
              this.currentBranch = savedBranch
            } else if (this.branches.length > 0) {
              this.setCurrentBranch(this.branches[0])
            }
          } else if (this.branches.length > 0 && !this.currentBranch) {
            this.setCurrentBranch(this.branches[0])
          }

          return response.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch branches'
        console.error('fetchBranches error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch branch statistics (total, active, inactive)
    async fetchStatistics() {
      try {
        const response = await axios.get(`${API_URL}/branches/statistics`)
        if (response.data.success) {
          this.statistics = response.data.data
          return this.statistics
        }
        return null
      } catch (error) {
        console.error('Error fetching branch statistics:', error)
        // Fallback: calculate from local branches
        this.statistics = {
          total: this.branches.length,
          active: this.branches.filter((b) => b.status === 'active').length,
          inactive: this.branches.filter((b) => b.status === 'inactive').length,
        }
        return this.statistics
      }
    },

    // Fetch a single branch by ID
    async fetchBranch(id) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/branches/${id}`)
        if (response.data.success) {
          const branch = response.data.data
          // Optionally update current branch if it matches
          if (this.currentBranch?.id === branch.id) {
            this.currentBranch = branch
          }
          return branch
        }
        return null
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch branch'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create a new branch
    async createBranch(branchData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post(`${API_URL}/branches`, branchData)
        if (response.data.success) {
          await this.fetchBranches()
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create branch'
        console.error('createBranch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update an existing branch
    async updateBranch(id, branchData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.put(`${API_URL}/branches/${id}`, branchData)
        if (response.data.success) {
          await this.fetchBranches()
          // If current branch was updated, refresh current branch
          if (this.currentBranch?.id === id) {
            await this.fetchBranch(id)
          }
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update branch'
        console.error('updateBranch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update branch status only (activate/inactivate)
    async updateBranchStatus(id, status) {
      return this.updateBranch(id, { status })
    },

    // Delete a branch
    async deleteBranch(id) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.delete(`${API_URL}/branches/${id}`)
        if (response.data.success) {
          await this.fetchBranches()
          await this.fetchStatistics()

          // If current branch was deleted, clear it
          if (this.currentBranch?.id === id) {
            if (this.branches.length > 0) {
              this.setCurrentBranch(this.branches[0])
            } else {
              this.clearCurrentBranch()
            }
          }
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete branch'
        console.error('deleteBranch error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Set current branch (selected branch)
    setCurrentBranch(branch) {
      this.currentBranch = branch
      if (branch && branch.id) {
        localStorage.setItem('selectedBranch', branch.id)
      } else {
        localStorage.removeItem('selectedBranch')
      }
    },

    // Clear current branch selection
    clearCurrentBranch() {
      this.currentBranch = null
      localStorage.removeItem('selectedBranch')
    },

    // Export branches to CSV/Excel
    async exportBranches(filters = {}) {
      try {
        const response = await axios.get(`${API_URL}/branches/export`, {
          params: filters,
          responseType: 'blob',
        })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        const contentDisposition = response.headers['content-disposition']
        let filename = 'branches_export.csv'
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

    // Import branches from file
    async importBranches(file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await axios.post(`${API_URL}/branches/import`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (response.data.success) {
          await this.fetchBranches()
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Import failed'
        throw error
      }
    },

    // Clear all data (on logout)
    clearAllData() {
      this.branches = []
      this.currentBranch = null
      this.loading = false
      this.error = null
      this.statistics = { total: 0, active: 0, inactive: 0 }
      this.pagination = { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }
      localStorage.removeItem('selectedBranch')
    },
  },
})
