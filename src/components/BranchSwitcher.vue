<template>
  <div class="branch-switcher" :class="{ mobile: isMobile }">
    <!-- Current Branch Display -->
    <div class="current-branch" @click="toggleDropdown" ref="branchTrigger">
      <div class="branch-info">
        <i class="fas fa-map-marker-alt"></i>
        <div class="branch-details">
          <span class="branch-name">{{ branchStore.currentBranchName }}</span>
          <span class="branch-location" v-if="branchStore.currentBranchLocation">
            {{ branchStore.currentBranchLocation }}
          </span>
        </div>
      </div>
      <i class="fas fa-chevron-down" :class="{ rotated: showDropdown }"></i>
    </div>

    <!-- Branch Dropdown -->
    <div v-if="showDropdown" class="branch-dropdown" ref="dropdownRef">
      <div class="dropdown-header">
        <h4>Tawi Linalotumika</h4>
        <button class="close-dropdown" @click="showDropdown = false" v-if="isMobile">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Branches List -->
      <div class="branches-list">
        <div
          v-for="branch in branchStore.branches"
          :key="branch.id"
          class="branch-item"
          :class="{ active: branchStore.currentBranch?.id === branch.id }"
          @click="selectBranch(branch)"
        >
          <div class="branch-item-info">
            <span class="branch-item-name">{{ branch.name }}</span>
            <span class="branch-item-location">{{ branch.location }}</span>
          </div>
          <i v-if="branchStore.currentBranch?.id === branch.id" class="fas fa-check"></i>
        </div>
      </div>

      <!-- Add New Branch (Admin only) v-if="authStore.user?.role === 'admin'"-->
      <div class="dropdown-footer">
        <button class="add-branch-btn" @click="openAddBranchModal">
          <i class="fas fa-plus-circle"></i>
          <span>Ongeza Tawi Jipya</span>
        </button>
      </div>
    </div>

    <!-- Add Branch Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddBranchModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Ongeza Tawi Jipya</h3>
          <button class="close-btn" @click="closeAddBranchModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="branchName">Jina la Tawi</label>
            <input
              type="text"
              id="branchName"
              v-model="newBranch.name"
              class="form-control"
              placeholder="Mfano: Tawi la Kinondoni"
              :class="{ 'is-invalid': errors.name }"
            />
            <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="branchLocation">Eneo</label>
            <input
              type="text"
              id="branchLocation"
              v-model="newBranch.location"
              class="form-control"
              placeholder="Mfano: Dar es Salaam, Kinondoni"
              :class="{ 'is-invalid': errors.location }"
            />
            <span v-if="errors.location" class="error-text">{{ errors.location }}</span>
          </div>

          <div class="form-group">
            <label for="branchCode">Msimbo wa Tawi</label>
            <input
              type="text"
              id="branchCode"
              v-model="newBranch.code"
              class="form-control"
              placeholder="Mfano: KND"
              :class="{ 'is-invalid': errors.code }"
            />
            <span v-if="errors.code" class="error-text">{{ errors.code }}</span>
          </div>

          <div class="form-group">
            <label for="branchPhone">Namba ya Simu</label>
            <input
              type="text"
              id="branchPhone"
              v-model="newBranch.phone"
              class="form-control"
              placeholder="Mfano: 0712345678"
              :class="{ 'is-invalid': errors.phone }"
            />
            <span v-if="errors.phone" class="error-text">{{ errors.phone }}</span>
          </div>

          <div class="form-group">
            <label for="branchEmail">Barua Pepe</label>
            <input
              type="email"
              id="branchEmail"
              v-model="newBranch.email"
              class="form-control"
              placeholder="Mfano: kinondoni@tamara.co.tz"
              :class="{ 'is-invalid': errors.email }"
            />
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeAddBranchModal" class="btn-secondary">Ghairi</button>
          <button @click="addBranch" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="spinner"></span>
            <span v-else>
              <i class="fas fa-save"></i>
              Hifadhi Tawi
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useBranchStore } from '@/stores/branch'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  isMobile: {
    type: Boolean,
    default: false,
  },
})

