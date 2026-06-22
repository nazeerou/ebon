<template>
  <div class="ocr-reading-container">
    <div class="page-header">
      <div class="header-left">
        <h1>Usomaji wa Mita</h1>
        <p class="subtitle">Ingiza Code ya mashine, usomaji na picha</p>
      </div>
    </div>

    <div class="ocr-card">
      <!-- Single Form -->
      <div class="form-wrapper">
        <!-- Machine Code -->
        <div class="form-group">
          <label>Code ya Mashine <span class="required">*</span></label>
          <div class="search-input-wrapper">
            <input
              type="text"
              v-model="machineCodeInput"
              @input="debouncedFindMachine"
              class="form-control"
              placeholder="Mfano: BN001"
              :disabled="saved"
              autofocus
            />
            <span v-if="searching" class="search-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </div>
          <p class="input-hint" v-if="!machineDetailsFound && !searching">
            <i class="fas fa-info-circle"></i> Ingiza Code, mfumo utatafuta kiotomatiki
          </p>
        </div>

        <!-- Machine Details Preview (shown when found) -->
        <div v-if="machineDetailsFound && identifiedMachine" class="machine-details">
          <div class="detail-card">
            <h4>Taarifa za Mashine</h4>
            <div class="detail-row">
              <span class="label">Serial:</span>
              <span class="value">{{ identifiedMachine.serial_number }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Mahali:</span>
              <span class="value">{{ identifiedMachine.branch?.address || '-' }}</span>
            </div>
            <div class="detail-row" v-if="previousReading !== null && previousReading !== 0">
              <!-- hidden, but we keep for structure -->
            </div>
          </div>
        </div>

        <!-- Not found message -->
        <div v-if="machineNotFound" class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          Hakuna Mashine yenye Code "{{ machineCodeInput.trim().toUpperCase() }}"
        </div>

        <!-- Current Reading -->
        <div class="form-group">
          <label>Usomaji wa sasa (Mileage) <span class="required">*</span></label>
          <input
            type="number"
            v-model.number="manualReading"
            class="form-control"
            placeholder="Ingiza namba ya usomaji"
            step="1"
            min="0"
            @input="validateManualReading"
            :disabled="saved"
          />
          <p v-if="manualReadingError" class="error-text">
            <i class="fas fa-exclamation-circle"></i> {{ manualReadingError }}
          </p>
        </div>

        <!-- Camera / Photo Capture -->
        <div class="form-group">
          <label>Picha ya Mita <span class="required">*</span></label>
          <div class="camera-upload-wrapper">
            <button type="button" class="btn-camera" @click="openCamera" :disabled="saved">
              <i class="fas fa-camera"></i> Piga Picha
            </button>
            <span class="upload-divider">au</span>
            <button type="button" class="btn-upload" @click="triggerFileInput" :disabled="saved">
              <i class="fas fa-upload"></i> Pakia Picha
            </button>
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept="image/*"
              style="display: none"
            />
          </div>

          <!-- Image Preview with Reading Display -->
          <div v-if="imagePreview" class="image-preview-wrapper">
            <div class="image-preview-card">
              <img :src="imagePreview" alt="Meter image" class="preview-image" />
              <div class="image-overlay">
                <span
                  v-if="manualReading !== null && manualReading !== undefined"
                  class="reading-badge"
                >
                  <i class="fas fa-tachometer-alt"></i> {{ formatNumber(manualReading) }}
                </span>
                <span v-else class="reading-badge empty">
                  <i class="fas fa-info-circle"></i> Hakuna usomaji
                </span>
              </div>
              <button type="button" class="remove-image-btn" @click="removeImage" :disabled="saved">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Reading Date -->
        <div class="form-group">
          <label>Tarehe ya Usomaji</label>
          <input type="date" v-model="readingDate" class="form-control" :disabled="saved" />
        </div>

        <!-- Results Preview -->
        <div
          v-if="
            currentReadingValue !== null &&
            currentReadingValue !== undefined &&
            !manualReadingError &&
            !saved
          "
          class="ocr-results"
        >
          <h3>Muhtasari wa usomaji</h3>
          <div class="results-grid">
            <div class="result-item">
              <label>Usomaji uliopita</label>
              <span class="value">{{ formatNumber(previousReading) }}</span>
            </div>
            <div class="result-item">
              <label>Usomaji wa sasa</label>
              <span class="value highlight">{{ formatNumber(currentReadingValue) }}</span>
            </div>
            <div class="result-item">
              <label>Tofauti (Mileage)</label>
              <span class="value">{{ formatNumber(difference) }}</span>
            </div>
            <div class="result-item">
              <label>Makusanyo yanayotarajiwa</label>
              <span class="value currency">{{ formatCurrency(expectedAmount) }}</span>
            </div>
          </div>
          <div class="form-actions">
            <button
              class="btn-success"
              @click="openConfirmationModal"
              :disabled="saving || !machineCodeInput || !machineDetailsFound"
            >
              <i class="fas fa-check-circle"></i> Hifadhi Usomaji
            </button>
            <button class="btn-secondary" @click="resetManualReading" :disabled="saving">
              <i class="fas fa-redo"></i> Badilisha
            </button>
          </div>
        </div>

        <!-- After successful save -->
        <div v-if="saved" class="saved-confirmation">
          <div class="saved-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>Usomaji umehifadhiwa kwa mafanikio!</h3>
          <div class="results-grid">
            <div class="result-item">
              <label>Usomaji uliopita</label>
              <span class="value">{{ formatNumber(previousReading) }}</span>
            </div>
            <div class="result-item">
              <label>Usomaji wa sasa</label>
              <span class="value highlight">{{ formatNumber(currentReadingValue) }}</span>
            </div>
            <div class="result-item">
              <label>Tofauti (Mileage)</label>
              <span class="value">{{ formatNumber(difference) }}</span>
            </div>
            <div class="result-item">
              <label>Makusanyo yanayotarajiwa</label>
              <span class="value currency">{{ formatCurrency(expectedAmount) }}</span>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" @click="resetAll">
              <i class="fas fa-plus"></i> Usomaji Mpya
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Camera Modal (single instance) -->
    <div v-if="showCameraModal" class="modal-overlay" @click="closeCamera">
      <div class="camera-modal" @click.stop>
        <div class="camera-header">
          <h3>Piga Picha ya Mita</h3>
          <button class="close-btn" @click="closeCamera"><i class="fas fa-times"></i></button>
        </div>
        <div class="camera-body">
          <video
            v-if="!capturedImage"
            ref="videoElement"
            autoplay
            playsinline
            class="camera-video"
          ></video>
          <img v-else :src="capturedImage" class="captured-preview" />
        </div>
        <div class="camera-footer">
          <div v-if="!capturedImage" class="camera-actions">
            <button v-if="hasMultipleCameras" class="btn-secondary" @click="switchCamera">
              <i class="fas fa-sync-alt"></i> Badilisha Kamera
            </button>
            <button class="btn-primary" @click="capturePhoto">
              <i class="fas fa-camera"></i> Piga Picha
            </button>
          </div>
          <div v-else class="camera-actions">
            <button class="btn-secondary" @click="retakePhoto">
              <i class="fas fa-redo"></i> Piga Tena
            </button>
            <button class="btn-success" @click="acceptPhoto">
              <i class="fas fa-check"></i> Thibitisha
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmationModal" class="modal-overlay" @click="closeConfirmationModal">
      <div class="modal-content confirmation-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon info">
            <i class="fas fa-info-circle"></i>
          </div>
          <h3>Thibitisha Usomaji</h3>
          <button class="close-btn" @click="closeConfirmationModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="confirmation-text">Tafadhali hakikisha taarifa zifuatazo kabla ya kuhifadhi:</p>

          <div class="confirmation-details">
            <div class="detail-row">
              <span class="label">Mashine:</span>
              <span class="value"
                >{{ identifiedMachine?.machine_name }} ({{ identifiedMachine?.machine_code }})</span
              >
            </div>
            <div class="detail-row">
              <span class="label">Serial:</span>
              <span class="value">{{ identifiedMachine?.serial_number }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Tawi:</span>
              <span class="value">{{ identifiedMachine?.branch?.branch_name || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Mahali:</span>
              <span class="value">{{ identifiedMachine?.branch?.address || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Usomaji uliopita:</span>
              <span class="value">{{ formatNumber(previousReading) }}</span>
            </div>
            <div class="detail-row highlight-row">
              <span class="label">Usomaji wa sasa:</span>
              <span class="value highlight">{{ formatNumber(currentReadingValue) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Tofauti:</span>
              <span class="value">{{ formatNumber(difference) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Makusanyo yanayotarajiwa:</span>
              <span class="value currency">{{ formatCurrency(expectedAmount) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Tarehe:</span>
              <span class="value">{{ formatDate(readingDate) }}</span>
            </div>
            <div class="detail-row" v-if="imagePreview">
              <span class="label">Picha:</span>
              <div class="image-preview-small">
                <img :src="imagePreview" alt="Meter image" />
              </div>
            </div>
          </div>

          <div class="warning-note">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Hakikisha taarifa zote ni sahihi kabla ya kuwasilisha.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeConfirmationModal" :disabled="saving">
            <i class="fas fa-times"></i> Ghairi
          </button>
          <button class="btn-success" @click="confirmSave" :disabled="saving">
            <span v-if="saving"><i class="fas fa-spinner fa-spin"></i> Inahifadhi...</span>
            <span v-else><i class="fas fa-check"></i> Thibitisha na Hifadhi</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="showToast" class="toast-notification" :class="toastType">
      <i :class="toastIcon"></i> <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/reading'
import { useMachineStore } from '@/stores/Machine'
import { formatNumber, formatCurrency, formatDate } from '@/utils/formatters'
import debounce from 'lodash/debounce'

const router = useRouter()
const readingStore = useReadingStore()
const machineStore = useMachineStore()

// Machine search state
const identifiedMachine = ref(null)
const machineDetailsFound = ref(false)
const machineNotFound = ref(false)
const machineCodeInput = ref('')
const searching = ref(false)

// Manual reading
const manualReading = ref(null)
const manualReadingError = ref('')
const previousReading = ref(0)
const saving = ref(false)
const saved = ref(false)

// Image upload
const imageFile = ref(null)
const imagePreview = ref(null)

// Camera
const showCameraModal = ref(false)
const videoElement = ref(null)
const stream = ref(null)
const capturedImage = ref(null)
const hasMultipleCameras = ref(false)
const currentCamera = ref('environment')
const fileInput = ref(null)

// Reading date
const readingDate = ref(new Date().toISOString().slice(0, 10))

// Confirmation modal
const showConfirmationModal = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const ratePerUnit = 200

// Computed
const currentReadingValue = computed(() => {
  if (
    manualReading.value !== null &&
    manualReading.value !== undefined &&
    !manualReadingError.value
  ) {
    return manualReading.value
  }
  return null
})
const difference = computed(() => {
  const current = currentReadingValue.value
  if (current === null || current === undefined) return 0
  return current - previousReading.value
})
const expectedAmount = computed(() => (difference.value > 0 ? difference.value * ratePerUnit : 0))
const toastIcon = computed(() =>
  toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle',
)

// Debounced search function
const findMachineByCode = async (code) => {
  if (!code || code.trim().length === 0) {
    machineDetailsFound.value = false
    identifiedMachine.value = null
    machineNotFound.value = false
    previousReading.value = 0
    return
  }

  searching.value = true
  machineNotFound.value = false

  try {
    const response = await machineStore.fetchMachines({ machine_code: code.trim().toUpperCase() })
    const data = response.data || response
    let machines = []

    if (data.data && Array.isArray(data.data)) {
      machines = data.data
    } else if (Array.isArray(data)) {
      machines = data
    }

    const found = machines.find((m) => m.machine_code.toUpperCase() === code.trim().toUpperCase())

    if (found) {
      identifiedMachine.value = found
      machineDetailsFound.value = true
      machineNotFound.value = false

      try {
        const lastReading = await readingStore.fetchPreviousReadingByMachineCode(
          code.trim().toUpperCase(),
        )
        previousReading.value = lastReading?.current_reading || 0
      } catch (error) {
        console.error('Error fetching previous reading:', error)
        previousReading.value = 0
      }
    } else {
      machineDetailsFound.value = false
      identifiedMachine.value = null
      machineNotFound.value = true
      previousReading.value = 0
    }
  } catch (error) {
    console.error('Error searching machine:', error)
    machineDetailsFound.value = false
    identifiedMachine.value = null
    machineNotFound.value = true
    previousReading.value = 0
    showToastMessage('Imeshindwa kutafuta mashine', 'error')
  } finally {
    searching.value = false
  }
}

const debouncedFindMachine = debounce((e) => {
  const code = machineCodeInput.value
  findMachineByCode(code)
}, 500)

// Manual reading validation
const validateManualReading = () => {
  const val = manualReading.value
  if (val === null || val === undefined || val === '') {
    manualReadingError.value = ''
    return
  }
  const num = Number(val)
  if (isNaN(num) || num < 0) {
    manualReadingError.value = 'Tafadhali ingiza namba sahihi (sifuri au zaidi)'
    return
  }
  if (num < previousReading.value) {
    manualReadingError.value = `Usomaji wa sasa (${num}) hauwezi kuwa chini ya uliopita (${previousReading.value})`
    return
  }
  manualReadingError.value = ''
}

watch(manualReading, () => {
  validateManualReading()
})

const resetManualReading = () => {
  manualReading.value = null
  manualReadingError.value = ''
}

// Image handlers
const triggerFileInput = () => {
  fileInput.value?.click()
}
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}
const removeImage = () => {
  imageFile.value = null
  imagePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Camera methods
const openCamera = () => {
  showCameraModal.value = true
  capturedImage.value = null
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
        facingMode: currentCamera.value,
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

const switchCamera = () => {
  currentCamera.value = currentCamera.value === 'user' ? 'environment' : 'user'
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
  // Convert data URL to File
  const base64Data = capturedImage.value.split(',')[1]
  const blob = atob(base64Data)
  const arrayBuffer = new ArrayBuffer(blob.length)
  const uint8Array = new Uint8Array(arrayBuffer)
  for (let i = 0; i < blob.length; i++) {
    uint8Array[i] = blob.charCodeAt(i)
  }
  const file = new File([uint8Array], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
  imageFile.value = file
  imagePreview.value = capturedImage.value
  closeCamera()
}

// Open confirmation modal
const openConfirmationModal = async () => {
  if (!machineCodeInput.value) {
    showToastMessage('Tafadhali ingiza Code ya mashine', 'error')
    return
  }
  if (!identifiedMachine.value) {
    await findMachineByCode(machineCodeInput.value)
    if (!identifiedMachine.value) {
      showToastMessage(
        `Hakuna mashine yenye Code "${machineCodeInput.value.trim().toUpperCase()}"`,
        'error',
      )
      return
    }
  }
  const currentVal = currentReadingValue.value
  if (currentVal === null || currentVal === undefined) {
    showToastMessage('Tafadhali ingiza usomaji wa sasa', 'error')
    return
  }
  if (manualReadingError.value) {
    showToastMessage(manualReadingError.value, 'error')
    return
  }
  showConfirmationModal.value = true
}

const closeConfirmationModal = () => {
  showConfirmationModal.value = false
}

// Confirm and save
const confirmSave = async () => {
  saving.value = true
  try {
    // Prepare payload using FormData if image exists
    let payload
    if (imageFile.value) {
      const formData = new FormData()
      formData.append('machine_id', identifiedMachine.value.id)
      formData.append('current_reading', currentReadingValue.value)
      formData.append('reading_date', readingDate.value || new Date().toISOString().slice(0, 10))
      formData.append('image', imageFile.value)
      payload = formData
    } else {
      payload = {
        machine_id: identifiedMachine.value.id,
        current_reading: currentReadingValue.value,
        reading_date: readingDate.value || new Date().toISOString().slice(0, 10),
      }
    }

    const response = await readingStore.createReading(payload)

    if (response.success) {
      // Check if there was an image warning
      if (response.status === 'warning') {
        showToastMessage(
          response.message || 'Usomaji umehifadhiwa, lakini picha haikupakiwa.',
          'warning',
        )
      } else {
        showToastMessage('Usomaji umehifadhiwa kwa mafanikio!', 'success')
      }
      saved.value = true
      closeConfirmationModal()
    } else {
      throw new Error(response.message || 'Failed to save')
    }
  } catch (err) {
    console.error(err)
    const message = err.response?.data?.message || err.message || 'Imeshindwa kuhifadhi usomaji'
    showToastMessage(message, 'error')
  } finally {
    saving.value = false
  }
}

// Reset everything
const resetAll = () => {
  saved.value = false
  machineDetailsFound.value = false
  identifiedMachine.value = null
  machineNotFound.value = false
  machineCodeInput.value = ''
  previousReading.value = 0
  manualReading.value = null
  manualReadingError.value = ''
  readingDate.value = new Date().toISOString().slice(0, 10)
  removeImage()
}

// Toast helper
const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

// Cleanup
onUnmounted(() => {
  stopCamera()
  debouncedFindMachine.cancel()
})

onMounted(() => {
  // no-op
})
</script>

<style scoped>
/* All existing styles remain, with additions for search spinner */
.search-input-wrapper {
  position: relative;
}
.search-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #3b82f6;
}
.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
.alert-warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}
.alert-warning i {
  margin-right: 0.5rem;
}

/* All existing styles remain, plus confirmation modal styles */
.ocr-reading-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.header-left h1 {
  font-size: 1.75rem;
  color: #1e293b;
  margin: 0 0 0.25rem;
}
.subtitle {
  color: #64748b;
  margin: 0;
  font-size: 0.875rem;
}
.ocr-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid #eef2f6;
}
.step {
  margin-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1.5rem;
}
.step:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.step.disabled {
  opacity: 0.6;
  pointer-events: none;
}
.step.completed .step-number {
  background: #10b981;
}
.step-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: bold;
}
.step-header h3 {
  margin: 0;
  font-size: 1.25rem;
}
.required {
  color: #ef4444;
}
.input-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.error-text {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #334155;
}
.form-control {
  width: 95%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
}
.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
.form-control-file {
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  width: 100%;
}
.image-preview {
  position: relative;
  margin-top: 0.5rem;
  max-width: 200px;
}
.image-preview img {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}
.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.ocr-results {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}
.ocr-results h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.result-item {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 0.5rem;
}
.result-item label {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
  margin-bottom: 0.25rem;
}
.result-item .value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}
.result-item .value.highlight {
  color: #3b82f6;
  font-size: 1.3rem;
}
.result-item .value.currency {
  color: #10b981;
}
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
.btn-primary,
.btn-success,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}
.btn-primary {
  background: #3b82f6;
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}
.btn-success {
  background: #10b981;
  color: white;
}
.btn-success:hover:not(:disabled) {
  background: #059669;
}
.btn-secondary {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}
.btn-secondary:hover {
  background: #e2e8f0;
}
.btn-success:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Confirmation Modal */
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
.modal-content.confirmation-modal {
  background: white;
  border-radius: 1rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}
.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.modal-icon.info {
  background: #dbeafe;
  color: #3b82f6;
}
.modal-header h3 {
  flex: 1;
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
.confirmation-text {
  color: #64748b;
  margin-bottom: 1rem;
}
.confirmation-details {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
}
.detail-row {
  display: flex;
  padding: 0.4rem 0;
  border-bottom: 1px solid #eef2f6;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-row .label {
  width: 130px;
  color: #64748b;
  font-weight: 500;
}
.detail-row .value {
  color: #0f172a;
  font-weight: 500;
}
.detail-row .value.highlight {
  color: #3b82f6;
}
.detail-row .value.currency {
  color: #10b981;
}
.detail-row.highlight-row {
  background: #eef2ff;
  margin: 0 -0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 0.25rem;
}
.image-preview-small {
  max-width: 100px;
}
.image-preview-small img {
  width: 100%;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
}
.warning-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 0.5rem;
  color: #92400e;
  font-size: 0.875rem;
  margin-top: 1rem;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.saved-confirmation {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}
.saved-icon {
  font-size: 3rem;
  color: #10b981;
  margin-bottom: 0.5rem;
}
.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
@media (max-width: 640px) {
  .ocr-reading-container {
    padding: 0.75rem;
  }
  .form-actions {
    flex-direction: column;
  }
  .btn-primary,
  .btn-success,
  .btn-secondary {
    justify-content: center;
  }
  .results-grid {
    grid-template-columns: 1fr;
  }
  .detail-row {
    flex-direction: column;
  }
  .detail-row .label {
    width: auto;
  }
  .modal-content.confirmation-modal {
    width: 95%;
  }
}
/* Camera/Upload area */
.camera-upload-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.btn-camera,
.btn-upload {
  padding: 0.5rem 0.6rem;
  border-radius: 0.95rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.btn-camera {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}
.btn-camera:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}
.btn-upload {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}
.btn-upload:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}
.btn-camera:disabled,
.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.upload-divider {
  color: #94a3b8;
  font-size: 0.875rem;
}

/* Image Preview */
.image-preview-wrapper {
  margin-top: 0.75rem;
}
.image-preview-card {
  position: relative;
  display: inline-block;
  max-width: 320px;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 2px solid #e2e8f0;
  transition: all 0.3s;
}
.image-preview-card:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}
.preview-image {
  width: 100%;
  height: auto;
  display: block;
}
.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: center;
}
.reading-badge {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.reading-badge i {
  color: #3b82f6;
}
.reading-badge.empty {
  opacity: 0.7;
}
.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}
.remove-image-btn:hover:not(:disabled) {
  transform: scale(1.1);
  background: #dc2626;
}
.remove-image-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.image-caption {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  text-align: center;
}
/* Styles for smaller camera modal */
.camera-modal {
  background: #1e293b;
  border-radius: 1rem;
  width: 90%;
  max-width: 380px; /* smaller */
  overflow: hidden;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #0f172a;
}
.camera-header h3 {
  margin: 0;
  font-size: 1rem;
}
.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}
.camera-body {
  background: #000;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}
.camera-video,
.captured-preview {
  width: 100%;
  max-width: 300px;
  max-height: 300px;
  border-radius: 0.5rem;
  object-fit: contain;
}
.camera-footer {
  padding: 0.75rem;
  background: #0f172a;
}
.camera-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
.camera-actions .btn-secondary,
.camera-actions .btn-primary,
.camera-actions .btn-success {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
}
.camera-actions .btn-secondary {
  background: #334155;
  color: white;
}
.camera-actions .btn-secondary:hover {
  background: #475569;
}
.camera-actions .btn-primary {
  background: #3b82f6;
  color: white;
}
.camera-actions .btn-primary:hover {
  background: #2563eb;
}
.camera-actions .btn-success {
  background: #10b981;
  color: white;
}
.camera-actions .btn-success:hover {
  background: #059669;
}
</style>
