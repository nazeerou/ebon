<template>
  <div class="pending-loans-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Mikopo Inayosubiri</h1>
        <p class="loan-count" v-if="!loading">
          Jumla ya mikopo inayosubiri: <strong>{{ pagination.total }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportLoans" :disabled="exportLoading">
          <i class="fas fa-download"></i>
          <span>{{ exportLoading ? 'Inahamisha...' : 'Pakua' }}</span>
        </button>
        <!-- <router-link to="/loans/create" class="btn-primary">
          <i class="fas fa-plus"></i>
          <span>Ombi Jipya</span>
        </router-link> -->
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
        <h3>Filters</h3>
        <span class="filter-badge" v-if="activeFilterCount > 0">{{ activeFilterCount }}</span>
        <i class="fas fa-chevron-down" :class="{ rotated: showFilters }"></i>
      </div>

      <div v-show="showFilters" class="filters-body">
        <div class="filters-grid">
          <!-- Search -->
          <div class="filter-group">
            <label>
              <i class="fas fa-search"></i>
              Tafuta
            </label>
            <input
              type="text"
              v-model="filters.search"
              @input="debouncedSearch"
              placeholder="Namba ya mkopo, jina la mteja, simu..."
              class="form-control"
            />
          </div>

          <!-- Date Range -->
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

          <!-- Amount Range -->
          <div class="filter-group">
            <label>
              <i class="fas fa-money-bill"></i>
              Kiasi cha Chini
            </label>
            <input
              type="number"
              v-model="filters.min_amount"
              @input="debouncedFilter"
              placeholder="0"
              class="form-control"
            />
          </div>

          <div class="filter-group">
            <label>
              <i class="fas fa-money-bill"></i>
              Kiasi cha Juu
            </label>
            <input
              type="number"
              v-model="filters.max_amount"
              @input="debouncedFilter"
              placeholder="10000000"
              class="form-control"
            />
          </div>

          <!-- Sort -->
          <div class="filter-group">
            <label>
              <i class="fas fa-sort"></i>
              Panga Kwa
            </label>
            <select v-model="filters.sortBy" @change="loadLoans" class="form-control">
              <option value="created_at">Tarehe ya Kuombwa</option>
              <option value="amount">Kiasi cha Mkopo</option>
              <option value="customer_name">Jina la Mteja</option>
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

          <!-- Per Page -->
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
            <span v-if="filters.min_amount" class="filter-tag">
              <i class="fas fa-money-bill"></i>
              ≥ {{ formatCurrency(filters.min_amount) }}
              <i @click="clearFilter('min_amount')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.max_amount" class="filter-tag">
              <i class="fas fa-money-bill"></i>
              ≤ {{ formatCurrency(filters.max_amount) }}
              <i @click="clearFilter('max_amount')" class="fas fa-times remove-filter"></i>
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
      <p>Inapakia mikopo inayosubiri...</p>
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

    <!-- Loans Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="loans-table">
          <thead>
            <tr>
              <th style="width: 50px"></th>
              <th>Namba ya Mkopo</th>
              <th>Mteja</th>
              <th>Kiasi cha Mkopo</th>
              <th>Jumla</th>
              <th>Muda</th>
              <th>Mzunguko</th>
              <th>Tarehe ya Kuombwa</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="loan in loans" :key="loan.id">
              <!-- Main Row -->
              <tr class="main-row" :class="{ expanded: expandedRows[loan.id] }">
                <!-- Expand button column -->
                <td @click.stop>
                  <button
                    @click="toggleDetails(loan.id)"
                    class="btn-expand"
                    :title="expandedRows[loan.id] ? 'Ficha maelezo' : 'Onyesha maelezo'"
                  >
                    <i
                      class="fas"
                      :class="
                        expandedRows[loan.id] ? 'fa-chevron-circle-up' : 'fa-chevron-circle-down'
                      "
                    ></i>
                  </button>
                </td>

                <td @click="viewLoan(loan)">
                  <span class="loan-number">#{{ loan.loan_number }}</span>
                </td>
                <td @click="viewLoan(loan)">
                  <div class="customer-cell">
                    <img
                      :src="loan.customer?.profile_photo_url || '/default-avatar.png'"
                      :alt="loan.customer?.full_name"
                      class="customer-avatar"
                    />
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
                  <span class="total">{{ formatCurrency(loan.total_amount) }}</span>
                </td>
                <td @click="viewLoan(loan)">
                  <span class="duration">{{ loan.duration_months }} miezi</span>
                </td>
                <td @click="viewLoan(loan)">
                  <span class="frequency">{{ getFrequencyText(loan.payment_frequency) }}</span>
                </td>
                <td @click="viewLoan(loan)">
                  <div class="date-info">
                    <span class="date">{{ formatDate(loan.created_at) }}</span>
                    <span class="days-pending" v-if="loan.days_pending">
                      {{ formatDays(loan.days_pending) }}
                    </span>
                  </div>
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
                      <button @click.stop="approveLoan(loan)" class="action-menu-item success">
                        <i class="fas fa-check-circle"></i>
                        <span>Idhinisha</span>
                      </button>
                      <button @click.stop="rejectLoan(loan)" class="action-menu-item danger">
                        <i class="fas fa-times-circle"></i>
                        <span>Kataa</span>
                      </button>
                      <router-link
                        :to="`/loans/${loan.id}/edit`"
                        class="action-menu-item"
                        @click="closeActionMenu"
                      >
                        <i class="fas fa-edit"></i>
                        <span>Hariri</span>
                      </router-link>
                      <div class="action-menu-divider"></div>
                      <button @click.stop="confirmDelete(loan)" class="action-menu-item danger">
                        <i class="fas fa-trash-alt"></i>
                        <span>Futa</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Expanded Details Row - Directly below its parent row -->
              <tr v-if="expandedRows[loan.id]" class="expanded-details-row">
                <td colspan="9">
                  <div class="expanded-details">
                    <div class="details-grid">
                      <!-- Riba -->
                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-percent"></i>
                          Riba
                        </span>
                        <span class="detail-value interest-rate">{{ loan.interest_rate }}%</span>
                      </div>

                      <!-- Risk Score -->
                      <div class="detail-item" v-if="loan.risk_score">
                        <span class="detail-label">
                          <i class="fas fa-chart-line"></i>
                          Risk Score
                        </span>
                        <div class="risk-score" :class="loan.risk_score.level">
                          <span class="score">{{ loan.risk_score.score }}</span>
                          <span class="level">{{ getRiskLevelText(loan.risk_score.level) }}</span>
                        </div>
                      </div>

                      <!-- Approve Status -->
                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-check-circle"></i>
                          Approve
                        </span>
                        <span v-if="loan.can_auto_approve" class="auto-approve-badge">
                          <i class="fas fa-robot"></i>
                          Ndiyo
                        </span>
                        <span v-else class="text-muted">Hapana</span>
                      </div>

                      <!-- Payment Details -->
                      <div class="detail-item">
                        <span class="detail-label">
                          <i class="fas fa-money-bill-wave"></i>
                          Malipo kwa Mwezi
                        </span>
                        <span class="detail-value">{{
                          formatCurrency(loan.monthly_payment || loan.amount / loan.duration_months)
                        }}</span>
                      </div>

                      <!-- Notes -->
                      <div class="detail-item" v-if="loan.notes">
                        <span class="detail-label">
                          <i class="fas fa-sticky-note"></i>
                          Maelezo
                        </span>
                        <span class="detail-value">{{ loan.notes }}</span>
                      </div>

                      <!-- Purpose -->
                      <div class="detail-item" v-if="loan.purpose">
                        <span class="detail-label">
                          <i class="fas fa-bullseye"></i>
                          Madhumuni
                        </span>
                        <span class="detail-value">{{ loan.purpose }}</span>
                      </div>

                      <!-- Approval Notes -->
                      <div class="detail-item" v-if="loan.approved_notes">
                        <span class="detail-label">
                          <i class="fas fa-check-double"></i>
                          Maelezo ya Idhinisho
                        </span>
                        <span class="detail-value">{{ loan.approved_notes }}</span>
                      </div>

                      <!-- Rejection Reason -->
                      <div class="detail-item" v-if="loan.rejection_reason">
                        <span class="detail-label">
                          <i class="fas fa-times-circle"></i>
                          Sababu ya Kukataliwa
                        </span>
                        <span class="detail-value text-danger">{{ loan.rejection_reason }}</span>
                      </div>

                      <!-- Disbursement Date -->
                      <div class="detail-item" v-if="loan.disbursement_date">
                        <span class="detail-label">
                          <i class="fas fa-calendar-check"></i>
                          Tarehe ya Kutoa
                        </span>
                        <span class="detail-value">{{ formatDate(loan.disbursement_date) }}</span>
                      </div>

                      <!-- Due Date -->
                      <div class="detail-item" v-if="loan.due_date">
                        <span class="detail-label">
                          <i class="fas fa-calendar-times"></i>
                          Tarehe ya Kukamilisha
                        </span>
                        <span class="detail-value">{{ formatDate(loan.due_date) }}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-if="loans.length === 0">
              <td colspan="9" class="text-center">
                <div class="empty-state-small">
                  <i class="fas fa-clock"></i>
                  <p>Hakuna mikopo inayosubiri</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.lastPage > 1">
        <div class="pagination-info">
          Showing {{ pagination.from }} - {{ pagination.to }} of {{ pagination.total }} entries
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

    <!-- Approve Loan Modal -->
    <div v-if="showApproveModal" class="modal-overlay" @click="closeApproveModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon success">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>Idhinisha Mkopo</h3>
          <button class="close-btn" @click="closeApproveModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kuidhinisha mkopo huu?</p>
          <div class="loan-summary" v-if="selectedLoan">
            <p><strong>Mkopo #:</strong> {{ selectedLoan.loan_number }}</p>
            <p><strong>Mteja:</strong> {{ selectedLoan.customer?.full_name }}</p>
            <p><strong>Kiasi:</strong> {{ formatCurrency(selectedLoan.amount) }}</p>
            <p><strong>Risk Score:</strong> {{ selectedLoan.risk_score?.score || 'N/A' }}</p>
          </div>
          <div class="form-group">
            <label for="approval_notes">Maelezo (si lazima)</label>
            <textarea
              id="approval_notes"
              v-model="approvalNotes"
              class="form-control"
              rows="3"
              placeholder="Weka maelezo yoyote kuhusu uidhinishaji huu..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeApproveModal" class="btn-secondary">Ghairi</button>
          <button @click="confirmApprove" class="btn-success" :disabled="actionLoading">
            <span v-if="actionLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-check"></i>
              Ndiyo, Idhinisha
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Loan Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeRejectModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon danger">
            <i class="fas fa-times-circle"></i>
          </div>
          <h3>Kataa Mkopo</h3>
          <button class="close-btn" @click="closeRejectModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kukataa mkopo huu?</p>
          <div class="loan-summary" v-if="selectedLoan">
            <p><strong>Mkopo #:</strong> {{ selectedLoan.loan_number }}</p>
            <p><strong>Mteja:</strong> {{ selectedLoan.customer?.full_name }}</p>
            <p><strong>Kiasi:</strong> {{ formatCurrency(selectedLoan.amount) }}</p>
          </div>
          <div class="form-group required">
            <label for="rejection_reason">Sababu ya kukataa</label>
            <textarea
              id="rejection_reason"
              v-model="rejectionReason"
              class="form-control"
              rows="3"
              placeholder="Weka sababu ya kukataa mkopo huu..."
              required
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeRejectModal" class="btn-secondary">Ghairi</button>
          <button
            @click="confirmReject"
            class="btn-danger"
            :disabled="actionLoading || !rejectionReason"
          >
            <span v-if="actionLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-times"></i>
              Ndiyo, Kataa
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Loan Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon danger">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Futa Mkopo</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kufuta mkopo huu?</p>
          <p class="warning-text" v-if="selectedLoan">
            <strong>Mkopo #{{ selectedLoan.loan_number }}</strong>
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Hatua hii haiwezi kutenguliwa. Mkopo utafutwa kabisa kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="deleteLoan" class="btn-danger" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-trash-alt"></i>
              Futa Mkopo
            </span>
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

// API base URL
// Base URL for images
// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// State
const loans = ref([])
const loading = ref(false)
const error = ref(null)
const showFilters = ref(true)
const selectedLoan = ref(null)
const actionLoading = ref(false)
const deleteLoading = ref(false)
const exportLoading = ref(false)
const approvalNotes = ref('')
const rejectionReason = ref('')
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showDeleteModal = ref(false)
const activeActionMenu = ref(null)
const actionDropdownRefs = ref({})

// State for expanded rows
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
  min_amount: '',
  max_amount: '',
  sortBy: 'created_at',
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
    label: 'Jumla Inayosubiri',
    value: 0,
    color: 'linear-gradient(135deg, #f39c12, #e67e22)',
  },
  {
    icon: 'fas fa-money-bill',
    label: 'Jumla ya Kiasi',
    value: 0,
    color: 'linear-gradient(135deg, #3498db, #2980b9)',
  },
  {
    icon: 'fas fa-percent',
    label: 'Wastani wa Riba',
    value: 0,
    color: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
  },
  {
    icon: 'fas fa-chart-line',
    label: 'Wastani wa Risk Score',
    value: 0,
    color: 'linear-gradient(135deg, #e74c3c, #c0392b)',
  },
])

