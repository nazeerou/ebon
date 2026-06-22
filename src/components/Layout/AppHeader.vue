<template>
  <header class="navbar">
    <div class="navbar-left">
      <div class="page-title">
        <h2>{{ currentPageTitle }}</h2>
      </div>
    </div>

    <div class="navbar-right">
      <!-- Search Bar (desktop) -->
      <!-- <div class="search-bar" :class="{ expanded: searchExpanded }">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          v-model="searchQuery"
          @focus="searchExpanded = true"
          @blur="searchExpanded = false"
          @keyup.enter="performSearch"
          placeholder="Tafuta mashine..."
          class="search-input"
        />
      </div> -->

      <!-- Notifications -->
      <div class="notifications" ref="notificationRef">
        <!-- <button class="notification-btn" @click="toggleNotifications">
          <i class="fas fa-bell"></i>
          <span v-if="unreadNotifications" class="notification-badge">{{
            unreadNotifications
          }}</span>
        </button> -->

        <!-- Notifications Dropdown -->
        <div v-if="showNotifications" class="notifications-dropdown">
          <div class="dropdown-header">
            <h4>Arifa</h4>
            <button @click="markAllAsRead" class="mark-read-btn">Soma zote</button>
          </div>

          <div class="notifications-list">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon" :class="notification.type">
                <i :class="getNotificationIcon(notification.type)"></i>
              </div>
              <div class="notification-content">
                <p class="notification-text">{{ notification.message }}</p>
                <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
              </div>
            </div>

            <div v-if="notifications.length === 0" class="no-notifications">
              <i class="fas fa-check-circle"></i>
              <p>Hakuna arifa mpya</p>
            </div>
          </div>

          <div class="dropdown-footer">
            <router-link to="/notifications">Ona zote</router-link>
          </div>
        </div>
      </div>

      <!-- User Menu -->
      <div class="user-menu" ref="userMenuRef">
        <div class="user-info" @click="toggleUserMenu">
          <img :src="userAvatar" :alt="userDisplayName" class="user-avatar" />
          <div class="user-details" v-if="authStore.user">
            <span class="user-name">{{ userDisplayName }}</span>
            <span class="user-role">{{ userRole }}</span>
          </div>
          <div class="user-details" v-else>
            <span class="user-name">Mgeni</span>
            <span class="user-role">Mtumiaji</span>
          </div>
          <i class="fas fa-chevron-down"></i>
        </div>

        <!-- User Dropdown -->
        <div v-if="showUserMenu" class="user-dropdown">
          <template v-if="authStore.isAuthenticated">
            <router-link to="/profile" class="dropdown-item">
              <i class="fas fa-user-circle"></i>
              <span>Wasifu Wangu</span>
            </router-link>
            <router-link to="/settings" class="dropdown-item">
              <i class="fas fa-cog"></i>
              <span>Mipangilio</span>
            </router-link>
            <a href="#" @click.prevent="openChangePassword" class="dropdown-item">
              <i class="fas fa-key"></i>
              <span>Badilisha Neno la Siri</span>
            </a>
            <div class="dropdown-divider"></div>
            <router-link to="/help" class="dropdown-item">
              <i class="fas fa-question-circle"></i>
              <span>Msaada</span>
            </router-link>
            <button @click="logout" class="dropdown-item text-danger">
              <i class="fas fa-sign-out-alt"></i>
              <span>Toka kwenye Mfumo</span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Mobile Search Overlay -->
    <div class="mobile-search" v-if="showMobileSearch">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Tafuta..."
        class="mobile-search-input"
        @keyup.enter="performMobileSearch"
      />
      <button @click="closeMobileSearch" class="close-search">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click="closeChangePassword">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Badilisha Neno la Siri</h3>
          <button @click="closeChangePassword" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="submitChangePassword" class="modal-body">
          <!-- ... same form ... -->
        </form>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/formatters'
import api from '@/services/api'
import Swal from 'sweetalert2'

const router = useRouter()
const authStore = useAuthStore()

// State
const searchQuery = ref('')
const searchExpanded = ref(false)
const showNotifications = ref(false)
const showUserMenu = ref(false)
const showMobileSearch = ref(false)

// Change Password Modal
const showChangePasswordModal = ref(false)
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordErrors = ref({})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordForm = ref({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
})

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Refs for click outside
const notificationRef = ref(null)
const userMenuRef = ref(null)

