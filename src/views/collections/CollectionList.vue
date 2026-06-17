<template>
  <div class="collection-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Makusanyo</h1>
        <p class="collection-count" v-if="!loading">
          Jumla ya makusanyo: <strong>{{ formatNumber(pagination.total) }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            @input="debouncedSearch"
            placeholder="Tafuta kwa jina la mashine au mkusanyaji..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="btn-export" @click="exportCollections">
          <i class="fas fa-download"></i> <span>Pakua</span>
        </button>
      </div>
    </div>

    <!-- Loading / Error states -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia makusanyo...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadCollections" class="btn-retry">
        <i class="fas fa-redo"></i> Jaribu Tena
      </button>
    </div>

    <!-- Collections Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="collections-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th>Mashine</th>
              <th>Kiasi (TZS)</th>
              <th>Tarehe ya Makusanyo</th>
              <th>Mkusanyaji</th>
              <th>Usomaji (Prev → Cur → Diff)</th>
              <th>Aina</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="collection in collections"
              :key="collection.id"
              :class="{ 'row-selected': selectedCollections.includes(collection.id) }"
            >
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  v-model="selectedCollections"
                  :value="collection.id"
                  @change="updateSelectAll"
                />
              </td>
              <td>
                <div class="machine-cell">
                  <span class="machine-name">{{ collection.machine?.machine_name || '-' }}</span>
                  <span class="machine-code">{{ collection.machine?.machine_code || '-' }}</span>
                </div>
              </td>
              <td>
                <span class="amount">{{ formatCurrency(collection.amount_collected) }}</span>
              </td>
              <td>{{ formatDate(collection.collection_date) }}</td>
              <td>{{ collection.collector?.name || '-' }}</td>
              <td>
                <div class="reading-info">
                  <span class="prev">{{ formatNumber(collection.reading?.previous_reading) }}</span>
                  <i class="fas fa-arrow-right"></i>
                  <span class="cur">{{ formatNumber(collection.reading?.current_reading) }}</span>
                  <span class="diff">({{ formatNumber(collection.reading?.difference) }})</span>
                </div>
              </td>
              <td>
                <span
                  class="type-badge"
                  :class="{ auto: collection.is_auto, manual: !collection.is_auto }"
                >
                  {{ collection.is_auto ? '(Mileage×200)' : 'Manual' }}
                </span>
              </td>
              <td>
                <div class="action-dropdown" :ref="(el) => setActionRef(el, collection.id)">
                  <button class="action-menu-btn" @click.stop="toggleActionMenu(collection.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeActionMenu === collection.id" class="action-menu">
                    <button @click="viewCollection(collection)" class="action-menu-item">
                      <i class="fas fa-eye"></i> <span>Angalia</span>
                    </button>
                    <button @click="confirmDelete(collection)" class="action-menu-item text-danger">
                      <i class="fas fa-trash-alt"></i> <span>Futa</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="collections.length === 0">
              <td colspan="8" class="text-center">
                <div class="empty-state-small">
                  <i class="fas fa-coins"></i>
                  <p>Hakuna makusanyo yaliyopatikana</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedCollections.length > 0" class="bulk-actions">
        <div class="bulk-info">
          <i class="fas fa-check-circle"></i>
          <span
            >Umechagua
            <strong>{{ formatNumber(selectedCollections.length) }}</strong> makusanyo</span
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
          <strong>{{ formatNumber(pagination.total) }}</strong> makusanyo
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
          <h3>Futa Makusanyo</h3>
          <button class="close-btn" @click="closeDeleteModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kufuta makusanyo haya?</p>
          <p class="warning-text" v-if="collectionToDelete">
            <strong>Mashine: {{ collectionToDelete.machine?.machine_name }}</strong
            ><br />
            Kiasi: {{ formatCurrency(collectionToDelete.amount_collected) }}<br />
            Tarehe: {{ formatDate(collectionToDelete.collection_date) }}
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i> Hatua hii haiwezi kutenguliwa.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="deleteCollection" class="btn-danger" :disabled="deleteLoading">
            Futa Makusanyo
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Delete Modal -->
    <div v-if="showBulkDeleteModal" class="modal-overlay" @click="closeBulkDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Futa Makusanyo Wengi</h3>
          <button class="close-btn" @click="closeBulkDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Una uhakika unataka kufuta makusanyo
            <strong>{{ formatNumber(selectedCollections.length) }}</strong
            >?
          </p>
          <div class="selected-list">
            <div v-for="id in selectedCollections.slice(0, 5)" :key="id" class="selected-item">
              <i class="fas fa-coins"></i>
              <span>{{ getCollectionInfo(id) }}</span>
            </div>
            <div v-if="selectedCollections.length > 5" class="more-items">
              ... na wengine {{ formatNumber(selectedCollections.length - 5) }}
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
import { useCollectionStore } from '@/stores/collection'
import { formatDate, formatNumber } from '@/utils/formatters'
import debounce from 'lodash/debounce'

const router = useRouter()
const collectionStore = useCollectionStore()

// Helper formatCurrency (in case not imported)
const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'TZS 0'
  const num = parseFloat(value)
  if (isNaN(num)) return 'TZS 0'
  return `TZS ${num.toLocaleString('sw-TZ')}`
}

