<!-- views/profile/UserProfile.vue -->
<template>
  <div class="profile-container">
    <!-- Header -->
    <div class="profile-header">
      <h1>Wasifu Wangu</h1>
      <p>Angalia Taarifa Binafsi</p>
    </div>

    <div class="profile-grid">
      <!-- Left Column - Avatar & Info -->
      <div class="profile-left">
        <div class="avatar-card">
          <div class="avatar-container">
            <img
              :src="userAvatar"
              :alt="user.name"
              class="avatar-image"
              @error="handleImageError"
            />
            <div class="avatar-overlay">
              <button class="avatar-edit-btn" @click="triggerFileInput">
                <i class="fas fa-camera"></i>
              </button>
            </div>
          </div>
          <input
            type="file"
            ref="fileInput"
            class="hidden-input"
            accept="image/*"
            @change="handleAvatarUpload"
          />

          <h2 class="user-name">{{ user.name }}</h2>
          <p class="user-role">{{ formatRole(user.role) }}</p>

          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-label">Member since</span>
              <span class="stat-value">{{ formatDate(user.created_at) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Last login</span>
              <span class="stat-value">{{ user.last_login || 'Never' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Email verified</span>
              <span class="stat-value">
                <i
                  :class="
                    user.email_verified
                      ? 'fas fa-check-circle text-success'
                      : 'fas fa-times-circle text-danger'
                  "
                ></i>
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h3>Quick Actions</h3>
          <button
            @click="activeTab = 'profile'"
            class="action-btn"
            :class="{ active: activeTab === 'profile' }"
          >
            <i class="fas fa-user"></i>
            <span>Edit Profile</span>
          </button>
          <button
            @click="activeTab = 'security'"
            class="action-btn"
            :class="{ active: activeTab === 'security' }"
          >
            <i class="fas fa-shield-alt"></i>
            <span>Security</span>
          </button>
          <button
            @click="activeTab = 'activity'"
            class="action-btn"
            :class="{ active: activeTab === 'activity' }"
          >
            <i class="fas fa-history"></i>
            <span>Activity Log</span>
          </button>
        </div>
      </div>

      <!-- Right Column - Content -->
      <div class="profile-right">
        <!-- Profile Form -->
        <div v-if="activeTab === 'profile'" class="content-card">
          <h2>Edit Profile</h2>

          <!-- Success Message -->
          <div v-if="profileSuccess" class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            {{ profileSuccess }}
          </div>

          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label for="name">
                <i class="fas fa-user"></i>
                Full Name
              </label>
              <input
                type="text"
                id="name"
                v-model="profileForm.name"
                class="form-control"
                :class="{ 'is-invalid': profileErrors.name }"
                placeholder="Enter your full name"
              />
              <span v-if="profileErrors.name" class="error-text">
                {{ profileErrors.name[0] }}
              </span>
            </div>

            <div class="form-group">
              <label for="email">
                <i class="fas fa-envelope"></i>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                v-model="profileForm.email"
                class="form-control"
                :class="{ 'is-invalid': profileErrors.email }"
                placeholder="Enter your email"
              />
              <span v-if="profileErrors.email" class="error-text">
                {{ profileErrors.email[0] }}
              </span>
            </div>

            <div class="form-group">
              <label for="phone">
                <i class="fas fa-phone"></i>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                v-model="profileForm.phone"
                class="form-control"
                :class="{ 'is-invalid': profileErrors.phone }"
                placeholder="Enter your phone number"
              />
              <span v-if="profileErrors.phone" class="error-text">
                {{ profileErrors.phone[0] }}
              </span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="profileLoading">
                <span v-if="profileLoading" class="spinner"></span>
                <span v-else>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Security Tab -->
        <div v-if="activeTab === 'security'" class="content-card">
          <h2>Change Password</h2>

          <!-- Password Success -->
          <div v-if="passwordSuccess" class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            {{ passwordSuccess }}
          </div>

          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label for="current_password">
                <i class="fas fa-lock"></i>
                Current Password
              </label>
              <div class="password-input">
                <input
                  :type="showCurrentPassword ? 'text' : 'password'"
                  id="current_password"
                  v-model="passwordForm.current_password"
                  class="form-control"
                  :class="{ 'is-invalid': passwordErrors.current_password }"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  @click="showCurrentPassword = !showCurrentPassword"
                  class="password-toggle"
                >
                  <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <span v-if="passwordErrors.current_password" class="error-text">
                {{ passwordErrors.current_password[0] }}
              </span>
            </div>

            <div class="form-group">
              <label for="new_password">
                <i class="fas fa-key"></i>
                New Password
              </label>
              <div class="password-input">
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  id="new_password"
                  v-model="passwordForm.new_password"
                  class="form-control"
                  :class="{ 'is-invalid': passwordErrors.new_password }"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="password-toggle"
                >
                  <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <span v-if="passwordErrors.new_password" class="error-text">
                {{ passwordErrors.new_password[0] }}
              </span>
            </div>

            <div class="form-group">
              <label for="new_password_confirmation">
                <i class="fas fa-check-circle"></i>
                Confirm New Password
              </label>
              <div class="password-input">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="new_password_confirmation"
                  v-model="passwordForm.new_password_confirmation"
                  class="form-control"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="password-toggle"
                >
                  <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="passwordForm.revoke_other_tokens" />
                <span class="checkmark"></span>
                <span>Log out from other devices</span>
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="passwordLoading">
                <span v-if="passwordLoading" class="spinner"></span>
                <span v-else>Change Password</span>
              </button>
            </div>
          </form>

          <hr class="divider" />

          <h3>Two-Factor Authentication</h3>
          <p class="text-muted">Add an extra layer of security to your account</p>

          <button class="btn-secondary" @click="setup2FA" :disabled="true">
            <i class="fas fa-mobile-alt"></i>
            Setup 2FA (Coming Soon)
          </button>
        </div>

        <!-- Activity Log Tab -->
        <div v-if="activeTab === 'activity'" class="content-card">
          <h2>Activity Log</h2>

          <div v-if="activitiesLoading" class="text-center py-4">
            <div class="spinner"></div>
            <p>Loading activities...</p>
          </div>

          <div v-else-if="activities.length === 0" class="empty-state">
            <i class="fas fa-history empty-icon"></i>
            <p>No activities found</p>
          </div>

          <div v-else class="activity-timeline">
            <div v-for="activity in activities" :key="activity.id" class="activity-item">
              <div class="activity-icon">
                <i class="fas fa-sign-in-alt"></i>
              </div>
              <div class="activity-details">
                <div class="activity-header">
                  <span class="activity-title">Login</span>
                  <span class="activity-time">{{ formatTimeAgo(activity.login_at) }}</span>
                </div>
                <div class="activity-meta">
                  <span><i class="fas fa-globe"></i> {{ activity.ip_address }}</span>
                  <span
                    ><i class="fas fa-device"></i> {{ formatUserAgent(activity.user_agent) }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div v-if="hasMoreActivities" class="text-center mt-4">
            <button @click="loadMoreActivities" class="btn-secondary">Load More</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Avatar Upload Modal -->
    <div v-if="showAvatarModal" class="modal-overlay" @click="closeAvatarModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Update Profile Picture</h3>
          <button class="close-btn" @click="closeAvatarModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="avatar-preview">
            <img :src="avatarPreview" alt="Preview" class="preview-image" />
          </div>
          <div class="avatar-actions">
            <button class="btn-secondary" @click="triggerFileInput">
              <i class="fas fa-upload"></i>
              Choose Different
            </button>
            <button class="btn-primary" @click="uploadAvatar" :disabled="avatarUploading">
              <span v-if="avatarUploading" class="spinner"></span>
              <span v-else>Upload</span>
            </button>
            <button v-if="user.avatar" class="btn-danger" @click="removeAvatar">
              <i class="fas fa-trash"></i>
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const authStore = useAuthStore()

// State
const user = computed(() => authStore.user || {})
const activeTab = ref('profile')
const fileInput = ref(null)

// Profile Form
const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
})
const profileErrors = ref({})
const profileSuccess = ref('')
const profileLoading = ref(false)

// Password Form
const passwordForm = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
  revoke_other_tokens: false,
})
const passwordErrors = ref({})
const passwordSuccess = ref('')
const passwordLoading = ref(false)

// Password visibility
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Avatar
const showAvatarModal = ref(false)
const avatarPreview = ref('')
const avatarUploading = ref(false)
const avatarFile = ref(null)

// Activities
const activities = ref([])
const activitiesLoading = ref(false)
const currentPage = ref(1)
const hasMoreActivities = ref(false)

// Initialize form with user data
onMounted(() => {
  profileForm.name = user.value.name || ''
  profileForm.email = user.value.email || ''
  profileForm.phone = user.value.phone || ''

  if (activeTab.value === 'activity') {
    fetchActivities()
  }
})

// Computed
// const userAvatar = computed(() => {
//   return user.value.avatar || '//assets/images/avator_.png'
// })

const userAvatar = computed(() => {
  return '/assets/images/avator_.png'
})
// Methods
const handleImageError = (e) => {
  e.target.src = '/default-avatar.png'
}

const formatRole = (role) => {
  const roles = {
    admin: 'Msimamizi',
    'super-admin': 'Msimamizi Mkuu',
    manager: 'Meneja',
    user: 'Mtumiaji',
    'loan-officer': 'Afisa Mkopo',
    accountant: 'Mhasibu',
  }
  return roles[role] || role || 'Mtumiaji'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('sw-TZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000) // seconds

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  return `${Math.floor(diff / 86400)} days ago`
}

const formatUserAgent = (ua) => {
  if (!ua) return 'Unknown device'

  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('iPhone')) return 'iPhone'
  if (ua.includes('Android')) return 'Android'

  return 'Unknown device'
}

// Profile Update
const updateProfile = async () => {
  profileLoading.value = true
  profileErrors.value = {}
  profileSuccess.value = ''

  try {
    const response = await authStore.api.put('/profile', profileForm)

    profileSuccess.value = 'Profile updated successfully'

    // Update user in store
    if (response.data.data?.user) {
      authStore.user = { ...authStore.user, ...response.data.data.user }
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      profileSuccess.value = ''
    }, 3000)
  } catch (error) {
    if (error.response?.status === 422) {
      profileErrors.value = error.response.data.errors || {}
    } else {
      console.error('Profile update failed:', error)
    }
  } finally {
    profileLoading.value = false
  }
}

