import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
// const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    currentUser: null,

    /* Pagination */
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,

    /* UI state */
    loading: false,
    submitting: false,
    error: null,
    isOnline: navigator.onLine,
  }),

  getters: {
    totalUsers: (state) => state.total || state.users.length,

    activeUsers: (state) =>
      state.users.filter((u) => u.is_active === true || u.status === 'active').length,

    inactiveUsers: (state) =>
      state.users.filter((u) => u.is_active === false || u.status === 'inactive').length,

    adminUsers: (state) => state.users.filter((u) => u.role === 'admin').length,

    managerUsers: (state) => state.users.filter((u) => u.role === 'manager').length,

    collectorUsers: (state) => state.users.filter((u) => u.role === 'collector').length,

    usersWithPhone: (state) => state.users.filter((u) => u.phone && String(u.phone).trim()).length,

    /** Pick a single user by id */
    userById: (state) => (id) => state.users.find((u) => u.id === id),

    /** Pagination helper */
    hasMorePages: (state) => state.currentPage < state.lastPage,
  },

  actions: {
    /* ---------------------------------------------------------- */
    /* Lifecycle                                                    */
    /* ---------------------------------------------------------- */
    async init() {
      if (this.isOnline) await this.fetchUsers()
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    },

    cleanup() {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    },

    handleOnline() {
      this.isOnline = true
      this.fetchUsers()
    },

    handleOffline() {
      this.isOnline = false
      this.error = 'You are offline. Please check your internet connection.'
    },

    /* ---------------------------------------------------------- */
    /* Helpers                                                      */
    /* ---------------------------------------------------------- */
    _buildFormData(payload = {}) {
      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return
        if (typeof value === 'boolean') {
          formData.append(key, value ? 1 : 0)
        } else {
          formData.append(key, value)
        }
      })
      return formData
    },

    _extractError(error, fallback = 'Request failed') {
      /* Prefer first validation error if present */
      const validationErrors = error?.response?.data?.errors
      if (validationErrors && typeof validationErrors === 'object') {
        const firstKey = Object.keys(validationErrors)[0]
        if (firstKey && Array.isArray(validationErrors[firstKey])) {
          return validationErrors[firstKey][0]
        }
      }

      return (
        error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
      )
    },

    /**
     * Normalize the API payload into a flat array of users.
     * Handles three shapes:
     *   1. { success, data: { items: [...] } }          ← new controller
     *   2. { success, data: { data: [...] } }           ← Laravel paginator
     *   3. { success, data: [...] }                     ← flat array
     */
    _extractUsers(responseData) {
      const raw = responseData?.data
      if (!raw) return { items: [], meta: null }

      /* Shape 1: { items: [...], current_page, ... } */
      if (Array.isArray(raw.items)) {
        return {
          items: raw.items,
          meta: {
            current_page: raw.current_page ?? 1,
            last_page: raw.last_page ?? 1,
            per_page: raw.per_page ?? raw.items.length,
            total: raw.total ?? raw.items.length,
          },
        }
      }

      /* Shape 2: { data: [...], current_page, ... } */
      if (Array.isArray(raw.data)) {
        return {
          items: raw.data,
          meta: {
            current_page: raw.current_page ?? 1,
            last_page: raw.last_page ?? 1,
            per_page: raw.per_page ?? raw.data.length,
            total: raw.total ?? raw.data.length,
          },
        }
      }

      /* Shape 3: [ ... ] */
      if (Array.isArray(raw)) {
        return {
          items: raw,
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: raw.length,
            total: raw.length,
          },
        }
      }

      return { items: [], meta: null }
    },

    /* ---------------------------------------------------------- */
    /* Read                                                         */
    /* ---------------------------------------------------------- */
    async fetchUsers(params = {}) {
      if (!this.isOnline) {
        this.error = 'No internet connection. Please connect to the internet.'
        throw new Error('No internet connection')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/users`, {
          params: {
            per_page: this.perPage,
            page: this.currentPage,
            ...params,
          },
        })

        if (response.data.success) {
          const { items, meta } = this._extractUsers(response.data)

          this.users = items

          if (meta) {
            this.currentPage = meta.current_page
            this.lastPage = meta.last_page
            this.perPage = meta.per_page
            this.total = meta.total
          } else {
            this.total = items.length
          }

          return { success: true, data: items, meta }
        }

        return response.data
      } catch (error) {
        this.error = this._extractError(error, 'Failed to fetch users')
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchUser(id) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot fetch user details.')

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
        this.error = this._extractError(error, 'Failed to fetch user')
        throw error
      } finally {
        this.loading = false
      }
    },

    /* ---------------------------------------------------------- */
    /* Pagination helper                                            */
    /* ---------------------------------------------------------- */
    async goToPage(page) {
      this.currentPage = page
      return this.fetchUsers({ page })
    },

    /* ---------------------------------------------------------- */
    /* Create                                                       */
    /* ---------------------------------------------------------- */
    async createUser(payload) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot create user.')

      this.submitting = true
      this.error = null

      try {
        const formData = this._buildFormData(payload)

        const response = await axios.post(`${API_URL}/users`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          /* Optimistic insert at top */
          if (response.data.data) {
            this.users = [response.data.data, ...this.users]
            this.total += 1
          }
          /* Refresh in background for consistency */
          this.fetchUsers().catch(() => {})
        }

        return response.data
      } catch (error) {
        this.error = this._extractError(error, 'Failed to create user')
        throw error
      } finally {
        this.submitting = false
      }
    },

    /* ---------------------------------------------------------- */
    /* Update                                                       */
    /* ---------------------------------------------------------- */
    async updateUser(id, payload) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot update user.')

      this.submitting = true
      this.error = null

      try {
        const formData = this._buildFormData(payload)
        formData.append('_method', 'PUT')

        const response = await axios.post(`${API_URL}/users/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          /* Update in place */
          const index = this.users.findIndex((u) => u.id === id)
          if (index !== -1 && response.data.data) {
            this.users[index] = response.data.data
          }
          if (this.currentUser?.id === id) this.currentUser = response.data.data
        }

        return response.data
      } catch (error) {
        this.error = this._extractError(error, 'Failed to update user')
        throw error
      } finally {
        this.submitting = false
      }
    },

    async updateUserStatus(id, value) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot update user status.')

      const isActive = typeof value === 'boolean' ? value : value === 'active'
      const status = isActive ? 'active' : 'inactive'

      try {
        const response = await axios.put(`${API_URL}/users/${id}/status`, {
          is_active: isActive,
        })

        if (response.data.success) {
          const index = this.users.findIndex((u) => u.id === id)
          if (index !== -1) {
            this.users[index].is_active = isActive
            this.users[index].status = status
          }
          if (this.currentUser?.id === id) {
            this.currentUser.is_active = isActive
            this.currentUser.status = status
          }
        }

        return response.data
      } catch (error) {
        this.error = this._extractError(error, 'Failed to update user status')
        throw error
      }
    },

    async resetPassword(id, password) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot reset password.')

      try {
        const response = await axios.post(`${API_URL}/users/${id}/reset-password`, {
          password,
          password_confirmation: password,
        })
        return response.data
      } catch (error) {
        this.error = this._extractError(error, 'Failed to reset password')
        throw error
      }
    },

    async assignRole(userId, role) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot assign role.')

      try {
        const response = await axios.put(`${API_URL}/users/${userId}/role`, { role })

        if (response.data.success) {
          const index = this.users.findIndex((u) => u.id === userId)
          if (index !== -1) this.users[index].role = role
          if (this.currentUser?.id === userId) this.currentUser.role = role
        }

        return response.data
      } catch (error) {
        this.error = this._extractError(error, 'Failed to assign role')
        throw error
      }
    },

    /* ---------------------------------------------------------- */
    /* Delete                                                       */
    /* ---------------------------------------------------------- */
    async deleteUser(id) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot delete user.')

      try {
        const response = await axios.delete(`${API_URL}/users/${id}`)

        if (response.data.success || response.data.status === 'success') {
          this.users = this.users.filter((u) => u.id !== id)
          this.total = Math.max(0, this.total - 1)
          if (this.currentUser?.id === id) this.currentUser = null
          return response.data
        }

        throw new Error(response.data.message || 'Failed to delete user')
      } catch (error) {
        const errorMessage = this._extractError(error, 'Failed to delete user')

        if (error.response?.status === 403)
          this.error = 'You do not have permission to delete this user'
        else if (error.response?.status === 404) this.error = 'User not found'
        else this.error = errorMessage

        const customError = new Error(this.error)
        customError.response = error.response
        throw customError
      }
    },

    /* ---------------------------------------------------------- */
    /* Profile                                                      */
    /* ---------------------------------------------------------- */
    async getCurrentUser() {
      if (!this.isOnline) throw new Error('No internet connection.')

      try {
        const response = await axios.get(`${API_URL}/users/me`)
        if (response.data.success) {
          this.currentUser = response.data.data
          return this.currentUser
        }
        throw new Error('Failed to get current user')
      } catch (error) {
        this.error = this._extractError(error, 'Failed to get current user')
        throw error
      }
    },

    async updateProfile(payload) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot update profile.')

      this.submitting = true
      this.error = null

      try {
        const formData = this._buildFormData(payload)

        const response = await axios.post(`${API_URL}/users/profile`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) {
          if (this.currentUser) this.currentUser = response.data.data
          await this.fetchUsers()
        }

        return response.data
      } catch (error) {
        this.error = this._extractError(error, 'Failed to update profile')
        throw error
      } finally {
        this.submitting = false
      }
    },

    /* ---------------------------------------------------------- */
    /* Import / Export                                              */
    /* ---------------------------------------------------------- */
    async exportUsers(filters = {}) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot export users.')

      try {
        const response = await axios.get(`${API_URL}/users/export`, {
          params: filters,
          responseType: 'blob',
        })

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
        this.error = this._extractError(error, 'Failed to export users')
        throw error
      }
    },

    async importUsers(file) {
      if (!this.isOnline) throw new Error('No internet connection. Cannot import users.')

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await axios.post(`${API_URL}/users/import`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        if (response.data.success) await this.fetchUsers()
        return response.data
      } catch (error) {
        this.error = this._extractError(error, 'Failed to import users')
        throw error
      }
    },

    async getPermissions() {
      if (!this.isOnline) throw new Error('No internet connection.')

      try {
        const response = await axios.get(`${API_URL}/users/permissions`)
        if (response.data.success) return response.data.data
        throw new Error('Failed to get permissions')
      } catch (error) {
        this.error = this._extractError(error, 'Failed to get permissions')
        throw error
      }
    },
  },
})
