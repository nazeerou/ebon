<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-left">
        <p>&copy; {{ currentYear }} eBon GameZone. Haki zote zimehifadhiwa.</p>
      </div>
    </div>

    <!-- Quick Actions (visible on mobile) -->
    <div class="quick-actions">
      <button
        class="quick-action-btn"
        :class="{ disabled: !isAdmin }"
        @click="quickAction('machines')"
      >
        <i class="fas fa-microchip"></i>
        <span>Mashine</span>
      </button>
      <button
        class="quick-action-btn"
        :class="{ disabled: !isAdmin }"
        @click="quickAction('readings')"
      >
        <i class="fas fa-camera-retro"></i>
        <span>Usomaji</span>
      </button>
      <button
        class="quick-action-btn"
        :class="{ disabled: !isAdmin }"
        @click="quickAction('collections')"
      >
        <i class="fas fa-hand-holding-usd"></i>
        <span>Makusanyo</span>
      </button>
      <button
        class="quick-action-btn"
        :class="{ disabled: !isAdmin }"
        @click="quickAction('tokens')"
      >
        <i class="fas fa-chart-bar"></i>
        <span>Tokens / Mtaji</span>
      </button>
    </div>

    <!-- Help Modal -->
    <div v-if="showHelpModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Msaada</h3>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Je, unahitaji msaada? Wasiliana nasi:</p>
          <ul class="help-list">
            <li><i class="fas fa-phone"></i> +255 765 432 100</li>
            <li><i class="fas fa-envelope"></i> support@bonanza.co.tz</li>
            <li><i class="fas fa-clock"></i> Jumatatu - Ijumaa: 8:00 - 17:00</li>
            <li><i class="fas fa-clock"></i> Jumamosi: 9:00 - 13:00</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Terms Modal -->
    <div v-if="showTermsModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Masharti ya Matumizi</h3>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Masharti ya matumizi ya mfumo wa Bonanza Management System...</p>
        </div>
      </div>
    </div>

    <!-- Privacy Modal -->
    <div v-if="showPrivacyModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Sera ya Faragha</h3>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Sera ya faragha ya Bonanza Management System...</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()

// State
const currentTime = ref(new Date().toLocaleTimeString('sw-TZ'))
const connectionStatus = ref(navigator.onLine ? 'online' : 'offline')
const showHelpModal = ref(false)
const showTermsModal = ref(false)
const showPrivacyModal = ref(false)

// Computed
const currentYear = computed(() => new Date().getFullYear())
const totalMachines = computed(() => dashboardStore.dashboardData?.total_machines ?? 0)

// Role check
const isAdmin = computed(() => authStore.user?.role === 'admin')

/**
 * Route map for quick actions.
 * KEY (button) → PATH (vue-router destination)
 */
const QUICK_ROUTES = {
  machines: '/machines',
  readings: '/readings',
  collections: '/collections',
  tokens: '/tokens/lists', // ← FIX: added mapping
  reports: '/reports/daily',
}

const quickAction = (action) => {
  // Only admin can trigger navigation
  if (!isAdmin.value) return

  const path = QUICK_ROUTES[action]
  if (!path) {
    console.warn(`[Footer] No route mapped for quick action "${action}"`)
    return
  }

  // Avoid redundant navigation warning when already on the target route
  if (router.currentRoute.value.path === path) return

  router.push(path).catch((err) => {
    // Silently ignore "redundant navigation" errors
    if (err?.name !== 'NavigationDuplicated') {
      console.error('[Footer] Navigation error:', err)
    }
  })
}

const showHelp = () => {
  showHelpModal.value = true
}
const showTerms = () => {
  showTermsModal.value = true
}
const showPrivacy = () => {
  showPrivacyModal.value = true
}
const closeModals = () => {
  showHelpModal.value = false
  showTermsModal.value = false
  showPrivacyModal.value = false
}

// Update time every second
let timeInterval
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString('sw-TZ')
}

// Handle online/offline status
const handleOnline = () => {
  connectionStatus.value = 'online'
}
const handleOffline = () => {
  connectionStatus.value = 'offline'
}

onMounted(() => {
  timeInterval = setInterval(updateTime, 1000)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  clearInterval(timeInterval)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
.footer {
  background: white;
  border-top: 1px solid #eef2f6;
  padding: 15px 25px;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.footer-left p {
  margin: 0;
  color: #666;
  font-size: 0.85rem;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 25px;
  flex-wrap: wrap;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-links a {
  color: #666;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #2196f3;
}

.separator {
  color: #ddd;
  font-size: 0.85rem;
}

.footer-stats {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 0.85rem;
}

.stat-item i {
  font-size: 0.9rem;
  color: #999;
}

.text-success {
  color: #4caf50;
}

.text-danger {
  color: #f44336;
}

/* Quick Actions */
.quick-actions {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #eef2f6;
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom, 0px));
  justify-content: space-around;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
}

.quick-action-btn {
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #666;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s;
  flex: 1;
  min-width: 0;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.quick-action-btn:hover:not(.disabled) {
  background: #f5f5f5;
  color: #2196f3;
}

.quick-action-btn:active:not(.disabled) {
  background: #e3f2fd;
  transform: scale(0.96);
}

.quick-action-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.quick-action-btn i {
  font-size: 1.15rem;
  line-height: 1;
}

.quick-action-btn span {
  font-size: 0.66rem;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  letter-spacing: 0.01em;
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
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 15px 0 0;
}

.help-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.help-list li i {
  width: 25px;
  color: #2196f3;
}

/* Responsive */
@media (max-width: 768px) {
  .footer {
    padding: 15px;
    margin-bottom: 70px;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-right {
    flex-direction: column;
    gap: 10px;
  }

  .footer-stats {
    flex-wrap: wrap;
    justify-content: center;
  }

  .quick-actions {
    display: flex;
  }
}

@media (max-width: 480px) {
  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .footer-stats {
    flex-direction: column;
    gap: 5px;
  }

  .quick-action-btn i {
    font-size: 1.05rem;
  }

  .quick-action-btn span {
    font-size: 0.62rem;
  }
}
</style>
