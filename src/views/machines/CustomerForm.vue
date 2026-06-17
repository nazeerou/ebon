<template>
  <!-- Offline Mode Badge -->
  <div v-if="showOfflineBadge" class="offline-badge">
    <i class="fas fa-wifi-slash"></i>
    <span>Unaendesha offline. Data itahifadhiwa na kusawazisha mtandao unaporudi.</span>
    <button
      @click="customerStore.syncOfflineData"
      class="btn-sync"
      :disabled="customerStore.pendingSync === 0"
    >
      <i class="fas fa-sync" :class="{ 'fa-spin': customerStore.syncInProgress }"></i>
      Sawazisha ({{ customerStore.pendingSync }})
    </button>
  </div>

  <div class="customer-form-container">
    <!-- Header -->
    <div class="form-header">
      <h2>{{ isEdit ? 'Hariri Mteja' : 'Sajili Mteja Mpya' }}</h2>
      <p class="header-subtitle">
        {{ isEdit ? 'Badilisha taarifa za mteja' : 'Jaza taarifa zote za mteja mpya' }}
      </p>
    </div>

    <!-- Progress Steps -->
    <div class="form-progress">
      <div class="progress-step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <div class="step-indicator">
          <span v-if="currentStep > 1" class="step-check">✓</span>
          <span v-else class="step-number">1</span>
        </div>
        <span class="step-label">Taarifa za Msingi</span>
      </div>
      <div class="progress-line" :class="{ active: currentStep >= 2 }"></div>

      <div class="progress-step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
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

    <!-- Error Display -->
    <div v-if="Object.keys(errors).length" class="error-summary">
      <i class="fas fa-exclamation-circle"></i>
      <div class="error-content">
        <h4>Tafadhali sahihisha makosa yafuatayo:</h4>
        <ul>
          <li v-for="(error, field) in errors" :key="field">
            {{ error[0] }}
          </li>
        </ul>
      </div>
    </div>

    <form @submit.prevent="submitForm" class="customer-form">
      <!-- Step 1: Basic Information -->
      <div v-show="currentStep === 1" class="form-step fade-enter-active">
        <div class="step-header">
          <div class="step-icon">
            <i class="fas fa-user"></i>
          </div>
          <div class="step-info">
            <h3>Taarifa za Msingi</h3>
            <p>Weka taarifa za msingi za mteja kama jina, anwani na mawasiliano</p>
          </div>
        </div>

        <div class="form-grid">
          <!-- Customer Number (auto-generated) -->
          <div class="form-group" v-if="isEdit">
            <label for="customer_number">
              <i class="fas fa-hashtag"></i>
              Namba ya Mteja
            </label>
            <input
              type="text"
              id="customer_number"
              v-model="form.customer_number"
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
              {{ errors.first_name }}
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
              {{ errors.last_name }}
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
              {{ errors.phone }}
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
              {{ errors.email }}
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
              {{ errors.id_number }}
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
              {{ errors.id_type }}
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
              {{ errors.address }}
            </span>
          </div>
        </div>
      </div>

      <!-- Step 2: Employment Information -->
      <div v-show="currentStep === 2" class="form-step fade-enter-active">
        <div class="step-header">
          <div class="step-icon">
            <i class="fas fa-briefcase"></i>
          </div>
          <div class="step-info">
            <h3>Taarifa za Kazi</h3>
            <p>Weka taarifa za kazi na kipato cha mteja</p>
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
              {{ errors.occupation }}
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
              />
            </div>
            <span v-if="errors.monthly_income" class="error-text">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.monthly_income }}
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
              {{ errors.employer }}
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
              {{ errors.employment_years }}
            </span>
          </div>
        </div>
      </div>

      <!-- Step 3: Photos and Documents -->
      <div v-show="currentStep === 3" class="form-step fade-enter-active">
        <div class="step-header">
          <div class="step-icon">
            <i class="fas fa-camera"></i>
          </div>
          <div class="step-info">
            <h3>Picha na Nyaraka</h3>
            <p>
              Pakia picha ya mteja na nyaraka muhimu. Unaweza kupiga picha moja kwa moja au kuchagua
              kutoka kwenye faili.
            </p>
          </div>
        </div>

        <div class="photo-upload-section">
          <!-- Profile Photo Upload with Camera Option -->
          <div class="photo-upload-card">
            <div class="photo-card-header">
              <i class="fas fa-camera-retro"></i>
              <h4>Picha ya Mteja</h4>
              <span class="required-badge">Inahitajika</span>
            </div>

            <div class="photo-preview-container">
              <div v-if="form.profile_photo_preview" class="photo-preview">
                <img :src="form.profile_photo_preview" alt="Profile Preview" />
                <button
                  type="button"
                  class="btn-remove-photo"
                  @click="removePhoto('profile')"
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
              <!-- Upload from file -->
              <div class="photo-action-btn" @click="triggerFileInput('profile')">
                <i class="fas fa-upload"></i>
                <span>Pakia kutoka Faili</span>
              </div>

              <!-- Take photo with camera -->
              <div class="photo-action-btn camera-btn" @click="openCamera('profile')">
                <i class="fas fa-camera"></i>
                <span>Piga Picha</span>
              </div>
            </div>

            <input
              type="file"
              ref="profileInput"
              @change="handleFileSelect($event, 'profile')"
              accept="image/*"
              style="display: none"
            />

            <div class="photo-hint">
              <i class="fas fa-info-circle"></i>
              <span>Aina zinazokubalika: JPG, PNG, GIF. Ukubwa: hadi 2MB</span>
            </div>
          </div>

          <!-- ID Document Upload -->
          <div class="photo-upload-card">
            <div class="photo-card-header">
              <i class="fas fa-id-card"></i>
              <h4>Kitambulisho</h4>
              <span class="optional-badge">Si lazima</span>
            </div>

            <div class="document-preview-container">
              <div v-if="form.id_document_name" class="document-preview">
                <i class="fas fa-file-pdf"></i>
                <span class="document-name">{{ form.id_document_name }}</span>
                <button
                  type="button"
                  class="btn-remove-document"
                  @click="removeFile('id_document')"
                  title="Ondoa faili"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div v-else class="document-placeholder">
                <i class="fas fa-file-upload"></i>
                <span>Bonyeza kupakia kitambulisho</span>
              </div>
            </div>

            <div class="photo-actions">
              <!-- Upload from file -->
              <div class="photo-action-btn" @click="triggerFileInput('id_document')">
                <i class="fas fa-upload"></i>
                <span>Chagua Faili</span>
              </div>

              <!-- Scan with camera -->
              <div class="photo-action-btn camera-btn" @click="openCamera('document')">
                <i class="fas fa-camera"></i>
                <span>Chukua Picha</span>
              </div>
            </div>

            <input
              type="file"
              ref="idDocumentInput"
              @change="handleFileSelect($event, 'id_document')"
              accept=".pdf,.jpg,.jpeg,.png"
              style="display: none"
            />

            <div class="photo-hint">
              <i class="fas fa-info-circle"></i>
              <span>Aina zinazokubalika: PDF, JPG, PNG. Ukubwa: hadi 5MB</span>
            </div>
          </div>

          <!-- Additional Documents (Optional) -->
          <div class="photo-upload-card">
            <div class="photo-card-header">
              <i class="fas fa-folder-open"></i>
              <h4>Nyaraka nyingine</h4>
              <span class="optional-badge">Si lazima</span>
            </div>

            <div class="documents-list">
              <div
                v-for="(doc, index) in form.additional_documents"
                :key="index"
                class="document-item"
              >
                <i class="fas fa-file-alt"></i>
                <span class="document-name">{{ doc.name }}</span>
                <button
                  type="button"
                  class="btn-remove-document"
                  @click="removeAdditionalDocument(index)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <div v-if="form.additional_documents.length === 0" class="no-documents">
                <i class="fas fa-folder-open"></i>
                <span>Hakuna nyaraka zilizopakiwa</span>
              </div>
            </div>

            <div class="photo-action-btn add-doc-btn" @click="triggerFileInput('additional')">
              <i class="fas fa-plus-circle"></i>
              <span>Ongeza Nyaraka</span>
            </div>

            <input
              type="file"
              ref="additionalInput"
              @change="handleAdditionalFiles"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
              style="display: none"
            />
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

        <button
          type="submit"
          v-if="currentStep === 3"
          class="btn-success"
          :disabled="loading || !isStep3Valid"
        >
          <span v-if="loading" class="spinner"></span>
          <span v-else>
            <i class="fas fa-save"></i>
            Hifadhi Mteja
          </span>
        </button>
      </div>
    </form>

    <!-- Camera Modal -->
    <div v-if="showCameraModal" class="modal-overlay" @click="closeCamera">
      <div class="camera-modal" @click.stop>
        <div class="camera-header">
          <h3>
            {{ cameraMode === 'profile' ? 'Piga Picha ya Mteja' : 'Piga Picha ya Kitambulisho' }}
          </h3>
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

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
// Add these imports
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '@/stores/customer'
import offlineStorage from '@/services/offlineStorage'
import syncService from '@/services/syncService'
import debounce from 'lodash/debounce'

