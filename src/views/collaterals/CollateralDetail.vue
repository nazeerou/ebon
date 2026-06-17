<template>
  <div class="collateral-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia taarifa za dhamana...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="loadCollateral" class="btn-retry">
          <i class="fas fa-redo"></i>
          Jaribu Tena
        </button>
        <router-link to="/collateral" class="btn-secondary">
          <i class="fas fa-arrow-left"></i>
          Rudi Kwenye Orodha
        </router-link>
      </div>
    </div>

    <!-- Collateral Details -->
    <div v-else-if="collateral" class="collateral-detail">
      <!-- Header with Actions -->
      <div class="detail-header">
        <div class="header-left">
          <router-link to="/collateral" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            <span>Rudi</span>
          </router-link>
          <div class="header-title">
            <h1>{{ collateral.name }}</h1>
            <span class="collateral-number">#{{ collateral.collateral_number }}</span>
          </div>
        </div>
        <div class="header-actions">
          <div class="action-dropdown" ref="actionDropdownRef">
            <button class="btn-more" @click.stop="toggleActionMenu">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div v-if="showActionMenu" class="action-menu">
              <router-link :to="`/collateral/${collateral.id}/edit`" class="action-menu-item">
                <i class="fas fa-edit"></i>
                <span>Hariri</span>
              </router-link>

              <button v-if="canVerify" @click="verifyCollateral" class="action-menu-item success">
                <i class="fas fa-check-circle"></i>
                <span>Hakiki</span>
              </button>

              <button v-if="canTake" @click="takeCollateral" class="action-menu-item warning">
                <i class="fas fa-hand-holding-usd"></i>
                <span>Chukua</span>
              </button>

              <button v-if="canRelease" @click="releaseCollateral" class="action-menu-item info">
                <i class="fas fa-undo-alt"></i>
                <span>Toa</span>
              </button>

              <div class="action-menu-divider"></div>

              <button v-if="canDelete" @click="confirmDelete" class="action-menu-item danger">
                <i class="fas fa-trash-alt"></i>
                <span>Futa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Banner -->
      <div class="status-banner" :class="collateral.status">
        <i :class="getStatusIcon"></i>
        <span>Dhamana hii {{ getStatusDescription }}</span>
      </div>

      <!-- Main Content Grid -->
      <div class="detail-grid">
        <!-- Left Column - Images & Basic Info -->
        <div class="left-column">
          <!-- Image Gallery -->
          <div class="image-gallery-card">
            <div class="main-image">
              <img
                :src="collateral.image_url || getPlaceholderImage(collateral.type)"
                :alt="collateral.name"
                @error="handleImageError"
              />
            </div>
            <div v-if="collateral.images && collateral.images.length > 0" class="image-thumbnails">
              <div
                v-for="(image, index) in collateral.images"
                :key="index"
                class="thumbnail"
                :class="{ active: selectedImage === index }"
                @click="selectedImage = index"
              >
                <img :src="image" :alt="`${collateral.name} - ${index + 1}`" />
              </div>
            </div>
          </div>

          <!-- Quick Info Card -->
          <div class="quick-info-card">
            <div class="info-row">
              <span class="info-label">Thamani ya Dhamana:</span>
              <span class="info-value large">{{ formatCurrency(collateral.estimated_value) }}</span>
            </div>
            <div class="info-row" v-if="collateral.verified_value">
              <span class="info-label">Thamani Iliyohakikiwa:</span>
              <span class="info-value success">{{
                formatCurrency(collateral.verified_value)
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Aina ya Dhamana:</span>
              <span class="info-value">{{ getTypeText(collateral.type) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hali:</span>
              <span class="status-badge-small" :class="collateral.status">
                {{ getStatusText(collateral.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right Column - Detailed Info -->
        <div class="right-column">
          <!-- Customer Information Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-user"></i>
              <h3>Mteja Anayemiliki</h3>
              <router-link :to="`/customers/${collateral.customer?.id}`" class="btn-view">
                <i class="fas fa-external-link-alt"></i>
                Angalia Mteja
              </router-link>
            </div>

            <div v-if="collateral.customer" class="customer-details">
              <div class="customer-profile">
                <img
                  :src="collateral.customer.profile_photo || '/default-avatar.png'"
                  :alt="collateral.customer.name"
                  class="customer-avatar"
                />
                <div class="customer-info">
                  <span class="customer-name">
                    {{ collateral.customer.first_name }} {{ collateral.customer.last_name }}
                  </span>
                  <span class="customer-occupation">{{ collateral.customer.occupation }}</span>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-row">
                  <i class="fas fa-phone-alt"></i>
                  <span>{{ collateral.customer.phone }}</span>
                </div>
                <div class="info-row" v-if="collateral.customer.email">
                  <i class="fas fa-envelope"></i>
                  <span>{{ collateral.customer.email }}</span>
                </div>
                <div class="info-row">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ collateral.customer.address }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Collateral Details Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-info-circle"></i>
              <h3>Maelezo ya Dhamana</h3>
            </div>

            <div class="details-grid">
              <div class="detail-row">
                <span class="detail-label">Namba ya Dhamana:</span>
                <span class="detail-value">#{{ collateral.collateral_number }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Jina:</span>
                <span class="detail-value">{{ collateral.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Aina:</span>
                <span class="detail-value">{{ getTypeText(collateral.type) }}</span>
              </div>
              <div class="detail-row" v-if="collateral.registration_number">
                <span class="detail-label">Namba ya Usajili:</span>
                <span class="detail-value">{{ collateral.registration_number }}</span>
              </div>
              <div class="detail-row" v-if="collateral.location">
                <span class="detail-label">Mahali:</span>
                <span class="detail-value">{{ collateral.location }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tarehe ya Kuongezwa:</span>
                <span class="detail-value">{{ formatDate(collateral.created_at) }}</span>
              </div>
              <div class="detail-row" v-if="collateral.updated_at">
                <span class="detail-label">Marejesho ya Mwisho:</span>
                <span class="detail-value">{{ formatDate(collateral.updated_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Description Card -->
          <div class="info-card" v-if="collateral.description">
            <div class="card-header">
              <i class="fas fa-align-left"></i>
              <h3>Maelezo</h3>
            </div>
            <p class="description-text">{{ collateral.description }}</p>
          </div>

          <!-- Verification History Card -->
          <div class="info-card" v-if="collateral.verified_by">
            <div class="card-header">
              <i class="fas fa-check-circle"></i>
              <h3>Historia ya Uhakiki</h3>
            </div>

            <div class="history-item">
              <div class="history-icon verified">
                <i class="fas fa-check"></i>
              </div>
              <div class="history-details">
                <span class="history-title">Imehakikiwa na {{ collateral.verified_by.name }}</span>
                <span class="history-date">{{ formatDateTime(collateral.verified_at) }}</span>
                <p v-if="collateral.verified_notes" class="history-notes">
                  {{ collateral.verified_notes }}
                </p>
                <div v-if="collateral.verified_value" class="verified-value">
                  Thamani iliyohakikiwa:
                  <strong>{{ formatCurrency(collateral.verified_value) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Associated Loans Card -->
          <div class="info-card" v-if="collateral.loans && collateral.loans.length > 0">
            <div class="card-header">
              <i class="fas fa-hand-holding-usd"></i>
              <h3>Mikopo Inayotumia Dhamana Hii</h3>
            </div>

            <div class="loans-list">
              <div v-for="loan in collateral.loans" :key="loan.id" class="loan-item">
                <div class="loan-header">
                  <span class="loan-number">#{{ loan.loan_number }}</span>
                  <span class="loan-status" :class="loan.status">{{
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
                </div>
                <div class="loan-actions">
                  <router-link :to="`/loans/${loan.id}`" class="btn-small">
                    <i class="fas fa-eye"></i>
                    Angalia Mkopo
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Documents Card -->
          <div class="info-card" v-if="collateral.documents && collateral.documents.length > 0">
            <div class="card-header">
              <i class="fas fa-file-alt"></i>
              <h3>Nyaraka</h3>
              <button class="btn-add" @click="uploadDocument">
                <i class="fas fa-upload"></i>
                Pakia
              </button>
            </div>

            <div class="documents-list">
              <div v-for="doc in collateral.documents" :key="doc.id" class="document-item">
                <div class="document-icon">
                  <i :class="getDocumentIcon(doc.type)"></i>
                </div>
                <div class="document-info">
                  <span class="document-name">{{ doc.name }}</span>
                  <span class="document-size">{{ formatFileSize(doc.size) }}</span>
                </div>
                <div class="document-actions">
                  <a :href="doc.url" target="_blank" class="btn-icon-small" title="Angalia">
                    <i class="fas fa-eye"></i>
                  </a>
                  <a :href="doc.url" download class="btn-icon-small" title="Pakua">
                    <i class="fas fa-download"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Trail Card -->
      <div class="audit-card" v-if="collateral.audit_trail && collateral.audit_trail.length > 0">
        <div class="card-header">
          <i class="fas fa-history"></i>
          <h3>Historia ya Mabadiliko</h3>
        </div>

        <div class="timeline">
          <div v-for="(item, index) in collateral.audit_trail" :key="index" class="timeline-item">
            <div class="timeline-icon" :class="item.action">
              <i :class="getAuditIcon(item.action)"></i>
            </div>
            <div class="timeline-content">
              <span class="timeline-title">{{ item.description }}</span>
              <span class="timeline-date">{{ formatDateTime(item.created_at) }}</span>
              <span class="timeline-user">na {{ item.user?.name || 'System' }}</span>
            </div>
          </div>
        </div>
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
        <div class="modal-body">
          <p>Una uhakika unataka kuhakiki dhamana hii?</p>

          <div class="form-group">
            <label for="verified_value">Thamani Iliyohakikiwa (TZS)</label>
            <div class="currency-input">
              <span class="currency-symbol">TZS</span>
              <input
                type="number"
                id="verified_value"
                v-model.number="verifyForm.verified_value"
                class="form-control with-currency"
                :placeholder="collateral?.estimated_value"
                min="0"
                step="1000"
              />
            </div>
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
        <div class="modal-body">
          <p>Una uhakika unataka kuchukua dhamana hii?</p>

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
        <div class="modal-body">
          <p>Una uhakika unataka kutoa dhamana hii?</p>

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
          <p class="warning-text">
            <strong>{{ collateral?.name }}</strong>
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Hatua hii haiwezi kutenguliwa. Dhamana itafutwa kabisa kwenye mfumo pamoja na taarifa
            zake zote.
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatCurrency, formatDate, formatDateTime, formatFileSize } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()

// Dummy collateral data
const dummyCollaterals = [
  {
    id: 1,
    collateral_number: 'COL-2024-0001',
    name: 'Shamba Darajani',
    type: 'land',
    description:
      'Shamba la ekari 2 Darajani lenye miti ya machungwa. Eneo zuri la kilimo na uwezekano wa kuendeleza. Liko karibu na barabara kuu na una mtaro wa maji.',
    estimated_value: 15000000,
    verified_value: 14500000,
    location: 'Darajani, Zanzibar',
    registration_number: 'LAND/2024/00123',
    status: 'active',
    image_url:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    ],
    customer: {
      id: 1,
      first_name: 'Juma',
      last_name: 'Mohamed',
      phone: '0712345678',
      email: 'juma.mohamed@email.com',
      occupation: 'Mfanyabiashara',
      address: 'Dar es Salaam, Kinondoni, Mikocheni',
      profile_photo: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    verified_by: {
      id: 1,
      name: 'Admin User',
    },
    verified_at: '2024-01-20T10:30:00Z',
    verified_notes: 'Thamani imehakikiwa na kupunguzwa kidogo kutokana na hali ya ardhi',
    created_at: '2024-01-15T09:30:00Z',
    updated_at: '2024-01-20T10:30:00Z',
    loans: [
      {
        id: 1,
        loan_number: 'LOAN-2024-0001',
        amount: 3000000,
        balance: 1500000,
        status: 'active',
        start_date: '2024-02-01',
      },
    ],
    documents: [
      {
        id: 1,
        name: 'Hati ya Miliki.pdf',
        type: 'pdf',
        size: 2500000,
        url: '#',
      },
      {
        id: 2,
        name: 'Picha za Shamba.zip',
        type: 'zip',
        size: 15000000,
        url: '#',
      },
    ],
    audit_trail: [
      {
        action: 'CREATE',
        description: 'Dhamana imeongezwa',
        created_at: '2024-01-15T09:30:00Z',
        user: { name: 'John Officer' },
      },
      {
        action: 'UPDATE',
        description: 'Taarifa za dhamana zimehaririwa',
        created_at: '2024-01-16T14:20:00Z',
        user: { name: 'John Officer' },
      },
      {
        action: 'VERIFY',
        description: 'Dhamana imehakikiwa',
        created_at: '2024-01-20T10:30:00Z',
        user: { name: 'Admin User' },
      },
    ],
  },
  {
    id: 2,
    collateral_number: 'COL-2024-0002',
    name: 'Toyota Corolla 2020',
    type: 'vehicle',
    description: 'Gari la kufanyia biashara, hali nzuri. Imetumika kwa muda mfupi tu.',
    estimated_value: 25000000,
    verified_value: null,
    location: 'Dar es Salaam',
    registration_number: 'T123 DAR',
    status: 'pending',
    image_url:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    customer: {
      id: 2,
      first_name: 'Aisha',
      last_name: 'Salim',
      phone: '0723456789',
      email: 'aisha.salim@email.com',
      occupation: 'Mwalimu',
      address: 'Zanzibar, Stone Town',
      profile_photo: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
    verified_by: null,
    verified_at: null,
    created_at: '2024-02-20T14:15:00Z',
  },
]

// State
const collateral = ref(null)
const loading = ref(false)
const error = ref(null)
const showActionMenu = ref(false)
const selectedImage = ref(0)
const showVerifyModal = ref(false)
const showTakeModal = ref(false)
const showReleaseModal = ref(false)
const showDeleteModal = ref(false)
const actionLoading = ref(false)
const deleteLoading = ref(false)
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

// Refs
const actionDropdownRef = ref(null)

// Computed
const getStatusIcon = computed(() => {
  const icons = {
    active: 'fas fa-check-circle',
    taken: 'fas fa-hand-holding-usd',
    released: 'fas fa-undo-alt',
    pending: 'fas fa-clock',
  }
  return icons[collateral.value?.status] || 'fas fa-circle'
})

const getStatusDescription = computed(() => {
  const descriptions = {
    active: 'inatumika kwa mikopo',
    taken: 'imechukuliwa na taasisi',
    released: 'imetolewa kwa mteja',
    pending: 'inasubiri kuhakikiwa',
  }
  return descriptions[collateral.value?.status] || ''
})

const canVerify = computed(() => {
  return collateral.value?.status === 'pending' || !collateral.value?.verified_by
})

const canTake = computed(() => {
  return collateral.value?.status === 'active'
})

const canRelease = computed(() => {
  return collateral.value?.status === 'taken'
})

const canDelete = computed(() => {
  return ['pending', 'released'].includes(collateral.value?.status)
})

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Methods
const loadCollateral = async () => {
  const collateralId = parseInt(route.params.id)

  loading.value = true
  error.value = null

  try {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const found = dummyCollaterals.find((c) => c.id === collateralId)
    if (found) {
      collateral.value = found
      verifyForm.verified_value = found.verified_value || found.estimated_value
    } else {
      error.value = 'Dhamana haikupatikana'
    }
  } catch (err) {
    console.error('Error loading collateral:', err)
    error.value = 'Imeshindwa kupakia taarifa za dhamana. Tafadhali jaribu tena.'
  } finally {
    loading.value = false
  }
}

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

const getStatusText = (status) => {
  const texts = {
    active: 'Inatumika',
    taken: 'Imechukuliwa',
    released: 'Imetolewa',
    pending: 'Inasubiri',
  }
  return texts[status] || status
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
  return statusMap[status] || status
}

const getDocumentIcon = (type) => {
  const icons = {
    pdf: 'fas fa-file-pdf',
    doc: 'fas fa-file-word',
    docx: 'fas fa-file-word',
    xls: 'fas fa-file-excel',
    xlsx: 'fas fa-file-excel',
    jpg: 'fas fa-file-image',
    jpeg: 'fas fa-file-image',
    png: 'fas fa-file-image',
    zip: 'fas fa-file-archive',
  }
  return icons[type] || 'fas fa-file'
}

const getPlaceholderImage = (type) => {
  const placeholders = {
    land: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    vehicle:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    equipment:
      'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    title_deed:
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    other:
      'https://images.unsplash.com/photo-1575408264798-b50b252663e6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  }
  return placeholders[type] || placeholders.other
}

const getAuditIcon = (action) => {
  const icons = {
    CREATE: 'fas fa-plus-circle',
    UPDATE: 'fas fa-edit',
    DELETE: 'fas fa-trash',
    VERIFY: 'fas fa-check-circle',
    TAKE: 'fas fa-hand-holding-usd',
    RELEASE: 'fas fa-undo-alt',
  }
  return icons[action] || 'fas fa-circle'
}

const handleImageError = (e) => {
  e.target.src = getPlaceholderImage(collateral.value?.type)
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

// Document actions
const uploadDocument = () => {
  showToastMessage('Kipengele cha kupakia nyaraka kitaongezwa hivi karibuni', 'info')
}

// Verify modal
const verifyCollateral = () => {
  showVerifyModal.value = true
  closeActionMenu()
}

const closeVerifyModal = () => {
  showVerifyModal.value = false
  verifyForm.notes = ''
}

const confirmVerify = async () => {
  actionLoading.value = true

  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (collateral.value) {
    collateral.value.verified_value = verifyForm.verified_value || collateral.value.estimated_value
    collateral.value.verified_by = { id: 1, name: 'Current User' }
    collateral.value.verified_at = new Date().toISOString()
    collateral.value.verified_notes = verifyForm.notes
    collateral.value.status = 'active'
    showToastMessage('Dhamana imehakikiwa kwa mafanikio', 'success')
  }

  closeVerifyModal()
  actionLoading.value = false
}

// Take modal
const takeCollateral = () => {
  showTakeModal.value = true
  closeActionMenu()
}

const closeTakeModal = () => {
  showTakeModal.value = false
  actionNotes.value = ''
}

const confirmTake = async () => {
  actionLoading.value = true

  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (collateral.value) {
    collateral.value.status = 'taken'
    // Add to audit trail
    if (!collateral.value.audit_trail) collateral.value.audit_trail = []
    collateral.value.audit_trail.unshift({
      action: 'TAKE',
      description: 'Dhamana imechukuliwa',
      created_at: new Date().toISOString(),
      user: { name: 'Current User' },
    })
    showToastMessage('Dhamana imechukuliwa kwa mafanikio', 'success')
  }

  closeTakeModal()
  actionLoading.value = false
}

// Release modal
const releaseCollateral = () => {
  showReleaseModal.value = true
  closeActionMenu()
}

const closeReleaseModal = () => {
  showReleaseModal.value = false
  actionNotes.value = ''
}

const confirmRelease = async () => {
  actionLoading.value = true

  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (collateral.value) {
    collateral.value.status = 'released'
    // Add to audit trail
    if (!collateral.value.audit_trail) collateral.value.audit_trail = []
    collateral.value.audit_trail.unshift({
      action: 'RELEASE',
      description: 'Dhamana imetolewa',
      created_at: new Date().toISOString(),
      user: { name: 'Current User' },
    })
    showToastMessage('Dhamana imetolewa kwa mafanikio', 'success')
  }

  closeReleaseModal()
  actionLoading.value = false
}

// Delete modal
const confirmDelete = () => {
  showDeleteModal.value = true
  closeActionMenu()
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const deleteCollateral = async () => {
  deleteLoading.value = true

  await new Promise((resolve) => setTimeout(resolve, 1000))

  showToastMessage('Dhamana imefutwa kwa mafanikio', 'success')

  setTimeout(() => {
    router.push('/collateral')
  }, 1500)
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
  loadCollateral()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.collateral-detail-container {
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
  flex-wrap: wrap;
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
  gap: 15px;
  flex-wrap: wrap;
}

.header-title h1 {
  font-size: 1.8rem;
  color: #1a2639;
  margin: 0;
}

.collateral-number {
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

.btn-more {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-more:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
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

.action-menu-item.success:hover {
  color: #27ae60;
}

.action-menu-item.success:hover i {
  color: #27ae60;
}

.action-menu-item.warning:hover {
  color: #f39c12;
}

.action-menu-item.warning:hover i {
  color: #f39c12;
}

.action-menu-item.info:hover {
  color: #3498db;
}

.action-menu-item.info:hover i {
  color: #3498db;
}

.action-menu-item.danger:hover {
  color: #e74c3c;
}

.action-menu-item.danger:hover i {
  color: #e74c3c;
}

.action-menu-divider {
  height: 1px;
  background: #eef2f6;
  margin: 5px 0;
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

.status-banner.taken {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-banner.released {
  background: #d1d8e0;
  color: #2c3e50;
  border: 1px solid #bac3cf;
}

.status-banner.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
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

/* Image Gallery Card */
.image-gallery-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.main-image {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  background: #f8fafc;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-thumbnails {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.thumbnail {
  width: 70px;
  height: 70px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.thumbnail:hover {
  transform: translateY(-2px);
}

.thumbnail.active {
  border-color: #3498db;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Quick Info Card */
.quick-info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eef2f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.info-value.large {
  font-size: 1.3rem;
  color: #3498db;
}

.info-value.success {
  color: #27ae60;
}

.status-badge-small {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge-small.active {
  background: #d4edda;
  color: #155724;
}

.status-badge-small.taken {
  background: #f8d7da;
  color: #721c24;
}

.status-badge-small.released {
  background: #d1d8e0;
  color: #2c3e50;
}

.status-badge-small.pending {
  background: #fff3cd;
  color: #856404;
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

.btn-view,
.btn-add {
  padding: 5px 12px;
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

.btn-view:hover,
.btn-add:hover {
  background: #1976d2;
  color: white;
}

/* Customer Details */
.customer-profile {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.customer-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3498db;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.customer-occupation {
  font-size: 0.9rem;
  color: #666;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 0.95rem;
}

.info-row i {
  width: 18px;
  color: #3498db;
}

/* Details Grid */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.detail-label {
  min-width: 140px;
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

/* Description Text */
.description-text {
  margin: 0;
  color: #666;
  line-height: 1.6;
  white-space: pre-line;
}

/* History Item */
.history-item {
  display: flex;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #eef2f6;
}

.history-item:last-child {
  border-bottom: none;
}

.history-icon {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.history-icon.verified {
  background: #d4edda;
  color: #27ae60;
}

.history-details {
  flex: 1;
}

.history-title {
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 3px;
}

.history-date {
  font-size: 0.8rem;
  color: #999;
  display: block;
  margin-bottom: 5px;
}

.history-notes {
  margin: 5px 0 0;
  font-size: 0.9rem;
  color: #666;
  background: #f8fafc;
  padding: 8px;
  border-radius: 5px;
}

.verified-value {
  margin-top: 8px;
  font-size: 0.95rem;
  color: #27ae60;
  padding: 5px 10px;
  background: #e8f5e9;
  border-radius: 5px;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.loan-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.loan-detail .detail-label {
  font-size: 0.75rem;
  color: #999;
}

.loan-detail .detail-value {
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

/* Documents List */
.documents-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.document-icon {
  width: 35px;
  height: 35px;
  border-radius: 6px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.document-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.document-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.document-size {
  font-size: 0.75rem;
  color: #999;
}

.document-actions {
  display: flex;
  gap: 5px;
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
  text-decoration: none;
  transition: all 0.3s;
}

.btn-icon-small:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

/* Audit Card */
.audit-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  margin-top: 25px;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #eef2f6;
}

.timeline-item {
  position: relative;
  padding-bottom: 25px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-icon {
  position: absolute;
  left: -30px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: white;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  z-index: 1;
}

.timeline-icon.CREATE {
  border-color: #27ae60;
  color: #27ae60;
}

.timeline-icon.UPDATE {
  border-color: #f39c12;
  color: #f39c12;
}

.timeline-icon.VERIFY {
  border-color: #3498db;
  color: #3498db;
}

.timeline-icon.TAKE {
  border-color: #e74c3c;
  color: #e74c3c;
}

.timeline-icon.RELEASE {
  border-color: #9b59b6;
  color: #9b59b6;
}

.timeline-content {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 15px;
}

.timeline-title {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.timeline-date {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 3px;
}

.timeline-user {
  display: block;
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
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

.currency-input {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-weight: 500;
  z-index: 1;
}

.form-control {
  width: 100%;
  padding: 12px 15px;
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

.form-control.with-currency {
  padding-left: 60px;
}

.input-hint {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 4px;
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

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-success,
.btn-warning,
.btn-info,
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

.btn-info {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-info:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
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
.btn-info:disabled,
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

.toast-notification i {
  font-size: 1.2rem;
}

.toast-notification.success i {
  color: #27ae60;
}

.toast-notification.error i {
  color: #e74c3c;
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
  .collateral-detail-container {
    padding: 15px;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .header-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-title h1 {
    font-size: 1.5rem;
  }

  .main-image {
    height: 200px;
  }

  .loan-details {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-success,
  .btn-warning,
  .btn-info,
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
