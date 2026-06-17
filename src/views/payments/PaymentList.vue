<template>
  <div class="payment-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Malipo Yote</h1>
        <p class="payment-count" v-if="!loading">
          Jumla ya malipo: <strong>{{ pagination.total }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportPayments">
          <i class="fas fa-download"></i>
          <span>Pakua</span>
        </button>
        <button
          class="btn-filter-toggle"
          @click="showFilters = !showFilters"
          :class="{ active: hasActiveFilters }"
        >
          <i class="fas fa-filter"></i>
          <span>Filters</span>
          <span v-if="activeFilterCount" class="filter-badge">{{ activeFilterCount }}</span>
        </button>
        <router-link to="/payments/create" class="btn-primary">
          <i class="fas fa-plus-circle"></i>
          <span>Rekodi Malipo</span>
        </router-link>
      </div>
    </div>

    <!-- Filters Panel -->
    <transition name="slide">
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-grid">
          <!-- Search -->
          <div class="filter-group">
            <label>
              <i class="fas fa-search"></i>
              Tafuta
            </label>
            <input
              type="text"
              v-model="filters.search"
              @input="debouncedSearch"
              placeholder="Namba ya malipo, jina la mteja..."
              class="form-control"
            />
          </div>

          <!-- Payment Method Filter -->
          <div class="filter-group">
            <label>
              <i class="fas fa-money-bill"></i>
              Njia ya Malipo
            </label>
            <select v-model="filters.method" @change="loadPayments" class="form-control">
              <option value="">Zote</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <!-- Payment Type Filter -->
          <div class="filter-group">
            <label>
              <i class="fas fa-tag"></i>
              Aina ya Malipo
            </label>
            <select v-model="filters.type" @change="loadPayments" class="form-control">
              <option value="">Zote</option>
              <option value="partial">Sehemu</option>
              <option value="full">Kamilifu</option>
              <option value="penalty">Adhabu</option>
            </select>
          </div>

          <!-- Verification Status -->
          <div class="filter-group">
            <label>
              <i class="fas fa-check-circle"></i>
              Imehakikiwa
            </label>
            <select v-model="filters.verified" @change="loadPayments" class="form-control">
              <option value="">Zote</option>
              <option value="true">Ndiyo</option>
              <option value="false">Hapana</option>
            </select>
          </div>

          <!-- Date Range -->
          <div class="filter-group">
            <label>
              <i class="fas fa-calendar-alt"></i>
              Kuanza Tarehe
            </label>
            <input
              type="date"
              v-model="filters.date_from"
              @change="loadPayments"
              class="form-control"
            />
          </div>

          <div class="filter-group">
            <label>
              <i class="fas fa-calendar-alt"></i>
              Mpaka Tarehe
            </label>
            <input
              type="date"
              v-model="filters.date_to"
              @change="loadPayments"
              class="form-control"
            />
          </div>

          <!-- Amount Range -->
          <div class="filter-group">
            <label>
              <i class="fas fa-money-bill-wave"></i>
              Kiasi kutoka
            </label>
            <input
              type="number"
              v-model.number="filters.min_amount"
              @input="debouncedSearch"
              placeholder="Kiasi cha chini"
              class="form-control"
            />
          </div>

          <div class="filter-group">
            <label>
              <i class="fas fa-money-bill-wave"></i>
              Kiasi mpaka
            </label>
            <input
              type="number"
              v-model.number="filters.max_amount"
              @input="debouncedSearch"
              placeholder="Kiasi cha juu"
              class="form-control"
            />
          </div>

          <!-- Sort By -->
          <div class="filter-group">
            <label>
              <i class="fas fa-sort"></i>
              Panga kwa
            </label>
            <select v-model="filters.sortBy" @change="loadPayments" class="form-control">
              <option value="payment_date">Tarehe ya Malipo</option>
              <option value="amount">Kiasi</option>
              <option value="created_at">Tarehe ya Kurekodi</option>
            </select>
          </div>

          <!-- Sort Order -->
          <div class="filter-group">
            <label>
              <i class="fas fa-sort-amount-down"></i>
              Mpango
            </label>
            <select v-model="filters.sortOrder" @change="loadPayments" class="form-control">
              <option value="desc">Kushuka (Zinazoanza)</option>
              <option value="asc">Kupanda (Zinazomaliza)</option>
            </select>
          </div>

          <!-- Per Page -->
          <div class="filter-group">
            <label>
              <i class="fas fa-list"></i>
              Idadi kwa Ukurasa
            </label>
            <select v-model="filters.perPage" @change="loadPayments" class="form-control">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <!-- Active Filters -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span class="active-filters-label">
            <i class="fas fa-filter"></i>
            Vichujio vilivyowekwa:
          </span>
          <div class="filter-tags">
            <span v-if="filters.search" class="filter-tag">
              <i class="fas fa-search"></i>
              "{{ filters.search }}"
              <i @click="clearFilter('search')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.method" class="filter-tag">
              <i class="fas fa-money-bill"></i>
              {{ getMethodText(filters.method) }}
              <i @click="clearFilter('method')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.type" class="filter-tag">
              <i class="fas fa-tag"></i>
              {{ getTypeText(filters.type) }}
              <i @click="clearFilter('type')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.verified" class="filter-tag">
              <i class="fas fa-check-circle"></i>
              {{ filters.verified === 'true' ? 'Imehakikiwa' : 'Haijahakikiwa' }}
              <i @click="clearFilter('verified')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.date_from" class="filter-tag">
              <i class="fas fa-calendar"></i>
              Kuanzia: {{ formatDate(filters.date_from) }}
              <i @click="clearFilter('date_from')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.date_to" class="filter-tag">
              <i class="fas fa-calendar"></i>
              Mpaka: {{ formatDate(filters.date_to) }}
              <i @click="clearFilter('date_to')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.min_amount" class="filter-tag">
              <i class="fas fa-money-bill"></i>
              ≥ {{ formatCurrency(filters.min_amount) }}
              <i @click="clearFilter('min_amount')" class="fas fa-times remove-filter"></i>
            </span>
            <span v-if="filters.max_amount" class="filter-tag">
              <i class="fas fa-money-bill"></i>
              ≤ {{ formatCurrency(filters.max_amount) }}
              <i @click="clearFilter('max_amount')" class="fas fa-times remove-filter"></i>
            </span>
            <button @click="clearAllFilters" class="clear-all-btn">
              <i class="fas fa-trash-alt"></i>
              Futa yote
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Statistics Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #3498db, #2980b9)">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ formatCurrency(statistics.todayTotal) }}</span>
          <span class="stat-label">Malipo ya Leo</span>
          <span class="stat-sub">{{ statistics.todayCount }} malipo</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #27ae60, #229954)">
          <i class="fas fa-calendar-week"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ formatCurrency(statistics.weekTotal) }}</span>
          <span class="stat-label">Wiki Hii</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f39c12, #e67e22)">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ formatCurrency(statistics.monthTotal) }}</span>
          <span class="stat-label">Mwezi Huu</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #9b59b6, #8e44ad)">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ statistics.pendingVerification }}</span>
          <span class="stat-label">Zinazosubiri Kuhakikiwa</span>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card total">
        <div class="summary-icon">
          <i class="fas fa-coins"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Jumla ya Malipo Yote</span>
          <span class="summary-value">{{ formatCurrency(summary.total) }}</span>
        </div>
      </div>

      <div class="summary-card cash">
        <div class="summary-icon">
          <i class="fas fa-money-bill"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Cash</span>
          <span class="summary-value">{{ formatCurrency(summary.cash) }}</span>
        </div>
      </div>

      <div class="summary-card bank">
        <div class="summary-icon">
          <i class="fas fa-university"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Bank Transfer</span>
          <span class="summary-value">{{ formatCurrency(summary.bank) }}</span>
        </div>
      </div>

      <div class="summary-card mobile">
        <div class="summary-icon">
          <i class="fas fa-mobile-alt"></i>
        </div>
        <div class="summary-content">
          <span class="summary-label">Mobile Money</span>
          <span class="summary-value">{{ formatCurrency(summary.mobile) }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia malipo...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadPayments" class="btn-retry">
        <i class="fas fa-redo"></i>
        Jaribu Tena
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="payments.length === 0" class="empty-state">
      <div class="empty-illustration">
        <i class="fas fa-money-bill-wave"></i>
        <i class="fas fa-question"></i>
      </div>
      <h3>Hakuna malipo yaliyopatikana</h3>
      <p v-if="hasActiveFilters">
        Hakuna malipo yanayolingana na vichujio ulivyoweka. Jaribu kubadilisha vichujio.
      </p>
      <p v-else>
        Bado hakuna malipo yaliyorekodiwa. Bonyeza kitufe hapa chini kurekodi malipo ya kwanza.
      </p>
      <div class="empty-actions">
        <button v-if="hasActiveFilters" @click="clearAllFilters" class="btn-secondary">
          <i class="fas fa-times"></i>
          Futa Vichujio
        </button>
        <router-link to="/payments/create" class="btn-primary">
          <i class="fas fa-plus-circle"></i>
          Rekodi Malipo
        </router-link>
      </div>
    </div>

    <!-- Payments Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="payments-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th>Namba ya Malipo</th>
              <th>Mteja</th>
              <!-- <th>Namba ya Mkopo</th> -->
              <th>Kiasi</th>
              <th>Aina</th>
              <th>Njia</th>
              <th>Tarehe ya Malipo</th>
              <!-- <th>Imehakikiwa</th> -->
              <th>Aliyerekodi</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="payment in payments"
              :key="payment.id"
              :class="{ 'row-selected': selectedPayments.includes(payment.id) }"
            >
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  v-model="selectedPayments"
                  :value="payment.id"
                  @change="updateSelectAll"
                />
              </td>
              <td>
                <span class="payment-number">#{{ payment.payment_number }}</span>
              </td>
              <td>
                <div class="customer-cell" @click="viewCustomer(payment.customer)">
                  <img
                    :src="getCustomerPhoto(payment)"
                    :alt="getCustomerName(payment)"
                    class="customer-avatar"
                    @error="handleImageError"
                  />
                  <div class="customer-info">
                    <span class="customer-name">
                      {{ getCustomerName(payment) }}
                    </span>
                    <span class="customer-phone">{{ getCustomerPhone(payment) }}</span>
                  </div>
                </div>
              </td>
              <!-- <td>
                <router-link :to="`/loans/${payment.loan_id}`" class="loan-link">
                  #{{ getLoanNumber(payment) }}
                </router-link>
              </td> -->
              <td>
                <span class="amount">{{ formatCurrency(payment.amount) }}</span>
              </td>
              <td>
                <span class="badge" :class="payment.payment_type">
                  {{ payment.type_text || getTypeText(payment.payment_type) }}
                </span>
              </td>
              <td>
                <div class="payment-method" :title="getMethodDetails(payment)">
                  <i :class="getMethodIcon(payment.payment_method)"></i>
                  <span>{{ payment.method_text || getMethodText(payment.payment_method) }}</span>
                </div>
                <div v-if="payment.transaction_reference" class="transaction-ref">
                  <small>Ref: {{ payment.transaction_reference }}</small>
                </div>
              </td>
              <td>
                <div class="date-info">
                  <span class="date">{{ formatDate(payment.payment_date) }}</span>
                  <span class="time">{{ formatTime(payment.payment_date) }}</span>
                </div>
              </td>
              <!-- <td>
                <div class="verification-status">
                  <span class="badge" :class="payment.verified ? 'verified' : 'unverified'">
                    {{ payment.status_badge || (payment.verified ? 'Ndiyo' : 'Hapana') }}
                  </span>
                  <span v-if="payment.verified_by" class="verifier">
                    na {{ payment.verified_by }}
                  </span>
                </div> 
              </td> -->
              <td>
                <div class="recorder-info">
                  <span class="recorder-name">{{ payment.recorded_by || 'Afisa Mikopo' }}</span>
                  <span class="recorder-time">{{ formatTime(payment.created_at) }}</span>
                </div>
              </td>
              <td>
                <div class="action-dropdown">
                  <button class="action-menu-btn" @click.stop="toggleActionMenu(payment.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeActionMenu === payment.id" class="action-menu">
                    <button @click="viewPayment(payment)" class="action-menu-item">
                      <i class="fas fa-eye"></i>
                      <span>Angalia</span>
                    </button>

                    <button @click="printReceipt(payment)" class="action-menu-item">
                      <i class="fas fa-print"></i>
                      <span>Chapisha Risiti</span>
                    </button>

                    <button @click="sendReceipt(payment)" class="action-menu-item">
                      <i class="fas fa-envelope"></i>
                      <span>Tuma Risiti</span>
                    </button>

                    <button
                      v-if="!payment.verified"
                      @click="verifyPayment(payment)"
                      class="action-menu-item success"
                    >
                      <i class="fas fa-check-circle"></i>
                      <span>Hakiki</span>
                    </button>

                    <button
                      v-if="canReverse(payment)"
                      @click="reversePayment(payment)"
                      class="action-menu-item warning"
                    >
                      <i class="fas fa-undo"></i>
                      <span>Geuza</span>
                    </button>

                    <div class="action-menu-divider"></div>

                    <button
                      v-if="canDelete(payment)"
                      @click="deletePayment(payment)"
                      class="action-menu-item danger"
                    >
                      <i class="fas fa-trash-alt"></i>
                      <span>Futa</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedPayments.length > 0" class="bulk-actions">
        <div class="bulk-info">
          <i class="fas fa-check-circle"></i>
          <span
            >Umechagua <strong>{{ selectedPayments.length }}</strong> malipo</span
          >
        </div>
        <div class="bulk-buttons">
          <button class="btn-bulk" @click="bulkVerify" :disabled="!hasUnverifiedSelected">
            <i class="fas fa-check-circle"></i>
            Hakiki
          </button>
          <button class="btn-bulk" @click="bulkPrint">
            <i class="fas fa-print"></i>
            Chapisha Risiti
          </button>
          <button
            class="btn-bulk text-danger"
            @click="confirmBulkDelete"
            :disabled="!hasDeletableSelected"
          >
            <i class="fas fa-trash-alt"></i>
            Futa
          </button>
          <button class="btn-bulk" @click="clearSelection">
            <i class="fas fa-times"></i>
            Ghairi
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.lastPage > 1">
        <div class="pagination-info">
          Showing {{ pagination.from }} - {{ pagination.to }} of {{ pagination.total }} entries
        </div>
        <div class="pagination-buttons">
          <button
            @click="changePage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage === 1"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <button
            v-for="page in paginationPages"
            :key="page"
            @click="changePage(page)"
            class="pagination-btn"
            :class="{ active: page === pagination.currentPage }"
          >
            {{ page }}
          </button>

          <button
            @click="changePage(pagination.currentPage + 1)"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- View Payment Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>Taarifa za Malipo</h3>
          <button class="close-btn" @click="closeViewModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedPayment">
          <div class="payment-details-grid">
            <div class="detail-section">
              <h4>Maelezo ya Malipo</h4>
              <div class="detail-row">
                <span class="detail-label">Namba ya Malipo:</span>
                <span class="detail-value">#{{ selectedPayment.payment_number }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Namba ya Risiti:</span>
                <span class="detail-value">{{ selectedPayment.receipt_number }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Kiasi:</span>
                <span class="detail-value large">{{ formatCurrency(selectedPayment.amount) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Aina:</span>
                <span class="detail-value">
                  <span class="badge" :class="selectedPayment.payment_type">
                    {{ selectedPayment.type_text || getTypeText(selectedPayment.payment_type) }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Njia:</span>
                <span class="detail-value">
                  <i :class="getMethodIcon(selectedPayment.payment_method)"></i>
                  {{ selectedPayment.method_text || getMethodText(selectedPayment.payment_method) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tarehe ya Malipo:</span>
                <span class="detail-value">{{ formatDate(selectedPayment.payment_date) }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>Taarifa za Mteja</h4>
              <div class="customer-detail-card" v-if="selectedPayment.customer">
                <img
                  :src="getCustomerPhoto(selectedPayment)"
                  :alt="getCustomerName(selectedPayment)"
                  class="customer-detail-avatar"
                  @error="handleImageError"
                />
                <div class="customer-detail-info">
                  <span class="customer-detail-name">{{ getCustomerName(selectedPayment) }}</span>
                  <span class="customer-detail-phone">{{ getCustomerPhone(selectedPayment) }}</span>
                  <router-link
                    :to="`/customers/${selectedPayment.customer.id}`"
                    class="customer-detail-link"
                  >
                    <i class="fas fa-external-link-alt"></i>
                    Angalia Mteja
                  </router-link>
                </div>
              </div>
              <div v-else class="no-customer">Hakuna taarifa za mteja</div>
            </div>

            <div class="detail-section">
              <h4>Taarifa za Mkopo</h4>
              <div class="detail-row">
                <span class="detail-label">Namba ya Mkopo:</span>
                <span class="detail-value">
                  <router-link :to="`/loans/${selectedPayment.loan_id}`">
                    #{{ getLoanNumber(selectedPayment) }}
                  </router-link>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Salio kabla:</span>
                <span class="detail-value">{{
                  formatCurrency(selectedPayment.balance_before)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Salio baada:</span>
                <span class="detail-value">{{
                  formatCurrency(selectedPayment.balance_after)
                }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedPayment.payment_method === 'bank_transfer'">
              <h4>Maelezo ya Benki</h4>
              <div class="detail-row">
                <span class="detail-label">Benki:</span>
                <span class="detail-value">{{ selectedPayment.bank_name }}</span>
              </div>
              <div class="detail-row" v-if="selectedPayment.transaction_reference">
                <span class="detail-label">Transaction Ref:</span>
                <span class="detail-value">{{ selectedPayment.transaction_reference }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedPayment.payment_method === 'mobile_money'">
              <h4>Maelezo ya Mobile Money</h4>
              <div class="detail-row">
                <span class="detail-label">Mtoa Huduma:</span>
                <span class="detail-value">{{ selectedPayment.mobile_provider }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Namba ya Simu:</span>
                <span class="detail-value">{{ selectedPayment.mobile_number }}</span>
              </div>
              <div class="detail-row" v-if="selectedPayment.transaction_id">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">{{ selectedPayment.transaction_id }}</span>
              </div>
            </div>

            <div class="detail-section" v-if="selectedPayment.cheque_number">
              <h4>Maelezo ya Cheque</h4>
              <div class="detail-row">
                <span class="detail-label">Namba ya Cheque:</span>
                <span class="detail-value">{{ selectedPayment.cheque_number }}</span>
              </div>
            </div>

            <div class="detail-section full-width">
              <h4>Maelezo ya Kurekodi</h4>
              <div class="detail-row">
                <span class="detail-label">Aliyerekodi:</span>
                <span class="detail-value">{{ selectedPayment.recorded_by || 'System' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tarehe ya Kurekodi:</span>
                <span class="detail-value">{{ formatDateTime(selectedPayment.created_at) }}</span>
              </div>
              <div class="detail-row" v-if="selectedPayment.verified">
                <span class="detail-label">Aliyehakiki:</span>
                <span class="detail-value">{{ selectedPayment.verified_by }}</span>
              </div>
              <div class="detail-row" v-if="selectedPayment.verified">
                <span class="detail-label">Tarehe ya Kuhakiki:</span>
                <span class="detail-value">{{ formatDateTime(selectedPayment.verified_at) }}</span>
              </div>
            </div>

            <div class="detail-section full-width" v-if="selectedPayment.notes">
              <h4>Maelezo ya Ziada</h4>
              <p class="notes-text">{{ selectedPayment.notes }}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-secondary">Funga</button>
          <button @click="printReceipt(selectedPayment)" class="btn-primary">
            <i class="fas fa-print"></i>
            Chapisha Risiti
          </button>
        </div>
      </div>
    </div>

    <!-- Reverse Payment Modal -->
    <div v-if="showReverseModal" class="modal-overlay" @click="closeReverseModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning">
            <i class="fas fa-undo"></i>
          </div>
          <h3>Geuza Malipo</h3>
          <button class="close-btn" @click="closeReverseModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedPayment">
          <p>Una uhakika unataka kugeuza malipo haya?</p>
          <div class="payment-summary">
            <p><strong>Namba ya Malipo:</strong> #{{ selectedPayment.payment_number }}</p>
            <p><strong>Kiasi:</strong> {{ formatCurrency(selectedPayment.amount) }}</p>
            <p><strong>Tarehe:</strong> {{ formatDate(selectedPayment.payment_date) }}</p>
            <p><strong>Mteja:</strong> {{ getCustomerName(selectedPayment) }}</p>
          </div>
          <div class="warning-note">
            <i class="fas fa-exclamation-triangle"></i>
            Kugeuza malipo kutaondoa malipo haya kwenye mfumo na kurejesha salio la mkopo.
          </div>
          <div class="form-group required">
            <label for="reverse_reason">Sababu ya kugeuza</label>
            <textarea
              id="reverse_reason"
              v-model="reverseReason"
              class="form-control"
              rows="3"
              placeholder="Weka sababu ya kugeuza malipo haya..."
              required
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeReverseModal" class="btn-secondary">Ghairi</button>
          <button
            @click="confirmReverse"
            class="btn-warning"
            :disabled="actionLoading || !reverseReason"
          >
            <span v-if="actionLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-undo"></i>
              Ndiyo, Geuza
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon danger">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Futa Malipo</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p v-if="paymentToDelete">Una uhakika unataka kufuta malipo haya?</p>
          <p v-else>
            Una uhakika unataka kufuta malipo <strong>{{ selectedPayments.length }}</strong
            >?
          </p>

          <div v-if="paymentToDelete" class="payment-summary">
            <p><strong>Namba:</strong> #{{ paymentToDelete.payment_number }}</p>
            <p><strong>Kiasi:</strong> {{ formatCurrency(paymentToDelete.amount) }}</p>
            <p><strong>Mteja:</strong> {{ getCustomerName(paymentToDelete) }}</p>
          </div>

          <div v-else class="selected-list">
            <div v-for="id in selectedPayments.slice(0, 3)" :key="id" class="selected-item">
              <i class="fas fa-money-bill"></i>
              <span>{{ getPaymentNumber(id) }}</span>
            </div>
            <div v-if="selectedPayments.length > 3" class="more-items">
              ... na wengine {{ selectedPayments.length - 3 }}
            </div>
          </div>

          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Hatua hii haiwezi kutenguliwa. Malipo yatafutwa kabisa kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="confirmDelete" class="btn-danger" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-trash-alt"></i>
              Futa
            </span>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency, formatDate, formatTime, formatDateTime } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const router = useRouter()

// State
const payments = ref([])
const loading = ref(false)
const error = ref(null)
const showFilters = ref(false)
const selectedPayments = ref([])
const selectAll = ref(false)
const activeActionMenu = ref(null)
const showViewModal = ref(false)
const showReverseModal = ref(false)
const showDeleteModal = ref(false)
const selectedPayment = ref(null)
const paymentToDelete = ref(null)
const reverseReason = ref('')
const actionLoading = ref(false)
const deleteLoading = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Base URL for images
// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// Filters
const filters = reactive({
  search: '',
  method: '',
  type: '',
  verified: '',
  date_from: '',
  date_to: '',
  min_amount: '',
  max_amount: '',
  sortBy: 'payment_date',
  sortOrder: 'desc',
  perPage: 10,
  page: 1,
})

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  total: 0,
  from: 0,
  to: 0,
})

const statistics = ref({
  todayTotal: 0,
  todayCount: 0,
  weekTotal: 0,
  monthTotal: 0,
  pendingVerification: 0,
})

const summary = ref({
  total: 0,
  cash: 0,
  bank: 0,
  mobile: 0,
})

// Computed
const hasActiveFilters = computed(() => {
  return (
    filters.search ||
    filters.method ||
    filters.type ||
    filters.verified ||
    filters.date_from ||
    filters.date_to ||
    filters.min_amount ||
    filters.max_amount
  )
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.search) count++
  if (filters.method) count++
  if (filters.type) count++
  if (filters.verified) count++
  if (filters.date_from) count++
  if (filters.date_to) count++
  if (filters.min_amount) count++
  if (filters.max_amount) count++
  return count
})

const paginationPages = computed(() => {
  const pages = []
  const maxVisible = 5

  if (!pagination.lastPage || !pagination.currentPage) {
    return pages
  }

  let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(pagination.lastPage, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const hasUnverifiedSelected = computed(() => {
  return selectedPayments.value.some((id) => {
    const payment = payments.value.find((p) => p.id === id)
    return payment && !payment.verified
  })
})

const hasDeletableSelected = computed(() => {
  return selectedPayments.value.length > 0
})

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Enhanced Customer Data Helpers
const getCustomerName = (payment) => {
  if (!payment) return 'Mteja'

  // Try to get customer from payment.customer
  if (payment.customer) {
    return (
      payment.customer.full_name ||
      `${payment.customer.first_name || ''} ${payment.customer.last_name || ''}`.trim() ||
      'Mteja'
    )
  }

  // Try to get customer from payment.loan.customer
  if (payment.loan?.customer) {
    const customer = payment.loan.customer
    return (
      customer.full_name ||
      `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
      'Mteja'
    )
  }

  // Try to get from customer_name field if available
  if (payment.customer_name) {
    return payment.customer_name
  }

  return 'Mteja'
}

const getCustomerPhone = (payment) => {
  if (!payment) return 'Namba haipatikani'

  // Try to get phone from payment.customer
  if (payment.customer?.phone) {
    return payment.customer.phone
  }

  // Try to get phone from payment.loan.customer
  if (payment.loan?.customer?.phone) {
    return payment.loan.customer.phone
  }

  // Try to get from customer_phone field if available
  if (payment.customer_phone) {
    return payment.customer_phone
  }

  return 'Namba haipatikani'
}

const getCustomerPhoto = (payment) => {
  if (!payment) return '/default-avatar.png'

  let photoPath = null

  // Try to get photo from payment.customer
  if (payment.customer?.profile_photo) {
    photoPath = payment.customer.profile_photo
  }
  // Try to get photo from payment.customer.profile_photo_url
  else if (payment.customer?.profile_photo_url) {
    return payment.customer.profile_photo_url
  }
  // Try to get photo from payment.loan.customer
  else if (payment.loan?.customer?.profile_photo) {
    photoPath = payment.loan.customer.profile_photo
  } else if (payment.loan?.customer?.profile_photo_url) {
    return payment.loan.customer.profile_photo_url
  }

  if (photoPath) {
    // If it's already a full URL
    if (photoPath.startsWith('http')) {
      return photoPath
    }
    // Construct full URL
    return `${baseUrl}/storage/${photoPath}`
  }

  return '/default-avatar.png'
}

const getCustomerId = (payment) => {
  if (!payment) return null

  if (payment.customer?.id) {
    return payment.customer.id
  }

  if (payment.loan?.customer?.id) {
    return payment.loan.customer.id
  }

  return null
}

const getLoanNumber = (payment) => {
  if (!payment) return 'Namba haipatikani'

  if (payment.loan_number) {
    return payment.loan_number
  }

  if (payment.loan?.loan_number) {
    return payment.loan.loan_number
  }

  return 'Namba haipatikani'
}

const handleImageError = (event) => {
  event.target.src = '/default-avatar.png'
}

// API Methods
const loadPayments = async () => {
  loading.value = true
  error.value = null

  try {
    // Build query parameters
    const params = {
      page: filters.page,
      per_page: filters.perPage,
      sort_field: filters.sortBy,
      sort_order: filters.sortOrder,
    }

    // Add filters if they exist
    if (filters.search) params.search = filters.search
    if (filters.method) params.payment_method = filters.method
    if (filters.type) params.payment_type = filters.type
    if (filters.verified !== '') params.verified = filters.verified
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
    if (filters.min_amount) params.min_amount = filters.min_amount
    if (filters.max_amount) params.max_amount = filters.max_amount

    console.log('Fetching payments with params:', params)
    const response = await axios.get(`${API_URL}/payments`, { params })
    console.log('API Response:', response.data)

    if (response.data.success && response.data.data) {
      const paginatedData = response.data.data

      // Process payments to ensure we have customer data
      payments.value = (paginatedData.data || []).map((payment) => {
        // Log each payment to see structure
        console.log('Payment data:', payment)
        return payment
      })

      // Update pagination
      pagination.currentPage = paginatedData.current_page || 1
      pagination.lastPage = paginatedData.last_page || 1
      pagination.perPage = paginatedData.per_page || filters.perPage
      pagination.total = paginatedData.total || 0
      pagination.from = paginatedData.from || 0
      pagination.to = paginatedData.to || 0
    }

    // Load statistics separately
    await loadStatistics()
  } catch (err) {
    console.error('Error loading payments:', err)
    error.value = err.response?.data?.message || 'Imeshindwa kupakia malipo. Tafadhali jaribu tena.'
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await axios.get(`${API_URL}/payments/stats`)
    console.log('Statistics response:', response.data)

    if (response.data.success && response.data.data) {
      const stats = response.data.data

      statistics.value = {
        todayTotal: stats.today?.total || 0,
        todayCount: stats.today?.count || 0,
        weekTotal: stats.week?.total || 0,
        monthTotal: stats.month?.total || 0,
        pendingVerification: stats.pending_verification || 0,
      }

      // Calculate summary by payment method
      const byMethod = stats.by_method || []
      summary.value = {
        total: stats.total || 0,
        cash: byMethod.find((m) => m.payment_method === 'cash')?.total || 0,
        bank: byMethod.find((m) => m.payment_method === 'bank_transfer')?.total || 0,
        mobile: byMethod.find((m) => m.payment_method === 'mobile_money')?.total || 0,
      }
    }
  } catch (err) {
    console.error('Error loading payment statistics:', err)
  }
}

const debouncedSearch = debounce(() => {
  filters.page = 1
  loadPayments()
}, 500)

const clearFilter = (filter) => {
  filters[filter] = ''
  filters.page = 1
  loadPayments()
}

const clearAllFilters = () => {
  filters.search = ''
  filters.method = ''
  filters.type = ''
  filters.verified = ''
  filters.date_from = ''
  filters.date_to = ''
  filters.min_amount = ''
  filters.max_amount = ''
  filters.sortBy = 'payment_date'
  filters.sortOrder = 'desc'
  filters.perPage = 10
  filters.page = 1
  loadPayments()
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    filters.page = page
    loadPayments()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
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

const getMethodIcon = (method) => {
  const icons = {
    cash: 'fas fa-money-bill',
    bank_transfer: 'fas fa-university',
    mobile_money: 'fas fa-mobile-alt',
    cheque: 'fas fa-money-check',
  }
  return icons[method] || 'fas fa-money-bill'
}

const getMethodDetails = (payment) => {
  if (payment.payment_method === 'bank_transfer' && payment.transaction_reference) {
    return `Ref: ${payment.transaction_reference}`
  }
  if (payment.payment_method === 'mobile_money' && payment.transaction_id) {
    return `ID: ${payment.transaction_id}`
  }
  if (payment.payment_method === 'cheque' && payment.cheque_number) {
    return `Cheque: ${payment.cheque_number}`
  }
  return ''
}

const getTypeText = (type) => {
  const texts = {
    partial: 'Sehemu',
    full: 'Kamilifu',
    penalty: 'Adhabu',
  }
  return texts[type] || type
}

const getPaymentNumber = (id) => {
  const payment = payments.value.find((p) => p.id === id)
  return payment ? payment.payment_number : ''
}

// Selection methods
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedPayments.value = payments.value.map((p) => p.id)
  } else {
    selectedPayments.value = []
  }
}

const updateSelectAll = () => {
  selectAll.value = selectedPayments.value.length === payments.value.length
}

const clearSelection = () => {
  selectedPayments.value = []
  selectAll.value = false
}

// Action Menu methods
const toggleActionMenu = (paymentId) => {
  if (activeActionMenu.value === paymentId) {
    activeActionMenu.value = null
  } else {
    activeActionMenu.value = paymentId
  }
}

const closeActionMenu = () => {
  activeActionMenu.value = null
}

// Handle click outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.action-dropdown')) {
    closeActionMenu()
  }
}

// Permissions
const canReverse = (payment) => {
  // Can reverse if payment is verified and not too old (e.g., within 30 days)
  if (!payment.verified) return true
  const paymentDate = new Date(payment.payment_date)
  const now = new Date()
  const daysDiff = Math.floor((now - paymentDate) / (1000 * 60 * 60 * 24))
  return daysDiff <= 30
}

const canDelete = (payment) => {
  // Can delete if not verified or recent unverified payment
  return !payment.verified
}

// Navigation
const viewCustomer = (customer) => {
  const customerId = getCustomerId(selectedPayment.value)
  if (customerId) {
    router.push(`/customers/${customerId}`)
  }
}

const viewPayment = (payment) => {
  selectedPayment.value = payment
  showViewModal.value = true
  closeActionMenu()
}

const closeViewModal = () => {
  showViewModal.value = false
  selectedPayment.value = null
}

// Actions
const printReceipt = (payment) => {
  showToastMessage(`Kipengele cha kuchapisha risiti kitaongezwa hivi karibuni`, 'info')
  closeActionMenu()
}

const sendReceipt = (payment) => {
  showToastMessage(`Risiti imetumwa kwa ${getCustomerPhone(payment)}`, 'success')
  closeActionMenu()
}

const verifyPayment = async (payment) => {
  actionLoading.value = true

  try {
    const response = await axios.post(`${API_URL}/payments/${payment.id}/verify`)

    if (response.data.success) {
      showToastMessage('Malipo yamehakikiwa kwa mafanikio', 'success')
      closeActionMenu()
      loadPayments() // Reload to get updated data
    }
  } catch (err) {
    console.error('Error verifying payment:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kuhakiki malipo', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Reverse modal
const reversePayment = (payment) => {
  selectedPayment.value = payment
  reverseReason.value = ''
  showReverseModal.value = true
  closeActionMenu()
}

const closeReverseModal = () => {
  showReverseModal.value = false
  selectedPayment.value = null
  reverseReason.value = ''
}

const confirmReverse = async () => {
  if (!reverseReason.value) return

  actionLoading.value = true

  try {
    const response = await axios.post(`${API_URL}/payments/${selectedPayment.value.id}/reverse`, {
      reason: reverseReason.value,
    })

    if (response.data.success) {
      showToastMessage(`Malipo #${selectedPayment.value.payment_number} yamegeuzwa`, 'success')
      closeReverseModal()
      loadPayments() // Reload to get updated data
    }
  } catch (err) {
    console.error('Error reversing payment:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kugeuza malipo', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Delete methods
const deletePayment = (payment) => {
  paymentToDelete.value = payment
  showDeleteModal.value = true
  closeActionMenu()
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  paymentToDelete.value = null
}

const confirmDelete = async () => {
  deleteLoading.value = true

  try {
    if (paymentToDelete.value) {
      // Delete single payment
      await axios.delete(`${API_URL}payments/${paymentToDelete.value.id}`)
      showToastMessage('Malipo yamefutwa kwa mafanikio', 'success')
    } else {
      // Bulk delete
      await axios.post(`${API_URL}payments/bulk-delete`, {
        ids: selectedPayments.value,
      })
      showToastMessage(`Malipo ${selectedPayments.value.length} yamefutwa`, 'success')
      clearSelection()
    }

    closeDeleteModal()
    loadPayments() // Reload to get updated data
  } catch (err) {
    console.error('Error deleting payment:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kufuta malipo', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Bulk actions
const bulkVerify = async () => {
  const unverifiedIds = selectedPayments.value.filter((id) => {
    const payment = payments.value.find((p) => p.id === id)
    return payment && !payment.verified
  })

  if (unverifiedIds.length === 0) {
    showToastMessage('Hakuna malipo yasiyohakikiwa yaliyochaguliwa', 'info')
    return
  }

  actionLoading.value = true

  try {
    const response = await axios.post(`${API_URL}/payments/bulk-verify`, {
      ids: unverifiedIds,
    })

    if (response.data.success) {
      showToastMessage(`Malipo ${unverifiedIds.length} yamehakikiwa`, 'success')
      clearSelection()
      loadPayments() // Reload to get updated data
    }
  } catch (err) {
    console.error('Error bulk verifying payments:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kuhakiki malipo', 'error')
  } finally {
    actionLoading.value = false
  }
}

const bulkPrint = () => {
  showToastMessage(`Kuchapisha risiti za malipo ${selectedPayments.value.length}`, 'info')
}

const confirmBulkDelete = () => {
  showDeleteModal.value = true
}

// Export
const exportPayments = async () => {
  showToastMessage('Malipo yanahamishwa...', 'info')

  try {
    const params = new URLSearchParams({
      format: 'csv',
    })

    if (filters.search) params.append('search', filters.search)
    if (filters.method) params.append('payment_method', filters.method)
    if (filters.type) params.append('payment_type', filters.type)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)

    const response = await axios.get(`${API_URL}/payments/export?${params.toString()}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `malipo_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()

    showToastMessage('Malipo yamehamishwa kwa mafanikio', 'success')
  } catch (err) {
    console.error('Error exporting payments:', err)
    showToastMessage(err.response?.data?.message || 'Imeshindwa kuhamisha malipo', 'error')
  }
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

// Debug function to check API response
const checkApiResponse = async () => {
  try {
    const response = await axios.get(`${API_URL}/payments?per_page=1`)
    console.log('API Structure Check:', response.data)
    if (response.data.data?.data?.[0]) {
      const samplePayment = response.data.data.data[0]
      console.log('Sample Payment Structure:', samplePayment)
      console.log('Customer data available:', {
        hasCustomer: !!samplePayment.customer,
        hasLoanCustomer: !!samplePayment.loan?.customer,
        customerFields: samplePayment.customer,
        loanCustomerFields: samplePayment.loan?.customer,
      })
    }
  } catch (err) {
    console.error('Error checking API:', err)
  }
}

// Lifecycle
onMounted(() => {
  loadPayments()
  checkApiResponse() // Remove this in production
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.payment-list-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left h1 {
  font-size: 2rem;
  color: #1a2639;
  margin: 0 0 5px;
  font-weight: 600;
}

.payment-count {
  color: #666;
  margin: 0;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-export,
.btn-filter-toggle {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.3s;
  border: none;
  position: relative;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
}

.btn-export {
  background: white;
  color: #27ae60;
  border: 1px solid #27ae60;
}

.btn-export:hover {
  background: #27ae60;
  color: white;
}

.btn-filter-toggle {
  background: white;
  color: #666;
  border: 1px solid #eef2f6;
}

.btn-filter-toggle:hover,
.btn-filter-toggle.active {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.filter-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Filters Panel */
.filters-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  animation: slideDown 0.3s ease;
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

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 5px;
}

.filter-group label i {
  color: #3498db;
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

/* Active Filters */
.active-filters {
  padding-top: 15px;
  border-top: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.active-filters-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 0.9rem;
}

.filter-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 0.85rem;
}

.remove-filter {
  cursor: pointer;
  padding: 2px;
}

.remove-filter:hover {
  color: #e74c3c;
}

.clear-all-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
}

.clear-all-btn:hover {
  text-decoration: underline;
}

/* Statistics Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-details {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a2639;
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
}

.stat-sub {
  display: block;
  font-size: 0.7rem;
  color: #999;
  margin-top: 2px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.summary-card.total {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.summary-card.cash {
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
}

.summary-card.bank {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.summary-card.mobile {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.summary-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: 700;
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
  margin-bottom: 20px;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-illustration {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.empty-illustration i:first-child {
  font-size: 4rem;
  color: #cbd5e0;
}

.empty-illustration i:last-child {
  position: absolute;
  bottom: 0;
  right: -10px;
  font-size: 2rem;
  color: #e74c3c;
  background: white;
  border-radius: 50%;
  padding: 5px;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
  margin-bottom: 25px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.empty-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-secondary {
  padding: 10px 25px;
  background: #f8fafc;
  color: #666;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.btn-secondary:hover {
  background: #eef2f6;
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
  margin: 0 -20px;
  padding: 0 20px;
}

.payments-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.payments-table th {
  text-align: left;
  padding: 15px 10px;
  background: #f8fafc;
  color: #1a2639;
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 2px solid #eef2f6;
}

.payments-table td {
  /* padding: 15px 10px; */
  border-bottom: 1px solid #eef2f6;
  color: #666;
}

.checkbox-col {
  width: 40px;
  text-align: center;
}

.payments-table tbody tr:hover {
  background: #f8fafc;
}

.payments-table tbody tr.row-selected {
  background: #e3f2fd;
}

/* Payment Number */
.payment-number {
  font-weight: 600;
  color: #333;
  font-family: monospace;
}

/* Customer Cell */
.customer-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.customer-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.customer-phone {
  font-size: 0.8rem;
  color: #999;
}

/* Loan Link */
.loan-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.loan-link:hover {
  text-decoration: underline;
}

/* Amount */
.amount {
  font-weight: 600;
  color: #27ae60;
}

/* Badge */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
  min-width: 70px;
}

.badge.partial {
  background: #fff3cd;
  color: #856404;
}

.badge.full {
  background: #d4edda;
  color: #155724;
}

.badge.penalty {
  background: #f8d7da;
  color: #721c24;
}

.badge.verified {
  background: #d4edda;
  color: #155724;
}

.badge.unverified {
  background: #f8d7da;
  color: #721c24;
}

/* Payment Method */
.payment-method {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
}

.payment-method i {
  color: #3498db;
  width: 16px;
}

.transaction-ref {
  margin-top: 3px;
  font-size: 0.75rem;
  color: #999;
}

/* Date Info */
.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-size: 0.9rem;
  color: #333;
}

.time {
  font-size: 0.75rem;
  color: #999;
}

/* Verification Status */
.verification-status {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.verifier {
  font-size: 0.75rem;
  color: #999;
}

/* Recorder Info */
.recorder-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recorder-name {
  font-size: 0.9rem;
  color: #333;
}

.recorder-time {
  font-size: 0.7rem;
  color: #999;
}

/* Action Dropdown */
.action-dropdown {
  position: relative;
  display: inline-block;
}

.action-menu-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.action-menu-btn:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
  margin-top: 5px;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

.action-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  color: #333;
  text-decoration: none;
  transition: background 0.3s;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: left;
}

.action-menu-item:hover {
  background: #f8fafc;
}

.action-menu-item i {
  width: 18px;
  color: #666;
}

.action-menu-item.success:hover {
  color: #27ae60;
}

.action-menu-item.success:hover i {
  color: #27ae60;
}

.action-menu-item.warning:hover {
  color: #f39c12;
}

.action-menu-item.warning:hover i {
  color: #f39c12;
}

.action-menu-item.danger:hover {
  color: #e74c3c;
}

.action-menu-item.danger:hover i {
  color: #e74c3c;
}

.action-menu-divider {
  height: 1px;
  background: #eef2f6;
  margin: 5px 0;
}

/* Bulk Actions */
.bulk-actions {
  margin-top: 20px;
  padding: 15px;
  background: #e3f2fd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  animation: slideDown 0.3s ease;
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1976d2;
}

.bulk-info i {
  font-size: 1.2rem;
}

.bulk-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-bulk {
  padding: 8px 15px;
  border-radius: 6px;
  border: none;
  background: white;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-bulk:hover:not(:disabled) {
  background: #f8fafc;
  color: #333;
}

.btn-bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-bulk.text-danger:hover:not(:disabled) {
  background: #fee;
  color: #e74c3c;
}

/* Pagination */
.pagination {
  margin-top: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
}

.pagination-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.pagination-btn {
  min-width: 35px;
  height: 35px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

.pagination-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-content.large-modal {
  max-width: 900px;
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
  gap: 15px;
}

.modal-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.modal-icon.success {
  background: #d4edda;
  color: #27ae60;
}

.modal-icon.danger {
  background: #f8d7da;
  color: #e74c3c;
}

.modal-icon.warning {
  background: #fff3cd;
  color: #f39c12;
}

.modal-header h3 {
  flex: 1;
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

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 25px;
}

/* Payment Details Grid */
.payment-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
}

.detail-section.full-width {
  grid-column: span 2;
}

.detail-section h4 {
  margin: 0 0 15px;
  color: #333;
  font-size: 1rem;
  padding-bottom: 8px;
  border-bottom: 1px solid #eef2f6;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
}

.detail-label {
  width: 120px;
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  flex: 1;
  color: #333;
  font-weight: 500;
}

.detail-value.large {
  font-size: 1.2rem;
  color: #27ae60;
}

.detail-value a {
  color: #3498db;
  text-decoration: none;
}

.detail-value a:hover {
  text-decoration: underline;
}

.notes-text {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

/* Payment Summary */
.payment-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}

.payment-summary p {
  margin: 5px 0;
  color: #333;
}

/* Selected List */
.selected-list {
  margin: 15px 0;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #eef2f6;
  border-radius: 8px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #eef2f6;
}

.selected-item:last-child {
  border-bottom: none;
}

.selected-item i {
  color: #3498db;
}

.more-items {
  padding: 8px 12px;
  color: #999;
  font-style: italic;
}

/* Warning Note */
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

/* Form Group */
.form-group {
  margin-bottom: 15px;
}

.form-group.required label::after {
  content: '*';
  color: #e74c3c;
  margin-left: 4px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Modal Footer */
.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-warning {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f39c12, #e67e22);
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

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(243, 156, 18, 0.3);
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
  transition: all 0.3s;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
}

.btn-warning:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.toast-notification.info {
  border-left-color: #3498db;
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

.toast-notification.info i {
  color: #3498db;
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
  .payment-list-container {
    padding: 15px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .btn-primary,
  .btn-export,
  .btn-filter-toggle {
    flex: 1;
    justify-content: center;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .stats-cards {
    grid-template-columns: 1fr 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }

  .payment-details-grid {
    grid-template-columns: 1fr;
  }

  .detail-section.full-width {
    grid-column: span 1;
  }

  .detail-row {
    flex-direction: column;
    gap: 5px;
  }

  .detail-label {
    width: auto;
  }

  .bulk-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .bulk-buttons {
    width: 100%;
  }

  .btn-bulk {
    flex: 1;
    justify-content: center;
  }

  .pagination {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-buttons {
    width: 100%;
    justify-content: center;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-warning,
  .btn-danger {
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
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-icon {
    width: 100%;
  }
}

/* Add to your styles */
.customer-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.customer-cell:hover {
  background-color: #f5f5f5;
}

.customer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.customer-phone {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

/* Customer detail in modal */
.customer-detail-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-top: 8px;
}

.customer-detail-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.customer-detail-info {
  display: flex;
  flex-direction: column;
}

.customer-detail-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.customer-detail-phone {
  font-size: 14px;
  color: #666;
  margin: 4px 0;
}

.customer-detail-link {
  font-size: 13px;
  color: #3498db;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.customer-detail-link:hover {
  text-decoration: underline;
}

.no-customer {
  padding: 20px;
  text-align: center;
  color: #999;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 8px;
}
</style>
