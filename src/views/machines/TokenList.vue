<template>
  <div class="token-list-page">
    <div class="list-card">
      <!-- ============================
           Hero Header
           ============================ -->
      <header class="page-hero">
        <div class="hero-left">
          <div class="hero-icon">
            <i class="fas fa-coins"></i>
          </div>
          <div class="hero-text">
            <h2>Kiasi Kilichoachwa</h2>
            <p class="subtitle">
              <i class="fas fa-calendar-day"></i>
              {{
                filters.from === filters.to
                  ? `Tarehe: ${formatDate(filters.from)}`
                  : `${formatDate(filters.from)} — ${formatDate(filters.to)}`
              }}
            </p>
          </div>
        </div>

        <div class="hero-badge" v-if="summary.grand_total > 0">
          <span class="hero-badge-label">Jumla</span>
          <span class="hero-badge-value"> TZS {{ formatCurrency(summary.grand_total) }} </span>
        </div>
      </header>

      <!-- ============================
           Filters
           ============================ -->
      <div class="filters">
        <div class="filter-group">
          <label for="from">
            <i class="fas fa-calendar-check"></i>
            Kutoka
          </label>
          <input id="from" type="date" v-model="filters.from" class="form-control" />
        </div>
        <div class="filter-group">
          <label for="to">
            <i class="fas fa-calendar-day"></i>
            Hadi
          </label>
          <input id="to" type="date" v-model="filters.to" class="form-control" />
        </div>
        <button class="btn-filter" @click="loadData" :disabled="tokenStore.loadingGroups">
          <i v-if="tokenStore.loadingGroups" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-search"></i>
          <span>Chuja</span>
        </button>
        <button class="btn-today" @click="showToday" :disabled="tokenStore.loadingGroups">
          <i class="fas fa-calendar-day"></i>
          <span>Leo</span>
        </button>
      </div>

      <!-- ============================
           Loading
           ============================ -->
      <div v-if="tokenStore.loadingGroups" class="state-block">
        <div class="spinner-lg"></div>
        <span class="state-text">Inapakia taarifa...</span>
      </div>

      <!-- ============================
           Error
           ============================ -->
      <div v-else-if="tokenStore.error" class="state-block state-error">
        <div class="state-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <span class="state-text">{{ tokenStore.error }}</span>
        <button class="state-retry" @click="loadData">
          <i class="fas fa-redo"></i> Jaribu tena
        </button>
      </div>

      <!-- ============================
           Empty
           ============================ -->
      <div v-else-if="!groups.length" class="state-block state-empty">
        <div class="state-icon">
          <i class="fas fa-inbox"></i>
        </div>
        <span class="state-title">Hakuna rekodi</span>
        <span class="state-text">
          Hakuna rekodi zilizopatikana kwa
          <strong>{{ formatDate(filters.from) }}</strong>
          <template v-if="filters.from !== filters.to">
            — <strong>{{ formatDate(filters.to) }}</strong>
          </template>
        </span>
        <button class="state-retry state-retry-alt" @click="showToday">
          <i class="fas fa-calendar-day"></i> Onyesha za Leo
        </button>
      </div>

      <!-- ============================
           Content
           ============================ -->
      <div v-else>
        <!-- Grand summary: 3 stat cards -->
        <div class="stats-grid">
          <div class="stat-card stat-primary">
            <div class="stat-icon">
              <i class="fas fa-wallet"></i>
            </div>
            <div class="stat-body">
              <span class="stat-label">Jumla Kuu</span>
              <span class="stat-value"> TZS {{ formatCurrency(summary.grand_total) }} </span>
            </div>
          </div>

          <div class="stat-card stat-info">
            <div class="stat-icon">
              <i class="fas fa-store"></i>
            </div>
            <div class="stat-body">
              <span class="stat-label">Matawi</span>
              <span class="stat-value">{{ formatNumber(summary.total_branches) }}</span>
            </div>
          </div>

          <div class="stat-card stat-warning">
            <div class="stat-icon">
              <i class="fas fa-receipt"></i>
            </div>
            <div class="stat-body">
              <span class="stat-label">Rekodi</span>
              <span class="stat-value">{{ formatNumber(summary.total_tokens) }}</span>
            </div>
          </div>
        </div>

        <!-- Hint -->
        <p class="expand-hint">
          <i class="fas fa-info-circle"></i>
          Bonyeza tawi kuona rekodi za kila siku na maelezo ya kila machine
        </p>

        <!-- Branch groups -->
        <div class="groups">
          <div
            v-for="group in groups"
            :key="group.branch_id"
            class="group-card"
            :class="{ open: openBranches.includes(group.branch_id) }"
          >
            <!-- Group header -->
            <button type="button" class="group-header" @click="toggleBranch(group.branch_id)">
              <div class="group-left">
                <div class="group-icon">
                  <i class="fas fa-store"></i>
                </div>
                <div class="group-info">
                  <div class="group-name">{{ group.branch_name }}</div>
                  <div class="group-meta">
                    <span class="meta-chip">
                      <i class="fas fa-receipt"></i>
                      {{ group.token_count }}
                    </span>
                    <span v-if="group.location" class="meta-chip">
                      <i class="fas fa-map-marker-alt"></i>
                      {{ group.location }}
                    </span>

                    <!-- ALWAYS VISIBLE: branch & machine split -->
                    <span v-if="group.branch_total > 0" class="meta-chip chip-branch">
                      <i class="fas fa-store"></i>
                      Tawi: {{ formatCurrency(group.branch_total) }}
                    </span>
                    <span v-if="group.machine_total > 0" class="meta-chip chip-machine">
                      <i class="fas fa-microchip"></i>
                      Mashine: {{ formatCurrency(group.machine_total) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="group-right">
                <!-- ALWAYS VISIBLE: total -->
                <div class="group-total-wrap">
                  <span class="group-total-label">Jumla</span>
                  <span class="group-total"> TZS {{ formatCurrency(group.total_amount) }} </span>
                </div>

                <div class="chevron-wrap">
                  <i
                    class="fas chevron"
                    :class="
                      openBranches.includes(group.branch_id) ? 'fa-chevron-up' : 'fa-chevron-down'
                    "
                  ></i>
                </div>
              </div>
            </button>

            <!-- Group body: date groups -->
            <transition name="expand">
              <div v-if="openBranches.includes(group.branch_id)" class="group-body">
                <div
                  v-for="dateGroup in group.date_groups"
                  :key="dateGroup.date"
                  class="date-group"
                >
                  <!-- Date header — with reading date prominently shown -->
                  <div class="date-header">
                    <div class="date-left">
                      <div class="date-icon">
                        <i class="far fa-calendar-alt"></i>
                      </div>
                      <div class="date-info">
                        <span class="date-label">Tarehe ya Kusoma</span>
                        <span class="date-text">{{ formatFullDate(dateGroup.date) }}</span>
                        <span class="date-count">
                          {{ dateGroup.tokens.length }}
                          {{ dateGroup.tokens.length === 1 ? 'rekodi' : 'rekodi' }}
                        </span>
                      </div>
                    </div>
                    <div class="date-right">
                      <span class="date-subtotal-label">Jumla ya Tarehe</span>
                      <span class="date-subtotal">
                        TZS {{ formatCurrency(dateGroup.subtotal) }}
                      </span>
                    </div>
                  </div>

                  <!-- Tokens table -->
                  <div class="table-wrap">
                    <table class="tokens-table">
                      <thead>
                        <tr>
                          <th>Aina</th>
                          <th>Mashine / Tawi</th>
                          <th>Reference</th>
                          <th>Aliyerekodi</th>
                          <th class="text-right">Kiasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="t in dateGroup.tokens" :key="t.id">
                          <td>
                            <span
                              class="type-badge"
                              :class="isBranchLevel(t) ? 'type-branch' : 'type-machine'"
                            >
                              <i
                                :class="isBranchLevel(t) ? 'fas fa-store' : 'fas fa-microchip'"
                              ></i>
                              {{ isBranchLevel(t) ? 'Tawi' : 'Mashine' }}
                            </span>
                          </td>

                          <td>
                            <template v-if="isBranchLevel(t)">
                              <span class="target-name">
                                <i class="fas fa-building"></i>
                                Tawi zima
                              </span>
                            </template>
                            <template v-else>
                              <div class="target-machine">
                                <span class="target-name">
                                  <i class="fas fa-microchip"></i>
                                  {{ t.machine?.name || 'Mashine' }}
                                </span>
                                <span v-if="t.machine?.serial_number" class="target-serial">
                                  SN: {{ t.machine.serial_number }}
                                </span>
                              </div>
                            </template>
                          </td>

                          <td>
                            <span class="ref">{{ t.reference }}</span>
                          </td>

                          <td>
                            <div v-if="t.user" class="user-chip">
                              <span class="user-avatar">
                                {{ userInitial(t.user.name) }}
                              </span>
                              <span class="user-name">{{ t.user.name }}</span>
                            </div>
                            <span v-else class="muted">—</span>
                          </td>

                          <td class="text-right amount-cell">
                            {{ formatCurrency(t.amount) }}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="4" class="text-right">
                            <strong>Jumla ya {{ formatDate(dateGroup.date) }}</strong>
                          </td>
                          <td class="text-right amount-cell strong">
                            {{ formatCurrency(dateGroup.subtotal) }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <!-- Branch footer -->
                <div class="branch-footer">
                  <div class="branch-footer-header">
                    <span class="branch-footer-label">
                      <i class="fas fa-calculator"></i>
                      Jumla ya Tawi
                    </span>
                    <span class="branch-footer-value">
                      TZS {{ formatCurrency(group.total_amount) }}
                    </span>
                  </div>

                  <div
                    v-if="group.branch_total > 0 || group.machine_total > 0"
                    class="branch-footer-split"
                  >
                    <!-- Visual bar -->
                    <div class="split-bar">
                      <div
                        class="split-bar-segment segment-branch"
                        :style="{ width: branchPct(group) + '%' }"
                      ></div>
                      <div
                        class="split-bar-segment segment-machine"
                        :style="{ width: machinePct(group) + '%' }"
                      ></div>
                    </div>

                    <div class="split-legend">
                      <span v-if="group.branch_total > 0" class="legend-item legend-branch">
                        <span class="legend-dot"></span>
                        Tawi
                        <strong>{{ formatCurrency(group.branch_total) }}</strong>
                      </span>
                      <span v-if="group.machine_total > 0" class="legend-item legend-machine">
                        <span class="legend-dot"></span>
                        Mashine
                        <strong>{{ formatCurrency(group.machine_total) }}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTokenStore } from '@/stores/tokens'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const tokenStore = useTokenStore()

/* ---------- Helpers ---------- */
const todayISO = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/* ---------- State ---------- */
/* DEFAULT: today's date for both from & to */
const filters = ref({
  from: todayISO(),
  to: todayISO(),
})

/* No branches expanded by default — user must click arrow to see detailed records */
const openBranches = ref([])

/* ---------- Computed ---------- */
const groups = computed(() => tokenStore.tokenGroups ?? [])
const summary = computed(
  () =>
    tokenStore.groupSummary ?? {
      grand_total: 0,
      total_tokens: 0,
      total_branches: 0,
    },
)

/* ---------- Helpers ---------- */
const isBranchLevel = (t) => {
  return t.is_branch_level === true || t.machine === null || t.machine_id === null
}

const toggleBranch = (id) => {
  const idx = openBranches.value.indexOf(id)
  if (idx === -1) openBranches.value.push(id)
  else openBranches.value.splice(idx, 1)
}

const userInitial = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const branchPct = (group) => {
  const total = group.total_amount || 0
  if (total <= 0) return 0
  return Math.round((group.branch_total / total) * 100)
}

const machinePct = (group) => {
  const total = group.total_amount || 0
  if (total <= 0) return 0
  return Math.round((group.machine_total / total) * 100)
}

/* Short date: "17 Sep 2026" */
const formatDate = (date) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    return d.toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

/* Full date with weekday: "Alhamisi, 17 Sep 2026" */
const formatFullDate = (date) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    return d.toLocaleDateString('sw-TZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

/* ---------- Transform: add date groups + totals per branch ---------- */
const enrichGroups = (rawGroups) => {
  return rawGroups.map((g) => {
    const tokens = Array.isArray(g.tokens) ? g.tokens : []

    const branchTotal = tokens
      .filter((t) => isBranchLevel(t))
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    const machineTotal = tokens
      .filter((t) => !isBranchLevel(t))
      .reduce((s, t) => s + Number(t.amount || 0), 0)

    const byDate = {}
    tokens.forEach((t) => {
      const date = t.created_date || (t.created_at || '').split('T')[0] || 'unknown'
      if (!byDate[date]) byDate[date] = []
      byDate[date].push(t)
    })

    const dateGroups = Object.keys(byDate)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((date) => {
        const items = byDate[date].slice().sort((a, b) => {
          const aBranch = isBranchLevel(a) ? 0 : 1
          const bBranch = isBranchLevel(b) ? 0 : 1
          if (aBranch !== bBranch) return aBranch - bBranch
          return (a.machine?.name || '').localeCompare(b.machine?.name || '')
        })

        const subtotal = items.reduce((s, t) => s + Number(t.amount || 0), 0)

        return { date, tokens: items, subtotal }
      })

    return {
      ...g,
      branch_total: branchTotal,
      machine_total: machineTotal,
      date_groups: dateGroups,
    }
  })
}

/* ---------- Data loading ---------- */
const loadData = async () => {
  const params = {}
  if (filters.value.from) params.from = filters.value.from
  if (filters.value.to) params.to = filters.value.to

  try {
    await tokenStore.fetchTokensGroupedByBranch(params)
    /* Collapse all branches on new load — user opens manually */
    openBranches.value = []
  } catch (err) {
    console.error('fetchTokensGroupedByBranch error:', err)
  }
}

/* Jump to today */
const showToday = () => {
  filters.value.from = todayISO()
  filters.value.to = todayISO()
  loadData()
}

/* Load today's data on mount */
onMounted(loadData)
</script>

<style scoped>
/* =========================================================
   Base layout
   ========================================================= */
.token-list-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.list-card {
  background: #ffffff;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* =========================================================
   Hero header
   ========================================================= */
.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #eef6fe 0%, #e0f2fe 50%, #f0f9ff 100%);
  border: 1px solid rgba(30, 136, 229, 0.12);
  flex-wrap: wrap;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  flex: 1;
}

.hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #fff;
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  box-shadow: 0 10px 20px rgba(30, 136, 229, 0.3);
  flex-shrink: 0;
  position: relative;
}
.hero-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
  pointer-events: none;
}

.hero-text {
  min-width: 0;
}
.hero-text h2 {
  margin: 0;
  font-size: 1.35rem;
  color: #0f2745;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
}
.subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: #475f8a;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.subtitle i {
  font-size: 0.75rem;
  color: #1e88e5;
}

