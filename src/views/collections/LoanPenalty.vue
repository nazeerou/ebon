<template>
  <div class="overdue-loans-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Mikopo Iliyopitiliza (Overdue)</h1>
        <p class="loan-count" v-if="!loading">
          Jumla ya mikopo iliyopitiliza: <strong>{{ pagination.total }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportLoans" :disabled="exportLoading">
          <i class="fas fa-download"></i>
          <span>{{ exportLoading ? 'Inahamisha...' : 'Pakua' }}</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card" v-for="stat in loanStatistics" :key="stat.label">
        <div class="summary-icon" :style="{ background: stat.color }">
          <i :class="stat.icon"></i>
        </div>
        <div class="summary-details">
          <span class="summary-value">{{ formatNumber(stat.value) }}</span>
          <span class="summary-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- Filters Card -->
    <div class="filters-card">
      <div class="filters-header" @click="showFilters = !showFilters">
        <i class="fas fa-filter"></i>
        <h3>Vichujio</h3>
        <span class="filter-badge" v-if="activeFilterCount > 0">{{ activeFilterCount }}</span>
        <i class="fas fa-chevron-down" :class="{ rotated: showFilters }"></i>
      </div>

      <div v-show="showFilters" class="filters-body">
        <div class="filters-grid">
          <div class="filter-group">
            <label>
              <i class="fas fa-search"></i>
              Tafuta
            </label>
            <input
              type="text"
              v-model="filters.search"
              @input="debouncedSearch"
              placeholder="Namba ya mkopo, jina la mteja..."
              class="form-control"
            />
          </div>

          <div class="filter-group">
            <label>
              <i class="fas fa-calendar"></i>
              Kuanzia Tarehe
            </label>
            <input
              type="date"
              v-model="filters.date_from"
              @change="loadLoans"
              class="form-control"
            />
          </div>

          <div class="filter-group">
            <label>
              <i class="fas fa-calendar"></i>
              Mpaka Tarehe
            </label>
            <input type="date" v-model="filters.date_to" @change="loadLoans" class="form-control" />
          </div>

          <div class="filter-group">
            <label>
              <i class="fas fa-sort"></i>
              Panga Kwa
            </label>
            <select v-model="filters.sortBy" @change="loadLoans" class="form-control">
              <option value="created_at">Tarehe ya Kuombwa</option>
              <option value="amount">Kiasi cha Mkopo</option>
              <option value="customer_name">Jina la Mteja</option>
              <option value="due_date">Tarehe ya Kukamilika</option>
            </select>
          </div>

          <div class="filter-group">
            <label>
              <i class="fas fa-sort-amount-down"></i>
              Mpango
            </label>
            <select v-model="filters.sortOrder" @change="loadLoans" class="form-control">
              <option value="desc">Kushuka</option>
              <option value="asc">Kupanda</option>
            </select>
          </div>

          <div class="filter-group">
            <label>
              <i class="fas fa-list"></i>
              Idadi kwa Ukurasa
            </label>
            <select v-model="filters.perPage" @change="loadLoans" class="form-control">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <!-- Active Filters -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span class="active-filters-label">
            <i class="fas fa-filter"></i>
            Vichujio vilivyowekwa:
          </span>
          <div class="filter-tags">
            <span v-if="filters.search" class="filter-tag">
              <i class="fas fa-search"></i>
              "{{ filters.search }}"
              <i @click="clearFilter('search')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.date_from" class="filter-tag">
              <i class="fas fa-calendar"></i>
              Kuanzia: {{ formatDate(filters.date_from) }}
              <i @click="clearFilter('date_from')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.date_to" class="filter-tag">
              <i class="fas fa-calendar"></i>
              Mpaka: {{ formatDate(filters.date_to) }}
              <i @click="clearFilter('date_to')" class="fas fa-times remove-filter"></i>
            </span>
            <button @click="clearAllFilters" class="clear-all-btn">
              <i class="fas fa-trash-alt"></i>
              Futa yote
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia mikopo iliyopitiliza...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadLoans" class="btn-retry">
        <i class="fas fa-redo"></i>
        Jaribu Tena
      </button>
    </div>

    <!-- Loans Table - Simplified -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="loans-table">
          <thead>
            <tr>
              <th style="width: 40px"></th>
              <th>No ya Mkopo</th>
              <th>Mteja</th>
              <th>Kiasi cha Mkopo</th>
              <th>Marejesho + Riba</th>
              <th>Malipo</th>
              <th>Adhabu</th>
              <th>Tarehe ya Adhabu</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="loan in loans" :key="loan.id">
              <!-- Main Row -->
              <tr class="main-row" :class="{ expanded: expandedRows[loan.id] }">
                <td @click.stop>
                  <button
                    @click="toggleDetails(loan.id)"
                    class="btn-expand"
                    :title="expandedRows[loan.id] ? 'Ficha maelezo' : 'Onyesha maelezo'"
                  >
                    <i
                      class="fas"
                      :class="expandedRows[loan.id] ? 'fa-chevron-up' : 'fa-chevron-down'"
                    ></i>
                  </button>
                </td>
                <td @click="viewLoan(loan)">
                  <span class="loan-number">#{{ loan.loan_number }}</span>
                </td>
                <td @click="viewLoan(loan)">
                  <div class="customer-cell">
                    <div class="customer-info">
                      <span class="customer-name">{{ loan.customer?.full_name }}</span>
                      <span class="customer-phone">{{ loan.customer?.phone }}</span>
                    </div>
                  </div>
                </td>
                <td @click="viewLoan(loan)">
                  <span class="amount">{{ formatCurrency(loan.amount) }}</span>
                </td>
                <td @click="viewLoan(loan)">
                  <span class="balance">{{
                    formatCurrency(loan.balance || loan.total_amount - (loan.total_paid || 0))
                  }}</span>
                </td>
                <td @click="viewLoan(loan)">
                  <span class="balance">-</span>
                </td>
                <td @click="viewLoan(loan)">
                  <span class="penalty-amount" v-if="loan.total_penalty > 0">
                    {{ formatCurrency(loan.total_penalty) }}
                  </span>
                  <span v-else class="no-penalty">-</span>
                </td>
                <td @click="viewLoan(loan)">
                  <span v-if="loan.last_penalty_calculation" class="penalty-date">
                    {{ formatDate(loan.last_penalty_calculation) }}
                  </span>
                  <span v-else class="no-penalty">-</span>
                </td>
                <td @click.stop>
                  <div class="action-dropdown" :ref="(el) => setActionDropdownRef(el, loan.id)">
                    <button class="action-menu-btn" @click.stop="toggleActionMenu(loan.id)">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div v-if="activeActionMenu === loan.id" class="action-menu">
                      <router-link
                        :to="`/loans/${loan.id}`"
                        class="action-menu-item"
                        @click="closeActionMenu"
                      >
                        <i class="fas fa-eye"></i>
                        <span>Angalia</span>
                      </router-link>
                      <router-link
                        :to="`/loans/${loan.id}/payments`"
                        class="action-menu-item"
                        @click="closeActionMenu"
                      >
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Malipo</span>
                      </router-link>
                      <div class="action-menu-divider"></div>
                      <button @click.stop="sendReminder(loan)" class="action-menu-item">
                        <i class="fas fa-bell"></i>
                        <span>Tuma Kikumbusho</span>
                      </button>
                      <button
                        @click.stop="waivePenalty(loan)"
                        class="action-menu-item"
                        v-if="loan.penalty_amount > 0"
                      >
                        <i class="fas fa-gift"></i>
                        <span>Ondoa Adhabu</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Expanded Details Row - All detailed info here -->
              <tr v-if="expandedRows[loan.id]" class="expanded-details-row">
                <td colspan="8">
                  <div class="expanded-details">
                    <div class="details-grid">
                      <!-- Payment Info -->
                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-money-bill"></i>
                          Jumla ya Marejesho
                        </span>
                        <span class="detail-value">{{ formatCurrency(loan.total_amount) }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-check-circle"></i>
                          Kiasi Kilicholipwa
                        </span>
                        <span class="detail-value paid">{{
                          formatCurrency(loan.total_paid || 0)
                        }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-clock"></i>
                          Siku Zilizopitiliza
                        </span>
                        <span class="detail-value" :class="getOverdueClass(loan.days_overdue)">
                          {{ formatOverdueDays(loan.days_overdue) }}
                        </span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-percent"></i>
                          Riba
                        </span>
                        <span class="detail-value">{{ loan.interest_rate }}%</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-exclamation-triangle"></i>
                          Kiwango cha Adhabu
                        </span>
                        <span class="detail-value">{{ loan.penalty_rate || 0 }}%</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-calendar"></i>
                          Tarehe ya Kukamilika
                        </span>
                        <span class="detail-value">{{ formatDate(loan.due_date) }}</span>
                      </div>

                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-calendar-alt"></i>
                          Muda
                        </span>
                        <span class="detail-value">{{ loan.duration_months }} miezi</span>
                      </div>

                      <div class="detail-item" v-if="loan.next_payment_due_date">
                        <span class="detail-label">
                          <i class="fas fa-clock"></i>
                          Malipo Yajayo
                        </span>
                        <span class="detail-value">{{
                          formatDate(loan.next_payment_due_date)
                        }}</span>
                      </div>

                      <!-- Payment Schedule Summary -->
                      <div class="detail-item full-width" v-if="loan.payment_schedule">
                        <span class="detail-label">
                          <i class="fas fa-calendar-alt"></i>
                          Ratiba ya Malipo
                        </span>
                        <div class="payment-schedule-summary">
                          <div class="schedule-stats">
                            <div class="stat">
                              <span class="stat-label">Jumla ya Malipo:</span>
                              <span class="stat-value">{{
                                loan.payment_schedule?.length || 0
                              }}</span>
                            </div>
                            <div class="stat">
                              <span class="stat-label">Yaliyolipwa:</span>
                              <span class="stat-value">{{ getPaidInstallmentsCount(loan) }}</span>
                            </div>
                            <div class="stat">
                              <span class="stat-label">Yaliyopitiliza:</span>
                              <span class="stat-value overdue-stat">{{
                                getOverdueInstallmentsCount(loan)
                              }}</span>
                            </div>
                          </div>
                          <div class="progress-bar-container">
                            <div
                              class="progress-bar"
                              :style="{ width: getPaymentProgress(loan) + '%' }"
                            ></div>
                          </div>
                        </div>
                      </div>

                      <!-- Notes -->
                      <div class="detail-item full-width" v-if="loan.notes">
                        <span class="detail-label">
                          <i class="fas fa-sticky-note"></i>
                          Maelezo
                        </span>
                        <span class="detail-value">{{ loan.notes }}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-if="loans.length === 0">
              <td colspan="8" class="text-center">
                <div class="empty-state-small">
                  <i class="fas fa-check-circle"></i>
                  <p>Hakuna mikopo iliyopitiliza</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.lastPage > 1">
        <div class="pagination-info">
          Inaonyesha {{ pagination.from }} - {{ pagination.to }} kati ya {{ pagination.total }}
        </div>
        <div class="pagination-buttons">
          <button
            @click="changePage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage === 1"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <button
            v-for="page in paginationPages"
            :key="page"
            @click="changePage(page)"
            class="pagination-btn"
            :class="{ active: page === pagination.currentPage }"
          >
            {{ page }}
          </button>
          <button
            @click="changePage(pagination.currentPage + 1)"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Send Reminder Modal -->
    <div v-if="showReminderModal" class="modal-overlay" @click="closeReminderModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon info"><i class="fas fa-bell"></i></div>
          <h3>Tuma Kikumbusho</h3>
          <button class="close-btn" @click="closeReminderModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Tuma kikumbusho cha malipo kwa mteja huyu.</p>
          <div class="loan-summary" v-if="selectedLoan">
            <p><strong>Mkopo #:</strong> {{ selectedLoan.loan_number }}</p>
            <p><strong>Mteja:</strong> {{ selectedLoan.customer?.full_name }}</p>
            <p><strong>Simu:</strong> {{ selectedLoan.customer?.phone }}</p>
            <p>
              <strong>Kiasi cha Adhabu:</strong>
              {{ formatCurrency(selectedLoan.penalty_amount || 0) }}
            </p>
          </div>
          <div class="form-group">
            <label for="reminder_message">Ujumbe (si lazima)</label>
            <textarea
              id="reminder_message"
              v-model="reminderMessage"
              class="form-control"
              rows="3"
              placeholder="Weka ujumbe maalum kwa mteja..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeReminderModal" class="btn-secondary">Ghairi</button>
          <button @click="confirmSendReminder" class="btn-info" :disabled="actionLoading">
            <span v-if="actionLoading" class="spinner"></span>
            <span v-else><i class="fas fa-paper-plane"></i> Tuma Kikumbusho</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Waive Penalty Modal -->
    <div v-if="showWaiveModal" class="modal-overlay" @click="closeWaiveModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon success"><i class="fas fa-gift"></i></div>
          <h3>Ondoa Adhabu</h3>
          <button class="close-btn" @click="closeWaiveModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kuondoa adhabu kwa mkopo huu?</p>
          <div class="loan-summary" v-if="selectedLoan">
            <p><strong>Mkopo #:</strong> {{ selectedLoan.loan_number }}</p>
            <p><strong>Mteja:</strong> {{ selectedLoan.customer?.full_name }}</p>
            <p>
              <strong>Kiasi cha Adhabu:</strong>
              {{ formatCurrency(selectedLoan.penalty_amount || 0) }}
            </p>
          </div>
          <div class="form-group">
            <label for="waive_reason">Sababu ya kuondoa adhabu</label>
            <textarea
              id="waive_reason"
              v-model="waiveReason"
              class="form-control"
              rows="3"
              placeholder="Weka sababu ya kuondoa adhabu..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeWaiveModal" class="btn-secondary">Ghairi</button>
          <button @click="confirmWaivePenalty" class="btn-success" :disabled="actionLoading">
            <span v-if="actionLoading" class="spinner"></span>
            <span v-else><i class="fas fa-check"></i> Ndiyo, Ondoa Adhabu</span>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency, formatDate } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const router = useRouter()
// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// State
const loans = ref([])
const loading = ref(false)
const error = ref(null)
const showFilters = ref(true)
const selectedLoan = ref(null)
const actionLoading = ref(false)
const exportLoading = ref(false)
const reminderMessage = ref('')
const waiveReason = ref('')
const showReminderModal = ref(false)
const showWaiveModal = ref(false)
const activeActionMenu = ref(null)
const actionDropdownRefs = ref({})
const expandedRows = ref({})

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Filters
const filters = reactive({
  search: '',
  date_from: '',
  date_to: '',
  sortBy: 'due_date',
  sortOrder: 'desc',
  perPage: 10,
  page: 1,
})

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  total: 0,
  from: 0,
  to: 0,
})

