<template>
  <div class="machine-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Mashine</h1>
        <p class="machine-count" v-if="!loading">
          Jumla ya mashine: <strong>{{ formatNumber(pagination.total) }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <!-- Search Filter -->
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            @input="debouncedSearch"
            placeholder="Tafuta kwa Jina au Serial No"
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="btn-export" @click="exportMachines">
          <i class="fas fa-download"></i>
          <span>Pakua</span>
        </button>
        <button class="btn-primary" @click="openCreateModal">
          <i class="fas fa-microchip"></i>
          <span>Sajili Mashine</span>
        </button>
      </div>
    </div>

    <!-- Loading / Error states -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia mashine...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadMachines" class="btn-retry">
        <i class="fas fa-redo"></i> Jaribu Tena
      </button>
    </div>

    <!-- Machines Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="machines-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th>Mashine</th>
              <th>Tawi</th>
              <th>Namba ya Serial</th>
              <th>Hali</th>
              <th>Tarehe ya Ufungaji</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="machine in machines"
              :key="machine.id"
              :class="{ 'row-selected': selectedMachines.includes(machine.id) }"
            >
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  v-model="selectedMachines"
                  :value="machine.id"
                  @change="updateSelectAll"
                />
              </td>
              <td>
                <div class="machine-cell">
                  <span class="machine-name">{{ machine.machine_name }}</span>
                  <span class="machine-code">{{ machine.machine_code }}</span>
                </div>
              </td>
              <td>
                <span class="branch-name">{{ machine.branch?.branch_name || '-' }}</span>
              </td>
              <td>
                <span class="serial-number">{{ machine.serial_number || '-' }}</span>
              </td>
              <td>
                <span class="status-badge" :class="machine.status">{{
                  getStatusText(machine.status)
                }}</span>
              </td>
              <td>
                <div class="date-info">
                  <span class="date">{{ formatDate(machine.installation_date) }}</span>
                  <span class="time">Imesajiliwa: {{ formatDate(machine.created_at) }}</span>
                </div>
              </td>
              <td>
                <div class="action-dropdown" :ref="(el) => setActionRef(el, machine.id)">
                  <button class="action-menu-btn" @click.stop="toggleActionMenu(machine.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeActionMenu === machine.id" class="action-menu">
                    <button @click="viewMachine(machine)" class="action-menu-item">
                      <i class="fas fa-eye"></i> <span>Angalia</span>
                    </button>
                    <button @click="openEditModal(machine)" class="action-menu-item">
                      <i class="fas fa-edit"></i> <span>Hariri</span>
                    </button>
                    <button @click="goToReading(machine.id)" class="action-menu-item">
                      <i class="fas fa-camera"></i> <span>Soma Mita</span>
                    </button>
                    <button @click="confirmDelete(machine)" class="action-menu-item text-danger">
                      <i class="fas fa-trash-alt"></i> <span>Futa</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="machines.length === 0">
              <td colspan="7" class="text-center">
                <div class="empty-state-small">
                  <i class="fas fa-microchip"></i>
                  <p>Hakuna mashine zilizopatikana</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedMachines.length > 0" class="bulk-actions">
        <div class="bulk-info">
          <i class="fas fa-check-circle"></i>
          <span
            >Umechagua <strong>{{ formatNumber(selectedMachines.length) }}</strong> mashine</span
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
          <strong>{{ formatNumber(pagination.total) }}</strong> mashine
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

    <!-- Modal ya Kuongeza / Kuhariri Mashine -->
    <div v-if="showMachineModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content machine-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Hariri Mashine' : 'Sajili Mashine Mpya' }}</h3>
          <button class="close-btn" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveMachine">
            <div class="form-group">
              <label>Machine Code<span class="required">*</span></label>
              <input type="text" v-model="form.machine_code" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Jina la Mashine <span class="required">*</span></label>
              <input type="text" v-model="form.machine_name" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Namba ya Serial <span class="required">*</span></label>
              <input type="text" v-model="form.serial_number" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Tawi <span class="required">*</span></label>
              <select v-model="form.branch_id" class="form-control" required>
                <option value="">Chagua Tawi</option>
                <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                  {{ branch.branch_name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Tarehe ya Ufungaji <span class="required">*</span></label>
              <input type="date" v-model="form.installation_date" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Hali</label>
              <select v-model="form.status" class="form-control">
                <option value="active">Inafanya kazi</option>
                <option value="maintenance">Matengenezo</option>
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
          <h3>Futa Mashine</h3>
          <button class="close-btn" @click="closeDeleteModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kufuta mashine hii?</p>
          <p class="warning-text" v-if="machineToDelete">
            <strong>{{ machineToDelete.machine_name }} ({{ machineToDelete.machine_code }})</strong>
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i> Hatua hii haiwezi kutenguliwa. Mashine itafutwa
            kabisa kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="deleteMachine" class="btn-danger" :disabled="deleteLoading">
            Futa Mashine
          </button>
        </div>
      </div>
    </div>

    <div v-if="showBulkDeleteModal" class="modal-overlay" @click="closeBulkDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Futa Mashine Nyingi</h3>
          <button class="close-btn" @click="closeBulkDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Una uhakika unataka kufuta mashine
            <strong>{{ formatNumber(selectedMachines.length) }}</strong
            >?
          </p>
          <div class="selected-list">
            <div v-for="id in selectedMachines.slice(0, 5)" :key="id" class="selected-item">
              <i class="fas fa-microchip"></i> <span>{{ getMachineName(id) }}</span>
            </div>
            <div v-if="selectedMachines.length > 5" class="more-items">
              ... na wengine {{ formatNumber(selectedMachines.length - 5) }}
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

<!-- Replace the <script setup> section of your MachineList.vue with this updated code -->
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMachineStore } from '@/stores/Machine'
import { useBranchStore } from '@/stores/branch'
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios' // added for direct API call

const router = useRouter()
const machineStore = useMachineStore()
const branchStore = useBranchStore()

// State
const machines = ref([])
const branches = ref([]) // will hold branches for dropdown
const loading = ref(false)
const error = ref(null)
const selectedMachines = ref([])
const selectAll = ref(false)
const showBulkDeleteModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const activeActionMenu = ref(null)
const actionRefs = ref({})

// Delete machine state
const machineToDelete = ref(null)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)

// Modal & form
const showMachineModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const form = reactive({
  machine_code: '',
  machine_name: '',
  serial_number: '',
  branch_id: '',
  installation_date: '',
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

// ---------------------------
// Load branches directly from API to avoid store issues
// ---------------------------
const loadBranches = async () => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
    // const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

    const response = await axios.get(`${API_URL}/branches`)
    // API returns { data: [...] }
    if (response.data && response.data.data) {
      branches.value = response.data.data
    } else if (Array.isArray(response.data)) {
      branches.value = response.data
    } else {
      branches.value = []
    }
    console.log('Branches loaded:', branches.value.length)
  } catch (err) {
    console.error('Error loading branches:', err)
    branches.value = []
  }
}

// Load machines (unchanged but uses store)
const loadMachines = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      per_page: pagination.perPage,
      page: pagination.currentPage,
      search: searchQuery.value || undefined,
    }
    const response = await machineStore.fetchMachines(params)
    let responseData = response.data || response
    if (responseData.data && Array.isArray(responseData.data)) {
      machines.value = responseData.data
      pagination.currentPage = responseData.current_page || 1
      pagination.lastPage = responseData.last_page || 1
      pagination.total = responseData.total || 0
      pagination.from = responseData.from || 0
      pagination.to = responseData.to || 0
    } else if (Array.isArray(responseData)) {
      machines.value = responseData
    } else {
      machines.value = []
    }
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Imeshindwa kupakia mashine.'
    showToastMessage(error.value, 'error')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    pagination.currentPage = page
    loadMachines()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const debouncedSearch = debounce(() => {
  pagination.currentPage = 1
  loadMachines()
}, 500)
watch(searchQuery, () => debouncedSearch())