const router = useRouter()
const customerStore = useCustomerStore()

// Props
const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false,
  },
  customerId: {
    type: String,
    default: null,
  },
})

// State
const currentStep = ref(1)
const loading = ref(false)
const errors = ref({})
const isOnline = ref(navigator.onLine)
const showOfflineBadge = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Camera
const showCameraModal = ref(false)
const cameraMode = ref('profile') // 'profile' or 'document'
const videoElement = ref(null)
const capturedImage = ref(null)
const stream = ref(null)
const hasMultipleCameras = ref(false)
let currentCamera = 'user' // 'user' for front, 'environment' for back

// Form data
const form = reactive({
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
  profile_photo: null,
  profile_photo_preview: null,
  id_document: null,
  id_document_name: '',
  additional_documents: [],
})

// File input refs
const profileInput = ref(null)
const idDocumentInput = ref(null)
const additionalInput = ref(null)

// Draft ID
const draftId = computed(() => {
  return props.isEdit ? `edit-${props.customerId}` : 'new-customer'
})

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

const isStep3Valid = computed(() => {
  // Profile photo is required
  return form.profile_photo !== null || form.profile_photo_preview !== null
})

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Auto-save draft
const autoSaveDraft = debounce(async () => {
  if (!props.isEdit) {
    const draftData = {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      email: form.email,
      id_number: form.id_number,
      id_type: form.id_type,
      address: form.address,
      occupation: form.occupation,
      monthly_income: form.monthly_income,
      employer: form.employer,
      employment_years: form.employment_years,
      // Don't save files in draft
    }
    await offlineStorage.saveFormDraft(draftId.value, draftData)
  }
}, 1000)