// Computed
const currentPageTitle = computed(() => {
  const route = router.currentRoute.value
  const titles = {
    '/dashboard': 'Ramajo GameZone',
    '/customers': 'Wateja',
    '/customers/create': 'Sajili Mteja',
    '/loans': 'Mikopo',
    '/loans/create': 'Ombi la Mkopo',
    '/payments': 'Malipo',
    '/payments/create': 'Rekodi Malipo',
    '/collateral': 'Dhamana',
    '/reports/daily': 'Ripoti ya Siku',
    '/reports/outstanding': 'Mikopo Inayodaiwa',
    '/reports/defaulted': 'Mikopo Iliyochelewa',
    '/reports/profit': 'Ripoti ya Faida',
    '/users': 'Watumiaji',
    '/profile': 'Wasifu Wangu',
    '/settings': 'Mipangilio',
    '/notifications': 'Arifa',
    '/search': 'Tafuta',
    '/help': 'Msaada',
    '/change-password': 'Badilisha Neno la Siri',
    '/machines': 'Mashine',
    '/machines/create': 'Ongeza Mashine',
    '/readings': 'Usomaji wa Meter',
    '/collections': 'Makusanyo',
    '/expenses': 'Gharama',
    '/reports/revenue': 'Mapato Halisi',
    '/reports/monthly': 'Ripoti ya Mwezi',
    '/reports/machines': 'Utendaji wa Mashine',
    '/reports/branches': 'Utendaji wa Matawi',
    '/branches': 'Matawi',
    '/branches/create': 'Ongeza Tawi',
    '/operators': 'Watumiaji',
    '/audit-trail': 'Audit Trail',
  }
  return titles[route.path] || 'Ramajo GameZone'
})

const userDisplayName = computed(() => {
  if (authStore.user) {
    const firstName = authStore.user.first_name || ''
    const lastName = authStore.user.last_name || ''
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }
    return authStore.user.email || authStore.user.username || 'Mtumiaji'
  }
  return 'Mgeni'
})

const userRole = computed(() => {
  if (authStore.user) {
    return formatRole(authStore.user.role)
  }
  return 'Mtumiaji'
})