const loanStatistics = ref([
  {
    icon: 'fas fa-clock',
    label: 'Jumla Iliyopitiliza',
    value: 0,
    color: 'linear-gradient(135deg, #e74c3c, #c0392b)',
  },
  {
    icon: 'fas fa-money-bill',
    label: 'Jumla ya Kiasi',
    value: 0,
    color: 'linear-gradient(135deg, #3498db, #2980b9)',
  },
  {
    icon: 'fas fa-exclamation-triangle',
    label: 'Jumla ya Adhabu',
    value: 0,
    color: 'linear-gradient(135deg, #f39c12, #e67e22)',
  },
  {
    icon: 'fas fa-chart-line',
    label: 'Wastani wa Siku Zilizopitiliza',
    value: 0,
    color: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
  },
])

// Computed
const hasActiveFilters = computed(() => filters.search || filters.date_from || filters.date_to)
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.search) count++
  if (filters.date_from) count++
  if (filters.date_to) count++
  return count
})

const paginationPages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(pagination.lastPage, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const toastIcon = computed(() =>
  toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle',
)

// Helper Methods
const formatNumber = (value) => (typeof value === 'number' ? value.toLocaleString() : value)

const formatOverdueDays = (days) => {
  if (!days && days !== 0) return ''
  if (days === 0) return 'Siku ya leo'
  if (days === 1) return 'Siku 1'
  return `Siku ${Math.round(days)}`
}

const getOverdueClass = (days) => {
  const numDays = Number(days)
  if (isNaN(numDays)) return ''
  if (numDays <= 7) return 'overdue-mild'
  if (numDays <= 30) return 'overdue-moderate'
  if (numDays <= 90) return 'overdue-severe'
  return 'overdue-critical'
}

const getPaidInstallmentsCount = (loan) =>
  loan.payment_schedule?.filter((p) => p.status === 'paid').length || 0
const getOverdueInstallmentsCount = (loan) =>
  loan.payment_schedule?.filter((p) => p.status === 'overdue').length || 0
const getPaymentProgress = (loan) => {
  const total = loan.total_amount || 0
  const paid = loan.total_paid || 0
  return total === 0 ? 0 : Math.min((paid / total) * 100, 100)
}

// Methods
const loadLoans = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      page: filters.page,
      per_page: filters.perPage,
      sort_field: filters.sortBy,
      sort_order: filters.sortOrder,
      status: 'overdue',
    }
    if (filters.search) params.search = filters.search
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to

    const response = await axios.get(`${API_URL}/overdue`, { params })
    if (response.data.success) {
      const responseData = response.data.data
      loans.value = responseData.data || []
      pagination.currentPage = responseData.current_page || 1
      pagination.lastPage = responseData.last_page || 1
      pagination.perPage = responseData.per_page || filters.perPage
      pagination.total = responseData.total || 0
      pagination.from = responseData.from || 0
      pagination.to = responseData.to || 0
      await loadStatistics()
    }
  } catch (err) {
    console.error('Error loading overdue loans:', err)
    error.value = err.response?.data?.message || 'Imeshindwa kupakia mikopo iliyopitiliza.'
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await axios.get(`${API_URL}/loans/overdue/summary`)
    if (response.data.success) {
      const stats = response.data.data
      loanStatistics.value = [
        { ...loanStatistics.value[0], value: stats.total_overdue || 0 },
        { ...loanStatistics.value[1], value: stats.total_amount || 0 },
        { ...loanStatistics.value[2], value: stats.total_penalty || 0 },
        { ...loanStatistics.value[3], value: stats.avg_days_overdue || 0 },
      ]
    }
  } catch (err) {
    console.error('Error loading statistics:', err)
  }
}

