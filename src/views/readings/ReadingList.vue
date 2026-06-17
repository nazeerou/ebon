<template>
  <div class="reading-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Usomaji wa Mita</h1>
        <p class="reading-count" v-if="!loading">
          Jumla ya usomaji: <strong>{{ formatNumber(pagination.total) }}</strong>
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
            placeholder="Tafuta kwa jina la mashine au msimbo..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="btn-export" @click="exportReadings">
          <i class="fas fa-download"></i>
          <span>Pakua</span>
        </button>
        <!-- <router-link to="/readings/ocr" class="btn-primary">
          <i class="fas fa-camera"></i>
          <span>Usomaji Mpya </span>
        </router-link> -->
      </div>
    </div>

    <!-- Loading / Error states -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia usomaji...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadReadings" class="btn-retry">
        <i class="fas fa-redo"></i> Jaribu Tena
      </button>
    </div>

    <!-- Readings Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="readings-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th>Mashine</th>
              <th>Usomaji Ulipita</th>
              <th>Usomaji wa Sasa</th>
              <th>Tofauti</th>
              <th>Tarehe ya Usomaji</th>
              <th>Aliyefanya</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="reading in readings"
              :key="reading.id"
              :class="{ 'row-selected': selectedReadings.includes(reading.id) }"
            >
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  v-model="selectedReadings"
                  :value="reading.id"
                  @change="updateSelectAll"
                />
              </td>
              <td>
                <div class="machine-cell">
                  <span class="machine-name">{{ reading.machine?.machine_name || '-' }}</span>
                  <span class="machine-code">{{ reading.machine?.machine_code || '-' }}</span>
                </div>
              </td>
              <td>{{ formatNumber(reading.previous_reading) }}</td>
              <td>{{ formatNumber(reading.current_reading) }}</td>
              <td>{{ formatNumber(reading.difference) }}</td>
              <td>{{ formatDate(reading.reading_date) }}</td>
              <td>{{ reading.creator?.name || '-' }}</td>
              <td>
                <div class="action-dropdown" :ref="(el) => setActionRef(el, reading.id)">
                  <button class="action-menu-btn" @click.stop="toggleActionMenu(reading.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeActionMenu === reading.id" class="action-menu">
                    <button @click="viewReading(reading)" class="action-menu-item">
                      <i class="fas fa-eye"></i> <span>Angalia</span>
                    </button>
                    <button @click="confirmDelete(reading)" class="action-menu-item text-danger">
                      <i class="fas fa-trash-alt"></i> <span>Futa</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="readings.length === 0">
              <td colspan="8" class="text-center">
                <div class="empty-state-small">
                  <i class="fas fa-tachometer-alt"></i>
                  <p>Hakuna usomaji uliopatikana</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedReadings.length > 0" class="bulk-actions">
        <div class="bulk-info">
          <i class="fas fa-check-circle"></i>
          <span
            >Umechagua <strong>{{ formatNumber(selectedReadings.length) }}</strong> usomaji</span
          >
        </div>
        <div class="bulk-buttons">
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
          <strong>{{ formatNumber(pagination.total) }}</strong> usomaji
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

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Futa Usomaji</h3>
          <button class="close-btn" @click="closeDeleteModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kufuta usomaji huu?</p>
          <p class="warning-text" v-if="readingToDelete">
            <strong
              >Mashine: {{ readingToDelete.machine?.machine_name }} (Tarehe:
              {{ formatDate(readingToDelete.reading_date) }})</strong
            >
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i> Hatua hii haiwezi kutenguliwa. Usomaji utafutwa
            kabisa kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="deleteReading" class="btn-danger" :disabled="deleteLoading">
            Futa Usomaji
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Delete Modal -->
    <div v-if="showBulkDeleteModal" class="modal-overlay" @click="closeBulkDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Futa Usomaji Wengi</h3>
          <button class="close-btn" @click="closeBulkDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Una uhakika unataka kufuta usomaji
            <strong>{{ formatNumber(selectedReadings.length) }}</strong
            >?
          </p>
          <div class="selected-list">
            <div v-for="id in selectedReadings.slice(0, 5)" :key="id" class="selected-item">
              <i class="fas fa-tachometer-alt"></i> <span>{{ getReadingInfo(id) }}</span>
            </div>
            <div v-if="selectedReadings.length > 5" class="more-items">
              ... na wengine {{ formatNumber(selectedReadings.length - 5) }}
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

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification" :class="toastType">
      <i :class="toastIcon"></i> <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/reading' // make sure to create this store
import { formatDate, formatNumber } from '@/utils/formatters'
import debounce from 'lodash/debounce'

const router = useRouter()
const readingStore = useReadingStore()

// State
const readings = ref([])
const loading = ref(false)
const error = ref(null)
const selectedReadings = ref([])
const selectAll = ref(false)
const showBulkDeleteModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const activeActionMenu = ref(null)
const actionRefs = ref({})

// Delete reading state
const readingToDelete = ref(null)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)

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