const userAvatar = computed(() => {
  if (authStore.user?.avatar) {
    return authStore.user.avatar
  }
  if (authStore.user?.profile_photo_url) {
    return authStore.user.profile_photo_url
  }
  const name = userDisplayName.value
  if (name && name !== 'Mgeni') {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3498db&color=fff&size=100&bold=true`
  }
  return '/assets/images/avator_.png'
})

// Password validations
const passwordValidations = computed(() => {
  const password = passwordForm.value.new_password || ''
  const confirm = passwordForm.value.new_password_confirmation || ''

  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
    match: password === confirm && password.length > 0,
  }
})

const isPasswordValid = computed(() => {
  const v = passwordValidations.value
  return v.minLength && v.hasUppercase && v.hasLowercase && v.hasNumber && v.hasSpecial && v.match
})

// Methods
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) showUserMenu.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  if (showUserMenu.value) showNotifications.value = false
}

const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value } })
    searchQuery.value = ''
    searchExpanded.value = false
  }
}

const performMobileSearch = () => {
  performSearch()
  closeMobileSearch()
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return 'Dakika hizi'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}d`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}s`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}s`
  return formatDate(date)
}

const formatRole = (role) => {
  const roles = {
    admin: 'Msimamizi Mkuu',
    manager: 'Meneja',
    officer: 'Afisa Mikopo',
    cashier: 'Keshia',
    viewer: 'Mtazamaji',
    accountant: 'Mhasibu',
    loan_officer: 'Afisa Mikopo',
  }
  return roles[role] || 'Afisa Mikopo'
}

// Change Password
const openChangePassword = () => {
  showChangePasswordModal.value = true
  showUserMenu.value = false
  passwordForm.value = {
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  }
  passwordError.value = ''
  passwordErrors.value = {}
}

const closeChangePassword = () => {
  showChangePasswordModal.value = false
}

const submitChangePassword = async () => {
  passwordLoading.value = true
  passwordError.value = ''
  passwordErrors.value = {}

  try {
    const response = await api.post('/change-password', passwordForm.value)
    if (response.data.success) {
      showToastMessage('Neno la siri limebadilishwa kwa mafanikio!', 'success')
      closeChangePassword()
    }
  } catch (error) {
    if (error.response?.status === 422) {
      passwordErrors.value = error.response.data.errors || {}
      passwordError.value = error.response.data.message || 'Validation error'
    } else if (error.response?.status === 401) {
      passwordError.value = 'Neno la siri la sasa si sahihi'
    } else {
      passwordError.value =
        error.response?.data?.message || 'Hitilafu imetokea. Tafadhali jaribu tena.'
    }
    showToastMessage(passwordError.value, 'error')
  } finally {
    passwordLoading.value = false
  }
}

// Logout with SweetAlert
const logout = async () => {
  const result = await Swal.fire({
    title: '<span style="color: #e74c3c">Toka kwenye Mfumo</span>',
    html: `
      <div style="padding: 20px 0">
        <i class="fas fa-sign-out-alt" style="font-size: 60px; color: #e74c3c; margin-bottom: 20px"></i>
        <p style="font-size: 16px; margin-bottom: 10px">Je, una uhakika unataka kutoka kwenye mfumo?</p>
        <p style="font-size: 13px; color: #999">Utahitaji kuingia tena kufikia akaunti yako.</p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#95a5a6',
    confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Toka',
    cancelButtonText: '<i class="fas fa-times"></i> Ghairi',
    reverseButtons: true,
    backdrop: true,
    allowOutsideClick: false,
  })

  if (result.isConfirmed) {
    try {
      Swal.fire({
        title: 'Inaondoa...',
        text: 'Tafadhali subiri',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })
      await authStore.logout(true)
    } catch (error) {
      console.error('Logout error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Hitilafu',
        text: 'Imeshindwa kutoka kwenye mfumo. Tafadhali jaribu tena.',
        confirmButtonColor: '#e74c3c',
      })
      authStore.forceLogout(true)
    }
  }
}

// Toast
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

const closeMobileSearch = () => {
  showMobileSearch.value = false
  searchQuery.value = ''
}

// Click outside
const handleClickOutside = (event) => {
  if (notificationRef.value && !notificationRef.value.contains(event.target)) {
    showNotifications.value = false
  }
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

// Resize
const handleResize = () => {
  if (window.innerWidth > 768) {
    showMobileSearch.value = false
  }
}

// Fetch user data
const fetchCurrentUser = async () => {
  try {
    if (!authStore.user && authStore.isAuthenticated) {
      await authStore.fetchCurrentUser()
    }
  } catch (error) {
    console.error('Error fetching current user:', error)
  }
}

// Watch auth changes
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) console.log('User data updated:', newUser)
  },
  { deep: true },
)

// Lifecycle
onMounted(async () => {
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)
  await fetchCurrentUser()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ----- Navbar Base ----- */
.navbar {
  height: 70px;
  background: white;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-title h2 {
  font-size: 1.3rem;
  color: #333;
  margin: 0;
  font-weight: 600;
}

/* ----- Right side ----- */
.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* ----- Search (desktop) ----- */
.search-bar {
  position: relative;
  width: 300px;
  transition: all 0.3s;
}
.search-bar.expanded {
  width: 350px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 0.9rem;
}
.search-input {
  width: 90%;
  padding: 10px 15px 10px 35px;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
  background: #f8fafc;
}
.search-input:focus {
  outline: none;
  border-color: #2196f3;
  background: white;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

/* ----- Notifications ----- */
.notifications {
  position: relative;
}
.notification-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 5px;
  position: relative;
}
.notification-btn:hover {
  background: #f5f5f5;
}
.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #f44336;
  color: white;
  font-size: 0.7rem;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.notifications-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 350px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
  margin-top: 10px;
  overflow: hidden;
  z-index: 1000;
}
.dropdown-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dropdown-header h4 {
  margin: 0;
  color: #333;
  font-size: 1rem;
}
.mark-read-btn {
  background: none;
  border: none;
  color: #2196f3;
  font-size: 0.85rem;
  cursor: pointer;
}
.notifications-list {
  max-height: 350px;
  overflow-y: auto;
}
.notification-item {
  padding: 15px 20px;
  display: flex;
  gap: 15px;
  cursor: pointer;
  transition: background 0.3s;
  border-bottom: 1px solid #f5f5f5;
}
.notification-item:hover {
  background: #f8f9fa;
}
.notification-item.unread {
  background: #e3f2fd;
}
.notification-icon {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.notification-icon.payment {
  background: #4caf50;
}
.notification-icon.loan {
  background: #2196f3;
}
.notification-icon.customer {
  background: #ff9800;
}
.notification-icon.warning {
  background: #f44336;
}
.notification-content {
  flex: 1;
}
.notification-text {
  margin: 0 0 5px;
  color: #333;
  font-size: 0.9rem;
}
.notification-time {
  font-size: 0.75rem;
  color: #999;
}
.no-notifications {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}
.no-notifications i {
  font-size: 2rem;
  color: #ddd;
  margin-bottom: 10px;
}
.dropdown-footer {
  padding: 12px 20px;
  text-align: center;
  border-top: 1px solid #eef2f6;
}
.dropdown-footer a {
  color: #2196f3;
  text-decoration: none;
  font-size: 0.9rem;
}

/* ----- User Menu ----- */
.user-menu {
  position: relative;
  cursor: pointer;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 10px;
  border-radius: 8px;
  transition: background 0.3s;
}
.user-info:hover {
  background: #f5f5f5;
}
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.user-details {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}
.user-role {
  font-size: 0.75rem;
  color: #999;
}
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 220px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
  margin-top: 10px;
  overflow: hidden;
  z-index: 1000;
}
.dropdown-item {
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333;
  text-decoration: none;
  transition: background 0.3s;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: left;
}
.dropdown-item:hover {
  background: #f5f5f5;
}
.dropdown-item.text-danger {
  color: #f44336;
}
.dropdown-item i {
  width: 20px;
  font-size: 1rem;
}
.dropdown-divider {
  height: 1px;
  background: #eef2f6;
  margin: 5px 0;
}

/* ----- Mobile Search ----- */
.mobile-search {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: white;
  padding: 15px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  gap: 10px;
  z-index: 99;
}
.mobile-search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #eef2f6;
  border-radius: 5px;
  font-size: 0.9rem;
}
.close-search {
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  padding: 10px;
}

/* ----- Modals ----- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #999;
  cursor: pointer;
  line-height: 1;
}
.close-btn:hover {
  color: #666;
}
.modal-body {
  padding: 25px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

/* ----- Form elements ----- */
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}
.form-group label i {
  color: #2196f3;
  width: 18px;
}
.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
  transition: all 0.3s;
}
.form-control:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}
.form-control.is-invalid {
  border-color: #f44336;
}
.password-input {
  position: relative;
}
.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
}
.error-text {
  color: #f44336;
  font-size: 0.8rem;
  margin-top: 4px;
  display: block;
}
.alert {
  padding: 12px 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.alert-danger {
  background: #fee;
  color: #f44336;
  border: 1px solid #fcc;
}
.password-requirements {
  background: #f8f9fa;
  border-radius: 5px;
  padding: 15px;
  margin: 20px 0;
}
.password-requirements p {
  margin: 0 0 10px;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}
.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.password-requirements li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  color: #999;
  font-size: 0.85rem;
}
.password-requirements li.valid {
  color: #4caf50;
}
.password-requirements li i {
  font-size: 0.9rem;
}
.password-requirements li.valid i {
  color: #4caf50;
}

/* ----- Buttons ----- */
.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}
.btn-primary {
  background: #2196f3;
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(33, 150, 243, 0.3);
}
.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}
.btn-secondary:hover {
  background: #e0e0e0;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ----- Toast ----- */
.toast-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 15px 25px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideInRight 0.3s ease;
  z-index: 2100;
  border-left: 4px solid;
}
.toast-notification.success {
  border-left-color: #4caf50;
}
.toast-notification.error {
  border-left-color: #f44336;
}
.toast-notification i {
  font-size: 1.2rem;
}
.toast-notification.success i {
  color: #4caf50;
}
.toast-notification.error i {
  color: #f44336;
}
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ----- Responsive (mobile) ----- */
@media (max-width: 768px) {
  .search-bar {
    display: none; /* Hide desktop search */
  }
  .user-details {
    display: none; /* Hide user name/role on mobile */
  }
  .navbar {
    padding: 10px 5px 0 65px;
    height: 60px;
  }
  .page-title h2 {
    font-size: 1rem;
  }
  .notifications-dropdown {
    width: 300px;
    right: -50px;
  }
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  .navbar-right {
    gap: 10px;
  }
  .user-info {
    padding: 5px 5px;
  }
  .user-avatar {
    width: 35px;
    height: 35px;
  }
}

@media (max-width: 480px) {
  .page-title h2 {
    font-size: 0.9rem;
  }
  .notifications-dropdown {
    width: 280px;
    right: -70px;
  }
}
</style>
