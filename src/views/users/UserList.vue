<template>
  <div class="user-page">
    <div class="list-card">
      <!-- Header -->
      <header class="list-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="fas fa-users-cog"></i>
          </div>
          <div>
            <h2>Watumiaji</h2>
            <p class="subtitle">Orodha ya watumiaji wote wa mfumo</p>
          </div>
        </div>

        <button class="btn-create" @click="openCreate">
          <i class="fas fa-user-plus"></i>
          Ongeza Mtumiaji
        </button>
      </header>

      <!-- Summary strip -->
      <div class="summary-strip" v-if="users.length">
        <div class="summary-item">
          <span class="summary-label">Jumla ya Watumiaji</span>
          <span class="summary-value">{{ formatNumber(userStore.total || users.length) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Wanaotumika</span>
          <span class="summary-value">{{ formatNumber(activeCount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Wasimamizi</span>
          <span class="summary-value">{{ formatNumber(adminCount) }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="userStore.loading" class="loading-inline">
        <div class="spinner-sm"></div>
        <span>Inapakia watumiaji...</span>
      </div>

      <!-- Error -->
      <div v-else-if="userStore.error" class="error-inline">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ userStore.error }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="!users.length" class="empty-inline">
        <i class="fas fa-user-slash"></i>
        <span>Hakuna watumiaji waliosajiliwa bado.</span>
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table class="user-table">
          <thead>
            <tr>
              <th>Jina Kamili</th>
              <th>Barua Pepe</th>
              <th>Namba ya Simu</th>
              <th>Nafasi</th>
              <th>Wajibu</th>
              <th class="text-center">Hali</th>
              <th class="text-center">Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>
                <div class="user-cell">
                  <img :src="avatarFor(u)" :alt="fullName(u)" class="cell-avatar" />
                  <span class="user-name">{{ fullName(u) }}</span>
                </div>
              </td>
              <td>
                <span class="desc" :title="u.email">{{ u.email || '—' }}</span>
              </td>
              <td>
                <a
                  v-if="u.phone"
                  :href="`tel:${u.phone}`"
                  class="phone-link"
                  :title="`Piga simu ${u.phone}`"
                >
                  <i class="fas fa-phone-alt"></i>
                  {{ formatPhone(u.phone) }}
                </a>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span v-if="u.position" class="position-tag">
                  <i class="fas fa-briefcase"></i>
                  {{ u.position }}
                </span>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span class="role-badge" :class="'role-' + (u.role || 'viewer')">
                  {{ roleLabel(u.role) }}
                </span>
              </td>
              <td class="text-center">
                <span class="status-badge" :class="u.is_active ? 'active' : 'inactive'">
                  {{ u.is_active ? 'Hai' : 'Imesimamishwa' }}
                </span>
              </td>
              <td class="text-center">
                <div class="action-group">
                  <button class="btn-icon edit" @click="openEdit(u)" title="Hariri">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button
                    class="btn-icon danger"
                    @click="confirmDelete(u)"
                    title="Futa"
                    :disabled="u.id === currentUserId"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ---------- CREATE / EDIT MODAL ---------- -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <header class="modal-header">
          <div>
            <h3>{{ isEditing ? 'Hariri Mtumiaji' : 'Ongeza Mtumiaji' }}</h3>
            <p class="modal-subtitle">
              {{ isEditing ? 'Badilisha taarifa za mtumiaji' : 'Jaza taarifa za mtumiaji mpya' }}
            </p>
          </div>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </header>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- First Name + Last Name -->
          <div class="form-row">
            <div class="form-group">
              <label for="first_name">Jina la Kwanza *</label>
              <input
                id="first_name"
                type="text"
                class="form-control"
                :class="{ 'has-error': fieldErrors.first_name }"
                v-model="form.first_name"
                placeholder="mfano: Juma"
                autocomplete="given-name"
              />
              <small v-if="fieldErrors.first_name" class="field-error">
                <i class="fas fa-exclamation-circle"></i> {{ fieldErrors.first_name }}
              </small>
            </div>

            <div class="form-group">
              <label for="last_name">Jina la Mwisho *</label>
              <input
                id="last_name"
                type="text"
                class="form-control"
                :class="{ 'has-error': fieldErrors.last_name }"
                v-model="form.last_name"
                placeholder="mfano: Ramadhan"
                autocomplete="family-name"
              />
              <small v-if="fieldErrors.last_name" class="field-error">
                <i class="fas fa-exclamation-circle"></i> {{ fieldErrors.last_name }}
              </small>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Barua Pepe *</label>
            <div class="input-with-icon" :class="{ 'has-error': fieldErrors.email }">
              <span class="input-prefix"><i class="fas fa-envelope"></i></span>
              <input
                id="email"
                type="email"
                class="form-control"
                v-model="form.email"
                placeholder="juma@ramajo.co.tz"
                autocomplete="email"
              />
            </div>
            <small v-if="fieldErrors.email" class="field-error">
              <i class="fas fa-exclamation-circle"></i> {{ fieldErrors.email }}
            </small>
          </div>

          <!-- Phone -->
          <div class="form-group">
            <label for="phone">Namba ya Simu *</label>
            <div class="input-with-icon" :class="{ 'has-error': fieldErrors.phone }">
              <span class="input-prefix"><i class="fas fa-phone"></i></span>
              <input
                id="phone"
                type="tel"
                class="form-control"
                v-model="form.phone"
                placeholder="0712 345 678"
                autocomplete="tel"
              />
            </div>
            <small v-if="fieldErrors.phone" class="field-error">
              <i class="fas fa-exclamation-circle"></i> {{ fieldErrors.phone }}
            </small>
            <small v-else class="field-hint"> Muundo: 0712 345 678 au +255 712 345 678 </small>
          </div>

          <!-- Position -->
          <div class="form-group">
            <label for="position">Nafasi (Position) *</label>
            <div class="input-with-icon" :class="{ 'has-error': fieldErrors.position }">
              <span class="input-prefix"><i class="fas fa-briefcase"></i></span>
              <input
                id="position"
                type="text"
                class="form-control"
                v-model="form.position"
                placeholder="mfano: Meneja wa Tawi, Fundi, Mkusanyaji"
              />
            </div>
            <small v-if="fieldErrors.position" class="field-error">
              <i class="fas fa-exclamation-circle"></i> {{ fieldErrors.position }}
            </small>
          </div>

          <!-- Role -->
          <div class="form-group">
            <label for="role">Wajibu (Role) *</label>
            <select
              id="role"
              class="form-control"
              :class="{ 'has-error': fieldErrors.role }"
              v-model="form.role"
            >
              <option value="admin">Msimamizi Mkuu</option>
              <option value="meneja">Meneja</option>
              <option value="mkusanyaji">Mkusanyaji</option>
            </select>
            <small v-if="fieldErrors.role" class="field-error">
              <i class="fas fa-exclamation-circle"></i> {{ fieldErrors.role }}
            </small>
          </div>

          <!-- Password (required on create, optional on edit) -->
          <div class="form-group">
            <label for="password">
              Neno la Siri <span v-if="!isEditing">*</span>
              <span v-else class="optional-tag">(acha wazi kama hutaki kubadilisha)</span>
            </label>
            <div class="input-with-icon" :class="{ 'has-error': fieldErrors.password }">
              <span class="input-prefix"><i class="fas fa-lock"></i></span>
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                v-model="form.password"
                :placeholder="isEditing ? 'Acha wazi kubaki ile ile' : 'Angalau herufi 6'"
                minlength="6"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="input-suffix"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ficha neno la siri' : 'Onyesha neno la siri'"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <small v-if="fieldErrors.password" class="field-error">
              <i class="fas fa-exclamation-circle"></i> {{ fieldErrors.password }}
            </small>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="password_confirmation">
              Rudia Neno la Siri <span v-if="!isEditing">*</span>
            </label>
            <div class="input-with-icon">
              <span class="input-prefix"><i class="fas fa-lock"></i></span>
              <input
                id="password_confirmation"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                v-model="form.password_confirmation"
                :placeholder="isEditing ? 'Rudia neno jipya' : 'Rudia neno la siri'"
                minlength="6"
                autocomplete="new-password"
              />
            </div>
          </div>

          <!-- Active toggle -->
          <div class="form-group">
            <label class="switch-row">
              <input type="checkbox" v-model="form.is_active" />
              <span class="switch"></span>
              <span class="switch-label">Mtumiaji anaweza kuingia (Hai)</span>
            </label>
          </div>

          <!-- Global error -->
          <p v-if="modalError" class="msg error-msg">
            <i class="fas fa-exclamation-circle"></i> {{ modalError }}
          </p>

          <!-- Actions -->
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Ghairi</button>
            <button type="submit" class="btn-save" :disabled="!canSave || userStore.submitting">
              <i v-if="userStore.submitting" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas" :class="isEditing ? 'fa-check' : 'fa-save'"></i>
              {{ userStore.submitting ? 'Inatuma...' : isEditing ? 'Sasisha' : 'Hifadhi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { formatNumber } from '@/utils/formatters'

const userStore = useUserStore()
const authStore = useAuthStore()

/* ---------- State ---------- */
const showModal = ref(false)
const showPassword = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const modalError = ref('')
const fieldErrors = ref({})

const emptyForm = () => ({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  position: '',
  role: 'collector',
  password: '',
  password_confirmation: '',
  is_active: true,
})

const form = ref(emptyForm())

/* ---------- Computed ---------- */
const users = computed(() => userStore.users ?? [])
const currentUserId = computed(() => authStore.user?.id)
const activeCount = computed(() => users.value.filter((u) => u.is_active).length)
const adminCount = computed(() => users.value.filter((u) => u.role === 'admin').length)
const withPhoneCount = computed(
  () => users.value.filter((u) => u.phone && String(u.phone).trim()).length,
)

const canSave = computed(() => {
  const f = form.value
  const phoneOk = /^(\+?255|0)\d{9}$/.test(f.phone.replace(/\s/g, ''))

  /* Password rules: required on create, optional on edit */
  const passwordOk = isEditing.value
    ? f.password === '' || f.password.length >= 6
    : f.password.length >= 6

  const matchOk = f.password === f.password_confirmation

  return (
    !!f.first_name.trim() &&
    !!f.last_name.trim() &&
    !!f.email.trim() &&
    !!f.position.trim() &&
    !!f.role &&
    phoneOk &&
    passwordOk &&
    matchOk
  )
})

/* ---------- Load ---------- */
onMounted(async () => {
  try {
    await userStore.fetchUsers()
  } catch (err) {
    console.error('fetchUsers error:', err)
  }
})

/* ---------- Helpers ---------- */
const roleLabel = (role) => {
  const map = {
    admin: 'Msimamizi Mkuu',
    manager: 'Meneja',
    collector: 'Mkusanyaji',
    viewer: 'Mtazamaji',
  }
  return map[role] || role || '—'
}

const fullName = (u) => {
  const f = `${u.first_name || ''} ${u.last_name || ''}`.trim()
  return f || u.name || '—'
}

const avatarFor = (u) => {
  const first = (u.first_name || u.name || '').charAt(0)
  const last = (u.last_name || '').charAt(0)
  const initials = (first + last).toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1e88e5&color=fff&size=64&bold=true`
}

const formatPhone = (phone) => {
  if (!phone) return ''
  let digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('255')) digits = '0' + digits.slice(3)
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return phone
}

/* ---------- Modal ---------- */
const resetFormState = () => {
  form.value = emptyForm()
  modalError.value = ''
  fieldErrors.value = {}
  showPassword.value = false
  isEditing.value = false
  editingId.value = null
}

const openCreate = () => {
  resetFormState()
  showModal.value = true
}

const openEdit = (user) => {
  resetFormState()
  isEditing.value = true
  editingId.value = user.id

  form.value = {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    position: user.position || '',
    role: user.role || 'collector',
    password: '',
    password_confirmation: '',
    is_active: user.is_active !== undefined ? !!user.is_active : true,
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetFormState()
}

/* ---------- Submit (create or update) ---------- */
const handleSubmit = async () => {
  if (!canSave.value) return

  modalError.value = ''
  fieldErrors.value = {}

  /* Build payload */
  const payload = {
    first_name: form.value.first_name.trim(),
    last_name: form.value.last_name.trim(),
    email: form.value.email.trim(),
    phone: form.value.phone.trim(),
    position: form.value.position.trim(),
    role: form.value.role,
    is_active: form.value.is_active,
  }

  /* Only include password if it has been filled */
  if (form.value.password) {
    payload.password = form.value.password
    payload.password_confirmation = form.value.password_confirmation
  }

  try {
    if (isEditing.value) {
      await userStore.updateUser(editingId.value, payload)
    } else {
      await userStore.createUser(payload)
    }
    closeModal()
  } catch (err) {
    /* Extract field errors from the API */
    fieldErrors.value = err?.fieldErrors || {}

    /* Show a top-level message */
    modalError.value =
      err?.response?.data?.message ||
      userStore.error ||
      (isEditing.value ? 'Imeshindwa kusasisha mtumiaji.' : 'Imeshindwa kuongeza mtumiaji.')
  }
}

/* ---------- Delete ---------- */
const confirmDelete = async (user) => {
  if (user.id === currentUserId.value) {
    alert('Hauwezi kufuta akaunti yako mwenyewe.')
    return
  }
  if (!confirm(`Futa mtumiaji "${fullName(user)}"?`)) return

  try {
    await userStore.deleteUser(user.id)
  } catch (err) {
    alert(err?.message || 'Imeshindwa kufuta mtumiaji.')
  }
}
</script>

<style scoped>
/* ... existing styles ... */

/* ADD: action group for edit + delete buttons */
.action-group {
  display: inline-flex;
  gap: 0.35rem;
  justify-content: center;
}

/* ADD: edit button variant */
.btn-icon.edit {
  background: #e3f2fd;
  color: #0d47a1;
}
.btn-icon.edit:hover {
  background: #1e88e5;
  color: #fff;
}

/* ADD: field-level error */
.field-error {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #c62828;
  margin-top: 0.15rem;
}
.field-error i {
  font-size: 0.7rem;
}

/* ADD: has-error state */
.form-control.has-error,
.input-with-icon.has-error {
  border-color: #c62828;
  background: #fdecea;
}
.form-control.has-error:focus,
.input-with-icon.has-error:focus-within {
  box-shadow: 0 0 0 4px rgba(198, 40, 40, 0.12);
}

/* ADD: optional tag */
.optional-tag {
  font-size: 0.7rem;
  color: #8a95a8;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  margin-left: 0.35rem;
}

.user-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.list-card {
  background: #ffffff;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* Header */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #fff;
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  box-shadow: 0 8px 14px rgba(30, 136, 229, 0.25);
  flex-shrink: 0;
}
.list-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a2634;
}
.subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  color: #5e6f8d;
}

/* Create button */
.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  color: #ffffff;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(30, 136, 229, 0.25);
  transition: all 0.2s ease;
  white-space: nowrap;
}
.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(30, 136, 229, 0.35);
}

/* Summary */
.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-radius: 0.85rem;
  border: 1px solid rgba(30, 136, 229, 0.2);
  margin-bottom: 1.25rem;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.summary-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #0d47a1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.summary-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1a2634;
  letter-spacing: -0.02em;
}

/* Table */
.table-wrap {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}
.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.user-table th {
  background: #f8fafc;
  color: #5e6f8d;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.user-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #f1f3f8;
  color: #1a2634;
  vertical-align: middle;
}
.user-table tbody tr:last-child td {
  border-bottom: none;
}
.user-table tbody tr:hover {
  background: #f8fafc;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.cell-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  object-fit: cover;
  flex-shrink: 0;
}
.user-name {
  font-weight: 600;
  color: #1a2634;
}
.desc {
  display: block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #5e6f8d;
  font-size: 0.82rem;
}

/* Phone link */
.phone-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.phone-link i {
  font-size: 0.7rem;
}
.phone-link:hover {
  background: #2e7d32;
  color: #fff;
  transform: translateY(-1px);
}

/* Position tag */
.position-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  background: #eef2f7;
  color: #2c3e66;
  border-radius: 0.4rem;
  font-size: 0.78rem;
  font-weight: 500;
}
.position-tag i {
  font-size: 0.7rem;
  color: #5e6f8d;
}

/* Role badges */
.role-badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.role-admin {
  background: #fdecea;
  color: #c62828;
}
.role-manager {
  background: #e3f2fd;
  color: #0d47a1;
}
.role-collector {
  background: #e8f5e9;
  color: #2e7d32;
}
.role-viewer {
  background: #f1f3f8;
  color: #5e6f8d;
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}
.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}
.status-badge.inactive {
  background: #f1f3f8;
  color: #8a95a8;
}

.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.muted {
  color: #b0b8c7;
}

/* Icon button */
.btn-icon {
  width: 34px;
  height: 34px;
  border-radius: 0.5rem;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.85rem;
}
.btn-icon.danger {
  background: #fdecea;
  color: #c62828;
}
.btn-icon.danger:hover:not(:disabled) {
  background: #c62828;
  color: #fff;
}
.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Inline states */
.loading-inline,
.empty-inline,
.error-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 2.5rem 1rem;
  border-radius: 0.85rem;
  font-size: 0.95rem;
  background: #f8fafc;
  color: #5e6f8d;
}
.empty-inline i {
  font-size: 1.4rem;
  color: #b0b8c7;
}
.error-inline {
  background: #fdecea;
  color: #c62828;
}
.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-top-color: #1e88e5;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 560px;
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.2s ease;
  max-height: 92vh;
  overflow-y: auto;
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #1a2634;
}
.modal-subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: #5e6f8d;
}
.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  background: #f1f3f8;
  border: none;
  color: #5e6f8d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.modal-close:hover {
  background: #e2e8f0;
  color: #1a2634;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.form-group > label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #2c3e66;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.form-control {
  width: 100%;
  padding: 0.7rem 0.95rem;
  font-size: 0.92rem;
  border-radius: 0.7rem;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #1a2634;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}
.form-control:focus {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.12);
}
.field-hint {
  font-size: 0.72rem;
  color: #8a95a8;
  margin-top: 0.15rem;
}

/* Two-column row for first/last name */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

/* Inputs with icon prefixes */
.input-with-icon {
  display: flex;
  align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.7rem;
  background: #f8fafc;
  overflow: hidden;
  transition: all 0.2s ease;
}
.input-with-icon:focus-within {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.12);
}
.input-prefix,
.input-suffix {
  padding: 0.7rem 0.85rem;
  background: #eef2f7;
  font-size: 0.85rem;
  color: #5e6f8d;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.input-prefix {
  border-right: 1.5px solid #e2e8f0;
}
.input-suffix {
  border-left: 1.5px solid #e2e8f0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #5e6f8d;
  padding: 0.7rem 0.85rem;
}
.input-suffix:hover {
  color: #1e88e5;
}
.input-with-icon .form-control {
  border: none;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}
.input-with-icon .form-control:focus {
  box-shadow: none;
}

/* Toggle switch */
.switch-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.88rem;
  color: #2c3e66;
  text-transform: none;
  letter-spacing: 0;
}
.switch-row input[type='checkbox'] {
  display: none;
}
.switch {
  position: relative;
  width: 42px;
  height: 24px;
  background: #cbd5e1;
  border-radius: 999px;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.switch-row input:checked + .switch {
  background: #1e88e5;
}
.switch-row input:checked + .switch::after {
  transform: translateX(18px);
}
.switch-label {
  font-weight: 500;
}

/* Messages */
.msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.9rem;
  border-radius: 0.7rem;
  font-size: 0.85rem;
  margin: 0;
}
.error-msg {
  background: #fdecea;
  color: #c62828;
}

/* Modal actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.5rem;
}
.btn-cancel,
.btn-save {
  padding: 0.7rem 1.2rem;
  border-radius: 0.7rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.btn-cancel {
  background: #f1f3f8;
  color: #2c3e66;
}
.btn-cancel:hover {
  background: #e2e8f0;
}
.btn-save {
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  color: #ffffff;
  box-shadow: 0 6px 12px rgba(30, 136, 229, 0.25);
}
.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(30, 136, 229, 0.35);
}
.btn-save:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 1024px) {
  .summary-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .list-card {
    padding: 1.25rem;
    border-radius: 1rem;
  }
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-create {
    width: 100%;
    justify-content: center;
  }
  .summary-strip {
    grid-template-columns: 1fr;
  }
  .user-table th,
  .user-table td {
    padding: 0.6rem 0.7rem;
    font-size: 0.8rem;
  }
  .desc {
    max-width: 140px;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
