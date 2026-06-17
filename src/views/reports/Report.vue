<template>
  <div class="reports-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Ripoti na Takwimu</h1>
        <p class="reports-subtitle">Changanua na uchapishe ripoti mbalimbali za mfumo</p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportReport" :disabled="!selectedReport">
          <i class="fas fa-download"></i>
          <span>Pakua Ripoti</span>
        </button>
        <button class="btn-print" @click="printReport" :disabled="!selectedReport">
          <i class="fas fa-print"></i>
          <span>Chapisha</span>
        </button>
        <button class="btn-schedule" @click="showScheduleModal = true">
          <i class="fas fa-clock"></i>
          <span>Ratiba Ripoti</span>
        </button>
      </div>
    </div>

    <!-- Reports Dashboard -->
    <div class="reports-dashboard">
      <!-- Quick Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card" @click="selectReportType('loans')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3498db, #2980b9)">
            <i class="fas fa-hand-holding-usd"></i>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ formatCurrency(summary.totalLoans) }}</span>
            <span class="stat-label">Jumla ya Mikopo</span>
            <span class="stat-trend positive">
              <i class="fas fa-arrow-up"></i> {{ summary.loanGrowth }}% kutoka mwezi uliopita
            </span>
          </div>
        </div>

        <div class="stat-card" @click="selectReportType('collections')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #27ae60, #229954)">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ formatCurrency(summary.totalCollections) }}</span>
            <span class="stat-label">Jumla ya Malipo</span>
            <span class="stat-trend positive">
              <i class="fas fa-arrow-up"></i> {{ summary.collectionGrowth }}% kutoka mwezi uliopita
            </span>
          </div>
        </div>

        <div class="stat-card" @click="selectReportType('customers')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f39c12, #e67e22)">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ summary.totalCustomers }}</span>
            <span class="stat-label">Jumla ya Wateja</span>
            <span class="stat-trend positive">
              <i class="fas fa-arrow-up"></i> +{{ summary.newCustomers }} mwezi huu
            </span>
          </div>
        </div>

        <div class="stat-card" @click="selectReportType('defaults')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #e74c3c, #c0392b)">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ summary.defaultRate }}%</span>
            <span class="stat-label">Kiwango cha Mikopo Imechelewa</span>
            <span class="stat-trend" :class="summary.defaultTrend > 0 ? 'negative' : 'positive'">
              <i :class="summary.defaultTrend > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(summary.defaultTrend) }}% kutoka mwezi uliopita
            </span>
          </div>
        </div>
      </div>

      <!-- Report Type Selection -->
      <div class="report-type-section">
        <h3>Aina za Ripoti</h3>
        <div class="report-type-grid">
          <div
            class="report-type-card"
            :class="{ active: selectedReport === 'loan-performance' }"
            @click="selectReport('loan-performance')"
          >
            <div class="card-icon" style="background: linear-gradient(135deg, #3498db, #2980b9)">
              <i class="fas fa-chart-line"></i>
            </div>
            <h4>Utendaji wa Mikopo</h4>
            <p>Chambua utendaji wa mikopo yote, viwango vya ulipaji na mikopo iliyochelewa</p>
          </div>

          <div
            class="report-type-card"
            :class="{ active: selectedReport === 'collections' }"
            @click="selectReport('collections')"
          >
            <div class="card-icon" style="background: linear-gradient(135deg, #27ae60, #229954)">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <h4>Ripoti ya Makusanyo</h4>
            <p>Angalia malipo yote, makusanyo kwa muda na njia za malipo</p>
          </div>

          <div
            class="report-type-card"
            :class="{ active: selectedReport === 'customers' }"
            @click="selectReport('customers')"
          >
            <div class="card-icon" style="background: linear-gradient(135deg, #f39c12, #e67e22)">
              <i class="fas fa-users"></i>
            </div>
            <h4>Ripoti ya Wateja</h4>
            <p>Takwimu za wateja, wateja wapya na mgawanyo wa wateja</p>
          </div>

          <div
            class="report-type-card"
            :class="{ active: selectedReport === 'aging' }"
            @click="selectReport('aging')"
          >
            <div class="card-icon" style="background: linear-gradient(135deg, #e74c3c, #c0392b)">
              <i class="fas fa-clock"></i>
            </div>
            <h4>Ripoti ya Umri wa Mikopo</h4>
            <p>Mikopo iliyochelewa kwa muda tofauti (30, 60, 90+ siku)</p>
          </div>

          <div
            class="report-type-card"
            :class="{ active: selectedReport === 'officer' }"
            @click="selectReport('officer')"
          >
            <div class="card-icon" style="background: linear-gradient(135deg, #9b59b6, #8e44ad)">
              <i class="fas fa-user-tie"></i>
            </div>
            <h4>Utendaji wa Maafisa</h4>
            <p>Utendaji wa kila afisa mkopo kwa mikopo na makusanyo</p>
          </div>

          <div
            class="report-type-card"
            :class="{ active: selectedReport === 'financial' }"
            @click="selectReport('financial')"
          >
            <div class="card-icon" style="background: linear-gradient(135deg, #1abc9c, #16a085)">
              <i class="fas fa-chart-pie"></i>
            </div>
            <h4>Ripoti ya Fedha</h4>
            <p>Mapato, riba na faida kwa muda</p>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section" v-if="selectedReport">
        <div class="filters-header">
          <h3>
            <i class="fas fa-filter"></i>
            Vichujio vya Ripoti
          </h3>
          <button class="btn-reset" @click="resetFilters">
            <i class="fas fa-undo"></i>
            Weka Upya
          </button>
        </div>

        <div class="filters-grid">
          <!-- Date Range -->
          <div class="filter-group">
            <label>
              <i class="fas fa-calendar-alt"></i>
              Muda
            </label>
            <select
              v-model="filters.dateRange"
              @change="handleDateRangeChange"
              class="form-control"
            >
              <option value="today">Leo</option>
              <option value="yesterday">Jana</option>
              <option value="thisWeek">Wiki hii</option>
              <option value="lastWeek">Wiki iliyopita</option>
              <option value="thisMonth">Mwezi huu</option>
              <option value="lastMonth">Mwezi uliopita</option>
              <option value="thisQuarter">Robo mwaka huu</option>
              <option value="lastQuarter">Robo mwaka uliopita</option>
              <option value="thisYear">Mwaka huu</option>
              <option value="lastYear">Mwaka uliopita</option>
              <option value="custom">Maalum</option>
            </select>
          </div>

          <!-- Custom Date Range -->
          <template v-if="filters.dateRange === 'custom'">
            <div class="filter-group">
              <label for="startDate">Kuanzia</label>
              <input type="date" id="startDate" v-model="filters.startDate" class="form-control" />
            </div>
            <div class="filter-group">
              <label for="endDate">Mpaka</label>
              <input type="date" id="endDate" v-model="filters.endDate" class="form-control" />
            </div>
          </template>

          <!-- Status Filter (conditional based on report type) -->
          <div class="filter-group" v-if="showStatusFilter">
            <label>
              <i class="fas fa-tag"></i>
              Hali
            </label>
            <select v-model="filters.status" class="form-control">
              <option value="">Zote</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Loan Officer Filter -->
          <div class="filter-group" v-if="showOfficerFilter">
            <label>
              <i class="fas fa-user-tie"></i>
              Afisa Mkopo
            </label>
            <select v-model="filters.officerId" class="form-control">
              <option value="">Wote</option>
              <option v-for="officer in officers" :key="officer.id" :value="officer.id">
                {{ officer.name }}
              </option>
            </select>
          </div>

          <!-- Branch/Region Filter -->
          <div class="filter-group">
            <label>
              <i class="fas fa-map-marker-alt"></i>
              Eneo/Tawi
            </label>
            <select v-model="filters.branch" class="form-control">
              <option value="">Zote</option>
              <option v-for="branch in branches" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>

          <!-- Payment Method Filter (for collections) -->
          <div class="filter-group" v-if="selectedReport === 'collections'">
            <label>
              <i class="fas fa-credit-card"></i>
              Njia ya Malipo
            </label>
            <select v-model="filters.paymentMethod" class="form-control">
              <option value="">Zote</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <!-- Loan Type Filter -->
          <div class="filter-group" v-if="selectedReport === 'loan-performance'">
            <label>
              <i class="fas fa-tag"></i>
              Aina ya Mkopo
            </label>
            <select v-model="filters.loanType" class="form-control">
              <option value="">Zote</option>
              <option value="individual">Binafsi</option>
              <option value="group">Kikundi</option>
              <option value="business">Biashara</option>
            </select>
          </div>

          <!-- Minimum Amount Filter -->
          <div class="filter-group">
            <label>
              <i class="fas fa-money-bill"></i>
              Kiasi cha chini
            </label>
            <input
              type="number"
              v-model.number="filters.minAmount"
              class="form-control"
              placeholder="0"
              min="0"
            />
          </div>

          <!-- Maximum Amount Filter -->
          <div class="filter-group">
            <label>
              <i class="fas fa-money-bill"></i>
              Kiasi cha juu
            </label>
            <input
              type="number"
              v-model.number="filters.maxAmount"
              class="form-control"
              placeholder="1,000,000"
              min="0"
            />
          </div>
        </div>

        <!-- Active Filters -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span class="active-filters-label">
            <i class="fas fa-filter"></i>
            Vichujio vilivyowekwa:
          </span>
          <div class="filter-tags">
            <span v-if="filters.dateRange !== 'custom' && filters.dateRange" class="filter-tag">
              <i class="fas fa-calendar"></i>
              {{ getDateRangeText(filters.dateRange) }}
              <i @click="clearFilter('dateRange')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.startDate && filters.endDate" class="filter-tag">
              <i class="fas fa-calendar"></i>
              {{ formatDate(filters.startDate) }} - {{ formatDate(filters.endDate) }}
              <i @click="clearDateRange" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.status" class="filter-tag">
              <i class="fas fa-tag"></i>
              {{ getStatusLabel(filters.status) }}
              <i @click="clearFilter('status')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.officerId" class="filter-tag">
              <i class="fas fa-user-tie"></i>
              {{ getOfficerName(filters.officerId) }}
              <i @click="clearFilter('officerId')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.branch" class="filter-tag">
              <i class="fas fa-map-marker-alt"></i>
              {{ filters.branch }}
              <i @click="clearFilter('branch')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.paymentMethod" class="filter-tag">
              <i class="fas fa-credit-card"></i>
              {{ getPaymentMethodText(filters.paymentMethod) }}
              <i @click="clearFilter('paymentMethod')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.loanType" class="filter-tag">
              <i class="fas fa-tag"></i>
              {{ getLoanTypeText(filters.loanType) }}
              <i @click="clearFilter('loanType')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.minAmount" class="filter-tag">
              <i class="fas fa-money-bill"></i>
              ≥ {{ formatCurrency(filters.minAmount) }}
              <i @click="clearFilter('minAmount')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.maxAmount" class="filter-tag">
              <i class="fas fa-money-bill"></i>
              ≤ {{ formatCurrency(filters.maxAmount) }}
              <i @click="clearFilter('maxAmount')" class="fas fa-times remove-filter"></i>
            </span>
            <button @click="resetFilters" class="clear-all-btn">
              <i class="fas fa-trash-alt"></i>
              Futa yote
            </button>
          </div>
        </div>
      </div>

      <!-- Report Content -->
      <div v-if="selectedReport" class="report-content">
        <!-- Loading State -->
        <div v-if="reportLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Inatayarisha ripoti...</p>
        </div>

        <!-- Report Display -->
        <div v-else class="report-display">
          <!-- Report Header -->
          <div class="report-header">
            <h2>{{ getReportTitle }}</h2>
            <p class="report-period">
              <i class="fas fa-calendar-alt"></i>
              Kipindi: {{ getReportPeriod }}
            </p>
          </div>

          <!-- Conditional Report Content -->
          <component
            :is="currentReportComponent"
            :data="reportData"
            :filters="filters"
            @export="exportReport"
          />
        </div>
      </div>

      <!-- Saved Reports Section -->
      <div class="saved-reports-section">
        <div class="section-header">
          <h3>
            <i class="fas fa-bookmark"></i>
            Ripoti Zilizohifadhiwa
          </h3>
          <button class="btn-view-all" @click="viewAllSaved">Angalia Zote</button>
        </div>

        <div class="saved-reports-grid">
          <div v-for="report in savedReports" :key="report.id" class="saved-report-card">
            <div class="report-icon" :style="{ background: report.color }">
              <i :class="report.icon"></i>
            </div>
            <div class="report-info">
              <h4>{{ report.name }}</h4>
              <p>{{ report.description }}</p>
              <span class="report-date">
                <i class="fas fa-clock"></i>
                Imehifadhiwa: {{ formatDate(report.savedAt) }}
              </span>
            </div>
            <div class="report-actions">
              <button class="btn-icon" @click="loadSavedReport(report)" title="Fungua">
                <i class="fas fa-folder-open"></i>
              </button>
              <button class="btn-icon" @click="downloadReport(report)" title="Pakua">
                <i class="fas fa-download"></i>
              </button>
              <button class="btn-icon" @click="deleteSavedReport(report)" title="Futa">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule Report Modal -->
    <div v-if="showScheduleModal" class="modal-overlay" @click="showScheduleModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Ratiba Ripoti</h3>
          <button class="close-btn" @click="showScheduleModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="scheduleName">Jina la Ratiba</label>
            <input
              type="text"
              id="scheduleName"
              v-model="schedule.name"
              class="form-control"
              placeholder="Mfano: Ripoti ya kila wiki"
            />
          </div>

          <div class="form-group">
            <label for="scheduleReport">Aina ya Ripoti</label>
            <select id="scheduleReport" v-model="schedule.reportType" class="form-control">
              <option value="loan-performance">Utendaji wa Mikopo</option>
              <option value="collections">Ripoti ya Makusanyo</option>
              <option value="customers">Ripoti ya Wateja</option>
              <option value="aging">Ripoti ya Umri wa Mikopo</option>
              <option value="officer">Utendaji wa Maafisa</option>
              <option value="financial">Ripoti ya Fedha</option>
            </select>
          </div>

          <div class="form-group">
            <label for="scheduleFrequency">Mara ngapi</label>
            <select id="scheduleFrequency" v-model="schedule.frequency" class="form-control">
              <option value="daily">Kila siku</option>
              <option value="weekly">Kila wiki</option>
              <option value="biweekly">Kila wiki mbili</option>
              <option value="monthly">Kila mwezi</option>
              <option value="quarterly">Kila robo mwaka</option>
            </select>
          </div>

          <div class="form-group">
            <label for="scheduleDay">Siku ya kutuma</label>
            <select id="scheduleDay" v-model="schedule.day" class="form-control">
              <option value="monday">Jumatatu</option>
              <option value="tuesday">Jumanne</option>
              <option value="wednesday">Jumatano</option>
              <option value="thursday">Alhamisi</option>
              <option value="friday">Ijumaa</option>
              <option value="saturday">Jumamosi</option>
              <option value="sunday">Jumapili</option>
            </select>
          </div>

          <div class="form-group">
            <label for="scheduleTime">Muda wa kutuma</label>
            <input type="time" id="scheduleTime" v-model="schedule.time" class="form-control" />
          </div>

          <div class="form-group">
            <label for="scheduleEmail">Tuma kwa barua pepe</label>
            <input
              type="email"
              id="scheduleEmail"
              v-model="schedule.email"
              class="form-control"
              placeholder="mteja@example.com"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="schedule.attachPdf" />
              <span class="checkmark"></span>
              <span>Ambasha PDF</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="schedule.attachExcel" />
              <span class="checkmark"></span>
              <span>Ambasha Excel</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showScheduleModal = false" class="btn-secondary">Ghairi</button>
          <button @click="saveSchedule" class="btn-primary">
            <i class="fas fa-save"></i>
            Hifadhi Ratiba
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'

