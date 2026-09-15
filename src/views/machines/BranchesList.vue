<template>
  <div class="branches-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Sehemu / Matawi</h1>
        <p class="subtitle">
          Jumla ya matawi: <strong>{{ formatNumber(branches.length) }}</strong> • Mashine zote:
          <strong>{{ formatNumber(totalMachinesAll) }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="branchSearch"
            type="text"
            class="search-input"
            placeholder="Tafuta tawi..."
          />
          <button v-if="branchSearch" class="clear-search" @click="branchSearch = ''">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading / Error -->
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

    <!-- Branch Cards Grid -->
    <div v-else-if="!selectedBranch" class="branches-grid">
      <div
        v-for="branch in filteredBranches"
        :key="branch.id"
        class="branch-card"
        @click="openBranch(branch)"
      >
        <div class="branch-card-header">
          <div class="branch-icon">
            <i class="fas fa-store"></i>
          </div>
          <div class="branch-meta">
            <h3>{{ branch.branch_name }}</h3>
            <span class="branch-code" v-if="branch.branch_code">
              {{ branch.branch_code }}
            </span>
          </div>
          <i class="fas fa-chevron-right arrow"></i>
        </div>

        <div class="branch-counts">
          <div class="count-box total">
            <span class="count-value">{{ formatNumber(branch.total_machines || 0) }}</span>
            <span class="count-label">Mashine</span>
          </div>
          <div class="count-box active">
            <span class="count-value">{{ formatNumber(branch.active_machines || 0) }}</span>
            <span class="count-label">Zinafanya</span>
          </div>
          <div class="count-box maintenance">
            <span class="count-value">{{ formatNumber(branch.maintenance_machines || 0) }}</span>
            <span class="count-label">Matengenezo</span>
          </div>
          <div class="count-box inactive">
            <span class="count-value">{{ formatNumber(branch.inactive_machines || 0) }}</span>
            <span class="count-label">Hazifanyi</span>
          </div>
        </div>
      </div>

      <div v-if="filteredBranches.length === 0" class="empty-state">
        <i class="fas fa-store-slash"></i>
        <p>Hakuna matawi yaliyopatikana</p>
      </div>
    </div>

    <!-- Machines of Selected Branch -->
    <div v-else class="branch-detail">
      <div class="detail-header">
        <button class="btn-back" @click="closeBranch">
          <i class="fas fa-arrow-left"></i> Rudi
        </button>
        <div class="detail-title">
          <h2>{{ selectedBranch.branch_name }}</h2>
          <p class="detail-subtitle">
            Mashine: <strong>{{ formatNumber(machinesPagination.total) }}</strong>
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="machineSearch"
            @input="debouncedMachineSearch"
            type="text"
            class="search-input"
            placeholder="Tafuta jina, code, serial..."
          />
          <button v-if="machineSearch" class="clear-search" @click="clearMachineSearch">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="status-filters">
          <button
            class="filter-btn"
            :class="{ active: statusFilter === '' }"
            @click="setStatusFilter('')"
          >
            Zote
          </button>
          <button
            class="filter-btn"
            :class="{ active: statusFilter === 'active' }"
            @click="setStatusFilter('active')"
          >
            Zinafanya
          </button>
          <button
            class="filter-btn"
            :class="{ active: statusFilter === 'maintenance' }"
            @click="setStatusFilter('maintenance')"
          >
            Matengenezo
          </button>
          <button
            class="filter-btn"
            :class="{ active: statusFilter === 'inactive' }"
            @click="setStatusFilter('inactive')"
          >
            Hazifanyi
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="machinesLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Inapakia mashine...</p>
      </div>

      <!-- Machines Grid -->
      <div v-else-if="branchMachines.length" class="machines-grid">
        <div
          v-for="machine in branchMachines"
          :key="machine.id"
          class="machine-card"
          @click="viewMachine(machine)"
        >
          <div class="machine-photo">
            <img
              v-if="machine.photo_urls && machine.photo_urls.length"
              :src="machine.photo_urls[0]"
              :alt="machine.machine_name"
            />
            <div v-else class="no-photo">
              <i class="fas fa-microchip"></i>
            </div>
            <span class="status-dot" :class="machine.status"></span>
          </div>
          <div class="machine-info">
            <h4>{{ machine.machine_name }}</h4>
            <span class="machine-code">{{ machine.machine_code }}</span>
            <span class="machine-serial">
              <i class="fas fa-barcode"></i> {{ machine.serial_number || '—' }}
            </span>
            <div class="machine-tags" v-if="machine.materials?.length">
              <span v-for="m in machine.materials.slice(0, 2)" :key="m" class="mini-tag">
                {{ m }}
              </span>
              <span v-if="machine.materials.length > 2" class="mini-tag more">
                +{{ machine.materials.length - 2 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-microchip"></i>
        <p>Hakuna mashine kwenye tawi hili</p>
      </div>

      <!-- Pagination -->
      <div v-if="machinesPagination.lastPage > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="machinesPagination.currentPage === 1"
          @click="changeMachinePage(machinesPagination.currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">
          Ukurasa {{ machinesPagination.currentPage }} / {{ machinesPagination.lastPage }}
        </span>
        <button
          class="pagination-btn"
          :disabled="machinesPagination.currentPage === machinesPagination.lastPage"
          @click="changeMachinePage(machinesPagination.currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- ============ MACHINE DETAIL MODAL ============ -->
    <div v-if="showMachineModal" class="modal-overlay" @click="closeMachineModal">
      <div class="modal-content machine-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-title">
            <div class="modal-header-icon">
              <i class="fas fa-microchip"></i>
            </div>
            <div>
              <h3>{{ selectedMachine?.machine_name }}</h3>
              <p class="modal-subtitle">
                {{ selectedMachine?.machine_code }} • {{ selectedMachine?.serial_number }}
              </p>
            </div>
          </div>
          <button class="close-btn" @click="closeMachineModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Photos -->
          <div class="view-section" v-if="selectedMachine?.photo_urls?.length">
            <div class="form-section-title">
              <i class="fas fa-camera"></i>
              <span>Picha</span>
            </div>
            <div class="view-photo-grid">
              <div
                v-for="(url, i) in selectedMachine.photo_urls"
                :key="i"
                class="view-photo"
                @click="lightboxUrl = url"
              >
                <img :src="url" :alt="`Picha ${i + 1}`" />
              </div>
            </div>
          </div>

          <!-- Details -->
          <div class="view-section">
            <div class="form-section-title">
              <i class="fas fa-info-circle"></i>
              <span>Taarifa</span>
            </div>
            <div class="view-details-grid">
              <div class="view-detail">
                <span class="detail-label">Machine Code</span>
                <span class="detail-value mono">{{ selectedMachine.machine_code }}</span>
              </div>
              <div class="view-detail">
                <span class="detail-label">Serial</span>
                <span class="detail-value mono">{{ selectedMachine.serial_number }}</span>
              </div>
              <div class="view-detail">
                <span class="detail-label">Hali</span>
                <span class="status-badge" :class="selectedMachine.status">
                  {{ getStatusText(selectedMachine.status) }}
                </span>
              </div>
              <div class="view-detail">
                <span class="detail-label">Tarehe ya Ufungaji</span>
                <span class="detail-value">
                  {{ formatDate(selectedMachine.installation_date) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Materials -->
          <div class="view-section" v-if="selectedMachine?.materials?.length">
            <div class="form-section-title">
              <i class="fas fa-tools"></i>
              <span>Material / Vifaa</span>
            </div>
            <div class="view-materials">
              <span v-for="m in selectedMachine.materials" :key="m" class="material-tag">
                <i class="fas fa-cube"></i> {{ m }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxUrl" class="lightbox-overlay" @click="lightboxUrl = null">
      <button class="lightbox-close" @click.stop="lightboxUrl = null">
        <i class="fas fa-times"></i>
      </button>
      <img :src="lightboxUrl" alt="photo" class="lightbox-img" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatDate, formatNumber } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

// Branches list
const branches = ref([])
const loading = ref(false)
const error = ref(null)
const branchSearch = ref('')

// Selected branch + its machines
const selectedBranch = ref(null)
const branchMachines = ref([])
const machinesLoading = ref(false)
const machineSearch = ref('')
const statusFilter = ref('')
const machinesPagination = ref({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  perPage: 12,
})

// Modal
const showMachineModal = ref(false)
const selectedMachine = ref(null)
const lightboxUrl = ref(null)

// ---- Computed ----
const filteredBranches = computed(() => {
  if (!branchSearch.value) return branches.value
  const q = branchSearch.value.toLowerCase()
  return branches.value.filter(
    (b) =>
      (b.branch_name || '').toLowerCase().includes(q) ||
      (b.branch_code || '').toLowerCase().includes(q),
  )
})

const totalMachinesAll = computed(() =>
  branches.value.reduce((sum, b) => sum + Number(b.total_machines || 0), 0),
)

// ---- Load branches ----
const loadBranches = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await axios.get(`${API_URL}/branches-machines`)
    if (response.data?.success) {
      branches.value = response.data.data
    } else if (Array.isArray(response.data)) {
      branches.value = response.data
    } else {
      branches.value = []
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Imeshindwa kupakia matawi.'
  } finally {
    loading.value = false
  }
}

// ---- Load machines for a branch ----
const loadBranchMachines = async (page = 1) => {
  if (!selectedBranch.value) return
  machinesLoading.value = true
  try {
    const params = {
      page,
      per_page: machinesPagination.value.perPage,
      search: machineSearch.value || undefined,
      status: statusFilter.value || undefined,
    }
    const response = await axios.get(`${API_URL}/branches/${selectedBranch.value.id}/machines`, {
      params,
    })

    if (response.data?.success) {
      const pag = response.data.data
      branchMachines.value = pag.data || []
      machinesPagination.value = {
        currentPage: pag.current_page || 1,
        lastPage: pag.last_page || 1,
        total: pag.total || 0,
        perPage: pag.per_page || 12,
      }
    } else {
      branchMachines.value = []
    }
  } catch (err) {
    console.error(err)
    branchMachines.value = []
  } finally {
    machinesLoading.value = false
  }
}

const openBranch = (branch) => {
  selectedBranch.value = branch
  machineSearch.value = ''
  statusFilter.value = ''
  machinesPagination.value.currentPage = 1
  loadBranchMachines(1)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const closeBranch = () => {
  selectedBranch.value = null
  branchMachines.value = []
  machineSearch.value = ''
  statusFilter.value = ''
}

const changeMachinePage = (page) => {
  if (page < 1 || page > machinesPagination.value.lastPage) return
  loadBranchMachines(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const debouncedMachineSearch = debounce(() => {
  machinesPagination.value.currentPage = 1
  loadBranchMachines(1)
}, 500)

const clearMachineSearch = () => {
  machineSearch.value = ''
  machinesPagination.value.currentPage = 1
  loadBranchMachines(1)
}

const setStatusFilter = (status) => {
  statusFilter.value = status
  machinesPagination.value.currentPage = 1
  loadBranchMachines(1)
}

// ---- Machine detail modal ----
const viewMachine = (machine) => {
  selectedMachine.value = machine
  showMachineModal.value = true
}
const closeMachineModal = () => {
  showMachineModal.value = false
  selectedMachine.value = null
}

const getStatusText = (status) =>
  ({ active: 'Inafanya kazi', maintenance: 'Matengenezo', inactive: 'Haifanyi kazi' })[status] ||
  status

onMounted(loadBranches)
</script>

<style scoped>
.branches-page {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
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
.subtitle {
  color: #64748b;
  margin: 0;
  font-size: 0.875rem;
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
  width: 100%;
  padding: 0.6rem 2rem 0.6rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  background: white;
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
}
.clear-search:hover {
  color: #ef4444;
}

/* Branch cards grid */
.branches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
}
.branch-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid #eef2f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.branch-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px -8px rgba(59, 130, 246, 0.25);
  border-color: #bfdbfe;
}
.branch-card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.branch-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
  flex-shrink: 0;
}
.branch-meta {
  flex: 1;
  min-width: 0;
}
.branch-meta h3 {
  margin: 0 0 0.15rem;
  font-size: 1rem;
  color: #0f172a;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.branch-code {
  font-size: 0.7rem;
  color: #64748b;
  font-family: monospace;
}
.arrow {
  color: #cbd5e1;
  transition:
    transform 0.2s,
    color 0.2s;
}
.branch-card:hover .arrow {
  color: #3b82f6;
  transform: translateX(4px);
}

.branch-counts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.count-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 0.35rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #eef2f6;
}
.count-box.total {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.count-box.active .count-value {
  color: #1e40af;
}
.count-box.maintenance .count-value {
  color: #b45309;
}
.count-box.inactive .count-value {
  color: #b91c1c;
}
.count-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}
.count-label {
  font-size: 0.62rem;
  color: #64748b;
  margin-top: 0.3rem;
  text-align: center;
  line-height: 1.1;
}

/* Branch detail */
.branch-detail {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: white;
  cursor: pointer;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-back:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #3b82f6;
}
.detail-title h2 {
  margin: 0;
  font-size: 1.35rem;
  color: #0f172a;
}
.detail-subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

/* Filters bar */
.filters-bar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.filters-bar .search-wrapper {
  flex: 1;
  min-width: 240px;
  max-width: 360px;
}
.status-filters {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.filter-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover {
  border-color: #93c5fd;
  color: #1e40af;
}
.filter-btn.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #2563eb;
  color: white;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

/* Machines grid */
.machines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
.machine-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #eef2f6;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.machine-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px -8px rgba(59, 130, 246, 0.25);
  border-color: #bfdbfe;
}
.machine-photo {
  position: relative;
  aspect-ratio: 16 / 10;
  background: #f1f5f9;
  overflow: hidden;
}
.machine-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.no-photo {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 2rem;
  background: linear-gradient(135deg, #f8fafc, #eef2f6);
}
.status-dot {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.status-dot.active {
  background: #10b981;
}
.status-dot.maintenance {
  background: #f59e0b;
}
.status-dot.inactive {
  background: #ef4444;
}

.machine-info {
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.machine-info h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.machine-code {
  font-size: 0.72rem;
  color: #64748b;
  font-family: monospace;
}
.machine-serial {
  font-size: 0.72rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.machine-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
}
.mini-tag {
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  font-weight: 500;
}
.mini-tag.more {
  background: #f1f5f9;
  color: #64748b;
  border-color: #e2e8f0;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}
.pagination-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  color: #334155;
  transition: all 0.2s;
}
.pagination-btn:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  font-size: 0.85rem;
  color: #64748b;
}

/* States */
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
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 16px;
  border: 1px dashed #e2e8f0;
  color: #94a3b8;
}
.empty-state i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

/* ============================
   Modal
   ============================ */
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
  border-radius: 18px;
  width: 90%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
}
.modal-subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: #64748b;
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
.view-photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
.view-photo {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  cursor: zoom-in;
  transition: all 0.2s;
  background: #f1f5f9;
}
.view-photo:hover {
  transform: translateY(-2px);
  border-color: #3b82f6;
}
.view-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
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
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  align-self: flex-start;
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
.view-materials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.material-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1e40af;
  font-size: 0.8rem;
  font-weight: 500;
}
.material-tag i {
  font-size: 0.75rem;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 2rem;
}
.lightbox-img {
  max-width: 95vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
}
.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .branches-grid {
    grid-template-columns: 1fr;
  }
  .branch-counts {
    grid-template-columns: repeat(4, 1fr);
  }
  .machines-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .search-wrapper {
    width: 100%;
  }
  .filters-bar {
    flex-direction: column;
  }
  .filters-bar .search-wrapper {
    max-width: 100%;
  }
  .view-photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .view-details-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .machines-grid {
    grid-template-columns: 1fr;
  }
}
</style>
