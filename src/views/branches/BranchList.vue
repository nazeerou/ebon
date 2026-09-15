<template>
  <div class="branch-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Matawi</h1>
        <p class="branch-count" v-if="!loading">
          Jumla ya matawi: <strong>{{ formatNumber(pagination.total) }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            @input="debouncedSearch"
            placeholder="Tafuta kwa jina au mkoa..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="btn-primary" @click="openCreateModal">
          <i class="fas fa-store"></i> <span>Sajili Tawi / Sehemu</span>
        </button>
      </div>
    </div>

    <!-- Loading / Error states -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia matawi...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadBranches" class="btn-retry">
        <i class="fas fa-redo"></i> Jaribu Tena
      </button>
    </div>

    <!-- Branches Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="branches-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th>Jina la Tawi</th>
              <th>Mahali</th>
              <th>Simu</th>
              <th>Hali</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="branch in branches"
              :key="branch.id"
              :class="{ 'row-selected': selectedBranches.includes(branch.id) }"
            >
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  v-model="selectedBranches"
                  :value="branch.id"
                  @change="updateSelectAll"
                />
              </td>
              <td>
                <div class="branch-cell">
                  <span class="branch-name">{{ branch.branch_name }}</span>
                  <span class="branch-code" v-if="branch.branch_code">
                    {{ branch.branch_code }}
                  </span>
                </div>
              </td>
              <td>
                <div class="location-info">
                  <span class="region">{{ branch.region || branch.location || '-' }}</span>
                  <span class="address">{{ branch.address || '-' }}</span>
                </div>
              </td>
              <td>
                <span class="branch-phone">{{ branch.phone || '-' }}</span>
              </td>
              <td>
                <div class="machine-count-cell">
                  <span
                    v-if="branch.active_machines"
                    class="count-badge active"
                    :title="'Zinafanya kazi'"
                  >
                    {{ formatNumber(branch.active_machines) }}
                  </span>
                  <span
                    v-if="branch.maintenance_machines"
                    class="count-badge maintenance"
                    :title="'Matengenezo'"
                  >
                    {{ formatNumber(branch.maintenance_machines) }}
                  </span>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="branch.status || 'active'">
                  {{ (branch.status || 'active') === 'active' ? 'Inafanya kazi' : 'Haifanyi kazi' }}
                </span>
              </td>
              <td>
                <div class="action-dropdown" :ref="(el) => setActionRef(el, branch.id)">
                  <button class="action-menu-btn" @click.stop="toggleActionMenu(branch.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeActionMenu === branch.id" class="action-menu">
                    <button @click="viewBranch(branch)" class="action-menu-item">
                      <i class="fas fa-eye"></i> <span>Angalia</span>
                    </button>
                    <button @click="openEditModal(branch)" class="action-menu-item">
                      <i class="fas fa-edit"></i> <span>Hariri</span>
                    </button>
                    <button @click="confirmDelete(branch)" class="action-menu-item text-danger">
                      <i class="fas fa-trash-alt"></i> <span>Futa</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="branches.length === 0">
              <td colspan="5" class="text-center">
                <div class="empty-state-small">
                  <i class="fas fa-store"></i>
                  <p>Hakuna matawi yaliyopatikana</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedBranches.length > 0" class="bulk-actions">
        <div class="bulk-info">
          <i class="fas fa-check-circle"></i>
          <span
            >Umechagua <strong>{{ formatNumber(selectedBranches.length) }}</strong> matawi</span
          >
        </div>
        <div class="bulk-buttons">
          <button class="btn-bulk" @click="bulkActivate"><i class="fas fa-check"></i> Washa</button>
          <button class="btn-bulk" @click="bulkDeactivate"><i class="fas fa-ban"></i> Zima</button>
          <button class="btn-bulk text-danger" @click="confirmBulkDelete">
            <i class="fas fa-trash-alt"></i> Futa
          </button>
          <button class="btn-bulk" @click="clearSelection">
            <i class="fas fa-times"></i> Ghairi
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-section" v-if="pagination.lastPage > 1">
        <div class="pagination-info">
          Inaonyesha <strong>{{ formatNumber(pagination.from) }}</strong> -
          <strong>{{ formatNumber(pagination.to) }}</strong> kati ya
          <strong>{{ formatNumber(pagination.total) }}</strong> matawi
        </div>
        <div class="pagination-controls">
          <div class="pagination-buttons">
            <button
              @click="changePage(1)"
              :disabled="pagination.currentPage === 1"
              class="pagination-btn"
            >
              <i class="fas fa-angle-double-left"></i>
            </button>
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
              {{ formatNumber(page) }}
            </button>
            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="pagination-btn"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
            <button
              @click="changePage(pagination.lastPage)"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="pagination-btn"
            >
              <i class="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
        <div class="page-indicator">
          Ukurasa <strong>{{ formatNumber(pagination.currentPage) }}</strong> kati ya
          <strong>{{ formatNumber(pagination.lastPage) }}</strong>
        </div>
      </div>
    </div>

    <!-- ============ BRANCH DETAILS MODAL ============ -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content view-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-title">
            <div class="modal-header-icon view-icon">
              <i class="fas fa-store"></i>
            </div>
            <div>
              <h3>{{ viewBranchData?.branch_name }}</h3>
              <p class="modal-subtitle">
                {{ viewBranchData?.branch_code || viewBranchData?.region || 'Tawi' }}
              </p>
            </div>
          </div>
          <button class="close-btn" @click="closeViewModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body view-body">
          <!-- Branch Info -->
          <div class="view-section">
            <div class="form-section-title">
              <i class="fas fa-info-circle"></i>
              <span>Taarifa za Tawi</span>
            </div>
            <div class="view-details-grid">
              <div class="view-detail">
                <span class="detail-label">Jina la Tawi</span>
                <span class="detail-value">{{ viewBranchData.branch_name || '-' }}</span>
              </div>
              <div class="view-detail" v-if="viewBranchData.branch_code">
                <span class="detail-label">Code</span>
                <span class="detail-value mono">{{ viewBranchData.branch_code }}</span>
              </div>
              <div class="view-detail">
                <span class="detail-label">Mkoa / Kanda</span>
                <span class="detail-value">{{ viewBranchData.region || '-' }}</span>
              </div>
              <div class="view-detail">
                <span class="detail-label">Anwani</span>
                <span class="detail-value">{{ viewBranchData.address || '-' }}</span>
              </div>
              <div class="view-detail">
                <span class="detail-label">Simu</span>
                <span class="detail-value mono">{{ viewBranchData.phone || '-' }}</span>
              </div>
              <div class="view-detail">
                <span class="detail-label">Hali</span>
                <span class="status-badge" :class="viewBranchData.status || 'active'">
                  {{
                    (viewBranchData.status || 'active') === 'active'
                      ? 'Inafanya kazi'
                      : 'Haifanyi kazi'
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Machine Counts -->
          <div class="view-section">
            <div class="form-section-title">
              <i class="fas fa-chart-bar"></i>
              <span>Muhtasari wa Mashine</span>
            </div>
            <div class="counts-summary">
              <div class="count-tile total">
                <span class="tile-value">{{
                  formatNumber(viewBranchData.total_machines || viewBranchMachinesTotal)
                }}</span>
                <span class="tile-label">Jumla</span>
              </div>
              <div class="count-tile active">
                <span class="tile-value">{{
                  formatNumber(viewBranchData.active_machines || 0)
                }}</span>
                <span class="tile-label">Zinafanya</span>
              </div>
              <div class="count-tile maintenance">
                <span class="tile-value">{{
                  formatNumber(viewBranchData.maintenance_machines || 0)
                }}</span>
                <span class="tile-label">Matengenezo</span>
              </div>
              <div class="count-tile inactive">
                <span class="tile-value">{{
                  formatNumber(viewBranchData.inactive_machines || 0)
                }}</span>
                <span class="tile-label">Hazifanyi</span>
              </div>
            </div>
          </div>

          <!-- Machines List -->
          <div class="view-section">
            <div class="form-section-title">
              <i class="fas fa-microchip"></i>
              <span>Mashine za Tawi Hili</span>
              <span class="optional">{{ formatNumber(viewBranchMachinesTotal) }} jumla</span>
            </div>

            <div v-if="viewMachinesLoading" class="view-loading">
              <div class="spinner"></div>
              <p>Inapakia mashine...</p>
            </div>

            <div v-else-if="viewBranchMachines.length" class="view-machines-list">
              <div
                v-for="machine in viewBranchMachines"
                :key="machine.id"
                class="view-machine-item"
              >
                <div class="vm-photo">
                  <img
                    v-if="machine.photo_urls && machine.photo_urls.length"
                    :src="machine.photo_urls[0]"
                    :alt="machine.machine_name"
                  />
                  <div v-else class="vm-no-photo">
                    <i class="fas fa-microchip"></i>
                  </div>
                </div>
                <div class="vm-info">
                  <h4>{{ machine.machine_name }}</h4>
                  <div class="vm-meta">
                    <span class="vm-code">{{ machine.machine_code }}</span>
                    <span class="vm-serial">
                      <i class="fas fa-barcode"></i> {{ machine.serial_number || '—' }}
                    </span>
                  </div>
                  <div class="vm-tags" v-if="machine.materials?.length">
                    <span v-for="m in machine.materials.slice(0, 3)" :key="m" class="vm-tag">
                      {{ m }}
                    </span>
                    <span v-if="machine.materials.length > 3" class="vm-tag more">
                      +{{ machine.materials.length - 3 }}
                    </span>
                  </div>
                </div>
                <span class="status-dot" :class="machine.status"></span>
              </div>
            </div>

            <div v-else class="view-empty">
              <i class="fas fa-microchip"></i>
              <span>Hakuna mashine kwenye tawi hili</span>
            </div>

            <!-- Pagination for machines inside modal -->
            <div v-if="viewMachinesPagination.lastPage > 1" class="view-pagination">
              <button
                class="pagination-btn"
                :disabled="viewMachinesPagination.currentPage === 1"
                @click="loadViewBranchMachines(viewMachinesPagination.currentPage - 1)"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              <span class="page-info">
                {{ viewMachinesPagination.currentPage }} / {{ viewMachinesPagination.lastPage }}
              </span>
              <button
                class="pagination-btn"
                :disabled="viewMachinesPagination.currentPage === viewMachinesPagination.lastPage"
                @click="loadViewBranchMachines(viewMachinesPagination.currentPage + 1)"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeViewModal">Funga</button>
          <button class="btn-primary" @click="editFromView">
            <i class="fas fa-edit"></i> Hariri Tawi
          </button>
        </div>
      </div>
    </div>

    <!-- Modal ya Kuongeza / Kuhariri Tawi -->
    <div v-if="showBranchModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content branch-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Hariri Tawi' : 'Sajili Tawi Jipya' }}</h3>
          <button class="close-btn" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveBranch">
            <div class="form-group">
              <label>Jina la Tawi <span class="required">*</span></label>
              <input type="text" v-model="form.branch_name" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Mkoa / Kanda <span class="required">*</span></label>
              <input type="text" v-model="form.region" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Anwani <span class="required">*</span></label>
              <input type="text" v-model="form.address" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Namba ya Simu <span class="required">*</span></label>
              <input type="tel" v-model="form.phone" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Hali</label>
              <select v-model="form.status" class="form-control">
                <option value="active">Inafanya kazi</option>
                <option value="inactive">Haifanyi kazi</option>
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Ghairi</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                <span v-if="saving"><i class="fas fa-spinner fa-spin"></i> Inahifadhi...</span>
                <span v-else><i class="fas fa-save"></i> Hifadhi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modals -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Futa Tawi</h3>
          <button class="close-btn" @click="closeDeleteModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kufuta tawi hili?</p>
          <p class="warning-text" v-if="branchToDelete">
            <strong>{{ branchToDelete.branch_name }}</strong>
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i> Hatua hii haiwezi kutenguliwa. Tawi litafutwa kabisa
            kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="deleteBranch" class="btn-danger" :disabled="deleteLoading">
            Futa Tawi
          </button>
        </div>
      </div>
    </div>

    <div v-if="showBulkDeleteModal" class="modal-overlay" @click="closeBulkDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Futa Matawi Mengi</h3>
          <button class="close-btn" @click="closeBulkDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Una uhakika unataka kufuta matawi
            <strong>{{ formatNumber(selectedBranches.length) }}</strong
            >?
          </p>
          <div class="selected-list">
            <div v-for="id in selectedBranches.slice(0, 5)" :key="id" class="selected-item">
              <i class="fas fa-store"></i> <span>{{ getBranchName(id) }}</span>
            </div>
            <div v-if="selectedBranches.length > 5" class="more-items">
              ... na wengine {{ formatNumber(selectedBranches.length - 5) }}
            </div>
          </div>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i> Hatua hii haiwezi kutenguliwa.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeBulkDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="bulkDelete" class="btn-danger" :disabled="deleteLoading">
            Futa Wote
          </button>
        </div>
      </div>
    </div>

    <div v-if="showToast" class="toast-notification" :class="toastType">
      <i :class="toastIcon"></i> <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useBranchStore } from '@/stores/branch'
import { formatDate, formatNumber } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const branchStore = useBranchStore()
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

// State
const branches = ref([])
const loading = ref(false)
const error = ref(null)
const selectedBranches = ref([])
const selectAll = ref(false)
const showBulkDeleteModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const activeActionMenu = ref(null)
const actionRefs = ref({})

// Delete branch state
const branchToDelete = ref(null)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)

// Modal & form
const showBranchModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const form = reactive({
  branch_name: '',
  region: '',
  address: '',
  phone: '',
  status: 'active',
})

// View branch modal
const showViewModal = ref(false)
const viewBranchData = ref(null)
const viewBranchMachines = ref([])
const viewMachinesLoading = ref(false)
const viewMachinesPagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  perPage: 6,
})

