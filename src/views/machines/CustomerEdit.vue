<template>
  <div class="customer-edit-container">
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

    <!-- Edit Form -->
    <div v-else class="customer-edit">
      <!-- Header -->
      <div class="edit-header">
        <div class="header-left">
          <router-link :to="`/customers/${customerId}`" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            <span>Rudi Kwa Taarifa</span>
          </router-link>
          <h1>Hariri Mteja: {{ form.first_name }} {{ form.last_name }}</h1>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-secondary" @click="cancelEdit">
            <i class="fas fa-times"></i>
            <span>Ghairi</span>
          </button>
          <button type="submit" form="editForm" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="spinner-small"></span>
            <span v-else>
              <i class="fas fa-save"></i>
              Hifadhi Mabadiliko
            </span>
          </button>
        </div>
      </div>

      <!-- Error Summary -->
      <div v-if="Object.keys(errors).length" class="error-summary">
        <i class="fas fa-exclamation-circle"></i>
        <div class="error-content">
          <h4>Tafadhali sahihisha makosa yafuatayo:</h4>
          <ul>
            <li v-for="(error, field) in errors" :key="field">
              {{ Array.isArray(error) ? error[0] : error }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Edit Form -->
      <form id="editForm" @submit.prevent="submitForm" class="edit-form">
        <!-- Progress Steps -->
        <div class="form-progress">
          <div
            class="progress-step"
            :class="{ active: currentStep >= 1, completed: currentStep > 1 }"
          >
            <div class="step-indicator">
              <span v-if="currentStep > 1" class="step-check">✓</span>
              <span v-else class="step-number">1</span>
            </div>
            <span class="step-label">Taarifa za Msingi</span>
          </div>
          <div class="progress-line" :class="{ active: currentStep >= 2 }"></div>

          <div
            class="progress-step"
            :class="{ active: currentStep >= 2, completed: currentStep > 2 }"
          >
            <div class="step-indicator">
              <span v-if="currentStep > 2" class="step-check">✓</span>
              <span v-else class="step-number">2</span>
            </div>
            <span class="step-label">Taarifa za Kazi</span>
          </div>
          <div class="progress-line" :class="{ active: currentStep >= 3 }"></div>

          <div class="progress-step" :class="{ active: currentStep >= 3 }">
            <div class="step-indicator">
              <span class="step-number">3</span>
            </div>
            <span class="step-label">Picha na Nyaraka</span>
          </div>
        </div>

        <!-- Step 1: Basic Information -->
        <div v-show="currentStep === 1" class="form-step">
          <div class="step-header">
            <div class="step-icon">
              <i class="fas fa-user"></i>
            </div>
            <div class="step-info">
              <h3>Taarifa za Msingi</h3>
              <p>Hariri taarifa za msingi za mteja kama jina, anwani na mawasiliano</p>
            </div>
          </div>

          <div class="form-grid">
            <!-- Customer Number (read-only) -->
            <div class="form-group">
              <label for="customer_number">
                <i class="fas fa-hashtag"></i>
                Namba ya Mteja
              </label>
              <input
                type="text"
                id="customer_number"
                :value="form.customer_number"
                class="form-control"
                readonly
                disabled
              />
            </div>

            <!-- First Name -->
            <div class="form-group required">
              <label for="first_name">
                <i class="fas fa-user"></i>
                Jina la Kwanza
              </label>
              <input
                type="text"
                id="first_name"
                v-model="form.first_name"
                class="form-control"
                :class="{ 'is-invalid': errors.first_name }"
                placeholder="Mfano: Juma"
                required
              />
              <span v-if="errors.first_name" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.first_name[0] }}
              </span>
            </div>

            <!-- Last Name -->
            <div class="form-group required">
              <label for="last_name">
                <i class="fas fa-user"></i>
                Jina la Mwisho
              </label>
              <input
                type="text"
                id="last_name"
                v-model="form.last_name"
                class="form-control"
                :class="{ 'is-invalid': errors.last_name }"
                placeholder="Mfano: Mohamed"
                required
              />
              <span v-if="errors.last_name" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.last_name[0] }}
              </span>
            </div>

            <!-- Phone -->
            <div class="form-group required">
              <label for="phone">
                <i class="fas fa-phone-alt"></i>
                Namba ya Simu
              </label>
              <input
                type="tel"
                id="phone"
                v-model="form.phone"
                class="form-control"
                :class="{ 'is-invalid': errors.phone }"
                placeholder="Mfano: 0712345678"
                required
              />
              <span class="input-hint">Weka namba kuanzia 0 au +255</span>
              <span v-if="errors.phone" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.phone[0] }}
              </span>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email">
                <i class="fas fa-envelope"></i>
                Barua Pepe
              </label>
              <input
                type="email"
                id="email"
                v-model="form.email"
                class="form-control"
                :class="{ 'is-invalid': errors.email }"
                placeholder="Mfano: juma@email.com"
              />
              <span v-if="errors.email" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.email[0] }}
              </span>
            </div>

            <!-- ID Number -->
            <div class="form-group required">
              <label for="id_number">
                <i class="fas fa-id-card"></i>
                Namba ya Kitambulisho
              </label>
              <input
                type="text"
                id="id_number"
                v-model="form.id_number"
                class="form-control"
                :class="{ 'is-invalid': errors.id_number }"
                placeholder="Mfano: 1980010112345678"
                required
              />
              <span class="input-hint">Namba ya NIDA au Zanzibar ID</span>
              <span v-if="errors.id_number" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.id_number[0] }}
              </span>
            </div>

            <!-- ID Type -->
            <div class="form-group required">
              <label for="id_type">
                <i class="fas fa-id-card"></i>
                Aina ya Kitambulisho
              </label>
              <select
                id="id_type"
                v-model="form.id_type"
                class="form-control"
                :class="{ 'is-invalid': errors.id_type }"
                required
              >
                <option value="NIDA">NIDA</option>
                <option value="ZANZIBAR_ID">Zanzibar ID</option>
                <option value="VOTER_ID">Kitambulisho cha Kura</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVERS">Leseni ya Udereva</option>
              </select>
              <span v-if="errors.id_type" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.id_type[0] }}
              </span>
            </div>

            <!-- Address -->
            <div class="form-group full-width required">
              <label for="address">
                <i class="fas fa-map-marker-alt"></i>
                Anwani
              </label>
              <textarea
                id="address"
                v-model="form.address"
                class="form-control"
                :class="{ 'is-invalid': errors.address }"
                rows="3"
                placeholder="Mfano: Dar es Salaam, Kinondoni, Mikocheni"
                required
              ></textarea>
              <span v-if="errors.address" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.address[0] }}
              </span>
            </div>
          </div>
        </div>

        <!-- Step 2: Employment Information -->
        <div v-show="currentStep === 2" class="form-step">
          <div class="step-header">
            <div class="step-icon">
              <i class="fas fa-briefcase"></i>
            </div>
            <div class="step-info">
              <h3>Taarifa za Kazi</h3>
              <p>Hariri taarifa za kazi na kipato cha mteja</p>
            </div>
          </div>

          <div class="form-grid">
            <!-- Occupation -->
            <div class="form-group required">
              <label for="occupation">
                <i class="fas fa-briefcase"></i>
                Kazi
              </label>
              <input
                type="text"
                id="occupation"
                v-model="form.occupation"
                class="form-control"
                :class="{ 'is-invalid': errors.occupation }"
                placeholder="Mfano: Mwalimu, Mfanyabiashara, Mkulima"
                required
              />
              <span v-if="errors.occupation" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.occupation[0] }}
              </span>
            </div>

            <!-- Monthly Income -->
            <div class="form-group required">
              <label for="monthly_income">
                <i class="fas fa-coins"></i>
                Kipato cha Mwezi (TZS)
              </label>
              <div class="currency-input">
                <span class="currency-symbol">TZS</span>
                <input
                  type="number"
                  id="monthly_income"
                  v-model="form.monthly_income"
                  class="form-control with-currency"
                  :class="{ 'is-invalid': errors.monthly_income }"
                  placeholder="500000"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <span v-if="errors.monthly_income" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.monthly_income[0] }}
              </span>
            </div>

            <!-- Employer -->
            <div class="form-group">
              <label for="employer">
                <i class="fas fa-building"></i>
                Jina la Mwajiri
              </label>
              <input
                type="text"
                id="employer"
                v-model="form.employer"
                class="form-control"
                :class="{ 'is-invalid': errors.employer }"
                placeholder="Mfano: Shule ya Sekondari, Kampuni XYZ"
              />
              <span v-if="errors.employer" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.employer[0] }}
              </span>
            </div>

            <!-- Employment Years -->
            <div class="form-group">
              <label for="employment_years">
                <i class="fas fa-calendar-alt"></i>
                Miaka ya Uzoefu Kazini
              </label>
              <input
                type="number"
                id="employment_years"
                v-model="form.employment_years"
                class="form-control"
                :class="{ 'is-invalid': errors.employment_years }"
                placeholder="Mfano: 5"
                min="0"
                step="1"
              />
              <span v-if="errors.employment_years" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ errors.employment_years[0] }}
              </span>
            </div>
          </div>
        </div>

        <!-- Step 3: Photos and Documents -->
        <div v-show="currentStep === 3" class="form-step">
          <div class="step-header">
            <div class="step-icon">
              <i class="fas fa-camera"></i>
            </div>
            <div class="step-info">
              <h3>Picha na Nyaraka</h3>
              <p>Badilisha picha ya mteja na nyaraka muhimu</p>
            </div>
          </div>

          <div class="photo-upload-section">
            <!-- Profile Photo Upload -->
            <div class="photo-upload-card">
              <div class="photo-card-header">
                <i class="fas fa-camera-retro"></i>
                <h4>Picha ya Mteja</h4>
                <span class="optional-badge">Si lazima</span>
              </div>

              <div class="photo-preview-container">
                <div v-if="form.profile_photo_preview" class="photo-preview">
                  <img :src="form.profile_photo_preview" alt="Profile Preview" />
                  <button
                    type="button"
                    class="btn-remove-photo"
                    @click="removePhoto"
                    title="Ondoa picha"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-else-if="currentPhotoUrl" class="photo-preview">
                  <img :src="currentPhotoUrl" alt="Current Profile" />
                  <button
                    type="button"
                    class="btn-remove-photo"
                    @click="removeCurrentPhoto"
                    title="Ondoa picha"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-else class="photo-placeholder">
                  <i class="fas fa-user-circle"></i>
                  <span>Hakuna picha</span>
                </div>
              </div>

              <div class="photo-actions">
                <div class="photo-action-btn" @click="triggerFileInput">
                  <i class="fas fa-upload"></i>
                  <span>Badilisha Picha</span>
                </div>
                <div class="photo-action-btn camera-btn" @click="openCamera">
                  <i class="fas fa-camera"></i>
                  <span>Piga Picha Mpya</span>
                </div>
              </div>

              <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept="image/*"
                style="display: none"
              />

              <div class="photo-hint">
                <i class="fas fa-info-circle"></i>
                <span>Aina zinazokubalika: JPG, PNG, GIF. Ukubwa: hadi 2MB</span>
              </div>
            </div>

            <!-- Status Change Card -->
            <div class="status-card">
              <div class="photo-card-header">
                <i class="fas fa-flag"></i>
                <h4>Hali ya Mteja</h4>
              </div>

              <div class="status-options">
                <label class="status-option">
                  <input type="radio" v-model="form.status" value="active" />
                  <span class="status-badge-select active">Anafanya kazi</span>
                </label>
                <label class="status-option">
                  <input type="radio" v-model="form.status" value="inactive" />
                  <span class="status-badge-select inactive">Hafanyi kazi</span>
                </label>
                <label class="status-option">
                  <input type="radio" v-model="form.status" value="blacklisted" />
                  <span class="status-badge-select blacklisted">Amepigwa marufuku</span>
                </label>
              </div>

              <div v-if="form.status === 'blacklisted'" class="status-reason">
                <label for="blacklist_reason">
                  <i class="fas fa-exclamation-triangle"></i>
                  Sababu ya kumpiga marufuku
                </label>
                <textarea
                  id="blacklist_reason"
                  v-model="form.blacklist_reason"
                  class="form-control"
                  rows="2"
                  placeholder="Weka sababu ya kumpiga marufuku mteja huyu..."
                ></textarea>
              </div>
            </div>

            <!-- Notes Card -->
            <div class="notes-card">
              <div class="photo-card-header">
                <i class="fas fa-sticky-note"></i>
                <h4>Maelezo ya Ziada</h4>
              </div>

              <textarea
                v-model="form.notes"
                class="form-control"
                rows="4"
                placeholder="Weka maelezo yoyote ya ziada kuhusu mteja..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="form-navigation">
          <button type="button" v-if="currentStep > 1" @click="prevStep" class="btn-secondary">
            <i class="fas fa-arrow-left"></i>
            Nyuma
          </button>

          <button
            type="button"
            v-if="currentStep < 3"
            @click="nextStep"
            class="btn-primary"
            :disabled="!canProceed"
          >
            Endelea
            <i class="fas fa-arrow-right"></i>
          </button>

          <button type="submit" v-if="currentStep === 3" class="btn-success" :disabled="saving">
            <span v-if="saving" class="spinner"></span>
            <span v-else>
              <i class="fas fa-save"></i>
              Hifadhi Mabadiliko
            </span>
          </button>
        </div>
      </form>
    </div>

    <!-- Camera Modal -->
    <div v-if="showCameraModal" class="modal-overlay" @click="closeCamera">
      <div class="camera-modal" @click.stop>
        <div class="camera-header">
          <h3>Piga Picha Mpya</h3>
          <button class="close-btn" @click="closeCamera">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="camera-container">
          <video ref="videoElement" autoplay playsinline></video>

          <div class="camera-controls">
            <button class="btn-capture" @click="capturePhoto">
              <i class="fas fa-camera"></i>
            </button>
            <button class="btn-switch" @click="switchCamera" v-if="hasMultipleCameras">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <div class="camera-preview" v-if="capturedImage">
          <h4>Picha Uliyoipiga:</h4>
          <img :src="capturedImage" alt="Captured" />
          <div class="preview-actions">
            <button class="btn-secondary" @click="retakePhoto">
              <i class="fas fa-redo"></i>
              Piga Tena
            </button>
            <button class="btn-primary" @click="acceptPhoto">
              <i class="fas fa-check"></i>
              Tumia Picha Hii
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Discard Changes Modal -->
    <div v-if="showDiscardModal" class="modal-overlay" @click="closeDiscardModal">
      <div class="modal-content discard-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Ghairi Mabadiliko?</h3>
          <button class="close-btn" @click="closeDiscardModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Una mabadiliko ambayo hayajahifadhiwa. Una uhakika unataka kuondoka?</p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Mabadiliko yote ambayo hujayahifadhi yatapotea.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDiscardModal" class="btn-secondary">
            <i class="fas fa-times"></i>
            Endelea Kuhariri
          </button>
          <button @click="confirmDiscard" class="btn-danger">
            <i class="fas fa-trash-alt"></i>
            Tupa Mabadiliko
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
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// Props
const props = defineProps({
  customerId: {
    type: String,
    default: null,
  },
})

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// State
const customerId = computed(() => props.customerId || route.params.id)
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const currentStep = ref(1)
const errors = ref({})
const showDiscardModal = ref(false)
const hasChanges = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Camera
const showCameraModal = ref(false)
const videoElement = ref(null)
const capturedImage = ref(null)
const stream = ref(null)
const hasMultipleCameras = ref(false)
let currentCamera = 'user'

