<template>
  <div class="record-payment-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <router-link to="/payments" class="back-btn">
          <i class="fas fa-arrow-left"></i>
          <span>Rudi Kwenye Malipo</span>
        </router-link>
        <h1>Rekodi Malipo</h1>
      </div>
    </div>

    <!-- Debug Panel (Hidden by default, press Ctrl+D to toggle) -->
    <div v-if="showDebug" class="debug-panel">
      <div class="debug-header">
        <h4>Debug Information</h4>
        <button @click="showDebug = false" class="debug-close">✕</button>
      </div>
      <div class="debug-content">
        <div><strong>API_URL:</strong> {{ API_URL }}</div>
        <div>
          <strong>Selected Loan:</strong> {{ selectedLoan ? selectedLoan.loan_number : 'None' }}
        </div>
        <div><strong>Form Data:</strong> {{ JSON.stringify(form, null, 2) }}</div>
        <div><strong>Errors:</strong> {{ JSON.stringify(errors, null, 2) }}</div>
        <div><strong>Last Response:</strong> {{ JSON.stringify(lastResponse, null, 2) }}</div>
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

    <!-- Main Content -->
    <div class="payment-form-container">
      <!-- Loan Selection Section -->
      <div v-if="!selectedLoan" class="loan-selector">
        <div class="selector-header">
          <i class="fas fa-hand-holding-usd"></i>
          <h3>Chagua Mkopo</h3>
          <p>Tafuta mkopo kwa namba au jina la mteja</p>
        </div>

        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="loanSearch"
            @input="searchLoans"
            placeholder="Tafuta kwa namba ya mkopo au jina la mteja..."
            class="search-input"
          />
        </div>

        <!-- Active Loans List -->
        <div v-if="activeLoans.length > 0" class="loans-list">
          <div
            v-for="loan in activeLoans"
            :key="loan.id"
            class="loan-card"
            @click="selectLoan(loan)"
          >
            <div class="loan-card-header">
              <span class="loan-number">#{{ loan.loan_number }}</span>
              <span class="loan-status" :class="loan.status">{{ getStatusText(loan.status) }}</span>
            </div>

            <div class="loan-card-body">
              <div class="customer-info">
                <img
                  :src="loan.customer?.profile_photo || '/default-avatar.png'"
                  :alt="loan.customer?.name"
                  class="customer-avatar"
                />
                <div class="customer-details">
                  <span class="customer-name">
                    {{ loan.customer?.first_name }} {{ loan.customer?.last_name }}
                  </span>
                  <span class="customer-phone">{{ loan.customer?.phone }}</span>
                </div>
              </div>

              <div class="loan-summary">
                <div class="summary-item">
                  <span class="label">Kiasi:</span>
                  <span class="value">{{ formatCurrency(loan.amount) }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Imebaki:</span>
                  <span class="value">{{ formatCurrency(loan.balance) }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Malipo yafuatayo:</span>
                  <span class="value">{{ formatCurrency(loan.installment_amount) }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Tarehe ya mwisho:</span>
                  <span class="value">{{ formatDate(loan.end_date) }}</span>
                </div>
              </div>
            </div>

            <div class="loan-card-footer">
              <button class="btn-select">
                Chagua Mkopo Huu
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="loanSearch && !loading" class="no-results">
          <i class="fas fa-search"></i>
          <p>Hakuna mikopo inayolingana na utafutaji wako</p>
        </div>
      </div>

      <!-- Payment Form -->
      <div v-else class="payment-form">
        <!-- Selected Loan Summary -->
        <div class="selected-loan-card">
          <div class="card-header">
            <h3>Mkopo Uliochaguliwa</h3>
            <button class="btn-change" @click="changeLoan">
              <i class="fas fa-sync-alt"></i>
              Badilisha
            </button>
          </div>

          <div class="loan-summary-detailed">
            <div class="loan-info">
              <span class="loan-number-label">Namba ya Mkopo:</span>
              <span class="loan-number-value">#{{ selectedLoan.loan_number }}</span>
            </div>

            <div class="customer-info-detailed">
              <img
                :src="selectedLoan.customer?.profile_photo || '/default-avatar.png'"
                :alt="selectedLoan.customer?.name"
                class="customer-avatar-large"
              />
              <div class="customer-details">
                <span class="customer-name-large">
                  {{ selectedLoan.customer?.first_name }} {{ selectedLoan.customer?.last_name }}
                </span>
                <span class="customer-phone-large">{{ selectedLoan.customer?.phone }}</span>
              </div>
            </div>

            <div class="loan-stats">
              <div class="stat">
                <span class="stat-label">Kiasi cha Mkopo</span>
                <span class="stat-value">{{ formatCurrency(selectedLoan.amount) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Imelipwa</span>
                <span class="stat-value">{{ formatCurrency(selectedLoan.paid_amount || 0) }}</span>
              </div>
              <div class="stat highlight">
                <span class="stat-label">Imebaki Kulipa</span>
                <span class="stat-value">{{ formatCurrency(selectedLoan.balance) }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Malipo kwa Mwezi</span>
                <span class="stat-value">{{
                  formatCurrency(selectedLoan.installment_amount)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Form -->
        <form @submit.prevent="submitPayment" class="form">
          <div class="form-grid">
            <!-- Payment Amount -->
            <div class="form-group required">
              <label for="amount">
                <i class="fas fa-money-bill-wave"></i>
                Kiasi cha Malipo (TZS)
              </label>
              <div class="currency-input">
                <span class="currency-symbol">TZS</span>
                <input
                  type="text"
                  id="amount"
                  v-model.number="form.amount"
                  class="form-control with-currency"
                  :class="{ 'is-invalid': errors.amount }"
                  placeholder="50000"
                  min="0"
                  :max="selectedLoan.balance"
                  required
                />
              </div>
              <!--  @input="validateAmount" -->
              <div class="amount-hints">
                <span class="input-hint">Kiasi cha chini: TZS 1,000</span>
                <span class="input-hint">Imebaki: {{ formatCurrency(selectedLoan.balance) }}</span>
              </div>
              <div class="quick-amounts">
                <button
                  type="button"
                  class="quick-amount-btn"
                  @click="setAmount(selectedLoan.installment_amount)"
                >
                  Malipo ya Kawaida
                </button>
                <button
                  type="button"
                  class="quick-amount-btn"
                  @click="setAmount(selectedLoan.balance)"
                  :disabled="selectedLoan.balance === selectedLoan.installment_amount"
                >
                  Lipa Lote
                </button>
              </div>
              <span v-if="errors.amount" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{ Array.isArray(errors.amount) ? errors.amount[0] : errors.amount }}
              </span>
            </div>

            <!-- Payment Type -->
            <div class="form-group required">
              <label for="payment_type">
                <i class="fas fa-tag"></i>
                Aina ya Malipo
              </label>
              <select
                id="payment_type"
                v-model="form.payment_type"
                class="form-control"
                :class="{ 'is-invalid': errors.payment_type }"
                required
              >
                <option value="partial">Sehemu</option>
                <option value="full">Kamilifu</option>
                <option value="penalty">Adhabu</option>
              </select>
              <span v-if="errors.payment_type" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{
                  Array.isArray(errors.payment_type) ? errors.payment_type[0] : errors.payment_type
                }}
              </span>
            </div>

            <!-- Payment Method -->
            <div class="form-group required">
              <label for="payment_method">
                <i class="fas fa-credit-card"></i>
                Njia ya Malipo
              </label>
              <select
                id="payment_method"
                v-model="form.payment_method"
                class="form-control"
                :class="{ 'is-invalid': errors.payment_method }"
                required
                @change="handleMethodChange"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cheque">Cheque</option>
              </select>
              <span v-if="errors.payment_method" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{
                  Array.isArray(errors.payment_method)
                    ? errors.payment_method[0]
                    : errors.payment_method
                }}
              </span>
            </div>

            <!-- Payment Date -->
            <div class="form-group required">
              <label for="payment_date">
                <i class="fas fa-calendar-alt"></i>
                Tarehe ya Malipo
              </label>
              <input
                type="date"
                id="payment_date"
                v-model="form.payment_date"
                class="form-control"
                :class="{ 'is-invalid': errors.payment_date }"
                required
              />
              <span v-if="errors.payment_date" class="error-text">
                <i class="fas fa-exclamation-circle"></i>
                {{
                  Array.isArray(errors.payment_date) ? errors.payment_date[0] : errors.payment_date
                }}
              </span>
            </div>
          </div>

          <!-- Conditional Fields Based on Payment Method -->

          <!-- Bank Transfer Fields -->
          <div v-if="form.payment_method === 'bank_transfer'" class="conditional-fields">
            <h4>Maelezo ya Benki</h4>
            <div class="form-grid">
              <div class="form-group required">
                <label for="bank_name">Jina la Benki</label>
                <input
                  type="text"
                  id="bank_name"
                  v-model="form.bank_name"
                  class="form-control"
                  :class="{ 'is-invalid': errors.bank_name }"
                  placeholder="Mfano: CRDB, NMB, NBC"
                  required
                />
                <span v-if="errors.bank_name" class="error-text">
                  <i class="fas fa-exclamation-circle"></i>
                  {{ Array.isArray(errors.bank_name) ? errors.bank_name[0] : errors.bank_name }}
                </span>
              </div>
              <div class="form-group">
                <label for="transaction_reference">Namba ya Rejea</label>
                <input
                  type="text"
                  id="transaction_reference"
                  v-model="form.transaction_reference"
                  class="form-control"
                  placeholder="Mfano: TRF123456"
                />
              </div>
            </div>
          </div>

          <!-- Mobile Money Fields -->
          <div v-if="form.payment_method === 'mobile_money'" class="conditional-fields">
            <h4>Maelezo ya Mobile Money</h4>
            <div class="form-grid">
              <div class="form-group required">
                <label for="mobile_provider">Mtoa Huduma</label>
                <select
                  id="mobile_provider"
                  v-model="form.mobile_provider"
                  class="form-control"
                  :class="{ 'is-invalid': errors.mobile_provider }"
                  required
                >
                  <option value="">Chagua...</option>
                  <option value="M-PESA">M-PESA</option>
                  <option value="TIGO-PESA">TIGO PESA</option>
                  <option value="AIRTEL-MONEY">AIRTEL MONEY</option>
                  <option value="HALOPESA">HALOPESA</option>
                </select>
                <span v-if="errors.mobile_provider" class="error-text">
                  <i class="fas fa-exclamation-circle"></i>
                  {{
                    Array.isArray(errors.mobile_provider)
                      ? errors.mobile_provider[0]
                      : errors.mobile_provider
                  }}
                </span>
              </div>
              <div class="form-group required">
                <label for="mobile_number">Namba ya Simu</label>
                <input
                  type="tel"
                  id="mobile_number"
                  v-model="form.mobile_number"
                  class="form-control"
                  :class="{ 'is-invalid': errors.mobile_number }"
                  placeholder="Mfano: 0712345678"
                  required
                />
                <span v-if="errors.mobile_number" class="error-text">
                  <i class="fas fa-exclamation-circle"></i>
                  {{
                    Array.isArray(errors.mobile_number)
                      ? errors.mobile_number[0]
                      : errors.mobile_number
                  }}
                </span>
              </div>
              <div class="form-group">
                <label for="transaction_id">Transaction ID</label>
                <input
                  type="text"
                  id="transaction_id"
                  v-model="form.transaction_id"
                  class="form-control"
                  placeholder="Mfano: MPESA123456"
                />
              </div>
            </div>
          </div>

          <!-- Cheque Fields -->
          <div v-if="form.payment_method === 'cheque'" class="conditional-fields">
            <h4>Maelezo ya Cheque</h4>
            <div class="form-grid">
              <div class="form-group required">
                <label for="cheque_number">Namba ya Cheque</label>
                <input
                  type="text"
                  id="cheque_number"
                  v-model="form.cheque_number"
                  class="form-control"
                  :class="{ 'is-invalid': errors.cheque_number }"
                  placeholder="Mfano: CHQ001234"
                  required
                />
                <span v-if="errors.cheque_number" class="error-text">
                  <i class="fas fa-exclamation-circle"></i>
                  {{
                    Array.isArray(errors.cheque_number)
                      ? errors.cheque_number[0]
                      : errors.cheque_number
                  }}
                </span>
              </div>
              <div class="form-group required">
                <label for="bank_name_cheque">Jina la Benki</label>
                <input
                  type="text"
                  id="bank_name_cheque"
                  v-model="form.bank_name"
                  class="form-control"
                  placeholder="Mfano: CRDB"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label for="notes">
              <i class="fas fa-sticky-note"></i>
              Maelezo ya Ziada
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              class="form-control"
              rows="3"
              placeholder="Weka maelezo yoyote kuhusu malipo haya..."
            ></textarea>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="cancel">
              <i class="fas fa-times"></i>
              Ghairi
            </button>
            <button type="submit" class="btn-primary" :disabled="saving || !isFormValid">
              <span v-if="saving" class="spinner"></span>
              <span v-else>
                <i class="fas fa-save"></i>
                Hifadhi Malipo
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-content success-modal" @click.stop>
        <div class="modal-icon success">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>Malipo Yamehifadhiwa!</h3>

        <div class="payment-receipt" v-if="lastPayment">
          <div class="receipt-header">
            <h4>Risiti ya Malipo</h4>
            <span class="receipt-number">#{{ lastPayment.receipt_number }}</span>
          </div>

          <div class="receipt-details">
            <div class="receipt-row">
              <span class="receipt-label">Mteja:</span>
              <span class="receipt-value">
                {{ selectedLoan?.customer?.first_name }} {{ selectedLoan?.customer?.last_name }}
              </span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Namba ya Mkopo:</span>
              <span class="receipt-value">#{{ selectedLoan?.loan_number }}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Kiasi:</span>
              <span class="receipt-value amount">{{ formatCurrency(lastPayment.amount) }}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Tarehe:</span>
              <span class="receipt-value">{{ formatDateTime(lastPayment.created_at) }}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Njia:</span>
              <span class="receipt-value">{{ getMethodText(form.payment_method) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeSuccessModal">
            <i class="fas fa-times"></i>
            Funga
          </button>
          <button class="btn-primary" @click="printReceipt">
            <i class="fas fa-print"></i>
            Chapisha Risiti
          </button>
          <button class="btn-success" @click="recordAnother">
            <i class="fas fa-plus-circle"></i>
            Rekodi Nyingine
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// Debug
const showDebug = ref(false)

// Toggle debug with Ctrl+D
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault()
    showDebug.value = !showDebug.value
  }
})

// State
const loading = ref(false)
const saving = ref(false)
const loanSearch = ref('')
const activeLoans = ref([])
const selectedLoan = ref(null)
const errors = ref({})
const showSuccessModal = ref(false)
const lastPayment = ref(null)
const lastResponse = ref(null)

// Use relative URL for Vite proxy - THIS IS KEY FOR CORS
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

// const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// Form data
const form = reactive({
  loan_id: null,
  amount: '',
  payment_type: 'partial',
  payment_method: 'cash',
  payment_date: new Date().toISOString().split('T')[0],
  bank_name: '',
  transaction_reference: '',
  mobile_provider: '',
  mobile_number: '',
  transaction_id: '',
  cheque_number: '',
  notes: '',
})

// Computed
const isFormValid = computed(() => {
  if (!form.amount || form.amount <= 0) return false
  if (!form.payment_type) return false
  if (!form.payment_method) return false
  if (!form.payment_date) return false

  // Method-specific validation
  if (form.payment_method === 'bank_transfer') {
    if (!form.bank_name) return false
  }

  if (form.payment_method === 'mobile_money') {
    if (!form.mobile_provider) return false
    if (!form.mobile_number || !/^[0-9]{10}$/.test(form.mobile_number.replace(/\D/g, '')))
      return false
  }

  if (form.payment_method === 'cheque') {
    if (!form.cheque_number) return false
    if (!form.bank_name) return false
  }

  return true
})

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Check for preselected loan from query params
const preselectedLoanId = computed(() => route.query.loan_id)

// API Methods
const loadActiveLoans = async () => {
  loading.value = true

  try {
    const params = {
      per_page: 50,
      sort_field: 'created_at',
      sort_order: 'desc',
    }

    if (loanSearch.value) {
      params.search = loanSearch.value
    }

    console.log('Loading loans from:', `${API_URL}/loans`)

    const response = await axios.get(`${API_URL}/loans/`, { params })

    console.log('Loans response:', response.data)

    if (response.data.success && response.data.data) {
      const paginatedData = response.data.data
      const allLoans = paginatedData.data || []

      activeLoans.value = allLoans
        .filter(
          (loan) =>
            parseFloat(loan.balance) > 0 &&
            ['active', 'approved', 'defaulted'].includes(loan.status),
        )
        .map((loan) => {
          const processedLoan = { ...loan }
          if (processedLoan.customer) {
            processedLoan.customer = { ...processedLoan.customer }
            if (
              processedLoan.customer.profile_photo &&
              !processedLoan.customer.profile_photo.startsWith('http')
            ) {
              processedLoan.customer.profile_photo = `${API_URL}/storage/${processedLoan.customer.profile_photo}`
            }
          }
          return processedLoan
        })
    }
  } catch (err) {
    console.error('Error loading loans:', err)
    showToastMessage(
      err.response?.data?.message || 'Imeshindwa kupakia mikopo. Tafadhali jaribu tena.',
      'error',
    )
  } finally {
    loading.value = false
  }
}

const searchLoans = debounce(() => {
  loadActiveLoans()
}, 500)

const selectLoan = (loan) => {
  selectedLoan.value = loan
  form.loan_id = loan.id
  form.amount = parseFloat(loan.installment_amount) || 0
  console.log('Selected loan:', loan)
}

const loadLoanById = async (loanId) => {
  try {
    const response = await axios.get(`${API_URL}/loans/loans/${loanId}`)
    if (response.data.success && response.data.data) {
      const loan = response.data.data
      if (parseFloat(loan.balance) > 0) {
        selectLoan(loan)
      }
    }
  } catch (err) {
    console.error('Error loading loan:', err)
    showToastMessage(
      err.response?.data?.message || 'Imeshindwa kupakia mkopo. Tafadhali jaribu tena.',
      'error',
    )
  }
}

const changeLoan = () => {
  selectedLoan.value = null
  form.loan_id = null
  resetForm()
}

const resetForm = () => {
  form.amount = ''
  form.payment_type = 'partial'
  form.payment_method = 'cash'
  form.payment_date = new Date().toISOString().split('T')[0]
  form.bank_name = ''
  form.transaction_reference = ''
  form.mobile_provider = ''
  form.mobile_number = ''
  form.transaction_id = ''
  form.cheque_number = ''
  form.notes = ''
  errors.value = {}
}

const validateAmount = () => {
  if (!selectedLoan.value) return

  const balance = parseFloat(selectedLoan.value.balance)
  const amount = parseFloat(form.amount) || 0

  if (amount > balance) {
    errors.value.amount = ['Kiasi cha malipo hakiwezi kuwa kikubwa kuliko deni lililobaki']
  } else if (amount <= 0) {
    errors.value.amount = ['Kiasi cha malipo kinatakiwa kuwa kikubwa kuliko sifuri']
  } else {
    delete errors.value.amount
  }
}

const setAmount = (amount) => {
  form.amount = parseFloat(amount) || 0
  // validateAmount()
}

const handleMethodChange = () => {
  form.bank_name = ''
  form.transaction_reference = ''
  form.mobile_provider = ''
  form.mobile_number = ''
  form.transaction_id = ''
  form.cheque_number = ''
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Inasubiri',
    approved: 'Imeidhinishwa',
    active: 'Inaendelea',
    completed: 'Imekamilika',
    defaulted: 'Imechelewa',
    rejected: 'Imekataliwa',
  }
  return statusMap[status] || status
}

const getMethodText = (method) => {
  const texts = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    cheque: 'Cheque',
  }
  return texts[method] || method
}

const submitPayment = async () => {
  if (!selectedLoan.value) {
    showToastMessage('Tafadhali chagua mkopo kwanza', 'error')
    return
  }

  saving.value = true
  errors.value = {}
  lastResponse.value = null

  try {
    // Prepare payment data
    const paymentData = {
      loan_id: selectedLoan.value.id,
      amount: parseFloat(form.amount),
      payment_type: form.payment_type,
      payment_method: form.payment_method,
      payment_date: form.payment_date,
      notes: form.notes || '',
    }

    // Add method-specific fields
    if (form.payment_method === 'bank_transfer') {
      paymentData.bank_name = form.bank_name || ''
      paymentData.transaction_reference = form.transaction_reference || ''
    } else if (form.payment_method === 'mobile_money') {
      paymentData.mobile_provider = form.mobile_provider || ''
      paymentData.mobile_number = form.mobile_number || ''
      paymentData.transaction_id = form.transaction_id || ''
    } else if (form.payment_method === 'cheque') {
      paymentData.cheque_number = form.cheque_number || ''
      paymentData.bank_name = form.bank_name || ''
    }

    console.log('=== SUBMITTING PAYMENT ===')
    console.log('API_URL:', API_URL)
    console.log('Full URL:', `${API_URL}/payments`)
    console.log('Payment Data:', JSON.stringify(paymentData, null, 2))

    // Make API call
    const response = await axios.post(`${API_URL}/payments`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    console.log('=== RESPONSE RECEIVED ===')
    console.log('Status:', response.status)
    console.log('Data:', response.data)

    lastResponse.value = response.data

    if (response.data.success) {
      // Generate receipt number
      const receiptNumber =
        'RCT-' +
        new Date().getFullYear() +
        '-' +
        String(Math.floor(Math.random() * 10000)).padStart(4, '0')

      lastPayment.value = {
        receipt_number: receiptNumber,
        amount: form.amount,
        created_at: new Date().toISOString(),
      }

      // Update local loan data
      const amount = parseFloat(form.amount)
      const balance = parseFloat(selectedLoan.value.balance)
      selectedLoan.value.paid_amount = (parseFloat(selectedLoan.value.paid_amount) || 0) + amount
      selectedLoan.value.balance = balance - amount

      if (selectedLoan.value.balance <= 0) {
        selectedLoan.value.status = 'completed'
      }

      showSuccessModal.value = true
      showToastMessage('Malipo yamehifadhiwa kwa mafanikio!', 'success')
    } else {
      showToastMessage(response.data.message || 'Hitilafu imetokea', 'error')
    }
  } catch (err) {
    console.error('=== ERROR IN SUBMIT PAYMENT ===')
    console.error('Error object:', err)
    console.error('Error message:', err.message)
    console.error('Error response:', err.response)
    console.error('Error request:', err.request)

    lastResponse.value = { error: err.message, response: err.response?.data }

    // Handle CORS error specifically
    if (err.message?.includes('CORS') || err.code === 'ERR_NETWORK') {
      showToastMessage(
        'CORS Error: Cannot connect to server. Make sure backend is running and CORS is configured.',
        'error',
      )
      console.error('CORS ERROR - Check:')
      console.error('Vite proxy is configured correctly')
      console.error('Backend CORS headers are set')
    }
    // Handle validation errors (422)
    else if (err.response?.status === 422) {
      const responseData = err.response.data
      console.log('Validation errors:', responseData.errors)

      if (responseData.errors) {
        errors.value = responseData.errors
        const firstField = Object.keys(responseData.errors)[0]
        if (firstField && responseData.errors[firstField].length > 0) {
          showToastMessage(responseData.errors[firstField][0], 'error')
        }
      } else if (responseData.message) {
        showToastMessage(responseData.message, 'error')
      } else {
        showToastMessage('Validation error occurred', 'error')
      }
    }
    // Handle 500 server errors
    else if (err.response?.status === 500) {
      const errorMsg =
        err.response?.data?.message || 'Hitilafu ya seva. Tafadhali jaribu tena baadaye.'
      showToastMessage(errorMsg, 'error')
      console.error('Server error details:', err.response?.data)
    }
    // Handle 404 not found
    else if (err.response?.status === 404) {
      showToastMessage('API endpoint not found. Please check the URL.', 'error')
      console.error('404 - Endpoint not found:', `${API_URL}/payments`)
    }
    // Handle network errors
    else if (err.request && !err.response) {
      showToastMessage('Hakuna muunganisho na seva. Tafadhali angalia mtandao wako.', 'error')
      console.error('Network error - No response received')
    }
    // Handle other errors
    else {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Hitilafu imetokea. Tafadhali jaribu tena.'
      showToastMessage(errorMessage, 'error')
    }
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push('/payments')
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  router.push('/payments')
}

const printReceipt = () => {
  showToastMessage('Kipengele cha kuchapisha risiti kitaongezwa hivi karibuni', 'info')
}

const recordAnother = () => {
  showSuccessModal.value = false
  selectedLoan.value = null
  resetForm()
  loadActiveLoans()
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Test API connection on mount
const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', `${API_URL}/loans?per_page=1`)
    const response = await axios.get(`${API_URL}/loans?per_page=1`)
    console.log('API connection successful:', response.status)
    return true
  } catch (err) {
    console.error('API connection failed:', err.message)
    showToastMessage('Cannot connect to server. Please check if backend is running.', 'error')
    return false
  }
}

// Lifecycle
onMounted(async () => {
  console.log('Component mounted. API_URL:', API_URL)
  await testApiConnection()
  await loadActiveLoans()

  if (preselectedLoanId.value) {
    await loadLoanById(preselectedLoanId.value)
  }
})
</script>

<style scoped>
/* All your existing styles remain the same */
.record-payment-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
}

/* Debug Panel */
.debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 500px;
  max-width: 90vw;
  background: #1a1a2e;
  color: #00ff00;
  border-radius: 8px;
  z-index: 9999;
  font-family: monospace;
  font-size: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  cursor: move;
}

.debug-header h4 {
  margin: 0;
  color: #e94560;
}

.debug-close {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 18px;
}

.debug-content {
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.debug-content div {
  margin-bottom: 8px;
  border-bottom: 1px solid #333;
  padding-bottom: 5px;
}

/* Page Header */
.page-header {
  margin-bottom: 25px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
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
  font-size: 2rem;
  color: #1a2639;
  margin: 0;
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

/* Loan Selector */
.loan-selector {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.selector-header {
  text-align: center;
  margin-bottom: 25px;
}

.selector-header i {
  font-size: 3rem;
  color: #3498db;
  margin-bottom: 10px;
}

.selector-header h3 {
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 5px;
}

.selector-header p {
  color: #666;
  margin: 0;
}

.search-box {
  position: relative;
  margin-bottom: 25px;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  z-index: 1;
}

.search-input {
  width: 80%;
  padding: 12px 15px 12px 45px;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
  background: #f8fafc;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Loans List */
.loans-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  padding-right: 5px;
}

.loan-card {
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.loan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #3498db;
}

.loan-card-header {
  padding: 12px 15px;
  background: white;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loan-number {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.loan-status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.loan-status.active {
  background: #d4edda;
  color: #155724;
}

.loan-status.defaulted {
  background: #f8d7da;
  color: #721c24;
}

.loan-card-body {
  padding: 15px;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.customer-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.customer-details {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.customer-phone {
  font-size: 0.85rem;
  color: #666;
}

.loan-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-item .label {
  font-size: 0.75rem;
  color: #999;
}

.summary-item .value {
  font-size: 0.95rem;
  color: #333;
  font-weight: 500;
}

.loan-card-footer {
  padding: 12px 15px;
  background: white;
  border-top: 1px solid #eef2f6;
  text-align: right;
}

.btn-select {
  padding: 6px 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-select:hover {
  background: #2980b9;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-results i {
  font-size: 3rem;
  color: #cbd5e0;
  margin-bottom: 10px;
}

.no-results p {
  font-size: 1rem;
  margin: 0;
}

/* Payment Form */
.payment-form {
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

/* Selected Loan Card */
.selected-loan-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.btn-change {
  padding: 6px 12px;
  background: #f8fafc;
  color: #666;
  border: 1px solid #eef2f6;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-change:hover {
  background: #eef2f6;
  color: #3498db;
}

.loan-summary-detailed {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loan-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

.loan-number-label {
  font-size: 0.9rem;
  color: #666;
}

.loan-number-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #3498db;
}

.customer-info-detailed {
  display: flex;
  align-items: center;
  gap: 15px;
}

.customer-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3498db;
}

.customer-name-large {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 3px;
}

.customer-phone-large {
  font-size: 0.95rem;
  color: #666;
}

.loan-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .loan-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat.highlight {
  background: #e3f2fd;
  border: 1px solid #3498db;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.stat.highlight .stat-value {
  color: #3498db;
}

/* Form */
.form {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  margin-bottom: 5px;
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
  font-size: 0.95rem;
}

.form-group label i {
  color: #3498db;
  width: 18px;
}

.form-control {
  width: 80%;
  padding: 12px 15px;
  border: 2px solid #d1dae2;
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

.amount-hints {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
}

.input-hint {
  font-size: 0.75rem;
  color: #999;
}

.quick-amounts {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.quick-amount-btn {
  padding: 6px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-amount-btn:hover:not(:disabled) {
  background: #1976d2;
  color: white;
}

.quick-amount-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
}

/* Conditional Fields */
.conditional-fields {
  margin: 25px 0;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.conditional-fields h4 {
  margin: 0 0 15px;
  color: #333;
  font-size: 1rem;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f6;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eef2f6;
}

.btn-primary,
.btn-secondary {
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 1rem;
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

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #eef2f6;
}

.btn-secondary:hover {
  background: #f8fafc;
  color: #333;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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

/* Success Modal */
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

.modal-content {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.success-modal {
  text-align: center;
  padding: 30px;
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

.modal-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.modal-icon.success {
  background: #d4edda;
  color: #27ae60;
  font-size: 2.5rem;
}

.success-modal h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

/* Payment Receipt */
.payment-receipt {
  background: #f8fafc;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 25px;
  text-align: left;
  border: 1px solid #eef2f6;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f6;
}

.receipt-header h4 {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.receipt-number {
  font-size: 0.9rem;
  color: #3498db;
  font-weight: 600;
}

.receipt-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.receipt-label {
  color: #666;
  font-size: 0.9rem;
}

.receipt-value {
  color: #333;
  font-weight: 500;
}

.receipt-value.amount {
  color: #27ae60;
  font-size: 1.1rem;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-success {
  padding: 10px 20px;
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
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
  .record-payment-container {
    padding: 15px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-left h1 {
    font-size: 1.5rem;
  }

  .loan-stats {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .modal-actions {
    flex-direction: column;
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
</style>
