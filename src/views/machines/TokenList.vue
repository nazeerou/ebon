<template>
  <div class="token-list-page">
    <div class="list-card">
      <!-- Header -->
      <header class="list-header">
        <div class="header-icon">
          <i class="fas fa-list-ul"></i>
        </div>
        <div class="header-text">
          <h2>Kiasi Kichoachwa</h2>
          <p class="subtitle">Pesa zote zimegawanywa kwa Tawi</p>
        </div>
      </header>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Kutoka</label>
          <input type="date" v-model="filters.from" class="form-control" />
        </div>
        <div class="filter-group">
          <label>Hadi</label>
          <input type="date" v-model="filters.to" class="form-control" />
        </div>
        <button class="btn-filter" @click="loadData" :disabled="tokenStore.loadingGroups">
          <i v-if="tokenStore.loadingGroups" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-search"></i>
          Chuja
        </button>
      </div>

      <!-- Loading -->
      <div v-if="tokenStore.loadingGroups" class="loading-inline">
        <div class="spinner-sm"></div>
        <span>Inapakia taarifa...</span>
      </div>

      <!-- Error -->
      <div v-else-if="tokenStore.error" class="error-inline">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ tokenStore.error }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="!groups.length" class="empty-inline">
        <i class="fas fa-inbox"></i>
        <span>Hakuna tokens zilizopatikana.</span>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Summary strip -->
        <div class="summary-strip">
          <div class="summary-item">
            <span class="summary-label">Jumla ya Kiasi Kilichoachwa</span>
            <span class="summary-value amount">
              {{ formatCurrency(summary.grand_total) }}
            </span>
          </div>

          <div class="summary-item">
            <span class="summary-label">Matawi</span>
            <span class="summary-value">{{ formatNumber(summary.total_branches) }}</span>
          </div>
        </div>

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
                    <span><i class="fas fa-receipt"></i> {{ group.token_count }} Idadi</span>
                    <span v-if="group.location">
                      <i class="fas fa-map-marker-alt"></i> {{ group.location }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="group-right">
                <div class="group-total">
                  <!-- {{ formatCurrency(group.total_amount) }} -->
                </div>
                <i
                  class="fas chevron"
                  :class="
                    openBranches.includes(group.branch_id) ? 'fa-chevron-up' : 'fa-chevron-down'
                  "
                ></i>
              </div>
            </button>

            <!-- Group body: tokens table -->
            <div v-if="openBranches.includes(group.branch_id)" class="group-body">
              <div class="table-wrap">
                <table class="tokens-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Tarehe</th>
                      <th>Aliyerekodi</th>
                      <th class="text-right" style="text-align: right">Kiasi Kilichoachwa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in group.tokens" :key="t.id">
                      <td>
                        <span class="ref">{{ t.reference }}</span>
                      </td>
                      <td>{{ formatDate(t.created_date) }}</td>

                      <td>
                        <span v-if="t.user">{{ t.user.name }}</span>
                        <span v-else class="muted">—</span>
                      </td>
                      <td class="text-right amount-cell">
                        {{ formatCurrency(t.amount) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <!-- <td colspan="3" class="text-right">
                        <strong>Jumla ya tawi</strong>
                      </td>
                      <td class="text-right">
                        <strong>{{ formatCurrency(group.total_amount) }}</strong>
                      </td> -->
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
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

/* ---------- State ---------- */
const filters = ref({
  from: '',
  to: '',
})

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
const toggleBranch = (id) => {
  const idx = openBranches.value.indexOf(id)
  if (idx === -1) openBranches.value.push(id)
  else openBranches.value.splice(idx, 1)
}

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

/* ---------- Data loading ---------- */
const loadData = async () => {
  const params = {}
  if (filters.value.from) params.from = filters.value.from
  if (filters.value.to) params.to = filters.value.to

  try {
    await tokenStore.fetchTokensGroupedByBranch(params)
    openBranches.value = groups.value.map((g) => g.branch_id)
  } catch (err) {
    console.error('fetchTokensGroupedByBranch error:', err)
  }
}

const resetFilters = () => {
  filters.value.from = ''
  filters.value.to = ''
  loadData()
}

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

/* ---------- Header ---------- */
.list-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #fff;
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  box-shadow: 0 8px 14px rgba(30, 136, 229, 0.25);
  flex-shrink: 0;
}
.header-text {
  min-width: 0;
}
.header-text h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a2634;
  line-height: 1.25;
}
.subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.9rem;
  color: #5e6f8d;
}