.hero-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  padding: 0.7rem 1.15rem;
  background: #ffffff;
  border-radius: 0.85rem;
  border: 1px solid rgba(30, 136, 229, 0.2);
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.08);
  flex-shrink: 0;
}
.hero-badge-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.hero-badge-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0d47a1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* =========================================================
   Filters
   ========================================================= */
.filters {
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 0.75rem;
  align-items: end;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.85rem;
  margin-bottom: 1.25rem;
  border: 1px solid #eef2f7;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
.filter-group label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.filter-group label i {
  color: #1e88e5;
  font-size: 0.7rem;
}
.form-control {
  width: 100%;
  padding: 0.6rem 0.85rem;
  font-size: 0.9rem;
  border-radius: 0.6rem;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  color: #1a2634;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.form-control:focus {
  border-color: #1e88e5;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.12);
}

.btn-filter,
.btn-today {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border-radius: 0.6rem;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.btn-filter {
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  color: #fff;
  box-shadow: 0 4px 10px rgba(30, 136, 229, 0.25);
}
.btn-filter:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(30, 136, 229, 0.35);
}
.btn-today {
  background: #ffffff;
  color: #1e88e5;
  border: 1.5px solid #90caf9;
}
.btn-today:hover:not(:disabled) {
  background: #e3f2fd;
  border-color: #1e88e5;
  color: #0d47a1;
}
.btn-filter:disabled,
.btn-today:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* =========================================================
   Expand hint
   ========================================================= */
.expand-hint {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.85rem;
  padding: 0.6rem 0.85rem;
  background: #f0f9ff;
  border: 1px dashed #90caf9;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  color: #1e5a96;
  font-weight: 500;
}
.expand-hint i {
  color: #1e88e5;
}

/* =========================================================
   Stats grid
   ========================================================= */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  border-radius: 0.85rem;
  border: 1px solid;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  border-radius: 0 4px 4px 0;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.stat-primary {
  background: linear-gradient(135deg, #eef6fe, #e0f2fe);
  border-color: rgba(30, 136, 229, 0.2);
}
.stat-primary::before {
  background: #1e88e5;
}
.stat-primary .stat-icon {
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  color: #fff;
}

.stat-info {
  background: linear-gradient(135deg, #e8f5e9, #dcedc8);
  border-color: rgba(46, 125, 50, 0.2);
}
.stat-info::before {
  background: #43a047;
}
.stat-info .stat-icon {
  background: linear-gradient(135deg, #43a047, #1b5e20);
  color: #fff;
}

.stat-warning {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  border-color: rgba(251, 140, 0, 0.2);
}
.stat-warning::before {
  background: #fb8c00;
}
.stat-warning .stat-icon {
  background: linear-gradient(135deg, #fb8c00, #bf5e00);
  color: #fff;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f2745;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

/* =========================================================
   Groups
   ========================================================= */
.groups {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.group-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #ffffff;
  transition: all 0.25s ease;
}
.group-card.open {
  border-color: #90caf9;
  box-shadow: 0 8px 20px rgba(30, 136, 229, 0.1);
}

/* Group header */
.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 0.2s ease;
}
.group-header:hover {
  background: #f1f8ff;
}
.group-card.open .group-header {
  background: linear-gradient(135deg, #eef6fe, #e0f2fe);
  border-bottom: 1px solid #d6e8f7;
}

.group-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  flex: 1;
}

.group-icon {
  width: 44px;
  height: 44px;
  border-radius: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #43a047, #1b5e20);
  font-size: 1.05rem;
  flex-shrink: 0;
  box-shadow: 0 6px 12px rgba(46, 125, 50, 0.25);
}

.group-info {
  min-width: 0;
  flex: 1;
}

.group-name {
  font-size: 1rem;
  font-weight: 700;
  color: #0f2745;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.group-meta {
  display: flex;
  gap: 0.45rem;
  font-size: 0.72rem;
  color: #5e6f8d;
  margin-top: 0.35rem;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-weight: 600;
  color: #5e6f8d;
  white-space: nowrap;
}
.meta-chip i {
  font-size: 0.65rem;
  color: #1e88e5;
}
.meta-chip.chip-branch {
  background: #e8f5e9;
  border-color: rgba(46, 125, 50, 0.2);
  color: #1b5e20;
}
.meta-chip.chip-branch i {
  color: #1b5e20;
}
.meta-chip.chip-machine {
  background: #fff3e0;
  border-color: rgba(251, 140, 0, 0.25);
  color: #bf5e00;
}
.meta-chip.chip-machine i {
  color: #bf5e00;
}

.group-right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}

.group-total-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}
.group-total-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.group-total {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0d47a1;
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.chevron-wrap {
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.group-header:hover .chevron-wrap {
  background: #e3f2fd;
  border-color: #90caf9;
}
.chevron {
  font-size: 0.75rem;
  color: #5e6f8d;
  transition: transform 0.25s ease;
}
.group-card.open .chevron {
  color: #1e88e5;
}

/* =========================================================
   Group body + expand transition
   ========================================================= */
.group-body {
  padding: 1rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 3000px;
}

/* =========================================================
   Date group
   ========================================================= */
.date-group {
  border: 1px solid #e8eef5;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #ffffff;
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #e3f2fd, #d6e8f7);
  border-bottom: 1px solid #b8d8f0;
  flex-wrap: wrap;
}

.date-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.date-icon {
  width: 36px;
  height: 36px;
  border-radius: 0.55rem;
  background: #ffffff;
  color: #0d47a1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(13, 71, 161, 0.12);
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.date-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: #0d47a1;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.date-text {
  font-size: 0.88rem;
  font-weight: 800;
  color: #0f2745;
  letter-spacing: -0.01em;
}
.date-count {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  color: #5e6f8d;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  white-space: nowrap;
  width: fit-content;
  margin-top: 0.1rem;
}

.date-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}
.date-subtotal-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: #0d47a1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.date-subtotal {
  font-size: 1rem;
  font-weight: 800;
  color: #0d47a1;
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* =========================================================
   Table
   ========================================================= */
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.tokens-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.tokens-table th {
  background: #f8fafc;
  color: #5e6f8d;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.66rem;
  letter-spacing: 0.05em;
  text-align: left;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.tokens-table td {
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid #f1f3f8;
  color: #1a2634;
  vertical-align: middle;
}
.tokens-table tbody tr:last-child td {
  border-bottom: none;
}
.tokens-table tbody tr:hover {
  background: #fafbfd;
}
.tokens-table tfoot td {
  background: #eef6fe;
  font-weight: 700;
  color: #0d47a1;
  border-top: 2px solid #d6e8f7;
  font-size: 0.82rem;
  padding: 0.6rem 0.9rem;
}
.text-right {
  text-align: right;
}
.amount-cell {
  font-weight: 700;
  color: #0d47a1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.amount-cell.strong {
  font-size: 0.9rem;
  font-weight: 800;
}

/* Type badge */
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  border: 1px solid transparent;
}
.type-badge i {
  font-size: 0.62rem;
}
.type-branch {
  background: #e8f5e9;
  color: #1b5e20;
  border-color: rgba(46, 125, 50, 0.2);
}
.type-machine {
  background: #fff3e0;
  color: #bf5e00;
  border-color: rgba(251, 140, 0, 0.25);
}

/* Target name */
.target-name {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  color: #0f2745;
  font-size: 0.85rem;
}
.target-name i {
  color: #5e6f8d;
  font-size: 0.72rem;
}
.target-machine {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.target-serial {
  font-size: 0.68rem;
  color: #5e6f8d;
  font-family: ui-monospace, monospace;
}

/* Reference */
.ref {
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  background: #f1f3f8;
  padding: 0.18rem 0.5rem;
  border-radius: 0.35rem;
  color: #2c3e66;
  display: inline-block;
  word-break: break-all;
  border: 1px solid #e8eef5;
}

/* User chip */
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}
.user-name {
  font-weight: 500;
  color: #2c3e66;
}
.muted {
  color: #b0b8c7;
}

/* =========================================================
   Branch footer
   ========================================================= */
.branch-footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1.15rem;
  background: linear-gradient(135deg, #eef6fe, #d6e8f7);
  border: 1px solid #b8d8f0;
  border-radius: 0.75rem;
}

.branch-footer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.branch-footer-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #0d47a1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.branch-footer-label i {
  font-size: 0.75rem;
}
.branch-footer-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0d47a1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* Split bar */
.branch-footer-split {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed rgba(13, 71, 161, 0.25);
}

.split-bar {
  display: flex;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}
.split-bar-segment {
  height: 100%;
  transition: width 0.4s ease;
}
.segment-branch {
  background: linear-gradient(90deg, #43a047, #1b5e20);
}
.segment-machine {
  background: linear-gradient(90deg, #fb8c00, #bf5e00);
}

.split-legend {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #2c3e66;
}
.legend-item strong {
  font-weight: 800;
  color: #0d47a1;
  font-variant-numeric: tabular-nums;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-branch .legend-dot {
  background: #43a047;
}
.legend-machine .legend-dot {
  background: #fb8c00;
}

/* =========================================================
   State blocks (loading/error/empty)
   ========================================================= */
.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  border-radius: 0.85rem;
  background: #f8fafc;
  color: #5e6f8d;
  text-align: center;
}
.state-error {
  background: #fdecea;
  color: #c62828;
}
.state-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #b0b8c7;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}
.state-error .state-icon {
  color: #c62828;
  background: #ffffff;
}
.state-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f2745;
}
.state-text {
  font-size: 0.9rem;
}
.state-retry {
  margin-top: 0.5rem;
  padding: 0.55rem 1.1rem;
  border-radius: 0.6rem;
  background: #c62828;
  color: #fff;
  border: none;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}
.state-retry:hover {
  background: #b71c1c;
  transform: translateY(-1px);
}
.state-retry-alt {
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
}
.state-retry-alt:hover {
  background: linear-gradient(135deg, #1976d2, #0a3d91);
}

.spinner-lg {
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

/* =========================================================
   RESPONSIVE — Tablet (≤ 992px)
   ========================================================= */
@media (max-width: 992px) {
  .token-list-page {
    padding: 1rem;
  }
  .list-card {
    padding: 1.5rem;
    border-radius: 1rem;
  }
  .filters {
    grid-template-columns: 1fr 1fr;
  }
}

/* =========================================================
   RESPONSIVE — Mobile (≤ 768px)
   ========================================================= */
@media (max-width: 768px) {
  .token-list-page {
    padding: 0.75rem;
  }
  .list-card {
    padding: 1rem;
    border-radius: 0.85rem;
  }

  /* Hero */
  .page-hero {
    padding: 1rem;
    gap: 0.75rem;
  }
  .hero-icon {
    width: 46px;
    height: 46px;
    font-size: 1.2rem;
    border-radius: 0.85rem;
  }
  .hero-text h2 {
    font-size: 1.05rem;
  }
  .subtitle {
    font-size: 0.76rem;
  }
  .hero-badge {
    padding: 0.5rem 0.85rem;
  }
  .hero-badge-value {
    font-size: 1rem;
  }

  /* Filters */
  .filters {
    padding: 0.85rem;
    gap: 0.6rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    grid-template-columns: 1fr 1fr;
  }
  .form-control {
    font-size: 16px;
    padding: 0.55rem 0.7rem;
  }
  .btn-filter,
  .btn-today {
    padding: 0.65rem 0.9rem;
    font-size: 0.85rem;
    min-height: 42px;
  }

  /* Expand hint */
  .expand-hint {
    font-size: 0.72rem;
    padding: 0.5rem 0.7rem;
  }

  /* Stats */
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.55rem;
    margin-bottom: 1rem;
  }
  .stat-card {
    padding: 0.85rem 1rem;
  }
  .stat-icon {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }
  .stat-value {
    font-size: 1rem;
  }

  /* Group header */
  .group-header {
    padding: 0.85rem 0.9rem;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .group-icon {
    width: 38px;
    height: 38px;
    font-size: 0.9rem;
    border-radius: 0.7rem;
  }
  .group-name {
    font-size: 0.95rem;
  }
  .group-meta {
    font-size: 0.68rem;
    gap: 0.35rem;
  }
  .meta-chip {
    padding: 0.12rem 0.45rem;
    font-size: 0.66rem;
  }
  .group-total {
    font-size: 0.95rem;
  }
  .chevron-wrap {
    width: 28px;
    height: 28px;
  }

  /* Body */
  .group-body {
    padding: 0.75rem 0.75rem 1rem;
    gap: 0.65rem;
  }

  /* Date header */
  .date-header {
    padding: 0.6rem 0.75rem;
  }
  .date-icon {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }
  .date-text {
    font-size: 0.82rem;
  }
  .date-count {
    font-size: 0.6rem;
  }
  .date-subtotal {
    font-size: 0.9rem;
  }
  .date-subtotal-label {
    font-size: 0.58rem;
  }
  .date-label {
    font-size: 0.55rem;
  }

  /* ---------- TABLE → STACKED CARDS ---------- */
  .table-wrap {
    border: none;
    border-radius: 0;
    overflow: visible;
  }
  .tokens-table,
  .tokens-table thead,
  .tokens-table tbody,
  .tokens-table tfoot,
  .tokens-table tr,
  .tokens-table th,
  .tokens-table td {
    display: block;
    width: 100%;
  }
  .tokens-table thead {
    display: none;
  }
  .tokens-table tbody tr {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 0.6rem;
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.5rem;
    white-space: normal;
  }
  .tokens-table tbody tr:hover {
    background: #f8fafc;
  }
  .tokens-table tbody tr:last-child {
    margin-bottom: 0;
  }
  .tokens-table tbody td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.35rem 0;
    border-bottom: 1px dashed #eef2f7;
    white-space: normal;
    text-align: right;
  }
  .tokens-table tbody td:last-child {
    border-bottom: none;
    padding-bottom: 0.25rem;
  }
  .tokens-table tbody td:first-child {
    padding-top: 0.25rem;
  }

  /* Auto labels */
  .tokens-table tbody td:nth-child(1)::before {
    content: 'Aina';
    flex-shrink: 0;
    font-size: 0.68rem;
    font-weight: 700;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .tokens-table tbody td:nth-child(2)::before {
    content: 'Mashine / Tawi';
    flex-shrink: 0;
    font-size: 0.68rem;
    font-weight: 700;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .tokens-table tbody td:nth-child(3)::before {
    content: 'Reference';
    flex-shrink: 0;
    font-size: 0.68rem;
    font-weight: 700;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .tokens-table tbody td:nth-child(4)::before {
    content: 'Aliyerekodi';
    flex-shrink: 0;
    font-size: 0.68rem;
    font-weight: 700;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .tokens-table tbody td:nth-child(5)::before {
    content: 'Kiasi';
    flex-shrink: 0;
    font-size: 0.68rem;
    font-weight: 700;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }

  /* Date group footer */
  .tokens-table tfoot {
    display: block;
    margin-top: 0.5rem;
  }
  .tokens-table tfoot tr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    background: #eef6fe;
    padding: 0.65rem 0.8rem;
    border: 1px solid #d6e8f7;
    border-radius: 0.6rem;
  }
  .tokens-table tfoot td {
    display: inline;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 0.85rem;
    text-align: right;
  }
  .tokens-table tfoot td:first-child {
    color: #5e6f8d;
    font-weight: 600;
    text-align: left;
  }

  /* Branch footer */
  .branch-footer {
    padding: 0.75rem 0.9rem;
  }
  .branch-footer-label {
    font-size: 0.72rem;
  }
  .branch-footer-value {
    font-size: 1rem;
  }
  .legend-item {
    font-size: 0.68rem;
  }
}

/* =========================================================
   RESPONSIVE — Small mobile (≤ 480px)
   ========================================================= */
@media (max-width: 480px) {
  .token-list-page {
    padding: 0.5rem;
  }
  .list-card {
    padding: 0.85rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  }

  /* Hero */
  .page-hero {
    padding: 0.85rem;
    gap: 0.6rem;
  }
  .hero-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
    border-radius: 0.7rem;
  }
  .hero-text h2 {
    font-size: 0.95rem;
  }
  .subtitle {
    font-size: 0.7rem;
  }
  .hero-badge {
    padding: 0.4rem 0.7rem;
    border-radius: 0.6rem;
  }
  .hero-badge-label {
    font-size: 0.58rem;
  }
  .hero-badge-value {
    font-size: 0.9rem;
  }

  /* Filters → single column */
  .filters {
    grid-template-columns: 1fr;
    padding: 0.75rem;
    gap: 0.55rem;
  }

  /* Expand hint */
  .expand-hint {
    font-size: 0.68rem;
    padding: 0.45rem 0.6rem;
    gap: 0.35rem;
  }

  /* Stats */
  .stat-card {
    padding: 0.75rem 0.85rem;
  }
  .stat-icon {
    width: 34px;
    height: 34px;
    font-size: 0.9rem;
    border-radius: 0.6rem;
  }
  .stat-value {
    font-size: 0.92rem;
  }
  .stat-label {
    font-size: 0.62rem;
  }

  /* Group header tighter */
  .group-header {
    padding: 0.7rem 0.75rem;
    gap: 0.5rem;
  }
  .group-left {
    gap: 0.55rem;
  }
  .group-icon {
    width: 34px;
    height: 34px;
    font-size: 0.82rem;
  }
  .group-name {
    font-size: 0.88rem;
  }
  .group-meta {
    font-size: 0.62rem;
    gap: 0.3rem;
  }
  .meta-chip {
    padding: 0.1rem 0.4rem;
    font-size: 0.6rem;
  }
  .group-total {
    font-size: 0.85rem;
  }
  .group-total-label {
    font-size: 0.55rem;
  }
  .chevron-wrap {
    width: 26px;
    height: 26px;
  }

  .group-body {
    padding: 0.5rem 0.6rem 0.75rem;
  }

  /* Date header */
  .date-header {
    padding: 0.5rem 0.65rem;
    gap: 0.4rem;
  }
  .date-icon {
    width: 28px;
    height: 28px;
    font-size: 0.78rem;
  }
  .date-text {
    font-size: 0.78rem;
  }
  .date-count {
    font-size: 0.58rem;
  }
  .date-subtotal {
    font-size: 0.85rem;
  }

  /* Stacked cards tighter */
  .tokens-table tbody tr {
    padding: 0.5rem 0.65rem;
  }
  .tokens-table tbody td {
    font-size: 0.78rem;
    padding: 0.3rem 0;
  }
  .tokens-table tbody td::before {
    font-size: 0.62rem;
  }
  .ref {
    font-size: 0.68rem;
    padding: 0.12rem 0.4rem;
  }
  .type-badge {
    font-size: 0.62rem;
    padding: 0.15rem 0.5rem;
  }
  .user-avatar {
    width: 20px;
    height: 20px;
    font-size: 0.62rem;
  }
  .user-name {
    font-size: 0.78rem;
  }

  .tokens-table tfoot tr {
    padding: 0.5rem 0.65rem;
  }
  .tokens-table tfoot td {
    font-size: 0.78rem;
  }

  /* Branch footer tighter */
  .branch-footer {
    padding: 0.65rem 0.75rem;
  }
  .branch-footer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .branch-footer-value {
    font-size: 1.05rem;
  }
  .split-legend {
    gap: 0.6rem;
  }
  .legend-item {
    font-size: 0.62rem;
  }
}

/* =========================================================
   Touch devices — bigger tap targets
   ========================================================= */
@media (hover: none) and (pointer: coarse) {
  .group-header {
    min-height: 60px;
  }
  .btn-filter,
  .btn-today {
    min-height: 44px;
  }
  .form-control {
    min-height: 44px;
  }
}
</style>
