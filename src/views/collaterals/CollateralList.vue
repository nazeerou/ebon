<template>
  <div class="collateral-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Dhamana Zote</h1>
        <p class="collateral-count" v-if="!loading">
          Jumla ya dhamana: <strong>{{ pagination.total || 0 }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportCollaterals">
          <i class="fas fa-download"></i>
          <span>Pakua</span>
        </button>
        <button
          class="btn-filter-toggle"
          @click="showFilters = !showFilters"
          :class="{ active: hasActiveFilters }"
        >
          <i class="fas fa-filter"></i>
          <span>Filters</span>
          <span v-if="activeFilterCount" class="filter-badge">{{ activeFilterCount }}</span>
        </button>
        <!-- <router-link to="/collateral/create" class="btn-primary">
          <i class="fas fa-plus-circle"></i>
          <span>Ongeza Dhamana</span>
        </router-link> -->
      </div>
    </div>

    <!-- Filters Panel -->
    <transition name="slide">
      <div v-if="showFilters" class="filters-panel">
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
              placeholder="Jina la dhamana, maelezo..."
              class="form-control"
            />
          </div>

          <!-- Type Filter -->
          <div class="filter-group">
            <label>
              <i class="fas fa-tag"></i>
              Aina
            </label>
            <select v-model="filters.type" @change="loadCollaterals" class="form-control">
              <option value="">Zote</option>
              <option value="land">Shamba/Ardhi</option>
              <option value="vehicle">Gari</option>
              <option value="equipment">Vifaa</option>
              <option value="title_deed">Hati ya Miliki</option>
              <option value="other">Nyingine</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="filter-group">
            <label>
              <i class="fas fa-circle"></i>
              Hali
            </label>
            <select v-model="filters.status" @change="loadCollaterals" class="form-control">
              <option value="">Zote</option>
              <option value="active">Inatumika</option>
              <option value="taken">Imechukuliwa</option>
              <option value="released">Imetolewa</option>
              <option value="pending">Inasubiri</option>
            </select>
          </div>

          <!-- Sort Field -->
          <div class="filter-group">
            <label>
              <i class="fas fa-sort"></i>
              Panga kwa
            </label>
            <select v-model="filters.sort_field" @change="loadCollaterals" class="form-control">
              <option value="created_at">Tarehe ya Kuongezwa</option>
              <option value="name">Jina</option>
              <option value="estimated_value">Thamani</option>
              <option value="status">Hali</option>
            </select>
          </div>

          <!-- Sort Order -->
          <div class="filter-group">
            <label>
              <i class="fas fa-sort-amount-down"></i>
              Mpango
            </label>
            <select v-model="filters.sort_order" @change="loadCollaterals" class="form-control">
              <option value="desc">Kushuka (Zinazoanza)</option>
              <option value="asc">Kupanda (Zinazomaliza)</option>
            </select>
          </div>

          <!-- Per Page -->
          <div class="filter-group">
            <label>
              <i class="fas fa-list"></i>
              Idadi kwa Ukurasa
            </label>
            <select v-model="filters.per_page" @change="loadCollaterals" class="form-control">
              <option value="10">10</option>
              <option value="15">15</option>
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
            <span v-if="filters.type" class="filter-tag">
              <i class="fas fa-tag"></i>
              {{ getTypeText(filters.type) }}
              <i @click="clearFilter('type')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.status" class="filter-tag">
              <i class="fas fa-circle"></i>
              {{ getStatusText(filters.status) }}
              <i @click="clearFilter('status')" class="fas fa-times remove-filter"></i>
            </span>
            <button @click="clearAllFilters" class="clear-all-btn">
              <i class="fas fa-trash-alt"></i>
              Futa yote
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Statistics Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #3498db, #2980b9)">
          <i class="fas fa-gem"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ statistics.total }}</span>
          <span class="stat-label">Jumla ya Dhamana</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #27ae60, #229954)">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ statistics.active }}</span>
          <span class="stat-label">Inatumika</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f39c12, #e67e22)">
          <i class="fas fa-hand-holding-usd"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ statistics.taken }}</span>
          <span class="stat-label">Imechukuliwa</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #9b59b6, #8e44ad)">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ statistics.pending }}</span>
          <span class="stat-label">Inasubiri Kuhakikiwa</span>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card total">
        <div class="summary-icon">
          <i class="fas fa-coins"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Jumla ya Thamani</span>
          <span class="summary-value">{{ formatCurrency(summary.total_value) }}</span>
        </div>
      </div>

      <div class="summary-card average">
        <div class="summary-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Wastani wa Thamani</span>
          <span class="summary-value">{{ formatCurrency(summary.average_value) }}</span>
        </div>
      </div>

      <div class="summary-card highest">
        <div class="summary-icon">
          <i class="fas fa-arrow-up"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Ya Juu Zaidi</span>
          <span class="summary-value">{{ formatCurrency(summary.highest_value) }}</span>
        </div>
      </div>

      <div class="summary-card lowest">
        <div class="summary-icon">
          <i class="fas fa-arrow-down"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Ya Chini Zaidi</span>
          <span class="summary-value">{{ formatCurrency(summary.lowest_value) }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inachakata dhamana...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadCollaterals" class="btn-retry">
        <i class="fas fa-redo"></i>
        Jaribu Tena
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="collaterals.length === 0" class="empty-state">
      <div class="empty-illustration">
        <i class="fas fa-gem"></i>
        <i class="fas fa-question"></i>
      </div>
      <h3>Hakuna dhamana iliyopatikana</h3>
      <p v-if="hasActiveFilters">
        Hakuna dhamana inayolingana na vichujio ulivyoweka. Jaribu kubadilisha vichujio.
      </p>
      <p v-else>
        Bado hakuna dhamana iliyoongezwa. Bonyeza kitufe hapa chini kuongeza dhamana ya kwanza.
      </p>
      <div class="empty-actions">
        <button v-if="hasActiveFilters" @click="clearAllFilters" class="btn-secondary">
          <i class="fas fa-times"></i>
          Futa Vichujio
        </button>
        <router-link to="/collateral/create" class="btn-primary">
          <i class="fas fa-plus-circle"></i>
          Ongeza Dhamana
        </router-link>
      </div>
    </div>

    <!-- Collaterals Grid -->
    <div v-else class="collaterals-grid">
      <div v-for="collateral in collaterals" :key="collateral.id" class="collateral-card">
        <!-- @click="viewCollateral(collateral) -->
        <div class="card-header">
          <div class="collateral-icon" :class="collateral.type">
            <i :class="getTypeIcon(collateral.type)"></i>
          </div>
          <div class="collateral-info">
            <h3 class="collateral-name">{{ collateral.name }}</h3>
            <span class="collateral-type">{{ getTypeText(collateral.type) }}</span>
          </div>
          <span class="collateral-status" :class="collateral.status">
            {{ getStatusText(collateral.status) }}
          </span>
        </div>

        <div class="card-body">
          <div class="customer-info" v-if="collateral.customer">
            <img
              :src="collateral.customer.profile_photo_url || '/default-avatar.png'"
              :alt="collateral.customer.full_name"
              class="customer-avatar"
            />
            <div class="customer-details">
              <span class="customer-name">
                {{ collateral.customer.full_name }}
              </span>
              <span class="customer-phone">{{ collateral.customer.phone }}</span>
            </div>
          </div>

          <div class="collateral-details">
            <div class="detail-item">
              <span class="detail-label">Thamani:</span>
              <span class="detail-value">{{ formatCurrency(collateral.estimated_value) }}</span>
            </div>
            <div class="detail-item" v-if="collateral.verified_value">
              <span class="detail-label">Thamani Iliyohakikiwa:</span>
              <span class="detail-value">{{ formatCurrency(collateral.verified_value) }}</span>
            </div>
            <div class="detail-item" v-if="collateral.location">
              <span class="detail-label">Mahali:</span>
              <span class="detail-value">{{ collateral.location }}</span>
            </div>
            <div class="detail-item" v-if="collateral.document_reference">
              <span class="detail-label">Namba ya Hati:</span>
              <span class="detail-value">{{ collateral.document_reference }}</span>
            </div>
          </div>

          <div v-if="collateral.description" class="collateral-description">
            <p>{{ truncateText(collateral.description, 100) }}</p>
          </div>

          <div class="verification-info" v-if="collateral.verified_by">
            <i class="fas fa-check-circle verified"></i>
            <span>Imehakikiwa na {{ collateral.verified_by.name || collateral.verified_by }}</span>
            <span class="verification-date">{{ formatDate(collateral.verified_at) }}</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="action-buttons">
            <button @click.stop="viewCollateral(collateral)" class="btn-icon" title="Angalia">
              <i class="fas fa-eye"></i>
            </button>
            <button @click.stop="editCollateral(collateral)" class="btn-icon" title="Hariri">
              <i class="fas fa-edit"></i>
            </button>
            <button
              v-if="canVerify(collateral)"
              @click.stop="verifyCollateral(collateral)"
              class="btn-icon success"
              title="Hakiki"
            >
              <i class="fas fa-check-circle"></i>
            </button>
            <button
              v-if="canTake(collateral)"
              @click.stop="takeCollateral(collateral)"
              class="btn-icon warning"
              title="Chukua"
            >
              <i class="fas fa-hand-holding-usd"></i>
            </button>
            <button
              v-if="canRelease(collateral)"
              @click.stop="releaseCollateral(collateral)"
              class="btn-icon info"
              title="Toa"
            >
              <i class="fas fa-undo-alt"></i>
            </button>
            <button
              v-if="canDelete(collateral)"
              @click.stop="confirmDelete(collateral)"
              class="btn-icon danger"
              title="Futa"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination && pagination.lastPage > 1">
      <div class="pagination-info">
        Showing {{ pagination.from || 0 }} - {{ pagination.to || 0 }} of
        {{ pagination.total || 0 }} entries
      </div>
      <div class="pagination-buttons">
        <button
          @click="changePage(pagination.currentPage - 1)"
          :disabled="!pagination.currentPage || pagination.currentPage === 1"
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
          :disabled="
            !pagination.currentPage ||
            !pagination.lastPage ||
            pagination.currentPage === pagination.lastPage
          "
          class="pagination-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Verify Collateral Modal -->
    <div v-if="showVerifyModal" class="modal-overlay" @click="closeVerifyModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon success">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>Hakiki Dhamana</h3>
          <button class="close-btn" @click="closeVerifyModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedCollateral">
          <p>Una uhakika unataka kuhakiki dhamana hii?</p>
          <div class="collateral-summary">
            <p><strong>Jina:</strong> {{ selectedCollateral.name }}</p>
            <p><strong>Aina:</strong> {{ getTypeText(selectedCollateral.type) }}</p>
            <p>
              <strong>Thamani:</strong> {{ formatCurrency(selectedCollateral.estimated_value) }}
            </p>
          </div>

          <div class="form-group">
            <label for="verified_value">Thamani Iliyohakikiwa (TZS)</label>
            <input
              type="number"
              id="verified_value"
              v-model.number="verifyForm.verified_value"
              class="form-control"
              :placeholder="selectedCollateral.estimated_value"
              min="0"
              step="1000"
            />
            <span class="input-hint">Acha ikiwa thamani haijabadilika</span>
          </div>

          <div class="form-group">
            <label for="verification_notes">Maelezo (si lazima)</label>
            <textarea
              id="verification_notes"
              v-model="verifyForm.notes"
              class="form-control"
              rows="3"
              placeholder="Weka maelezo yoyote kuhusu uhakiki huu..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeVerifyModal" class="btn-secondary">Ghairi</button>
          <button @click="confirmVerify" class="btn-success" :disabled="actionLoading">
            <span v-if="actionLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-check"></i>
              Ndiyo, Hakiki
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Take Collateral Modal -->
    <div v-if="showTakeModal" class="modal-overlay" @click="closeTakeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning">
            <i class="fas fa-hand-holding-usd"></i>
          </div>
          <h3>Chukua Dhamana</h3>
          <button class="close-btn" @click="closeTakeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedCollateral">
          <p>Una uhakika unataka kuchukua dhamana hii?</p>
          <div class="collateral-summary">
            <p><strong>Jina:</strong> {{ selectedCollateral.name }}</p>
            <p><strong>Aina:</strong> {{ getTypeText(selectedCollateral.type) }}</p>
            <p>
              <strong>Thamani:</strong>
              {{
                formatCurrency(
                  selectedCollateral.verified_value || selectedCollateral.estimated_value,
                )
              }}
            </p>
          </div>
          <div class="warning-note">
            <i class="fas fa-exclamation-triangle"></i>
            Kuchukua dhamana kutaifanya isitumike kwa mikopo mingine hadi itakapotolewa.
          </div>
          <div class="form-group">
            <label for="take_notes">Maelezo (si lazima)</label>
            <textarea
              id="take_notes"
              v-model="actionNotes"
              class="form-control"
              rows="3"
              placeholder="Weka maelezo yoyote kuhusu kuchukua dhamana hii..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeTakeModal" class="btn-secondary">Ghairi</button>
          <button @click="confirmTake" class="btn-warning" :disabled="actionLoading">
            <span v-if="actionLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-check"></i>
              Ndiyo, Chukua
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Release Collateral Modal -->
    <div v-if="showReleaseModal" class="modal-overlay" @click="closeReleaseModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon info">
            <i class="fas fa-undo-alt"></i>
          </div>
          <h3>Toa Dhamana</h3>
          <button class="close-btn" @click="closeReleaseModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedCollateral">
          <p>Una uhakika unataka kutoa dhamana hii?</p>
          <div class="collateral-summary">
            <p><strong>Jina:</strong> {{ selectedCollateral.name }}</p>
            <p><strong>Aina:</strong> {{ getTypeText(selectedCollateral.type) }}</p>
            <p>
              <strong>Thamani:</strong>
              {{
                formatCurrency(
                  selectedCollateral.verified_value || selectedCollateral.estimated_value,
                )
              }}
            </p>
          </div>
          <div class="form-group">
            <label for="release_notes">Maelezo (si lazima)</label>
            <textarea
              id="release_notes"
              v-model="actionNotes"
              class="form-control"
              rows="3"
              placeholder="Weka maelezo yoyote kuhusu kutoa dhamana hii..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeReleaseModal" class="btn-secondary">Ghairi</button>
          <button @click="confirmRelease" class="btn-info" :disabled="actionLoading">
            <span v-if="actionLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-check"></i>
              Ndiyo, Toa
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon danger">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Futa Dhamana</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kufuta dhamana hii?</p>
          <p class="warning-text" v-if="collateralToDelete">
            <strong>{{ collateralToDelete.name }}</strong>
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Hatua hii haiwezi kutenguliwa. Dhamana itafutwa kabisa kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="deleteCollateral" class="btn-danger" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-trash-alt"></i>
              Futa Dhamana
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency, formatDate } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const router = useRouter()