const viewBranchMachinesTotal = computed(() => viewMachinesPagination.total)

// Pagination
const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  total: 0,
  from: 0,
  to: 0,
})

// Search
const searchQuery = ref('')

// Computed
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

// Methods
const loadBranches = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      per_page: pagination.perPage,
      page: pagination.currentPage,
      search: searchQuery.value || undefined,
    }
    const response = await branchStore.fetchBranches(params)
    let responseData = response.data || response
    if (responseData.data && Array.isArray(responseData.data)) {
      branches.value = responseData.data
      pagination.currentPage = responseData.current_page || 1
      pagination.lastPage = responseData.last_page || 1
      pagination.total = responseData.total || 0
      pagination.from = responseData.from || 0
      pagination.to = responseData.to || 0
    } else if (Array.isArray(responseData)) {
      branches.value = responseData
    } else {
      branches.value = []
    }
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Imeshindwa kupakia matawi.'
    showToastMessage(error.value, 'error')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    pagination.currentPage = page
    loadBranches()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const debouncedSearch = debounce(() => {
  pagination.currentPage = 1
  loadBranches()
}, 500)
watch(searchQuery, () => debouncedSearch())

const clearSearch = () => {
  searchQuery.value = ''
  pagination.currentPage = 1
  loadBranches()
}