/* ---------- Filters ---------- */
.filters {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.75rem;
  align-items: end;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.85rem;
  margin-bottom: 1.25rem;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.03em;
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
.btn-reset {
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
.btn-reset {
  background: #eef2f7;
  color: #2c3e66;
}
.btn-reset:hover:not(:disabled) {
  background: #e2e8f0;
}
.btn-filter:disabled,
.btn-reset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---------- Summary strip (fixed: auto-fit instead of hard 3 cols) ---------- */
.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #eef6fe, #e3f2fd);
  border-radius: 0.85rem;
  border: 1px solid rgba(30, 136, 229, 0.15);
  margin-bottom: 1.5rem;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}
.summary-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.summary-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a2634;
  letter-spacing: -0.02em;
  word-break: break-word;
}
.summary-value.amount {
  color: #0d47a1;
}

/* ---------- Groups ---------- */
.groups {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.group-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #ffffff;
  transition: all 0.2s ease;
}
.group-card.open {
  border-color: #90caf9;
  box-shadow: 0 6px 16px rgba(30, 136, 229, 0.08);
}

/* ---------- Group header ---------- */
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
  background: #eef6fe;
  border-bottom: 1px solid #d6e8f7;
}
.group-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}
.group-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #43a047, #1b5e20);
  font-size: 1rem;
  flex-shrink: 0;
}
.group-info {
  min-width: 0;
  flex: 1;
}
.group-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1a2634;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.group-meta {
  display: flex;
  gap: 0.85rem;
  font-size: 0.75rem;
  color: #5e6f8d;
  margin-top: 0.15rem;
  flex-wrap: wrap;
}
.group-meta i {
  color: #1e88e5;
  margin-right: 0.2rem;
}
.group-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}
.group-total {
  font-size: 1rem;
  font-weight: 800;
  color: #0d47a1;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.chevron {
  font-size: 0.8rem;
  color: #5e6f8d;
  transition: transform 0.2s ease;
}

/* ---------- Group body ---------- */
.group-body {
  padding: 0.75rem 1.25rem 1.25rem;
  animation: slideDown 0.2s ease;
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- Table ---------- */
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 0.6rem;
  border: 1px solid #e2e8f0;
}
.tokens-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.tokens-table th {
  background: #f8fafc;
  color: #5e6f8d;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-align: left;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.tokens-table td {
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid #f1f3f8;
  color: #1a2634;
  white-space: nowrap;
}
.tokens-table tbody tr:last-child td {
  border-bottom: none;
}
.tokens-table tbody tr:hover {
  background: #f8fafc;
}
.tokens-table tfoot td {
  background: #eef6fe;
  font-weight: 700;
  color: #0d47a1;
  border-top: 2px solid #d6e8f7;
}
.text-right {
  text-align: right;
}
.amount-cell {
  font-weight: 700;
  color: #0d47a1;
}
.ref {
  font-family: ui-monospace, monospace;
  font-size: 0.78rem;
  background: #f1f3f8;
  padding: 0.15rem 0.5rem;
  border-radius: 0.35rem;
  color: #2c3e66;
  display: inline-block;
  word-break: break-all;
}
.muted {
  color: #b0b8c7;
}

