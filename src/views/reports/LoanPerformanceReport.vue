<template>
  <div class="loan-performance-report">
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card total">
        <div class="card-icon">
          <i class="fas fa-hand-holding-usd"></i>
        </div>
        <div class="card-content">
          <span class="card-label">Jumla ya Mikopo</span>
          <span class="card-value">{{ formatCurrency(data.totalAmount) }}</span>
          <span class="card-sub">Mikopo {{ data.totalLoans }}</span>
        </div>
      </div>

      <div class="summary-card average">
        <div class="card-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="card-content">
          <span class="card-label">Wastani wa Mkopo</span>
          <span class="card-value">{{ formatCurrency(data.averageLoanSize) }}</span>
        </div>
      </div>

      <div class="summary-card disbursed">
        <div class="card-icon">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="card-content">
          <span class="card-label">Mikopo Iliyotolewa Mwezi Huu</span>
          <span class="card-value">{{ formatCurrency(data.disbursedAmount) }}</span>
          <span class="card-sub">Mikopo {{ data.disbursedThisMonth }}</span>
        </div>
      </div>

      <div class="summary-card collected">
        <div class="card-icon">
          <i class="fas fa-coins"></i>
        </div>
        <div class="card-content">
          <span class="card-label">Malipo Mwezi Huu</span>
          <span class="card-value">{{ formatCurrency(data.collectedThisMonth) }}</span>
          <span class="card-sub rate">{{ data.collectionRate }}% ya mikopo</span>
        </div>
      </div>
    </div>

    <!-- Status Distribution Chart -->
    <div class="chart-card">
      <div class="card-header">
        <h3>
          <i class="fas fa-chart-pie"></i>
          Mgawanyo wa Mikopo kwa Hali
        </h3>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color active"></span>
            <span>Inaendelea ({{ data.byStatus.active }})</span>
          </div>
          <div class="legend-item">
            <span class="legend-color paid"></span>
            <span>Imelipwa ({{ data.byStatus.paid }})</span>
          </div>
          <div class="legend-item">
            <span class="legend-color defaulted"></span>
            <span>Imechelewa ({{ data.byStatus.defaulted }})</span>
          </div>
          <div class="legend-item">
            <span class="legend-color pending"></span>
            <span>Inasubiri ({{ data.byStatus.pending }})</span>
          </div>
        </div>
      </div>
      <div class="chart-container">
        <div class="status-chart">
          <div class="status-bar active" :style="{ width: getStatusPercentage('active') + '%' }">
            <span class="bar-label">{{ getStatusPercentage('active') }}%</span>
          </div>
          <div class="status-bar paid" :style="{ width: getStatusPercentage('paid') + '%' }">
            <span class="bar-label">{{ getStatusPercentage('paid') }}%</span>
          </div>
          <div
            class="status-bar defaulted"
            :style="{ width: getStatusPercentage('defaulted') + '%' }"
          >
            <span class="bar-label">{{ getStatusPercentage('defaulted') }}%</span>
          </div>
          <div class="status-bar pending" :style="{ width: getStatusPercentage('pending') + '%' }">
            <span class="bar-label">{{ getStatusPercentage('pending') }}%</span>
          </div>
        </div>

        <div class="status-details">
          <div class="status-row">
            <span class="status-name">Inaendelea</span>
            <span class="status-count">{{ data.byStatus.active }} mikopo</span>
            <span class="status-amount">{{ formatCurrency(getStatusAmount('active')) }}</span>
          </div>
          <div class="status-row">
            <span class="status-name">Imelipwa</span>
            <span class="status-count">{{ data.byStatus.paid }} mikopo</span>
            <span class="status-amount">{{ formatCurrency(getStatusAmount('paid')) }}</span>
          </div>
          <div class="status-row">
            <span class="status-name">Imechelewa</span>
            <span class="status-count">{{ data.byStatus.defaulted }} mikopo</span>
            <span class="status-amount">{{ formatCurrency(getStatusAmount('defaulted')) }}</span>
          </div>
          <div class="status-row">
            <span class="status-name">Inasubiri</span>
            <span class="status-count">{{ data.byStatus.pending }} mikopo</span>
            <span class="status-amount">{{ formatCurrency(getStatusAmount('pending')) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly Trend Chart -->
    <div class="chart-card">
      <div class="card-header">
        <h3>
          <i class="fas fa-chart-line"></i>
          Mwenendo wa Mikopo kwa Mwezi
        </h3>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-line disbursed"></span>
            <span>Mikopo Iliyotolewa</span>
          </div>
          <div class="legend-item">
            <span class="legend-line collected"></span>
            <span>Malipo Yaliyopokelewa</span>
          </div>
        </div>
      </div>
      <div class="chart-container">
        <div class="trend-chart">
          <div class="chart-grid">
            <div class="grid-line" v-for="i in 5" :key="i"></div>
          </div>

          <div class="bars-container">
            <div v-for="(item, index) in data.monthlyTrend" :key="index" class="bar-group">
              <div class="bars">
                <div
                  class="bar disbursed"
                  :style="{ height: getBarHeight(item.disbursed, 'disbursed') + 'px' }"
                  :title="`Mikopo Iliyotolewa: ${formatCurrency(item.disbursed)}`"
                >
                  <span class="bar-tooltip">{{ formatCurrency(item.disbursed) }}</span>
                </div>
                <div
                  class="bar collected"
                  :style="{ height: getBarHeight(item.collected, 'collected') + 'px' }"
                  :title="`Malipo: ${formatCurrency(item.collected)}`"
                >
                  <span class="bar-tooltip">{{ formatCurrency(item.collected) }}</span>
                </div>
              </div>
              <span class="bar-label">{{ item.month }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loan Portfolio Table -->
    <div class="table-card">
      <div class="card-header">
        <h3>
          <i class="fas fa-table"></i>
          Mikopo Kwa Kina
        </h3>
        <div class="table-actions">
          <button class="btn-icon" @click="exportTable" title="Pakua kama CSV">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon" @click="printTable" title="Chapisha">
            <i class="fas fa-print"></i>
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Namba ya Mkopo</th>
              <th>Mteja</th>
              <th>Kiasi</th>
              <th>Riba</th>
              <th>Jumla</th>
              <th>Imelipwa</th>
              <th>Imebaki</th>
              <th>Tarehe ya Kuanza</th>
              <th>Tarehe ya Kumaliza</th>
              <th>Hali</th>
              <th>Maafisa</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loan in paginatedLoans" :key="loan.id">
              <td>
                <router-link :to="`/loans/${loan.id}`" class="loan-link">
                  #{{ loan.loanNumber }}
                </router-link>
              </td>
              <td>
                <div class="customer-cell">
                  <img
                    :src="loan.customerAvatar || '/default-avatar.png'"
                    :alt="loan.customerName"
                    class="customer-avatar"
                  />
                  <span>{{ loan.customerName }}</span>
                </div>
              </td>
              <td class="amount">{{ formatCurrency(loan.amount) }}</td>
              <td class="interest">{{ loan.interestRate }}%</td>
              <td class="total">{{ formatCurrency(loan.totalAmount) }}</td>
              <td class="paid">{{ formatCurrency(loan.paidAmount) }}</td>
              <td class="balance" :class="{ 'text-danger': loan.balance > 0 }">
                {{ formatCurrency(loan.balance) }}
              </td>
              <td>{{ formatDate(loan.startDate) }}</td>
              <td>{{ formatDate(loan.endDate) }}</td>
              <td>
                <span class="status-badge" :class="loan.status">
                  {{ getStatusText(loan.status) }}
                </span>
              </td>
              <td>{{ loan.officerName }}</td>
            </tr>
            <tr v-if="paginatedLoans.length === 0">
              <td colspan="11" class="text-center">Hakuna mikopo inayoonyeshwa</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Pagination -->
      <div class="table-pagination">
        <div class="pagination-info">
          Showing {{ pagination.from }} - {{ pagination.to }} of {{ loans.length }} entries
        </div>
        <div class="pagination-buttons">
          <button
            class="btn-pagination"
            :disabled="pagination.currentPage === 1"
            @click="changePage(pagination.currentPage - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">
            Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
          </span>
          <button
            class="btn-pagination"
            :disabled="pagination.currentPage === pagination.totalPages"
            @click="changePage(pagination.currentPage + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Key Performance Indicators -->
    <div class="kpi-section">
      <h3>
        <i class="fas fa-chart-simple"></i>
        Viashiria Muhimu vya Utendaji
      </h3>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #e3f2fd; color: #1976d2">
            <i class="fas fa-percent"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Kiwango cha Ulipaji</span>
            <span class="kpi-value">{{ calculateRepaymentRate }}%</span>
            <span class="kpi-trend positive">
              <i class="fas fa-arrow-up"></i>
              3.2% kutoka mwezi uliopita
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background: #e8f5e8; color: #2e7d32">
            <i class="fas fa-clock"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Wastani wa Muda wa Mkopo</span>
            <span class="kpi-value">{{ averageLoanDuration }} miezi</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fff3e0; color: #ef6c00">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Mikopo Iliyochelewa</span>
            <span class="kpi-value">{{ data.byStatus.defaulted }}</span>
            <span class="kpi-trend negative">
              <i class="fas fa-arrow-up"></i>
              Thamani: {{ formatCurrency(getStatusAmount('defaulted')) }}
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background: #e8eaf6; color: #3949ab">
            <i class="fas fa-users"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Wastani wa Mikopo kwa Mteja</span>
            <span class="kpi-value">{{ averageLoansPerCustomer }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Options -->
    <div class="export-section">
      <button class="btn-export-excel" @click="exportToExcel">
        <i class="fas fa-file-excel"></i>
        Pakua kama Excel
      </button>
      <button class="btn-export-pdf" @click="exportToPDF">
        <i class="fas fa-file-pdf"></i>
        Pakua kama PDF
      </button>
      <button class="btn-export-csv" @click="exportToCSV">
        <i class="fas fa-file-csv"></i>
        Pakua kama CSV
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatCurrency, formatDate } from '@/utils/formatters'

// Props
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  filters: {
    type: Object,
    default: () => ({}),
  },
})

// Emits
const emit = defineEmits(['export'])

// State
const loans = ref([])
const pagination = ref({
  currentPage: 1,
  perPage: 10,
  totalPages: 1,
  from: 1,
  to: 10,
})

// Generate dummy loan data
const generateLoans = () => {
  const statuses = ['active', 'paid', 'defaulted', 'pending']
  const customers = [
    { name: 'Juma Mohamed', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Aisha Salim', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { name: 'Hamza Ali', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { name: 'Zainab Hassan', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { name: 'Ramadhan Omar', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  ]
  const officers = ['John Officer', 'Sarah Accountant', 'Michael Manager']

  return Array.from({ length: 45 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const amount = Math.floor(Math.random() * 5000000) + 500000
    const interestRate = Math.floor(Math.random() * 15) + 5
    const totalAmount = amount * (1 + interestRate / 100)
    const paidAmount =
      status === 'paid'
        ? totalAmount
        : status === 'active'
          ? Math.floor(Math.random() * totalAmount)
          : 0
    const balance = totalAmount - paidAmount

    return {
      id: i + 1,
      loanNumber: `LOAN-2024-${String(i + 1).padStart(4, '0')}`,
      customerName: customer.name,
      customerAvatar: customer.avatar,
      amount,
      interestRate,
      totalAmount,
      paidAmount,
      balance,
      startDate: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1)
        .toISOString()
        .split('T')[0],
      endDate: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1)
        .toISOString()
        .split('T')[0],
      status,
      officerName: officers[Math.floor(Math.random() * officers.length)],
    }
  })
}

// Computed
const getStatusPercentage = (status) => {
  const total = props.data.totalLoans
  if (!total) return 0
  return Math.round((props.data.byStatus[status] / total) * 100)
}

const getStatusAmount = (status) => {
  const percentages = {
    active: 0.68,
    paid: 0.19,
    defaulted: 0.08,
    pending: 0.05,
  }
  return props.data.totalAmount * (percentages[status] || 0)
}

const getBarHeight = (value, type) => {
  const maxValue = Math.max(
    ...props.data.monthlyTrend.map((m) => m.disbursed),
    ...props.data.monthlyTrend.map((m) => m.collected),
  )
  const maxHeight = 150
  return (value / maxValue) * maxHeight
}

const calculateRepaymentRate = computed(() => {
  const totalCollected = props.data.monthlyTrend.reduce((sum, m) => sum + m.collected, 0)
  const totalDisbursed = props.data.monthlyTrend.reduce((sum, m) => sum + m.disbursed, 0)
  if (totalDisbursed === 0) return 0
  return Math.round((totalCollected / totalDisbursed) * 100)
})

const averageLoanDuration = computed(() => {
  return 12 // Example value
})

const averageLoansPerCustomer = computed(() => {
  return (props.data.totalLoans / 1250).toFixed(1) // Assuming 1250 customers
})

const paginatedLoans = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.perPage
  const end = start + pagination.value.perPage
  return loans.value.slice(start, end)
})