// =========================================================
// VIEW BRANCH
// =========================================================
const viewBranch = (branch) => {
  closeActionMenu()
  viewBranchData.value = branch
  viewBranchMachines.value = []
  viewMachinesPagination.currentPage = 1
  viewMachinesPagination.lastPage = 1
  viewMachinesPagination.total = 0
  showViewModal.value = true
  loadViewBranchMachines(1)
}

const viewBranchMachines_only = (branch) => {
  // Same as viewBranch but jumps to the machines section
  viewBranch(branch)
}

const viewBranchMachinesHandler = (branch) => {
  viewBranch(branch)
}

const loadViewBranchMachines = async (page = 1) => {
  if (!viewBranchData.value) return
  viewMachinesLoading.value = true
  try {
    const response = await axios.get(`${API_URL}/branches/${viewBranchData.value.id}/machines`, {
      params: {
        page,
        per_page: viewMachinesPagination.perPage,
      },
    })

    if (response.data?.success) {
      const pag = response.data.data
      viewBranchMachines.value = pag.data || []
      viewMachinesPagination.currentPage = pag.current_page || 1
      viewMachinesPagination.lastPage = pag.last_page || 1
      viewMachinesPagination.total = pag.total || 0
    } else {
      viewBranchMachines.value = []
    }
  } catch (err) {
    console.error('Error loading branch machines:', err)
    viewBranchMachines.value = []
    showToastMessage(err.response?.data?.message || 'Imeshindwa kupakia mashine', 'error')
  } finally {
    viewMachinesLoading.value = false
  }
}