// State
const collaterals = ref([])
const loading = ref(false)
const error = ref(null)
const showFilters = ref(false)
const selectedCollateral = ref(null)
const collateralToDelete = ref(null)
const actionLoading = ref(false)
const deleteLoading = ref(false)
const showVerifyModal = ref(false)
const showTakeModal = ref(false)
const showReleaseModal = ref(false)
const showDeleteModal = ref(false)
const actionNotes = ref('')

// Verify form
const verifyForm = reactive({
  verified_value: null,
  notes: '',
})

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Base URL for images
// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// Filters - Updated to match API expectations
const filters = reactive({
  search: '',
  type: '',
  status: '',
  sort_field: 'created_at',
  sort_order: 'desc',
  per_page: 15,
  page: 1,
})

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  perPage: 15,
  total: 0,
  from: 0,
  to: 0,
})

const statistics = ref({
  total: 0,
  active: 0,
  taken: 0,
  pending: 0,
  released: 0,
})

const summary = ref({
  total_value: 0,
  average_value: 0,
  highest_value: 0,
  lowest_value: 0,
})

// Computed
const hasActiveFilters = computed(() => {
  return filters.search || filters.type || filters.status
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.search) count++
  if (filters.type) count++
  if (filters.status) count++
  return count
})

const paginationPages = computed(() => {
  const pages = []
  const maxVisible = 5

  if (!pagination.lastPage || !pagination.currentPage) {
    return pages
  }

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

// API Methods
const loadCollaterals = async () => {
  loading.value = true
  error.value = null

  try {
    // Build query parameters to match your API
    const params = {
      page: filters.page,
      per_page: filters.per_page,
      sort_field: filters.sort_field,
      sort_order: filters.sort_order,
    }

    // Add filters if they exist
    if (filters.search) params.search = filters.search
    if (filters.type) params.type = filters.type
    if (filters.status) params.status = filters.status

    console.log('Request params:', params)

    const response = await axios.get(`${API_URL}/collaterals`, { params })

    console.log('API Response:', response.data)

    // Handle the response structure
    if (response.data.success && response.data.data) {
      // The pagination object is directly in response.data.data
      const paginationData = response.data.data

      // The actual collaterals array is in paginationData.data
      collaterals.value = paginationData.data || []

      console.log('Collaterals loaded:', collaterals.value.length)

      // Update pagination
      pagination.currentPage = paginationData.current_page || 1
      pagination.lastPage = paginationData.last_page || 1
      pagination.perPage = paginationData.per_page || filters.per_page
      pagination.total = paginationData.total || 0
      pagination.from = paginationData.from || 0
      pagination.to = paginationData.to || 0

      // Calculate statistics and summary
      calculateStatistics()
      calculateSummary()
    } else {
      console.warn('Unexpected API response structure:', response.data)
      collaterals.value = []
    }
  } catch (err) {
    console.error('Error loading collaterals:', err)
    error.value =
      err.response?.data?.message || 'Imeshindwa kupakia dhamana. Tafadhali jaribu tena.'
  } finally {
    loading.value = false
  }
}

const calculateStatistics = () => {
  const allCollaterals = collaterals.value
  const total = allCollaterals.length
  const active = allCollaterals.filter((c) => c.status === 'active').length
  const taken = allCollaterals.filter((c) => c.status === 'taken').length
  const pending = allCollaterals.filter((c) => c.status === 'pending').length
  const released = allCollaterals.filter((c) => c.status === 'released').length

  statistics.value = {
    total,
    active,
    taken,
    pending,
    released,
  }
}

const calculateSummary = () => {
  if (collaterals.value.length === 0) {
    summary.value = {
      total_value: 0,
      average_value: 0,
      highest_value: 0,
      lowest_value: 0,
    }
    return
  }

  const values = collaterals.value.map((c) => parseFloat(c.estimated_value) || 0)
  const total_value = values.reduce((a, b) => a + b, 0)

  summary.value = {
    total_value,
    average_value: total_value / values.length,
    highest_value: Math.max(...values),
    lowest_value: Math.min(...values),
  }
}

// Filter Methods
const debouncedSearch = debounce(() => {
  filters.page = 1
  loadCollaterals()
}, 500)

const clearFilter = (filter) => {
  filters[filter] = ''
  filters.page = 1
  loadCollaterals()
}

const clearAllFilters = () => {
  filters.search = ''
  filters.type = ''
  filters.status = ''
  filters.sort_field = 'created_at'
  filters.sort_order = 'desc'
  filters.per_page = 15
  filters.page = 1
  loadCollaterals()
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    filters.page = page
    loadCollaterals()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Helper Methods
const getTypeText = (type) => {
  const texts = {
    land: 'Shamba/Ardhi',
    vehicle: 'Gari',
    equipment: 'Vifaa',
    title_deed: 'Hati ya Miliki',
    other: 'Nyingine',
  }
  return texts[type] || type
}

const getTypeIcon = (type) => {
  const icons = {
    land: 'fas fa-tree',
    vehicle: 'fas fa-car',
    equipment: 'fas fa-tools',
    title_deed: 'fas fa-file-alt',
    other: 'fas fa-box',
  }
  return icons[type] || 'fas fa-gem'
}

const getStatusText = (status) => {
  const texts = {
    active: 'Inatumika',
    taken: 'Imechukuliwa',
    released: 'Imetolewa',
    pending: 'Inasubiri',
  }
  return texts[status] || status
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// Permissions
const canVerify = (collateral) => {
  return collateral.status === 'pending' || !collateral.verified_by
}

const canTake = (collateral) => {
  return collateral.status === 'active'
}

const canRelease = (collateral) => {
  return collateral.status === 'taken'
}

const canDelete = (collateral) => {
  return collateral.status === 'pending' || collateral.status === 'released'
}

// Navigation
const viewCollateral = (collateral) => {
  router.push(`/collateral/${collateral.id}`)
}

const editCollateral = (collateral) => {
  router.push(`/collateral/${collateral.id}/edit`)
}

// Verify Modal Methods
const verifyCollateral = (collateral) => {
  selectedCollateral.value = collateral
  verifyForm.verified_value = collateral.verified_value || collateral.estimated_value
  verifyForm.notes = ''
  showVerifyModal.value = true
}

const closeVerifyModal = () => {
  showVerifyModal.value = false
  selectedCollateral.value = null
  verifyForm.verified_value = null
  verifyForm.notes = ''
}

const confirmVerify = async () => {
  if (!selectedCollateral.value) return

  actionLoading.value = true

  try {
    await axios.post(`/api/v1/collaterals/${selectedCollateral.value.id}/verify`, {
      verified_value: verifyForm.verified_value,
      notes: verifyForm.notes,
    })

    showToastMessage('Dhamana imehakikiwa kwa mafanikio', 'success')
    closeVerifyModal()
    loadCollaterals()
  } catch (err) {
    console.error('Error verifying collateral:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kuhakiki dhamana', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Take Modal Methods
const takeCollateral = (collateral) => {
  selectedCollateral.value = collateral
  actionNotes.value = ''
  showTakeModal.value = true
}

const closeTakeModal = () => {
  showTakeModal.value = false
  selectedCollateral.value = null
  actionNotes.value = ''
}

const confirmTake = async () => {
  if (!selectedCollateral.value) return

  actionLoading.value = true

  try {
    await axios.post(`${API_URL}/collaterals/${selectedCollateral.value.id}/take`, {
      notes: actionNotes.value,
    })

    showToastMessage('Dhamana imechukuliwa kwa mafanikio', 'success')
    closeTakeModal()
    loadCollaterals()
  } catch (err) {
    console.error('Error taking collateral:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kuchukua dhamana', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Release Modal Methods
const releaseCollateral = (collateral) => {
  selectedCollateral.value = collateral
  actionNotes.value = ''
  showReleaseModal.value = true
}

const closeReleaseModal = () => {
  showReleaseModal.value = false
  selectedCollateral.value = null
  actionNotes.value = ''
}

const confirmRelease = async () => {
  if (!selectedCollateral.value) return

  actionLoading.value = true

  try {
    await axios.post(`${API_URL}/collaterals/${selectedCollateral.value.id}/release`, {
      notes: actionNotes.value,
    })

    showToastMessage('Dhamana imetolewa kwa mafanikio', 'success')
    closeReleaseModal()
    loadCollaterals()
  } catch (err) {
    console.error('Error releasing collateral:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kutoa dhamana', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Delete Methods
const confirmDelete = (collateral) => {
  collateralToDelete.value = collateral
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  collateralToDelete.value = null
}

const deleteCollateral = async () => {
  if (!collateralToDelete.value) return

  deleteLoading.value = true

  try {
    await axios.delete(`${API_URL}/collaterals/${collateralToDelete.value.id}`)

    showToastMessage('Dhamana imefutwa kwa mafanikio', 'success')
    closeDeleteModal()
    loadCollaterals()
  } catch (err) {
    console.error('Error deleting collateral:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kufuta dhamana', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Export Method
const exportCollaterals = async () => {
  try {
    showToastMessage('Dhamana zinahamishwa...', 'info')

    // Check if export endpoint exists, if not, show message
    showToastMessage('Kipengele cha kuhamisha kinatengenezwa...', 'info')

    // Uncomment when export endpoint is ready
    /*
    const params = new URLSearchParams({
      format: 'csv',
    })

    if (filters.search) params.append('search', filters.search)
    if (filters.type) params.append('type', filters.type)
    if (filters.status) params.append('status', filters.status)
    
    const response = await axios.get(`/api/v1/collaterals/export?${params.toString()}`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `dhamana_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    
    showToastMessage('Dhamana zimehamishwa kwa mafanikio', 'success')
    */
  } catch (err) {
    console.error('Error exporting collaterals:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kuhamisha dhamana', 'error')
  }
}

// Toast Method
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
  console.log('Component mounted, loading collaterals...')
  loadCollaterals()
})
</script>

<style scoped>
.collateral-list-container {
  padding: 0 20px;
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

.collateral-count {
  color: #666;
  margin: 0;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-export,
.btn-filter-toggle {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.3s;
  border: none;
  position: relative;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
}

.btn-export {
  background: white;
  color: #27ae60;
  border: 1px solid #27ae60;
}

.btn-export:hover {
  background: #27ae60;
  color: white;
}

.btn-filter-toggle {
  background: white;
  color: #666;
  border: 1px solid #eef2f6;
}

.btn-filter-toggle:hover,
.btn-filter-toggle.active {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.filter-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Filters Panel */
.filters-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  animation: slideDown 0.3s ease;
}

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

/* Statistics Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
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
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a2639;
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.summary-card.total {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.summary-card.average {
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
}

.summary-card.highest {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.summary-card.lowest {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.summary-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: 700;
}

/* Loading State */
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

/* Error State */
.error-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.error-state i {
  font-size: 3rem;
  color: #e74c3c;
  margin-bottom: 15px;
}

.error-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.error-state p {
  color: #666;
  margin-bottom: 20px;
}

.btn-retry {
  padding: 10px 25px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-illustration {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.empty-illustration i:first-child {
  font-size: 4rem;
  color: #cbd5e0;
}

.empty-illustration i:last-child {
  position: absolute;
  bottom: 0;
  right: -10px;
  font-size: 2rem;
  color: #e74c3c;
  background: white;
  border-radius: 50%;
  padding: 5px;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
  margin-bottom: 25px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.empty-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-secondary {
  padding: 10px 25px;
  background: #f8fafc;
  color: #666;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.btn-secondary:hover {
  background: #eef2f6;
}

/* Collaterals Grid */
.collaterals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.collateral-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  transition: all 0.3s;
  cursor: pointer;
}

.collateral-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: #3498db;
}

.card-header {
  padding: 15px;
  background: linear-gradient(135deg, #f8fafc, #eef2f6);
  border-bottom: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  gap: 12px;
}

.collateral-icon {
  width: 45px;
  height: 45px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.collateral-icon.land {
  background: linear-gradient(135deg, #27ae60, #229954);
}

.collateral-icon.vehicle {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.collateral-icon.equipment {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.collateral-icon.title_deed {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.collateral-icon.other {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

.collateral-info {
  flex: 1;
}

.collateral-name {
  margin: 0 0 3px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.collateral-type {
  font-size: 0.8rem;
  color: #666;
}

.collateral-status {
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}

.collateral-status.active {
  background: #d4edda;
  color: #155724;
}

.collateral-status.taken {
  background: #f8d7da;
  color: #721c24;
}

.collateral-status.released {
  background: #d1d8e0;
  color: #2c3e50;
}

.collateral-status.pending {
  background: #fff3cd;
  color: #856404;
}

.card-body {
  padding: 15px;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f6;
}

.customer-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
}

.customer-details {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.customer-phone {
  font-size: 0.75rem;
  color: #999;
}

.collateral-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.detail-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.detail-label {
  min-width: 80px;
  font-size: 0.8rem;
  color: #999;
}

.detail-value {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.collateral-description {
  margin: 10px 0;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
}

.verification-info {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  padding: 5px 10px;
  background: #e3f2fd;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #1976d2;
  flex-wrap: wrap;
}

.verification-info i {
  color: #27ae60;
}

.verification-date {
  margin-left: auto;
  color: #666;
}

.card-footer {
  padding: 15px;
  background: #f8fafc;
  border-top: 1px solid #eef2f6;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-icon:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.btn-icon.success:hover {
  color: #27ae60;
  border-color: #27ae60;
}

.btn-icon.warning:hover {
  color: #f39c12;
  border-color: #f39c12;
}

.btn-icon.info:hover {
  color: #3498db;
  border-color: #3498db;
}

.btn-icon.danger:hover {
  color: #e74c3c;
  border-color: #e74c3c;
}

/* Pagination */
.pagination {
  margin-top: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
}

.pagination-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.pagination-btn {
  min-width: 35px;
  height: 35px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #3498db;
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
  align-items: center;
  gap: 15px;
}

.modal-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.modal-icon.success {
  background: #d4edda;
  color: #27ae60;
}

.modal-icon.warning {
  background: #fff3cd;
  color: #f39c12;
}

.modal-icon.info {
  background: #cce5ff;
  color: #3498db;
}

.modal-icon.danger {
  background: #f8d7da;
  color: #e74c3c;
}

.modal-header h3 {
  flex: 1;
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

.collateral-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}

.collateral-summary p {
  margin: 5px 0;
  color: #333;
}

.warning-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f39c12;
  font-size: 0.9rem;
  margin: 15px 0;
  padding: 10px;
  background: #fff3cd;
  border-radius: 8px;
}

.input-hint {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 4px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-info {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-info:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.btn-success,
.btn-warning,
.btn-danger {
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

.btn-success {
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
}

.btn-warning {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(243, 156, 18, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
}

.btn-success:disabled,
.btn-warning:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .collateral-list-container {
    padding: 15px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .btn-primary,
  .btn-export,
  .btn-filter-toggle {
    flex: 1;
    justify-content: center;
  }

  .collaterals-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-success,
  .btn-warning,
  .btn-danger,
  .btn-info,
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
