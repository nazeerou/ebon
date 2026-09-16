<template>
  <div class="token-form-page">
    <div class="form-card">
      <!-- Header -->
      <header class="form-header">
        <div class="header-icon">
          <i class="fas fa-coins"></i>
        </div>
        <div>
          <h2>Rekodi Mtaji Unaoachwa</h2>
          <p class="subtitle">Rekodi kiasi cha Mtaji kwa Tawi / Eneo</p>
        </div>
      </header>

      <form @submit.prevent="handleSubmit" class="token-form">
        <!-- Branch select -->
        <div class="form-group">
          <label for="branch">Chagua Tawi</label>
          <select
            id="branch"
            v-model="selectedBranchId"
            class="form-control"
            :disabled="tokenStore.loadingBranches"
          >
            <option value="">
              {{ tokenStore.loadingBranches ? 'Inapakia matawi...' : '-- Chagua tawi --' }}
            </option>
            <option v-for="b in branches" :key="b.id" :value="b.id">
              {{ b.branch_name }}
            </option>
          </select>

          <p v-if="!tokenStore.loadingBranches && !branches.length" class="hint-inline">
            <i class="fas fa-info-circle"></i> Hakuna matawi yaliyopatikana.
          </p>
        </div>

        <!-- Machines for selected branch (view only) -->
        <div v-if="selectedBranchId" class="form-group">
          <label>Mashine za Tawi</label>

          <div v-if="tokenStore.loadingMachines" class="loading-inline">
            <div class="spinner-sm"></div>
            <span>Inapakia mashine...</span>
          </div>

          <div v-else-if="!machines.length" class="empty-inline">
            <i class="fas fa-info-circle"></i>
            <span>Hakuna mashine kwenye tawi hili.</span>
          </div>

          <div v-else class="machines-grid">
            <div v-for="m in machines" :key="m.id" class="machine-option">
              <div class="machine-info">
                <div class="machine-name">
                  <i class="fas fa-microchip"></i>
                  {{ m.name || m.serial_number || 'Mashine' }}
                </div>
                <div v-if="m.serial_number" class="machine-serial">SN: {{ m.serial_number }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Amount -->
        <div class="form-group">
          <label for="amount">Kiasi kilichoachwa </label>
          <div class="amount-input">
            <span class="currency-prefix">TZS</span>
            <input
              id="amount"
              type="number"
              class="form-control"
              v-model.number="form.amount"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        <!-- Created Date -->
        <div class="form-group">
          <label for="created_date">Tarehe </label>
          <div class="date-input">
            <span class="date-prefix">
              <i class="fas fa-calendar-day"></i>
            </span>
            <input
              id="created_date"
              type="date"
              class="form-control"
              v-model="form.created_date"
              :max="today"
            />
          </div>
        </div>

        <!-- Messages -->
        <p v-if="errorMsg" class="msg error-msg">
          <i class="fas fa-exclamation-circle"></i> {{ errorMsg }}
        </p>
        <p v-if="successMsg" class="msg success-msg">
          <i class="fas fa-check-circle"></i> {{ successMsg }}
        </p>

        <!-- Submit -->
        <button type="submit" class="btn-submit" :disabled="!canSubmit || tokenStore.submitting">
          <i v-if="tokenStore.submitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ tokenStore.submitting ? 'Inatuma...' : 'Rekodi' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTokenStore } from '@/stores/tokens'

const tokenStore = useTokenStore()

/* ---------- Helpers ---------- */
const todayISO = () => new Date().toISOString().split('T')[0]
const today = todayISO()

/* ---------- State ---------- */
const selectedBranchId = ref('')
const errorMsg = ref('')
const successMsg = ref('')

const form = ref({
  amount: null,
  created_date: todayISO(),
})

/* ---------- Computed ---------- */
const branches = computed(() => tokenStore.branches ?? [])
const machines = computed(() => tokenStore.machines ?? [])

const canSubmit = computed(
  () =>
    !!selectedBranchId.value &&
    form.value.amount !== null &&
    form.value.amount > 0 &&
    !!form.value.created_date,
)

/* ---------- Load branches on mount ---------- */
onMounted(async () => {
  try {
    await tokenStore.fetchBranches()
  } catch (err) {
    errorMsg.value = 'Imeshindwa kupakia matawi. Jaribu tena.'
    console.error('fetchBranches error:', err)
  }
})

/* ---------- When branch changes → load machines ---------- */
watch(selectedBranchId, async (newBranchId) => {
  form.value.amount = null
  errorMsg.value = ''
  successMsg.value = ''
  tokenStore.clearMachines()

  if (!newBranchId) return

  try {
    await tokenStore.fetchMachinesByBranch(newBranchId)
  } catch (err) {
    errorMsg.value = 'Imeshindwa kupakia mashine za tawi hili.'
    console.error('fetchMachinesByBranch error:', err)
  }
})

/* ---------- Submit ---------- */
const handleSubmit = async () => {
  if (!canSubmit.value) return

  errorMsg.value = ''
  successMsg.value = ''

  try {
    await tokenStore.createToken({
      branch_id: selectedBranchId.value,
      amount: form.value.amount,
      created_date: form.value.created_date,
    })

    successMsg.value = tokenStore.successMessage || 'Token imerekodiwa kikamilifu!'

    // reset amount and date back to today
    form.value.amount = null
    form.value.created_date = todayISO()

    setTimeout(() => (successMsg.value = ''), 3000)
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.message || tokenStore.error || 'Imeshindwa kurekodi token. Jaribu tena.'
    console.error('createToken error:', err)
  }
}
</script>

<style scoped>
.token-form-page {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
}

.form-card {
  background: #ffffff;
  width: 100%;
  max-width: 680px;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* Header */
.form-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
}
.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #fff;
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  box-shadow: 0 8px 14px rgba(30, 136, 229, 0.25);
  flex-shrink: 0;
}
.form-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a2634;
}
.subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.9rem;
  color: #5e6f8d;
}