const closeViewModal = () => {
  showViewModal.value = false
  viewBranchData.value = null
  viewBranchMachines.value = []
}

const editFromView = () => {
  if (viewBranchData.value) {
    const branch = viewBranchData.value
    closeViewModal()
    openEditModal(branch)
  }
}

// Modal actions
const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.branch_name = ''
  form.region = ''
  form.address = ''
  form.phone = ''
  form.status = 'active'
  showBranchModal.value = true
}

const openEditModal = (branch) => {
  isEditing.value = true
  editingId.value = branch.id
  form.branch_name = branch.branch_name || ''
  form.region = branch.region || branch.location || ''
  form.address = branch.address || ''
  form.phone = branch.phone || ''
  form.status = branch.status || 'active'
  showBranchModal.value = true
  closeActionMenu()
}

const saveBranch = async () => {
  if (!form.branch_name || !form.region || !form.address || !form.phone) {
    showToastMessage('Tafadhali jaza sehemu zote zinazohitajika.', 'error')
    return
  }
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await branchStore.updateBranch(editingId.value, { ...form })
      showToastMessage('Tawi limehaririwa kwa mafanikio', 'success')
    } else {
      await branchStore.createBranch({ ...form })
      showToastMessage('Tawi limewekwa kwa mafanikio', 'success')
    }
    closeModal()
    await loadBranches()
  } catch (err) {
    const msg = err.response?.data?.message || 'Hitilafu wakati wa kuhifadhi'
    showToastMessage(msg, 'error')
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showBranchModal.value = false
  isEditing.value = false
  editingId.value = null
}