// Watch form changes for auto-save
watch(
  () => ({ ...form }),
  () => {
    if (!props.isEdit && Object.keys(form).length > 0) {
      autoSaveDraft()
    }
  },
  { deep: true },
)

// Load draft if exists
const loadDraft = async () => {
  if (!props.isEdit) {
    const draft = await offlineStorage.getFormDraft(draftId.value)
    if (draft) {
      Object.assign(form, draft.data)
      showToastMessage('Umerekebisha rasimu iliyohifadhiwa', 'info')
    }
  }
}

// Methods
const triggerFileInput = (type) => {
  if (type === 'profile') {
    profileInput.value.click()
  } else if (type === 'id_document') {
    idDocumentInput.value.click()
  } else if (type === 'additional') {
    additionalInput.value.click()
  }
}

const handleFileSelect = (event, type) => {
  const file = event.target.files[0]
  if (!file) return

  if (type === 'profile') {
    if (file.size > 2 * 1024 * 1024) {
      showToastMessage('Picha ni kubwa kuliko 2MB. Tafadhali chagua picha ndogo.', 'error')
      return
    }

    if (!file.type.startsWith('image/')) {
      showToastMessage('Tafadhali chagua picha tu.', 'error')
      return
    }

    form.profile_photo = file
    const reader = new FileReader()
    reader.onload = (e) => {
      form.profile_photo_preview = e.target.result
    }
    reader.readAsDataURL(file)
  } else if (type === 'id_document') {
    if (file.size > 5 * 1024 * 1024) {
      showToastMessage('Faili ni kubwa kuliko 5MB. Tafadhali chagua faili ndogo.', 'error')
      return
    }

    form.id_document = file
    form.id_document_name = file.name
  }
}

const handleAdditionalFiles = (event) => {
  const files = Array.from(event.target.files)

  files.forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      showToastMessage(`Faili ${file.name} ni kubwa kuliko 5MB. Litapuuza.`, 'error')
      return
    }

    form.additional_documents.push({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  })
}

const removePhoto = (type) => {
  if (type === 'profile') {
    form.profile_photo = null
    form.profile_photo_preview = null
    if (profileInput.value) {
      profileInput.value.value = ''
    }
  }
}

const removeFile = (type) => {
  if (type === 'id_document') {
    form.id_document = null
    form.id_document_name = ''
    if (idDocumentInput.value) {
      idDocumentInput.value.value = ''
    }
  }
}

const removeAdditionalDocument = (index) => {
  form.additional_documents.splice(index, 1)
}

