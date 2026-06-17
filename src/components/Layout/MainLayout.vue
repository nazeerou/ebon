<template>
  <div class="layout">
    <!-- Desktop Sidebar - visible on larger screens -->
    <Sidebar v-if="!isMobile" />

    <!-- Mobile Sidebar (slide-out) -->
    <div v-if="isMobile && isMobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'with-sidebar': !isMobile }">
      <!-- Header with hamburger menu -->
      <Header @toggle-sidebar="toggleMobileMenu" />

      <!-- Page Content -->
      <div class="content">
        <router-view />
      </div>

      <Footer />
    </div>
  </div>

  <SessionWarning />

  <!-- Logout Confirmation Modal -->
  <div v-if="showLogoutModal" class="modal-overlay" @click="closeLogoutModal">
    <div class="modal-content logout-modal" @click.stop>
      <div class="modal-header">
        <div class="modal-icon warning">
          <i class="fas fa-sign-out-alt"></i>
        </div>
        <h3>Toka kwenye Mfumo</h3>
        <button class="close-btn" @click="closeLogoutModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="logout-icon">
          <i class="fas fa-question-circle"></i>
        </div>
        <p class="confirmation-text">Je, una uhakika unataka kutoka kwenye mfumo?</p>
        <p class="warning-text-small">
          <i class="fas fa-info-circle"></i>
          Utahitaji kuingia tena kufikia akaunti yako.
        </p>
      </div>
      <div class="modal-footer">
        <button @click="closeLogoutModal" class="btn-secondary" :disabled="logoutLoading">
          <i class="fas fa-times"></i>
          Ghairi
        </button>
        <button @click="confirmLogout" class="btn-danger" :disabled="logoutLoading">
          <span v-if="logoutLoading" class="spinner-small"></span>
          <span v-else>
            <i class="fas fa-sign-out-alt"></i>
            Toka
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from './SideBar.vue'
import Header from './AppHeader.vue'
import Footer from './AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import SessionWarning from '@/components/SessionWarning.vue'

const router = useRouter()
const authStore = useAuthStore()

// State
const isMobile = ref(false)
const isMobileMenuOpen = ref(false)
const mobileOpenSections = ref({
  customers: false,
  payments: false,
  collateral: false,
  reports: false,
  admin: false,
})

// Logout state
const showLogoutModal = ref(false)
const logoutLoading = ref(false)

// Computed - User Display
const userDisplayName = computed(() => {
  console.log('Computing userDisplayName, authStore.user:', authStore.user)

  if (authStore.user) {
    const firstName = authStore.user.first_name || ''
    const lastName = authStore.user.last_name || ''
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }
    if (authStore.user.name) return authStore.user.name
    if (authStore.user.email) return authStore.user.email.split('@')[0]
    if (authStore.user.username) return authStore.user.username
  }

  // Try localStorage directly as fallback
  const userData = localStorage.getItem('user_data')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      const firstName = user.first_name || ''
      const lastName = user.last_name || ''
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim()
      }
      if (user.name) return user.name
      if (user.email) return user.email.split('@')[0]
    } catch (e) {
      console.error('Error parsing user data:', e)
    }
  }

  return 'Mgeni'
})

const userRole = computed(() => {
  if (authStore.user?.role) {
    return formatRole(authStore.user.role)
  }

  const userData = localStorage.getItem('user_data')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user.role) return formatRole(user.role)
    } catch (e) {}
  }

  return 'Mtumiaji'
})

