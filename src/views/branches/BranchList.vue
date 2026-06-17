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
        <button class="btn-export" @click="exportBranches">
          <i class="fas fa-download"></i> <span>Pakua</span>
        </button>
        <button class="btn-primary" @click="openCreateModal">
          <i class="fas fa-store"></i> <span>Sajili Tawi</span>
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
                </div>
              </td>
              <td>
                <div class="location-info">
                  <span class="region">{{ branch.region }}</span>
                  <span class="address">{{ branch.address }}</span>
                </div>
              </td>
              <td>
                <span class="branch-phone">{{ branch.phone || '-' }}</span>
              </td>
              <td>
                <span class="status-badge" :class="branch.status">
                  {{ branch.status === 'active' ? 'Inafanya kazi' : 'Haifanyi kazi' }}
                </span>
              </td>
              <td>
                <div class="action-dropdown" :ref="(el) => setActionRef(el, branch.id)">
                  <button class="action-menu-btn" @click.stop="toggleActionMenu(branch.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeActionMenu === branch.id" class="action-menu">
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
              <td colspan="6" class="text-center">
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
import { useRouter } from 'vue-router'
import { useBranchStore } from '@/stores/branch'
import { formatDate, formatNumber } from '@/utils/formatters'
import debounce from 'lodash/debounce'

const router = useRouter()
const branchStore = useBranchStore()

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
  form.branch_name = branch.branch_name
  form.region = branch.region
  form.address = branch.address
  form.phone = branch.phone
  form.status = branch.status
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

/* Page header */
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

/* Search */
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
  /* width: 100%; */
  padding: 0.6rem 2rem 0.6rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
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

/* Buttons */
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

/* Table card */
.table-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #eef2f6;
  overflow: hidden;
}
.table-responsive {
  overflow-x: auto;
}
.branches-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.branches-table th {
  text-align: left;
  padding: 1rem 1rem;
  background: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}
.branches-table td {
  padding: 1rem 1rem;
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

/* Cells */
.branch-cell {
  display: flex;
  flex-direction: column;
}
.branch-name {
  font-weight: 600;
  color: #0f172a;
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
  min-width: 160px;
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

/* Bulk actions */
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

/* Modal */
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
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
}
.modal-body {
  padding: 1.5rem;
}
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
  width: 94%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
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
  margin-top: 1.5rem;
}
.btn-secondary {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
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

/* Loading & error */
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
}
</style>
