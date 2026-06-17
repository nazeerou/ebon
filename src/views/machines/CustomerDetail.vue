<template>
  <div class="customer-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia taarifa za mteja...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="loadCustomer" class="btn-retry">
          <i class="fas fa-redo"></i>
          Jaribu Tena
        </button>
        <router-link to="/customers" class="btn-secondary">
          <i class="fas fa-arrow-left"></i>
          Rudi Kwenye Orodha
        </router-link>
      </div>
    </div>

    <!-- Customer Details -->
    <div v-else-if="customer" class="customer-detail">
      <!-- Header with Actions -->
      <div class="detail-header">
        <div class="header-left">
          <router-link to="/customers" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            <span>Rudi</span>
          </router-link>
          <div class="header-title">
            <h1>{{ customer.first_name }} {{ customer.last_name }}</h1>
            <span class="customer-number">#{{ customer.customer_number }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-message" @click="sendMessage">
            <i class="fas fa-envelope"></i>
            <span class="action-text">Tuma Ujumbe</span>
          </button>
          <button class="btn-call" @click="callCustomer">
            <i class="fas fa-phone-alt"></i>
            <span class="action-text">Piga Simu</span>
          </button>
          <div class="action-dropdown" ref="actionDropdownRef">
            <button class="btn-more" @click.stop="toggleActionMenu">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div v-if="showActionMenu" class="action-menu">
              <router-link :to="`/customers/${customer.id}/edit`" class="action-menu-item">
                <i class="fas fa-edit"></i>
                <span>Hariri Taarifa</span>
              </router-link>
              <button
                @click="toggleStatus"
                class="action-menu-item"
                :class="{ 'text-danger': customer.status === 'active' }"
              >
                <i :class="customer.status === 'active' ? 'fas fa-ban' : 'fas fa-check-circle'"></i>
                <span>{{ customer.status === 'active' ? 'Zima Mteja' : 'Washa Mteja' }}</span>
              </button>
              <button @click="confirmDelete" class="action-menu-item text-danger">
                <i class="fas fa-trash-alt"></i>
                <span>Futa Mteja</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Banner -->
      <div class="status-banner" :class="customer.status">
        <i :class="getStatusIcon"></i>
        <span>Mteja huyu ni {{ getStatusText(customer.status) }}</span>
      </div>

      <!-- Main Content Grid -->
      <div class="detail-grid">
        <!-- Left Column - Profile & Personal Info -->
        <div class="left-column">
          <!-- Profile Card -->
          <div class="profile-card">
            <div class="profile-header">
              <div class="profile-avatar-wrapper">
                <img
                  :src="getAvatarUrl()"
                  :alt="customer.first_name"
                  class="profile-avatar"
                  @error="handleImageError"
                />
                <span class="status-indicator" :class="customer.status"></span>
              </div>
              <div class="profile-name">
                <h2>{{ customer.first_name }} {{ customer.last_name }}</h2>
                <p>{{ customer.occupation || 'Mteja' }}</p>
              </div>
            </div>

            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">{{ customer.loans?.length || 0 }}</span>
                <span class="stat-label">Mikopo</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">{{ formatCurrency(customer.total_loans || 0) }}</span>
                <span class="stat-label">Jumla</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">{{ customer.collaterals?.length || 0 }}</span>
                <span class="stat-label">Dhamana</span>
              </div>
            </div>
          </div>

          <!-- Personal Information Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-user"></i>
              <h3>Taarifa za Kibinafsi</h3>
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Jina Kamili:</span>
                <span class="info-value">{{ customer.first_name }} {{ customer.last_name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Namba ya Kitambulisho:</span>
                <span class="info-value">{{ customer.id_number || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Aina ya Kitambulisho:</span>
                <span class="info-value">{{ getIdTypeText(customer.id_type) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tarehe ya Kujiunga:</span>
                <span class="info-value">{{ formatDate(customer.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Contact Information Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-address-book"></i>
              <h3>Mawasiliano</h3>
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">
                  <i class="fas fa-phone-alt"></i>
                  Simu:
                </span>
                <span class="info-value">{{ customer.phone || '-' }}</span>
                <button
                  v-if="customer.phone"
                  class="action-icon"
                  @click="callCustomer"
                  title="Piga simu"
                >
                  <i class="fas fa-phone"></i>
                </button>
              </div>
              <div class="info-row" v-if="customer.email">
                <span class="info-label">
                  <i class="fas fa-envelope"></i>
                  Barua Pepe:
                </span>
                <span class="info-value">{{ customer.email }}</span>
                <button class="action-icon" @click="sendEmail" title="Tuma barua pepe">
                  <i class="fas fa-paper-plane"></i>
                </button>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <i class="fas fa-map-marker-alt"></i>
                  Anwani:
                </span>
                <span class="info-value">{{ customer.address || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Employment & Loans -->
        <div class="right-column">
          <!-- Employment Card -->
          <div class="info-card" v-if="customer.occupation || customer.monthly_income">
            <div class="card-header">
              <i class="fas fa-briefcase"></i>
              <h3>Taarifa za Kazi</h3>
            </div>
            <div class="info-grid">
              <div class="info-row" v-if="customer.occupation">
                <span class="info-label">Kazi:</span>
                <span class="info-value">{{ customer.occupation }}</span>
              </div>
              <div class="info-row" v-if="customer.monthly_income">
                <span class="info-label">Kipato cha Mwezi:</span>
                <span class="info-value highlight">{{
                  formatCurrency(parseFloat(customer.monthly_income))
                }}</span>
              </div>
              <div class="info-row" v-if="customer.employer">
                <span class="info-label">Mwajiri:</span>
                <span class="info-value">{{ customer.employer }}</span>
              </div>
              <div
                class="info-row"
                v-if="customer.employment_years && customer.employment_years > 0"
              >
                <span class="info-label">Miaka ya Uzoefu:</span>
                <span class="info-value">{{ customer.employment_years }} miaka</span>
              </div>
            </div>
          </div>

          <!-- Loans Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-hand-holding-usd"></i>
              <h3>Mikopo yake</h3>
            </div>

            <div v-if="customer.loans && customer.loans.length > 0" class="loans-list">
              <div v-for="loan in customer.loans" :key="loan.id" class="loan-item">
                <div class="loan-header">
                  <span class="loan-number">#{{ loan.loan_number }}</span>
                  <span class="loan-status" :class="loan.status.toLowerCase()">{{
                    getLoanStatusText(loan.status)
                  }}</span>
                </div>
                <div class="loan-details">
                  <div class="loan-detail">
                    <span class="detail-label">Kiasi:</span>
                    <span class="detail-value">{{ formatCurrency(loan.amount) }}</span>
                  </div>
                  <div class="loan-detail">
                    <span class="detail-label">Imebaki:</span>
                    <span class="detail-value">{{ formatCurrency(loan.balance) }}</span>
                  </div>
                  <div class="loan-detail">
                    <span class="detail-label">Tarehe ya Kuanza:</span>
                    <span class="detail-value">{{ formatDate(loan.start_date) }}</span>
                  </div>
                  <div class="loan-detail">
                    <span class="detail-label">Tarehe ya Kumaliza:</span>
                    <span class="detail-value">{{ formatDate(loan.end_date) }}</span>
                  </div>
                </div>
                <div class="loan-actions">
                  <router-link :to="`/loans/${loan.id}`" class="btn-small">
                    <i class="fas fa-eye"></i>
                    Angalia
                  </router-link>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <i class="fas fa-hand-holding-usd"></i>
              <p>Hajawahi kupata mkopo</p>
              <!-- <router-link :to="`/loans/create`" class="btn-primary btn-small">
                <i class="fas fa-plus"></i>
                Toa Mkopo
              </router-link> -->
            </div>
          </div>

          <!-- Collateral Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-gem"></i>
              <h3>Dhamana</h3>
              <!-- <button @click="showAddCollateral = true" class="btn-add">
                <i class="fas fa-plus"></i>
                <span>Ongeza Dhamana</span>
              </button> -->
            </div>

            <div
              v-if="customer.collaterals && customer.collaterals.length > 0"
              class="collaterals-list"
            >
              <div
                v-for="collateral in customer.collaterals"
                :key="collateral.id"
                class="collateral-item"
              >
                <div class="collateral-icon">
                  <i :class="getCollateralIcon(collateral.type)"></i>
                </div>
                <div class="collateral-info">
                  <span class="collateral-name">{{ collateral.name }}</span>
                  <span class="collateral-value">{{
                    formatCurrency(collateral.estimated_value)
                  }}</span>
                  <span class="collateral-status" :class="collateral.status">{{
                    collateral.status
                  }}</span>
                </div>
                <button @click="viewCollateral(collateral)" class="btn-icon-small" title="Angalia">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <i class="fas fa-gem"></i>
              <p>Hakuna dhamana</p>
              <!-- <button @click="showAddCollateral = true" class="btn-primary btn-small">
                <i class="fas fa-plus"></i>
                Ongeza Dhamana
              </button> -->
            </div>
          </div>
        </div>
      </div>

      <!-- Notes Section -->
      <div v-if="customer.notes" class="notes-card">
        <div class="card-header">
          <i class="fas fa-sticky-note"></i>
          <h3>Maelezo ya Ziada</h3>
        </div>
        <p class="notes-content">{{ customer.notes }}</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Futa Mteja</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kumfuta mteja huyu?</p>
          <p class="warning-text">
            <strong>{{ customer?.first_name }} {{ customer?.last_name }}</strong>
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Hatua hii haiwezi kutenguliwa. Mteja atafutwa kabisa kwenye mfumo pamoja na taarifa zake
            zote.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">
            <i class="fas fa-times"></i>
            Ghairi
          </button>
          <button @click="deleteCustomer" class="btn-danger" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner-small"></span>
            <span v-else>
              <i class="fas fa-trash-alt"></i>
              Futa Mteja
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Add Collateral Modal -->
    <div v-if="showAddCollateral" class="modal-overlay" @click="showAddCollateral = false">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>Ongeza Dhamana</h3>
          <button class="close-btn" @click="showAddCollateral = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="text-center text-muted">
            <i class="fas fa-info-circle"></i>
            Kipengele hiki kitaongezwa hivi karibuni
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showAddCollateral = false" class="btn-primary">Sawa</button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { formatCurrency, formatDate } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()

// State
const customer = ref(null)
const loading = ref(false)
const error = ref(null)
const showActionMenu = ref(false)
const showDeleteModal = ref(false)
const showAddCollateral = ref(false)
const deleteLoading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Refs
const actionDropdownRef = ref(null)
const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
// const baseUrl = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// Computed
const getStatusIcon = computed(() => {
  const icons = {
    active: 'fas fa-check-circle',
    inactive: 'fas fa-clock',
    blacklisted: 'fas fa-ban',
  }
  return icons[customer.value?.status] || 'fas fa-user'
})

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Helper methods
const getIdTypeText = (idType) => {
  const types = {
    NIDA: 'NIDA',
    ZANZIBAR_ID: 'Zanzibar ID',
    PASSPORT: 'Passport',
    DRIVERS: 'Leseni ya Udereva',
  }
  return types[idType] || idType || 'NIDA'
}

// Methods
const loadCustomer = async () => {
  const customerId = route.params.id

  loading.value = true
  error.value = null

  try {
    const response = await axios.get(`${baseUrl}/customers/${customerId}`)

    console.log('Customer API Response:', response.data)

    // Handle different response structures
    let customerData = null

    if (response.data.data && response.data.data.customer) {
      customerData = response.data.data.customer
    } else if (response.data.data && response.data.data.id) {
      customerData = response.data.data
    } else if (response.data.customer) {
      customerData = response.data.customer
    } else if (response.data.id) {
      customerData = response.data
    } else if (response.data.success && response.data.data) {
      customerData = response.data.data
    }

    if (customerData) {
      customer.value = customerData
      console.log('Customer loaded:', customer.value)
    } else {
      error.value = response.data.message || 'Mteja hakupatikana'
    }
  } catch (err) {
    console.error('Error loading customer:', err)
    if (err.response?.status === 404) {
      error.value = 'Mteja hakupatikana'
    } else if (err.response?.status === 401) {
      error.value = 'Hauna ruhusa ya kuona taarifa hizi'
    } else {
      error.value =
        err.response?.data?.message || 'Imeshindwa kupakia taarifa za mteja. Tafadhali jaribu tena.'
    }
  } finally {
    loading.value = false
  }
}

const getAvatarUrl = () => {
  // Use profile_photo_url if available, otherwise profile_photo
  const photoUrl = customer.value?.profile_photo_url || customer.value?.profile_photo

  if (photoUrl) {
    if (photoUrl.startsWith('http')) {
      return photoUrl
    }
    return `${baseUrl}/storage/${photoUrl}`
  }

  return `https://ui-avatars.com/api/?name=${customer.value?.first_name}+${customer.value?.last_name}&background=3498db&color=fff&length=2`
}

const handleImageError = (event) => {
  event.target.src = `https://ui-avatars.com/api/?name=${customer.value?.first_name}+${customer.value?.last_name}&background=3498db&color=fff&length=2`
}

const getStatusText = (status) => {
  const statusMap = {
    active: 'anayefanya kazi',
    inactive: 'asiyefanya kazi',
    blacklisted: 'aliyepigwa marufuku',
  }
  return statusMap[status] || status
}

const getLoanStatusText = (status) => {
  const statusMap = {
    pending: 'Inasubiri',
    approved: 'Imeidhinishwa',
    active: 'Inaendelea',
    paid: 'Imelipwa',
    defaulted: 'Imechelewa',
    rejected: 'Imekataliwa',
  }
  return statusMap[status.toLowerCase()] || status
}

const getCollateralIcon = (type) => {
  const icons = {
    land: 'fas fa-tree',
    vehicle: 'fas fa-car',
    equipment: 'fas fa-tools',
    title_deed: 'fas fa-file-alt',
    other: 'fas fa-box',
  }
  return icons[type] || 'fas fa-gem'
}

// Action Menu
const toggleActionMenu = () => {
  showActionMenu.value = !showActionMenu.value
}

const closeActionMenu = () => {
  showActionMenu.value = false
}

// Handle click outside
const handleClickOutside = (event) => {
  if (actionDropdownRef.value && !actionDropdownRef.value.contains(event.target)) {
    closeActionMenu()
  }
}

// Actions
const sendMessage = () => {
  showToastMessage('Kipengele cha kutuma ujumbe kitaongezwa hivi karibuni', 'info')
  closeActionMenu()
}

const callCustomer = () => {
  if (customer.value?.phone) {
    window.location.href = `tel:${customer.value.phone}`
  }
}

const sendEmail = () => {
  if (customer.value?.email) {
    window.location.href = `mailto:${customer.value.email}`
  }
}

const toggleStatus = async () => {
  const newStatus = customer.value.status === 'active' ? 'inactive' : 'active'
  const action = customer.value.status === 'active' ? 'kumzuia' : 'kumwezesha'

  if (confirm(`Una uhakika unataka ${action} mteja huyu?`)) {
    try {
      const response = await axios.put(`${baseUrl}/customers/${customer.value.id}/status`, {
        status: newStatus,
      })

      if (response.data.success || response.data.status === 'success') {
        customer.value.status = newStatus
        showToastMessage(`Mteja ame${action}wa kwa mafanikio`, 'success')
      }
    } catch (err) {
      showToastMessage('Imeshindwa kubadilisha hali ya mteja', 'error')
    }
    closeActionMenu()
  }
}

// Delete
const confirmDelete = () => {
  showDeleteModal.value = true
  closeActionMenu()
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const deleteCustomer = async () => {
  deleteLoading.value = true

  try {
    const response = await axios.delete(`${baseUrl}/customers/${customer.value.id}`)

    if (response.data.success || response.data.status === 'success') {
      showToastMessage('Mteja amefutwa kwa mafanikio', 'success')

      setTimeout(() => {
        router.push('/customers')
      }, 1500)
    } else {
      showToastMessage(response.data.message || 'Imeshindwa kufuta mteja', 'error')
    }
  } catch (err) {
    showToastMessage('Imeshindwa kufuta mteja. Tafadhali jaribu tena.', 'error')
  } finally {
    deleteLoading.value = false
    closeDeleteModal()
  }
}

// View related items
const viewCollateral = (collateral) => {
  showToastMessage(`Taarifa za ${collateral.name}`, 'info')
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
  loadCustomer()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Add spinner-small for delete button */
.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* All other styles remain the same as in your original component */
/* Include all the CSS from your original component here */
.customer-detail-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.customer-detail-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
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
  margin-bottom: 25px;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
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

/* Customer Detail */
.customer-detail {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  background: white;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s;
}

.back-btn:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.header-title h1 {
  font-size: 1.8rem;
  color: #1a2639;
  margin: 0;
}

.customer-number {
  font-size: 1rem;
  color: #999;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-message,
.btn-call,
.btn-more {
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  border: none;
}

.btn-message {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-message:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.btn-call {
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
}

.btn-call:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
}

.btn-more {
  background: white;
  color: #666;
  border: 1px solid #eef2f6;
}

.btn-more:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.action-text {
  display: inline;
}

@media (max-width: 768px) {
  .action-text {
    display: none;
  }

  .btn-message,
  .btn-call {
    padding: 10px;
  }
}

/* Action Dropdown */
.action-dropdown {
  position: relative;
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
  margin-top: 5px;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease;
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

.action-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  color: #333;
  text-decoration: none;
  transition: background 0.3s;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: left;
}

.action-menu-item:hover {
  background: #f8fafc;
}

.action-menu-item i {
  width: 18px;
  color: #666;
}

.action-menu-item.text-danger {
  color: #e74c3c;
}

.action-menu-item.text-danger i {
  color: #e74c3c;
}

/* Status Banner */
.status-banner {
  padding: 15px 20px;
  border-radius: 10px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
}

.status-banner.active {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-banner.inactive {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.status-banner.blacklisted {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-banner i {
  font-size: 1.2rem;
}

/* Main Grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 25px;
  margin-bottom: 25px;
}

@media (max-width: 992px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

/* Left Column */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Right Column */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Profile Card */
.profile-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.profile-avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3498db;
}

.status-indicator {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.active {
  background: #27ae60;
}

.status-indicator.inactive {
  background: #f39c12;
}

.status-indicator.blacklisted {
  background: #e74c3c;
}

.profile-name h2 {
  margin: 0 0 5px;
  color: #333;
  font-size: 1.3rem;
}

.profile-name p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #eef2f6;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a2639;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #eef2f6;
}

/* Info Card */
.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.card-header i {
  font-size: 1.2rem;
  color: #3498db;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  flex: 1;
}

.btn-add {
  padding: 6px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-add:hover {
  background: #1976d2;
  color: white;
}

/* Info Grid */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
}

.info-label {
  min-width: 120px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.info-label i {
  width: 16px;
  color: #3498db;
}

.info-value {
  color: #333;
  flex: 1;
}

.info-value.highlight {
  color: #27ae60;
  font-weight: 600;
}

.action-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.action-icon:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

/* Loans List */
.loans-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.loan-item {
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.loan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.loan-number {
  font-weight: 600;
  color: #333;
}

.loan-status {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.loan-status.active {
  background: #d4edda;
  color: #155724;
}

.loan-status.paid {
  background: #cce5ff;
  color: #004085;
}

.loan-status.defaulted {
  background: #f8d7da;
  color: #721c24;
}

.loan-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.loan-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.75rem;
  color: #999;
}

.detail-value {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.loan-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-small {
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  transition: all 0.3s;
}

.btn-small:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.btn-small.btn-success:hover {
  color: #27ae60;
  border-color: #27ae60;
}

/* Guarantors List */
.guarantors-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guarantor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.guarantor-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.guarantor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guarantor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.guarantor-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.guarantor-relation {
  font-size: 0.8rem;
  color: #3498db;
}

.guarantor-phone {
  font-size: 0.8rem;
  color: #666;
}

/* Collaterals List */
.collaterals-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collateral-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.collateral-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.collateral-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collateral-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.collateral-value {
  font-size: 0.85rem;
  color: #27ae60;
  font-weight: 500;
}

.collateral-status {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
  width: fit-content;
}

.collateral-status.active {
  background: #d4edda;
  color: #155724;
}

.btn-icon-small {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-icon-small:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

/* Empty State Small */
.empty-state-small {
  text-align: center;
  padding: 30px 20px;
  color: #999;
}

.empty-state-small i {
  font-size: 2rem;
  color: #cbd5e0;
  margin-bottom: 10px;
}

.empty-state-small p {
  margin-bottom: 15px;
}

/* Notes Card */
.notes-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  margin-top: 25px;
}

.notes-content {
  margin: 0;
  color: #666;
  line-height: 1.6;
  white-space: pre-line;
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

.modal-content {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-content.large-modal {
  max-width: 800px;
}

.delete-modal .modal-header {
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

.modal-icon.warning {
  background: #fee;
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

.warning-text {
  font-size: 1.1rem;
  color: #333;
  margin: 15px 0;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.warning-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f39c12;
  font-size: 0.9rem;
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border-radius: 8px;
}

.text-muted {
  color: #999;
}

.text-center {
  text-align: center;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary {
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
}

.btn-danger {
  padding: 10px 20px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
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
  .customer-detail-container {
    padding: 15px;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-stats {
    flex-wrap: wrap;
  }

  .loan-details {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-danger,
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
