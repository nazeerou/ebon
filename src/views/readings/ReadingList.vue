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
                      <i class="fas fa-eye"></i> <span> Angalia</span>
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

    <!-- View Reading Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content view-modal" @click.stop>
        <!-- Header -->
        <div class="modal-header">
          <div class="header-title">
            <h3>Taarifa za Usomaji</h3>
            <p class="subtitle">Angalia maelezo kamili ya usomaji wa mita</p>
          </div>
          <button class="close-btn" @click="closeViewModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Loading -->
        <div class="modal-body" v-if="viewLoading">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Inapakia taarifa...</span>
          </div>
        </div>

        <!-- Content -->
        <div class="modal-body" v-else>
          <!-- Machine Info -->
          <div class="machine-info-card">
            <div class="machine-icon">
              <i class="fas fa-microchip"></i>
            </div>
            <div class="machine-details">
              <h4>{{ viewReadingData?.machine?.machine_name }}</h4>
              <div class="machine-meta">
                <span class="badge">{{ viewReadingData?.machine?.machine_code }}</span>
                <span class="serial">Serial: {{ viewReadingData?.machine?.serial_number }}</span>
              </div>
            </div>
          </div>

          <!-- Comparison Grid -->
          <div class="comparison-grid">
            <!-- Previous Reading -->
            <div class="reading-card previous">
              <div class="card-header">
                <i class="fas fa-history"></i>
                <h5>Usomaji Ulipita</h5>
              </div>
              <div class="reading-value">
                {{ formatNumber(viewReadingData?.previous_reading) }}
              </div>
              <div class="reading-date" v-if="viewReadingData?.previous_reading_data">
                <i class="far fa-calendar-alt"></i>
                {{ formatDate(viewReadingData.previous_reading_data.reading_date) }}
              </div>
              <div class="image-wrapper">
                <img
                  v-if="viewReadingData?.previous_reading_data?.image"
                  :src="getImageUrl(viewReadingData.previous_reading_data.image)"
                  alt="Picha ya usomaji uliopita"
                  class="reading-image"
                />
                <div v-else class="no-image">
                  <i class="fas fa-image"></i>
                  <span>Hakuna picha</span>
                </div>
              </div>
            </div>

            <!-- Current Reading -->
            <div class="reading-card current">
              <div class="card-header">
                <i class="fas fa-tachometer-alt"></i>
                <h5>Usomaji wa Sasa</h5>
              </div>
              <div class="reading-value highlight">
                {{ formatNumber(viewReadingData?.current_reading) }}
              </div>
              <div class="reading-date">
                <i class="far fa-calendar-alt"></i>
                {{ formatDate(viewReadingData?.reading_date) }}
              </div>
              <div class="image-wrapper">
                <img
                  v-if="viewReadingData?.image"
                  :src="getImageUrl(viewReadingData.image)"
                  alt="Picha ya usomaji wa sasa"
                  class="reading-image"
                />
                <div v-else class="no-image">
                  <i class="fas fa-image"></i>
                  <span>Hakuna picha</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Difference -->
          <div class="difference-banner">
            <div class="difference-icon">
              <i class="fas fa-arrow-right"></i>
            </div>
            <div class="difference-text">
              <span class="label">Tofauti</span>
              <span class="value">{{ formatNumber(viewReadingData?.difference) }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-secondary">
            <i class="fas fa-times"></i> Funga
          </button>
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
import { useReadingStore } from '@/stores/reading'
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

// View Reading Modal state
const showViewModal = ref(false)
const viewLoading = ref(false)
const viewReadingData = ref(null)
const viewPreviousData = ref(null)

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

// View reading – show modal
const viewReading = async (reading) => {
  closeActionMenu()
  showViewModal.value = true
  viewLoading.value = true
  viewReadingData.value = null
  viewPreviousData.value = null

  try {
    // Fetch full reading details
    const fullReading = await readingStore.fetchReading(reading.id)
    // fullReading ni object ya usomaji (si wrapped katika .data)
    viewReadingData.value = fullReading

    // Fetch previous reading for the same machine before this reading's date
    if (viewReadingData.value.machine_id && viewReadingData.value.reading_date) {
      try {
        const prev = await readingStore.fetchPreviousReading(
          viewReadingData.value.machine_id,
          viewReadingData.value.reading_date,
        )
        // prev inaweza kuwa null au object ya usomaji
        viewPreviousData.value = prev
      } catch (prevError) {
        // Ikiwa hakuna usomaji uliopita, tuendelee
        console.warn('Hakuna usomaji uliopita:', prevError.message)
        viewPreviousData.value = null
      }
    }
  } catch (err) {
    console.error(err)
    showToastMessage(err.message || 'Imeshindwa kupata taarifa za usomaji', 'error')
    // Funga modal ikiwa kuna hitilafu kubwa
    closeViewModal()
  } finally {
    viewLoading.value = false
  }
}

const closeViewModal = () => {
  showViewModal.value = false
  viewReadingData.value = null
  viewPreviousData.value = null
}

// Helper to build image URL
const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (path.startsWith('/') || path.startsWith('/uploads/')) {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'
    // const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

    const baseDomain = baseUrl.replace('/api/v1', '')
    return `${baseDomain}${path}`
  }
  // const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
  const baseUrl = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

  const baseDomain = baseUrl.replace('/api/v1', '')
  return `${baseDomain}/${path}`
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
/* Same styles as before plus new styles for view modal */
.view-modal {
  max-width: 800px;
  width: 95%;
}
.view-comparison {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 1.5rem 0;
}
.reading-column {
  flex: 1 1 250px;
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.reading-column h4 {
  margin: 0 0 0.5rem;
  font-weight: 600;
  color: #1e293b;
}
.reading-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0.5rem 0;
}
.reading-value.highlight {
  color: #3b82f6;
}
.reading-date {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}
.image-container {
  margin-top: 0.5rem;
  min-height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.reading-image {
  max-width: 100%;
  max-height: 250px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  object-fit: contain;
}
.no-image {
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}
.no-image i {
  font-size: 2rem;
}
.view-difference {
  text-align: center;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}
.machine-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.5rem;
}
.machine-info strong {
  font-size: 1.1rem;
}
.machine-info .serial {
  font-size: 0.875rem;
  color: #64748b;
}
.loading-spinner {
  text-align: center;
  padding: 2rem;
  color: #3b82f6;
  font-size: 1.2rem;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
}

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
/* ===== VIEW MODAL STYLES ===== */
.view-modal {
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #f8fafc);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== MODAL HEADER ===== */
.view-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  border-bottom: 2px solid #f1f5f9;
  background: white;
  border-radius: 16px 16px 0 0;
}

.view-modal .modal-header .header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-modal .modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.view-modal .modal-header h3 i {
  color: #3b82f6;
  font-size: 1.1rem;
}

.reading-badge {
  background: #e0f2fe;
  color: #0c4a6e;
  padding: 0.2rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e2e8f0;
  transform: rotate(90deg);
}

.close-btn i {
  color: #64748b;
  font-size: 1.1rem;
}

/* ===== MODAL BODY ===== */
.view-modal .modal-body {
  padding: 1.75rem;
}

/* ===== LOADING SPINNER ===== */
.loading-spinner {
  text-align: center;
  padding: 3rem 0;
}

.loading-spinner .spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

.loading-spinner p {
  color: #64748b;
  font-size: 0.95rem;
}

/* ===== MACHINE INFO CARD ===== */
.machine-info-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  margin-bottom: 2rem;
}

