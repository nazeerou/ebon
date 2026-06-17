// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Base URL
  // const baseURL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'
  const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

  // Configure axios
  const api = axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true,
    timeout: 30000,
  })

  // Add token to requests if exists
  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // Initialize auth from localStorage
  const initAuth = () => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')

    if (token && userData) {
      setAuthToken(token)
      isAuthenticated.value = true
      user.value = JSON.parse(userData)
      return true
    }
    return false
  }

  // Login
  const login = async (credentials) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.post('/login', credentials)

      // Login successful
      isAuthenticated.value = true

      // Store user data
      let userData = null
      if (response.data.data?.user) {
        userData = response.data.data.user
        user.value = userData
      } else if (response.data.user) {
        userData = response.data.user
        user.value = userData
      }

      // Store token if returned
      if (response.data.data?.token) {
        localStorage.setItem('auth_token', response.data.data.token)
        setAuthToken(response.data.data.token)
      } else if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
        setAuthToken(response.data.token)
      }

      // Store user data in localStorage
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData))
      }

      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      console.log(err.response)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Logout - API call version
  const logout = async (redirectToLogin = true) => {
    loading.value = true

    try {
      // Call logout API to invalidate token
      await api.post('/logout')
    } catch (err) {
      console.error('Logout API error:', err)
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('remember_token')

      // Clear axios auth header
      setAuthToken(null)

      // Clear state
      isAuthenticated.value = false
      user.value = null
      error.value = null

      loading.value = false

      // Redirect to login page and refresh
      if (redirectToLogin) {
        // Force page reload to clear all state
        window.location.href = '/login'
      }
    }
  }

  // Quick logout without API call (for offline or force logout)
  const forceLogout = (redirectToLogin = true) => {
    // Clear local storage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('remember_token')

    // Clear axios auth header
    setAuthToken(null)

    // Clear state
    isAuthenticated.value = false
    user.value = null
    error.value = null

    // Redirect to login page and refresh
    if (redirectToLogin) {
      window.location.href = '/login'
    }
  }

  // Check auth status with API
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('auth_token')

    if (!token) {
      isAuthenticated.value = false
      user.value = null
      return false
    }

    setAuthToken(token)

    try {
      const response = await api.get('/user')

      if (response.data) {
        isAuthenticated.value = true
        user.value = response.data.data || response.data
        localStorage.setItem('user_data', JSON.stringify(user.value))
        return true
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      // Token might be expired, clear it
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      setAuthToken(null)
      isAuthenticated.value = false
      user.value = null
      return false
    }

    return false
  }

  // Check auth (simple local check)
  const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    if (token && !isAuthenticated.value) {
      const userData = localStorage.getItem('user_data')
      if (userData) {
        user.value = JSON.parse(userData)
        isAuthenticated.value = true
        setAuthToken(token)
      }
    }
    return isAuthenticated.value
  }

  // Computed
  const userName = computed(() => {
    if (user.value?.first_name && user.value?.last_name) {
      return `${user.value.first_name} ${user.value.last_name}`
    }
    return user.value?.name || user.value?.email || 'User'
  })

  const userRole = computed(() => {
    const roles = {
      admin: 'Msimamizi',
      manager: 'Meneja',
      officer: 'Afisa Mikopo',
      cashier: 'Keshia',
      viewer: 'Mtazamaji',
    }
    return roles[user.value?.role] || user.value?.role || 'Mtumiaji'
  })

  const userAvatar = computed(() => {
    if (user.value?.avatar) return user.value.avatar
    if (user.value?.profile_photo_url) return user.value.profile_photo_url
    if (user.value?.first_name) {
      const name = `${user.value.first_name} ${user.value.last_name || ''}`
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3498db&color=fff&size=100`
    }
    return '/assets/images/avator_.png'
  })

  return {
    isAuthenticated,
    user,
    loading,
    error,
    userName,
    userRole,
    userAvatar,
    login,
    logout,
    forceLogout,
    checkAuth,
    checkAuthStatus,
    initAuth,
    setAuthToken,
  }
})