// File upload
const fileInput = ref(null)
const currentPhotoUrl = ref(null)

// Form data - Initialize with empty values
const form = reactive({
  customer_number: '',
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  id_number: '',
  id_type: 'NIDA',
  address: '',
  occupation: '',
  monthly_income: '',
  employer: '',
  employment_years: '',
  status: 'active',
  blacklist_reason: '',
  notes: '',
  profile_photo: null,
  profile_photo_preview: null,
  remove_profile_photo: false,
})

// Store original form data
const originalFormData = ref(null)

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return form.first_name && form.last_name && form.phone && form.id_number && form.address
  }
  if (currentStep.value === 2) {
    return form.occupation && form.monthly_income
  }
  return true
})

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Get full photo URL
const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null
  if (photoPath.startsWith('http')) return photoPath
  if (photoPath.startsWith('/storage')) return `${API_BASE_URL}${photoPath}`
  return `${API_BASE_URL}/storage/${photoPath}`
}

// Methods
const loadCustomer = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('Loading customer with ID:', customerId.value)
    const response = await axios.get(`${API_BASE_URL}/customers/${customerId.value}/edit`)

    console.log('Full API Response:', response.data)

    // Check different possible response structures
    let customer = null

    if (response.data.data && response.data.data.customer) {
      // Structure: { data: { customer: {...} } }
      customer = response.data.data.customer
      console.log('Found customer in data.customer')
    } else if (response.data.data && response.data.data.id) {
      // Structure: { data: {...} }
      customer = response.data.data
      console.log('Found customer in data')
    } else if (response.data.customer) {
      // Structure: { customer: {...} }
      customer = response.data.customer
      console.log('Found customer in root.customer')
    } else if (response.data.id) {
      // Structure: direct customer object
      customer = response.data
      console.log('Found customer as root object')
    }

    if (customer) {
      console.log('Customer data extracted:', customer)

      // Update form with customer data
      form.customer_number = customer.customer_number || ''
      form.first_name = customer.first_name || ''
      form.last_name = customer.last_name || ''
      form.phone = customer.phone || ''
      form.email = customer.email || ''
      form.id_number = customer.id_number || ''
      form.id_type = customer.id_type || 'NIDA'
      form.address = customer.address || ''
      form.occupation = customer.occupation || ''
      form.monthly_income = customer.monthly_income ? parseFloat(customer.monthly_income) : ''
      form.employer = customer.employer || ''
      form.employment_years = customer.employment_years || ''
      form.status = customer.status || 'active'
      form.blacklist_reason = customer.blacklist_reason || ''
      form.notes = customer.notes || ''
      form.remove_profile_photo = false
      form.profile_photo = null
      form.profile_photo_preview = null

      // Set current photo URL - check both profile_photo and profile_photo_url fields
      const photoPath = customer.profile_photo_url || customer.profile_photo
      if (photoPath) {
        currentPhotoUrl.value = getPhotoUrl(photoPath)
        console.log('Photo URL:', currentPhotoUrl.value)
      } else {
        currentPhotoUrl.value = null
      }

      console.log('Form after update:', {
        customer_number: form.customer_number,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        email: form.email,
        id_number: form.id_number,
        address: form.address,
        occupation: form.occupation,
        monthly_income: form.monthly_income,
      })

      // Store original data for change detection
      originalFormData.value = JSON.parse(JSON.stringify(form))

      // Force Vue to update the DOM
      await nextTick()
    } else {
      console.error('Could not extract customer data from response:', response.data)
      error.value = 'Mteja hakupatikana'
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

// Navigation
const nextStep = () => {
  if (currentStep.value < 3 && canProceed.value) {
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// File upload
const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    showToastMessage('Picha ni kubwa kuliko 2MB. Tafadhali chagua picha ndogo.', 'error')
    return
  }

  if (!file.type.startsWith('image/')) {
    showToastMessage('Tafadhali chagua picha tu.', 'error')
    return
  }

  form.profile_photo = file
  form.remove_profile_photo = false

  const reader = new FileReader()
  reader.onload = (e) => {
    form.profile_photo_preview = e.target.result
  }
  reader.readAsDataURL(file)
  hasChanges.value = true
}

const removePhoto = () => {
  form.profile_photo = null
  form.profile_photo_preview = null
  form.remove_profile_photo = true
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  hasChanges.value = true
}

const removeCurrentPhoto = () => {
  currentPhotoUrl.value = null
  form.remove_profile_photo = true
  hasChanges.value = true
}

// Camera methods
const openCamera = async () => {
  showCameraModal.value = true
  capturedImage.value = null

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter((device) => device.kind === 'videoinput')
    hasMultipleCameras.value = videoDevices.length > 1

    const constraints = {
      video: {
        facingMode: currentCamera,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    }

    stream.value = await navigator.mediaDevices.getUserMedia(constraints)

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    showToastMessage('Haiwezi kufungua kamera. Tafadhali hakikisha umeiruhusu.', 'error')
    closeCamera()
  }
}

const switchCamera = () => {
  currentCamera = currentCamera === 'user' ? 'environment' : 'user'
  stopCamera()
  openCamera()
}

const capturePhoto = () => {
  const video = videoElement.value
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const context = canvas.getContext('2d')
  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  capturedImage.value = canvas.toDataURL('image/jpeg', 0.8)
}

const retakePhoto = () => {
  capturedImage.value = null
}

const acceptPhoto = () => {
  // Convert base64 to file
  const base64Data = capturedImage.value.split(',')[1]
  const blob = atob(base64Data)
  const arrayBuffer = new ArrayBuffer(blob.length)
  const uint8Array = new Uint8Array(arrayBuffer)

  for (let i = 0; i < blob.length; i++) {
    uint8Array[i] = blob.charCodeAt(i)
  }

  const file = new File([uint8Array], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })

  form.profile_photo = file
  form.profile_photo_preview = capturedImage.value
  form.remove_profile_photo = false
  currentPhotoUrl.value = null
  hasChanges.value = true
  closeCamera()
}

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop())
    stream.value = null
  }
}