const userAvatar = computed(() => {
  if (authStore.user?.profile_photo_url) {
    return authStore.user.profile_photo_url
  }

  const userData = localStorage.getItem('user_data')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user.profile_photo_url) return user.profile_photo_url
    } catch (e) {}
  }

  const name = userDisplayName.value
  if (name && name !== 'Mgeni') {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3498db&color=fff&size=100&bold=true`
  }
  return '/default-avatar.png'
})

// Methods
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

const toggleMobileSection = (section) => {
  mobileOpenSections.value[section] = !mobileOpenSections.value[section]
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
  return roles[role] || 'Mtumiaji'
}

// Logout methods
const handleLogout = () => {
  showLogoutModal.value = true
  closeMobileMenu()
}

const closeLogoutModal = () => {
  showLogoutModal.value = false
  logoutLoading.value = false
}

const confirmLogout = async () => {
  logoutLoading.value = true
  try {
    await authStore.logout(true)
  } catch (error) {
    console.error('Logout error:', error)
    authStore.forceLogout(true)
  }
}

// Load user data on mount
const loadUserData = async () => {
  // Initialize auth from localStorage
  authStore.initAuth()

  // If authenticated but no user data, fetch from API
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchCurrentUser()
  }
}

// Watch for route changes to close mobile menu
watch(
  () => router.currentRoute.value,
  () => {
    if (isMobile.value && isMobileMenuOpen.value) {
      closeMobileMenu()
    }
  },
)

// Handle window resize
const handleResize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 1024

  if (!wasMobile && isMobile.value) {
    closeMobileMenu()
  }

  if (wasMobile && !isMobile.value && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

// Listen for toggle-sidebar event from header
const handleToggleSidebar = () => {
  if (isMobile.value) {
    toggleMobileMenu()
  }
}

// Lifecycle
onMounted(async () => {
  isMobile.value = window.innerWidth <= 1024

  // Load user data
  await loadUserData()

  window.addEventListener('resize', handleResize)
  window.addEventListener('toggle-sidebar', handleToggleSidebar)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('toggle-sidebar', handleToggleSidebar)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Add logout modal styles */
.logout-modal {
  max-width: 400px;
  text-align: center;
}

.logout-icon {
  margin-bottom: 20px;
}

.logout-icon i {
  font-size: 60px;
  color: #f39c12;
}

.confirmation-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: 500;
}

.warning-text-small {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
}

.modal-icon.warning {
  background: #fee;
  color: #e74c3c;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Layout */
.layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  transition: margin-left 0.3s ease;
  width: 100%;
}

.with-sidebar {
  margin-left: 280px;
}

.content {
  flex: 1;
  padding: 20px;
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fadeIn 0.3s ease;
}

/* Mobile Sidebar */
.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #1a2639 0%, #2c3e50 100%);
  color: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
  overflow-y: auto;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Mobile Sidebar Header */
.mobile-sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
}

.mobile-sidebar-header .logo h2 {
  color: white;
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

.close-menu {
  background: none;
  border: 1px solid #3498db;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 5px;
  transition: background 0.3s;
}

.close-menu:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Mobile User Info */
.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3498db;
}

.mobile-user-name {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.mobile-user-role {
  font-size: 0.8rem;
  color: #8a9bb5;
}

/* Mobile Navigation */
.mobile-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #b7c0cd;
  text-decoration: none;
  transition: all 0.3s;
  margin-bottom: 5px;
}

.mobile-nav-item i {
  width: 24px;
  font-size: 1.1rem;
  margin-right: 10px;
  color: #8a9bb5;
}

.mobile-nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.mobile-nav-item:hover i {
  color: white;
}

.mobile-nav-item.active {
  background: #3498db;
  color: white;
}

.mobile-nav-item.active i {
  color: white;
}

.mobile-nav-section {
  margin-bottom: 5px;
}

.mobile-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  color: #b7c0cd;
  transition: background 0.3s;
}

.mobile-section-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.mobile-section-header span {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-section-header span i {
  width: 20px;
  color: #8a9bb5;
}

.mobile-section-header i.fa-chevron-down {
  font-size: 0.8rem;
  transition: transform 0.3s;
  color: #8a9bb5;
}

.mobile-section-header i.fa-chevron-down.rotated {
  transform: rotate(180deg);
}

.mobile-submenu {
  background: rgba(0, 0, 0, 0.2);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobile-submenu-item {
  display: flex;
  align-items: center;
  padding: 10px 20px 10px 54px;
  color: #b7c0cd;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.mobile-submenu-item i {
  width: 20px;
  font-size: 0.9rem;
  margin-right: 10px;
  color: #8a9bb5;
}

.mobile-submenu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.mobile-submenu-item:hover i {
  color: white;
}

.mobile-submenu-item.active {
  background: #3498db;
  color: white;
}

.mobile-submenu-item.active i {
  color: white;
}

.badge {
  background: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: 5px;
}

/* Mobile Sidebar Footer */
.mobile-sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.2);
}

.mobile-logout-btn {
  width: 100%;
  padding: 12px;
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid #e74c3c;
  border-radius: 5px;
  color: #e74c3c;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
}

.mobile-logout-btn:hover {
  background: #e74c3c;
  color: white;
}

.mobile-logout-btn i {
  font-size: 1rem;
}

/* Modal Styles */
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #999;
  cursor: pointer;
  padding: 5px;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f8fafc;
  color: #666;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #eef2f6;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

/* Responsive */
@media (max-width: 1024px) {
  .with-sidebar {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .content {
    padding: 10px;
  }

  .mobile-sidebar {
    width: 100%;
  }
}
</style>
