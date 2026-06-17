<template>
  <div class="dashboard">
    <!-- Loading -->
    <div v-if="dashboardStore.isLoading" class="loading">
      <div class="spinner"></div>
      <p>Inapakia dashboard...</p>
    </div>

    <!-- Error -->
    <div v-else-if="dashboardStore.getError" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ dashboardStore.getError }}</p>
      <button @click="loadDashboardData" class="btn-primary">Jaribu Tena</button>
    </div>

    <!-- Dashboard Content -->

    <div v-else class="dashboard-content">
      <!-- Admin view: 4 cards -->
      <template v-if="isAdmin">
        <h4>Karibu, {{ userName }}</h4>

        <div class="cards-grid">
          <!-- Card 1: Total Machines -->
          <div class="stat-card">
            <div class="card-left">
              <div class="card-icon blue">
                <i class="fas fa-microchip"></i>
              </div>
            </div>
            <div class="card-right">
              <div class="card-value">{{ formatNumber(dashboardData.total_machines ?? 0) }}</div>
              <div class="card-label">Jumla ya Mashine</div>
              <div class="card-badge">
                <i class="fas fa-check-circle"></i>
                {{ formatNumber(dashboardData.active_machines ?? 0) }} hai
              </div>
            </div>
          </div>

          <!-- Card 2: Branches -->
          <div class="stat-card">
            <div class="card-left">
              <div class="card-icon green">
                <i class="fas fa-store"></i>
              </div>
            </div>
            <div class="card-right">
              <div class="card-value">{{ formatNumber(dashboardData.branch_count ?? 0) }}</div>
              <div class="card-label">Matawi Yote</div>
              <div class="card-badge"><i class="fas fa-building"></i> Matawi ya Bonanza</div>
            </div>
          </div>

          <!-- Card 3: Total Revenue -->
          <div class="stat-card">
            <div class="card-left">
              <div class="card-icon orange">
                <i class="fas fa-chart-line"></i>
              </div>
            </div>
            <div class="card-right">
              <div class="card-label">Jumla ya Mapato</div>
              <div class="card-value">
                {{ formatCurrency(dashboardData.total_collections ?? 0) }}
              </div>
              <div class="card-badge"><i class="fas fa-clock"></i> Mwaka huu</div>
            </div>
          </div>

          <!-- Card 4: Today's Revenue -->
          <div class="stat-card">
            <div class="card-left">
              <div class="card-icon purple">
                <i class="fas fa-calendar-day"></i>
              </div>
            </div>
            <div class="card-right">
              <div class="card-label">Mapato ya Leo</div>
              <div class="card-value">{{ formatCurrency(dashboardData.today_revenue ?? 0) }}</div>
              <div class="card-badge positive">
                <i class="fas fa-arrow-up"></i> {{ todayGrowth }}% kuliko jana
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Manager view: welcome message -->
      <template v-else-if="isManager">
        <div class="manager-welcome">
          <div class="welcome-card">
            <div class="welcome-icon">
              <i class="fas fa-user-tie"></i>
            </div>
            <h2>Karibu, {{ userName }}</h2>
            <p class="subtitle">Mfumo wa utunzaji Taarifa za biashara</p>
            <div class="quick-links">
              <router-link to="/readings/ocr" class="quick-link">
                <i class="fas fa-camera"></i> Soma Meter
              </router-link>
              <router-link to="/machines" class="quick-link">
                <i class="fas fa-microchip"></i> Mashine Zote
              </router-link>
              <router-link to="/reports/daily" class="quick-link">
                <i class="fas fa-calendar-day"></i> Ripoti ya Siku
              </router-link>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const dashboardStore = useDashboardStore()
const authStore = useAuthStore()

const dashboardData = computed(() => dashboardStore.dashboardData)
const todayGrowth = computed(() => dashboardData.value.today_growth ?? 0)

// Role checks
const isAdmin = computed(() => authStore.user?.role === 'admin')
const isManager = computed(() => authStore.user?.role === 'manager')

// Manager name
const userName = computed(() => {
  if (authStore.user) {
    return authStore.user.first_name || authStore.user.name || authStore.user.username || 'Mtumiaji'
  }
  return 'Mtumiaji'
})

const loadDashboardData = async () => {
  try {
    await dashboardStore.refreshAll()
  } catch (err) {
    console.error('Dashboard load error:', err)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* Base */
.dashboard {
  min-height: 70vh;
}

.dashboard-content {
  max-width: 1440px;
  margin: 0 auto;
}

/* 4-column grid (admin) */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

/* Stat Card */
.stat-card {
  background: #ffffff;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.08);
}
.card-left {
  flex-shrink: 0;
}
.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  box-shadow: 0 8px 14px rgba(0, 0, 0, 0.1);
}
.card-icon.blue {
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
}
.card-icon.green {
  background: linear-gradient(135deg, #43a047, #1b5e20);
}
.card-icon.orange {
  background: linear-gradient(135deg, #fb8c00, #bf5e00);
}
.card-icon.purple {
  background: linear-gradient(135deg, #ab47bc, #4a148c);
}
.card-right {
  flex: 1;
  min-width: 0;
}
.card-value {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  color: #1a2634;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
  word-break: break-word;
}
.card-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 0.5rem;
}
.card-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f1f3f8;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #2c3e66;
}
.card-badge.positive {
  background: #e8f5e9;
  color: #2e7d32;
}
.card-badge i {
  font-size: 0.7rem;
}

/* Manager welcome */
.manager-welcome {
  display: flex;
  justify-content: center;
  align-items: center;
  /* min-height: 40vh; */
  /* padding: 2rem; */
}
.welcome-card {
  background: white;
  /* border-radius: 2rem; */
  padding: 0.2rem 1rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
  /* box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); */
}
.welcome-icon {
  font-size: 3rem;
  color: #1e88e5;
  margin-bottom: 1rem;
}
.welcome-card h1 {
  font-size: 1.2rem;
  color: #1a2634;
  margin-bottom: 0.5rem;
}
.subtitle {
  font-size: 1.1rem;
  color: #5e6f8d;
  margin-bottom: 2rem;
}
.quick-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.quick-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: #f0f4f8;
  border-radius: 2rem;
  color: #1a2634;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}
.quick-link:hover {
  background: #1e88e5;
  color: white;
  transform: translateY(-2px);
}
.quick-link i {
  font-size: 1rem;
}

/* Loading & Error */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  background: white;
  border-radius: 2rem;
  margin: 2rem;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #1e88e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-state {
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 2rem;
  margin: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.error-state i {
  font-size: 3rem;
  color: #e53935;
  margin-bottom: 1rem;
}
.btn-primary {
  background: #1e88e5;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 2rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 1rem;
}
.btn-primary:hover {
  background: #0b5e9e;
}

/* Responsive */
@media (max-width: 1200px) {
  .cards-grid {
    gap: 1.25rem;
  }
  .card-value {
    font-size: 1.9rem;
  }
}
@media (max-width: 992px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .dashboard {
    /* padding: 1rem; */
  }
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .stat-card {
    padding: 1.25rem;
  }
  .card-icon {
    width: 42px;
    height: 42px;
    font-size: 12px;
  }
  .card-value {
    font-size: 1.8rem;
  }
  .card-label {
    font-size: 0.8rem;
  }
  .card-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.65rem;
  }
  .welcome-card {
    /* padding: 2rem; */
  }
  .quick-links {
    flex-direction: column;
  }
}
</style>
