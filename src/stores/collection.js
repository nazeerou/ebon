// stores/collection.js
import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
// const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

export const useCollectionStore = defineStore('collection', {
  state: () => ({
    collections: [],
    currentCollection: null,
    loading: false,
    error: null,
    statistics: {
      total: 0,
      total_amount: 0,
      auto_count: 0,
      manual_count: 0,
    },
    summary: {
      total_collections: 0,
      total_amount: 0,
    },
  }),

  getters: {
    totalCollections: (state) => state.collections.length,
    totalAmount: (state) => {
      return state.collections.reduce((sum, c) => sum + (parseFloat(c.amount_collected) || 0), 0)
    },
  },

  actions: {
    // Fetch collections with pagination, search, etc.
    async fetchCollections(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/collections`, { params })

        // Handle different response structures
        if (response.data.success) {
          // If API returns { success: true, data: { data: [...] } }
          this.collections = response.data.data.data || response.data.data || []
          if (response.data.data.current_page !== undefined) {
            // Pagination can be stored in component, not necessarily here
          }
          return response.data
        }
        // If API returns directly an object with data array (like your JSON)
        if (response.data.data && Array.isArray(response.data.data)) {
          this.collections = response.data.data
          return response.data
        }
        if (Array.isArray(response.data)) {
          this.collections = response.data
          return { data: response.data }
        }
        this.collections = []
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch collections'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch a single collection by ID
    async fetchCollection(id) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/collections/${id}`)

        if (response.data.success) {
          this.currentCollection = response.data.data
          return response.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch collection'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch statistics for collections (optional)
    async fetchStatistics() {
      try {
        const response = await axios.get(`${API_URL}/collections/statistics`)

        if (response.data.success) {
          this.statistics = response.data.data.statistics
          this.summary = response.data.data.summary
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('Error fetching collection statistics:', error)
        this.error = error.response?.data?.message || 'Failed to fetch statistics'
        throw error
      }
    },

    // Create a new collection (if needed)
    async createCollection(collectionData) {
      try {
        const response = await axios.post(`${API_URL}/collections`, collectionData)

        if (response.data.success) {
          await this.fetchCollections()
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create collection'
        throw error
      }
    },

    // Update an existing collection (if allowed)
    async updateCollection(id, collectionData) {
      try {
        const response = await axios.put(`${API_URL}/collections/${id}`, collectionData)

        if (response.data.success) {
          await this.fetchCollections()
          if (this.currentCollection?.id === id) await this.fetchCollection(id)
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update collection'
        throw error
      }
    },

    // Delete a single collection
    async deleteCollection(id) {
      try {
        const response = await axios.delete(`${API_URL}/collections/${id}`)

        if (response.data.success) {
          await this.fetchCollections()
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete collection'
        throw error
      }
    },

    // Bulk delete collections (optional, backend must support)
    async bulkDeleteCollections(ids) {
      try {
        const response = await axios.post(`${API_URL}/collections/bulk-delete`, { ids })

        if (response.data.success) {
          await this.fetchCollections()
          await this.fetchStatistics()
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Bulk delete failed'
        throw error
      }
    },

    // Export collections to CSV/Excel
    async exportCollections(filters = {}) {
      try {
        const response = await axios.get(`${API_URL}/collections/export`, {
          params: filters,
          responseType: 'blob',
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        const contentDisposition = response.headers['content-disposition']
        let filename = 'collections_export.csv'
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

    // Clear all data (on logout)
    clearAllData() {
      this.collections = []
      this.currentCollection = null
      this.loading = false
      this.error = null
      this.statistics = {
        total: 0,
        total_amount: 0,
        auto_count: 0,
        manual_count: 0,
      }
      this.summary = {
        total_collections: 0,
        total_amount: 0,
      }
    },
  },
})
