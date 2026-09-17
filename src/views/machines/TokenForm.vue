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
          <p class="subtitle">Rekodi kiasi cha Mtaji kwa Tawi na kwa kila Mashine</p>
        </div>
      </header>

      <form @submit.prevent="handleSubmit" class="token-form">
        <!-- ============================
             Branch select
             ============================ -->
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

        <!-- ============================
             Branch history + amount
             ============================ -->
        <div v-if="selectedBranchId" class="form-group">
          <label>Taarifa za Tawi</label>

          <div v-if="tokenStore.loadingHistory" class="loading-inline">
            <div class="spinner-sm"></div>
            <span>Inapakia historia ya tawi...</span>
          </div>

          <div v-else class="branch-block">
            <!-- Last record card -->
            <div class="last-record-card" :class="{ empty: !branchLast }">
              <div class="last-record-icon">
                <i class="fas fa-history"></i>
              </div>
              <div class="last-record-body">
                <span class="last-record-label">Mara ya mwisho (Tawi zima)</span>
                <template v-if="branchLast">
                  <span class="last-record-amount">
                    TZS {{ formatCurrency(branchLast.amount) }}
                  </span>
                  <span class="last-record-date">
                    <i class="far fa-calendar-alt"></i>
                    {{ formatDate(branchLast.created_date || branchLast.created_at) }}
                  </span>
                </template>
                <span v-else class="last-record-empty"> Hakuna rekodi ya awali </span>
              </div>
            </div>

            <!-- New branch amount -->
            <div class="form-group">
              <label for="branch_amount">
                <i class="fas fa-store"></i>
                Kiasi kipya kilichoachwa (Tawi zima)
              </label>
              <div class="amount-input">
                <span class="currency-prefix">TZS</span>
                <input
                  id="branch_amount"
                  type="number"
                  class="form-control"
                  v-model.number="form.branch_amount"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ============================
             Machines section
             ============================ -->
        <div v-if="selectedBranchId" class="form-group">
          <div class="section-title">
            <label>Mashine za Tawi</label>
            <span v-if="machines.length" class="machine-count">
              {{ machines.length }} {{ machines.length === 1 ? 'mashine' : 'mashine' }}
            </span>
          </div>

          <div v-if="tokenStore.loadingMachines" class="loading-inline">
            <div class="spinner-sm"></div>
            <span>Inapakia mashine...</span>
          </div>

          <div v-else-if="!machines.length" class="empty-inline">
            <i class="fas fa-info-circle"></i>
            <span>Hakuna mashine kwenye tawi hili.</span>
          </div>

          <div v-else class="machines-list">
            <div v-for="m in machines" :key="m.id" class="machine-card">
              <!-- Machine header -->
              <div class="machine-header">
                <div class="machine-info">
                  <div class="machine-name">
                    <i class="fas fa-microchip"></i>
                    {{ m.name || m.serial_number || 'Mashine' }}
                  </div>
                  <div v-if="m.serial_number" class="machine-serial">SN: {{ m.serial_number }}</div>
                </div>

                <!-- Last record badge -->
                <div class="machine-last" :class="{ empty: !m.last_token }">
                  <template v-if="m.last_token">
                    <span class="machine-last-label">Mara ya mwisho:</span>
                    <span class="machine-last-amount">
                      TZS {{ formatCurrency(m.last_token.amount) }}
                    </span>
                    <span class="machine-last-date">
                      {{ formatDate(m.last_token.created_date || m.last_token.created_at) }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="machine-last-empty">Hakuna rekodi</span>
                  </template>
                </div>
              </div>

              <!-- Input for new amount -->
              <div class="machine-input">
                <label :for="'machine_amount_' + m.id" class="machine-input-label">
                  Kiasi kipya kilichoachwa
                </label>
                <div class="amount-input">
                  <span class="currency-prefix">TZS</span>
                  <input
                    :id="'machine_amount_' + m.id"
                    type="number"
                    class="form-control"
                    v-model.number="machineAmounts[m.id]"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div v-if="machines.length" class="machines-summary">
            <div class="summary-row">
              <span class="summary-label">Jumla ya mashine zote</span>
              <span class="summary-value"> TZS {{ formatCurrency(machineTotal) }} </span>
            </div>
            <div class="summary-row grand">
              <span class="summary-label">Jumla kuu (Tawi + Mashine)</span>
              <span class="summary-value"> TZS {{ formatCurrency(grandTotal) }} </span>
            </div>
          </div>
        </div>

        <!-- ============================
             Date
             ============================ -->
        <div v-if="selectedBranchId" class="form-group">
          <label for="created_date">Tarehe</label>
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
        <button
          v-if="selectedBranchId"
          type="submit"
          class="btn-submit"
          :disabled="!canSubmit || tokenStore.submitting"
        >
          <i v-if="tokenStore.submitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ tokenStore.submitting ? 'Inatuma...' : 'Rekodi Mtaji' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useTokenStore } from '@/stores/tokens'

const tokenStore = useTokenStore()

/* ---------- Helpers ---------- */
const todayISO = () => new Date().toISOString().split('T')[0]
const today = todayISO()

/* ---------- State ---------- */
const selectedBranchId = ref('')
const errorMsg = ref('')
const successMsg = ref('')

const form = reactive({
  branch_amount: null,
  created_date: todayISO(),
})

/* Per-machine amounts: { [machineId]: number|null } */
const machineAmounts = reactive({})

/* ---------- Computed ---------- */
const branches = computed(() => tokenStore.branches ?? [])
const machines = computed(() => tokenStore.machines ?? [])
const branchLast = computed(() => tokenStore.branchLastRecord ?? null)

/* Sum of machine amounts */
const machineTotal = computed(() => {
  return Object.values(machineAmounts).reduce((sum, v) => {
    const n = Number(v)
    return sum + (Number.isFinite(n) && n > 0 ? n : 0)
  }, 0)
})

/* Branch + machines combined */
const grandTotal = computed(() => {
  const b = Number(form.branch_amount) || 0
  return b + machineTotal.value
})

/* Can we submit? */
const canSubmit = computed(() => {
  const hasBranch = !!selectedBranchId.value
  const hasDate = !!form.created_date
  const hasBranchAmount = Number(form.branch_amount) > 0
  const hasAnyMachine = machineTotal.value > 0
  return hasBranch && hasDate && (hasBranchAmount || hasAnyMachine)
})

/* ---------- Format helpers ---------- */
const formatCurrency = (value) => {
  const n = Number(value) || 0
  return n.toLocaleString('sw-TZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

const formatDate = (date) => {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

/* ---------- Load branches on mount ---------- */
onMounted(async () => {
  try {
    await tokenStore.fetchBranches()
  } catch (err) {
    errorMsg.value = 'Imeshindwa kupakia matawi. Jaribu tena.'
    console.error('fetchBranches error:', err)
  }
})

/* ---------- When branch changes ---------- */
watch(selectedBranchId, async (newBranchId) => {
  /* Reset everything */
  resetForm()

  if (!newBranchId) return

  try {
    /* Load branch history + machines with history in parallel */
    await Promise.all([
      tokenStore.fetchBranchLastRecord(newBranchId),
      tokenStore.fetchMachinesByBranch(newBranchId),
    ])

    /* Initialize per-machine amounts to null */
    machines.value.forEach((m) => {
      machineAmounts[m.id] = null
    })
  } catch (err) {
    errorMsg.value = 'Imeshindwa kupakia taarifa za tawi hili.'
    console.error('fetch branch data error:', err)
  }
})

/* ---------- Reset helpers ---------- */
const resetForm = () => {
  form.branch_amount = null
  form.created_date = todayISO()
  errorMsg.value = ''
  successMsg.value = ''

  /* Clear machine amounts */
  Object.keys(machineAmounts).forEach((k) => delete machineAmounts[k])

  /* Clear store data */
  if (typeof tokenStore.clearMachines === 'function') tokenStore.clearMachines()
  if (typeof tokenStore.clearBranchHistory === 'function') tokenStore.clearBranchHistory()
}

/* ---------- Submit ---------- */
const handleSubmit = async () => {
  if (!canSubmit.value) return

  errorMsg.value = ''
  successMsg.value = ''

  /* Build machine payload (only those with amount > 0) */
  const machinePayload = machines.value
    .filter((m) => Number(machineAmounts[m.id]) > 0)
    .map((m) => ({
      machine_id: m.id,
      amount: Number(machineAmounts[m.id]),
    }))

  const payload = {
    branch_id: selectedBranchId.value,
    branch_amount: Number(form.branch_amount) || 0,
    created_date: form.created_date,
    machine_amounts: machinePayload,
  }

  try {
    await tokenStore.createToken(payload)

    successMsg.value = tokenStore.successMessage || 'Mtaji umerekodiwa kikamilifu!'

    /* Refresh history so user sees the new record */
    try {
      await Promise.all([
        tokenStore.fetchBranchLastRecord(selectedBranchId.value),
        tokenStore.fetchMachinesByBranch(selectedBranchId.value),
      ])
    } catch {
      /* silent — history refresh is optional */
    }

    /* Clear input values but keep branch selected */
    form.branch_amount = null
    form.created_date = todayISO()
    machines.value.forEach((m) => {
      machineAmounts[m.id] = null
    })

    setTimeout(() => (successMsg.value = ''), 3500)
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.message || tokenStore.error || 'Imeshindwa kurekodi mtaji. Jaribu tena.'
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
  max-width: 720px;
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
.form-group > label,
.section-title > label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2c3e66;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.form-group > label i {
  color: #1e88e5;
  font-size: 0.9rem;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.machine-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e88e5;
  background: #e3f2fd;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
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

/* ---------- Branch block ---------- */
.branch-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
}

/* Last record card */
.last-record-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 1px solid rgba(30, 136, 229, 0.25);
  border-radius: 0.75rem;
}
.last-record-card.empty {
  background: #f1f3f8;
  border-color: #e2e8f0;
}

.last-record-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.65rem;
  background: #ffffff;
  color: #1e88e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.last-record-card.empty .last-record-icon {
  color: #8a95a8;
}

.last-record-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.last-record-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #0d47a1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.last-record-card.empty .last-record-label {
  color: #5e6f8d;
}
.last-record-amount {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1a2634;
  letter-spacing: -0.02em;
}
.last-record-date {
  font-size: 0.75rem;
  color: #5e6f8d;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.last-record-empty {
  font-size: 0.85rem;
  color: #8a95a8;
  font-style: italic;
}

/* ---------- Machines list ---------- */
.machines-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.machine-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 0.85rem;
  background: #ffffff;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.machine-card:focus-within {
  border-color: #1e88e5;
  box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.08);
}

.machine-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.machine-info {
  flex: 1;
  min-width: 0;
}
.machine-name {
  font-size: 0.95rem;
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

/* Last record badge (per machine) */
.machine-last {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
  padding: 0.4rem 0.7rem;
  background: #e8f5e9;
  border-radius: 0.55rem;
  border: 1px solid rgba(46, 125, 50, 0.2);
  flex-shrink: 0;
}
.machine-last.empty {
  background: #f1f3f8;
  border-color: #e2e8f0;
}
.machine-last-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #2e7d32;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.machine-last.empty .machine-last-label {
  color: #5e6f8d;
}
.machine-last-amount {
  font-size: 0.9rem;
  font-weight: 800;
  color: #1a2634;
  letter-spacing: -0.01em;
}
.machine-last-date {
  font-size: 0.7rem;
  color: #5e6f8d;
}
.machine-last-empty {
  font-size: 0.75rem;
  color: #8a95a8;
  font-style: italic;
}

/* Machine input */
.machine-input {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.machine-input-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #5e6f8d;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* ---------- Amount input ---------- */
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
  white-space: nowrap;
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

/* ---------- Machines summary ---------- */
.machines-summary {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  border: 1px solid rgba(251, 140, 0, 0.25);
  border-radius: 0.85rem;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.25rem;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}
.summary-row .summary-label {
  color: #8d6e00;
  font-weight: 600;
}
.summary-row .summary-value {
  color: #1a2634;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.summary-row.grand {
  padding-top: 0.4rem;
  border-top: 1px dashed rgba(141, 110, 0, 0.35);
  margin-top: 0.15rem;
}
.summary-row.grand .summary-label,
.summary-row.grand .summary-value {
  font-size: 0.95rem;
  color: #bf5e00;
  font-weight: 800;
}

/* ---------- Date input ---------- */
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

/* ---------- Inline states ---------- */
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
.hint-inline i,
.empty-inline i {
  color: #fb8c00;
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

/* ---------- Messages ---------- */
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

/* ---------- Submit ---------- */
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

/* ---------- Responsive ---------- */
@media (max-width: 640px) {
  .form-card {
    padding: 1.25rem;
    border-radius: 1rem;
  }
  .header-icon {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }
  .form-header h2 {
    font-size: 1.1rem;
  }
  .machine-header {
    flex-direction: column;
    align-items: stretch;
  }
  .machine-last {
    align-items: flex-start;
  }
}
</style>