const clearSearch = () => {
  searchQuery.value = ''
  pagination.currentPage = 1
  loadMachines()
}

// Modal actions
const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.machine_code = ''
  form.machine_name = ''
  form.serial_number = ''
  form.branch_id = ''
  form.installation_date = ''
  form.status = 'active'
  showMachineModal.value = true
}

const openEditModal = (machine) => {
  isEditing.value = true
  editingId.value = machine.id
  form.machine_code = machine.machine_code
  form.machine_name = machine.machine_name
  form.serial_number = machine.serial_number
  form.branch_id = machine.branch_id
  form.installation_date = machine.installation_date ? machine.installation_date.slice(0, 10) : ''
  form.status = machine.status
  showMachineModal.value = true
  closeActionMenu()
}

const saveMachine = async () => {
  if (
    !form.machine_code ||
    !form.machine_name ||
    !form.serial_number ||
    !form.branch_id ||
    !form.installation_date
  ) {
    showToastMessage('Tafadhali jaza sehemu zote zinazohitajika.', 'error')
    return
  }
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await machineStore.updateMachine(editingId.value, { ...form })
      showToastMessage('Mashine imehaririwa kwa mafanikio', 'success')
    } else {
      await machineStore.createMachine({ ...form })
      showToastMessage('Mashine imesajiliwa kwa mafanikio', 'success')
    }
    closeModal()
    await loadMachines()
  } catch (err) {
    const msg = err.response?.data?.message || 'Hitilafu wakati wa kuhifadhi'
    showToastMessage(msg, 'error')
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showMachineModal.value = false
  isEditing.value = false
  editingId.value = null
}