/* Form */
.token-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group > label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2c3e66;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  border-radius: 0.75rem;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #1a2634;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}
.form-control:focus {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.12);
}
.form-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Machines grid — view only */
.machines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.6rem;
}
.machine-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.85rem;
  background: #f8fafc;
}
.machine-info {
  flex: 1;
  min-width: 0;
}
.machine-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a2634;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.machine-name i {
  color: #1e88e5;
  font-size: 0.85rem;
}
.machine-serial {
  font-size: 0.75rem;
  color: #5e6f8d;
  margin-top: 0.1rem;
}

/* Amount input */
.amount-input {
  display: flex;
  align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  overflow: hidden;
  transition: all 0.2s ease;
}
.amount-input:focus-within {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.12);
}
.currency-prefix {
  padding: 0.75rem 1rem;
  background: #eef2f7;
  font-size: 0.85rem;
  font-weight: 600;
  color: #5e6f8d;
  border-right: 1.5px solid #e2e8f0;
}
.amount-input .form-control {
  border: none;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}
.amount-input .form-control:focus {
  box-shadow: none;
}

/* Date input */
.date-input {
  display: flex;
  align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  overflow: hidden;
  transition: all 0.2s ease;
}
.date-input:focus-within {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.12);
}
.date-prefix {
  padding: 0.75rem 1rem;
  background: #eef2f7;
  font-size: 0.9rem;
  color: #1e88e5;
  border-right: 1.5px solid #e2e8f0;
  display: flex;
  align-items: center;
}
.date-input .form-control {
  border: none;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}
.date-input .form-control:focus {
  box-shadow: none;
}

/* Inline states */
.loading-inline,
.empty-inline,
.hint-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  color: #5e6f8d;
  background: #f8fafc;
  margin: 0;
}
.hint-inline {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  background: #fff8e1;
  color: #8d6e00;
}
.hint-inline.hint-soft {
  background: #eef6fe;
  color: #1e5a96;
}
.hint-inline i,
.empty-inline i {
  color: #fb8c00;
}
.hint-inline.hint-soft i {
  color: #1e88e5;
}
.spinner-sm {
  width: 16px;
  height: 16px;
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

/* Messages */
.msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  margin: 0;
}
.error-msg {
  background: #fdecea;
  color: #c62828;
}
.success-msg {
  background: #e8f5e9;
  color: #2e7d32;
}

/* Submit */
.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #1e88e5, #0d47a1);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 8px 16px rgba(30, 136, 229, 0.25);
  margin-top: 0.5rem;
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(30, 136, 229, 0.35);
}
.btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 640px) {
  .form-card {
    padding: 1.25rem;
    border-radius: 1rem;
  }
  .machines-grid {
    grid-template-columns: 1fr;
  }
  .header-icon {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }
  .form-header h2 {
    font-size: 1.1rem;
  }
}
</style>