/* ---------- Inline states ---------- */
.loading-inline,
.empty-inline,
.error-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 2.5rem 1rem;
  border-radius: 0.85rem;
  font-size: 0.95rem;
  background: #f8fafc;
  color: #5e6f8d;
  text-align: center;
}
.empty-inline i {
  font-size: 1.4rem;
  color: #b0b8c7;
}
.error-inline {
  background: #fdecea;
  color: #c62828;
}
.error-inline i {
  font-size: 1.2rem;
}
.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-top-color: #1e88e5;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
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
  .filters .btn-filter,
  .filters .btn-reset {
    grid-column: span 2;
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
    padding: 1.15rem;
    border-radius: 0.85rem;
  }

  /* Header */
  .list-header {
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .header-icon {
    width: 46px;
    height: 46px;
    font-size: 1.2rem;
    border-radius: 0.75rem;
  }
  .header-text h2 {
    font-size: 1.05rem;
  }
  .subtitle {
    font-size: 0.78rem;
  }

  /* Filters */
  .filters {
    padding: 0.85rem;
    gap: 0.6rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
  }
  .filter-group label {
    font-size: 0.7rem;
  }
  .form-control {
    font-size: 16px; /* prevents iOS zoom on focus */
    padding: 0.55rem 0.7rem;
  }
  .btn-filter,
  .btn-reset {
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
    min-height: 42px;
  }

  /* Summary */
  .summary-strip {
    padding: 0.85rem 1rem;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .summary-value {
    font-size: 1rem;
  }
  .summary-label {
    font-size: 0.65rem;
  }

  /* Group header */
  .group-header {
    padding: 0.85rem 0.9rem;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .group-icon {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
    border-radius: 0.6rem;
  }
  .group-name {
    font-size: 0.95rem;
  }
  .group-meta {
    font-size: 0.7rem;
    gap: 0.6rem;
  }
  .group-total {
    font-size: 0.95rem;
  }
  .group-right {
    gap: 0.5rem;
  }

  /* Group body */
  .group-body {
    padding: 0.5rem 0.75rem 1rem;
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
    padding: 0.5rem 0.75rem;
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
    padding: 0.4rem 0;
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
  /* Auto-generated labels since tds have no data-label */
  .tokens-table tbody td:nth-child(1)::before {
    content: 'Reference';
    flex-shrink: 0;
    font-size: 0.7rem;
    font-weight: 600;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .tokens-table tbody td:nth-child(2)::before {
    content: 'Tarehe';
    flex-shrink: 0;
    font-size: 0.7rem;
    font-weight: 600;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .tokens-table tbody td:nth-child(3)::before {
    content: 'Aliyerekodi';
    flex-shrink: 0;
    font-size: 0.7rem;
    font-weight: 600;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .tokens-table tbody td:nth-child(4)::before {
    content: 'Kiasi';
    flex-shrink: 0;
    font-size: 0.7rem;
    font-weight: 600;
    color: #5e6f8d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }

  /* Footer → single card */
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
    padding: 0.75rem 0.9rem;
    border: 1px solid #d6e8f7;
    border-radius: 0.6rem;
  }
  .tokens-table tfoot td {
    display: inline;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    text-align: right;
  }
  .tokens-table tfoot td:first-child {
    color: #5e6f8d;
    font-weight: 600;
    text-align: left;
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
    padding: 0.9rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  }

  .list-header {
    gap: 0.6rem;
    margin-bottom: 0.85rem;
  }
  .header-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
    border-radius: 0.6rem;
  }
  .header-text h2 {
    font-size: 0.95rem;
  }
  .subtitle {
    font-size: 0.72rem;
  }

  /* Filters → single column */
  .filters {
    grid-template-columns: 1fr;
    padding: 0.75rem;
    gap: 0.55rem;
  }
  .filters .btn-filter,
  .filters .btn-reset {
    grid-column: span 1;
    width: 100%;
  }

  /* Summary: stack with divider */
  .summary-strip {
    padding: 0.75rem 0.85rem;
    gap: 0.4rem;
  }
  .summary-item + .summary-item {
    padding-top: 0.5rem;
    border-top: 1px dashed #cfe3f8;
  }
  .summary-value {
    font-size: 0.95rem;
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
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
  .group-name {
    font-size: 0.88rem;
  }
  .group-meta {
    font-size: 0.66rem;
    gap: 0.5rem;
  }
  .group-total {
    font-size: 0.85rem;
  }
  .group-right {
    gap: 0.4rem;
  }
  .chevron {
    font-size: 0.7rem;
  }

  .group-body {
    padding: 0.4rem 0.6rem 0.75rem;
  }

  /* Stacked cards tighter */
  .tokens-table tbody tr {
    padding: 0.4rem 0.6rem;
  }
  .tokens-table tbody td {
    font-size: 0.78rem;
    padding: 0.35rem 0;
  }
  .tokens-table tbody td::before {
    font-size: 0.65rem;
  }
  .ref {
    font-size: 0.72rem;
    padding: 0.1rem 0.4rem;
  }

  .tokens-table tfoot tr {
    padding: 0.6rem 0.75rem;
  }
  .tokens-table tfoot td {
    font-size: 0.82rem;
  }
}

/* =========================================================
   Touch devices — bigger tap targets
   ========================================================= */
@media (hover: none) and (pointer: coarse) {
  .group-header {
    min-height: 56px;
  }
  .btn-filter,
  .btn-reset {
    min-height: 44px;
  }
  .form-control {
    min-height: 44px;
  }
}
</style>
