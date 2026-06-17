<template>
  <div class="loan-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia taarifa za mkopo...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="loadLoan" class="btn-retry">
          <i class="fas fa-redo"></i>
          Jaribu Tena
        </button>
        <router-link to="/loans" class="btn-secondary">
          <i class="fas fa-arrow-left"></i>
          Rudi Kwenye Orodha
        </router-link>
      </div>
    </div>

    <!-- Loan Details -->
    <div v-else-if="loan" class="loan-detail">
      <!-- Header with Actions -->
      <div class="detail-header">
        <div class="header-left">
          <router-link to="/loans" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            <span>Rudi</span>
          </router-link>
          <div class="header-title">
            <h1>Mkopo #{{ loan.loan_number }}</h1>
            <span class="loan-status-badge" :class="loan.status">
              {{ getStatusText(loan.status) }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button v-if="canRecordPayment" class="btn-payment" @click="recordPayment">
            <i class="fas fa-money-bill"></i>
            <span>Rekodi Malipo</span>
          </button>
          <div class="action-dropdown" ref="actionDropdownRef">
            <button class="btn-more" @click.stop="toggleActionMenu">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div v-if="showActionMenu" class="action-menu">
              <router-link :to="`/loans/${loan.id}/edit`" v-if="canEdit" class="action-menu-item">
                <i class="fas fa-edit"></i>
                <span>Hariri Mkopo</span>
              </router-link>
              <button v-if="canApprove" @click="approveLoan" class="action-menu-item success">
                <i class="fas fa-check-circle"></i>
                <span>Idhinisha Mkopo</span>
              </button>
              <button v-if="canDisburse" @click="disburseLoan" class="action-menu-item warning">
                <i class="fas fa-hand-holding-usd"></i>
                <span>Toa Mkopo</span>
              </button>
              <button v-if="canReject" @click="rejectLoan" class="action-menu-item danger">
                <i class="fas fa-times-circle"></i>
                <span>Kataa Mkopo</span>
              </button>
              <button @click="showFullScheduleModal" class="action-menu-item">
                <i class="fas fa-calendar-alt"></i>
                <span>Ratiba Kamili ya Malipo</span>
              </button>
              <div class="action-menu-divider"></div>
              <button v-if="canDelete" @click="confirmDelete" class="action-menu-item danger">
                <i class="fas fa-trash-alt"></i>
                <span>Futa Mkopo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Overdue Warning Banner -->
      <div v-if="isOverdue" class="overdue-banner">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="banner-content">
          <h3>Mkopo Umechelewa!</h3>
          <p>
            Tarehe ya kukamilisha ilikuwa {{ formatDate(loan.end_date) }}. Tafadhali chukua hatua.
          </p>
        </div>
        <button class="btn-contact" @click="contactCustomer">
          <i class="fas fa-phone-alt"></i>
          Wasiliana na Mteja
        </button>
      </div>

      <!-- Risk Score Card (for pending loans) -->
      <div
        v-if="loan.status === 'pending' && loan.risk_score"
        class="risk-score-card"
        :class="loan.risk_score.level"
      >
        <div class="risk-score-header">
          <i class="fas fa-shield-alt"></i>
          <h3>
            Risk Score: {{ loan.risk_score.score }}/100 ({{
              getRiskLevelText(loan.risk_score.level)
            }})
          </h3>
        </div>
        <div class="risk-factors">
          <span v-for="(factor, index) in loan.risk_score.factors" :key="index" class="risk-factor">
            <i class="fas fa-circle"></i>
            {{ factor }}
          </span>
        </div>
        <div
          v-if="loan.approval_recommendation"
          class="recommendation"
          :class="loan.approval_recommendation.action"
        >
          <i class="fas" :class="getRecommendationIcon(loan.approval_recommendation.action)"></i>
          <span>{{ loan.approval_recommendation.message }}</span>
        </div>
        <div v-if="loan.can_auto_approve" class="auto-approve-badge">
          <i class="fas fa-robot"></i>
          Inaweza kuidhinishwa kiotomatiki
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="detail-grid">
        <!-- Left Column - Loan Summary -->
        <div class="left-column">
          <!-- Loan Summary Card -->
          <div class="summary-card">
            <h3>Muhtasari wa Mkopo</h3>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">Kiasi cha Mkopo</span>
                <span class="stat-value large">{{ formatCurrency(loan.amount) }}</span>
              </div>
              <div class="stat-row">
                <div class="stat-item">
                  <span class="stat-label">Riba</span>
                  <span class="stat-value">{{ loan.interest_rate }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Jumla ya Kurejesha</span>
                  <span class="stat-value">{{ formatCurrency(loan.total_amount) }}</span>
                </div>
              </div>
              <div class="stat-row">
                <div class="stat-item">
                  <span class="stat-label">Imelipwa</span>
                  <span class="stat-value success">{{
                    formatCurrency(loan.paid_amount || 0)
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Imebaki</span>
                  <span class="stat-value" :class="{ 'text-danger': loan.balance > 0 }">
                    {{ formatCurrency(loan.balance) }}
                  </span>
                </div>
              </div>

              <div v-if="loan.status === 'pending'" class="stat-item">
                <span class="stat-label">Siku Zilizopita Tangu Kuombwa</span>
                <span class="stat-value">{{ loan.days_pending || 0 }} siku</span>
              </div>
              <div v-if="loan.progress_percentage !== undefined" class="progress-bar">
                <div class="progress-fill" :style="{ width: loan.progress_percentage + '%' }"></div>
                <span class="progress-text">{{ loan.progress_percentage }}% imelipwa</span>
              </div>
              <div v-if="loan.total_penalty !== undefined" class="progress-bar">
                <div class="progress-fill" :style="{ width: loan.progress_percentage + '%' }"></div>
                <span class="progress-text">{{ loan.total_penalty }} Penalty </span>
              </div>
            </div>
          </div>

          <!-- Customer Information Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-user"></i>
              <h3>Taarifa za Mteja</h3>
              <router-link :to="`/customers/${loan.customer?.id}`" class="btn-view">
                <i class="fas fa-external-link-alt"></i>
                Angalia
              </router-link>
            </div>

            <div v-if="loan.customer" class="customer-details">
              <div class="customer-profile">
                <img
                  :src="loan.customer.profile_photo_url || '/default-avatar.png'"
                  :alt="loan.customer.full_name"
                  class="customer-avatar"
                />
                <div class="customer-info">
                  <span class="customer-name">
                    {{ loan.customer.first_name }} {{ loan.customer.last_name }}
                  </span>
                  <span class="customer-occupation">{{ loan.customer.occupation }}</span>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-row">
                  <i class="fas fa-phone-alt"></i>
                  <span>{{ loan.customer.phone }}</span>
                </div>
                <div class="info-row" v-if="loan.customer.email">
                  <i class="fas fa-envelope"></i>
                  <span>{{ loan.customer.email }}</span>
                </div>
                <div class="info-row">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ loan.customer.address || 'Haijulikani' }}</span>
                </div>
                <div class="info-row">
                  <i class="fas fa-id-card"></i>
                  <span
                    >{{ loan.customer.id_number || 'Haijulikani' }} ({{
                      loan.customer.id_type || 'NIDA'
                    }})</span
                  >
                </div>
              </div>

              <!-- Customer Loan History -->
              <div v-if="loan.customer_loan_history" class="customer-history">
                <h4>Historia ya Mikopo</h4>
                <div class="history-stats">
                  <div class="history-stat">
                    <span class="stat-number">{{ loan.customer_loan_history.total_loans }}</span>
                    <span class="stat-label">Jumla ya Mikopo</span>
                  </div>
                  <div class="history-stat">
                    <span class="stat-number">{{ loan.customer_loan_history.active_loans }}</span>
                    <span class="stat-label">Inayoendelea</span>
                  </div>
                  <div class="history-stat">
                    <span class="stat-number">{{
                      loan.customer_loan_history.previous_defaults
                    }}</span>
                    <span class="stat-label">Mikopo Iliyochelewa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Schedule Preview -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-calendar-alt"></i>
              <h3>Ratiba ya Malipo</h3>
              <button @click="showFullScheduleModal" class="btn-view">
                <i class="fas fa-eye"></i>
                Angalia Zote
              </button>
            </div>

            <div v-if="paymentScheduleLoading" class="loading-small">
              <div class="spinner-small"></div>
              <span>Inapakia ratiba...</span>
            </div>
            <div v-else class="schedule-preview">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tarehe ya Malipo</th>
                    <th>Kiasi</th>
                    <th>Hali</th>
                    <th>Kilicholipwa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(payment, index) in paymentSchedule.slice(0, 3)" :key="index">
                    <td>{{ payment.installment }}</td>
                    <td>{{ formatDate(payment.due_date) }}</td>
                    <td>{{ formatCurrency(payment.amount_due) }}</td>
                    <td>
                      <span class="status-badge small" :class="payment.status">
                        {{ getPaymentStatus(payment.status) }}
                      </span>
                    </td>
                    <td>
                      <span v-if="payment.paid_amount > 0" class="paid-amount">
                        {{ formatCurrency(payment.paid_amount) }}
                      </span>
                      <span v-else class="text-muted">-</span>
                    </td>
                  </tr>
                  <tr v-if="paymentSchedule.length > 3">
                    <td colspan="5" class="text-center">
                      <button @click="showFullScheduleModal" class="view-more-link">
                        Na mingine {{ paymentSchedule.length - 3 }}...
                      </button>
                    </td>
                  </tr>
                  <tr v-if="paymentSchedule.length === 0">
                    <td colspan="5" class="text-center">
                      <div class="empty-state-small">
                        <i class="fas fa-calendar-times"></i>
                        <p>Hakuna ratiba ya malipo bado</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Column - Loan Details -->
        <div class="right-column">
          <!-- Loan Details Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-info-circle"></i>
              <h3>Maelezo ya Mkopo</h3>
            </div>

            <div class="details-grid">
              <div class="detail-row">
                <span class="detail-label">Namba ya Mkopo:</span>
                <span class="detail-value">#{{ loan.loan_number }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tarehe ya Kuombwa:</span>
                <span class="detail-value">{{ formatDate(loan.created_at) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tarehe ya Kuanza:</span>
                <span class="detail-value">{{ formatDate(loan.start_date) || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tarehe ya Kukamilisha:</span>
                <span class="detail-value">{{ formatDate(loan.end_date) || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Muda wa Mkopo:</span>
                <span class="detail-value">{{ loan.duration_months }} miezi</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Muda wa Malipo:</span>
                <span class="detail-value">{{ getFrequencyText(loan.payment_frequency) }}</span>
              </div>
              <div class="detail-row" v-if="loan.payment_days">
                <span class="detail-label">Siku za Malipo:</span>
                <span class="detail-value">{{ getPaymentDaysText(loan.payment_days) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Riba kwa Mwezi:</span>
                <span class="detail-value">{{ loan.interest_rate }}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Riba ya Kuchelewa:</span>
                <span class="detail-value"
                  >{{ loan.penalty_rate || loan.interest_rate }}% kwa
                  {{ loan.penalty_period === 'day' ? 'Siku' : 'Mwezi' }}</span
                >
              </div>
              <div class="detail-row">
                <span class="detail-label">Siku za Mapumziko:</span>
                <span class="detail-value">{{ loan.grace_period || 0 }} siku</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Malipo kwa Mwezi:</span>
                <span class="detail-value">{{ formatCurrency(loan.installment_amount) }}</span>
              </div>
            </div>
          </div>

          <!-- Purpose Card -->
          <div v-if="loan.purpose" class="info-card">
            <div class="card-header">
              <i class="fas fa-bullseye"></i>
              <h3>Madhumuni ya Mkopo</h3>
            </div>
            <p class="purpose-text">{{ loan.purpose }}</p>
          </div>

          <!-- Collateral Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-gem"></i>
              <h3>Dhamana</h3>
              <button v-if="canAddCollateral" class="btn-add" @click="showAddCollateral = true">
                <i class="fas fa-plus"></i>
                Ongeza
              </button>
            </div>

            <div v-if="loan.collaterals && loan.collaterals.length > 0" class="collaterals-list">
              <div
                v-for="collateralItem in loan.collaterals"
                :key="collateralItem.id"
                class="collateral-item"
              >
                <div class="collateral-icon" :class="collateralItem.type">
                  <i :class="getCollateralIcon(collateralItem.type)"></i>
                </div>
                <div class="collateral-info">
                  <span class="collateral-name">{{ collateralItem.name || 'Dhamana' }}</span>
                  <span class="collateral-type">{{ collateralItem.type }}</span>
                  <span class="collateral-value">{{
                    formatCurrency(collateralItem.estimated_value)
                  }}</span>
                </div>
                <button class="btn-view-small" @click="viewCollateral(collateralItem)">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>

            <div v-else class="empty-state-small">
              <i class="fas fa-gem"></i>
              <p>Hakuna dhamana kwa mkopo huu</p>
            </div>
          </div>

          <!-- Guarantors Card -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-users"></i>
              <h3>Wadhamini</h3>
              <button v-if="canAddGuarantor" class="btn-add" @click="showAddGuarantor = true">
                <i class="fas fa-plus"></i>
                Ongeza
              </button>
            </div>

            <div v-if="loan.guarantors && loan.guarantors.length > 0" class="guarantors-list">
              <div v-for="guarantor in loan.guarantors" :key="guarantor.id" class="guarantor-item">
                <img
                  :src="guarantor.photo || '/default-avatar.png'"
                  :alt="guarantor.name"
                  class="guarantor-avatar"
                />
                <div class="guarantor-info">
                  <span class="guarantor-name">{{ guarantor.name }}</span>
                  <span class="guarantor-relation">{{ guarantor.relationship }}</span>
                  <span class="guarantor-phone">{{ guarantor.phone }}</span>
                </div>
                <button class="btn-view-small" @click="viewGuarantor(guarantor)">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <i class="fas fa-users"></i>
              <p>Hakuna wadhamini kwa mkopo huu</p>
            </div>
          </div>

          <!-- Approval/Rejection History -->
          <div class="info-card" v-if="loan.approved_by || loan.rejection_reason">
            <div class="card-header">
              <i class="fas fa-history"></i>
              <h3>Historia ya Uidhinishaji</h3>
            </div>

            <div v-if="loan.approved_by" class="history-item">
              <i class="fas fa-check-circle success"></i>
              <div class="history-details">
                <span class="history-title"
                  >Imeidhinishwa na {{ loan.approved_by.name || 'System' }}</span
                >
                <span class="history-date">{{ formatDate(loan.approval_date) }}</span>
                <p v-if="loan.approved_notes" class="history-notes">{{ loan.approved_notes }}</p>
              </div>
            </div>

            <div v-if="loan.rejection_reason" class="history-item">
              <i class="fas fa-times-circle danger"></i>
              <div class="history-details">
                <span class="history-title">Imekataliwa</span>
                <span class="history-date">{{ formatDate(loan.updated_at) }}</span>
                <p class="history-notes">{{ loan.rejection_reason }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Payments -->
        <div class="recent-payments-card">
          <div class="card-header">
            <i class="fas fa-money-bill-wave"></i>
            <h3>Malipo ya Hivi Karibuni</h3>
            <button @click="viewAllPayments" class="btn-view">
              <i class="fas fa-eye"></i>
              Angalia Yote
            </button>
          </div>

          <div v-if="paymentsLoading" class="loading-small">
            <div class="spinner-small"></div>
            <span>Inapakia malipo...</span>
          </div>
          <div v-else class="table-responsive">
            <table class="payments-table">
              <thead>
                <tr>
                  <th>Namba ya Malipo</th>
                  <th>Tarehe</th>
                  <th>Kiasi</th>
                  <th>Aina</th>
                  <th>Njia</th>
                  <th>Imehakikiwa</th>
                  <th>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in recentPayments" :key="payment.id">
                  <td>#{{ payment.payment_number }}</td>
                  <td>{{ formatDate(payment.payment_date) }}</td>
                  <td>{{ formatCurrency(payment.amount) }}</td>
                  <td>
                    <span
                      class="badge"
                      :class="payment.payment_type === 'full' ? 'full' : 'partial'"
                    >
                      {{ payment.payment_type === 'full' ? 'Kamilifu' : 'Sehemu' }}
                    </span>
                  </td>
                  <td>
                    <span class="payment-method">
                      <i :class="getPaymentMethodIcon(payment.payment_method)"></i>
                      {{ getPaymentMethodText(payment.payment_method) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="payment.verified ? 'verified' : 'unverified'">
                      {{ payment.verified ? 'Ndiyo' : 'Hapana' }}
                    </span>
                  </td>
                  <td>
                    <button
                      @click="viewSinglePayment(payment)"
                      class="btn-icon-small"
                      title="Angalia"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      @click="printReceipt(payment)"
                      class="btn-icon-small"
                      title="Chapisha risiti"
                    >
                      <i class="fas fa-print"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="recentPayments.length === 0">
                  <td colspan="7" class="text-center">
                    <div class="empty-state-small">
                      <i class="fas fa-money-bill"></i>
                      <p>Hakuna malipo bado</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Schedule Modal -->
      <!-- Schedule Modal - Large -->
      <div v-if="showScheduleModal" class="modal-overlay" @click="closeScheduleModal">
        <div class="modal-content schedule-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-header-left">
              <i class="fas fa-calendar-alt"></i>
              <h3>Ratiba Kamili ya Malipo - Mkopo #{{ loan?.loan_number }}</h3>
            </div>
            <div class="modal-header-actions">
              <button class="btn-refresh" @click="refreshSchedule" title="Onyesha upya">
                <i class="fas fa-sync-alt" :class="{ rotating: scheduleLoading }"></i>
              </button>
              <button class="close-btn" @click="closeScheduleModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="modal-body schedule-modal-body">
            <!-- Schedule Summary -->
            <div class="schedule-summary">
              <div class="summary-item">
                <span class="summary-label">Jumla ya Malipo:</span>
                <span class="summary-value">{{ paymentSchedule.length }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Jumla ya Kiasi:</span>
                <span class="summary-value">{{ formatCurrency(loan?.total_amount) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Imelipwa:</span>
                <span class="summary-value success">{{ formatCurrency(loan?.paid_amount) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Imebaki:</span>
                <span class="summary-value warning">{{ formatCurrency(loan?.balance) }}</span>
              </div>
            </div>

            <!-- Schedule Table -->
            <div v-if="scheduleLoading" class="loading-state">
              <div class="spinner"></div>
              <span>Inapakia ratiba...</span>
            </div>

            <div v-else class="table-responsive schedule-table-container">
              <table class="schedule-table">
                <thead>
                  <tr>
                    <th>Na.</th>
                    <th>Tarehe ya Malipo</th>
                    <th>Kiasi Kinachotakiwa</th>
                    <th>Kilicholipwa</th>
                    <th>Riba Iliyolipwa</th>
                    <th>Adhabu</th>
                    <th>Salio</th>
                    <th>Hali</th>
                    <th>Maelezo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(payment, index) in paymentSchedule"
                    :key="index"
                    :class="{
                      overdue: payment.status === 'overdue',
                      paid: payment.status === 'paid',
                    }"
                  >
                    <td class="text-center">{{ payment.installment }}</td>
                    <td>{{ formatDate(payment.due_date) }}</td>
                    <td class="text-right">{{ formatCurrency(payment.amount_due) }}</td>
                    <td class="text-right">{{ formatCurrency(payment.paid_amount || 0) }}</td>
                    <td class="text-right">{{ formatCurrency(payment.interest_paid || 0) }}</td>
                    <td class="text-right">{{ formatCurrency(payment.penalty_paid || 0) }}</td>
                    <td class="text-right">
                      {{ formatCurrency(payment.balance || payment.amount) }}
                    </td>
                    <td class="text-center">
                      <span class="status-badge" :class="payment.status">
                        {{ getPaymentStatus(payment.status) }}
                      </span>
                    </td>
                    <td>
                      <span
                        v-if="payment.notes"
                        class="payment-notes-tooltip"
                        :title="payment.notes"
                      >
                        <i class="fas fa-info-circle"></i>
                      </span>
                    </td>
                  </tr>
                  <tr v-if="paymentSchedule.length === 0">
                    <td colspan="9" class="text-center">
                      <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <p>Hakuna ratiba ya malipo</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Penalty Information -->
            <div class="penalty-info-modal">
              <h4><i class="fas fa-exclamation-triangle"></i> Riba ya Kuchelewa</h4>
              <p>
                Kwa malipo yanayochelewa, riba ya
                <strong>{{ loan?.penalty_rate || loan?.interest_rate }}%</strong>
                kwa mwezi itaongezwa kwenye kiasi kilichobaki. Siku za mapumziko:
                <strong>{{ loan?.grace_period || 0 }}</strong> siku.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeScheduleModal" class="btn-secondary">Funga</button>
            <button @click="exportSchedule" class="btn-primary">
              <i class="fas fa-download"></i>
              Pakua Ratiba (Excel)
            </button>
            <button @click="printSchedule" class="btn-print-modal">
              <i class="fas fa-print"></i>
              Chapisha
            </button>
          </div>
        </div>
      </div>

      <!-- All Payments Modal - Large -->
      <div v-if="showAllPaymentsModal" class="modal-overlay" @click="closeAllPaymentsModal">
        <div class="modal-content payments-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-header-left">
              <i class="fas fa-money-bill-wave"></i>
              <h3>Malipo Yote - Mkopo #{{ loan?.loan_number }}</h3>
            </div>
            <div class="modal-header-actions">
              <button class="btn-refresh" @click="refreshAllPayments" title="Onyesha upya">
                <i class="fas fa-sync-alt" :class="{ rotating: allPaymentsLoading }"></i>
              </button>
              <button class="close-btn" @click="closeAllPaymentsModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="modal-body payments-modal-body">
            <!-- Filters -->
            <div class="payments-filters">
              <div class="search-box large">
                <i class="fas fa-search search-icon"></i>
                <input
                  type="text"
                  v-model="paymentSearch"
                  @input="searchAllPayments"
                  placeholder="Tafuta kwa namba ya malipo, reference, au maelezo..."
                  class="search-input"
                />
                <button v-if="paymentSearch" @click="clearPaymentSearch" class="clear-search">
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <div class="filter-group">
                <select
                  v-model="paymentMethodFilter"
                  @change="filterAllPayments"
                  class="filter-select"
                >
                  <option value="">Njia zote</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                </select>

                <select
                  v-model="paymentStatusFilter"
                  @change="filterAllPayments"
                  class="filter-select"
                >
                  <option value="">Hali zote</option>
                  <option value="verified">Imehakikiwa</option>
                  <option value="unverified">Haijahakikiwa</option>
                </select>

                <div class="date-range">
                  <input
                    type="date"
                    v-model="paymentDateFrom"
                    @change="filterAllPayments"
                    class="filter-date"
                    placeholder="Kuanzia"
                  />
                  <span class="date-separator">hadi</span>
                  <input
                    type="date"
                    v-model="paymentDateTo"
                    @change="filterAllPayments"
                    class="filter-date"
                    placeholder="Mpaka"
                  />
                </div>

                <button
                  @click="clearAllFilters"
                  class="btn-clear-filters-small"
                  title="Futa filters zote"
                >
                  <i class="fas fa-undo"></i>
                </button>
              </div>
            </div>

            <!-- Summary Cards -->
            <div v-if="paymentsSummary" class="summary-cards">
              <!-- Summary Stats Grid - Simple version without cards -->
              <!-- Simple Horizontal Stats -->
              <div class="simple-horizontal-stats">
                <div class="simple-stat">
                  <span class="stat-label">Jumla ya Malipo:</span>
                  <span class="stat-value total">{{
                    formatCurrency(paymentsSummary.total_amount)
                  }}</span>
                  <span class="stat-count"
                    >({{ paymentsSummary.total_payments || allPayments.length }})</span
                  >
                </div>

                <span class="stat-bullet">•</span>

                <div class="simple-stat">
                  <span class="stat-label">Imehakikiwa:</span>
                  <span class="stat-value verified">{{
                    formatCurrency(paymentsSummary.verified_amount)
                  }}</span>
                  <span class="stat-count">({{ paymentsSummary.verified_count }})</span>
                </div>

                <span class="stat-bullet">•</span>

                <div class="simple-stat">
                  <span class="stat-label">Haijahakikiwa:</span>
                  <span class="stat-value pending">{{
                    formatCurrency(paymentsSummary.pending_amount)
                  }}</span>
                  <span class="stat-count">({{ paymentsSummary.pending_count }})</span>
                </div>

                <template v-for="(method, index) in paymentsSummary.by_method" :key="index">
                  <span class="stat-bullet">•</span>
                  <div class="simple-stat">
                    <span class="stat-label">{{ getPaymentMethodText(method.method) }}:</span>
                    <span class="stat-value method">{{ formatCurrency(method.total) }}</span>
                    <span class="stat-count">({{ method.count }})</span>
                  </div>
                </template>
              </div>
            </div>

            <!-- Payments Table -->
            <div v-if="allPaymentsLoading" class="loading-state">
              <div class="spinner"></div>
              <span>Inapakia malipo...</span>
            </div>

            <div v-else class="table-responsive payments-table-container">
              <table class="payments-table">
                <thead>
                  <tr>
                    <th @click="sortPayments('payment_number')" class="sortable">
                      Namba ya Malipo
                      <i class="fas" :class="getSortIcon('payment_number')"></i>
                    </th>
                    <th @click="sortPayments('payment_date')" class="sortable">
                      Tarehe
                      <i class="fas" :class="getSortIcon('payment_date')"></i>
                    </th>
                    <th @click="sortPayments('amount')" class="sortable text-right">
                      Kiasi
                      <i class="fas" :class="getSortIcon('amount')"></i>
                    </th>
                    <th>Aina</th>
                    <th>Njia</th>
                    <th>Rejea</th>
                    <th>Imehakikiwa</th>
                    <th>Aliyerekodi</th>
                    <th>Vitendo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="payment in allPayments"
                    :key="payment.id"
                    @click="viewSinglePaymentFromAll(payment)"
                    class="clickable-row"
                  >
                    <td>#{{ payment.payment_number }}</td>
                    <td>{{ formatDate(payment.payment_date) }}</td>
                    <td class="text-right amount">{{ formatCurrency(payment.amount) }}</td>
                    <td>
                      <span class="badge" :class="payment.payment_type">
                        {{ payment.payment_type === 'full' ? 'Kamilifu' : 'Sehemu' }}
                      </span>
                    </td>
                    <td>
                      <span class="payment-method">
                        <i :class="getPaymentMethodIcon(payment.payment_method)"></i>
                        {{ getPaymentMethodText(payment.payment_method) }}
                      </span>
                    </td>
                    <td>
                      <span class="reference">{{ payment.reference_number || '-' }}</span>
                    </td>
                    <td>
                      <span class="badge" :class="payment.verified ? 'verified' : 'unverified'">
                        {{ payment.verified ? 'Ndiyo' : 'Hapana' }}
                      </span>
                    </td>
                    <td>{{ payment.recorded_by || 'System' }}</td>
                    <td @click.stop>
                      <button
                        @click="viewSinglePaymentFromAll(payment)"
                        class="btn-icon-small"
                        title="Angalia"
                      >
                        <i class="fas fa-eye"></i>
                      </button>
                      <button
                        @click="printReceipt(payment)"
                        class="btn-icon-small"
                        title="Chapisha risiti"
                      >
                        <i class="fas fa-print"></i>
                      </button>
                      <button
                        v-if="!payment.verified"
                        @click="verifyPayment(payment)"
                        class="btn-icon-small success"
                        title="Hakiki"
                      >
                        <i class="fas fa-check-circle"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="allPayments.length === 0">
                    <td colspan="9" class="text-center">
                      <div class="empty-state">
                        <i class="fas fa-money-bill-wave"></i>
                        <p>Hakuna malipo yanayolingana na vigezo vyako</p>
                        <button @click="clearAllFilters" class="btn-clear-filters">
                          <i class="fas fa-times"></i>
                          Futa Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="!allPaymentsLoading && totalPayments > 0" class="pagination-controls">
              <div class="pagination-info">
                <span
                  >Jumla ya malipo: <strong>{{ totalPayments }}</strong></span
                >
                <span>Ukurasa {{ currentPage }} wa {{ lastPage }}</span>
              </div>
              <div class="pagination-buttons">
                <button
                  @click="loadPaymentsPage(1)"
                  :disabled="currentPage === 1"
                  class="btn-pagination"
                  title="Ukurasa wa kwanza"
                >
                  <i class="fas fa-angle-double-left"></i>
                </button>
                <button
                  @click="loadPaymentsPage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="btn-pagination"
                >
                  <i class="fas fa-chevron-left"></i> Kabla
                </button>
                <span class="page-info"> {{ currentPage }} / {{ lastPage }} </span>
                <button
                  @click="loadPaymentsPage(currentPage + 1)"
                  :disabled="currentPage === lastPage"
                  class="btn-pagination"
                >
                  Baada <i class="fas fa-chevron-right"></i>
                </button>
                <button
                  @click="loadPaymentsPage(lastPage)"
                  :disabled="currentPage === lastPage"
                  class="btn-pagination"
                  title="Ukurasa wa mwisho"
                >
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </div>
              <div class="pagination-per-page">
                <select v-model="perPage" @change="loadAllPayments" class="per-page-select">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span>kwa ukurasa</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="exportPayments" class="btn-primary">
              <i class="fas fa-download"></i>
              Pakua Malipo
            </button>
            <button @click="closeAllPaymentsModal" class="btn-secondary">Funga</button>
          </div>
        </div>
      </div>

      <!-- Single Payment Modal - Medium/Large -->
      <div v-if="showSinglePaymentModal" class="modal-overlay" @click="closeSinglePaymentModal">
        <div class="modal-content payment-detail-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-header-left">
              <i class="fas fa-receipt"></i>
              <h3>Maelezo ya Malipo #{{ selectedPayment?.payment_number }}</h3>
            </div>
            <button class="close-btn" @click="closeSinglePaymentModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body payment-detail-body">
            <div v-if="singlePaymentLoading" class="loading-state">
              <div class="spinner"></div>
              <span>Inapakia malipo...</span>
            </div>

            <div v-else-if="selectedPayment" class="payment-details-card">
              <div class="payment-header-large">
                <div
                  class="payment-status-large"
                  :class="selectedPayment.verified ? 'verified' : 'unverified'"
                >
                  <i :class="selectedPayment.verified ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                  <span>{{
                    selectedPayment.verified ? 'Malipo Yamehakikiwa' : 'Malipo Bado Yahakikiwe'
                  }}</span>
                </div>
                <div class="payment-amount-large">{{ formatCurrency(selectedPayment.amount) }}</div>
              </div>

              <div class="payment-details-grid">
                <div class="detail-section">
                  <h4>Taarifa za Msingi</h4>
                  <div class="detail-rows">
                    <div class="detail-row">
                      <span class="detail-label">Namba ya Malipo:</span>
                      <span class="detail-value">#{{ selectedPayment.payment_number }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Tarehe ya Malipo:</span>
                      <span class="detail-value">{{
                        formatDate(selectedPayment.payment_date)
                      }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Aina ya Malipo:</span>
                      <span class="detail-value">
                        <span class="badge large" :class="selectedPayment.payment_type">
                          {{
                            selectedPayment.payment_type === 'full'
                              ? 'Malipo Kamili'
                              : 'Malipo Sehemu'
                          }}
                        </span>
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Njia ya Malipo:</span>
                      <span class="detail-value">
                        <i :class="getPaymentMethodIcon(selectedPayment.payment_method)"></i>
                        {{ getPaymentMethodText(selectedPayment.payment_method) }}
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Namba ya Rejea:</span>
                      <span class="detail-value">{{
                        selectedPayment.reference_number || 'Hakuna'
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="detail-section">
                  <h4>Mgawanyo wa Malipo</h4>
                  <div class="breakdown-chart">
                    <div class="breakdown-bar">
                      <div
                        class="bar-segment principal"
                        :style="{
                          width:
                            (selectedPayment.principal_paid / selectedPayment.amount) * 100 + '%',
                        }"
                      >
                        <span class="segment-label">Deni</span>
                      </div>
                      <div
                        class="bar-segment interest"
                        :style="{
                          width:
                            (selectedPayment.interest_paid / selectedPayment.amount) * 100 + '%',
                        }"
                      >
                        <span class="segment-label">Riba</span>
                      </div>
                      <div
                        class="bar-segment penalty"
                        :style="{
                          width:
                            (selectedPayment.penalty_paid / selectedPayment.amount) * 100 + '%',
                        }"
                      >
                        <span class="segment-label">Adhabu</span>
                      </div>
                    </div>
                  </div>
                  <div class="breakdown-numbers">
                    <div class="breakdown-item principal">
                      <span class="breakdown-label">Deni kuu</span>
                      <span class="breakdown-value">{{
                        formatCurrency(selectedPayment.principal_paid || 0)
                      }}</span>
                    </div>
                    <div class="breakdown-item interest">
                      <span class="breakdown-label">Riba</span>
                      <span class="breakdown-value">{{
                        formatCurrency(selectedPayment.interest_paid || 0)
                      }}</span>
                    </div>
                    <div class="breakdown-item penalty">
                      <span class="breakdown-label">Adhabu</span>
                      <span class="breakdown-value">{{
                        formatCurrency(selectedPayment.penalty_paid || 0)
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="detail-section">
                  <h4>Taarifa za Kurekodi</h4>
                  <div class="detail-rows">
                    <div class="detail-row">
                      <span class="detail-label">Aliyerekodi:</span>
                      <span class="detail-value">{{
                        selectedPayment.recorded_by || 'System'
                      }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Tarehe ya Kurekodi:</span>
                      <span class="detail-value">{{ formatDate(selectedPayment.created_at) }}</span>
                    </div>
                    <div class="detail-row" v-if="selectedPayment.verified">
                      <span class="detail-label">Aliyehakiki:</span>
                      <span class="detail-value">{{ selectedPayment.verified_by || '-' }}</span>
                    </div>
                    <div class="detail-row" v-if="selectedPayment.verified">
                      <span class="detail-label">Tarehe ya Kuhakiki:</span>
                      <span class="detail-value">{{
                        formatDate(selectedPayment.verified_at) || '-'
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="detail-section full-width" v-if="selectedPayment.notes">
                  <h4>Maelezo</h4>
                  <div class="notes-box">
                    <p>{{ selectedPayment.notes }}</p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="payment-actions-large">
                <button @click="printReceipt(selectedPayment)" class="btn-print-large">
                  <i class="fas fa-print"></i>
                  Chapisha Risiti
                </button>
                <button
                  v-if="!selectedPayment.verified"
                  @click="verifyPayment(selectedPayment)"
                  class="btn-verify-large"
                >
                  <i class="fas fa-check-circle"></i>
                  Hakiki Malipo
                </button>
                <button @click="closeSinglePaymentModal" class="btn-close-large">
                  <i class="fas fa-times"></i>
                  Funga
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatCurrency, formatDate } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

// const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// State
const loan = ref(null)
const loading = ref(false)
const error = ref(null)
const showActionMenu = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showDisburseModal = ref(false)
const showDeleteModal = ref(false)
const showAddCollateral = ref(false)
const showAddGuarantor = ref(false)
const showScheduleModal = ref(false)
const showAllPaymentsModal = ref(false)
const showSinglePaymentModal = ref(false)
const actionLoading = ref(false)
const deleteLoading = ref(false)
const approvalNotes = ref('')
const rejectionReason = ref('')
const disbursementNotes = ref('')
const paymentSchedule = ref([])
const paymentScheduleLoading = ref(false)
const scheduleLoading = ref(false)
const recentPayments = ref([])
const paymentsLoading = ref(false)
const allPaymentsLoading = ref(false)
const singlePaymentLoading = ref(false)
const selectedPayment = ref(null)
const allPayments = ref([])
const paymentsSummary = ref(null)

// Filter variables
const paymentSearch = ref('')
const paymentMethodFilter = ref('')
const paymentStatusFilter = ref('')
const paymentDateFrom = ref('')
const paymentDateTo = ref('')

// Pagination
const currentPage = ref(1)
const lastPage = ref(1)
const totalPayments = ref(0)
const perPage = ref(10)
const sortField = ref('payment_date')
const sortOrder = ref('desc')

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Refs
const actionDropdownRef = ref(null)

// Computed
const isOverdue = computed(() => {
  if (!loan.value) return false
  return loan.value.is_overdue || false
})

const paymentProgress = computed(() => {
  if (!loan.value) return 0
  return loan.value.progress_percentage || 0
})

const canEdit = computed(() => {
  return ['pending', 'rejected'].includes(loan.value?.status)
})

const canApprove = computed(() => {
  return loan.value?.status === 'pending'
})

const canDisburse = computed(() => {
  return loan.value?.status === 'approved'
})

const canReject = computed(() => {
  return ['pending', 'approved'].includes(loan.value?.status)
})

const canRecordPayment = computed(() => {
  return ['active', 'defaulted'].includes(loan.value?.status) && loan.value?.balance > 0
})

const canDelete = computed(() => {
  return ['pending', 'rejected'].includes(loan.value?.status)
})

const canAddCollateral = computed(() => {
  return ['pending', 'approved'].includes(loan.value?.status)
})

const canAddGuarantor = computed(() => {
  return ['pending', 'approved'].includes(loan.value?.status)
})

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Methods
const loadLoan = async () => {
  const loanId = route.params.id

  loading.value = true
  error.value = null

  try {
    const response = await axios.get(`${API_URL}/loans/${loanId}`)

    if (response.data.success) {
      loan.value = response.data.data

      // Load additional data
      await loadPaymentSchedule(loanId)
      await loadRecentPayments(loanId)
    } else {
      error.value = 'Mkopo haukupatikana'
    }
  } catch (err) {
    console.error('Error loading loan:', err)
    error.value =
      err.response?.data?.message || 'Imeshindwa kupakia taarifa za mkopo. Tafadhali jaribu tena.'
  } finally {
    loading.value = false
  }
}

const loadPaymentSchedule = async (loanId) => {
  paymentScheduleLoading.value = true
  scheduleLoading.value = true
  try {
    const response = await axios.get(`${API_URL}/loans/${loanId}/payment-schedule`)
    if (response.data.success) {
      paymentSchedule.value = response.data.data || []
    }
  } catch (err) {
    console.error('Error loading payment schedule:', err)
  } finally {
    paymentScheduleLoading.value = false
    scheduleLoading.value = false
  }
}

const loadRecentPayments = async (loanId) => {
  paymentsLoading.value = true
  try {
    const response = await axios.get(`${API_URL}/loans/${loanId}/payments`, {
      params: { per_page: 5 },
    })
    if (response.data.success) {
      recentPayments.value = response.data.data.data || []
    }
  } catch (err) {
    console.error('Error loading recent payments:', err)
  } finally {
    paymentsLoading.value = false
  }
}

const loadAllPayments = async () => {
  if (!loan.value) return

  allPaymentsLoading.value = true
  try {
    const response = await axios.get(`${API_URL}/loans/${loan.value.id}/payments`, {
      params: {
        page: currentPage.value,
        per_page: perPage.value,
        search: paymentSearch.value || undefined,
        payment_method: paymentMethodFilter.value || undefined,
        status: paymentStatusFilter.value || undefined,
        date_from: paymentDateFrom.value || undefined,
        date_to: paymentDateTo.value || undefined,
        sort_field: sortField.value,
        sort_order: sortOrder.value,
      },
    })

    if (response.data.success) {
      allPayments.value = response.data.data.data || []
      currentPage.value = response.data.data.current_page
      lastPage.value = response.data.data.last_page
      totalPayments.value = response.data.data.total
      paymentsSummary.value = response.data.data.summary
    }
  } catch (err) {
    console.error('Error loading all payments:', err)
    showToastMessage('Hitilafu katika kupakia malipo', 'error')
  } finally {
    allPaymentsLoading.value = false
  }
}

const loadSinglePayment = async (paymentId) => {
  if (!loan.value) return

  singlePaymentLoading.value = true
  try {
    const response = await axios.get(`${API_URL}/loans/${loan.value.id}/payments/${paymentId}`)
    if (response.data.success) {
      selectedPayment.value = response.data.data
    }
  } catch (err) {
    console.error('Error loading payment details:', err)
    showToastMessage('Hitilafu katika kupakia malipo', 'error')
  } finally {
    singlePaymentLoading.value = false
  }
}

// Modal methods
const showFullScheduleModal = () => {
  showScheduleModal.value = true
  closeActionMenu()
}

const closeScheduleModal = () => {
  showScheduleModal.value = false
}

const refreshSchedule = () => {
  if (loan.value) {
    loadPaymentSchedule(loan.value.id)
  }
}

const viewAllPayments = () => {
  showAllPaymentsModal.value = true
  resetFilters()
  loadAllPayments()
  closeActionMenu()
}

const closeAllPaymentsModal = () => {
  showAllPaymentsModal.value = false
  allPayments.value = []
  resetFilters()
}

const viewSinglePayment = (payment) => {
  showSinglePaymentModal.value = true
  loadSinglePayment(payment.id)
}

const viewSinglePaymentFromAll = (payment) => {
  showAllPaymentsModal.value = false
  viewSinglePayment(payment)
}

const closeSinglePaymentModal = () => {
  showSinglePaymentModal.value = false
  selectedPayment.value = null
}

// Filter methods
const searchAllPayments = debounce(() => {
  currentPage.value = 1
  loadAllPayments()
}, 500)

const filterAllPayments = () => {
  currentPage.value = 1
  loadAllPayments()
}

const clearPaymentSearch = () => {
  paymentSearch.value = ''
  searchAllPayments()
}

const clearAllFilters = () => {
  paymentSearch.value = ''
  paymentMethodFilter.value = ''
  paymentStatusFilter.value = ''
  paymentDateFrom.value = ''
  paymentDateTo.value = ''
  currentPage.value = 1
  loadAllPayments()
}

const sortPayments = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  loadAllPayments()
}

const getSortIcon = (field) => {
  if (sortField.value !== field) return 'fa-sort'
  return sortOrder.value === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
}

const loadPaymentsPage = (page) => {
  currentPage.value = page
  loadAllPayments()
}

const refreshAllPayments = () => {
  loadAllPayments()
}

const resetFilters = () => {
  paymentSearch.value = ''
  paymentMethodFilter.value = ''
  paymentStatusFilter.value = ''
  paymentDateFrom.value = ''
  paymentDateTo.value = ''
  currentPage.value = 1
  sortField.value = 'payment_date'
  sortOrder.value = 'desc'
}

const verifyPayment = async (payment) => {
  if (!confirm('Una uhakika unataka kuhakiki malipo haya?')) return

  try {
    const response = await axios.post(`${API_URL}/payments/${payment.id}/verify`)
    if (response.data.success) {
      showToastMessage('Malipo yamehakikiwa kwa mafanikio', 'success')
      selectedPayment.value.verified = true
      // Refresh data
      if (loan.value) {
        await loadRecentPayments(loan.value.id)
        if (showAllPaymentsModal.value) {
          await loadAllPayments()
        }
      }
    }
  } catch (err) {
    console.error('Error verifying payment:', err)
    showToastMessage('Hitilafu katika kuhakiki malipo', 'error')
  }
}

const exportSchedule = () => {
  showToastMessage('Kipengele cha kupakua ratiba kitaongezwa hivi karibuni', 'info')
}

const printReceipt = (payment) => {
  showToastMessage('Kipengele cha kuchapisha risiti kitaongezwa hivi karibuni', 'info')
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Inasubiri',
    approved: 'Imeidhinishwa',
    active: 'Inaendelea',
    paid: 'Imelipwa',
    defaulted: 'Imechelewa',
    rejected: 'Imekataliwa',
  }
  return statusMap[status] || status
}

const getPaymentStatus = (status) => {
  const statusMap = {
    paid: 'Imelipwa',
    pending: 'Inasubiri',
    overdue: 'Imechelewa',
  }
  return statusMap[status] || status
}

const getFrequencyText = (frequency) => {
  const texts = {
    daily: 'Kila Siku',
    weekly: 'Kila Wiki',
    monthly: 'Kila Mwezi',
  }
  return texts[frequency] || frequency
}

const getPaymentDaysText = (paymentDays) => {
  if (!paymentDays) return ''
  try {
    const days = JSON.parse(paymentDays)
    return days.days ? days.days.join(', ') : ''
  } catch {
    return paymentDays
  }
}

const getRiskLevelText = (level) => {
  const texts = {
    low: 'Chini',
    medium: 'Wastani',
    high: 'Juu',
    very_high: 'Juu Sana',
  }
  return texts[level] || level
}

const getRecommendationIcon = (action) => {
  const icons = {
    approve: 'fa-check-circle',
    review: 'fa-exclamation-circle',
    review_carefully: 'fa-exclamation-triangle',
    reject: 'fa-times-circle',
  }
  return icons[action] || 'fa-question-circle'
}

const getCollateralIcon = (type) => {
  const icons = {
    land: 'fas fa-tree',
    vehicle: 'fas fa-car',
    equipment: 'fas fa-tools',
    building: 'fas fa-building',
    title_deed: 'fas fa-file-alt',
    other: 'fas fa-box',
  }
  return icons[type] || 'fas fa-gem'
}

const getPaymentMethodIcon = (method) => {
  const icons = {
    cash: 'fas fa-money-bill',
    bank_transfer: 'fas fa-university',
    mobile_money: 'fas fa-mobile-alt',
    cheque: 'fas fa-money-check',
  }
  return icons[method] || 'fas fa-money-bill'
}

const getPaymentMethodText = (method) => {
  const texts = {
    cash: 'Cash',
    bank_transfer: 'Benki',
    mobile_money: 'M-Pesa/TigoPesa',
    cheque: 'Cheque',
  }
  return texts[method] || method
}

// Action Menu
const toggleActionMenu = () => {
  showActionMenu.value = !showActionMenu.value
}

const closeActionMenu = () => {
  showActionMenu.value = false
}

// Handle click outside
const handleClickOutside = (event) => {
  if (actionDropdownRef.value && !actionDropdownRef.value.contains(event.target)) {
    closeActionMenu()
  }
}

// Actions
const recordPayment = () => {
  router.push(`/payments/create?loan_id=${loan.value.id}`)
  closeActionMenu()
}

const contactCustomer = () => {
  if (loan.value?.customer?.phone) {
    window.location.href = `tel:${loan.value.customer.phone}`
  }
}

// Approve modal
const approveLoan = () => {
  showApproveModal.value = true
  closeActionMenu()
}

const closeApproveModal = () => {
  showApproveModal.value = false
  approvalNotes.value = ''
}

const confirmApprove = async () => {
  if (!loan.value) return

  actionLoading.value = true

  try {
    const response = await axios.post(`${API_URL}/loans/${loan.value.id}/approve`, {
      approved_notes: approvalNotes.value,
    })

    if (response.data.success) {
      showToastMessage('Mkopo umeidhinishwa kwa mafanikio', 'success')
      closeApproveModal()
      await loadLoan()
    }
  } catch (err) {
    console.error('Error approving loan:', err)
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Reject modal
const rejectLoan = () => {
  showRejectModal.value = true
  closeActionMenu()
}

const closeRejectModal = () => {
  showRejectModal.value = false
  rejectionReason.value = ''
}

const confirmReject = async () => {
  if (!rejectionReason.value || !loan.value) return

  actionLoading.value = true

  try {
    const response = await axios.post(`${API_URL}/loans/${loan.value.id}/reject`, {
      rejection_reason: rejectionReason.value,
    })

    if (response.data.success) {
      showToastMessage('Mkopo umekataliwa', 'info')
      closeRejectModal()
      await loadLoan()
    }
  } catch (err) {
    console.error('Error rejecting loan:', err)
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Disburse modal
const disburseLoan = () => {
  showDisburseModal.value = true
  closeActionMenu()
}

const closeDisburseModal = () => {
  showDisburseModal.value = false
  disbursementNotes.value = ''
}

const confirmDisburse = async () => {
  if (!loan.value) return

  actionLoading.value = true

  try {
    const response = await axios.post(`${API_URL}/loans/${loan.value.id}/disburse`, {
      start_date: new Date().toISOString().split('T')[0],
      disbursed_notes: disbursementNotes.value,
    })

    if (response.data.success) {
      showToastMessage('Mkopo umetolewa kwa mafanikio', 'success')
      closeDisburseModal()
      await loadLoan()
    }
  } catch (err) {
    console.error('Error disbursing loan:', err)
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Delete modal
const confirmDelete = () => {
  showDeleteModal.value = true
  closeActionMenu()
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const deleteLoan = async () => {
  if (!loan.value) return

  deleteLoading.value = true

  try {
    const response = await axios.delete(`${API_URL}/loans/${loan.value.id}`)

    if (response.data.success) {
      showToastMessage('Mkopo umefutwa kwa mafanikio', 'success')
      setTimeout(() => {
        router.push('/loans')
      }, 1500)
    }
  } catch (err) {
    console.error('Error deleting loan:', err)
    showToastMessage(err.response?.data?.message || 'Hitilafu imetokea', 'error')
    closeDeleteModal()
  } finally {
    deleteLoading.value = false
  }
}

// View related items
const viewCollateral = (collateralItem) => {
  if (collateralItem?.id) {
    router.push(`/collateral/${collateralItem.id}`)
  }
}

const viewGuarantor = (guarantor) => {
  router.push(`/guarantors/${guarantor.id}`)
}

const viewPayment = (payment) => {
  router.push(`/payments/${payment.id}`)
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

// Lifecycle
onMounted(() => {
  loadLoan()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Add these additional styles for schedule and payments */

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-left i {
  font-size: 1.5rem;
  color: #667eea;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-refresh {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #f7fafc;
  color: #4a5568;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-refresh:hover {
  background: #667eea;
  color: white;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Schedule Summary */
.schedule-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 5px;
}

.summary-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
}

.summary-value.success {
  color: #d4edda;
}

.summary-value.warning {
  color: #fff3cd;
}

/* Schedule Table */
.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.schedule-table th {
  text-align: left;
  padding: 12px 10px;
  background: #f8fafc;
  color: #1a2639;
  font-weight: 600;
  border-bottom: 2px solid #eef2f6;
}

.schedule-table td {
  padding: 10px;
  border-bottom: 1px solid #eef2f6;
  color: #4a5568;
}

.schedule-table tr.overdue {
  background: #fff5f5;
}

.schedule-table tr.overdue td {
  color: #c53030;
}

.schedule-table tr.paid {
  background: #f0fff4;
}

.schedule-table tr.paid td {
  color: #276749;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.paid {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.overdue {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.small {
  padding: 2px 8px;
  font-size: 0.75rem;
}

/* Penalty Info Modal */
.penalty-info-modal {
  margin-top: 25px;
  padding: 15px;
  background: #fff3e0;
  border-radius: 8px;
  border-left: 4px solid #f39c12;
}

.penalty-info-modal h4 {
  color: #e67e22;
  margin: 0 0 10px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.penalty-info-modal p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.penalty-info-modal strong {
  color: #e67e22;
}

/* Paid Amount */
.paid-amount {
  color: #27ae60;
  font-weight: 500;
}

/* Payments Filters */
.payments-filters {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-select,
.filter-date {
  padding: 10px 15px;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.9rem;
  min-width: 150px;
  background: white;
}

.filter-select:focus,
.filter-date:focus {
  outline: none;
  border-color: #667eea;
}

/* Summary Cards */
.summary-cards {
  /* display: grid; */
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.summary-card.verified {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.summary-card.pending {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.card-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card-details {
  flex: 1;
}

.card-label {
  display: block;
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 3px;
}

.card-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 2px;
}

.card-count {
  display: block;
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Payment Details Card */
.payment-details-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  border: 1px solid #eef2f6;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eef2f6;
}

.payment-status {
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.payment-status.verified {
  background: #c6f6d5;
  color: #22543d;
}

.payment-status.unverified {
  background: #fed7d7;
  color: #742a2a;
}

.payment-number {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
}

.payment-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 0.85rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 500;
}

.info-value.amount {
  font-size: 1.3rem;
  color: #667eea;
  font-weight: 600;
}

/* Payment Breakdown */
.payment-breakdown {
  margin-bottom: 25px;
}

.payment-breakdown h4 {
  color: #2d3748;
  margin: 0 0 15px;
  font-size: 1rem;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.breakdown-item {
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.breakdown-item.principal {
  background: #e3f2fd;
  color: #1976d2;
}

.breakdown-item.interest {
  background: #fff3e0;
  color: #f57c00;
}

.breakdown-item.penalty {
  background: #fbe9e7;
  color: #d32f2f;
}

.breakdown-item.total {
  /* background: #e8f5e9; */
  color: #388e3c;
}

.breakdown-label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.breakdown-value {
  font-size: 1.2rem;
  font-weight: 600;
}

/* Payment Notes */
.payment-notes {
  margin-bottom: 25px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 8px;
}

.payment-notes h4 {
  color: #2d3748;
  margin: 0 0 10px;
  font-size: 1rem;
}

.payment-notes p {
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
}

/* Payment Actions */
.payment-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.btn-print,
.btn-verify {
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  border: none;
}

.btn-print {
  background: white;
  color: #4a5568;
  border: 2px solid #eef2f6;
}

.btn-print:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.btn-verify {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn-verify:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: #a0aec0;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 15px;
}

.empty-state p {
  margin-bottom: 20px;
}

.btn-clear-filters {
  padding: 10px 20px;
  background: none;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  color: #718096;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-clear-filters:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #667eea;
  gap: 15px;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eef2f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Responsive */
@media (max-width: 768px) {
  .schedule-summary {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .payment-info-grid {
    grid-template-columns: 1fr;
  }

  .breakdown-grid {
    grid-template-columns: 1fr 1fr;
  }

  .payment-actions {
    flex-direction: column;
  }

  .btn-print,
  .btn-verify {
    width: 100%;
    justify-content: center;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-select,
  .filter-date {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .breakdown-grid {
    grid-template-columns: 1fr;
  }

  .schedule-summary {
    grid-template-columns: 1fr;
  }
}

.risk-score-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  border-left: 4px solid;
}

.risk-score-card.low {
  border-left-color: #27ae60;
}

.risk-score-card.medium {
  border-left-color: #f39c12;
}

.risk-score-card.high {
  border-left-color: #e74c3c;
}

.risk-score-card.very_high {
  border-left-color: #c0392b;
}

.risk-score-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.risk-score-header i {
  font-size: 1.2rem;
  color: #3498db;
}

.risk-score-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.risk-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.risk-factor {
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #666;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.risk-factor i {
  font-size: 0.5rem;
  color: #3498db;
}

.recommendation {
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.recommendation.approve {
  background: #d4edda;
  color: #155724;
}

.recommendation.review {
  background: #fff3cd;
  color: #856404;
}

.recommendation.review_carefully {
  background: #ffe5d0;
  color: #e67e22;
}

.recommendation.reject {
  background: #f8d7da;
  color: #721c24;
}

.recommendation i {
  font-size: 1rem;
}

.auto-approve-badge {
  margin-top: 15px;
  padding: 8px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.customer-history {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eef2f6;
}

.customer-history h4 {
  margin: 0 0 15px;
  color: #333;
  font-size: 0.95rem;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.history-stat {
  text-align: center;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-number {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.history-stat .stat-label {
  font-size: 0.75rem;
  color: #666;
}

.loading-small {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  color: #999;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #eef2f6;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loan-detail-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
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
  margin-bottom: 25px;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
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

/* Header */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
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

.header-title {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.header-title h1 {
  font-size: 1.8rem;
  color: #1a2639;
  margin: 0;
}

.loan-status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.loan-status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.loan-status-badge.approved {
  background: #cce5ff;
  color: #004085;
}

.loan-status-badge.active {
  background: #d4edda;
  color: #155724;
}

.loan-status-badge.paid {
  background: #d1d8e0;
  color: #2c3e50;
}

.loan-status-badge.defaulted {
  background: #f8d7da;
  color: #721c24;
}

.loan-status-badge.rejected {
  background: #e2e3e5;
  color: #383d41;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-payment {
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

.btn-payment:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
}

.btn-more {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-more:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

/* Action Dropdown */
.action-dropdown {
  position: relative;
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 220px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
  margin-top: 5px;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease;
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

/* Overdue Banner */
.overdue-banner {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border-radius: 10px;
  padding: 15px 25px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.overdue-banner i {
  font-size: 2rem;
}

.banner-content {
  flex: 1;
}

.banner-content h3 {
  margin: 0 0 5px;
  font-size: 1.2rem;
}

.banner-content p {
  margin: 0;
  opacity: 0.9;
}

.btn-contact {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-contact:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Main Grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-bottom: 25px;
}

@media (max-width: 992px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

/* Left Column */
.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Summary Card */
.summary-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.summary-card h3 {
  margin: 0 0 20px;
  color: #333;
  font-size: 1.1rem;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 3px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.stat-value.large {
  font-size: 1.8rem;
  color: #3498db;
}

.stat-value.success {
  color: #27ae60;
}

.stat-value.text-danger {
  color: #e74c3c;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.progress-bar {
  position: relative;
  height: 30px;
  background: #eef2f6;
  border-radius: 15px;
  margin-top: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 15px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Info Card */
.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.card-header i {
  font-size: 1.2rem;
  color: #3498db;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  flex: 1;
}

.btn-view {
  padding: 5px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-view:hover {
  background: #1976d2;
  color: white;
}

.btn-add {
  padding: 5px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-add:hover {
  background: #1976d2;
  color: white;
}

.btn-view-small {
  width: 30px;
  height: 30px;
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

.btn-view-small:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

/* Customer Details */
.customer-profile {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.customer-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3498db;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.customer-occupation {
  font-size: 0.9rem;
  color: #666;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 0.95rem;
}

.info-row i {
  width: 18px;
  color: #3498db;
}

/* Schedule Preview */
.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th {
  text-align: left;
  padding: 8px;
  font-size: 0.8rem;
  color: #999;
  font-weight: 500;
}

.preview-table td {
  padding: 8px;
  font-size: 0.9rem;
  color: #333;
  border-bottom: 1px solid #eef2f6;
}

.status-badge.small {
  padding: 2px 8px;
  font-size: 0.75rem;
  display: inline-block;
}

.status-badge.paid {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.view-more-link {
  color: #3498db;
  text-decoration: none;
  font-size: 0.85rem;
}

.view-more-link:hover {
  text-decoration: underline;
}

/* Details Grid */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.detail-label {
  min-width: 140px;
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

/* Purpose Text */
.purpose-text {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

/* Collateral Details */
.collateral-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.collateral-icon {
  width: 45px;
  height: 45px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.collateral-icon.land {
  background: linear-gradient(135deg, #27ae60, #229954);
}

.collateral-icon.vehicle {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.collateral-icon.equipment {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.collateral-icon.title_deed {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.collateral-icon.other {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

.collateral-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collateral-name {
  font-weight: 600;
  color: #333;
}

.collateral-type {
  font-size: 0.8rem;
  color: #3498db;
}

.collateral-value {
  font-size: 0.85rem;
  color: #27ae60;
  font-weight: 500;
}

/* Guarantors List */
.guarantors-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guarantor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.guarantor-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.guarantor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.guarantor-name {
  font-weight: 600;
  color: #333;
}

.guarantor-relation {
  font-size: 0.8rem;
  color: #3498db;
}

.guarantor-phone {
  font-size: 0.8rem;
  color: #666;
}

/* History Item */
.history-item {
  display: flex;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eef2f6;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item i {
  font-size: 1.2rem;
  margin-top: 2px;
}

.history-item i.success {
  color: #27ae60;
}

.history-item i.danger {
  color: #e74c3c;
}

.history-details {
  flex: 1;
}

.history-title {
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 3px;
}

.history-date {
  font-size: 0.8rem;
  color: #999;
  display: block;
  margin-bottom: 5px;
}

.history-notes {
  margin: 5px 0 0;
  font-size: 0.9rem;
  color: #666;
  background: #f8fafc;
  padding: 8px;
  border-radius: 5px;
}

/* Recent Payments Card */
.recent-payments-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
  margin-top: 25px;
}

.table-responsive {
  overflow-x: auto;
}

.payments-table {
  width: 100%;
  border-collapse: collapse;
}

.payments-table th {
  text-align: left;
  padding: 12px 10px;
  background: #f8fafc;
  color: #1a2639;
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 2px solid #eef2f6;
}

.payments-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eef2f6;
  color: #666;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge.full {
  background: #cce5ff;
  color: #004085;
}

.badge.partial {
  background: #fff3cd;
  color: #856404;
}

.badge.verified {
  background: #d4edda;
  color: #155724;
}

.badge.unverified {
  background: #f8d7da;
  color: #721c24;
}

.payment-method i {
  margin-right: 5px;
  color: #3498db;
}

.btn-icon-small {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  background: white;
  color: #666;
  cursor: pointer;
  margin-right: 5px;
  transition: all 0.3s;
}

.btn-icon-small:hover {
  background: #f8fafc;
  color: #3498db;
  border-color: #3498db;
}

/* Empty State Small */
.empty-state-small {
  text-align: center;
  padding: 30px 20px;
  color: #999;
}

.empty-state-small i {
  font-size: 2rem;
  color: #cbd5e0;
  margin-bottom: 10px;
}

.empty-state-small p {
  margin: 0;
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

.loan-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}

.loan-summary p {
  margin: 5px 0;
  color: #333;
}

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

.form-control {
  width: 100%;
  padding: 12px 15px;
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

.warning-text {
  font-size: 1.1rem;
  color: #333;
  margin: 15px 0;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

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

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary,
.btn-secondary,
.btn-success,
.btn-danger {
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

.btn-success {
  background: linear-gradient(135deg, #27ae60, #229954);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
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

.btn-primary:disabled,
.btn-success:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Text Utilities */
.text-center {
  text-align: center;
}

.text-muted {
  color: #999;
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
  .loan-detail-container {
    padding: 15px;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .header-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-actions {
    width: 100%;
  }

  .btn-payment {
    flex: 1;
  }

  .overdue-banner {
    flex-direction: column;
    text-align: center;
  }

  .stat-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .detail-row {
    flex-direction: column;
    gap: 5px;
  }

  .detail-label {
    min-width: auto;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-success,
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

.collaterals-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.collateral-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
  transition: all 0.3s;
}

.collateral-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.collateral-description {
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

.collateral-summary {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eef2f6;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  color: #333;
}

.badge-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.pending {
  background: #fff3cd;
  color: #856404;
}

.badge.verified {
  background: #d4edda;
  color: #155724;
}

/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px 0;
  border-top: 1px solid #eef2f6;
}

.btn-pagination {
  padding: 10px 20px;
  background: white;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  color: #4a5568;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.btn-pagination i {
  font-size: 0.85rem;
  color: #667eea;
  transition: all 0.3s ease;
}

.btn-pagination:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-pagination:hover:not(:disabled) i {
  color: white;
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f7fafc;
  border-color: #e2e8f0;
}

.page-info {
  color: #4a5568;
  font-size: 0.95rem;
  font-weight: 500;
  background: #f7fafc;
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid #eef2f6;
}

/* Alternative pagination style - Pill style */
.pagination-pills {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 30px;
  padding: 20px 0;
  flex-wrap: wrap;
}

.pill {
  min-width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 2px solid #eef2f6;
  color: #4a5568;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill:hover:not(.active):not(.disabled) {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
}

.pill.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.pill.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f7fafc;
}

.pill.dots {
  border: none;
  cursor: default;
  background: transparent;
}

.pill.dots:hover {
  transform: none;
  background: transparent;
}

.pill.prev-next {
  width: auto;
  padding: 0 15px;
  border-radius: 20px;
  gap: 8px;
  font-size: 0.9rem;
}

.pill.prev-next i {
  font-size: 0.8rem;
}

/* Compact pagination for small spaces */
.pagination-compact {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid #eef2f6;
}

.compact-info {
  color: #718096;
  font-size: 0.9rem;
}

.compact-buttons {
  display: flex;
  gap: 8px;
}

.btn-compact {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: white;
  border: 2px solid #eef2f6;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-compact:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.btn-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f7fafc;
}

/* Loading state for pagination */
.pagination-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
  padding: 20px;
  color: #667eea;
}

.pagination-loading .spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #eef2f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Responsive pagination */
@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
    gap: 15px;
  }

  .btn-pagination {
    width: 100%;
    justify-content: center;
  }

  .page-info {
    width: 100%;
    text-align: center;
  }

  .pagination-pills {
    gap: 5px;
  }

  .pill {
    min-width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }

  .pill.prev-next {
    padding: 0 12px;
    font-size: 0.85rem;
  }

  .pagination-compact {
    flex-direction: column;
    align-items: stretch;
  }

  .compact-buttons {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .pagination-pills {
    justify-content: center;
  }

  .pill:not(.prev-next) {
    display: none;
  }

  .pill.active {
    display: flex;
  }

  .pill.prev-next {
    display: flex;
  }

  .compact-info {
    text-align: center;
  }
}

/* Dark mode support (if needed) */
@media (prefers-color-scheme: dark) {
  .btn-pagination,
  .pill,
  .btn-compact {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .page-info {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .pagination-compact {
    border-top-color: #4a5568;
  }

  .compact-info {
    color: #a0aec0;
  }

  .btn-pagination:hover:not(:disabled),
  .pill:hover:not(.active):not(.disabled) {
    background: #4a5568;
    border-color: #667eea;
    color: #e2e8f0;
  }
}

/* Modal Size Classes */
.modal-content.schedule-modal {
  width: 95%;
  max-width: 1000px;
  max-height: 90vh;
}

.modal-content.payments-modal {
  width: 95%;
  max-width: 1000px;
  max-height: 90vh;
}

.modal-content.payment-detail-modal {
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
}

/* Modal Body with Scroll */
.modal-body.schedule-modal-body,
.modal-body.payments-modal-body,
.modal-body.payment-detail-body {
  max-height: calc(90vh - 130px);
  overflow-y: auto;
  padding: 20px 25px;
}

/* Custom Scrollbar */
.modal-body.schedule-modal-body::-webkit-scrollbar,
.modal-body.payments-modal-body::-webkit-scrollbar,
.modal-body.payment-detail-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.modal-body.schedule-modal-body::-webkit-scrollbar-track,
.modal-body.payments-modal-body::-webkit-scrollbar-track,
.modal-body.payment-detail-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-body.schedule-modal-body::-webkit-scrollbar-thumb,
.modal-body.payments-modal-body::-webkit-scrollbar-thumb,
.modal-body.payment-detail-body::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.modal-body.schedule-modal-body::-webkit-scrollbar-thumb:hover,
.modal-body.payments-modal-body::-webkit-scrollbar-thumb:hover,
.modal-body.payment-detail-body::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Schedule Table Container */
.schedule-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eef2f6;
  border-radius: 8px;
}

/* Schedule Table */
.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.schedule-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  z-index: 10;
  padding: 12px 10px;
  text-align: left;
  font-weight: 600;
  color: #1a2639;
  border-bottom: 2px solid #eef2f6;
}

.schedule-table td {
  padding: 10px;
  border-bottom: 1px solid #eef2f6;
  color: #4a5568;
}

/* Text Alignment */
.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

/* Payments Table Container */
.payments-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  margin-top: 20px;
}

.payments-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.payments-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  z-index: 10;
  padding: 12px 10px;
  font-weight: 600;
  color: #1a2639;
  border-bottom: 2px solid #eef2f6;
}

.payments-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eef2f6;
  color: #4a5568;
}

/* Date Range Filter */
.date-range {
  display: flex;
  align-items: center;
  gap: 5px;
  background: white;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  padding: 2px;
}

.date-range .filter-date {
  border: none;
  padding: 8px 10px;
  width: 130px;
}

.date-range .filter-date:focus {
  outline: none;
  box-shadow: none;
}

.date-separator {
  color: #718096;
  font-size: 0.9rem;
}

/* Clear Filters Button */
.btn-clear-filters-small {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #eef2f6;
  background: white;
  color: #718096;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-clear-filters-small:hover {
  background: #f7fafc;
  color: #e74c3c;
  border-color: #e74c3c;
}

/* Method Summary Cards */
.summary-card.method {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.summary-card.method .card-icon.cash {
  background: rgba(46, 204, 113, 0.3);
}

.summary-card.method .card-icon.bank_transfer {
  background: rgba(52, 152, 219, 0.3);
}

.summary-card.method .card-icon.mobile_money {
  background: rgba(241, 196, 15, 0.3);
}

.summary-card.method .card-icon.cheque {
  background: rgba(155, 89, 182, 0.3);
}

/* Pagination Controls */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding: 15px 0;
  border-top: 1px solid #eef2f6;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  color: #718096;
  font-size: 0.9rem;
}

.pagination-info strong {
  color: #2d3748;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-pagination {
  padding: 8px 15px;
  background: white;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  color: #4a5568;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-pagination:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  padding: 8px 15px;
  background: #f7fafc;
  border-radius: 8px;
  color: #4a5568;
  font-weight: 500;
}

.pagination-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
  font-size: 0.9rem;
}

.per-page-select {
  padding: 6px 10px;
  border: 2px solid #eef2f6;
  border-radius: 6px;
  background: white;
  color: #4a5568;
  cursor: pointer;
}

.per-page-select:focus {
  outline: none;
  border-color: #667eea;
}

/* Payment Detail Modal */
.payment-header-large {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%);
  border-radius: 12px;
}

.payment-status-large {
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.payment-status-large.verified {
  background: #c6f6d5;
  color: #22543d;
}

.payment-status-large.unverified {
  background: #fed7d7;
  color: #742a2a;
}

.payment-status-large i {
  font-size: 1.2rem;
}

.payment-amount-large {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
}

/* Payment Details Grid */
.payment-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
  margin-bottom: 30px;
}

.detail-section {
  background: #f8fafc;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #eef2f6;
}

.detail-section.full-width {
  grid-column: span 2;
}

.detail-section h4 {
  margin: 0 0 15px;
  color: #2d3748;
  font-size: 1rem;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f6;
}

.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.detail-label {
  color: #718096;
  font-size: 0.9rem;
}

.detail-value {
  color: #2d3748;
  font-weight: 500;
}

/* Breakdown Chart */
.breakdown-chart {
  margin-bottom: 20px;
}

.breakdown-bar {
  display: flex;
  height: 30px;
  background: #eef2f6;
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 15px;
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  transition: width 0.3s ease;
}

.bar-segment.principal {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.bar-segment.interest {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.bar-segment.penalty {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.segment-label {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.breakdown-numbers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.breakdown-numbers .breakdown-item {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
}

.breakdown-numbers .breakdown-item.principal {
  background: #e3f2fd;
}

.breakdown-numbers .breakdown-item.interest {
  background: #fff3e0;
}

.breakdown-numbers .breakdown-item.penalty {
  background: #fbe9e7;
}

/* Notes Box */
.notes-box {
  background: white;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  padding: 15px;
  min-height: 80px;
}

.notes-box p {
  margin: 0;
  color: #4a5568;
  line-height: 1.6;
}

/* Payment Actions Large */
.payment-actions-large {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eef2f6;
}

.btn-print-large,
.btn-verify-large,
.btn-close-large {
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  border: none;
}

.btn-print-large {
  background: white;
  color: #4a5568;
  border: 2px solid #eef2f6;
}

.btn-print-large:hover {
  background: #f7fafc;
  border-color: #667eea;
  color: #667eea;
}

.btn-verify-large {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn-verify-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
}

.btn-close-large {
  background: #f7fafc;
  color: #4a5568;
  border: 2px solid #eef2f6;
}

.btn-close-large:hover {
  background: #eef2f6;
  color: #e74c3c;
  border-color: #e74c3c;
}

/* Badge Large */
.badge.large {
  padding: 6px 15px;
  font-size: 0.9rem;
}

/* Modal Footer Buttons */
.btn-print-modal {
  padding: 10px 20px;
  background: white;
  color: #4a5568;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-print-modal:hover {
  background: #f7fafc;
  border-color: #667eea;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1200px) {
  .payment-details-grid {
    grid-template-columns: 1fr;
  }

  .detail-section.full-width {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-buttons {
    justify-content: center;
  }

  .payment-header-large {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .payment-actions-large {
    flex-direction: column;
  }

  .btn-print-large,
  .btn-verify-large,
  .btn-close-large {
    width: 100%;
    justify-content: center;
  }

  .date-range {
    flex-wrap: wrap;
  }

  .date-range .filter-date {
    width: 100%;
  }
}

/* Search Box Styles */
.search-box {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-box.large {
  max-width: 600px;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 1rem;
  z-index: 1;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid #eef2f6;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
  color: #2d3748;
}

.search-input:hover {
  border-color: #cbd5e0;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.search-input::placeholder {
  color: #a0aec0;
  font-size: 0.9rem;
}

.search-input:disabled {
  background: #f7fafc;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Clear Search Button */
.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border-radius: 50%;
  width: 24px;
  height: 24px;
}

.clear-search:hover {
  color: #e74c3c;
  background: #fee;
}

.clear-search i {
  font-size: 0.9rem;
}

/* Search Box with Loading */
.search-box.loading .search-input {
  padding-right: 45px;
}

.search-box.loading .search-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid #eef2f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Search Box with Results Count */
.search-box.has-results .search-input {
  border-color: #27ae60;
}

.search-box.has-results .results-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #27ae60;
  color: white;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 20px;
  pointer-events: none;
}

/* Search Box with Error */
.search-box.has-error .search-input {
  border-color: #e74c3c;
  background: #fff5f5;
}

.search-box.has-error .search-error-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #e74c3c;
  font-size: 1rem;
}

/* Search Suggestions Dropdown */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #eef2f6;
  border-top: none;
  border-radius: 0 0 10px 10px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-top: -2px;
}

.search-suggestion-item {
  padding: 12px 15px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-suggestion-item:last-child {
  border-bottom: none;
}

.search-suggestion-item:hover {
  background: #f7fafc;
}

.search-suggestion-item.selected {
  background: #e3f2fd;
  border-left: 3px solid #667eea;
}

.suggestion-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.suggestion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-title {
  font-weight: 500;
  color: #2d3748;
  font-size: 0.95rem;
}

.suggestion-subtitle {
  font-size: 0.8rem;
  color: #718096;
}

.suggestion-highlight {
  background: #fbbf24;
  color: #744210;
  padding: 0 2px;
  font-weight: 500;
}

/* Search Box Variants */
.search-box.compact .search-input {
  padding: 8px 12px 8px 35px;
  font-size: 0.85rem;
}

.search-box.compact .search-icon {
  left: 10px;
  font-size: 0.85rem;
}

.search-box.bordered .search-input {
  border-width: 1px;
  background: #f8fafc;
}

.search-box.bordered .search-input:focus {
  background: white;
}

.search-box.rounded .search-input {
  border-radius: 30px;
}

.search-box.rounded .search-icon {
  left: 18px;
}

.search-box.rounded .clear-search {
  right: 15px;
}

.search-box.glass .search-input {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.search-box.glass .search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-box.glass .search-icon {
  color: rgba(255, 255, 255, 0.7);
}

.search-box.glass .clear-search {
  color: rgba(255, 255, 255, 0.7);
}

.search-box.glass .clear-search:hover {
  color: white;
  background: rgba(255, 255, 255, 0.2);
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .search-input {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .search-input:hover {
    border-color: #718096;
  }

  .search-input:focus {
    border-color: #667eea;
    background: #2d3748;
  }

  .search-input::placeholder {
    color: #718096;
  }

  .search-suggestions {
    background: #2d3748;
    border-color: #4a5568;
  }

  .search-suggestion-item {
    border-bottom-color: #4a5568;
  }

  .search-suggestion-item:hover {
    background: #374151;
  }

  .suggestion-title {
    color: #e2e8f0;
  }

  .suggestion-subtitle {
    color: #a0aec0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .search-box {
    max-width: 100%;
  }

  .search-box.large {
    max-width: 100%;
  }

  .search-suggestions {
    max-height: 250px;
  }
}

@media (max-width: 480px) {
  .search-input {
    padding: 10px 12px 10px 40px;
    font-size: 0.9rem;
  }

  .search-icon {
    left: 12px;
    font-size: 0.9rem;
  }

  .clear-search {
    width: 20px;
    height: 20px;
  }
}

/* Animation for search suggestions */
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

.search-suggestions {
  animation: slideDown 0.2s ease;
}

/* Search Box with Icon on Right */
.search-box.icon-right .search-icon {
  left: auto;
  right: 15px;
}

.search-box.icon-right .search-input {
  padding: 12px 45px 12px 15px;
}

.search-box.icon-right .clear-search {
  right: 45px;
}

/* Search Box with Gradient Border */
.search-box.gradient-border .search-input {
  border: double 2px transparent;
  background-image: linear-gradient(white, white), linear-gradient(135deg, #667eea, #764ba2);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.search-box.gradient-border .search-input:focus {
  background-image: linear-gradient(white, white), linear-gradient(135deg, #764ba2, #667eea);
}

/* Search Box with Shadow */
.search-box.shadow .search-input {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.search-box.shadow .search-input:focus {
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
}

/* Search Box with Underline */
.search-box.underline .search-input {
  border: none;
  border-bottom: 2px solid #eef2f6;
  border-radius: 0;
  padding-left: 35px;
  background: transparent;
}

.search-box.underline .search-input:focus {
  border-bottom-color: #667eea;
  box-shadow: none;
}

.search-box.underline .search-icon {
  left: 0;
}

.search-box.underline .clear-search {
  right: 0;
}

/* Simple Summary Stats Grid - No cards */
.summary-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 4fr));
  gap: 15px;
  margin-bottom: 25px;
}

.stat-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.stat-block:hover {
  border-bottom-color: currentColor;
  transform: translateY(-2px);
}

.stat-block.total {
  color: #3498db;
}

.stat-block.verified {
  color: #27ae60;
}

.stat-block.pending {
  color: #f39c12;
}

.stat-block.method {
  color: #9b59b6;
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  opacity: 0.8;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #718096;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 2px;
  color: #2d3748;
}

.stat-block.total .stat-value,
.stat-block.verified .stat-value,
.stat-block.pending .stat-value,
.stat-block.method .stat-value {
  color: inherit;
}

.stat-count {
  font-size: 0.7rem;
  color: #a0aec0;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-block {
    padding: 8px;
  }

  .stat-icon {
    width: 30px;
    height: 30px;
    font-size: 1.2rem;
  }

  .stat-value {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .summary-stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-block {
    border-bottom: 1px solid #eef2f6;
  }

  .stat-block:hover {
    transform: none;
  }
}
/* Simple Horizontal Stats */
.simple-horizontal-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 5px;
  margin-bottom: 20px;
  padding: 8px 0;
  background: #f8fafc;
  border-radius: 8px;
  overflow-x: auto;
  white-space: nowrap;
}

.simple-stat {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 3px 8px;
  font-size: 0.85rem;
}

.simple-stat .stat-label {
  color: #718096;
}

.simple-stat .stat-value.total {
  color: #3498db;
  font-weight: 600;
}

.simple-stat .stat-value.verified {
  color: #27ae60;
  font-weight: 600;
}

.simple-stat .stat-value.pending {
  color: #f39c12;
  font-weight: 600;
}

.simple-stat .stat-value.method {
  color: #9b59b6;
  font-weight: 600;
}

.simple-stat .stat-count {
  color: #a0aec0;
  font-size: 0.75rem;
}

.stat-bullet {
  color: #cbd5e0;
  font-size: 1.2rem;
  line-height: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .simple-horizontal-stats {
    padding: 5px;
  }

  .simple-stat {
    font-size: 0.8rem;
  }
}
</style>