// Import report components (to be created separately)
import LoanPerformanceReport from './LoanPerformanceReport.vue'
// import CollectionsReport from './reports/CollectionsReport.vue'
// import CustomersReport from './reports/CustomersReport.vue'
// import AgingReport from './reports/AgingReport.vue'
// import OfficerPerformanceReport from './reports/OfficerPerformanceReport.vue'
// import FinancialReport from './reports/FinancialReport.vue'

// State
const selectedReport = ref(null)
const reportLoading = ref(false)
const reportData = ref(null)
const showScheduleModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Filters
const filters = reactive({
  dateRange: 'thisMonth',
  startDate: '',
  endDate: '',
  status: '',
  officerId: '',
  branch: '',
  paymentMethod: '',
  loanType: '',
  minAmount: '',
  maxAmount: '',
})

// Schedule form
const schedule = reactive({
  name: '',
  reportType: 'loan-performance',
  frequency: 'weekly',
  day: 'monday',
  time: '08:00',
  email: '',
  attachPdf: true,
  attachExcel: false,
})

// Dummy data
const summary = ref({
  totalLoans: 125000000,
  loanGrowth: 12.5,
  totalCollections: 87500000,
  collectionGrowth: 8.3,
  totalCustomers: 1250,
  newCustomers: 45,
  defaultRate: 3.2,
  defaultTrend: -0.5,
})

