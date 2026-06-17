<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-left">
        <p>&copy; {{ currentYear }} Bonanza Management System. Haki zote zimehifadhiwa.</p>
      </div>

      <div class="footer-right">
        <div class="footer-links">
          <a href="#" @click.prevent="showHelp">Msaada</a>
          <span class="separator">|</span>
          <a href="#" @click.prevent="showTerms">Masharti</a>
          <span class="separator">|</span>
          <a href="#" @click.prevent="showPrivacy">Faragha</a>
        </div>

        <div class="footer-stats">
          <span class="stat-item">
            <i class="fas fa-microchip"></i>
            Mashine: {{ totalMachines }}
          </span>
          <span class="stat-item">
            <i class="fas fa-clock"></i>
            {{ currentTime }}
          </span>
          <span class="stat-item">
            <i class="fas fa-wifi"></i>
            <span :class="connectionStatus === 'online' ? 'text-success' : 'text-danger'">
              {{ connectionStatus === 'online' ? 'Online' : 'Offline' }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- Quick Actions (visible on mobile) -->
    <div class="quick-actions">
      <button @click="quickAction('machines')" class="quick-action-btn">
        <i class="fas fa-microchip"></i>
        <span>Mashine</span>
      </button>
      <button @click="quickAction('readings')" class="quick-action-btn">
        <i class="fas fa-camera-retro"></i>
        <span>Usomaji</span>
      </button>
      <button @click="quickAction('collections')" class="quick-action-btn">
        <i class="fas fa-hand-holding-usd"></i>
        <span>Makusanyo</span>
      </button>
      <button @click="quickAction('reports')" class="quick-action-btn">
        <i class="fas fa-chart-bar"></i>
        <span>Ripoti</span>
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
          <!-- Add detailed terms if needed -->
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
          <!-- Add detailed privacy policy if needed -->
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'

const router = useRouter()
const dashboardStore = useDashboardStore()

// State
const currentTime = ref(new Date().toLocaleTimeString('sw-TZ'))
const connectionStatus = ref(navigator.onLine ? 'online' : 'offline')
const showHelpModal = ref(false)
const showTermsModal = ref(false)
const showPrivacyModal = ref(false)

// Computed
const currentYear = computed(() => new Date().getFullYear())
const totalMachines = computed(() => dashboardStore.dashboardData?.total_machines ?? 0)

// Methods
const quickAction = (action) => {
  const routes = {
    machines: '/machines',
    readings: '/readings',
    collections: '/collections',
    reports: '/reports/daily',
  }
  router.push(routes[action])
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
/* All styles remain exactly as in the original footer */
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

.quick-actions {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #eef2f6;
  padding: 10px;
  justify-content: space-around;
  z-index: 1000;
}

.quick-action-btn {
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #666;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
}

.quick-action-btn:hover {
  background: #f5f5f5;
}

.quick-action-btn i {
  font-size: 1.2rem;
}

.quick-action-btn span {
  font-size: 0.7rem;
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
}

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

.quick-actions {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #eef2f6;
  padding: 10px;
  justify-content: space-around;
  z-index: 1000;
}

.quick-action-btn {
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #666;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
}

.quick-action-btn:hover {
  background: #f5f5f5;
}

.quick-action-btn i {
  font-size: 1.2rem;
}

.quick-action-btn span {
  font-size: 0.7rem;
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
}
</style>
