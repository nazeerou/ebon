<template>
  <div class="alerts-page">
    <div class="alerts-card">
      <!-- ===================== HEADER ===================== -->
      <header class="alerts-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="fas fa-bell"></i>
          </div>
          <div>
            <h2>Mashine Zilizochelewa Kusomwa</h2>
            <p class="subtitle">
              <!-- Tawi: <strong>{{ alertStore.branch || '—' }}</strong> -->
            </p>
          </div>
        </div>

        <button class="btn-refresh" @click="refresh" :disabled="alertStore.loading">
          <i class="fas" :class="alertStore.loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
          <span>Onyesha Upya</span>
        </button>
      </header>

      <!-- ===================== THRESHOLDS ===================== -->
      <div class="thresholds">
        <div class="threshold-group">
          <label for="warn-days">
            <i class="fas fa-exclamation-triangle warn-icon"></i>
            Warning (siku)
          </label>
          <input
            id="warn-days"
            type="number"
            v-model.number="alertStore.thresholds.warning_days"
            min="1"
          />
        </div>

        <div class="threshold-group">
          <label for="crit-days">
            <i class="fas fa-fire crit-icon"></i>
            Critical (siku)
          </label>
          <input
            id="crit-days"
            type="number"
            v-model.number="alertStore.thresholds.critical_days"
            min="1"
          />
        </div>

        <button class="btn-apply" @click="refresh" :disabled="alertStore.loading">
          <i class="fas fa-filter"></i>
          Tumia
        </button>
      </div>

      <!-- ===================== SUMMARY ===================== -->
      <div v-if="!alertStore.loading && alertStore.alerts.length" class="summary-strip">
        <div class="summary-item total">
          <span class="summary-label">Jumla</span>
          <span class="summary-value">{{ alertStore.alerts.length }}</span>
        </div>
        <div class="summary-item critical">
          <span class="summary-label"> <i class="fas fa-fire"></i> Critical </span>
          <span class="summary-value">{{ criticalCount }}</span>
        </div>
        <div class="summary-item warning">
          <span class="summary-label"> <i class="fas fa-exclamation-triangle"></i> Warning </span>
          <span class="summary-value">{{ warningCount }}</span>
        </div>
      </div>

      <!-- ===================== STATES ===================== -->
      <div v-if="alertStore.loading" class="state loading-state">
        <div class="spinner"></div>
        <span>Inapakia taarifa...</span>
      </div>

      <div v-else-if="!alertStore.alerts.length" class="state success">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>Hongera!</h3>
        <p>Mashine zote zimesomwa kwa wakati.</p>
      </div>

      <!-- ===================== LIST ===================== -->
      <ul v-else class="alerts-list">
        <li
          v-for="a in alertStore.alerts"
          :key="a.machine_id"
          class="alert-item"
          :class="a.severity"
        >
          <!-- Left: severity stripe + machine info -->
          <div class="item-left">
            <span class="severity-dot" :class="a.severity"></span>

            <div class="item-info">
              <div class="item-title">
                <span class="machine-name">{{ a.machine_name }}</span>
                <span class="severity-badge" :class="a.severity">
                  <i
                    class="fas"
                    :class="a.severity === 'critical' ? 'fa-fire' : 'fa-exclamation-triangle'"
                  ></i>
                  {{ a.severity === 'critical' ? 'Critical' : 'Warning' }}
                </span>
              </div>

              <div class="item-meta">
                <span class="meta-item">
                  <i class="fas fa-microchip"></i>
                  {{ a.serial_number || '—' }}
                </span>
                <span class="meta-item">
                  <i class="fas fa-store"></i>
                  {{ a.branch_name || '—' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right: days overdue + last-read date -->
          <div class="item-right">
            <div class="days-block">
              <span class="days-value" :class="a.severity">
                {{ a.days_overdue ?? '—' }}
              </span>
              <span class="days-label">siku</span>
            </div>

            <div class="last-read">
              <i class="fas fa-clock"></i>
              <span v-if="a.last_read_at"> Mwisho: {{ formatDate(a.last_read_at) }} </span>
              <span v-else class="never">Haijasomwa kamwe</span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAlertStore } from '@/stores/alerts'

const alertStore = useAlertStore()

const refresh = () => alertStore.fetchAlerts()

/* Counts for the summary strip */
const criticalCount = computed(
  () => alertStore.alerts.filter((a) => a.severity === 'critical').length,
)
const warningCount = computed(
  () => alertStore.alerts.filter((a) => a.severity === 'warning').length,
)

/* Date helper — swallows nulls/undefined cleanly */
const formatDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('sw-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(refresh)
</script>

<style scoped>
/* =========================================================
   Page + card shell
   ========================================================= */
.alerts-page {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}
.alerts-card {
  background: #fff;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* =========================================================
   Header
   ========================================================= */
.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}
.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #fff;
  background: linear-gradient(135deg, #ef5350, #b71c1c);
  box-shadow: 0 6px 14px rgba(239, 83, 80, 0.28);
  flex-shrink: 0;
}
.alerts-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #1a2634;
  line-height: 1.25;
}
.subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: #5e6f8d;
}
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border-radius: 0.7rem;
  border: none;
  background: #eef2f7;
  color: #2c3e66;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-refresh:hover:not(:disabled) {
  background: #e2e8f0;
  transform: translateY(-1px);
}
.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* =========================================================
   Thresholds
   ========================================================= */
