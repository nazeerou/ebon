import { defineStore } from 'pinia'
import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    currentUser: null,
    loading: false,
    error: null,
    isOnline: navigator.onLine,
  }),

  getters: {
    totalUsers: (state) => state.users.length,
    activeUsers: (state) => state.users.filter((u) => u.status === 'active').length,
    adminUsers: (state) => state.users.filter((u) => u.role === 'admin').length,
  },

  actions: {
    async init() {
      if (this.isOnline) {
        await this.fetchUsers()
      }

      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    },

    handleOnline() {
      this.isOnline = true
      this.fetchUsers()
    },

    handleOffline() {
      this.isOnline = false
      this.error = 'You are offline. Please check your internet connection.'
    },

    async fetchUsers(params = {}) {
      if (!this.isOnline) {
        this.error = 'No internet connection. Please connect to the internet.'
        throw new Error('No internet connection')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/users`, { params })

        if (response.data.success) {
          this.users = response.data.data.data || response.data.data || []

          return {
            success: true,
            data: response.data.data,
          }
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch users'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchUser(id) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot fetch user details.')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/users/${id}`)

        if (response.data.success) {
          this.currentUser = response.data.data
          return this.currentUser
        }

        throw new Error('User not found')
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch user'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createUser(formData) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot create user.')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.post(`${API_URL}/users`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          await this.fetchUsers()
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create user'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateUser(id, formData) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot update user.')
      }

      this.loading = true
      this.error = null

      try {
        formData.append('_method', 'PUT')
        const response = await axios.post(`${API_URL}/users/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          await this.fetchUsers()
          if (this.currentUser?.id === id) {
            this.currentUser = response.data.data
          }
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update user'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateUserStatus(id, status) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot update user status.')
      }

      try {
        const response = await axios.put(`${API_URL}/users/${id}/status`, { status })

        if (response.data.success) {
          // Update user in the list
          const index = this.users.findIndex((u) => u.id === id)
          if (index !== -1) {
            this.users[index].status = status
          }

          if (this.currentUser?.id === id) {
            this.currentUser.status = status
          }
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update user status'
        throw error
      }
    },

    async resetPassword(id, password) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot reset password.')
      }

      try {
        const response = await axios.post(`${API_URL}/users/${id}/reset-password`, { password })

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to reset password'
        throw error
      }
    },

    async deleteUser(id) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot delete user.')
      }

      try {
        const response = await axios.delete(`${API_URL}/users/${id}`)

        if (response.data.success || response.data.status === 'success') {
          // Remove from local users array
          this.users = this.users.filter((u) => u.id !== id)

          if (this.currentUser?.id === id) {
            this.currentUser = null
          }

          return response.data
        }

        throw new Error(response.data.message || 'Failed to delete user')
      } catch (error) {
        console.error('Delete user error:', error)

        let errorMessage = 'Failed to delete user'

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }

        if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to delete this user'
        } else if (error.response?.status === 404) {
          errorMessage = 'User not found'
        }

        const customError = new Error(errorMessage)
        customError.response = error.response
        throw customError
      }
    },

    async assignRole(userId, role) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot assign role.')
      }

      try {
        const response = await axios.put(`${API_URL}/users/${userId}/role`, { role })

        if (response.data.success) {
          // Update user in the list
          const index = this.users.findIndex((u) => u.id === userId)
          if (index !== -1) {
            this.users[index].role = role
          }

          if (this.currentUser?.id === userId) {
            this.currentUser.role = role
          }
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to assign role'
        throw error
      }
    },

    async getCurrentUser() {
      if (!this.isOnline) {
        throw new Error('No internet connection.')
      }

      try {
        const response = await axios.get(`${API_URL}/users/me`)

        if (response.data.success) {
          this.currentUser = response.data.data
          return this.currentUser
        }

        throw new Error('Failed to get current user')
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get current user'
        throw error
      }
    },

    async updateProfile(formData) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot update profile.')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.post(`${API_URL}/users/profile`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          if (this.currentUser) {
            this.currentUser = response.data.data
          }
          await this.fetchUsers()
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update profile'
        throw error
      } finally {
        this.loading = false
      }
    },

    async exportUsers(filters = {}) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot export users.')
      }

      try {
        const response = await axios.get(`${API_URL}/users/export`, {
          params: filters,
          responseType: 'blob',
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to export users'
        throw error
      }
    },

    async importUsers(file) {
      if (!this.isOnline) {
        throw new Error('No internet connection. Cannot import users.')
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await axios.post(`${API_URL}/users/import`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          await this.fetchUsers()
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to import users'
        throw error
      }
    },

    async getPermissions() {
      if (!this.isOnline) {
        throw new Error('No internet connection.')
      }

      try {
        const response = await axios.get(`${API_URL}/users/permissions`)

        if (response.data.success) {
          return response.data.data
        }

        throw new Error('Failed to get permissions')
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get permissions'
        throw error
      }
    },

    cleanup() {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    },
  },
})