const closeCamera = () => {
  stopCamera()
  showCameraModal.value = false
  capturedImage.value = null
}

// Form submission
const submitForm = async () => {
  saving.value = true
  errors.value = {}

  try {
    const formData = new FormData()
    formData.append('first_name', form.first_name)
    formData.append('last_name', form.last_name)
    formData.append('phone', form.phone)
    formData.append('id_number', form.id_number)
    formData.append('id_type', form.id_type)
    formData.append('address', form.address)
    formData.append('occupation', form.occupation)
    formData.append('monthly_income', form.monthly_income)
    formData.append('status', form.status)

    if (form.email) formData.append('email', form.email)
    if (form.employer) formData.append('employer', form.employer)
    if (form.employment_years) formData.append('employment_years', form.employment_years)
    if (form.notes) formData.append('notes', form.notes)
    if (form.blacklist_reason) formData.append('blacklist_reason', form.blacklist_reason)

    if (form.profile_photo) {
      formData.append('profile_photo', form.profile_photo)
    }

    if (form.remove_profile_photo) {
      formData.append('remove_profile_photo', 'true')
    }

    const response = await axios.post(
      `${API_BASE_URL}/customers/${customerId.value}?_method=PUT`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    if (response.data.status === 'success' || response.data.success) {
      showToastMessage('Taarifa za mteja zimehifadhiwa kwa mafanikio!', 'success')
      hasChanges.value = false

      setTimeout(() => {
        router.push(`/customers/${customerId.value}`)
      }, 1500)
    } else {
      showToastMessage(response.data.message || 'Hitilafu imetokea', 'error')
    }
  } catch (error) {
    console.error('Error saving customer:', error)

    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
      showToastMessage('Tafadhali sahihisha makosa yaliyoonyeshwa', 'error')
      currentStep.value = 1
    } else {
      showToastMessage(
        error.response?.data?.message || 'Hitilafu imetokea. Tafadhali jaribu tena.',
        'error',
      )
    }
  } finally {
    saving.value = false
  }
}

