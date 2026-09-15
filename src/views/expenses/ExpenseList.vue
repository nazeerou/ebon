<template>
  <div class="expense-page">
    <div class="list-card">
      <!-- Header with Create button top-right -->
      <header class="list-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="fas fa-receipt"></i>
          </div>
          <div>
            <h2>Gharama</h2>
            <p class="subtitle">Orodha ya gharama zote zilizorekodiwa</p>
          </div>
        </div>

        <button class="btn-create" @click="openCreate">
          <i class="fas fa-plus"></i>
          Ongeza Gharama
        </button>
      </header>

      <!-- Summary strip -->
      <div class="summary-strip" v-if="expenses.length">
        <div class="summary-item">
          <span class="summary-label">Jumla ya Gharama</span>
          <span class="summary-value amount">
            {{ formatCurrency(totalAmount) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Idadi</span>
          <span class="summary-value">{{ formatNumber(expenses.length) }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="expenseStore.loading" class="loading-inline">
        <div class="spinner-sm"></div>
        <span>Inapakia gharama...</span>
      </div>

      <!-- Error -->
      <div v-else-if="expenseStore.error" class="error-inline">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ expenseStore.error }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="!expenses.length" class="empty-inline">
        <i class="fas fa-inbox"></i>
        <span>Hakuna gharama zilizorekodiwa bado.</span>
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table class="expense-table">
          <thead>
            <tr>
              <th>Jina la Gharama</th>
              <th>Maelezo</th>
              <th>Tarehe</th>
              <th>Aliyerekodi</th>
              <th class="text-right">Kiasi</th>
              <th class="text-center">Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in expenses" :key="e.id">
              <td>
                <span class="expense-name">{{ e.name }}</span>
              </td>
              <td>
                <span class="desc" :title="e.description">
                  {{ e.description || '—' }}
                </span>
              </td>
              <td>{{ formatDate(e.expense_date || e.created_at) }}</td>
              <td>
                <span v-if="e.user">{{ e.user.name }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td class="text-right amount-cell">
                {{ formatCurrency(e.amount) }}
              </td>
              <td class="text-center">
                <button class="btn-icon danger" @click="confirmDelete(e)" title="Futa">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ---------- CREATE MODAL ---------- -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <header class="modal-header">
          <div>
            <h3>Ongeza Gharama</h3>
            <p class="modal-subtitle">Jaza taarifa za gharama</p>
          </div>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </header>

        <form @submit.prevent="handleCreate" class="modal-form">
          <!-- Name -->
          <div class="form-group">
            <label for="name">Jina la Gharama *</label>
            <input
              id="name"
              type="text"
              class="form-control"
              v-model="form.name"
              placeholder="mfano: Gharama za Matengenezo Machine A120"
              required
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label for="description">Maelezo / Sababu</label>
            <textarea
              id="description"
              class="form-control"
              v-model="form.description"
              rows="3"
              placeholder="Eleza sababu ya gharama hii..."
            ></textarea>
          </div>

          <!-- Amount -->
          <div class="form-group">
            <label for="amount">Kiasi *</label>
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
                required
              />
            </div>
          </div>

          <!-- Date -->
          <div class="form-group">
            <label for="expense_date">Tarehe</label>
            <div class="date-input">
              <span class="date-prefix"><i class="fas fa-calendar-day"></i></span>
              <input
                id="expense_date"
                type="date"
                class="form-control"
                v-model="form.expense_date"
                :max="today"
              />
            </div>
          </div>

          <!-- Messages -->
          <p v-if="modalError" class="msg error-msg">
            <i class="fas fa-exclamation-circle"></i> {{ modalError }}
          </p>

          <!-- Actions -->
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Ghairi</button>
            <button type="submit" class="btn-save" :disabled="!canSave || expenseStore.submitting">
              <i v-if="expenseStore.submitting" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{ expenseStore.submitting ? 'Inatuma...' : 'Hifadhi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useExpenseStore } from '@/stores/expenses'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const expenseStore = useExpenseStore()

/* ---------- Helpers ---------- */
const todayISO = () => new Date().toISOString().split('T')[0]
const today = todayISO()

/* ---------- State ---------- */
const showModal = ref(false)
const modalError = ref('')

const form = ref({
  name: '',
  description: '',
  amount: null,
  expense_date: todayISO(),
})

/* ---------- Computed ---------- */
const expenses = computed(() => expenseStore.expenses ?? [])
const totalAmount = computed(() => expenseStore.totalAmount)

const canSave = computed(
  () => !!form.value.name.trim() && form.value.amount !== null && form.value.amount > 0,
)

/* ---------- Load on mount ---------- */
onMounted(async () => {
  try {
    await expenseStore.fetchExpenses()
  } catch (err) {
    console.error('fetchExpenses error:', err)
  }
})

/* ---------- Modal ---------- */
const openCreate = () => {
  form.value = {
    name: '',
    description: '',
    amount: null,
    expense_date: todayISO(),
  }
  modalError.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalError.value = ''
}

/* ---------- Create ---------- */
const handleCreate = async () => {
  if (!canSave.value) return

  modalError.value = ''

  try {
    await expenseStore.createExpense({
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      amount: form.value.amount,
      expense_date: form.value.expense_date || todayISO(),
    })

    closeModal()
  } catch (err) {
    modalError.value =
      err?.response?.data?.message || expenseStore.error || 'Imeshindwa kurekodi gharama.'
  }
}

/* ---------- Delete ---------- */
const confirmDelete = async (expense) => {
  if (!confirm(`Futa gharama "${expense.name}"?`)) return

  try {
    await expenseStore.deleteExpense(expense.id)
  } catch (err) {
    alert('Imeshindwa kufuta gharama.')
  }
}

/* ---------- Format helpers ---------- */
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
</script>

<style scoped>
.expense-page {
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

/* Header with Create button top-right */
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
  background: linear-gradient(135deg, #fb8c00, #bf5e00);
  box-shadow: 0 8px 14px rgba(251, 140, 0, 0.25);
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
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-radius: 0.85rem;
  border: 1px solid rgba(251, 140, 0, 0.2);
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
  color: #8d6e00;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.summary-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1a2634;
  letter-spacing: -0.02em;
}
.summary-value.amount {
  color: #bf5e00;
}

/* Table */
.table-wrap {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}
.expense-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.expense-table th {
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
.expense-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #f1f3f8;
  color: #1a2634;
  vertical-align: middle;
}
.expense-table tbody tr:last-child td {
  border-bottom: none;
}
.expense-table tbody tr:hover {
  background: #f8fafc;
}
.expense-name {
  font-weight: 600;
  color: #1a2634;
}
.desc {
  display: block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #5e6f8d;
  font-size: 0.82rem;
}
.amount-cell {
  font-weight: 700;
  color: #bf5e00;
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
.btn-icon.danger:hover {
  background: #c62828;
  color: #fff;
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
  max-width: 520px;
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
  resize: vertical;
}
.form-control:focus {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.12);
}

/* Amount / Date inputs */
.amount-input,
.date-input {
  display: flex;
  align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.7rem;
  background: #f8fafc;
  overflow: hidden;
  transition: all 0.2s ease;
}
.amount-input:focus-within,
.date-input:focus-within {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.12);
}
.currency-prefix,
.date-prefix {
  padding: 0.7rem 0.9rem;
  background: #eef2f7;
  font-size: 0.85rem;
  font-weight: 600;
  color: #5e6f8d;
  border-right: 1.5px solid #e2e8f0;
  white-space: nowrap;
}
.date-prefix {
  color: #1e88e5;
  display: flex;
  align-items: center;
}
.amount-input .form-control,
.date-input .form-control {
  border: none;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}
.amount-input .form-control:focus,
.date-input .form-control:focus {
  box-shadow: none;
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
  .expense-table th,
  .expense-table td {
    padding: 0.6rem 0.7rem;
    font-size: 0.8rem;
  }
  .desc {
    max-width: 180px;
  }
}
</style>