.thresholds {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.85rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  border: 1px solid #eef2f7;
}
.threshold-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 130px;
}
.threshold-group label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.warn-icon {
  color: #fb8c00;
}
.crit-icon {
  color: #c62828;
}
.thresholds input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 0.6rem;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  font-size: 0.9rem;
  color: #1a2634;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}
.thresholds input:focus {
  border-color: #1e88e5;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.12);
}
.btn-apply {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border-radius: 0.6rem;
  border: none;
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(30, 136, 229, 0.25);
  white-space: nowrap;
  min-height: 42px;
}
.btn-apply:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(30, 136, 229, 0.35);
}
.btn-apply:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* =========================================================
   Summary strip
   ========================================================= */
.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, #eef6fe, #e3f2fd);
  border-radius: 0.85rem;
  border: 1px solid rgba(30, 136, 229, 0.15);
  margin-bottom: 1.25rem;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.55rem;
}
.summary-item.critical {
  background: rgba(198, 40, 40, 0.06);
}
.summary-item.warning {
  background: rgba(251, 140, 0, 0.06);
}
.summary-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.summary-item.critical .summary-label {
  color: #c62828;
}
.summary-item.warning .summary-label {
  color: #b45309;
}
.summary-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1a2634;
  letter-spacing: -0.02em;
  line-height: 1;
}
.summary-item.critical .summary-value {
  color: #b71c1c;
}
.summary-item.warning .summary-value {
  color: #b45309;
}

/* =========================================================
   States
   ========================================================= */
.state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #5e6f8d;
  border-radius: 0.85rem;
  background: #f8fafc;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #1e88e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.state.success {
  background: linear-gradient(135deg, #e8f5e9, #dcedc8);
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}
.success-icon {
  font-size: 2.5rem;
  color: #43a047;
  margin-bottom: 0.5rem;
}
.state.success h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  color: #2e7d32;
}
.state.success p {
  margin: 0;
  font-size: 0.85rem;
  color: #4d7c4f;
}

/* =========================================================
   Alerts list — one card per machine
   ========================================================= */
.alerts-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem 0.9rem 1.1rem;
  border-radius: 0.85rem;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}
.alert-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #cbd5e1;
}
.alert-item.warning {
  border-color: #ffe0b2;
  background: #fffdf5;
}
.alert-item.warning::before {
  background: #fb8c00;
}
.alert-item.critical {
  border-color: #f5c6cb;
  background: #fdf4f5;
}
.alert-item.critical::before {
  background: #c62828;
}
.alert-item:hover {
  transform: translateX(2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

/* Left side */
.item-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  flex: 1;
}
.severity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}
.severity-dot.warning {
  background: #fb8c00;
}
.severity-dot.critical {
  background: #c62828;
  animation: pulse-crit 1.6s ease-in-out infinite;
}
@keyframes pulse-crit {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.15);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(198, 40, 40, 0.05);
  }
}

.item-info {
  min-width: 0;
  flex: 1;
}
.item-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}
.machine-name {
  font-weight: 700;
  color: #1a2634;
  font-size: 0.95rem;
}
.severity-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.severity-badge.warning {
  background: #fff3e0;
  color: #b45309;
  border: 1px solid #ffe0b2;
}
.severity-badge.critical {
  background: #fdecea;
  color: #b71c1c;
  border: 1px solid #f5c6cb;
}
.severity-badge i {
  font-size: 0.6rem;
}