// Computed
const hasActiveFilters = computed(() => {
  return (
    filters.search ||
    filters.date_from ||
    filters.date_to ||
    filters.min_amount ||
    filters.max_amount
  )
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.search) count++
  if (filters.date_from) count++
  if (filters.date_to) count++
  if (filters.min_amount) count++
  if (filters.max_amount) count++
  return count
})

const paginationPages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(pagination.lastPage, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Format days properly
// Format days properly with professional Swahili grammar
const formatDays = (days) => {
  if (days === null || days === undefined) return ''

  const numDays = Number(days)
  if (isNaN(numDays)) return ''

  const roundedDays = Math.round(numDays)

  if (roundedDays === 0) return 'Siku ya leo'
  if (roundedDays === 1) return 'Siku 1 iliyopita'
  return `Siku ${roundedDays} zilizopita`
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
    }

    if (filters.search) params.search = filters.search
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
    if (filters.min_amount) params.min_amount = filters.min_amount
    if (filters.max_amount) params.max_amount = filters.max_amount

    const response = await axios.get(`${API_URL}/loans/pending/loan`, { params })

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
    console.error('Error loading pending loans:', err)
    error.value = err.response?.data?.message || 'Imeshindwa kupakia mikopo. Tafadhali jaribu tena.'
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await axios.get(`${API_URL}/loans/pending/summary`)

    if (response.data.success) {
      const stats = response.data.data

      loanStatistics.value = [
        {
          icon: 'fas fa-clock',
          label: 'Jumla Inayosubiri',
          value: stats.total_pending || 0,
          color: 'linear-gradient(135deg, #f39c12, #e67e22)',
        },
        {
          icon: 'fas fa-money-bill',
          label: 'Jumla ya Kiasi',
          value: stats.total_amount || 0,
          color: 'linear-gradient(135deg, #3498db, #2980b9)',
        },
        {
          icon: 'fas fa-percent',
          label: 'Wastani wa Riba',
          value: stats.average_interest || 0,
          color: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
        },
        {
          icon: 'fas fa-chart-line',
          label: 'Wastani wa Risk Score',
          value: stats.average_risk_score || 0,
          color: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        },
      ]
    }
  } catch (err) {
    console.error('Error loading statistics:', err)
  }
}