// Change Password
const changePassword = async () => {
  passwordLoading.value = true
  passwordErrors.value = {}
  passwordSuccess.value = ''

  try {
    await authStore.api.post('/profile/change-password', passwordForm)

    passwordSuccess.value = 'Password changed successfully'

    // Clear form
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.new_password_confirmation = ''
    passwordForm.revoke_other_tokens = false

    // Clear success message after 3 seconds
    setTimeout(() => {
      passwordSuccess.value = ''
    }, 3000)
  } catch (error) {
    if (error.response?.status === 422) {
      passwordErrors.value = error.response.data.errors || {}
    } else {
      console.error('Password change failed:', error)
    }
  } finally {
    passwordLoading.value = false
  }
}

// Avatar handling
const triggerFileInput = () => {
  fileInput.value.click()
}

const handleAvatarUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('Image size should be less than 2MB')
    return
  }

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
  showAvatarModal.value = true
}

const uploadAvatar = async () => {
  if (!avatarFile.value) return

  avatarUploading.value = true

  const formData = new FormData()
  formData.append('avatar', avatarFile.value)

  try {
    const response = await authStore.api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    // Update user avatar in store
    if (response.data.data?.avatar_url) {
      authStore.user.avatar = response.data.data.avatar_url
    }

    closeAvatarModal()
  } catch (error) {
    console.error('Avatar upload failed:', error)
    alert('Failed to upload avatar')
  } finally {
    avatarUploading.value = false
  }
}

