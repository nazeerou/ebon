<template>
  <div class="layout">
    <!-- Sidebar: always rendered, v-model controls open state -->
    <Sidebar v-model="isMobileMenuOpen" />

    <!-- Main content -->
    <div class="main-content" :class="{ 'with-sidebar': !isMobile }">
      <Header @toggle-sidebar="toggleMobileMenu" />
      <div class="content">
        <router-view />
      </div>
      <Footer />
    </div>
  </div>

  <SessionWarning />

  <!-- Logout modal -->
  <div v-if="showLogoutModal" class="modal-overlay" @click="closeLogoutModal">
    <div class="modal-content logout-modal" @click.stop>
      <div class="modal-header">
        <div class="modal-icon warning"><i class="fas fa-sign-out-alt"></i></div>
        <h3>Toka kwenye Mfumo</h3>
        <button class="close-btn" @click="closeLogoutModal"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <div class="logout-icon"><i class="fas fa-question-circle"></i></div>
        <p class="confirmation-text">Je, una uhakika unataka kutoka kwenye mfumo?</p>
        <p class="warning-text-small">
          <i class="fas fa-info-circle"></i> Utahitaji kuingia tena kufikia akaunti yako.
        </p>
      </div>
      <div class="modal-footer">
        <button @click="closeLogoutModal" class="btn-secondary" :disabled="logoutLoading">
          <i class="fas fa-times"></i> Ghairi
        </button>
        <button @click="confirmLogout" class="btn-danger" :disabled="logoutLoading">
          <span v-if="logoutLoading" class="spinner-small"></span>
          <span v-else><i class="fas fa-sign-out-alt"></i> Toka</span>
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
const isMobileMenuOpen = ref(false) // v-model for Sidebar

// Logout state
const showLogoutModal = ref(false)
const logoutLoading = ref(false)

// Computed user info (used by logout modal, etc.)
const userDisplayName = computed(() => {
  if (authStore.user) {
    if (authStore.user.name) return authStore.user.name
    if (authStore.user.username) return authStore.user.username
    if (authStore.user.email) return authStore.user.email.split('@')[0]
  }
  const userData = localStorage.getItem('user_data')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      return user.name || user.username || 'Mtumiaji'
    } catch (e) {}
  }
  return 'Mtumiaji'
})
const userRole = computed(() => {
  const roleMap = {
    admin: 'Msimamizi Mkuu',
    manager: 'Meneja',
    officer: 'Afisa Mikopo',
    cashier: 'Keshia',
    viewer: 'Mtazamaji',
    accountant: 'Mhasibu',
    loan_officer: 'Afisa Mikopo',
  }
  if (authStore.user?.role) return roleMap[authStore.user.role] || authStore.user.role
  const userData = localStorage.getItem('user_data')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      return roleMap[user.role] || user.role || 'Mtumiaji'
    } catch (e) {}
  }
  return 'Mtumiaji'
})
const userAvatar = computed(() => {
  if (authStore.user?.profile_photo_url) return authStore.user.profile_photo_url
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
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Logout
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
  } finally {
    closeLogoutModal()
  }
}

const loadUserData = async () => {
  authStore.initAuth()
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchCurrentUser()
  }
}

// Watch route changes to close mobile menu
watch(
  () => router.currentRoute.value,
  () => {
    if (isMobile.value && isMobileMenuOpen.value) {
      closeMobileMenu()
    }
  },
)

// Resize handler
const handleResize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 1024
  // On desktop, sidebar always open; on mobile, closed by default
  if (wasMobile && !isMobile.value) {
    isMobileMenuOpen.value = true
  } else if (!wasMobile && isMobile.value) {
    isMobileMenuOpen.value = false
  }
}

// Listen for toggle event from Header
const handleToggleSidebar = () => {
  if (isMobile.value) {
    toggleMobileMenu()
  }
}

onMounted(async () => {
  isMobile.value = window.innerWidth <= 1024
  isMobileMenuOpen.value = !isMobile.value // open on desktop, closed on mobile
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

/* Logout modal styles (unchanged) */
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
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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
}
</style>