// Delete machine (same as before)
const confirmDelete = (machine) => {
  machineToDelete.value = machine
  showDeleteModal.value = true
  closeActionMenu()
}
const closeDeleteModal = () => {
  showDeleteModal.value = false
  machineToDelete.value = null
}
const deleteMachine = async () => {
  if (!machineToDelete.value) return
  deleteLoading.value = true
  try {
    await machineStore.deleteMachine(machineToDelete.value.id)
    showToastMessage('Mashine imefutwa', 'success')
    closeDeleteModal()
    await loadMachines()
    clearSelection()
  } catch (err) {
    showToastMessage(err.response?.data?.message || 'Imeshindwa kufuta', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Bulk actions (unchanged)
const bulkActivate = async () => {
  if (!selectedMachines.value.length)
    return showToastMessage('Chagua mashine za kuwasha', 'warning')
  try {
    await Promise.all(
      selectedMachines.value.map((id) => machineStore.updateMachineStatus(id, 'active')),
    )
    showToastMessage(`Mashine ${selectedMachines.value.length} zimewashwa`, 'success')
    await loadMachines()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  }
}
const bulkDeactivate = async () => {
  if (!selectedMachines.value.length) return showToastMessage('Chagua mashine za kuzima', 'warning')
  try {
    await Promise.all(
      selectedMachines.value.map((id) => machineStore.updateMachineStatus(id, 'inactive')),
    )
    showToastMessage(`Mashine ${selectedMachines.value.length} zimezimwa`, 'success')
    await loadMachines()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  }
}
const confirmBulkDelete = () => {
  if (selectedMachines.value.length) showBulkDeleteModal.value = true
}
const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false
}
const bulkDelete = async () => {
  if (!selectedMachines.value.length) return
  deleteLoading.value = true
  try {
    const results = await Promise.allSettled(
      selectedMachines.value.map((id) => machineStore.deleteMachine(id)),
    )
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value?.success || r.value?.status === 'success'),
    ).length
    showToastMessage(`${successful} mashine zimefutwa`, successful ? 'success' : 'error')
    closeBulkDeleteModal()
    await loadMachines()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  } finally {
    deleteLoading.value = false
  }
}

const clearSelection = () => {
  selectedMachines.value = []
  selectAll.value = false
}
const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
  selectedMachines.value = selectAll.value ? machines.value.map((m) => m.id) : []
}
const updateSelectAll = () => {
  selectAll.value = selectedMachines.value.length === machines.value.length
}

const goToReading = (id) => {
  router.push(`/readings/ocr?machine_id=${id}`)
  closeActionMenu()
}
const viewMachine = (machine) => {
  router.push(`/machines/${machine.id}`)
  closeActionMenu()
}

const exportMachines = async () => {
  try {
    if (machineStore.exportMachines)
      await machineStore.exportMachines({ search: searchQuery.value })
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
const getStatusText = (status) =>
  ({ active: 'Inafanya kazi', maintenance: 'Matengenezo', inactive: 'Haifanyi kazi' })[status] ||
  status
const getMachineName = (id) => machines.value.find((m) => m.id === id)?.machine_name || ''

onMounted(() => {
  loadBranches() // load branches for dropdown
  loadMachines()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  debouncedSearch.cancel()
})
</script>

<style scoped>
/* Improved table styling */
.machine-list-container {
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

.machine-count {
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
.machines-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.machines-table th {
  text-align: left;
  padding: 1rem 1rem;
  background: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}
.machines-table td {
  padding: 1rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.machines-table tbody tr:hover {
  background: #f8fafc;
}
.machines-table tbody tr.row-selected {
  background: #eff6ff;
}
.checkbox-col {
  width: 40px;
  text-align: center;
}

/* Cells */
.machine-cell {
  display: flex;
  flex-direction: column;
}
.machine-name {
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.2rem;
}
.machine-code {
  font-size: 0.75rem;
  color: #64748b;
  font-family: monospace;
}
.serial-number {
  font-family: monospace;
  color: #475569;
}
.branch-name {
  color: #334155;
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
.status-badge.maintenance {
  background: #fed7aa;
  color: #9a3412;
}
.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}
.date-info {
  display: flex;
  flex-direction: column;
}
.date {
  font-weight: 500;
  color: #0f172a;
}
.time {
  font-size: 0.7rem;
  color: #94a3b8;
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

/* Responsive */
@media (max-width: 768px) {
  .machine-list-container {
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
  .machines-table th,
  .machines-table td {
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