const removeAvatar = async () => {
  if (!confirm('Are you sure you want to remove your profile picture?')) return

  try {
    await authStore.api.delete('/profile/avatar')

    // Remove avatar from store
    authStore.user.avatar = null

    closeAvatarModal()
  } catch (error) {
    console.error('Avatar removal failed:', error)
    alert('Failed to remove avatar')
  }
}

const closeAvatarModal = () => {
  showAvatarModal.value = false
  avatarFile.value = null
  avatarPreview.value = ''

  // Clear file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Activities
const fetchActivities = async (page = 1) => {
  activitiesLoading.value = true

  try {
    const response = await authStore.api.get('/profile/activity', {
      params: { page },
    })

    const newActivities = response.data.data?.activities?.data || []

    if (page === 1) {
      activities.value = newActivities
    } else {
      activities.value = [...activities.value, ...newActivities]
    }

    currentPage.value = page
    hasMoreActivities.value = newActivities.length === 10 // Assuming per_page = 10
  } catch (error) {
    console.error('Failed to fetch activities:', error)
  } finally {
    activitiesLoading.value = false
  }
}

const loadMoreActivities = () => {
  fetchActivities(currentPage.value + 1)
}

// Watch for tab changes
const watchTab = (newTab) => {
  if (newTab === 'activity' && activities.value.length === 0) {
    fetchActivities()
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  /* padding: 2rem; */
}

.profile-header {
  /* margin-bottom: 2rem; */
}

.profile-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.profile-header p {
  color: #7f8c8d;
  font-size: 1rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

/* Left Column */
.profile-left {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.avatar-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.avatar-container {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 1.5rem;
  cursor: pointer;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-edit-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}

.avatar-edit-btn:hover {
  transform: scale(1.1);
}

.hidden-input {
  display: none;
}

.user-name {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.user-role {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.user-stats {
  text-align: left;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ecf0f1;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.stat-value {
  color: #2c3e50;
  font-weight: 500;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.quick-actions h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.action-btn i {
  width: 20px;
}

.action-btn:hover {
  background: #f8f9fa;
  color: #3498db;
}

.action-btn.active {
  background: #3498db;
  color: white;
}

/* Right Column */
.content-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.content-card h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.content-card h3 {
  color: #2c3e50;
  margin: 1.5rem 0 1rem;
  font-size: 1.1rem;
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.form-group label i {
  margin-right: 0.5rem;
  color: #3498db;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dce4ec;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-control.is-invalid {
  border-color: #e74c3c;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
}

.password-toggle:hover {
  color: #3498db;
}

.error-text {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

/* Buttons */
.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary:hover {
  background: #dde4e6;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-danger:hover {
  background: #c0392b;
}

.form-actions {
  margin-top: 2rem;
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-danger {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Checkbox */
.checkbox-group {
  margin: 1rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

/* Divider */
.divider {
  margin: 2rem 0;
  border: none;
  border-top: 1px solid #ecf0f1;
}

/* Activity Timeline */
.activity-timeline {
  margin-top: 1.5rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #ecf0f1;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 36px;
  height: 36px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3498db;
}

.activity-details {
  flex: 1;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.activity-title {
  font-weight: 600;
  color: #2c3e50;
}

.activity-time {
  color: #7f8c8d;
  font-size: 0.875rem;
}

.activity-meta {
  display: flex;
  gap: 1rem;
  color: #7f8c8d;
  font-size: 0.875rem;
}

.activity-meta i {
  margin-right: 0.25rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #dce4ec;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal */
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: #2c3e50;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  font-size: 1.25rem;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

.avatar-preview {
  text-align: center;
  margin-bottom: 1.5rem;
}

.preview-image {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.avatar-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-left {
    order: 2;
  }

  .profile-right {
    order: 1;
  }
}

/* Utilities */
.text-center {
  text-align: center;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.text-muted {
  color: #7f8c8d;
}

.mt-4 {
  margin-top: 2rem;
}

.py-4 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>