// State
const collections = ref([])
const loading = ref(false)
const error = ref(null)
const selectedCollections = ref([])
const selectAll = ref(false)
const showBulkDeleteModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const activeActionMenu = ref(null)
const actionRefs = ref({})

// Delete collection state
const collectionToDelete = ref(null)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)

// Pagination
const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  perPage: 20,
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

// Load collections
const loadCollections = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      per_page: pagination.perPage,
      page: pagination.currentPage,
      search: searchQuery.value || undefined,
    }
    const response = await collectionStore.fetchCollections(params)
    let responseData = response.data || response
    if (responseData.data && Array.isArray(responseData.data)) {
      collections.value = responseData.data
      pagination.currentPage = responseData.current_page || 1
      pagination.lastPage = responseData.last_page || 1
      pagination.total = responseData.total || 0
      pagination.from = responseData.from || 0
      pagination.to = responseData.to || 0
    } else if (Array.isArray(responseData)) {
      collections.value = responseData
    } else {
      collections.value = []
    }
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Imeshindwa kupakia makusanyo.'
    showToastMessage(error.value, 'error')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    pagination.currentPage = page
    loadCollections()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const debouncedSearch = debounce(() => {
  pagination.currentPage = 1
  loadCollections()
}, 500)
watch(searchQuery, () => debouncedSearch())

const clearSearch = () => {
  searchQuery.value = ''
  pagination.currentPage = 1
  loadCollections()
}

// View collection details (could route to a detail page)
const viewCollection = (collection) => {
  router.push(`/collections/${collection.id}`)
  closeActionMenu()
}

// Delete single collection
const confirmDelete = (collection) => {
  collectionToDelete.value = collection
  showDeleteModal.value = true
  closeActionMenu()
}
const closeDeleteModal = () => {
  showDeleteModal.value = false
  collectionToDelete.value = null
}
const deleteCollection = async () => {
  if (!collectionToDelete.value) return
  deleteLoading.value = true
  try {
    await collectionStore.deleteCollection(collectionToDelete.value.id)
    showToastMessage('Makusanyo yamefutwa', 'success')
    closeDeleteModal()
    await loadCollections()
    clearSelection()
  } catch (err) {
    showToastMessage(err.response?.data?.message || 'Imeshindwa kufuta', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Bulk delete
const confirmBulkDelete = () => {
  if (selectedCollections.value.length) showBulkDeleteModal.value = true
}
const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false
}
const bulkDelete = async () => {
  if (!selectedCollections.value.length) return
  deleteLoading.value = true
  try {
    const results = await Promise.allSettled(
      selectedCollections.value.map((id) => collectionStore.deleteCollection(id)),
    )
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value?.success || r.value?.status === 'success'),
    ).length
    showToastMessage(`${successful} makusanyo yamefutwa`, successful ? 'success' : 'error')
    closeBulkDeleteModal()
    await loadCollections()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  } finally {
    deleteLoading.value = false
  }
}

const clearSelection = () => {
  selectedCollections.value = []
  selectAll.value = false
}
const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
  selectedCollections.value = selectAll.value ? collections.value.map((c) => c.id) : []
}
const updateSelectAll = () => {
  selectAll.value = selectedCollections.value.length === collections.value.length
}

const exportCollections = async () => {
  try {
    if (collectionStore.exportCollections) {
      await collectionStore.exportCollections({ search: searchQuery.value })
    } else {
      showToastMessage('Kipengele cha kuweka nje hakipo', 'warning')
    }
  } catch (err) {
    showToastMessage('Hitilafu wakati wa kupakua', 'error')
  }
}

const getCollectionInfo = (id) => {
  const col = collections.value.find((c) => c.id === id)
  if (!col) return ''
  return `${col.machine?.machine_name || ''} - ${formatCurrency(col.amount_collected)} (${formatDate(col.collection_date)})`
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
  loadCollections()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  debouncedSearch.cancel()
})
</script>

<style scoped>
/* All styles remain as provided – no changes */
.collection-list-container {
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
.collection-count {
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
.collections-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.collections-table th {
  text-align: left;
  padding: 1rem;
  background: #f8fafc;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}
.collections-table td {
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
.amount {
  font-weight: 600;
  color: #10b981;
}
.reading-info {
  display: flex;
  align-items: center;
  gap: 4px;
}
.reading-info .prev,
.reading-info .cur {
  font-weight: 500;
}
.reading-info .diff {
  font-size: 0.7rem;
  color: #64748b;
}
.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 500;
}
.type-badge.auto {
  background: #dbeafe;
  color: #1e40af;
}
.type-badge.manual {
  background: #f1f5f9;
  color: #475569;
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
.modal-header,
.modal-footer {
  padding: 1rem 1.5rem;
}
.modal-header {
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-footer {
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
  .collection-list-container {
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
  .collections-table th,
  .collections-table td {
    padding: 0.75rem;
  }
  .checkbox-col {
    width: 30px;
  }
  .reading-info {
    flex-wrap: wrap;
  }
}
</style>