// Delete branch
const confirmDelete = (branch) => {
  branchToDelete.value = branch
  showDeleteModal.value = true
  closeActionMenu()
}
const closeDeleteModal = () => {
  showDeleteModal.value = false
  branchToDelete.value = null
}
const deleteBranch = async () => {
  if (!branchToDelete.value) return
  deleteLoading.value = true
  try {
    await branchStore.deleteBranch(branchToDelete.value.id)
    showToastMessage('Tawi limefutwa', 'success')
    closeDeleteModal()
    await loadBranches()
    clearSelection()
  } catch (err) {
    showToastMessage(err.response?.data?.message || 'Imeshindwa kufuta', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Bulk actions
const bulkActivate = async () => {
  if (!selectedBranches.value.length) return showToastMessage('Chagua matawi ya kuwasha', 'warning')
  try {
    await Promise.all(
      selectedBranches.value.map((id) => branchStore.updateBranchStatus(id, 'active')),
    )
    showToastMessage(`Matawi ${selectedBranches.value.length} yamewashwa`, 'success')
    await loadBranches()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  }
}
const bulkDeactivate = async () => {
  if (!selectedBranches.value.length) return showToastMessage('Chagua matawi ya kuzima', 'warning')
  try {
    await Promise.all(
      selectedBranches.value.map((id) => branchStore.updateBranchStatus(id, 'inactive')),
    )
    showToastMessage(`Matawi ${selectedBranches.value.length} yamezimwa`, 'success')
    await loadBranches()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  }
}
const confirmBulkDelete = () => {
  if (selectedBranches.value.length) showBulkDeleteModal.value = true
}
const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false
}
const bulkDelete = async () => {
  if (!selectedBranches.value.length) return
  deleteLoading.value = true
  try {
    const results = await Promise.allSettled(
      selectedBranches.value.map((id) => branchStore.deleteBranch(id)),
    )
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value?.success || r.value?.status === 'success'),
    ).length
    showToastMessage(`${successful} matawi yamefutwa`, successful ? 'success' : 'error')
    closeBulkDeleteModal()
    await loadBranches()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  } finally {
    deleteLoading.value = false
  }
}

const clearSelection = () => {
  selectedBranches.value = []
  selectAll.value = false
}
const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
  selectedBranches.value = selectAll.value ? branches.value.map((b) => b.id) : []
}
const updateSelectAll = () => {
  selectAll.value = selectedBranches.value.length === branches.value.length
}

const exportBranches = async () => {
  try {
    if (branchStore.exportBranches) await branchStore.exportBranches({ search: searchQuery.value })
    else showToastMessage('Kipengele cha kuweka nje hakipo', 'warning')
  } catch (err) {
    showToastMessage('Hitilafu wakati wa kupakua', 'error')
  }
}