// Camera methods
const openCamera = (mode) => {
  cameraMode.value = mode
  showCameraModal.value = true
  capturedImage.value = null

  // Check for multiple cameras
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const videoDevices = devices.filter((device) => device.kind === 'videoinput')
    hasMultipleCameras.value = videoDevices.length > 1
  })

  startCamera()
}

const startCamera = async () => {
  try {
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
  startCamera()
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

  if (cameraMode.value === 'profile') {
    form.profile_photo = file
    form.profile_photo_preview = capturedImage.value
  } else {
    form.id_document = file
    form.id_document_name = `camera-${Date.now()}.jpg`
  }

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

// Navigation methods
const nextStep = () => {
  if (currentStep.value < 3 && canProceed.value) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Handle online/offline status
const handleOnlineStatus = () => {
  isOnline.value = navigator.onLine
  showOfflineBadge.value = !isOnline.value
}

// Form submission
const submitForm = async () => {
  if (!isStep3Valid.value) {
    showToastMessage('Tafadhali weka picha ya mteja', 'error')
    return
  }

  loading.value = true
  errors.value = {}

  try {
    const formData = new FormData()

    // Add basic fields
    formData.append('first_name', form.first_name)
    formData.append('last_name', form.last_name)
    formData.append('phone', form.phone)
    formData.append('email', form.email || '')
    formData.append('id_number', form.id_number)
    formData.append('id_type', form.id_type)
    formData.append('address', form.address)
    formData.append('occupation', form.occupation)
    formData.append('monthly_income', form.monthly_income)
    formData.append('employer', form.employer || '')
    formData.append('employment_years', form.employment_years || '0')

    // Add profile photo
    if (form.profile_photo) {
      formData.append('profile_photo', form.profile_photo)
    }

    // Add ID document
    if (form.id_document) {
      formData.append('id_document', form.id_document)
    }

    // Add additional documents
    form.additional_documents.forEach((doc, index) => {
      formData.append(`documents[${index}]`, doc.file)
    })

    let response

    if (props.isEdit && props.customerId) {
      response = await customerStore.updateCustomer(props.customerId, formData)
    } else {
      response = await customerStore.createCustomer(formData)
    }

    if (response.success) {
      // Clear draft if it was a new customer
      if (!props.isEdit) {
        await offlineStorage.clearFormDraft(draftId.value)
      }

      if (response.message.includes('offline')) {
        showToastMessage(response.message, 'info')
        setTimeout(() => {
          router.push('/customers')
        }, 2000)
      } else {
        showToastMessage(
          props.isEdit ? 'Mteja amehaririwa kwa mafanikio!' : 'Mteja amesajiliwa kwa mafanikio!',
          'success',
        )
        setTimeout(() => {
          router.push('/customers')
        }, 1500)
      }
    }
  } catch (error) {
    // Log the full error to console
    console.error('Full error object:', error)
    console.error('Error response:', error.response)
    console.error('Error data:', error.response?.data)
    console.error('Error status:', error.response?.status)
    console.error('Error headers:', error.response?.headers)

    // Display the exact error message
    if (error.response?.data?.message) {
      showToastMessage(`Error: ${error.response.data.message}`, 'error')
    }

    if (error.response?.status === 422) {
      errors.value = error.response.data.errors
      console.log('Validation errors:', errors.value)

      // Show validation errors in toast
      if (error.response.data.message) {
        showToastMessage(error.response.data.message, 'error')
      }

      // Go to step with errors
      if (
        errors.value.first_name ||
        errors.value.last_name ||
        errors.value.phone ||
        errors.value.id_number ||
        errors.value.address
      ) {
        currentStep.value = 1
      } else if (errors.value.occupation || errors.value.monthly_income) {
        currentStep.value = 2
      }
    } else if (error.response?.status === 500) {
      showToastMessage(
        `Server error: ${error.response.data.message || 'Internal server error'}`,
        'error',
      )
    } else if (error.code === 'ERR_NETWORK') {
      showToastMessage(
        'Network error: Cannot connect to server. Please check if backend is running.',
        'error',
      )
    } else {
      showToastMessage('Hitilafu imetokea. Tafadhali jaribu tena.', 'error')
    }
  } finally {
    loading.value = false
  }
}

// Toast methods
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Load customer data if editing
const loadCustomerData = async () => {
  if (props.isEdit && props.customerId) {
    try {
      const customer = await customerStore.fetchCustomer(props.customerId)

      // Populate form
      form.first_name = customer.first_name
      form.last_name = customer.last_name
      form.phone = customer.phone
      form.email = customer.email || ''
      form.id_number = customer.id_number
      form.id_type = customer.id_type || 'NIDA'
      form.address = customer.address
      form.occupation = customer.occupation
      form.monthly_income = customer.monthly_income
      form.employer = customer.employer || ''
      form.employment_years = customer.employment_years || ''

      // Set photo preview if exists
      if (customer.profile_photo) {
        form.profile_photo_preview = customer.profile_photo
      }
    } catch (error) {
      console.error('Error loading customer:', error)
    }
  }
}

// Initialize
onMounted(async () => {
  await customerStore.init()
  await loadDraft()

  window.addEventListener('online', handleOnlineStatus)
  window.addEventListener('offline', handleOnlineStatus)

  // Check initial status
  showOfflineBadge.value = !navigator.onLine

  if (props.isEdit && props.customerId) {
    await loadCustomerData()
  }
})

onUnmounted(() => {
  stopCamera()
  window.removeEventListener('online', handleOnlineStatus)
  window.removeEventListener('offline', handleOnlineStatus)
  customerStore.cleanup()
})
</script>
<style scoped>
.customer-form-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 60px;
  border-radius: 6px;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* Header Styles */
.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  font-size: 2rem;
  color: #1a2639;
  margin: 0 0 10px;
  font-weight: 600;
}

.header-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

/* Progress Steps */
.form-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
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

.error-content li {
  margin-bottom: 5px;
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
  width: 90%;
  padding: 12px 15px;
  border: 2px solid #ccdef0;
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

.error-text i {
  font-size: 0.8rem;
}

/* Photo Upload Section */
.photo-upload-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.photo-upload-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  transition: all 0.3s;
}

.photo-upload-card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
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
  font-size: 1.5rem;
  color: #3498db;
}

.photo-card-header h4 {
  margin: 0;
  color: #333;
  font-size: 1rem;
  flex: 1;
}

.required-badge {
  background: #fee;
  color: #e74c3c;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
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

/* Document Preview */
.document-preview-container {
  margin-bottom: 20px;
}

.document-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.document-preview i {
  font-size: 1.5rem;
  color: #e74c3c;
}

.document-name {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
  word-break: break-all;
}

.btn-remove-document {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-remove-document:hover {
  color: #e74c3c;
  background: #fee;
}

.document-placeholder {
  padding: 30px;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #eef2f6;
  color: #999;
}

.document-placeholder i {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #cbd5e0;
}

.document-placeholder span {
  display: block;
  font-size: 0.9rem;
}

/* Documents List */
.documents-list {
  margin-bottom: 15px;
  max-height: 150px;
  overflow-y: auto;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 5px;
  margin-bottom: 5px;
}

.document-item i {
  color: #3498db;
  font-size: 1rem;
}

.no-documents {
  padding: 20px;
  text-align: center;
  color: #999;
  background: #f8fafc;
  border-radius: 5px;
}

.no-documents i {
  font-size: 1.5rem;
  color: #cbd5e0;
  margin-bottom: 5px;
}

.no-documents span {
  display: block;
  font-size: 0.85rem;
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

.add-doc-btn {
  width: 100%;
  background: linear-gradient(135deg, #27ae60, #229954);
  border-color: #229954;
  color: white;
}

.add-doc-btn:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
}

.photo-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: #999;
  margin-top: 10px;
}

.photo-hint i {
  color: #3498db;
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
  color: #666;
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

/* Form Navigation */
.form-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eef2f6;
}

.btn-primary,
.btn-secondary,
.btn-success {
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
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

.btn-secondary {
  background: #f8fafc;
  color: #666;
  border: 1px solid #eef2f6;
}

.btn-secondary:hover {
  background: #eef2f6;
  color: #333;
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

.btn-primary:disabled,
.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
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
  .customer-form-container {
    padding: 15px;
  }

  .form-header h2 {
    font-size: 1.5rem;
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
    justify-content: center;
  }

  .toast-notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .form-header h2 {
    font-size: 1.3rem;
  }

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

/* Offline Badge */
.offline-badge {
  background: #f39c12;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  animation: slideDown 0.3s ease;
}

.offline-badge i {
  font-size: 1.2rem;
}

.offline-badge span {
  flex: 1;
  font-size: 0.9rem;
}

.btn-sync {
  padding: 5px 15px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  font-size: 0.85rem;
}

.btn-sync:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.btn-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style>
