// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  // Initialize from localStorage but we'll validate with database
  const token = ref(localStorage.getItem('token'))
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const permissions = ref([])
  const loading = ref(false)
  const isRefreshing = ref(false)
  const isInitialized = ref(false)

  // Inactivity timer
  let inactivityTimer = null
  const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 minutes in milliseconds
  const lastActivity = ref(Date.now())

  // Debug logging function
  const debugLog = (message, data = {}) => {
    console.log(`[AUTH DEBUG] ${message}`, {
      timestamp: new Date().toISOString(),
      hasToken: !!token.value,
      hasUser: !!user.value,
      isRefreshing: isRefreshing.value,
      isInitialized: isInitialized.value,
      ...data,
    })
  }

  // Configure axios for Laravel API
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true, // Important for Laravel Sanctum/Session
    timeout: 30000,
  })

  // Set authorization header if token exists
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // For non-login requests, ensure token is present
      if (config.url !== '/login' && config.url !== '/refresh-token') {
        const currentToken = token.value
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`
        }
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  // Response interceptor with token refresh for Laravel
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // Don't retry login requests or refresh requests
      if (originalRequest?.url === '/login' || originalRequest?.url === '/refresh-token') {
        return Promise.reject(error)
      }

      // If error is 401 (Unauthorized) and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest?._retry) {
        debugLog('401 received', { url: originalRequest?.url })

        // Prevent multiple refresh attempts
        if (isRefreshing.value) {
          return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (!isRefreshing.value) {
                clearInterval(checkInterval)
                if (token.value) {
                  originalRequest.headers['Authorization'] = `Bearer ${token.value}`
                  resolve(api(originalRequest))
                } else {
                  reject(new Error('Refresh failed'))
                }
              }
            }, 100)
          })
        }

        originalRequest._retry = true
        isRefreshing.value = true

        try {
          // Attempt to refresh token using Laravel refresh endpoint
          debugLog('Refreshing token')

          // Laravel Sanctum/Passport typically uses POST for refresh
          const response = await api.post('/refresh-token')
          const responseData = response.data

          let newToken = null
          // Handle different Laravel response formats
          if (responseData.data?.token) {
            newToken = responseData.data.token
          } else if (responseData.token) {
            newToken = responseData.token
          } else if (responseData.access_token) {
            newToken = responseData.access_token
          } else {
            throw new Error('Invalid refresh response format')
          }

          token.value = newToken
          localStorage.setItem('token', newToken)
          localStorage.setItem('login_time', Date.now().toString())
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

          originalRequest.headers['Authorization'] = `Bearer ${newToken}`
          isRefreshing.value = false
          return api(originalRequest)
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          isRefreshing.value = false

          // If refresh fails, clear auth and redirect to login
          clearAuth()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }
      }

      return Promise.reject(error)
    },
  )

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    lastActivity.value = Date.now()

    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }

    if (isAuthenticated.value) {
      inactivityTimer = setTimeout(() => {
        const inactiveTime = Date.now() - lastActivity.value
        if (inactiveTime >= INACTIVITY_LIMIT) {
          console.log('Inactivity timeout reached')
          // Auto logout on inactivity
          logout()
        }
      }, INACTIVITY_LIMIT)
    }
  }

  // Track user activity
  const trackActivity = () => {
    if (isAuthenticated.value) {
      resetInactivityTimer()
    }
  }

  // Setup activity listeners
  const setupActivityTracking = () => {
    if (typeof window !== 'undefined') {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
      events.forEach((event) => {
        window.addEventListener(event, trackActivity)
      })
      resetInactivityTimer()
    }
  }

  // Clear activity tracking
  const clearActivityTracking = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }
    if (typeof window !== 'undefined') {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
      events.forEach((event) => {
        window.removeEventListener(event, trackActivity)
      })
    }
  }

  // Login method for Laravel
  const login = async (credentials) => {
    loading.value = true
    try {
      // Laravel typically expects email and password
      const response = await api.post('/login', credentials)
      const responseData = response.data

      let userData = null
      let tokenData = null

      // Handle different Laravel response formats (Sanctum, Passport, JWT)
      if (responseData.data?.token) {
        tokenData = responseData.data.token
        userData = responseData.data.user
      } else if (responseData.token) {
        tokenData = responseData.token
        userData = responseData.user
      } else if (responseData.access_token) {
        tokenData = responseData.access_token
        userData = responseData.user || responseData.data
      } else if (responseData.data?.access_token) {
        tokenData = responseData.data.access_token
        userData = responseData.data.user
      } else {
        throw new Error('Invalid response format')
      }

      // Extract permissions if they exist
      if (userData?.permissions) {
        permissions.value = userData.permissions
      }

      // Store token and user
      token.value = tokenData
      user.value = userData

      // Store in localStorage for persistence
      localStorage.setItem('token', tokenData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('login_time', Date.now().toString())

      // Set default header
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`

      debugLog('Login successful', { token: tokenData?.substring(0, 10) + '...' })

      // Setup activity tracking
      setTimeout(() => {
        setupActivityTracking()
      }, 100)

      return responseData
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Refresh token for Laravel
  const refreshToken = async () => {
    const currentToken = token.value
    if (!currentToken) {
      throw new Error('No token to refresh')
    }

    try {
      debugLog('Refreshing token manually')

      // Laravel refresh endpoint (might be POST)
      const response = await api.post('/refresh-token')
      const responseData = response.data

      let newToken = null
      if (responseData.data?.token) {
        newToken = responseData.data.token
      } else if (responseData.token) {
        newToken = responseData.token
      } else if (responseData.access_token) {
        newToken = responseData.access_token
      } else {
        throw new Error('Invalid refresh response format')
      }

      token.value = newToken
      localStorage.setItem('token', newToken)
      localStorage.setItem('login_time', Date.now().toString())
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

      // Reset activity on token refresh
      resetInactivityTimer()

      return newToken
    } catch (error) {
      console.error('Refresh token error:', error)
      throw error
    }
  }

  // Logout method for Laravel
  const logout = async () => {
    debugLog('Logout called', { reason: 'manual logout' })

    try {
      const currentToken = token.value
      if (currentToken) {
        // Laravel logout endpoint (might be POST)
        await api.post('/logout').catch(() => {})
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      clearActivityTracking()

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  // Clear auth data
  const clearAuth = () => {
    debugLog('Clearing auth')
    token.value = null
    user.value = null
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('login_time')
    delete api.defaults.headers.common['Authorization']
  }

  // Fetch current user from Laravel API
  const fetchUser = async () => {
    const currentToken = token.value
    if (!currentToken) {
      throw new Error('No token')
    }

    try {
      // Laravel user endpoint
      const response = await api.get('/user')

      // Handle different response formats
      const userData = response.data.data?.user || response.data.user || response.data

      user.value = userData

      // Extract permissions if they exist
      if (userData.permissions) {
        permissions.value = userData.permissions
      }

      localStorage.setItem('user', JSON.stringify(userData))

      return userData
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('User fetch returned 401')
        clearAuth()
      }
      throw error
    }
  }

  // Verify token with Laravel database
  const verifyTokenWithDatabase = async () => {
    if (!token.value) return false

    try {
      debugLog('Verifying token with database')

      // Call Laravel endpoint to verify token
      const response = await api.get('/verify-token').catch(() => null)

      if (response && response.status === 200) {
        console.log('✅ Token verified in database')

        // Update user data if returned
        if (response.data.user) {
          user.value = response.data.user
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }

        return true
      }
      return false
    } catch (error) {
      console.log('❌ Token verification failed:', error.message)
      return false
    }
  }

  // Check authentication with Laravel validation
  const checkAuth = async () => {
    console.log('checkAuth called', {
      hasToken: !!token.value,
      hasLocalToken: !!localStorage.getItem('token'),
      hasUser: !!user.value,
      hasLocalUser: !!localStorage.getItem('user'),
    })

    // Restore from localStorage if needed
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token.value && storedToken) {
      console.log('Restoring token from localStorage')
      token.value = storedToken
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }

    if (!user.value && storedUser) {
      try {
        console.log('Restoring user from localStorage')
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }

    // If no token at all, not authenticated
    if (!token.value && !storedToken) {
      console.log('No token found')
      return false
    }

    // Verify token with Laravel database
    const isValid = await verifyTokenWithDatabase()

    if (!isValid) {
      console.log('❌ Token invalid in database')
      clearAuth()
      return false
    }

    // If we have user data, consider authenticated
    if (user.value) {
      console.log('User found, setting up tracking')
      setupActivityTracking()
      return true
    }

    // Try to fetch user to validate token
    try {
      console.log('Fetching user to validate token')
      await fetchUser()
      setupActivityTracking()
      return true
    } catch (error) {
      console.log('Token validation failed:', error.message)
      clearAuth()
      return false
    }
  }

  // Initialize auth state with Laravel
  const initAuth = async () => {
    debugLog('Initializing auth')

    // Restore from localStorage
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken) {
      token.value = storedToken
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }

    // Validate with database
    const isValid = await checkAuth()
    isInitialized.value = true

    return isValid
  }

  // Computed
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
  })

  const userRole = computed(() => user.value?.role || user.value?.roles?.[0] || null)
  const userName = computed(() => user.value?.name || user.value?.email || 'Guest')

  return {
    user,
    token,
    permissions,
    loading,
    isAuthenticated,
    userRole,
    userName,
    isInitialized,
    login,
    logout,
    refreshToken,
    fetchUser,
    checkAuth,
    initAuth,
    trackActivity,
    verifyTokenWithDatabase,
    api,
  }
})