// Action menu helpers
const setActionRef = (el, id) => {
  if (el) actionRefs.value[id] = el
}
const toggleActionMenu = (id) => {
  activeActionMenu.value = activeActionMenu.value === id ? null : id
}
const closeActionMenu = () => {
  activeActionMenu.value = null
}
const handleClickOutside = (event) => {
  if (!event.target.closest('.action-dropdown')) closeActionMenu()
}

const showToastMessage = (msg, type) => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
const getBranchName = (id) => branches.value.find((b) => b.id === id)?.branch_name || ''

onMounted(() => {
  loadBranches()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  debouncedSearch.cancel()
})
</script>

<style scoped>
/* ===== BRANCH LIST STYLES ===== */
.branch-list-container {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.header-left h1 {
  font-size: 1.75rem;
  color: #1e293b;
  margin: 0 0 0.25rem;
  font-weight: 600;
}
.branch-count {
  color: #64748b;
  margin: 0;
  font-size: 0.875rem;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.search-wrapper {
  position: relative;
  width: 280px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.875rem;
}
.search-input {
  padding: 0.6rem 2rem 0.6rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  width: 100%;
  box-sizing: border-box;
}
.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
}
.clear-search:hover {
  color: #ef4444;
}
.btn-primary,
.btn-export {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.btn-primary {
  background: #3b82f6;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
.btn-export {
  background: white;
  color: #10b981;
  border: 1px solid #10b981;
}
.btn-export:hover {
  background: #10b981;
  color: white;
}
.table-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #eef2f6;
  /* overflow: hidden; */
}
.table-responsive {
  /* overflow-x: auto; */
}
.branches-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.branches-table th {
  text-align: left;
  padding: 1rem;
  background: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}
.branches-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.branches-table tbody tr:hover {
  background: #f8fafc;
}
.branches-table tbody tr.row-selected {
  background: #eff6ff;
}
.checkbox-col {
  width: 40px;
  text-align: center;
}
.branch-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.branch-name {
  font-weight: 600;
  color: #0f172a;
}
.branch-code {
  font-size: 0.7rem;
  color: #64748b;
  font-family: monospace;
}
.location-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.region {
  font-weight: 500;
  color: #334155;
}
.address {
  font-size: 0.75rem;
  color: #64748b;
}
.branch-phone {
  font-family: monospace;
  color: #475569;
}
.machine-count-cell {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}
.count-badge.total {
  background: #eff6ff;
  color: #1e40af;
}
.count-badge.active {
  background: #d1fae5;
  color: #065f46;
}
.count-badge.maintenance {
  background: #fed7aa;
  color: #9a3412;
}
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}
.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* Action dropdown */
.action-dropdown {
  position: relative;
  display: inline-block;
}
.action-menu-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.action-menu-btn:hover {
  background: #f1f5f9;
  color: #3b82f6;
  border-color: #3b82f6;
}
.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 180px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.action-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #334155;
  transition: background 0.2s;
}
.action-menu-item:hover {
  background: #f1f5f9;
}
.action-menu-item i {
  width: 20px;
  color: #64748b;
}
.action-menu-item.text-danger {
  color: #dc2626;
}
.action-menu-item.text-danger i {
  color: #dc2626;
}

/* Bulk */
.bulk-actions {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.bulk-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e40af;
  font-size: 0.875rem;
}
.bulk-buttons {
  display: flex;
  gap: 0.5rem;
}
.btn-bulk {
  padding: 0.25rem 1rem;
  border-radius: 8px;
  background: white;
  border: 1px solid #cbd5e1;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-bulk:hover {
  background: #f1f5f9;
}
.btn-bulk.text-danger:hover {
  background: #fee2e2;
  border-color: #dc2626;
  color: #dc2626;
}

/* Pagination */
.pagination-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.pagination-info {
  font-size: 0.875rem;
  color: #64748b;
}
.pagination-controls {
  display: flex;
  justify-content: center;
}
.pagination-buttons {
  display: flex;
  gap: 0.5rem;
}
.pagination-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}
.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #3b82f6;
}
.pagination-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-indicator {
  text-align: center;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* =========================================================
   MODALS
   ========================================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}
