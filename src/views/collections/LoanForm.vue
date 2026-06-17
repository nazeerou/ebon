<template>
  <div class="loan-form-container">
    <!-- Header -->
    <div class="form-header">
      <h2>{{ isEdit ? 'Hariri Mkopo' : 'Ombi la Mkopo' }}</h2>
      <p class="header-subtitle">
        {{ isEdit ? 'Badilisha taarifa za mkopo' : 'Jaza taarifa zote za kuomba mkopo' }}
      </p>
    </div>

    <!-- Customer Selection (if not preselected) -->
    <div v-if="!preselectedCustomer && !isEdit" class="customer-selector">
      <div class="selector-header">
        <i class="fas fa-user"></i>
        <h3>Chagua Mteja</h3>
      </div>

      <div class="search-box">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          v-model="customerSearch"
          @input="searchCustomers"
          placeholder="Tafuta mteja kwa jina, simu, au namba ya kitambulisho..."
          class="search-input"
        />
        <button v-if="customerSearch" class="clear-search" @click="clearCustomerSearch">
          <i class="fas fa-times-circle"></i>
        </button>
      </div>

      <div v-if="customersLoading" class="search-loading">
        <div class="spinner-small"></div>
        <span>Inatafuta...</span>
      </div>

      <div v-if="searchResults.length > 0" class="search-results">
        <div
          v-for="customer in searchResults"
          :key="customer.id"
          class="customer-result"
          @click="selectCustomer(customer)"
        >
          <img
            :src="customer.profile_photo || '/default-avatar.png'"
            :alt="customer.name"
            class="result-avatar"
          />
          <div class="result-info">
            <span class="result-name">{{ customer.first_name }} {{ customer.last_name }}</span>
            <span class="result-details">{{ customer.phone }} • {{ customer.occupation }}</span>
          </div>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>

      <div v-if="noResults" class="no-results">
        <i class="fas fa-user-slash"></i>
        <p>Hakuna mteja aliyepatikana</p>
        <router-link to="/customers/create" class="btn-primary">
          <i class="fas fa-user-plus"></i>
          Sajili Mteja Mpya
        </router-link>
      </div>
    </div>

    <!-- Selected Customer Info -->
    <div v-if="selectedCustomer" class="selected-customer">
      <div class="customer-card">
        <img
          :src="selectedCustomer.profile_photo || '/default-avatar.png'"
          :alt="selectedCustomer.name"
          class="customer-avatar"
        />
        <div class="customer-details">
          <h3>{{ selectedCustomer.first_name }} {{ selectedCustomer.last_name }}</h3>
          <p><i class="fas fa-phone-alt"></i> {{ selectedCustomer.phone }}</p>
          <p><i class="fas fa-briefcase"></i> {{ selectedCustomer.occupation }}</p>
          <p>
            <i class="fas fa-coins"></i> Kipato:
            {{ formatCurrency(selectedCustomer.monthly_income) }}/mwezi
          </p>
        </div>
        <button v-if="!isEdit" class="btn-change" @click="changeCustomer">
          <i class="fas fa-sync-alt"></i>
          Badilisha
        </button>
      </div>
    </div>

    <!-- Loan Application Form -->
    <form v-if="selectedCustomer || isEdit" @submit.prevent="submitForm" class="loan-form">
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

      <div class="form-grid">
        <!-- Loan Amount -->
        <div class="form-group required">
          <label for="amount">
            <i class="fas fa-money-bill-wave"></i>
            Kiasi cha Mkopo (TZS)
          </label>
          <div class="currency-input">
            <span class="currency-symbol">TZS</span>
            <input
              type="number"
              id="amount"
              v-model.number="form.amount"
              @input="calculateLoan"
              class="form-control with-currency"
              :class="{ 'is-invalid': errors.amount }"
              placeholder="500,000"
              min="10000"
              max="50000000"
              required
            />
          </div>
          <span class="input-hint"
            >Kiasi cha chini: TZS 10,000 • Kiasi cha juu: TZS 50,000,000</span
          >
          <span v-if="errors.amount" class="error-text">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.amount }}
          </span>
        </div>

        <!-- Interest Rate -->
        <div class="form-group required">
          <label for="interest_rate">
            <i class="fas fa-percent"></i>
            Riba kwa Mwezi (%)
          </label>
          <input
            type="number"
            id="interest_rate"
            v-model.number="form.interest_rate"
            @input="calculateLoan"
            class="form-control"
            :class="{ 'is-invalid': errors.interest_rate }"
            placeholder="10"
            min="0"
            max="100"
            step="0.1"
            required
          />
          <span class="input-hint">Asilimia ya riba kwa mwezi</span>
          <span v-if="errors.interest_rate" class="error-text">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.interest_rate }}
          </span>
        </div>

        <!-- Duration - Now with custom input and options -->
        <div class="form-group required">
          <label for="duration_type">
            <i class="fas fa-calendar-alt"></i>
            Muda wa Mkopo
          </label>
          <div class="duration-input-group">
            <input
              type="number"
              id="duration_value"
              v-model.number="form.duration_value"
              @input="calculateLoan"
              class="form-control duration-value"
              :class="{ 'is-invalid': errors.duration_value }"
              placeholder="10"
              min="1"
              max="360"
              required
            />
            <select
              id="duration_unit"
              v-model="form.duration_unit"
              @change="calculateLoan"
              class="form-control duration-unit"
              :class="{ 'is-invalid': errors.duration_unit }"
              required
            >
              <option value="days">Siku</option>
              <option value="weeks">Wiki</option>
              <option value="months">Miezi</option>
              <option value="years">Miaka</option>
            </select>
          </div>
          <span class="input-hint">Mfano: Andika 10 na uchague "Siku" kwa muda wa siku 10</span>
          <span v-if="errors.duration_value" class="error-text">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.duration_value }}
          </span>
        </div>

        <!-- Duration Presets -->
        <div class="form-group full-width">
          <label>Chagua Muda Waliotayarishwa</label>
          <div class="duration-presets">
            <button type="button" class="preset-btn" @click="setDurationPreset(7, 'days')">
              Wiki 1 (Siku 7)
            </button>
            <button type="button" class="preset-btn" @click="setDurationPreset(14, 'days')">
              Siku 14
            </button>
            <button type="button" class="preset-btn" @click="setDurationPreset(30, 'days')">
              Mwezi 1 (Siku 30)
            </button>
            <button type="button" class="preset-btn" @click="setDurationPreset(60, 'days')">
              Miezi 2
            </button>
            <button type="button" class="preset-btn" @click="setDurationPreset(90, 'days')">
              Miezi 3
            </button>
            <button type="button" class="preset-btn" @click="setDurationPreset(180, 'days')">
              Miezi 6
            </button>
            <button type="button" class="preset-btn" @click="setDurationPreset(365, 'days')">
              Mwaka 1
            </button>
          </div>
        </div>

        <!-- Payment Frequency -->
        <div class="form-group required">
          <label for="payment_frequency">
            <i class="fas fa-clock"></i>
            Muda wa Malipo
          </label>
          <select
            id="payment_frequency"
            v-model="form.payment_frequency"
            @change="calculateLoan"
            class="form-control"
            :class="{ 'is-invalid': errors.payment_frequency }"
            required
          >
            <option value="">Chagua muda wa malipo</option>
            <option value="monthly">Kila Mwezi</option>
            <option value="weekly">Kila Wiki</option>
            <option value="daily">Kila Siku</option>
            <option value="one_time">Mara Moja (Mwisho wa Muda)</option>
          </select>
          <span v-if="errors.payment_frequency" class="error-text">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.payment_frequency }}
          </span>
        </div>

        <!-- Start Date -->
        <div class="form-group required">
          <label for="start_date">
            <i class="fas fa-calendar-check"></i>
            Tarehe ya Kuanza
          </label>
          <input
            type="date"
            id="start_date"
            v-model="form.start_date"
            @change="calculateLoan"
            class="form-control"
            :class="{ 'is-invalid': errors.start_date }"
            required
          />
          <span v-if="errors.start_date" class="error-text">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.start_date }}
          </span>
        </div>

        <!-- Grace Period (Days) -->
        <div class="form-group">
          <label for="grace_period">
            <i class="fas fa-hourglass-half"></i>
            Siku za Mapumziko (Grace Period)
          </label>
          <input
            type="number"
            id="grace_period"
            v-model.number="form.grace_period"
            @input="calculateLoan"
            class="form-control"
            placeholder="0"
            min="0"
            max="30"
          />
          <span class="input-hint">Siku za mapumziko kabla ya riba ya kuchelewa kuanza</span>
        </div>

        <!-- Penalty Rate with Period Selection -->
        <div class="form-group">
          <label for="penalty_rate">
            <i class="fas fa-exclamation-triangle"></i>
            Riba ya Kuchelewa
          </label>
          <div class="penalty-input-group">
            <input
              type="number"
              id="penalty_rate"
              v-model.number="form.penalty_rate"
              @input="calculateLoan"
              class="form-control penalty-value"
              :placeholder="form.interest_rate || '10'"
              min="0"
              max="100"
              step="0.1"
            />
            <select
              id="penalty_period"
              v-model="form.penalty_period"
              @change="calculateLoan"
              class="form-control penalty-period"
            >
              <option value="month">Kwa Mwezi</option>
              <option value="day">Kwa Siku</option>
            </select>
          </div>
          <span class="input-hint"
            >Riba inayoongezwa ukichelewa kulipa. Unaweza kuchagua kwa mwezi au siku</span
          >
        </div>

        <!-- Purpose -->
        <div class="form-group full-width">
          <label for="purpose">
            <i class="fas fa-bullseye"></i>
            Madhumuni ya Mkopo
          </label>
          <textarea
            id="purpose"
            v-model="form.purpose"
            class="form-control"
            :class="{ 'is-invalid': errors.purpose }"
            rows="3"
            placeholder="Eleza kwa nini unahitaji mkopo huu..."
          ></textarea>
          <span v-if="errors.purpose" class="error-text">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.purpose }}
          </span>
        </div>
      </div>

      <!-- Loan Calculation Summary -->
      <div v-if="loanCalculated && loanSummary.total_amount" class="calculation-summary">
        <h3>Muhtasari wa Mkopo</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Kiasi cha Mkopo:</span>
            <span class="summary-value">{{ formatCurrency(form.amount) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Riba ({{ form.interest_rate }}% kwa mwezi):</span>
            <span class="summary-value">{{ formatCurrency(loanSummary.interest) }}</span>
          </div>
          <div class="summary-item total">
            <span class="summary-label">Jumla ya Kurejesha:</span>
            <span class="summary-value">{{ formatCurrency(loanSummary.total_amount) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Malipo kwa {{ getFrequencyText }}:</span>
            <span class="summary-value">{{ formatCurrency(loanSummary.installment_amount) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Idadi ya Malipo:</span>
            <span class="summary-value">{{ loanSummary.installments }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Tarehe ya Kukamilisha:</span>
            <span class="summary-value">{{ formatDate(loanSummary.end_date) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Muda wa Mkopo:</span>
            <span class="summary-value">{{ formatDuration() }}</span>
          </div>
        </div>

        <!-- Payment Schedule Preview -->
        <div v-if="paymentSchedule.length > 0" class="payment-preview">
          <button
            type="button"
            class="btn-toggle-schedule"
            @click="showPaymentSchedule = !showPaymentSchedule"
          >
            <i :class="showPaymentSchedule ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            {{ showPaymentSchedule ? 'Ficha' : 'Onyesha' }} Ratiba ya Malipo
          </button>

          <div v-if="showPaymentSchedule" class="payment-schedule-table">
            <div class="table-responsive">
              <table class="payment-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tarehe</th>
                    <th>Malipo (TZS)</th>
                    <th>Riba (TZS)</th>
                    <th>Salio (TZS)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="payment in paymentSchedule.slice(0, 12)" :key="payment.number">
                    <td>{{ payment.number }}</td>
                    <td>{{ formatDate(payment.due_date) }}</td>
                    <td>{{ formatCurrency(payment.amount) }}</td>
                    <td>{{ formatCurrency(payment.interest) }}</td>
                    <td>{{ formatCurrency(payment.remaining_balance) }}</td>
                  </tr>
                  <tr v-if="paymentSchedule.length > 12" class="more-payments">
                    <td colspan="5" class="text-center">
                      ... na malipo mengine {{ paymentSchedule.length - 12 }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Penalty Information -->
        <div class="penalty-info">
          <h4><i class="fas fa-info-circle"></i> Riba ya Kuchelewa:</h4>
          <p>
            Ukishindwa kulipa ndani ya muda uliopangwa, riba ya
            <strong>{{ getPenaltyRateFormatted }}</strong> itaongezwa kwa
            <strong>{{ form.penalty_period === 'month' ? 'kila mwezi' : 'kila siku' }}</strong>
            wa kuchelewa. Siku za mapumziko: <strong>{{ form.grace_period || 0 }}</strong> siku.
          </p>
          <div class="penalty-example">
            <strong>Mfano:</strong> Ukichelewa kipindi kimoja ({{
              form.penalty_period === 'month' ? 'mwezi 1' : 'siku 30'
            }}), riba ya kuchelewa itakuwa:
            <span class="example-calculation">
              {{ formatCurrency(form.amount) }} × {{ getPenaltyRateValue }}% =
              {{ formatCurrency(calculatePenaltyExample()) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Collateral Section -->
      <div class="section-card">
        <div class="section-header">
          <i class="fas fa-gem"></i>
          <h3>Dhamana</h3>
          <button type="button" class="btn-add" @click="showAddCollateral = true">
            <i class="fas fa-plus"></i>
            Ongeza Dhamana
          </button>
        </div>

        <div v-if="form.collaterals.length > 0" class="collaterals-list">
          <div v-for="(collateral, index) in form.collaterals" :key="index" class="collateral-item">
            <div class="collateral-icon">
              <i :class="getCollateralIcon(collateral.type)"></i>
            </div>
            <div class="collateral-details">
              <span class="collateral-name">{{ collateral.name }}</span>
              <span class="collateral-type">{{ collateral.type }}</span>
              <span class="collateral-value">{{ formatCurrency(collateral.value) }}</span>
            </div>
            <button type="button" class="btn-remove" @click="removeCollateral(index)" title="Ondoa">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div v-else class="empty-state-small">
          <i class="fas fa-gem"></i>
          <p>Hakuna dhamana iliyoongezwa</p>
          <p class="hint">Dhamana si lazima lakini inasaidia kupata mkopo kwa urahisi</p>
        </div>
      </div>

      <!-- Guarantors Section -->
      <div class="section-card">
        <div class="section-header">
          <i class="fas fa-users"></i>
          <h3>Wadhamini</h3>
          <button type="button" class="btn-add" @click="showAddGuarantor = true">
            <i class="fas fa-plus"></i>
            Ongeza Mdhamini
          </button>
        </div>

        <div v-if="form.guarantors.length > 0" class="guarantors-list">
          <div v-for="(guarantor, index) in form.guarantors" :key="index" class="guarantor-item">
            <img
              :src="guarantor.photo || '/default-avatar.png'"
              :alt="guarantor.name"
              class="guarantor-avatar"
            />
            <div class="guarantor-details">
              <span class="guarantor-name">{{ guarantor.name }}</span>
              <span class="guarantor-relation">{{ guarantor.relationship }}</span>
              <span class="guarantor-phone">{{ guarantor.phone }}</span>
            </div>
            <button type="button" class="btn-remove" @click="removeGuarantor(index)" title="Ondoa">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div v-else class="empty-state-small">
          <i class="fas fa-users"></i>
          <p>Hakuna mdhamini aliyeongezwa</p>
          <p class="hint">Wadhamini wanasaidia kuimarisha ombi lako la mkopo</p>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div class="terms-section">
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.terms_accepted" required />
          <span class="checkmark"></span>
          <span class="terms-text">
            Nakubali <a href="#" @click.prevent="showTerms = true">Sheria na Masharti</a> ya mkopo
          </span>
        </label>
        <span v-if="errors.terms_accepted" class="error-text">
          <i class="fas fa-exclamation-circle"></i>
          {{ errors.terms_accepted }}
        </span>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/loans" class="btn-secondary">
          <i class="fas fa-times"></i>
          Ghairi
        </router-link>
        <button type="submit" class="btn-primary" :disabled="saving">
          <span v-if="saving" class="spinner"></span>
          <span v-else>
            <i class="fas fa-paper-plane"></i>
            {{ isEdit ? 'Hifadhi Mabadiliko' : 'Tuma Ombi' }}
          </span>
        </button>
      </div>
    </form>

    <!-- Add Collateral Modal -->
    <div v-if="showAddCollateral" class="modal-overlay" @click="showAddCollateral = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Ongeza Dhamana</h3>
          <button class="close-btn" @click="showAddCollateral = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="collateral_name">Jina la Dhamana</label>
            <input
              type="text"
              id="collateral_name"
              v-model="newCollateral.name"
              class="form-control"
              placeholder="Mfano: Gari, Nyumba, Shamba"
            />
          </div>
          <div class="form-group">
            <label for="collateral_type">Aina ya Dhamana</label>
            <select id="collateral_type" v-model="newCollateral.type" class="form-control">
              <option value="land">Shamba/Ardhi</option>
              <option value="vehicle">Gari</option>
              <option value="equipment">Vifaa</option>
              <option value="title_deed">Hati ya Miliki</option>
              <option value="other">Nyingine</option>
            </select>
          </div>
          <div class="form-group">
            <label for="collateral_value">Thamani (TZS)</label>
            <input
              type="number"
              id="collateral_value"
              v-model.number="newCollateral.value"
              class="form-control"
              placeholder="5,000,000"
              min="0"
            />
          </div>
          <div class="form-group">
            <label for="collateral_description">Maelezo</label>
            <textarea
              id="collateral_description"
              v-model="newCollateral.description"
              class="form-control"
              rows="2"
              placeholder="Maelezo mafupi kuhusu dhamana"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddCollateral = false" class="btn-secondary">Ghairi</button>
          <button
            @click="addCollateral"
            class="btn-primary"
            :disabled="!newCollateral.name || !newCollateral.value"
          >
            Ongeza
          </button>
        </div>
      </div>
    </div>

    <!-- Add Guarantor Modal -->
    <div v-if="showAddGuarantor" class="modal-overlay" @click="showAddGuarantor = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Ongeza Mdhamini</h3>
          <button class="close-btn" @click="showAddGuarantor = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="search-box mb-3">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              v-model="guarantorSearch"
              @input="searchGuarantors"
              placeholder="Tafuta mdhamini aliyesajiliwa..."
              class="search-input"
            />
          </div>

          <div v-if="guarantorLoading" class="search-loading">
            <div class="spinner-small"></div>
            <span>Inatafuta...</span>
          </div>

          <div v-if="guarantorResults.length > 0" class="search-results">
            <div
              v-for="guarantor in guarantorResults"
              :key="guarantor.id"
              class="customer-result"
              @click="selectGuarantor(guarantor)"
            >
              <img
                :src="guarantor.photo || '/default-avatar.png'"
                :alt="guarantor.name"
                class="result-avatar"
              />
              <div class="result-info">
                <span class="result-name">{{ guarantor.name }}</span>
                <span class="result-details">{{ guarantor.phone }}</span>
              </div>
            </div>
          </div>

          <div v-if="guarantorNoResults && guarantorSearch" class="no-results-small">
            <i class="fas fa-user-slash"></i>
            <p>Hakuna mdhamini aliyepatikana</p>
          </div>

          <div class="divider-text">
            <span>AU</span>
          </div>

          <div class="form-group">
            <label for="new_guarantor_name">Jina kamili la mdhamini mpya</label>
            <input
              type="text"
              id="new_guarantor_name"
              v-model="newGuarantor.name"
              class="form-control"
              placeholder="Mfano: John Doe"
            />
          </div>
          <div class="form-group">
            <label for="new_guarantor_phone">Namba ya simu</label>
            <input
              type="tel"
              id="new_guarantor_phone"
              v-model="newGuarantor.phone"
              class="form-control"
              placeholder="0712345678"
            />
          </div>
          <div class="form-group">
            <label for="new_guarantor_relationship">Uhusiano</label>
            <input
              type="text"
              id="new_guarantor_relationship"
              v-model="newGuarantor.relationship"
              class="form-control"
              placeholder="Mfano: Kaka, Rafiki, Mwajiri"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddGuarantor = false" class="btn-secondary">Ghairi</button>
          <button
            @click="addGuarantor"
            class="btn-primary"
            :disabled="!newGuarantor.name || !newGuarantor.phone"
          >
            Ongeza Mdhamini
          </button>
        </div>
      </div>
    </div>

    <!-- Terms and Conditions Modal -->
    <div v-if="showTerms" class="modal-overlay" @click="showTerms = false">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>Sheria na Masharti ya Mkopo</h3>
          <button class="close-btn" @click="showTerms = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body terms-body">
          <h4>1. Masharti ya Jumla</h4>
          <p>
            Mkopo huu unatolewa kwa mujibu wa sheria na kanuni za mikopo ndogo ndogo. Mkopaji
            anakubali kurejesha kiasi cha mkopo pamoja na riba iliyokubaliwa kwa muda uliopangwa.
          </p>

          <h4>2. Riba na Malipo</h4>
          <p>
            Riba ya {{ form.interest_rate || 'X' }}% kwa mwezi itahesabiwa kwa kiasi cha mkopo.
            Malipo yatafanywa kwa mujibu wa muda uliochaguliwa (kila siku, wiki, au mwezi).
          </p>

          <h4>3. Riba ya Kuchelewa</h4>
          <p>
            Endapo mkopaji atachelewa kulipa baada ya muda wa malipo na siku za mapumziko (grace
            period) kuisha, riba ya kuchelewa ya
            <strong>{{ getPenaltyRateFormatted }}</strong> itaongezwa kwa
            <strong>{{ form.penalty_period === 'month' ? 'kila mwezi' : 'kila siku' }}</strong>
            wa kuchelewa.
          </p>
          <p class="example">
            <strong>Mfano:</strong> Kama mkopo ni TZS 1,000,000 na riba ya kuchelewa ni 10%
            {{ form.penalty_period === 'month' ? 'kwa mwezi' : 'kwa siku' }}, ukichelewa
            {{ form.penalty_period === 'month' ? 'mwezi 1' : 'siku 30' }} utatozwa TZS 100,000
            zaidi.
          </p>

          <h4>4. Dhamana</h4>
          <p>
            Dhamana yoyote iliyotolewa itabaki kuwa mali ya kampuni hadi mkopo ulipwe kikamilifu.
          </p>

          <h4>5. Wadhamini</h4>
          <p>Wadhamini wanakubali kuwajibika kwa mkopo endapo mkopaji atashindwa kulipa.</p>

          <h4>6. Uvunjaji wa Masharti</h4>
          <p>
            Endapo mkopaji atavunja masharti yoyote ya makubaliano haya, kampuni ina haki ya
            kuchukua hatua za kisheria.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showTerms = false" class="btn-primary">Nimeelewa</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="showToast" class="toast-notification" :class="toastType">
        <i :class="toastIcon"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatCurrency, formatDate } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

const props = defineProps({
  isEdit: { type: Boolean, default: false },
  loanId: { type: String, default: null },
})

// State
const preselectedCustomer = computed(() => route.query.customer_id)
const selectedCustomer = ref(null)
const customerSearch = ref('')
const searchResults = ref([])
const customersLoading = ref(false)
const noResults = ref(false)
const saving = ref(false)
const errors = ref({})
const showAddCollateral = ref(false)
const showAddGuarantor = ref(false)
const showTerms = ref(false)
const showPaymentSchedule = ref(false)
const guarantorSearch = ref('')
const guarantorResults = ref([])
const guarantorLoading = ref(false)
const guarantorNoResults = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
let toastTimeout = null

// Form data
const form = reactive({
  customer_id: null,
  amount: '',
  interest_rate: null,
  penalty_rate: null,
  penalty_period: 'month', // 'month' or 'day'
  grace_period: 0,
  duration_value: 1,
  duration_unit: 'months',
  payment_frequency: '',
  payment_days: null,
  start_date: '',
  purpose: '',
  collaterals: [],
  guarantors: [],
  terms_accepted: false,
  notes: '',
})

// New collateral
const newCollateral = reactive({
  name: '',
  type: 'land',
  value: '',
  description: '',
})

// New guarantor
const newGuarantor = reactive({
  name: '',
  phone: '',
  relationship: '',
})

// Get total days from duration
const getTotalDays = () => {
  const value = form.duration_value || 0
  switch (form.duration_unit) {
    case 'days':
      return value
    case 'weeks':
      return value * 7
    case 'months':
      return value * 30
    case 'years':
      return value * 365
    default:
      return value
  }
}

// Get total months from duration
const getTotalMonths = () => {
  return getTotalDays() / 30
}

// Format duration for display
const formatDuration = () => {
  const value = form.duration_value
  const unit = form.duration_unit
  const unitText = {
    days: value === 1 ? 'Siku' : 'Siku',
    weeks: value === 1 ? 'Wiki' : 'Wiki',
    months: value === 1 ? 'Mwezi' : 'Miezi',
    years: value === 1 ? 'Mwaka' : 'Miaka',
  }
  return `${value} ${unitText[unit]} (${getTotalDays()} siku)`
}

// Set duration preset
const setDurationPreset = (days, unit) => {
  if (unit === 'days') {
    form.duration_value = days
    form.duration_unit = 'days'
  } else {
    form.duration_value = days / 30
    form.duration_unit = 'months'
  }
  calculateLoan()
}

// Get formatted penalty rate
const getPenaltyRateFormatted = computed(() => {
  const rate =
    form.penalty_rate !== null && form.penalty_rate !== ''
      ? form.penalty_rate
      : form.interest_rate || 10
  const period = form.penalty_period === 'month' ? 'kwa mwezi' : 'kwa siku'
  return `${rate}% ${period}`
})

const getPenaltyRateValue = computed(() => {
  return form.penalty_rate !== null && form.penalty_rate !== ''
    ? form.penalty_rate
    : form.interest_rate || 10
})

// Calculate interest based on duration
const calculateInterest = (amount, monthlyRate, totalMonths) => {
  return amount * (monthlyRate / 100) * totalMonths
}

// Get number of installments
const getInstallmentsCount = (totalDays, frequency) => {
  switch (frequency) {
    case 'monthly':
      return Math.ceil(totalDays / 30)
    case 'weekly':
      return Math.ceil(totalDays / 7)
    case 'daily':
      return totalDays
    case 'one_time':
      return 1
    default:
      return 1
  }
}

// Loan calculation
const loanCalculated = computed(() => {
  return (
    form.amount &&
    form.interest_rate &&
    form.duration_value &&
    form.start_date &&
    form.payment_frequency
  )
})

const loanSummary = computed(() => {
  if (!loanCalculated.value) return {}

  const amount = parseFloat(form.amount) || 0
  const monthlyRate = parseFloat(form.interest_rate) || 0
  const totalDays = getTotalDays()
  const totalMonths = totalDays / 30

  let interest = calculateInterest(amount, monthlyRate, totalMonths)
  let totalAmount = amount + interest
  let endDate = new Date(form.start_date)
  endDate.setDate(endDate.getDate() + totalDays)

  let installments = getInstallmentsCount(totalDays, form.payment_frequency)
  let installmentAmount = installments > 0 ? totalAmount / installments : totalAmount

  return {
    interest: Math.round(interest),
    total_amount: Math.round(totalAmount),
    installments: Math.ceil(installments),
    installment_amount: Math.round(installmentAmount),
    end_date: endDate.toISOString().split('T')[0],
    total_days: totalDays,
    total_months: totalMonths,
  }
})

// Generate payment schedule
const paymentSchedule = ref([])

const generatePaymentSchedule = () => {
  if (!loanCalculated.value) return

  const summary = loanSummary.value
  if (!summary.installments) return

  paymentSchedule.value = []
  const amount = parseFloat(form.amount) || 0
  const monthlyRate = parseFloat(form.interest_rate) || 0
  const totalDays = getTotalDays()
  const totalMonths = totalDays / 30

  const totalInterest = calculateInterest(amount, monthlyRate, totalMonths)
  const totalAmount = amount + totalInterest

  let currentDate = new Date(form.start_date)
  let remainingBalance = totalAmount
  let remainingPrincipal = amount

  for (let i = 1; i <= summary.installments; i++) {
    let paymentDate = new Date(currentDate)
    let paymentAmount = summary.installment_amount

    if (i === summary.installments) {
      paymentAmount = remainingBalance
    }

    let interestPortion = 0
    let principalPortion = 0

    switch (form.payment_frequency) {
      case 'monthly':
        paymentDate.setMonth(currentDate.getMonth() + i)
        interestPortion = remainingBalance * (monthlyRate / 100)
        principalPortion = paymentAmount - interestPortion
        break

      case 'weekly':
        paymentDate.setDate(currentDate.getDate() + i * 7)
        const weeklyRate = monthlyRate / 4
        interestPortion = remainingBalance * (weeklyRate / 100)
        principalPortion = paymentAmount - interestPortion
        break

      case 'daily':
        paymentDate.setDate(currentDate.getDate() + i)
        const dailyRate = monthlyRate / 30
        interestPortion = remainingBalance * (dailyRate / 100)
        principalPortion = paymentAmount - interestPortion
        break

      case 'one_time':
        paymentDate = new Date(form.start_date)
        paymentDate.setDate(paymentDate.getDate() + totalDays)
        interestPortion = remainingBalance - remainingPrincipal
        principalPortion = remainingPrincipal
        paymentAmount = remainingBalance
        break
    }

    remainingBalance -= principalPortion
    remainingPrincipal -= principalPortion

    paymentSchedule.value.push({
      number: i,
      due_date: paymentDate.toISOString().split('T')[0],
      amount: Math.round(paymentAmount),
      principal: Math.round(principalPortion),
      interest: Math.round(interestPortion),
      remaining_balance: Math.max(0, Math.round(remainingBalance)),
    })
  }
}

const getFrequencyText = computed(() => {
  const texts = {
    monthly: 'Mwezi',
    weekly: 'Wiki',
    daily: 'Siku',
    one_time: 'Mara Moja',
  }
  return texts[form.payment_frequency] || 'Mwezi'
})

const today = computed(() => new Date().toISOString().split('T')[0])

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Watch for changes to recalculate
watch(
  [
    () => form.payment_frequency,
    () => form.duration_value,
    () => form.duration_unit,
    () => form.amount,
    () => form.interest_rate,
    () => form.start_date,
  ],
  () => {
    if (loanCalculated.value) {
      generatePaymentSchedule()
    }
  },
  { deep: true },
)

// Methods
const clearCustomerSearch = () => {
  customerSearch.value = ''
  searchResults.value = []
  noResults.value = false
}

const searchCustomers = debounce(async () => {
  if (!customerSearch.value || customerSearch.value.length < 2) {
    searchResults.value = []
    noResults.value = false
    return
  }

  customersLoading.value = true

  try {
    const response = await axios.get(`${API_URL}/customers`, {
      params: { search: customerSearch.value, per_page: 10 },
    })

    let customers = response.data.data?.data || response.data.data || []

    searchResults.value = customers.map((c) => ({
      id: c.id,
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      phone: c.phone || '',
      occupation: c.occupation || '',
      monthly_income: parseFloat(c.monthly_income) || 0,
      profile_photo: c.profile_photo_url || '/default-avatar.png',
    }))

    noResults.value = searchResults.value.length === 0
  } catch (error) {
    console.error('Error searching customers:', error)
    showToastMessage('Hitilafu katika kutafuta wateja', 'error')
    searchResults.value = []
    noResults.value = true
  } finally {
    customersLoading.value = false
  }
}, 500)

const selectCustomer = (customer) => {
  selectedCustomer.value = customer
  form.customer_id = customer.id
  customerSearch.value = ''
  searchResults.value = []
}

const changeCustomer = () => {
  selectedCustomer.value = null
  form.customer_id = null
}

const calculateLoan = () => {
  generatePaymentSchedule()
}

const calculatePenaltyExample = () => {
  const amount = parseFloat(form.amount) || 0
  const penaltyRate = getPenaltyRateValue.value
  return Math.round(amount * (penaltyRate / 100))
}

const generatePaymentDays = () => {
  const startDate = new Date(form.start_date)
  const day = startDate.getDate()

  switch (form.payment_frequency) {
    case 'monthly':
      form.payment_days = JSON.stringify({ days: [day] })
      break
    case 'weekly':
      const weekday = startDate.getDay()
      form.payment_days = JSON.stringify({ days: [weekday] })
      break
    case 'daily':
      form.payment_days = JSON.stringify({ days: [1, 2, 3, 4, 5, 6, 7] })
      break
    case 'one_time':
      form.payment_days = JSON.stringify({ days: [day] })
      break
  }
}

const getCollateralIcon = (type) => {
  const icons = {
    land: 'fas fa-tree',
    vehicle: 'fas fa-car',
    equipment: 'fas fa-tools',
    title_deed: 'fas fa-file-alt',
    other: 'fas fa-box',
  }
  return icons[type] || 'fas fa-gem'
}

// Collateral methods
const addCollateral = () => {
  if (!newCollateral.name || !newCollateral.value) {
    showToastMessage('Tafadhali jaza jina na thamani ya dhamana', 'error')
    return
  }

  form.collaterals.push({
    name: newCollateral.name,
    type: newCollateral.type,
    value: parseFloat(newCollateral.value),
    description: newCollateral.description,
  })

  newCollateral.name = ''
  newCollateral.type = 'land'
  newCollateral.value = ''
  newCollateral.description = ''

  showAddCollateral.value = false
  showToastMessage('Dhamana imeongezwa', 'success')
}

const removeCollateral = (index) => {
  form.collaterals.splice(index, 1)
  showToastMessage('Dhamana imeondolewa', 'info')
}

// Guarantor methods
const searchGuarantors = debounce(async () => {
  if (!guarantorSearch.value || guarantorSearch.value.length < 2) {
    guarantorResults.value = []
    guarantorNoResults.value = false
    return
  }

  guarantorLoading.value = true

  try {
    const response = await axios.get(`${API_URL}/customers`, {
      params: { search: guarantorSearch.value, per_page: 10 },
    })

    const customers = response.data.data?.data || response.data.data || []

    guarantorResults.value = customers.map((c) => ({
      id: c.id,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      phone: c.phone || '',
      relationship: '',
      photo: c.profile_photo_url || c.avatar,
    }))

    guarantorNoResults.value = customers.length === 0 && guarantorSearch.value.length >= 2
  } catch (error) {
    console.error('Error searching guarantors:', error)
    guarantorResults.value = []
  } finally {
    guarantorLoading.value = false
  }
}, 500)

const selectGuarantor = (guarantor) => {
  form.guarantors.push({
    id: guarantor.id,
    name: guarantor.name,
    phone: guarantor.phone,
    relationship: guarantor.relationship || 'Rafiki',
    photo: guarantor.photo,
  })

  guarantorSearch.value = ''
  guarantorResults.value = []
  showAddGuarantor.value = false
  showToastMessage('Mdhamini ameongezwa', 'success')
}

const addGuarantor = () => {
  if (!newGuarantor.name || !newGuarantor.phone) {
    showToastMessage('Tafadhali jaza jina na namba ya simu ya mdhamini', 'error')
    return
  }

  form.guarantors.push({
    id: Date.now(),
    name: newGuarantor.name,
    phone: newGuarantor.phone,
    relationship: newGuarantor.relationship || 'Rafiki',
    photo: null,
  })

  newGuarantor.name = ''
  newGuarantor.phone = ''
  newGuarantor.relationship = ''

  showAddGuarantor.value = false
  showToastMessage('Mdhamini ameongezwa', 'success')
}

const removeGuarantor = (index) => {
  form.guarantors.splice(index, 1)
  showToastMessage('Mdhamini ameondolewa', 'info')
}

// Load loan data for editing
const loadLoanData = async () => {
  if (props.isEdit && props.loanId) {
    try {
      const response = await axios.get(`${API_URL}/loans/${props.loanId}`)

      if (response.data.success) {
        const loan = response.data.data

        form.customer_id = loan.customer_id
        form.amount = loan.amount
        form.interest_rate = loan.interest_rate
        form.penalty_rate = loan.penalty_rate
        form.penalty_period = loan.penalty_period || 'month'
        form.grace_period = loan.grace_period || 0
        form.duration_value = loan.duration_value || 1
        form.duration_unit = loan.duration_unit || 'months'
        form.payment_frequency = loan.payment_frequency || 'monthly'
        form.payment_days = loan.payment_days
        form.start_date = loan.start_date?.split('T')[0] || ''
        form.purpose = loan.purpose || ''
        form.notes = loan.notes || ''

        if (loan.customer) {
          selectedCustomer.value = {
            id: loan.customer.id,
            first_name: loan.customer.first_name,
            last_name: loan.customer.last_name,
            phone: loan.customer.phone,
            occupation: loan.customer.occupation,
            monthly_income: parseFloat(loan.customer.monthly_income),
            profile_photo: loan.customer.profile_photo_url,
          }
        }

        if (loan.collateral) {
          form.collaterals.push({
            id: loan.collateral.id,
            name: loan.collateral.description || 'Dhamana',
            type: loan.collateral.type || 'other',
            value: loan.collateral.estimated_value,
            description: loan.collateral.description,
          })
        }

        await nextTick()
        generatePaymentSchedule()
      }
    } catch (error) {
      console.error('Error loading loan:', error)
      showToastMessage('Hitilafu katika kupakia taarifa za mkopo', 'error')
    }
  }
}

// Form submission
const submitForm = async () => {
  saving.value = true
  errors.value = {}

  // Validation
  if (!selectedCustomer.value && !form.customer_id) {
    errors.value.customer = ['Tafadhali chagua mteja']
  }
  if (!form.amount || form.amount < 10000) {
    errors.value.amount = ['Kiasi cha mkopo kinatakiwa kuwa angalau TZS 10,000']
  }
  if (form.amount > 50000000) {
    errors.value.amount = ['Kiasi cha mkopo hakiwezi kuzidi TZS 50,000,000']
  }
  if (!form.interest_rate) {
    errors.value.interest_rate = ['Riba inahitajika']
  }
  if (!form.duration_value || form.duration_value < 1) {
    errors.value.duration_value = ['Muda wa mkopo unahitajika']
  }
  if (!form.payment_frequency) {
    errors.value.payment_frequency = ['Muda wa malipo unahitajika']
  }
  if (!form.start_date) {
    errors.value.start_date = ['Tarehe ya kuanza inahitajika']
  }
  if (!form.terms_accepted) {
    errors.value.terms_accepted = ['Lazima ukubali sheria na masharti']
  }

  if (Object.keys(errors.value).length > 0) {
    saving.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  if (!form.payment_days) {
    generatePaymentDays()
  }

  const loanData = {
    customer_id: form.customer_id,
    amount: parseFloat(form.amount),
    interest_rate: parseFloat(form.interest_rate),
    penalty_rate: getPenaltyRateValue.value,
    penalty_period: form.penalty_period,
    grace_period: parseInt(form.grace_period) || 0,
    duration_value: parseInt(form.duration_value),
    duration_unit: form.duration_unit,
    total_days: getTotalDays(),
    payment_frequency: form.payment_frequency,
    payment_days: form.payment_days,
    start_date: form.start_date,
    purpose: form.purpose || null,
    notes: form.notes || null,
  }

  try {
    let response

    if (props.isEdit && props.loanId) {
      response = await axios.put(`${API_URL}/loans/${props.loanId}`, loanData)
    } else {
      response = await axios.post(`${API_URL}/loans`, loanData)
    }

    if (response.data.success) {
      const loanId = response.data.data.id

      if (form.collaterals.length > 0) {
        await saveCollaterals(loanId)
      }

      if (form.guarantors.length > 0) {
        await saveGuarantors(loanId)
      }

      showToastMessage(
        props.isEdit
          ? 'Mkopo umehaririwa kwa mafanikio!'
          : 'Ombi la mkopo limetumwa kwa mafanikio!',
        'success',
      )

      setTimeout(() => {
        router.push('/loans')
      }, 1500)
    }
  } catch (error) {
    console.error('Error submitting loan:', error)

    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      showToastMessage('Tafadhali sahihisha makosa kwenye fomu', 'error')
    } else {
      showToastMessage(
        error.response?.data?.message || 'Hitilafu imetokea. Tafadhali jaribu tena.',
        'error',
      )
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    saving.value = false
  }
}

const saveCollaterals = async (loanId) => {
  for (const collateral of form.collaterals) {
    try {
      const collateralData = {
        loan_id: loanId,
        customer_id: form.customer_id,
        type: collateral.type || 'other',
        name: collateral.name || 'Collateral',
        description: collateral.description || collateral.name || '',
        estimated_value: parseFloat(collateral.value) || 0,
        status: 'pending',
        document_path: 'hamna',
        image_path: 'none',
      }

      await axios.post(`${API_URL}/collaterals`, collateralData)
    } catch (error) {
      console.error('Error saving collateral:', error)
      showToastMessage('Hitilafu katika kuhifadhi dhamana', 'error')
    }
  }
}

const saveGuarantors = async (loanId) => {
  if (form.guarantors.length === 0) return

  const savePromises = form.guarantors.map(async (guarantor) => {
    const guarantorData = {
      loan_id: loanId,
      customer_id: form.customer_id,
      name: guarantor.name || '',
      phone: guarantor.phone || '',
      relationship: guarantor.relationship || 'Rafiki',
      id_number: guarantor.id_number || null,
      id_type: guarantor.id_type || null,
      occupation: guarantor.occupation || null,
      address: guarantor.address || null,
    }

    return axios.post(`${API_URL}/guarantors`, guarantorData)
  })

  try {
    await Promise.all(savePromises)
  } catch (error) {
    console.error('Error saving guarantors:', error)
    showToastMessage('Hitilafu katika kuhifadhi wadhamini', 'error')
  }
}

// Toast
const showToastMessage = (message, type = 'success') => {
  if (toastTimeout) clearTimeout(toastTimeout)

  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  toastTimeout = setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Load preselected customer or edit data
onMounted(async () => {
  if (preselectedCustomer.value) {
    try {
      const response = await axios.get(`${API_URL}/customers/${preselectedCustomer.value}`)

      if (response.data.success) {
        const customer = response.data.data
        selectedCustomer.value = {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          occupation: customer.occupation,
          monthly_income: parseFloat(customer.monthly_income),
          profile_photo: customer.profile_photo_url,
        }
        form.customer_id = customer.id
      }
    } catch (error) {
      console.error('Error loading customer:', error)
    }
  }

  if (props.isEdit && props.loanId) {
    await loadLoanData()
  }
})
</script>

<style scoped>
/* All existing styles remain exactly the same */
.loan-form-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  font-size: 2rem;
  color: #1a2639;
  margin: 0 0 10px;
  font-weight: 600;
}

.header-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

/* Duration Input Group */
.duration-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.duration-value {
  flex: 1;
  width: auto !important;
}

.duration-unit {
  width: 120px !important;
}

/* Penalty Input Group */
.penalty-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.penalty-value {
  flex: 1;
  width: auto !important;
}

.penalty-period {
  width: 130px !important;
}

/* Duration Presets */
.duration-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.preset-btn {
  padding: 6px 12px;
  background: #f0f7ff;
  border: 1px solid #c5d9ed;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #1976d2;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

/* Customer Selector */
.customer-selector {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.selector-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.selector-header i {
  font-size: 1.5rem;
  color: #3498db;
}

.selector-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
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
  border: 2px solid #d6e2ee;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s;
  background: #f8fafc;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Search Results */
.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eef2f6;
  border-radius: 8px;
}

.customer-result {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.3s;
  border-bottom: 1px solid #eef2f6;
}

.customer-result:last-child {
  border-bottom: none;
}

.customer-result:hover {
  background: #f8fafc;
}

.result-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.result-details {
  font-size: 0.85rem;
  color: #666;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-results i {
  font-size: 3rem;
  color: #cbd5e0;
  margin-bottom: 15px;
}

.no-results p {
  margin-bottom: 20px;
}

.no-results-small {
  text-align: center;
  padding: 20px;
  color: #999;
}

.no-results-small i {
  font-size: 2rem;
  color: #cbd5e0;
  margin-bottom: 10px;
}

/* Selected Customer */
.selected-customer {
  margin-bottom: 25px;
}

.customer-card {
  background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: white;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.customer-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
}

.customer-details {
  flex: 1;
}

.customer-details h3 {
  margin: 0 0 8px;
  font-size: 1.3rem;
}

.customer-details p {
  margin: 3px 0;
  font-size: 0.95rem;
  opacity: 0.9;
}

.customer-details i {
  width: 20px;
  margin-right: 5px;
}

.btn-change {
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-change:hover {
  background: rgba(255, 255, 255, 0.3);
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

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 5px;
}

.form-group.full-width {
  grid-column: span 2;
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
  font-size: 0.9rem;
}

.form-group label i {
  color: #3498db;
  width: 18px;
}

.form-control {
  width: 80%;
  padding: 12px 15px;
  border: 2px solid #d3e2f1;
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

.input-hint {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 4px;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
}

/* Calculation Summary */
.calculation-summary {
  background: linear-gradient(135deg, #f8fafc, #eef2f6);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  border: 1px solid #e2e8f0;
}

.calculation-summary h3 {
  margin: 0 0 15px;
  color: #333;
  font-size: 1.1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.summary-item.total {
  grid-column: span 2;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
}

.summary-item.total .summary-label,
.summary-item.total .summary-value {
  color: white;
  font-weight: 600;
}

.summary-label {
  color: #666;
  font-size: 0.9rem;
}

.summary-value {
  color: #333;
  font-weight: 600;
  font-size: 1rem;
}

/* Section Cards */
.section-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.section-header i {
  font-size: 1.2rem;
  color: #3498db;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  flex: 1;
}

.btn-add {
  padding: 6px 12px;
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

/* Collaterals List */
.collaterals-list,
.guarantors-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collateral-item,
.guarantor-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.collateral-icon {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.guarantor-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.collateral-details,
.guarantor-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collateral-name,
.guarantor-name {
  font-weight: 600;
  color: #333;
}

.collateral-type,
.guarantor-relation {
  font-size: 0.8rem;
  color: #3498db;
}

.collateral-value,
.guarantor-phone {
  font-size: 0.85rem;
  color: #27ae60;
  font-weight: 500;
}

.btn-remove {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-remove:hover {
  color: #e74c3c;
  background: #fee;
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
  margin: 0 0 5px;
}

.empty-state-small .hint {
  font-size: 0.8rem;
  color: #999;
  font-style: italic;
}

/* Terms Section */
.terms-section {
  margin: 25px 0;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  padding-left: 30px;
  user-select: none;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  left: 0;
  top: 0;
  height: 20px;
  width: 20px;
  background: white;
  border: 2px solid #eef2f6;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-label:hover input ~ .checkmark {
  background: #f8fafc;
  border-color: #3498db;
}

.checkbox-label input:checked ~ .checkmark {
  background: #3498db;
  border-color: #3498db;
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.checkbox-label input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-label .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.terms-text {
  font-size: 0.95rem;
  color: #333;
}

.terms-text a {
  color: #3498db;
  text-decoration: none;
}

.terms-text a:hover {
  text-decoration: underline;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
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

.modal-content.large-modal {
  max-width: 800px;
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
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
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

.terms-body {
  max-height: 400px;
  overflow-y: auto;
}

.terms-body h4 {
  color: #333;
  margin: 20px 0 10px;
}

.terms-body h4:first-child {
  margin-top: 0;
}

.terms-body p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mb-3 {
  margin-bottom: 15px;
}

/* Divider */
.divider-text {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.divider-text::before,
.divider-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #eef2f6;
}

.divider-text::before {
  left: 0;
}

.divider-text::after {
  right: 0;
}

.divider-text span {
  background: white;
  padding: 0 15px;
  color: #999;
  font-size: 0.9rem;
}

/* Payment Schedule */
.payment-preview {
  margin-top: 20px;
}

.btn-toggle-schedule {
  width: 100%;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-toggle-schedule:hover {
  background: #eef2f6;
  color: #333;
}

.payment-schedule-table {
  margin-top: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.table-responsive {
  overflow-x: auto;
}

.payment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.payment-table th,
.payment-table td {
  padding: 10px;
  text-align: right;
  border-bottom: 1px solid #eef2f6;
}

.payment-table th:first-child,
.payment-table td:first-child {
  text-align: center;
}

.payment-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #666;
}

.more-payments td {
  text-align: center;
  color: #999;
  font-style: italic;
  background: #f8fafc;
}

.text-center {
  text-align: center;
}

/* Penalty Info */
.penalty-info {
  margin-top: 20px;
  padding: 15px;
  background: #fff3e0;
  border-radius: 8px;
  border-left: 4px solid #f39c12;
}

.penalty-info h4 {
  color: #e67e22;
  margin: 0 0 10px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.penalty-info p {
  margin: 0 0 10px;
  color: #666;
  line-height: 1.5;
}

.penalty-info i {
  color: #f39c12;
}

.penalty-example {
  background: white;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #333;
}

.example-calculation {
  display: block;
  margin-top: 5px;
  color: #27ae60;
  font-weight: 500;
}

.terms-body .example {
  background: #f0f9ff;
  padding: 10px;
  border-radius: 6px;
  margin-top: 5px;
  font-size: 0.9rem;
  border-left: 3px solid #3498db;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #eef2f6;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  z-index: 2;
}

.clear-search:hover {
  color: #e74c3c;
}

.search-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  color: #666;
  font-size: 0.9rem;
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

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .loan-form-container {
    padding: 15px;
  }

  .form-header h2 {
    font-size: 1.5rem;
  }

  .customer-card {
    flex-direction: column;
    text-align: center;
  }

  .btn-change {
    width: 100%;
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: span 1;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-item.total {
    grid-column: span 1;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .modal-content {
    width: 95%;
  }

  .modal-footer {
    flex-direction: column;
  }

  .toast-notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }

  .duration-input-group,
  .penalty-input-group {
    flex-direction: column;
  }

  .duration-unit,
  .penalty-period {
    width: 100% !important;
  }

  .duration-presets {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .customer-result {
    flex-direction: column;
    text-align: center;
  }

  .collateral-item,
  .guarantor-item {
    flex-direction: column;
    text-align: center;
  }

  .btn-remove {
    margin-top: 10px;
  }

  .payment-table {
    font-size: 0.75rem;
  }

  .payment-table th,
  .payment-table td {
    padding: 8px 5px;
  }
}

/* Divider with "OR" text */
.divider-text {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.divider-text::before,
.divider-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #eef2f6;
}

.divider-text::before {
  left: 0;
}

.divider-text::after {
  right: 0;
}

.divider-text span {
  background: white;
  padding: 0 15px;
  color: #999;
  font-size: 0.9rem;
}

/* Payment schedule table */
.payment-preview {
  margin-top: 20px;
}

.btn-toggle-schedule {
  width: 100%;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-toggle-schedule:hover {
  background: #eef2f6;
  color: #333;
}

.payment-schedule-table {
  margin-top: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.table-responsive {
  overflow-x: auto;
}

.payment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.payment-table th,
.payment-table td {
  padding: 10px;
  text-align: right;
  border-bottom: 1px solid #eef2f6;
}

.payment-table th:first-child,
.payment-table td:first-child {
  text-align: center;
}

.payment-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #666;
}

.more-payments td {
  text-align: center;
  color: #999;
  font-style: italic;
  background: #f8fafc;
}

.text-center {
  text-align: center;
}

/* Toast transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Form group spacing improvements */
.form-group {
  margin-bottom: 20px;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .payment-table {
    font-size: 0.75rem;
  }

  .payment-table th,
  .payment-table td {
    padding: 8px 5px;
  }
}

.loan-form-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  font-size: 2rem;
  color: #1a2639;
  margin: 0 0 10px;
  font-weight: 600;
}

.header-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

/* Customer Selector */
.customer-selector {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.selector-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.selector-header i {
  font-size: 1.5rem;
  color: #3498db;
}

.selector-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
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
  border: 2px solid #d6e2ee;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s;
  background: #f8fafc;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Search Results */
.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eef2f6;
  border-radius: 8px;
}

.customer-result {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.3s;
  border-bottom: 1px solid #eef2f6;
}

.customer-result:last-child {
  border-bottom: none;
}

.customer-result:hover {
  background: #f8fafc;
}

.result-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.result-details {
  font-size: 0.85rem;
  color: #666;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-results i {
  font-size: 3rem;
  color: #cbd5e0;
  margin-bottom: 15px;
}

.no-results p {
  margin-bottom: 20px;
}

.no-results-small {
  text-align: center;
  padding: 20px;
  color: #999;
}

.no-results-small i {
  font-size: 2rem;
  color: #cbd5e0;
  margin-bottom: 10px;
}

/* Selected Customer */
.selected-customer {
  margin-bottom: 25px;
}

.customer-card {
  background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: white;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.customer-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
}

.customer-details {
  flex: 1;
}

.customer-details h3 {
  margin: 0 0 8px;
  font-size: 1.3rem;
}

.customer-details p {
  margin: 3px 0;
  font-size: 0.95rem;
  opacity: 0.9;
}

.customer-details i {
  width: 20px;
  margin-right: 5px;
}

.btn-change {
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-change:hover {
  background: rgba(255, 255, 255, 0.3);
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

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 5px;
}

.form-group.full-width {
  grid-column: span 2;
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
  font-size: 0.9rem;
}

.form-group label i {
  color: #3498db;
  width: 18px;
}

.form-control {
  width: 80%;
  padding: 12px 15px;
  border: 2px solid #d3e2f1;
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

.input-hint {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 4px;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
}

/* Calculation Summary */
.calculation-summary {
  background: linear-gradient(135deg, #f8fafc, #eef2f6);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  border: 1px solid #e2e8f0;
}

.calculation-summary h3 {
  margin: 0 0 15px;
  color: #333;
  font-size: 1.1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.summary-item.total {
  grid-column: span 2;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
}

.summary-item.total .summary-label,
.summary-item.total .summary-value {
  color: white;
  font-weight: 600;
}

.summary-label {
  color: #666;
  font-size: 0.9rem;
}

.summary-value {
  color: #333;
  font-weight: 600;
  font-size: 1rem;
}

/* Section Cards */
.section-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f6;
}

.section-header i {
  font-size: 1.2rem;
  color: #3498db;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  flex: 1;
}

.btn-add {
  padding: 6px 12px;
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

/* Collaterals List */
.collaterals-list,
.guarantors-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collateral-item,
.guarantor-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}

.collateral-icon {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.guarantor-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.collateral-details,
.guarantor-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collateral-name,
.guarantor-name {
  font-weight: 600;
  color: #333;
}

.collateral-type,
.guarantor-relation {
  font-size: 0.8rem;
  color: #3498db;
}

.collateral-value,
.guarantor-phone {
  font-size: 0.85rem;
  color: #27ae60;
  font-weight: 500;
}

.btn-remove {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-remove:hover {
  color: #e74c3c;
  background: #fee;
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
  margin: 0 0 5px;
}

.empty-state-small .hint {
  font-size: 0.8rem;
  color: #999;
  font-style: italic;
}

/* Terms Section */
.terms-section {
  margin: 25px 0;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  padding-left: 30px;
  user-select: none;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  left: 0;
  top: 0;
  height: 20px;
  width: 20px;
  background: white;
  border: 2px solid #eef2f6;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-label:hover input ~ .checkmark {
  background: #f8fafc;
  border-color: #3498db;
}

.checkbox-label input:checked ~ .checkmark {
  background: #3498db;
  border-color: #3498db;
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.checkbox-label input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-label .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.terms-text {
  font-size: 0.95rem;
  color: #333;
}

.terms-text a {
  color: #3498db;
  text-decoration: none;
}

.terms-text a:hover {
  text-decoration: underline;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
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

.modal-content.large-modal {
  max-width: 800px;
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
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
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

.terms-body {
  max-height: 400px;
  overflow-y: auto;
}

.terms-body h4 {
  color: #333;
  margin: 20px 0 10px;
}

.terms-body h4:first-child {
  margin-top: 0;
}

.terms-body p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mb-3 {
  margin-bottom: 15px;
}

.mt-3 {
  margin-top: 15px;
}

/* Spinner */
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
  .loan-form-container {
    padding: 15px;
  }

  .form-header h2 {
    font-size: 1.5rem;
  }

  .customer-card {
    flex-direction: column;
    text-align: center;
  }

  .btn-change {
    width: 100%;
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: span 1;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-item.total {
    grid-column: span 1;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .modal-content {
    width: 95%;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
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
  .customer-result {
    flex-direction: column;
    text-align: center;
  }

  .collateral-item,
  .guarantor-item {
    flex-direction: column;
    text-align: center;
  }

  .btn-remove {
    margin-top: 10px;
  }
}

.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  z-index: 2;
}

.clear-search:hover {
  color: #e74c3c;
}

.search-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  color: #666;
  font-size: 0.9rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #eef2f6;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.penalty-info {
  margin-top: 20px;
  padding: 15px;
  background: #fff3e0;
  border-radius: 8px;
  border-left: 4px solid #f39c12;
}

.penalty-info h4 {
  color: #e67e22;
  margin: 0 0 10px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.penalty-info p {
  margin: 0 0 10px;
  color: #666;
  line-height: 1.5;
}

.penalty-info i {
  color: #f39c12;
}

.penalty-example {
  background: white;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #333;
}

.example-calculation {
  display: block;
  margin-top: 5px;
  color: #27ae60;
  font-weight: 500;
}

.terms-body .example {
  background: #f0f9ff;
  padding: 10px;
  border-radius: 6px;
  margin-top: 5px;
  font-size: 0.9rem;
  border-left: 3px solid #3498db;
}

/* Responsive updates */
@media (max-width: 768px) {
  .penalty-example {
    font-size: 0.85rem;
  }
}
</style>