const branchStore = useBranchStore()
const authStore = useAuthStore()

// State
const showDropdown = ref(false)
const showAddModal = ref(false)
const saving = ref(false)
const errors = ref({})
const branchTrigger = ref(null)
const dropdownRef = ref(null)

const newBranch = ref({
  name: '',
  location: '',
  code: '',
  phone: '',
  email: '',
})

// Methods
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const selectBranch = (branch) => {
  branchStore.setCurrentBranch(branch)
  showDropdown.value = false
}

const openAddBranchModal = () => {
  showAddModal.value = true
  showDropdown.value = false
  resetForm()
}

const closeAddBranchModal = () => {
  showAddModal.value = false
  resetForm()
}

const resetForm = () => {
  newBranch.value = {
    name: '',
    location: '',
    code: '',
    phone: '',
    email: '',
  }
  errors.value = {}
}

const addBranch = async () => {
  saving.value = true
  errors.value = {}

  try {
    await branchStore.createBranch(newBranch.value)
    closeAddBranchModal()
  } catch (error) {
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
    }
    console.error('Error adding branch:', error)
  } finally {
    saving.value = false
  }
}

// Handle click outside to close dropdown
const handleClickOutside = (event) => {
  if (
    showDropdown.value &&
    branchTrigger.value &&
    !branchTrigger.value.contains(event.target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    showDropdown.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.branch-switcher {
  position: relative;
}

.current-branch {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 15px;
  background: white;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
}

.current-branch:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.branch-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.branch-info i {
  color: #3498db;
  font-size: 1.1rem;
}

.branch-details {
  display: flex;
  flex-direction: column;
}

.branch-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.branch-location {
  font-size: 0.75rem;
  color: #999;
}

.current-branch i.fa-chevron-down {
  color: #999;
  transition: transform 0.3s;
}

.current-branch i.fa-chevron-down.rotated {
  transform: rotate(180deg);
}

/* Mobile styles */
.branch-switcher.mobile .current-branch {
  background: #f8fafc;
  border: none;
  padding: 5px 10px;
  min-width: auto;
}

.branch-switcher.mobile .branch-name {
  font-size: 0.85rem;
}

.branch-switcher.mobile .branch-location {
  display: none;
}

/* Dropdown */
.branch-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 300px;
  /* background: white; */
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  margin-top: 5px;
  z-index: 1000;
  animation: slideDown 0.2s ease;
  border: 1px solid #eef2f6;
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

.dropdown-header {
  padding: 15px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dropdown-header h4 {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
}

.close-dropdown {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1rem;
  padding: 5px;
}

.close-dropdown:hover {
  color: #e74c3c;
}

.branches-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}

.branch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 5px;
}

.branch-item:hover {
  background: #f8fafc;
}

.branch-item.active {
  background: #e3f2fd;
  border: 1px solid #3498db;
}

.branch-item-info {
  display: flex;
  flex-direction: column;
}

.branch-item-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.branch-item-location {
  font-size: 0.8rem;
  color: #999;
}

.branch-item i {
  color: #27ae60;
  font-size: 1rem;
}

.dropdown-footer {
  padding: 15px;
  border-top: 1px solid #eef2f6;
}

.add-branch-btn {
  width: 100%;
  padding: 10px;
  background: #e3f2fd;
  border: 1px dashed #3498db;
  border-radius: 8px;
  color: #1976d2;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.add-branch-btn:hover {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.add-branch-btn i {
  font-size: 1rem;
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
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
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
  color: #e74c3c;
}

.modal-body {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
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
}

.error-text {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 5px;
  display: block;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
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

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .branch-dropdown {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 80vh;
    border-radius: 15px 15px 0 0;
    margin-top: 0;
    animation: slideUp 0.3s ease;
  }

  .branches-list {
    max-height: 50vh;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
