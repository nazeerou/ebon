<template>
  <div class="bell-wrap" ref="wrapRef">
    <!-- Bell button -->
    <button class="bell-btn" :class="{ alert: alertStore.hasAlerts }" @click="toggle">
      <i class="fas fa-bell"></i>
      <span v-if="alertStore.totalCount" class="badge" :class="badgeClass">
        {{ alertStore.totalCount > 99 ? '99+' : alertStore.totalCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <transition name="fade">
      <div v-if="open" class="bell-dropdown">
        <header class="bell-header">
          <div>
            <h4>Meter Readings Zilizochelewa</h4>
            <p class="bell-sub">Tawi: {{ alertStore.branch }}</p>
          </div>
          <button class="bell-refresh" @click="refresh" :disabled="alertStore.loading">
            <i class="fas" :class="alertStore.loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
          </button>
        </header>

        <!-- Summary -->
        <div class="bell-summary">
          <span class="pill warning">
            <i class="fas fa-exclamation-triangle"></i>
            {{ alertStore.warningCount }} × 3+ siku
          </span>
          <span class="pill critical">
            <i class="fas fa-fire"></i>
            {{ alertStore.criticalCount }} × 7+ siku
          </span>
        </div>

        <!-- Loading -->
        <div v-if="alertStore.loading && !alertStore.alerts.length" class="bell-loading">
          <div class="spinner-sm"></div>
          <span>Inapakia...</span>
        </div>

        <!-- Empty -->
        <div v-else-if="!alertStore.alerts.length" class="bell-empty">
          <i class="fas fa-check-circle"></i>
          <p>Mashine zote zimesomwa. Hongera!</p>
        </div>

        <!-- List -->
        <ul v-else class="bell-list">
          <li
            v-for="a in alertStore.alerts"
            :key="a.machine_id"
            class="bell-item"
            :class="a.severity"
          >
            <div class="bell-item-left">
              <div class="bell-item-icon">
                <i class="fas fa-microchip"></i>
              </div>
            </div>
            <div class="bell-item-body">
              <div class="bell-item-title">{{ a.machine_name }}</div>
              <div class="bell-item-meta">
                <span>{{ a.message }}</span>
                <span v-if="a.serial_number" class="muted">· {{ a.serial_number }}</span>
              </div>
            </div>
            <div class="bell-item-right">
              <span class="severity-dot" :class="a.severity"></span>
            </div>
          </li>
        </ul>

        <!-- Footer -->
        <footer v-if="alertStore.alerts.length" class="bell-footer">
          <router-link to="/alerts" class="bell-link" @click="open = false">
            Ona zote <i class="fas fa-arrow-right"></i>
          </router-link>
        </footer>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAlertStore } from '@/stores/alerts'

const alertStore = useAlertStore()
const open = ref(false)
const wrapRef = ref(null)

const badgeClass = computed(() => (alertStore.criticalCount > 0 ? 'critical' : 'warning'))

const toggle = async () => {
  open.value = !open.value
  if (open.value && !alertStore.alerts.length) {
    await alertStore.fetchAlerts()
  }
}

const refresh = async () => {
  await alertStore.fetchAlerts()
}

// Close on outside click
const onClickOutside = (e) => {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  alertStore.fetchSummary()
  alertStore.startPolling(60000) // refresh count every 60s
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  alertStore.stopPolling()
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.bell-wrap {
  position: relative;
  display: inline-block;
}

/* Bell button */
.bell-btn {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 0.75rem;
  border: none;
  background: #f1f3f8;
  color: #2c3e66;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
}
.bell-btn:hover {
  background: #e2e8f0;
}
.bell-btn.alert {
  color: #c62828;
}
.bell-btn.alert i {
  animation: ring 2s infinite;
}
@keyframes ring {
  0%,
  100% {
    transform: rotate(0);
  }
  10% {
    transform: rotate(-12deg);
  }
  20% {
    transform: rotate(12deg);
  }
  30% {
    transform: rotate(-8deg);
  }
  40% {
    transform: rotate(8deg);
  }
  50%,
  90% {
    transform: rotate(0);
  }
}

/* Badge */
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: #fb8c00;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}
.badge.critical {
  background: #c62828;
}

/* Dropdown */
.bell-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-width: 90vw;
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  z-index: 100;
  overflow: hidden;
}
.bell-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid #f1f3f8;
}
.bell-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #1a2634;
}
.bell-sub {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: #5e6f8d;
}
.bell-refresh {
  width: 30px;
  height: 30px;
  border-radius: 0.5rem;
  background: #f1f3f8;
  border: none;
  color: #5e6f8d;
  cursor: pointer;
  transition: all 0.15s;
}
.bell-refresh:hover {
  background: #e2e8f0;
  color: #1a2634;
}

/* Summary pills */
.bell-summary {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.pill.warning {
  background: #fff8e1;
  color: #8d6e00;
}
.pill.critical {
  background: #fdecea;
  color: #c62828;
}

/* List */
.bell-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 320px;
  overflow-y: auto;
}
.bell-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.15s;
}
.bell-item:hover {
  background: #f8fafc;
}
.bell-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 0.6rem;
  background: #eef6fe;
  color: #1e88e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}
.bell-item.critical .bell-item-icon {
  background: #fdecea;
  color: #c62828;
}
.bell-item-body {
  flex: 1;
  min-width: 0;
}
.bell-item-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a2634;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bell-item-meta {
  font-size: 0.72rem;
  color: #5e6f8d;
  margin-top: 0.1rem;
}
.bell-item-meta .muted {
  color: #b0b8c7;
}
.severity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.severity-dot.warning {
  background: #fb8c00;
}
.severity-dot.critical {
  background: #c62828;
}

/* States */
.bell-loading,
.bell-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  font-size: 0.85rem;
  color: #5e6f8d;
  text-align: center;
}
.bell-empty i {
  font-size: 1.75rem;
  color: #43a047;
}
.bell-empty p {
  margin: 0;
}
.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-top-color: #1e88e5;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Footer */
.bell-footer {
  padding: 0.6rem 1rem;
  text-align: center;
  border-top: 1px solid #f1f3f8;
  background: #f8fafc;
}
.bell-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e88e5;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.bell-link:hover {
  color: #0d47a1;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 480px) {
  .bell-dropdown {
    width: 300px;
    right: -8px;
  }
}
</style>
