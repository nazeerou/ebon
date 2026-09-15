<template>
  <div class="alerts-page">
    <div class="alerts-card">
      <header class="alerts-header">
        <div>
          <h2>Meter Readings Zilizochelewa</h2>
          <p class="subtitle">Tawi: {{ alertStore.branch }}</p>
        </div>
        <button class="btn-refresh" @click="refresh" :disabled="alertStore.loading">
          <i class="fas" :class="alertStore.loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
          Refresh
        </button>
      </header>

      <div class="thresholds">
        <label>
          Warning (siku):
          <input type="number" v-model.number="alertStore.thresholds.warning_days" min="1" />
        </label>
        <label>
          Critical (siku):
          <input type="number" v-model.number="alertStore.thresholds.critical_days" min="1" />
        </label>
        <button class="btn-refresh" @click="refresh">Apply</button>
      </div>

      <div v-if="alertStore.loading" class="state">Inapakia...</div>
      <div v-else-if="!alertStore.alerts.length" class="state success">
        <i class="fas fa-check-circle"></i> Mashine zote zimesomwa.
      </div>

      <ul v-else class="alerts-list">
        <li v-for="a in alertStore.alerts" :key="a.machine_id" :class="['row', a.severity]">
          <div class="row-left">
            <span class="dot" :class="a.severity"></span>
            <div>
              <div class="name">{{ a.machine_name }}</div>
              <div class="meta">{{ a.serial_number || '—' }} · {{ a.branch_name }}</div>
            </div>
          </div>
          <div class="row-right">
            <span class="days">{{ a.message }}</span>
            <span class="last">
              {{ a.last_read_at ? 'Mwisho: ' + formatDate(a.last_read_at) : 'Haijasomwa kamwe' }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAlertStore } from '@/stores/alerts'

const alertStore = useAlertStore()

const refresh = () => alertStore.fetchAlerts()

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('sw-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(refresh)
</script>

<style scoped>
.alerts-page {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}
.alerts-card {
  background: #fff;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}
.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.alerts-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a2634;
}
.subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: #5e6f8d;
}
.btn-refresh {
  padding: 0.55rem 1rem;
  border-radius: 0.7rem;
  border: none;
  background: #eef2f7;
  color: #2c3e66;
  font-weight: 600;
  cursor: pointer;
}
.thresholds {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.thresholds label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #2c3e66;
}
.thresholds input {
  width: 70px;
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  border: 1.5px solid #e2e8f0;
}
.state {
  text-align: center;
  padding: 2rem;
  color: #5e6f8d;
}
.state.success {
  color: #2e7d32;
}
.state.success i {
  font-size: 1.5rem;
  margin-right: 0.4rem;
}
.alerts-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
}
.row.warning {
  border-color: #ffe0b2;
  background: #fff8e1;
}
.row.critical {
  border-color: #f5c6cb;
  background: #fdecea;
}
.row-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.warning {
  background: #fb8c00;
}
.dot.critical {
  background: #c62828;
}
.name {
  font-weight: 700;
  color: #1a2634;
}
.meta {
  font-size: 0.78rem;
  color: #5e6f8d;
  margin-top: 0.1rem;
}
.row-right {
  text-align: right;
  flex-shrink: 0;
}
.days {
  display: block;
  font-weight: 700;
  color: #1a2634;
  font-size: 0.85rem;
}
.last {
  display: block;
  font-size: 0.72rem;
  color: #5e6f8d;
  margin-top: 0.15rem;
}
</style>