const officers = ref([
  { id: 1, name: 'John Officer' },
  { id: 2, name: 'Sarah Accountant' },
  { id: 3, name: 'Michael Manager' },
])

const branches = ref(['Dar es Salaam', 'Zanzibar', 'Arusha', 'Mwanza', 'Mbeya'])

const savedReports = ref([
  {
    id: 1,
    name: 'Ripoti ya Kila Mwezi - Juni 2024',
    description: 'Utendaji wa mikopo na makusanyo mwezi Juni',
    icon: 'fas fa-chart-line',
    color: 'linear-gradient(135deg, #3498db, #2980b9)',
    savedAt: '2024-07-01T10:30:00Z',
  },
  {
    id: 2,
    name: 'Ripoti ya Robo Mwaka - Q2 2024',
    description: 'Takwimu za robo mwaka wa pili 2024',
    icon: 'fas fa-chart-pie',
    color: 'linear-gradient(135deg, #27ae60, #229954)',
    savedAt: '2024-07-05T14:20:00Z',
  },
  {
    id: 3,
    name: 'Ripoti ya Wateja Wapya',
    description: 'Wateja wapya waliojiunga mwezi Juni',
    icon: 'fas fa-users',
    color: 'linear-gradient(135deg, #f39c12, #e67e22)',
    savedAt: '2024-07-03T09:15:00Z',
  },
])

