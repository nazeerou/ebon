<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Check if already logged in
onMounted(() => {
  if (authStore.isAuthenticated) {
    const redirectPath = route.query.redirect || '/dashboard'
    router.push(redirectPath)
  }
})

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const errors = ref({})
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const debugInfo = ref('')
const isDev = ref(import.meta.env.DEV || true) // Show debug in development

const handleLogin = async () => {
  loading.value = true
  errors.value = {}
  error.value = ''
  debugInfo.value = ''

  try {
    console.log('=== LOGIN ATTEMPT ===')
    // console.log('Email:', form.email)
    console.log('API URL:', import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1')

    // Call login - it returns { success, error } not throws
    const result = await authStore.login(form)

    console.log('Login result:', result)

    if (result.success) {
      // Redirect to dashboard on success
      router.push('/dashboard')
    } else {
      // Show error from store
      error.value = result.error || 'Login failed'

      // For debugging - show full response
      if (result.debug) {
        debugInfo.value = JSON.stringify(result.debug, null, 2)
      }
    }
  } catch (err) {
    // This should not happen if login handles errors properly
    console.log('=== UNEXPECTED ERROR ===')
    console.log('Error:', err)
    console.log('Response:', err.response)
    console.log('Status:', err.response?.status)
    console.log('Data:', err.response?.data)

    debugInfo.value = JSON.stringify(
      {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
      },
      null,
      2,
    )

    // Handle different error scenarios
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
      error.value = err.response.data.message || 'Validation error. Please check your input.'
    } else if (err.response?.status === 401) {
      error.value = 'Email au nywila si sahihi.'
    } else if (err.response?.status === 403) {
      error.value = 'Akaunti yako imezimwa. Wasiliana na msimamizi.'
    } else if (err.response?.status === 404) {
      error.value = `Seva haipatikani (404). Tafadhali hakikisha URL ya API ni sahihi.`
    } else if (err.code === 'ERR_NETWORK') {
      error.value =
        'Haiwezi kuunganishwa na seva. Hakikisha:\n' +
        '✓ Seva ya backend imewashwa\n' +
        '✓ URL ya API ni sahihi\n' +
        '✓ CORS imesanidiwa vizuri'
    } else {
      error.value =
        err.response?.data?.message || err.message || 'Hitilafu ya kuingia. Tafadhali jaribu tena.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-container">
          <img src="/assets/images/ebas_game.png" alt="eBAS GameZone" class="logo" />
        </div>
        <p class="welcome-text">Ingia kwenye mfumo</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <!-- Debug Info (only show in development) -->
        <div v-if="debugInfo && isDev" class="alert alert-info">
          <strong>Debug Info:</strong>
          <pre style="font-size: 11px; overflow: auto; max-height: 200px; margin-top: 8px">{{
            debugInfo
          }}</pre>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          <span style="white-space: pre-line">{{ error }}</span>
        </div>

        <div class="form-group">
          <label for="email">
            <i class="fas fa-envelope"></i>
            Barua pepe
          </label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            class="form-control"
            :class="{ 'is-invalid': errors.email }"
            placeholder="Weka barua pepe yako"
            required
            autocomplete="email"
          />
          <span v-if="errors.email" class="error-text">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.email[0] || errors.email }}
          </span>
        </div>

        <div class="form-group">
          <label for="password">
            <i class="fas fa-lock"></i>
            Nywila
          </label>
          <div class="password-input">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="form.password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              placeholder="Weka nywila yako"
              required
              autocomplete="current-password"
            />
            <button type="button" @click="showPassword = !showPassword" class="password-toggle">
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <span v-if="errors.password" class="error-text">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.password[0] || errors.password }}
          </span>
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.remember" />
            <span class="checkmark"></span>
            <span>Nikumbuke</span>
          </label>
          <router-link to="/forgot-password" class="forgot-link"> Umesahau nywila? </router-link>
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else> Ingia <i class="fas fa-arrow-right"></i> </span>
        </button>
      </form>

      <div class="login-footer">
        <p>© 2026 eBAS GameZone. Haki zote zimehifadhiwa.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Debug alert style */
.alert-info {
  background: #e3f2fd;
  color: #0c5460;
  border: 1px solid #bee5eb;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 5px;
  font-family: monospace;
  max-height: 250px;
  overflow: auto;
}

.alert-info strong {
  display: block;
  margin-bottom: 5px;
}

/* Keep all your existing styles below */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  /* background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); */
  padding: 10px;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  /* background: rgba(255, 255, 255, 0.05); */
  transform: rotate(45deg);
  top: -50%;
  left: -50%;
  z-index: 0;
}

.login-box {
  background: white;
  /* border-radius: 10px; */
  /* box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); */
  width: 100%;
  max-width: 400px;
  padding: 45px 40px;
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 25px;
}

.logo-container {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
}

.logo {
  max-width: 280px;
  max-height: 260px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.welcome-text {
  color: #666;
  font-size: 16px;
  margin: 0;
  position: relative;
  display: inline-block;
  padding: 0 20px;
}

.welcome-text::before,
.welcome-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30px;
  height: 1px;
  background: #ddd;
}

.welcome-text::before {
  left: -20px;
}

.welcome-text::after {
  right: -20px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.form-group label i {
  color: #1e3c72;
  font-size: 14px;
  width: 30px;
}

.form-control {
  width: 93%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  background: #f8fafc;
}

.form-control:focus {
  border-color: #1e3c72;
  outline: none;
  box-shadow: 0 0 0 4px rgba(30, 60, 114, 0.1);
  background: white;
}

.form-control.is-invalid {
  border-color: #dc3545;
  background: #fff8f8;
}

.form-control::placeholder {
  color: #a0aec0;
  font-size: 13px;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.password-toggle:hover {
  color: #1e3c72;
}

.error-text {
  color: #dc3545;
  font-size: 12px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  padding-left: 25px;
  user-select: none;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: #f8fafc;
  border: 2px solid #eef2f6;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-label:hover input ~ .checkmark {
  background-color: #eef2f6;
}

.checkbox-label input:checked ~ .checkmark {
  background-color: #1e3c72;
  border-color: #1e3c72;
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.checkbox-label input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-label .checkmark:after {
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.forgot-link {
  color: #1e3c72;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s;
}

.forgot-link:hover {
  color: #2a5298;
  text-decoration: underline;
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(30, 60, 114, 0.3);
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(30, 60, 114, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 25px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
}

.alert-danger {
  background: #fee;
  color: #dc3545;
  border: 1px solid #fcc;
}

.alert-danger i {
  font-size: 18px;
  margin-top: 2px;
}

.login-footer {
  margin-top: 35px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .login-box {
    padding: 30px 25px;
  }

  .logo {
    max-width: 140px;
  }

  .welcome-text {
    font-size: 14px;
  }

  .welcome-text::before,
  .welcome-text::after {
    width: 20px;
  }
}
</style>
