import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

// const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [],
    currentCustomer: null,
    loading: false,
    error: null,
    isOnline: navigator.onLine,
  }),

  getters: {
    totalCustomers: (state) => state.customers.length,
  },

  actions: {
    async init() {
      // Just fetch customers if online
      if (this.isOnline) {
        await this.fetchCustomers()
      }

      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    },

    handleOnline() {
      this.isOnline = true
      // Refresh data when coming back online
      this.fetchCustomers()
    },

    handleOffline() {
      this.isOnline = false
      this.error = 'You are offline. Please check your internet connection.'
    },

    async fetchCustomers(params = {}) {
      if (!this.isOnline) {
        this.error = 'No internet connection. Please connect to the internet.'
        throw new Error('No internet connection')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/customers`, { params })

        if (response.data.success) {
          // Store the customers
          this.customers = response.data.data.data || response.data.data || []

          // Return the full response with pagination
          return {
            success: true,
            data: response.data.data,
          }
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch customers'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCustomer(formData) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot create customer.')
      }

      try {
        const response = await axios.post(`${API_URL}/customers`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          await this.fetchCustomers()
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create customer'
        throw error
      }
    },

    async updateCustomer(id, formData) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot update customer.')
      }

      try {
        formData.append('_method', 'PUT')
        const response = await axios.post(`${API_URL}/customers/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          await this.fetchCustomers()
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update customer'
        throw error
      }
    },

    async deleteCustomer(id) {
      console.log('Deleting customer with ID:', id)

      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot delete customer.')
      }

      try {
        const response = await axios.delete(`${API_URL}/customers/${id}`)

        if (response.data.success || response.data.status === 'success') {
          // Remove from local customers array
          this.customers = this.customers.filter((c) => c.id !== id)

          console.log('Customer deleted successfully')
          return response.data
        }

        throw new Error(response.data.message || 'Failed to delete customer')
      } catch (error) {
        console.error('Delete customer error:', error)

        // Extract error message from response
        let errorMessage = 'Failed to delete customer'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }

        // Handle specific status codes
        if (error.response?.status === 409) {
          errorMessage = 'Cannot delete customer with active loans'
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to delete this customer'
        } else if (error.response?.status === 404) {
          errorMessage = 'Customer not found'
        }

        const customError = new Error(errorMessage)
        customError.response = error.response
        throw customError
      }
    },

    async fetchCustomer(id) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch customer details.')
      }

      try {
        const response = await axios.get(`${API_URL}/customers/${id}`)

        if (response.data.success) {
          this.currentCustomer = response.data.data
          return this.currentCustomer
        }

        throw new Error('Customer not found')
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch customer'
        throw error
      }
    },

    cleanup() {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    },
  },
})