.item-meta {
  display: flex;
  gap: 0.85rem;
  font-size: 0.75rem;
  color: #5e6f8d;
  margin-top: 0.2rem;
  flex-wrap: wrap;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.meta-item i {
  color: #1e88e5;
  font-size: 0.7rem;
}

/* Right side */
.item-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}
.days-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.7rem;
  border-radius: 0.6rem;
  background: rgba(0, 0, 0, 0.03);
  min-width: 62px;
}
.days-value {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}
.days-value.warning {
  color: #b45309;
}
.days-value.critical {
  color: #b71c1c;
}
.days-label {
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #5e6f8d;
  margin-top: 0.1rem;
}

.last-read {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: #5e6f8d;
  white-space: nowrap;
}
.last-read i {
  font-size: 0.68rem;
  color: #94a3b8;
}
.last-read .never {
  color: #c62828;
  font-weight: 600;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

/* Tablet */
@media (max-width: 992px) {
  .alerts-page {
    padding: 1rem;
  }
  .alerts-card {
    padding: 1.5rem;
    border-radius: 1rem;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .alerts-page {
    padding: 0.75rem;
  }
  .alerts-card {
    padding: 1.15rem;
    border-radius: 0.85rem;
  }

  .alerts-header {
    gap: 0.75rem;
  }
  .header-icon {
    width: 42px;
    height: 42px;
    font-size: 1.1rem;
    border-radius: 0.7rem;
  }
  .alerts-header h2 {
    font-size: 1.05rem;
  }
  .subtitle {
    font-size: 0.75rem;
  }
  .btn-refresh {
    width: 100%;
    justify-content: center;
    padding: 0.65rem 1rem;
    min-height: 44px;
  }

  /* Thresholds → 2 columns + full-width Apply */
  .thresholds {
    padding: 0.85rem;
    gap: 0.65rem;
  }
  .threshold-group {
    min-width: 0;
    flex: 1 1 calc(50% - 0.35rem);
  }
  .btn-apply {
    flex: 1 1 100%;
    width: 100%;
    justify-content: center;
  }
  .thresholds input {
    font-size: 16px; /* prevent iOS zoom */
    padding: 0.5rem 0.65rem;
  }

  /* Summary stack */
  .summary-strip {
    padding: 0.75rem 0.85rem;
    gap: 0.5rem;
  }
  .summary-value {
    font-size: 1.15rem;
  }
  .summary-label {
    font-size: 0.62rem;
  }

  /* List items → stacked layout */
  .alert-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.85rem 0.85rem 0.85rem 1rem;
  }
  .item-left {
    gap: 0.7rem;
  }
  .machine-name {
    font-size: 0.9rem;
  }
  .item-right {
    justify-content: space-between;
    padding-top: 0.75rem;
    border-top: 1px dashed #e2e8f0;
    gap: 0.75rem;
  }
  .days-block {
    flex-direction: row;
    align-items: baseline;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    min-width: 0;
  }
  .days-value {
    font-size: 1.15rem;
  }
  .days-label {
    margin-top: 0;
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .alerts-page {
    padding: 0.5rem;
  }
  .alerts-card {
    padding: 0.9rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  }

  .header-icon {
    width: 38px;
    height: 38px;
    font-size: 1rem;
    border-radius: 0.6rem;
  }
  .alerts-header h2 {
    font-size: 0.95rem;
  }

  /* Thresholds single column */
  .threshold-group {
    flex: 1 1 100%;
  }

  /* Summary strip single column with dividers */
  .summary-strip {
    grid-template-columns: 1fr;
    padding: 0.75rem;
    gap: 0.4rem;
  }
  .summary-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0.5rem;
  }
  .summary-item + .summary-item {
    border-top: 1px dashed #cfe3f8;
  }
  .summary-value {
    font-size: 1.1rem;
  }

  .alert-item {
    padding: 0.7rem 0.75rem 0.75rem 0.85rem;
  }
  .severity-dot {
    width: 8px;
    height: 8px;
  }
  .machine-name {
    font-size: 0.85rem;
  }
  .item-meta {
    font-size: 0.7rem;
    gap: 0.6rem;
  }
  .item-right {
    padding-top: 0.6rem;
  }
  .days-value {
    font-size: 1.05rem;
  }
  .last-read {
    font-size: 0.68rem;
  }
}

/* Touch devices — bigger tap targets */
@media (hover: none) and (pointer: coarse) {
  .btn-refresh,
  .btn-apply {
    min-height: 44px;
  }
  .thresholds input {
    min-height: 44px;
  }
}
</style>