const debouncedSearch = debounce(() => {
  filters.page = 1
  loadLoans()
}, 500)
const clearFilter = (filter) => {
  filters[filter] = ''
  filters.page = 1
  loadLoans()
}
const clearAllFilters = () => {
  filters.search = ''
  filters.date_from = ''
  filters.date_to = ''
  filters.sortBy = 'due_date'
  filters.sortOrder = 'desc'
  filters.perPage = 10
  filters.page = 1
  loadLoans()
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    filters.page = page
    loadLoans()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const toggleDetails = (loanId) => {
  expandedRows.value = { ...expandedRows.value, [loanId]: !expandedRows.value[loanId] }
}

const setActionDropdownRef = (el, loanId) => {
  if (el) actionDropdownRefs.value[loanId] = el
}
const toggleActionMenu = (loanId) => {
  activeActionMenu.value = activeActionMenu.value === loanId ? null : loanId
}
const closeActionMenu = () => {
  activeActionMenu.value = null
}

const handleClickOutside = (event) => {
  let clickedOutside = true
  Object.values(actionDropdownRefs.value).forEach((ref) => {
    if (ref && ref.contains(event.target)) clickedOutside = false
  })
  if (clickedOutside) closeActionMenu()
}

const viewLoan = (loan) => {
  router.push(`/loans/${loan.id}`)
}

const sendReminder = (loan) => {
  selectedLoan.value = loan
  reminderMessage.value = ''
  showReminderModal.value = true
  closeActionMenu()
}

const closeReminderModal = () => {
  showReminderModal.value = false
  selectedLoan.value = null
  reminderMessage.value = ''
}

const confirmSendReminder = async () => {
  if (!selectedLoan.value) return
  actionLoading.value = true
  try {
    const response = await axios.post(`${API_URL}/loans/${selectedLoan.value.id}/send-reminder`, {
      message: reminderMessage.value,
    })
    if (response.data.success) {
      showToastMessage('Kikumbusho kimetumwa kwa mafanikio', 'success')
      closeReminderModal()
    }
  } catch (err) {
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
  } finally {
    actionLoading.value = false
  }
}

const waivePenalty = (loan) => {
  selectedLoan.value = loan
  waiveReason.value = ''
  showWaiveModal.value = true
  closeActionMenu()
}

const closeWaiveModal = () => {
  showWaiveModal.value = false
  selectedLoan.value = null
  waiveReason.value = ''
}

const confirmWaivePenalty = async () => {
  if (!selectedLoan.value) return
  actionLoading.value = true
  try {
    const response = await axios.post(`${API_URL}/loans/${selectedLoan.value.id}/waive-penalty`, {
      reason: waiveReason.value,
    })
    if (response.data.success) {
      showToastMessage('Adhabu imeondolewa kwa mafanikio', 'success')
      closeWaiveModal()
      await loadLoans()
    }
  } catch (err) {
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
  } finally {
    actionLoading.value = false
  }
}

const exportLoans = async () => {
  exportLoading.value = true
  showToastMessage('Mikopo inapakuliwa...', 'info')
  try {
    const params = { export: true, status: 'overdue', ...filters }
    const response = await axios.get(`${API_URL}/loans/export`, { params, responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `overdue_loans_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    showToastMessage('Mikopo imepakuliwa kwa mafanikio', 'success')
  } catch (err) {
    showToastMessage('Hitilafu wakati wa kupakua', 'error')
  } finally {
    exportLoading.value = false
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
  loadLoans()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  debouncedSearch.cancel()
})
</script>

<style scoped>
/* Same styles as before, just updated for 8 columns */
.overdue-loans-container {
  max-width: 1400px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0rem;
}
.header-left h1 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}
.loan-count {
  color: #7f8c8d;
  font-size: 1rem;
}
.loan-count strong {
  color: #e74c3c;
  font-weight: 600;
}
.header-actions {
  display: flex;
  gap: 1rem;
}
.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  background-color: #ecf0f1;
  color: #34495e;
  border: none;
}
.btn-export:hover:not(:disabled) {
  background-color: #bdc3c7;
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}
.summary-details {
  display: flex;
  flex-direction: column;
}
.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}
.summary-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}
.filters-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.filters-header {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #e9ecef;
}
.filters-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}
.filter-badge {
  background: #e74c3c;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
}
.filters-header i:last-child {
  margin-left: auto;
  transition: transform 0.3s;
}
.filters-header i.rotated {
  transform: rotate(180deg);
}
.filters-body {
  padding: 1.5rem;
}
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.filter-group label {
  font-size: 0.9rem;
  color: #34495e;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.form-control {
  padding: 0.6rem;
  border: 1px solid #dce4ec;
  border-radius: 6px;
  font-size: 0.95rem;
}
.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
.active-filters {
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.filter-tag {
  background: #ecf0f1;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.remove-filter {
  cursor: pointer;
  color: #95a5a6;
}
.remove-filter:hover {
  color: #e74c3c;
}
.clear-all-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
}
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.table-responsive {
  overflow-x: auto;
}
.loans-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.loans-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}
.loans-table td {
  padding: 1rem 0rem 0rem 0rem;
  border-bottom: 1px solid #e9ecef;
  color: #34495e;
}
.main-row {
  transition: background-color 0.2s;
  cursor: pointer;
}
.main-row:hover {
  background-color: #fff5f5;
}
.btn-expand {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
}
.expanded-details-row td {
  padding: 1.5rem !important;
  background-color: #fff8f8;
  border-top: 2px solid #e74c3c;
}
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
}
.detail-item.full-width {
  grid-column: 1 / -1;
}
.detail-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 500;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.detail-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}
.penalty-amount {
  color: #e74c3c;
  font-weight: 600;
}
.penalty-date {
  color: #7f8c8d;
}
.paid {
  color: #27ae60;
}
.balance {
  font-weight: 600;
  color: #e74c3c;
}
.overdue-mild {
  color: #f39c12;
}
.overdue-moderate {
  color: #e67e22;
}
.overdue-severe {
  color: #e74c3c;
}
.overdue-critical {
  color: #c0392b;
}
.payment-schedule-summary {
  width: 100%;
}
.schedule-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}
.stat {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}
.stat-label {
  font-size: 0.85rem;
  color: #7f8c8d;
}
.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
}
.overdue-stat {
  color: #e74c3c;
}
.progress-bar-container {
  background-color: #ecf0f1;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
}
.progress-bar {
  background: linear-gradient(90deg, #27ae60, #2ecc71);
  height: 100%;
  transition: width 0.3s;
}
.action-dropdown {
  position: relative;
}
.action-menu-btn {
  background: none;
  border: none;
  color: #7f8c8d;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}
.action-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 1000;
  margin-top: 0.5rem;
}
.action-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #2c3e50;
  text-decoration: none;
  font-size: 0.95rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
}
.action-menu-item:hover {
  background-color: #f8f9fa;
}
.action-menu-divider {
  height: 1px;
  background-color: #e9ecef;
  margin: 0.25rem 0;
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}
.pagination-btn {
  background: white;
  border: 1px solid #dce4ec;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}
.pagination-btn.active {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}
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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-icon.info {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}
.modal-icon.success {
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}
.modal-header h3 {
  flex: 1;
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.modal-body {
  padding: 1.5rem;
}
.loan-summary {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}
.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.btn-secondary {
  background: #ecf0f1;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}
.btn-info {
  background: #3498db;
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}
.btn-success {
  background: #27ae60;
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}
.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 3000;
}
.toast-notification.success {
  border-left: 4px solid #27ae60;
}
.toast-notification.error {
  border-left: 4px solid #e74c3c;
}
.empty-state-small {
  text-align: center;
  padding: 3rem;
  color: #bdc3c7;
}
.text-center {
  text-align: center;
}
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  .schedule-stats {
    flex-direction: column;
  }
}

/* Main Container */
.overdue-loans-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0rem;
}

.header-left h1 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.loan-count {
  color: #7f8c8d;
  font-size: 1rem;
}

.loan-count strong {
  color: #e74c3c;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-export,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-export {
  background-color: #ecf0f1;
  color: #34495e;
}

.btn-export:hover:not(:disabled) {
  background-color: #bdc3c7;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.summary-details {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
}

.summary-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

/* Filters Card */
.filters-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filters-header {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #e9ecef;
}

.filters-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.filter-badge {
  background: #e74c3c;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.filters-header i:last-child {
  margin-left: auto;
  transition: transform 0.3s;
}

.filters-header i.rotated {
  transform: rotate(180deg);
}

.filters-body {
  padding: 1.5rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  color: #34495e;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-control {
  padding: 0.6rem;
  border: 1px solid #dce4ec;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Active Filters */
.active-filters {
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.active-filters-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-right: 1rem;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.filter-tag {
  background: #ecf0f1;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #2c3e50;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-filter {
  cursor: pointer;
  color: #95a5a6;
  transition: color 0.2s;
}

.remove-filter:hover {
  color: #e74c3c;
}

.clear-all-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: #fee;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 3rem;
  color: #e74c3c;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.error-state p {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
}

.btn-retry {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #2980b9;
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
}

.loans-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.loans-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.loans-table td {
  padding: 1rem 0rem 0rem 0rem;
  border-bottom: 1px solid #e9ecef;
  color: #34495e;
}

/* Main Row Styles */
.main-row {
  transition: background-color 0.2s;
}

.main-row:hover {
  background-color: #fff5f5;
}

.main-row.overdue {
  border-left: 3px solid #e74c3c;
}

.main-row.expanded {
  background-color: #fff0f0;
  border-bottom: none;
}

.main-row.expanded td {
  border-bottom: none;
}

/* Expand Button */
.btn-expand {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-expand:hover {
  color: #c0392b;
  background-color: rgba(231, 76, 60, 0.1);
  transform: scale(1.1);
}

/* Expanded Details Row */
.expanded-details-row {
  background-color: #fff8f8;
  animation: slideDown 0.2s ease-out;
}

.expanded-details-row td {
  padding: 1.5rem !important;
  background-color: #fff8f8;
  border-top: 2px solid #e74c3c;
  border-bottom: 2px solid #e9ecef;
}

.expanded-details {
  width: 100%;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item:hover {
  background-color: rgba(231, 76, 60, 0.05);
}

.detail-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.detail-label i {
  font-size: 0.9rem;
  color: #e74c3c;
}

.detail-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.detail-value.penalty {
  color: #e74c3c;
}

/* Payment Schedule Summary */
.payment-schedule-summary {
  width: 100%;
}

.schedule-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.stat-label {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.stat-value.overdue-stat {
  color: #e74c3c;
}

.progress-bar-container {
  background-color: #ecf0f1;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
}

.progress-bar {
  background: linear-gradient(90deg, #27ae60, #2ecc71);
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

/* Balance Styles */
.balance {
  font-weight: 600;
  color: #e74c3c;
}

.balance.negative-balance {
  color: #27ae60;
}

.paid {
  color: #27ae60;
  font-weight: 500;
}

/* Overdue Info */
.overdue-info {
  display: flex;
  align-items: center;
}

.overdue-days {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
}

.overdue-days i {
  font-size: 0.8rem;
}

.overdue-mild {
  background-color: #fff3e0;
  color: #f39c12;
}

.overdue-moderate {
  background-color: #ffe0e0;
  color: #e67e22;
}

.overdue-severe {
  background-color: #ffcccc;
  color: #e74c3c;
}

.overdue-critical {
  background-color: #ff9999;
  color: #c0392b;
}

/* Penalty Amount */
.penalty-amount {
  color: #e74c3c;
  font-weight: 600;
}

.no-penalty {
  color: #95a5a6;
}

/* Customer Cell */
.customer-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.customer-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 500;
  color: #2c3e50;
}

.customer-phone {
  font-size: 0.85rem;
  color: #7f8c8d;
}

/* Amount Styles */
.amount,
.total {
  font-weight: 600;
  color: #2c3e50;
}

.duration {
  color: #34495e;
}

/* Action Menu */
.action-dropdown {
  position: relative;
}

.action-menu-btn {
  background: none;
  border: none;
  color: #7f8c8d;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-menu-btn:hover {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.action-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  margin-top: 0.5rem;
  overflow: hidden;
}

.action-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #2c3e50;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.action-menu-item:hover {
  background-color: #f8f9fa;
}

.action-menu-divider {
  height: 1px;
  background-color: #e9ecef;
  margin: 0.25rem 0;
}

/* Animation */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Empty State */
.empty-state-small {
  text-align: center;
  padding: 3rem;
  color: #bdc3c7;
}

.empty-state-small i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.pagination-info {
  color: #7f8c8d;
  font-size: 0.95rem;
}

.pagination-buttons {
  display: flex;
  gap: 0.5rem;
}

.pagination-btn {
  background: white;
  border: 1px solid #dce4ec;
  color: #2c3e50;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.pagination-btn.active {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  animation: fadeIn 0.2s;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.modal-icon.success {
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}

.modal-icon.danger {
  background: rgba(231, 76, 60, 0.1);
  color: #c0392b;
}

.modal-icon.info {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.modal-header h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  color: #95a5a6;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 1.5rem;
}

.loan-summary {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.loan-summary p {
  margin: 0.5rem 0;
  color: #2c3e50;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary,
.btn-success,
.btn-danger,
.btn-info {
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: #ecf0f1;
  color: #34495e;
}

.btn-secondary:hover {
  background: #bdc3c7;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #2ecc71;
  transform: translateY(-2px);
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
}

.btn-info {
  background: #3498db;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}

/* Toast Notification */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 3000;
  animation: slideInRight 0.3s;
}

.toast-notification.success {
  border-left: 4px solid #27ae60;
}

.toast-notification.error {
  border-left: 4px solid #e74c3c;
}

.toast-notification.info {
  border-left: 4px solid #3498db;
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

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .overdue-loans-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .schedule-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Text utilities */
.text-center {
  text-align: center;
}

.text-muted {
  color: #95a5a6;
}

.text-danger {
  color: #e74c3c;
}
</style>