// Status options based on report type
const statusOptions = computed(() => {
  switch (selectedReport.value) {
    case 'loan-performance':
      return [
        { value: 'active', label: 'Inaendelea' },
        { value: 'paid', label: 'Imelipwa' },
        { value: 'defaulted', label: 'Imechelewa' },
        { value: 'pending', label: 'Inasubiri' },
      ]
    case 'collections':
      return [
        { value: 'verified', label: 'Imehakikiwa' },
        { value: 'unverified', label: 'Haijahakikiwa' },
      ]
    case 'customers':
      return [
        { value: 'active', label: 'Wanaofanya kazi' },
        { value: 'inactive', label: 'Hawafanyi kazi' },
        { value: 'blacklisted', label: 'Wamepigwa marufuku' },
      ]
    default:
      return []
  }
})

// Computed
const hasActiveFilters = computed(() => {
  return (
    filters.dateRange !== 'thisMonth' ||
    filters.status ||
    filters.officerId ||
    filters.branch ||
    filters.paymentMethod ||
    filters.loanType ||
    filters.minAmount ||
    filters.maxAmount ||
    (filters.startDate && filters.endDate)
  )
})

const showStatusFilter = computed(() => {
  return ['loan-performance', 'collections', 'customers'].includes(selectedReport.value)
})