// Navigation guards
const cancelEdit = () => {
  if (hasChanges.value) {
    showDiscardModal.value = true
  } else {
    router.push(`/customers/${customerId.value}`)
  }
}

const closeDiscardModal = () => {
  showDiscardModal.value = false
}

const confirmDiscard = () => {
  showDiscardModal.value = false
  router.push(`/customers/${customerId.value}`)
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

// Watch for form changes
watch(
  form,
  () => {
    if (originalFormData.value) {
      const isChanged = JSON.stringify(form) !== JSON.stringify(originalFormData.value)
      hasChanges.value = isChanged
    }
  },
  { deep: true },
)

// Lifecycle
onMounted(() => {
  loadCustomer()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.customer-edit-container {
  padding: 20px;
  max-width: 1000px;
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

.spinner-small {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

/* Header */
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
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

.header-left h1 {
  font-size: 1.5rem;
  color: #1a2639;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-success {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
  box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4);
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #eef2f6;
}

.btn-secondary:hover {
  background: #f8fafc;
  color: #333;
}

.btn-primary:disabled,
.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Error Summary */
.error-summary {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 25px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.error-summary i {
  color: #e74c3c;
  font-size: 1.5rem;
}

.error-content h4 {
  color: #e74c3c;
  margin: 0 0 10px;
  font-size: 1rem;
}

.error-content ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

/* Progress Steps */
.form-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  padding: 0 20px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.step-indicator {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eef2f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.step-number,
.step-check {
  font-size: 1rem;
  font-weight: 600;
  color: #666;
}

.step-check {
  color: white;
}

.progress-step.active .step-indicator {
  background: #3498db;
  border-color: #2980b9;
}

.progress-step.active .step-number {
  color: white;
}

.progress-step.completed .step-indicator {
  background: #27ae60;
  border-color: #229954;
}

.progress-step.completed .step-check {
  color: white;
}

.step-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.progress-step.active .step-label {
  color: #3498db;
  font-weight: 600;
}

.progress-line {
  width: 80px;
  height: 2px;
  background: #eef2f6;
  margin: 0 10px;
  transition: background 0.3s;
}

.progress-line.active {
  background: #3498db;
}

/* Form Steps */
.form-step {
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

.step-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.step-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-icon i {
  font-size: 1.5rem;
  color: white;
}

.step-info h3 {
  margin: 0 0 5px;
  color: #333;
  font-size: 1.2rem;
}

.step-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  margin-bottom: 5px;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group.required label::after {
  content: '*';
  color: #e74c3c;
  margin-left: 4px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group label i {
  color: #3498db;
  width: 18px;
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

.form-control.is-invalid {
  border-color: #e74c3c;
  background: #fff8f8;
}

.form-control:disabled,
.form-control[readonly] {
  background: #eef2f6;
  cursor: not-allowed;
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

.form-control.with-currency {
  padding-left: 60px;
}

.input-hint {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 4px;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
}

/* Photo Upload Section */
.photo-upload-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.photo-upload-card,
.status-card,
.notes-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.photo-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.photo-card-header i {
  font-size: 1.2rem;
  color: #3498db;
}

.photo-card-header h4 {
  margin: 0;
  color: #333;
  font-size: 1rem;
  flex: 1;
}

.optional-badge {
  background: #eef2f6;
  color: #666;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* Photo Preview */
.photo-preview-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.photo-preview {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #3498db;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-remove-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(231, 76, 60, 0.9);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-remove-photo:hover {
  background: #e74c3c;
  transform: scale(1.1);
}

.photo-placeholder {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #eef2f6, #e2e8f0);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  border: 2px dashed #cbd5e0;
}

.photo-placeholder i {
  font-size: 3rem;
  margin-bottom: 5px;
  color: #cbd5e0;
}

.photo-placeholder span {
  font-size: 0.8rem;
}

/* Photo Actions */
.photo-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.photo-action-btn {
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
}

.photo-action-btn:hover {
  background: #eef2f6;
  color: #333;
}

.photo-action-btn.camera-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-color: #2980b9;
  color: white;
}

.photo-action-btn.camera-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.photo-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: #999;
  margin-top: 10px;
}

/* Status Options */
.status-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.status-option input[type='radio'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.status-badge-select {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-block;
}

.status-badge-select.active {
  background: #d4edda;
  color: #155724;
}

.status-badge-select.inactive {
  background: #fff3cd;
  color: #856404;
}

.status-badge-select.blacklisted {
  background: #f8d7da;
  color: #721c24;
}

.status-reason {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eef2f6;
}

.status-reason label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #e74c3c;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Form Navigation */
.form-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eef2f6;
}

/* Camera Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.camera-modal {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 800px;
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

.camera-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.camera-header h3 {
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

.camera-container {
  position: relative;
  padding: 20px;
}

.camera-container video {
  width: 100%;
  border-radius: 10px;
  background: #000;
}

.camera-controls {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn-capture {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  border: 3px solid #3498db;
  color: #3498db;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.btn-capture:hover {
  transform: scale(1.1);
  background: #3498db;
  color: white;
}

.btn-switch {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.btn-switch:hover {
  background: white;
  transform: rotate(180deg);
}

.camera-preview {
  padding: 20px;
  border-top: 1px solid #eef2f6;
}

.camera-preview h4 {
  margin: 0 0 15px;
  color: #333;
}

.camera-preview img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 10px;
  margin-bottom: 15px;
}

.preview-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* Discard Modal */
.discard-modal {
  max-width: 400px;
}

.modal-icon.warning {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #fee;
  color: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  gap: 15px;
}

.modal-header h3 {
  flex: 1;
  margin: 0;
  color: #333;
}

.modal-body {
  padding: 25px;
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

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

.btn-danger:hover {
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
  .customer-edit-container {
    padding: 15px;
  }

  .edit-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .header-actions {
    width: 100%;
  }

  .btn-primary,
  .btn-secondary,
  .btn-success {
    flex: 1;
    justify-content: center;
  }

  .form-progress {
    flex-direction: column;
    gap: 15px;
  }

  .progress-line {
    width: 2px;
    height: 30px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: span 1;
  }

  .photo-upload-section {
    grid-template-columns: 1fr;
  }

  .photo-actions {
    grid-template-columns: 1fr;
  }

  .form-navigation {
    flex-direction: column;
    gap: 10px;
  }

  .btn-primary,
  .btn-secondary,
  .btn-success {
    width: 100%;
  }

  .modal-footer {
    flex-direction: column;
  }

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

@media (max-width: 480px) {
  .step-header {
    flex-direction: column;
    text-align: center;
  }

  .step-info {
    text-align: center;
  }

  .photo-preview-container {
    margin-bottom: 15px;
  }

  .photo-preview,
  .photo-placeholder {
    width: 120px;
    height: 120px;
  }
}
</style>