// Load readings
const loadReadings = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      per_page: pagination.perPage,
      page: pagination.currentPage,
      search: searchQuery.value || undefined,
    }
    const response = await readingStore.fetchReadings(params)
    let responseData = response.data || response
    if (responseData.data && Array.isArray(responseData.data)) {
      readings.value = responseData.data
      pagination.currentPage = responseData.current_page || 1
      pagination.lastPage = responseData.last_page || 1
      pagination.total = responseData.total || 0
      pagination.from = responseData.from || 0
      pagination.to = responseData.to || 0
    } else if (Array.isArray(responseData)) {
      readings.value = responseData
    } else {
      readings.value = []
    }
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Imeshindwa kupakia usomaji.'
    showToastMessage(error.value, 'error')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    pagination.currentPage = page
    loadReadings()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const debouncedSearch = debounce(() => {
  pagination.currentPage = 1
  loadReadings()
}, 500)
watch(searchQuery, () => debouncedSearch())

const clearSearch = () => {
  searchQuery.value = ''
  pagination.currentPage = 1
  loadReadings()
}

// View reading (could be a modal or separate page)
const viewReading = (reading) => {
  router.push(`/readings/${reading.id}`)
  closeActionMenu()
}

// Delete single reading
const confirmDelete = (reading) => {
  readingToDelete.value = reading
  showDeleteModal.value = true
  closeActionMenu()
}
const closeDeleteModal = () => {
  showDeleteModal.value = false
  readingToDelete.value = null
}
const deleteReading = async () => {
  if (!readingToDelete.value) return
  deleteLoading.value = true
  try {
    await readingStore.deleteReading(readingToDelete.value.id)
    showToastMessage('Usomaji umefutwa', 'success')
    closeDeleteModal()
    await loadReadings()
    clearSelection()
  } catch (err) {
    showToastMessage(err.response?.data?.message || 'Imeshindwa kufuta', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Bulk delete
const confirmBulkDelete = () => {
  if (selectedReadings.value.length) showBulkDeleteModal.value = true
}
const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false
}
const bulkDelete = async () => {
  if (!selectedReadings.value.length) return
  deleteLoading.value = true
  try {
    const results = await Promise.allSettled(
      selectedReadings.value.map((id) => readingStore.deleteReading(id)),
    )
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value?.success || r.value?.status === 'success'),
    ).length
    showToastMessage(`${successful} usomaji umefutwa`, successful ? 'success' : 'error')
    closeBulkDeleteModal()
    await loadReadings()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  } finally {
    deleteLoading.value = false
  }
}

const clearSelection = () => {
  selectedReadings.value = []
  selectAll.value = false
}
const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
  selectedReadings.value = selectAll.value ? readings.value.map((r) => r.id) : []
}
const updateSelectAll = () => {
  selectAll.value = selectedReadings.value.length === readings.value.length
}

const exportReadings = async () => {
  try {
    if (readingStore.exportReadings)
      await readingStore.exportReadings({ search: searchQuery.value })
    else showToastMessage('Kipengele cha kuweka nje hakipo', 'warning')
  } catch (err) {
    showToastMessage('Hitilafu wakati wa kupakua', 'error')
  }
}

const getReadingInfo = (id) => {
  const reading = readings.value.find((r) => r.id === id)
  return reading
    ? `${reading.machine?.machine_name || ''} - ${formatDate(reading.reading_date)}`
    : ''
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

onMounted(() => {
  loadReadings()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  debouncedSearch.cancel()
})
</script>

<style scoped>
/* Reuse all styles from the original component – just rename container class */
.reading-list-container {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* All other CSS classes (page-header, search-wrapper, table-card, etc.) are identical to the original. */
/* For brevity, I have omitted them, but you must copy the entire <style> block from the original MachineList.vue */
/* and replace .machine-list-container with .reading-list-container. The rest remains the same. */

/* The styles below are a placeholder – use the full styles from the original component */
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
.reading-count {
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
  background: white;
  /* width: 100%; */
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
  border: none;
}
.btn-primary {
  background: #3b82f6;
  color: white;
}
.btn-export {
  background: white;
  color: #10b981;
  border: 1px solid #10b981;
}
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
.readings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.readings-table th {
  text-align: left;
  padding: 1rem;
  background: #f8fafc;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}
.readings-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.checkbox-col {
  width: 40px;
  text-align: center;
}
.machine-cell {
  display: flex;
  flex-direction: column;
}
.machine-name {
  font-weight: 600;
}
.machine-code {
  font-size: 0.75rem;
  color: #64748b;
}
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
  cursor: pointer;
}
.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 160px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
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
}
.action-menu-item.text-danger {
  color: #dc2626;
}
.bulk-actions {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  cursor: pointer;
}
.pagination-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}
.pagination-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
.pagination-btn {
  min-width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
}
.pagination-btn.active {
  background: #3b82f6;
  color: white;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: white;
  border-radius: 1rem;
  max-width: 500px;
  width: 90%;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}
.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}
.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-left: 4px solid;
  z-index: 2100;
}
.toast-notification.success {
  border-left-color: #10b981;
}
.toast-notification.error {
  border-left-color: #ef4444;
}
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
@media (max-width: 768px) {
  .reading-list-container {
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
  .readings-table th,
  .readings-table td {
    padding: 0.75rem;
  }
  .checkbox-col {
    width: 30px;
  }
}
</style>