// Methods
const getStatusText = (status) => {
  const texts = {
    active: 'Inaendelea',
    paid: 'Imelipwa',
    defaulted: 'Imechelewa',
    pending: 'Inasubiri',
  }
  return texts[status] || status
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.currentPage = page
    pagination.value.from = (page - 1) * pagination.value.perPage + 1
    pagination.value.to = Math.min(page * pagination.value.perPage, loans.value.length)
  }
}

// Export functions
const exportTable = () => {
  emit('export', { format: 'csv', type: 'loan-performance' })
}

const printTable = () => {
  window.print()
}

const exportToExcel = () => {
  emit('export', { format: 'excel', type: 'loan-performance' })
}

const exportToPDF = () => {
  emit('export', { format: 'pdf', type: 'loan-performance' })
}

const exportToCSV = () => {
  emit('export', { format: 'csv', type: 'loan-performance' })
}

// Lifecycle
onMounted(() => {
  loans.value = generateLoans()
  pagination.value.totalPages = Math.ceil(loans.value.length / pagination.value.perPage)
  pagination.value.to = Math.min(pagination.value.perPage, loans.value.length)
})
</script>

<style scoped>
.loan-performance-report {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.summary-card.total {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.summary-card.average {
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
}

.summary-card.disbursed {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.summary-card.collected {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.card-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card-content {
  flex: 1;
}

.card-label {
  display: block;
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 5px;
}

.card-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 3px;
}

.card-sub {
  display: block;
  font-size: 0.75rem;
  opacity: 0.8;
}

.card-sub.rate {
  color: #ffd700;
}

/* Chart Cards */
.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
  flex-wrap: wrap;
  gap: 15px;
}

.card-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.card-header h3 i {
  color: #3498db;
}

.chart-legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.active {
  background: #3498db;
}

.legend-color.paid {
  background: #27ae60;
}

.legend-color.defaulted {
  background: #e74c3c;
}

.legend-color.pending {
  background: #f39c12;
}

.legend-line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
}

.legend-line.disbursed {
  background: #3498db;
}

.legend-line.collected {
  background: #27ae60;
}

/* Status Chart */
.status-chart {
  display: flex;
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  transition: width 0.3s ease;
}

.status-bar.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.status-bar.paid {
  background: linear-gradient(135deg, #27ae60, #229954);
}

.status-bar.defaulted {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.status-bar.pending {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.bar-label {
  white-space: nowrap;
  padding: 0 10px;
}

.status-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.9rem;
}

.status-name {
  font-weight: 500;
  color: #333;
}

.status-count {
  color: #666;
}

.status-amount {
  color: #27ae60;
  font-weight: 600;
}

/* Trend Chart */
.trend-chart {
  position: relative;
  height: 250px;
  margin-top: 20px;
}

.chart-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  width: 100%;
  height: 1px;
  background: #eef2f6;
}

.bars-container {
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 220px;
  z-index: 1;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
}

.bars {
  display: flex;
  gap: 5px;
  align-items: flex-end;
  height: 180px;
}

.bar {
  width: 25px;
  background: #3498db;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  position: relative;
  cursor: pointer;
}

.bar.collected {
  background: #27ae60;
}

.bar-tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.bar:hover .bar-tooltip {
  opacity: 1;
}

.bar-group .bar-label {
  margin-top: 10px;
  font-size: 0.8rem;
  color: #666;
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.btn-icon {
  width: 35px;
  height: 35px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-icon:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.data-table th {
  text-align: left;
  padding: 12px 10px;
  background: #f8fafc;
  color: #1a2639;
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 2px solid #eef2f6;
}

.data-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eef2f6;
  color: #666;
  font-size: 0.9rem;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.loan-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.loan-link:hover {
  text-decoration: underline;
}

.customer-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.amount,
.total,
.paid,
.balance {
  font-weight: 500;
}

.interest {
  color: #f39c12;
  font-weight: 500;
}

.balance.text-danger {
  color: #e74c3c;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.paid {
  background: #cce5ff;
  color: #004085;
}

.status-badge.defaulted {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.text-center {
  text-align: center;
}

/* Table Pagination */
.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-pagination {
  width: 35px;
  height: 35px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-pagination:hover:not(:disabled) {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

/* KPI Section */
.kpi-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.kpi-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  color: #333;
  font-size: 1.1rem;
}

.kpi-section h3 i {
  color: #3498db;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #eef2f6;
}

.kpi-icon {
  width: 45px;
  height: 45px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.kpi-content {
  flex: 1;
}

.kpi-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 3px;
}

.kpi-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 3px;
}

.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 12px;
}

.kpi-trend.positive {
  background: #d4edda;
  color: #155724;
}

.kpi-trend.negative {
  background: #f8d7da;
  color: #721c24;
}

/* Export Section */
.export-section {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-export-excel,
.btn-export-pdf,
.btn-export-csv {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  transition: all 0.3s;
}

.btn-export-excel {
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
}

.btn-export-pdf {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.btn-export-csv {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-export-excel:hover,
.btn-export-pdf:hover,
.btn-export-csv:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .status-details {
    grid-template-columns: 1fr;
  }

  .bars-container {
    gap: 5px;
  }

  .bar-group {
    width: 40px;
  }

  .bar {
    width: 15px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .export-section {
    justify-content: stretch;
  }

  .btn-export-excel,
  .btn-export-pdf,
  .btn-export-csv {
    flex: 1;
    justify-content: center;
  }

  .table-pagination {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-buttons {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-legend {
    width: 100%;
    justify-content: space-between;
  }

  .bar-group {
    width: 30px;
  }

  .bar {
    width: 12px;
  }

  .bar-group .bar-label {
    font-size: 0.7rem;
  }
}
</style>