const showOfficerFilter = computed(() => {
  return ['loan-performance', 'collections', 'officer'].includes(selectedReport.value)
})

const getReportTitle = computed(() => {
  const titles = {
    'loan-performance': 'Ripoti ya Utendaji wa Mikopo',
    collections: 'Ripoti ya Makusanyo',
    customers: 'Ripoti ya Wateja',
    aging: 'Ripoti ya Umri wa Mikopo',
    officer: 'Ripoti ya Utendaji wa Maafisa',
    financial: 'Ripoti ya Fedha',
  }
  return titles[selectedReport.value] || 'Ripoti'
})

const getReportPeriod = computed(() => {
  if (filters.startDate && filters.endDate) {
    return `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
  }
  return getDateRangeText(filters.dateRange)
})

const currentReportComponent = computed(() => {
  const components = {
    'loan-performance': LoanPerformanceReport,
    collections: CollectionsReport,
    customers: CustomersReport,
    aging: AgingReport,
    officer: OfficerPerformanceReport,
    financial: FinancialReport,
  }
  return components[selectedReport.value]
})

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Methods
const selectReportType = (type) => {
  selectedReport.value = type
  loadReport()
}

const selectReport = (report) => {
  selectedReport.value = report
  loadReport()
}

const loadReport = async () => {
  reportLoading.value = true

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate dummy data based on report type
  switch (selectedReport.value) {
    case 'loan-performance':
      reportData.value = generateLoanPerformanceData()
      break
    case 'collections':
      reportData.value = generateCollectionsData()
      break
    case 'customers':
      reportData.value = generateCustomersData()
      break
    case 'aging':
      reportData.value = generateAgingData()
      break
    case 'officer':
      reportData.value = generateOfficerData()
      break
    case 'financial':
      reportData.value = generateFinancialData()
      break
  }

  reportLoading.value = false
}

const handleDateRangeChange = () => {
  if (filters.dateRange !== 'custom') {
    filters.startDate = ''
    filters.endDate = ''
  }
  loadReport()
}

const resetFilters = () => {
  filters.dateRange = 'thisMonth'
  filters.startDate = ''
  filters.endDate = ''
  filters.status = ''
  filters.officerId = ''
  filters.branch = ''
  filters.paymentMethod = ''
  filters.loanType = ''
  filters.minAmount = ''
  filters.maxAmount = ''
  loadReport()
}

const clearFilter = (filter) => {
  filters[filter] = ''
  loadReport()
}

const clearDateRange = () => {
  filters.startDate = ''
  filters.endDate = ''
  filters.dateRange = 'thisMonth'
  loadReport()
}

const getDateRangeText = (range) => {
  const texts = {
    today: 'Leo',
    yesterday: 'Jana',
    thisWeek: 'Wiki hii',
    lastWeek: 'Wiki iliyopita',
    thisMonth: 'Mwezi huu',
    lastMonth: 'Mwezi uliopita',
    thisQuarter: 'Robo mwaka huu',
    lastQuarter: 'Robo mwaka uliopita',
    thisYear: 'Mwaka huu',
    lastYear: 'Mwaka uliopita',
  }
  return texts[range] || range
}

const getStatusLabel = (status) => {
  const option = statusOptions.value.find((opt) => opt.value === status)
  return option ? option.label : status
}

const getOfficerName = (id) => {
  const officer = officers.value.find((o) => o.id === parseInt(id))
  return officer ? officer.name : id
}

const getPaymentMethodText = (method) => {
  const texts = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    cheque: 'Cheque',
  }
  return texts[method] || method
}

const getLoanTypeText = (type) => {
  const texts = {
    individual: 'Binafsi',
    group: 'Kikundi',
    business: 'Biashara',
  }
  return texts[type] || type
}

// Report data generators
const generateLoanPerformanceData = () => {
  return {
    totalLoans: 450,
    totalAmount: 125000000,
    averageLoanSize: 277777,
    disbursedThisMonth: 28,
    disbursedAmount: 8750000,
    collectedThisMonth: 7100000,
    collectionRate: 81.1,
    byStatus: {
      active: 320,
      paid: 85,
      defaulted: 25,
      pending: 20,
    },
    monthlyTrend: [
      { month: 'Jan', disbursed: 8200000, collected: 7100000 },
      { month: 'Feb', disbursed: 9100000, collected: 7800000 },
      { month: 'Mar', disbursed: 10500000, collected: 8900000 },
      { month: 'Apr', disbursed: 9800000, collected: 9200000 },
      { month: 'May', disbursed: 11200000, collected: 10100000 },
      { month: 'Jun', disbursed: 8750000, collected: 7100000 },
    ],
  }
}

const generateCollectionsData = () => {
  return {
    totalCollected: 87500000,
    todayCollected: 1250000,
    thisWeekCollected: 8450000,
    thisMonthCollected: 31500000,
    byMethod: {
      cash: 35000000,
      bank_transfer: 28000000,
      mobile_money: 19500000,
      cheque: 5000000,
    },
    dailyCollections: [
      { date: '2024-07-01', amount: 1120000 },
      { date: '2024-07-02', amount: 980000 },
      { date: '2024-07-03', amount: 1250000 },
      { date: '2024-07-04', amount: 1430000 },
      { date: '2024-07-05', amount: 1080000 },
      { date: '2024-07-06', amount: 870000 },
      { date: '2024-07-07', amount: 920000 },
    ],
  }
}

const generateCustomersData = () => {
  return {
    total: 1250,
    active: 980,
    inactive: 220,
    blacklisted: 50,
    newThisMonth: 45,
    byOccupation: {
      Mfanyabiashara: 350,
      Mkulima: 280,
      Mwalimu: 190,
      Dereva: 160,
      Fundi: 150,
      Nyingine: 120,
    },
    byRegion: {
      'Dar es Salaam': 450,
      Zanzibar: 220,
      Arusha: 180,
      Mwanza: 165,
      Mbeya: 130,
      Nyingine: 105,
    },
  }
}

const generateAgingData = () => {
  return {
    current: 85000000,
    days1to30: 22500000,
    days31to60: 11500000,
    days61to90: 6500000,
    days91plus: 3500000,
    byLoanOfficer: [
      { officer: 'John Officer', current: 32000000, overdue: 8500000 },
      { officer: 'Sarah Accountant', current: 28000000, overdue: 6200000 },
      { officer: 'Michael Manager', current: 25000000, overdue: 3800000 },
    ],
  }
}

const generateOfficerData = () => {
  return {
    officers: [
      {
        name: 'John Officer',
        loans: 85,
        amount: 42000000,
        collected: 31500000,
        collectionRate: 75,
        defaultRate: 2.8,
      },
      {
        name: 'Sarah Accountant',
        loans: 72,
        amount: 38000000,
        collected: 30400000,
        collectionRate: 80,
        defaultRate: 1.9,
      },
      {
        name: 'Michael Manager',
        loans: 63,
        amount: 35000000,
        collected: 28000000,
        collectionRate: 80,
        defaultRate: 2.1,
      },
    ],
  }
}

const generateFinancialData = () => {
  return {
    totalInterest: 24500000,
    totalPenalties: 1850000,
    totalFees: 950000,
    operatingExpenses: 12300000,
    netProfit: 15050000,
    profitMargin: 32.5,
    monthlyProfit: [
      { month: 'Jan', profit: 2150000 },
      { month: 'Feb', profit: 2380000 },
      { month: 'Mar', profit: 2620000 },
      { month: 'Apr', profit: 2510000 },
      { month: 'May', profit: 2840000 },
      { month: 'Jun', profit: 2560000 },
    ],
  }
}

// Actions
const exportReport = () => {
  showToastMessage('Ripoti inatayarishwa kwa ajili ya kupakuliwa...', 'info')
  setTimeout(() => {
    showToastMessage('Ripoti imepakuliwa kwa mafanikio!', 'success')
  }, 1500)
}

const printReport = () => {
  window.print()
}

const saveSchedule = () => {
  showScheduleModal.value = false
  showToastMessage('Ratiba imehifadhiwa kwa mafanikio!', 'success')
}

const viewAllSaved = () => {
  showToastMessage('Orodha ya ripoti zilizohifadhiwa', 'info')
}

const loadSavedReport = (report) => {
  showToastMessage(`Inapakia ${report.name}...`, 'info')
}

const downloadReport = (report) => {
  showToastMessage(`Inapakua ${report.name}...`, 'info')
}

const deleteSavedReport = (report) => {
  if (confirm(`Una uhakika unataka kufuta "${report.name}"?`)) {
    const index = savedReports.value.findIndex((r) => r.id === report.id)
    if (index !== -1) {
      savedReports.value.splice(index, 1)
      showToastMessage('Ripoti imefutwa kwa mafanikio!', 'success')
    }
  }
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Lifecycle
onMounted(() => {
  // Load default report
  selectReport('loan-performance')
})
</script>

<style scoped>
.reports-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left h1 {
  font-size: 2rem;
  color: #1a2639;
  margin: 0 0 5px;
  font-weight: 600;
}

.reports-subtitle {
  color: #666;
  margin: 0;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-export,
.btn-print,
.btn-schedule {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  border: none;
}

.btn-export {
  background: white;
  color: #27ae60;
  border: 1px solid #27ae60;
}

.btn-export:hover:not(:disabled) {
  background: #27ae60;
  color: white;
}

.btn-print {
  background: white;
  color: #3498db;
  border: 1px solid #3498db;
}

.btn-print:hover:not(:disabled) {
  background: #3498db;
  color: white;
}

.btn-schedule {
  background: white;
  color: #f39c12;
  border: 1px solid #f39c12;
}

.btn-schedule:hover {
  background: #f39c12;
  color: white;
}

.btn-export:disabled,
.btn-print:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-details {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a2639;
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 5px;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 12px;
}

.stat-trend.positive {
  background: #d4edda;
  color: #155724;
}

.stat-trend.negative {
  background: #f8d7da;
  color: #721c24;
}

/* Report Type Section */
.report-type-section {
  margin-bottom: 30px;
}

.report-type-section h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.report-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.report-type-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  cursor: pointer;
  transition: all 0.3s;
}

.report-type-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.report-type-card.active {
  border-color: #3498db;
  background: #e3f2fd;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.report-type-card h4 {
  margin: 0 0 8px;
  color: #333;
  font-size: 1.1rem;
}

.report-type-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.filters-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.filters-header h3 i {
  color: #3498db;
}

.btn-reset {
  padding: 6px 12px;
  background: #f8fafc;
  color: #666;
  border: 1px solid #eef2f6;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-reset:hover {
  background: #eef2f6;
  color: #333;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 5px;
}

.filter-group label i {
  color: #3498db;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s;
  background: #f8fafc;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Active Filters */
.active-filters {
  padding-top: 15px;
  border-top: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.active-filters-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 0.9rem;
}

.filter-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 0.85rem;
}

.remove-filter {
  cursor: pointer;
  padding: 2px;
}

.remove-filter:hover {
  color: #e74c3c;
}

.clear-all-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
}

.clear-all-btn:hover {
  text-decoration: underline;
}

/* Report Content */
.report-content {
  margin-bottom: 30px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid #eef2f6;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.report-display {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.report-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eef2f6;
}

.report-header h2 {
  margin: 0 0 10px;
  color: #333;
  font-size: 1.5rem;
}

.report-period {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  margin: 0;
}

.report-period i {
  color: #3498db;
}

/* Saved Reports Section */
.saved-reports-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.section-header h3 i {
  color: #3498db;
}

.btn-view-all {
  padding: 6px 12px;
  background: none;
  color: #3498db;
  border: 1px solid #3498db;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-view-all:hover {
  background: #3498db;
  color: white;
}

.saved-reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.saved-report-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #eef2f6;
  transition: all 0.3s;
}

.saved-report-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.report-icon {
  width: 45px;
  height: 45px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.report-info {
  flex: 1;
}

.report-info h4 {
  margin: 0 0 3px;
  font-size: 0.95rem;
  color: #333;
}

.report-info p {
  margin: 0 0 5px;
  font-size: 0.8rem;
  color: #666;
}

.report-date {
  font-size: 0.7rem;
  color: #999;
  display: flex;
  align-items: center;
  gap: 3px;
}

.report-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  width: 30px;
  height: 30px;
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
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

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
  padding: 5px;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 25px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  padding-left: 25px;
  user-select: none;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  left: 0;
  top: 0;
  height: 18px;
  width: 18px;
  background: white;
  border: 2px solid #eef2f6;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-label:hover input ~ .checkmark {
  background: #f8fafc;
  border-color: #3498db;
}

.checkbox-label input:checked ~ .checkmark {
  background: #3498db;
  border-color: #3498db;
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.checkbox-label input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-label .checkmark:after {
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.btn-secondary {
  background: #f8fafc;
  color: #666;
  border: 1px solid #eef2f6;
}

.btn-secondary:hover {
  background: #eef2f6;
  color: #333;
}

/* Toast Notification */
.toast-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 15px 25px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideInRight 0.3s ease;
  z-index: 2100;
  border-left: 4px solid;
}

.toast-notification.success {
  border-left-color: #27ae60;
}

.toast-notification.error {
  border-left-color: #e74c3c;
}

.toast-notification.info {
  border-left-color: #3498db;
}

.toast-notification i {
  font-size: 1.2rem;
}

.toast-notification.success i {
  color: #27ae60;
}

.toast-notification.error i {
  color: #e74c3c;
}

.toast-notification.info i {
  color: #3498db;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .reports-container {
    padding: 15px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .btn-export,
  .btn-print,
  .btn-schedule {
    flex: 1;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .report-type-grid {
    grid-template-columns: 1fr;
  }

  .saved-reports-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .toast-notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}
</style>