const formatNumber = (value) => {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return value
}

const debouncedSearch = debounce(() => {
  filters.page = 1
  loadLoans()
}, 500)

const debouncedFilter = debounce(() => {
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
  filters.min_amount = ''
  filters.max_amount = ''
  filters.sortBy = 'created_at'
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

const getFrequencyText = (frequency) => {
  const texts = {
    daily: 'Kila Siku',
    weekly: 'Kila Wiki',
    monthly: 'Kila Mwezi',
  }
  return texts[frequency] || frequency
}

const getRiskLevelText = (level) => {
  const texts = {
    low: 'Chini',
    medium: 'Wastani',
    high: 'Juu',
    very_high: 'Juu Sana',
  }
  return texts[level] || level
}

// Toggle details for expanded rows
const toggleDetails = (loanId) => {
  expandedRows.value = {
    ...expandedRows.value,
    [loanId]: !expandedRows.value[loanId],
  }
}

// Action Menu methods
const setActionDropdownRef = (el, loanId) => {
  if (el) {
    actionDropdownRefs.value[loanId] = el
  }
}

const toggleActionMenu = (loanId) => {
  if (activeActionMenu.value === loanId) {
    activeActionMenu.value = null
  } else {
    activeActionMenu.value = loanId
  }
}

const closeActionMenu = () => {
  activeActionMenu.value = null
}

// Handle click outside
const handleClickOutside = (event) => {
  let clickedOutside = true

  Object.values(actionDropdownRefs.value).forEach((ref) => {
    if (ref && ref.contains(event.target)) {
      clickedOutside = false
    }
  })

  if (clickedOutside) {
    closeActionMenu()
  }
}

// Navigation
// const viewLoan = (loan) => {
//   router.push(`/loans/${loan.id}`)
// }

// Approve modal
const approveLoan = (loan) => {
  selectedLoan.value = loan
  approvalNotes.value = ''
  showApproveModal.value = true
  closeActionMenu()
}

const closeApproveModal = () => {
  showApproveModal.value = false
  selectedLoan.value = null
  approvalNotes.value = ''
}

const confirmApprove = async () => {
  if (!selectedLoan.value) return

  actionLoading.value = true

  try {
    const response = await axios.post(`${API_URL}/loans/${selectedLoan.value.id}/approve`, {
      approved_notes: approvalNotes.value,
    })

    if (response.data.success) {
      showToastMessage('Mkopo umeidhinishwa kwa mafanikio', 'success')
      closeApproveModal()
      await loadLoans()
    }
  } catch (err) {
    console.error('Error approving loan:', err)
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Reject modal
const rejectLoan = (loan) => {
  selectedLoan.value = loan
  rejectionReason.value = ''
  showRejectModal.value = true
  closeActionMenu()
}

const closeRejectModal = () => {
  showRejectModal.value = false
  selectedLoan.value = null
  rejectionReason.value = ''
}

const confirmReject = async () => {
  if (!rejectionReason.value || !selectedLoan.value) return

  actionLoading.value = true

  try {
    const response = await axios.post(`${API_URL}/loans/${selectedLoan.value.id}/reject`, {
      rejection_reason: rejectionReason.value,
    })

    if (response.data.success) {
      showToastMessage('Mkopo umekataliwa', 'info')
      closeRejectModal()
      await loadLoans()
    }
  } catch (err) {
    console.error('Error rejecting loan:', err)
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Delete modal
const confirmDelete = (loan) => {
  selectedLoan.value = loan
  showDeleteModal.value = true
  closeActionMenu()
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedLoan.value = null
}

const deleteLoan = async () => {
  if (!selectedLoan.value) return

  deleteLoading.value = true

  try {
    const response = await axios.delete(`${API_URL}/loans/${selectedLoan.value.id}`)

    if (response.data.success) {
      showToastMessage('Mkopo umefutwa kwa mafanikio', 'success')
      closeDeleteModal()
      await loadLoans()
    }
  } catch (err) {
    console.error('Error deleting loan:', err)
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Export
const exportLoans = async () => {
  exportLoading.value = true
  showToastMessage('Mikopo inapakuliwa...', 'info')

  try {
    const params = {
      export: true,
      status: 'pending',
      ...filters,
    }

    const response = await axios.get(`${API_URL}/loans/export`, {
      params,
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `pending_loans_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()

    showToastMessage('Mikopo imepakuliwa kwa mafanikio', 'success')
  } catch (err) {
    console.error('Error exporting loans:', err)
    showToastMessage('Hitilafu wakati wa kupakua', 'error')
  } finally {
    exportLoading.value = false
  }
}

// Toast
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
  debouncedFilter.cancel()
})
</script>

<style scoped>
/* Main Container */
.pending-loans-container {
  /* padding: 1rem; */
  max-width: 1000px;
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
  color: #3498db;
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

.btn-primary {
  background-color: #3498db;
  color: white;
  text-decoration: none;
}

.btn-primary:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.btn-export:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  background: #3498db;
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
  font-size: 0.95rem;
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
  background-color: #f5f9ff;
}

.main-row.expanded {
  background-color: #f0f7ff;
  border-bottom: none;
}

.main-row.expanded td {
  border-bottom: none;
}

/* Expand Button */
.btn-expand {
  background: none;
  border: none;
  color: #3498db;
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
  color: #2980b9;
  background-color: rgba(52, 152, 219, 0.1);
  transform: scale(1.1);
}

/* Expanded Details Row */
.expanded-details-row {
  background-color: #f8faff;
  animation: slideDown 0.2s ease-out;
}

.expanded-details-row td {
  padding: 1.5rem !important;
  background-color: #f8faff;
  border-top: 2px solid #3498db;
  border-bottom: 2px solid #e9ecef;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

/* Connect main row to expanded row */
.main-row.expanded + .expanded-details-row {
  margin-top: 0;
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

.detail-item:hover {
  background-color: rgba(52, 152, 219, 0.05);
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
  color: #3498db;
}

.detail-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

/* Risk Score */
.risk-score {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 1rem;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 500;
}

.risk-score.low {
  background-color: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.risk-score.medium {
  background-color: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.risk-score.high {
  background-color: rgba(230, 126, 34, 0.1);
  color: #e67e22;
}

.risk-score.very_high {
  background-color: rgba(192, 57, 43, 0.1);
  color: #c0392b;
}

/* Auto Approve Badge */
.auto-approve-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 500;
  width: fit-content;
}

.auto-approve-badge i {
  font-size: 0.9rem;
}

/* Interest Rate */
.interest-rate {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 30px;
  display: inline-block;
  font-size: 0.95rem;
  font-weight: 500;
  width: fit-content;
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

.duration,
.frequency {
  color: #34495e;
}

/* Date Info */
.date-info {
  display: flex;
  flex-direction: column;
}

.date {
  font-weight: 500;
}

.days-pending {
  font-size: 0.85rem;
  color: #e67e22;
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

.action-menu-item.success:hover {
  background-color: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}

.action-menu-item.danger:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: #c0392b;
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
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.pagination-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
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
.btn-danger {
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

.warning-note {
  color: #e67e22;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
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
  .pending-loans-container {
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

/* Spacing utilities */
.mt-2 {
  margin-top: 0.5rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}
</style>