.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
.view-modal {
  max-width: 780px;
  border-radius: 18px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #eff6ff);
  border-radius: 18px 18px 0 0;
}
.modal-header-title {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.modal-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}
.modal-header-icon.view-icon {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.3);
}
.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}
.modal-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0.15rem 0 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s;
}
.close-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}
.modal-body {
  padding: 1.5rem;
}
.view-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.view-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.form-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  padding-bottom: 0.4rem;
  border-bottom: 1px dashed #e2e8f0;
}
.form-section-title i {
  color: #3b82f6;
  font-size: 0.85rem;
}
.form-section-title .optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: #94a3b8;
  font-size: 0.7rem;
  margin-left: auto;
}

/* View details grid */
.view-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}
.view-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.6rem 0.85rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #eef2f6;
}
.detail-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  font-weight: 600;
}
.detail-value {
  font-size: 0.9rem;
  color: #0f172a;
  font-weight: 500;
}
.detail-value.mono {
  font-family: monospace;
}

/* Counts summary */
.counts-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
}
.count-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  border: 1px solid #eef2f6;
  background: #f8fafc;
}
.count-tile.total {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #bfdbfe;
}
.count-tile.active {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-color: #a7f3d0;
}
.count-tile.maintenance {
  background: linear-gradient(135deg, #fff7ed, #fed7aa);
  border-color: #fdba74;
}
.count-tile.inactive {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border-color: #fecaca;
}
.tile-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}
.count-tile.total .tile-value {
  color: #1e40af;
}
.count-tile.active .tile-value {
  color: #065f46;
}
.count-tile.maintenance .tile-value {
  color: #9a3412;
}
.count-tile.inactive .tile-value {
  color: #b91c1c;
}
.tile-label {
  font-size: 0.65rem;
  color: #64748b;
  margin-top: 0.35rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* View machines list */
.view-machines-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.view-machine-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 12px;
  transition: all 0.2s;
  position: relative;
}
.view-machine-item:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.vm-photo {
  width: 54px;
  height: 54px;
  border-radius: 10px;
  overflow: hidden;
  background: #e2e8f0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vm-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.vm-no-photo {
  color: #cbd5e1;
  font-size: 1.2rem;
}
.vm-info {
  flex: 1;
  min-width: 0;
}
.vm-info h4 {
  margin: 0 0 0.15rem;
  font-size: 0.9rem;
  color: #0f172a;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vm-meta {
  display: flex;
  gap: 0.6rem;
  font-size: 0.72rem;
  color: #64748b;
  flex-wrap: wrap;
}
.vm-code {
  font-family: monospace;
  color: #475569;
}
.vm-serial {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #94a3b8;
}
.vm-tags {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.3rem;
  flex-wrap: wrap;
}
.vm-tag {
  font-size: 0.62rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: white;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  font-weight: 500;
}
.vm-tag.more {
  background: #f1f5f9;
  color: #64748b;
  border-color: #e2e8f0;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.active {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.status-dot.maintenance {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
.status-dot.inactive {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

/* View pagination */
.view-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.view-pagination .pagination-btn {
  width: 34px;
  height: 34px;
}
.view-pagination .page-info {
  font-size: 0.8rem;
  color: #64748b;
}

.view-loading {
  text-align: center;
  padding: 1.5rem 0;
  color: #64748b;
}
.view-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.8rem;
}
.view-empty i {
  font-size: 1.5rem;
}

/* Form modal */
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #334155;
}
.form-group .required {
  color: #ef4444;
}
.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  box-sizing: border-box;
  font-family: inherit;
}
.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 18px 18px;
}
.btn-secondary {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: #e2e8f0;
}
.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}
.btn-danger:hover {
  background: #b91c1c;
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 2100;
  border-left: 4px solid;
}
.toast-notification.success {
  border-left-color: #10b981;
}
.toast-notification.error {
  border-left-color: #ef4444;
}

/* Loading */
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-state i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .branch-list-container {
    padding: 0.75rem;
  }
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    justify-content: stretch;
  }
  .search-wrapper {
    width: 100%;
  }
  .btn-primary,
  .btn-export {
    flex: 1;
    justify-content: center;
  }
  .branches-table th,
  .branches-table td {
    padding: 0.75rem;
  }
  .checkbox-col {
    width: 30px;
  }
  .action-menu {
    right: -20px;
  }
  .view-details-grid {
    grid-template-columns: 1fr;
  }
  .counts-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