.machine-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.machine-details {
  flex: 1;
}

.machine-details h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.machine-meta {
  display: flex;
  gap: 1.25rem;
  font-size: 0.875rem;
  color: #475569;
  flex-wrap: wrap;
}

.machine-meta .code {
  font-weight: 600;
  color: #1e293b;
}

.machine-meta .serial i {
  margin-right: 0.3rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.success {
  background: #dcfce7;
  color: #166534;
}

/* ===== READING COMPARISON ===== */
.view-comparison {
  display: flex;
  align-items: stretch;
  gap: 0;
  margin: 1.5rem 0 2rem;
}

.reading-column {
  flex: 1;
  padding: 1.5rem 1.5rem 1rem;
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

.reading-column:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.reading-column.previous {
  border-right: none;
  border-radius: 14px 0 0 14px;
}

.reading-column.current {
  border-left: none;
  border-radius: 0 14px 14px 0;
  background: linear-gradient(135deg, #ffffff, #f0f7ff);
  border-color: #bfdbfe;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.column-header .column-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.reading-column.previous .column-icon {
  background: #f1f5f9;
  color: #475569;
}

.reading-column.current .column-icon {
  background: #dbeafe;
  color: #2563eb;
}

.column-header h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

.reading-value-wrapper {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0.25rem 0 0.5rem;
}

.reading-value-wrapper .reading-value {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.reading-value-wrapper.highlight .reading-value {
  color: #2563eb;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.reading-value-wrapper .reading-unit {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
}

.reading-date {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.reading-date i {
  margin-right: 0.3rem;
  color: #94a3b8;
}

.reading-date.text-muted {
  color: #94a3b8;
}

/* ===== DIVIDER ARROW ===== */
.divider-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  flex-shrink: 0;
  width: 50px;
}

.arrow-line {
  flex: 1;
  width: 2px;
  background: linear-gradient(to bottom, #e2e8f0, #bfdbfe, #e2e8f0);
  min-height: 20px;
}

.arrow-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  margin: 0.25rem 0;
}

/* ===== IMAGE WRAPPER ===== */
.image-wrapper {
  margin-top: 0.75rem;
}

.image-container {
  position: relative;
  width: 100%;
  min-height: 140px;
  max-height: 220px;
  border-radius: 10px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container .reading-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 220px;
  transition: transform 0.3s;
}

.image-container .reading-image:hover {
  transform: scale(1.02);
}

.image-container .image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  padding: 0.75rem 1rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.image-container .image-label {
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.image-container.no-image {
  min-height: 140px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  flex-direction: column;
  gap: 0.5rem;
  color: #94a3b8;
}

.image-container.no-image i {
  font-size: 2.5rem;
  color: #cbd5e1;
}

.image-container.no-image span {
  font-size: 0.875rem;
}

/* ===== DIFFERENCE SUMMARY ===== */
.view-difference {
  margin-top: 1.5rem;
}

.difference-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.diff-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.diff-content {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.diff-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.diff-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.diff-value .diff-unit {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
  margin-left: 0.2rem;
}

.diff-amount {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.diff-amount i {
  font-size: 0.875rem;
}

/* ===== MODAL FOOTER ===== */
.view-modal .modal-footer {
  padding: 1rem 1.75rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: white;
  border-radius: 0 0 16px 16px;
}

.view-modal .modal-footer .btn-secondary {
  padding: 0.5rem 1.25rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.view-modal .modal-footer .btn-secondary:hover {
  background: #e2e8f0;
}

.view-modal .modal-footer .btn-primary {
  padding: 0.5rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.view-modal .modal-footer .btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
  .view-modal {
    max-width: 98%;
    max-height: 95vh;
  }

  .view-modal .modal-header {
    padding: 1rem 1.25rem;
  }

  .view-modal .modal-body {
    padding: 1rem;
  }

  .machine-info-card {
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
  }

  .view-comparison {
    flex-direction: column;
  }

  .reading-column {
    border-radius: 14px !important;
    border: 1px solid #e2e8f0 !important;
    padding: 1rem;
  }

  .reading-column.current {
    background: #f0f7ff;
  }

  .divider-arrow {
    flex-direction: row;
    width: 100%;
    padding: 0.25rem 0;
  }

  .divider-arrow .arrow-line {
    width: 100%;
    height: 2px;
    min-height: auto;
    background: linear-gradient(to right, #e2e8f0, #bfdbfe, #e2e8f0);
  }

  .divider-arrow .arrow-icon {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
    margin: 0 0.5rem;
  }

  .divider-arrow .arrow-icon i {
    transform: rotate(90deg);
  }

  .reading-value-wrapper .reading-value {
    font-size: 1.5rem;
  }

  .difference-card {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .diff-amount {
    width: 100%;
    justify-content: center;
  }

  .view-modal .modal-footer {
    padding: 0.75rem 1.25rem;
    flex-wrap: wrap;
  }

  .view-modal .modal-footer button {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .machine-meta {
    flex-direction: column;
    gap: 0.25rem;
  }

  .machine-info-card .status-badge {
    width: 100%;
    justify-content: center;
  }

  .reading-column {
    padding: 0.75rem;
  }

  .reading-value-wrapper .reading-value {
    font-size: 1.25rem;
  }

  .diff-content {
    flex-wrap: wrap;
  }
}
/* ============================================
   VIEW MODAL - DESIGN & STYLING
   ============================================ */

/* ---- Modal Overlay ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ---- Modal Content ---- */
.view-modal {
  max-width: 880px;
  width: 100%;
  max-height: 95vh;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.35);
  animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ---- Header ---- */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
  flex-shrink: 0;
}

.header-title h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.header-title .subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 400;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  line-height: 1;
}

.close-btn:hover {
  color: #ef4444;
  background: #fef2f2;
  transform: rotate(90deg);
}

/* ---- Body / Scrollable Area ---- */
.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

/* ---- Loading Spinner ---- */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 0;
  color: #3b82f6;
}

.loading-spinner i {
  font-size: 2.75rem;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner span {
  font-size: 1rem;
  color: #475569;
  font-weight: 500;
}

/* ---- Machine Info Card ---- */
.machine-info-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: #f8fafc;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #eef2f6;
  transition: border-color 0.2s;
}

.machine-info-card:hover {
  border-color: #cbd5e1;
}

.machine-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.machine-details {
  flex: 1;
  min-width: 0;
}

.machine-details h4 {
  margin: 0 0 0.3rem 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.machine-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.badge {
  background: #e2e8f0;
  padding: 0.2rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.3px;
}

.serial {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 400;
}

/* ---- Comparison Grid ---- */
.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
  margin-bottom: 1.75rem;
}

/* ---- Reading Cards ---- */
.reading-card {
  background: #fafbfc;
  border-radius: 18px;
  padding: 1.5rem;
  border: 1px solid #eef2f6;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
}

.reading-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.08);
}

.reading-card .card-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.reading-card .card-header i {
  font-size: 1rem;
  color: #64748b;
  width: 20px;
}

.reading-card .card-header h5 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.reading-card .reading-value {
  font-size: 2.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.1rem;
  letter-spacing: -0.5px;
}

.reading-card .reading-value.highlight {
  color: #2563eb;
}

.reading-card .reading-date {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.reading-card .reading-date i {
  margin-right: 0.35rem;
}

/* Current Reading - Highlight */
.reading-card.current {
  background: #f0f7ff;
  border-color: #bfdbfe;
}

.reading-card.current .card-header i {
  color: #2563eb;
}

.reading-card.current .reading-value {
  color: #1e40af;
}

.reading-card.previous {
  background: #f8fafc;
  border-color: #e2e8f0;
}

/* ---- Image Wrapper ---- */
.image-wrapper {
  margin-top: 0.75rem;
  min-height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #eef2f6;
  overflow: hidden;
  position: relative;
  flex: 1;
  transition: border-color 0.2s;
}

.image-wrapper:hover {
  border-color: #94a3b8;
}

.reading-image {
  max-width: 100%;
  max-height: 230px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  transition: transform 0.3s ease;
  padding: 0.25rem;
}

.reading-image:hover {
  transform: scale(1.03);
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  padding: 1.5rem;
}

.no-image i {
  font-size: 2.5rem;
  opacity: 0.4;
}

.no-image span {
  font-size: 0.85rem;
  font-weight: 400;
}

/* ---- Difference Banner ---- */
.difference-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.9rem 1.5rem;
  background: linear-gradient(135deg, #f1f5f9, #eef2f6);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-top: 0.5rem;
}

.difference-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.difference-text {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.difference-text .label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
}

.difference-text .value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
}

/* ---- Modal Footer ---- */
.modal-footer {
  padding: 1rem 2rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  background: #fafbfc;
  flex-shrink: 0;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.55rem 1.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.btn-secondary:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.btn-secondary:active {
  transform: translateY(0);
}

/* ============================================
   RESPONSIVE - MOBILE FIRST
   ============================================ */

/* Tablets & small laptops */
@media (max-width: 1024px) {
  .view-modal {
    max-width: 750px;
  }

  .comparison-grid {
    gap: 1.25rem;
  }

  .reading-card .reading-value {
    font-size: 2rem;
  }
}

/* Tablets & large phones */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .view-modal {
    max-height: 98vh;
    border-radius: 20px;
  }

  .modal-header {
    padding: 1rem 1.25rem;
  }

  .header-title h3 {
    font-size: 1.1rem;
  }

  .header-title .subtitle {
    font-size: 0.8rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .reading-card {
    padding: 1.25rem;
  }

  .reading-card .reading-value {
    font-size: 1.75rem;
  }

  .reading-card .reading-date {
    font-size: 0.8rem;
  }

  .machine-info-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
    gap: 0.75rem;
  }

  .machine-details h4 {
    font-size: 1rem;
    white-space: normal;
  }

  .machine-meta {
    justify-content: center;
  }

  .machine-icon {
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
  }

  .image-wrapper {
    min-height: 130px;
  }

  .reading-image {
    max-height: 180px;
  }

  .difference-banner {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .difference-icon {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }

  .difference-text .value {
    font-size: 1.3rem;
  }

  .modal-footer {
    padding: 0.75rem 1.25rem;
  }

  .btn-secondary {
    width: 100%;
    justify-content: center;
    padding: 0.6rem;
  }
}

/* Small phones */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.25rem;
  }

  .view-modal {
    border-radius: 16px;
  }

  .modal-header {
    padding: 0.75rem 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .header-title h3 {
    font-size: 1rem;
  }

  .header-title .subtitle {
    font-size: 0.75rem;
  }

  .reading-card {
    padding: 1rem;
  }

  .reading-card .reading-value {
    font-size: 1.5rem;
  }

  .image-wrapper {
    min-height: 100px;
  }

  .reading-image {
    max-height: 150px;
  }

  .difference-text .value {
    font-size: 1.1rem;
  }

  .machine-info-card {
    padding: 0.75rem;
  }

  .machine-details h4 {
    font-size: 0.95rem;
  }

  .badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.6rem;
  }

  .serial {
    font-size: 0.75rem;
  }

  .close-btn {
    font-size: 1rem;
    padding: 0.25rem 0.4rem;
  }
}

/* Scrollbar styling (for modal body) */
.modal-body::-webkit-scrollbar {
  width: 5px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
