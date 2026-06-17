<template>
  <div class="users-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Watumiaji</h1>
        <p class="users-count" v-if="!loading">
          Jumla ya watumiaji: <strong>{{ formatNumber(pagination.total) }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportUsers">
          <i class="fas fa-download"></i>
          <span>Pakua</span>
        </button>
        <button class="btn-import" @click="importUsers">
          <i class="fas fa-upload"></i>
          <span>Ingiza</span>
        </button>
        <button class="btn-primary" @click="openRegisterModal">
          <i class="fas fa-user-plus"></i>
          <span>Sajili Mtumiaji</span>
        </button>
      </div>
    </div>

    <!-- Filters Card -->
    <div class="filters-card">
      <div class="filters-grid">
        <!-- Search -->
        <div class="filter-group search-group">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              v-model="filters.search"
              @input="debouncedSearch"
              placeholder="Tafuta kwa jina, simu, au barua pepe..."
              class="form-control search-input"
            />
            <button v-if="filters.search" class="clear-search" @click="clearSearch">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Role Filter -->
        <div class="filter-group">
          <label>
            <i class="fas fa-user-tag"></i>
            Nafasi
          </label>
          <select v-model="filters.role" @change="loadUsers" class="form-control">
            <option value="">Wote</option>
            <option value="admin">Admin</option>
            <option value="manager">Meneja</option>
            <option value="officer">Afisa Mikopo</option>
            <option value="cashier">Keshia</option>
            <option value="viewer">Mtazamaji</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label>
            <i class="fas fa-circle"></i>
            Hali
          </label>
          <select v-model="filters.status" @change="loadUsers" class="form-control">
            <option value="">Wote</option>
            <option value="active">Wanaofanya kazi</option>
            <option value="inactive">Hawafanyi kazi</option>
            <option value="suspended">Wamesimamishwa</option>
          </select>
        </div>

        <!-- Sort By -->
        <div class="filter-group">
          <label>
            <i class="fas fa-sort"></i>
            Panga kwa
          </label>
          <select v-model="filters.sortBy" @change="loadUsers" class="form-control">
            <option value="created_at">Tarehe ya Kujiunga</option>
            <option value="first_name">Jina</option>
            <option value="email">Barua Pepe</option>
          </select>
        </div>

        <!-- Sort Order -->
        <div class="filter-group">
          <label>
            <i class="fas fa-sort-amount-down"></i>
            Mpango
          </label>
          <select v-model="filters.sortOrder" @change="loadUsers" class="form-control">
            <option value="desc">Kushuka (Zinazoanza)</option>
            <option value="asc">Kupanda (Zinazomaliza)</option>
          </select>
        </div>

        <!-- Items Per Page -->
        <div class="filter-group">
          <label>
            <i class="fas fa-list"></i>
            Idadi kwa Ukurasa
          </label>
          <select v-model="filters.perPage" @change="changePerPage" class="form-control">
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
          <span v-if="filters.role" class="filter-tag">
            <i class="fas fa-user-tag"></i>
            {{ getRoleText(filters.role) }}
            <i @click="clearFilter('role')" class="fas fa-times remove-filter"></i>
          </span>
          <span v-if="filters.status" class="filter-tag">
            <i class="fas fa-circle"></i>
            {{ getStatusText(filters.status) }}
            <i @click="clearFilter('status')" class="fas fa-times remove-filter"></i>
          </span>
          <button @click="clearAllFilters" class="clear-all-btn">
            <i class="fas fa-trash-alt"></i>
            Futa yote
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #3498db, #2980b9)">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ formatNumber(statistics.total) }}</span>
          <span class="stat-label">Jumla ya Watumiaji</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #27ae60, #229954)">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ formatNumber(statistics.active) }}</span>
          <span class="stat-label">Wanaofanya kazi</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f39c12, #e67e22)">
          <i class="fas fa-user-tag"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ formatNumber(statistics.admins) }}</span>
          <span class="stat-label">Watumiaji Admin</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #9b59b6, #8e44ad)">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-details">
          <span class="stat-value">{{ formatNumber(statistics.recent) }}</span>
          <span class="stat-label">Waliounga Wiki Hii</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia watumiaji...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadUsers" class="btn-retry">
        <i class="fas fa-redo"></i>
        Jaribu Tena
      </button>
    </div>

    <!-- Users Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="users-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th>Mtumiaji</th>
              <th>Mawasiliano</th>
              <th>Nafasi</th>
              <th>Hali</th>
              <th>Mwisho Kuingia</th>
              <th>Tarehe</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              :class="{ 'row-selected': selectedUsers.includes(user.id) }"
            >
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  v-model="selectedUsers"
                  :value="user.id"
                  @change="updateSelectAll"
                />
              </td>
              <td>
                <div class="user-cell">
                  <div class="user-avatar-wrapper">
                    <!-- <img
                      :src="getUserProfilePhoto(user)"
                      :alt="user.first_name"
                      class="user-avatar"
                    /> -->
                    <span class="status-indicator" :class="user.status"></span>
                  </div>
                  <div class="user-info">
                    <span class="user-name"> {{ user.first_name }} {{ user.last_name }} </span>
                    <span class="user-username">@{{ user.username || user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <span class="contact-item">
                    <i class="fas fa-envelope"></i>
                    {{ user.email }}
                  </span>
                  <span v-if="user.phone" class="contact-item">
                    <i class="fas fa-phone-alt"></i>
                    {{ user.phone }}
                  </span>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="user.role">
                  <i :class="getRoleIcon(user.role)"></i>
                  {{ getRoleText(user.role) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="user.status">
                  {{ getStatusText(user.status) }}
                </span>
              </td>
              <td>
                <div class="login-info" v-if="user.last_login_at">
                  <span class="login-date">{{ formatDate(user.last_login_at) }}</span>
                  <span class="login-time">{{ formatTime(user.last_login_at) }}</span>
                </div>
                <span v-else class="text-muted">Hajawahi kuingia</span>
              </td>
              <td>
                <div class="date-info">
                  <span class="date">{{ formatDate(user.created_at) }}</span>
                  <span class="time">{{ formatTime(user.created_at) }}</span>
                </div>
              </td>
              <td>
                <div class="action-dropdown">
                  <button class="action-menu-btn" @click.stop="toggleActionMenu(user.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeActionMenu === user.id" class="action-menu">
                    <router-link
                      :to="`/users/${user.id}`"
                      class="action-menu-item"
                      @click="closeActionMenu"
                    >
                      <i class="fas fa-eye"></i>
                      <span>Angalia</span>
                    </router-link>
                    <router-link
                      :to="`/users/${user.id}/edit`"
                      class="action-menu-item"
                      @click="closeActionMenu"
                    >
                      <i class="fas fa-edit"></i>
                      <span>Hariri</span>
                    </router-link>
                    <button @click="resetUserPassword(user)" class="action-menu-item">
                      <i class="fas fa-key"></i>
                      <span>Badili Nenosiri</span>
                    </button>
                    <button
                      @click="toggleUserStatus(user)"
                      class="action-menu-item"
                      :class="{ 'text-danger': user.status === 'active' }"
                    >
                      <i
                        :class="user.status === 'active' ? 'fas fa-ban' : 'fas fa-check-circle'"
                      ></i>
                      <span>{{ user.status === 'active' ? 'Zima' : 'Washa' }}</span>
                    </button>
                    <button @click="confirmDelete(user)" class="action-menu-item text-danger">
                      <i class="fas fa-trash-alt"></i>
                      <span>Futa</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="8" class="text-center">
                <div class="empty-state-small">
                  <i class="fas fa-users"></i>
                  <p>Hakuna watumiaji waliopatikana</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedUsers.length > 0" class="bulk-actions">
        <div class="bulk-info">
          <i class="fas fa-check-circle"></i>
          <span
            >Umechagua <strong>{{ formatNumber(selectedUsers.length) }}</strong> watumiaji</span
          >
        </div>
        <div class="bulk-buttons">
          <button class="btn-bulk" @click="bulkActivate">
            <i class="fas fa-check"></i>
            Washa
          </button>
          <button class="btn-bulk" @click="bulkDeactivate">
            <i class="fas fa-ban"></i>
            Zima
          </button>
          <button class="btn-bulk text-danger" @click="confirmBulkDelete">
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
      <div class="pagination-section" v-if="pagination.lastPage > 1">
        <div class="pagination-info">
          <i class="fas fa-info-circle"></i>
          Inaonyesha <strong>{{ formatNumber(pagination.from) }}</strong> -
          <strong>{{ formatNumber(pagination.to) }}</strong> kati ya
          <strong>{{ formatNumber(pagination.total) }}</strong> watumiaji
        </div>

        <div class="pagination-controls">
          <div class="pagination-buttons">
            <button
              @click="changePage(1)"
              :disabled="pagination.currentPage === 1"
              class="pagination-btn"
              title="Ukurasa wa Kwanza"
            >
              <i class="fas fa-angle-double-left"></i>
            </button>

            <button
              @click="changePage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="pagination-btn"
              title="Ukurasa Ulio Nyuma"
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
              {{ formatNumber(page) }}
            </button>

            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="pagination-btn"
              title="Ukurasa Unaofuata"
            >
              <i class="fas fa-chevron-right"></i>
            </button>

            <button
              @click="changePage(pagination.lastPage)"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="pagination-btn"
              title="Ukurasa wa Mwisho"
            >
              <i class="fas fa-angle-double-right"></i>
            </button>
          </div>

          <div class="page-size-selector">
            <label>Onyesha:</label>
            <select v-model="filters.perPage" @change="changePerPage" class="per-page-select">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div class="page-indicator">
          Ukurasa <strong>{{ formatNumber(pagination.currentPage) }}</strong> kati ya
          <strong>{{ formatNumber(pagination.lastPage) }}</strong>
        </div>
      </div>
    </div>

    <!-- Register User Modal -->
    <div v-if="showRegisterModal" class="modal-overlay" @click="closeRegisterModal">
      <div class="modal-content register-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-left">
            <i class="fas fa-user-plus"></i>
            <h3>Sajili Mtumiaji Mpya</h3>
          </div>
          <div class="modal-header-actions">
            <button class="close-btn" @click="closeRegisterModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <form @submit.prevent="registerUser" class="register-form">
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Jina la Kwanza <span class="required">*</span></label>
                <div class="input-group">
                  <i class="fas fa-user"></i>
                  <input
                    type="text"
                    v-model="registerForm.first_name"
                    class="form-control"
                    :class="{ 'is-invalid': errors.first_name }"
                    placeholder="Weka jina la kwanza"
                    required
                  />
                </div>
                <span v-if="errors.first_name" class="error-text">{{ errors.first_name }}</span>
              </div>

              <div class="form-group">
                <label>Jina la Mwisho <span class="required">*</span></label>
                <div class="input-group">
                  <i class="fas fa-user"></i>
                  <input
                    type="text"
                    v-model="registerForm.last_name"
                    class="form-control"
                    :class="{ 'is-invalid': errors.last_name }"
                    placeholder="Weka jina la mwisho"
                    required
                  />
                </div>
                <span v-if="errors.last_name" class="error-text">{{ errors.last_name }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Barua Pepe <span class="required">*</span></label>
                <div class="input-group">
                  <i class="fas fa-envelope"></i>
                  <input
                    type="email"
                    v-model="registerForm.email"
                    class="form-control"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="Eg. salim.amiri@tamara.co.tz"
                    required
                  />
                </div>
                <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
              </div>

              <div class="form-group">
                <label>Namba ya Simu</label>
                <div class="input-group">
                  <i class="fas fa-phone-alt"></i>
                  <input
                    type="tel"
                    v-model="registerForm.phone"
                    class="form-control"
                    placeholder="07xx xxx xxx"
                  />
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Jina la Mtumiaji</label>
                <div class="input-group">
                  <i class="fas fa-at"></i>
                  <input
                    type="text"
                    v-model="registerForm.username"
                    class="form-control"
                    placeholder="Jina la kuingia"
                  />
                </div>
                <small class="form-text">Ikiwa wazi Itatengenezwa kiotomatiki</small>
              </div>

              <div class="form-group">
                <label>Nafasi <span class="required">*</span></label>
                <div class="input-group">
                  <i class="fas fa-user-tag"></i>
                  <select v-model="registerForm.role" class="form-control" required>
                    <option value="">Chagua Nafasi</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Meneja</option>
                    <option value="officer">Afisa Mikopo</option>
                    <option value="cashier">Keshia</option>
                    <option value="viewer">Mtazamaji</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Nenosiri <span class="required">*</span></label>
                <div class="input-group">
                  <i class="fas fa-lock"></i>
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    v-model="registerForm.password"
                    class="form-control"
                    :class="{ 'is-invalid': errors.password }"
                    placeholder="Weka nenosiri"
                    required
                  />
                  <button type="button" class="password-toggle" @click="togglePasswordVisibility">
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
                <small class="form-text">Nenosiri lazima iwe na herufi 6 au zaidi</small>
              </div>

              <div class="form-group">
                <label>Rudia Nenosiri <span class="required">*</span></label>
                <div class="input-group">
                  <i class="fas fa-lock"></i>
                  <input
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="registerForm.password_confirmation"
                    class="form-control"
                    placeholder="Rudia nenosiri"
                    required
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="toggleConfirmPasswordVisibility"
                  >
                    <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Picha ya Profaili</label>
              <div class="file-upload-wrapper">
                <div class="file-upload-preview" v-if="profilePhotoPreview">
                  <img :src="profilePhotoPreview" alt="Profile preview" />
                  <button type="button" class="remove-photo" @click="removeProfilePhoto">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-else class="file-upload-placeholder" @click="triggerFileInput">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Bonyeza kupakia picha</p>
                  <small>PNG, JPG, GIF (Max 2MB)</small>
                </div>
                <input
                  type="file"
                  ref="profilePhotoInput"
                  @change="handleProfilePhoto"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  style="display: none"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeRegisterModal">
              <i class="fas fa-times"></i>
              Ghairi
            </button>
            <button type="submit" class="btn-primary" :disabled="registerLoading">
              <span v-if="registerLoading" class="spinner-small"></span>
              <span v-else>
                <i class="fas fa-save"></i>
                Sajili Mtumiaji
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Futa Mtumiaji</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kumfuta mtumiaji huyu?</p>
          <p class="warning-text" v-if="userToDelete">
            <strong>{{ userToDelete.first_name }} {{ userToDelete.last_name }}</strong>
            <br />
            <span class="text-muted">({{ userToDelete.email }})</span>
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Hatua hii haiwezi kutenguliwa. Mtumiaji atafutwa kabisa kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">
            <i class="fas fa-times"></i>
            Ghairi
          </button>
          <button @click="deleteUser" class="btn-danger" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-trash-alt"></i>
              Futa Mtumiaji
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showResetPasswordModal" class="modal-overlay" @click="closeResetPasswordModal">
      <div class="modal-content reset-password-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon info">
            <i class="fas fa-key"></i>
          </div>
          <h3>Weka Nenosiri Mpya</h3>
          <button class="close-btn" @click="closeResetPasswordModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Unaweka nenosiri mpya kwa mtumiaji:</p>
          <p class="warning-text" v-if="userToReset">
            <strong>{{ userToReset.first_name }} {{ userToReset.last_name }}</strong>
          </p>
          <div class="form-group">
            <label>Nenosiri Mpya</label>
            <input
              type="password"
              v-model="newPassword"
              class="form-control"
              placeholder="Weka nenosiri mpya"
            />
          </div>
          <div class="form-group">
            <label>Rudia Nenosiri</label>
            <input
              type="password"
              v-model="confirmPassword"
              class="form-control"
              placeholder="Rudia nenosiri mpya"
            />
          </div>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Mtumiaji atalazimika kutumia nenosiri hili kuingia kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeResetPasswordModal" class="btn-secondary">
            <i class="fas fa-times"></i>
            Ghairi
          </button>
          <button @click="resetPassword" class="btn-primary" :disabled="resetLoading">
            <span v-if="resetLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-save"></i>
              Hifadhi Nenosiri
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Delete Confirmation Modal -->
    <div v-if="showBulkDeleteModal" class="modal-overlay" @click="closeBulkDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Futa Watumiaji Wengi</h3>
          <button class="close-btn" @click="closeBulkDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Una uhakika unataka kufuta watumiaji
            <strong>{{ formatNumber(selectedUsers.length) }}</strong
            >?
          </p>
          <div class="selected-list">
            <div v-for="id in selectedUsers.slice(0, 5)" :key="id" class="selected-item">
              <i class="fas fa-user"></i>
              <span>{{ getUserName(id) }}</span>
            </div>
            <div v-if="selectedUsers.length > 5" class="more-items">
              ... na wengine {{ formatNumber(selectedUsers.length - 5) }}
            </div>
          </div>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i>
            Hatua hii haiwezi kutenguliwa. Watumiaji watafutwa kabisa kwenye mfumo.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeBulkDeleteModal" class="btn-secondary">
            <i class="fas fa-times"></i>
            Ghairi
          </button>
          <button @click="bulkDelete" class="btn-danger" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner"></span>
            <span v-else>
              <i class="fas fa-trash-alt"></i>
              Futa Wote
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters'
import debounce from 'lodash/debounce'

const router = useRouter()
const userStore = useUserStore()

// Helper functions
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return new Intl.NumberFormat('sw-TZ').format(num)
}

const defaultAvatar = ref('/default-avatar.png')

// State
const users = ref([])
const loading = ref(false)
const error = ref(null)
const selectedUsers = ref([])
const selectAll = ref(false)
const showBulkDeleteModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const activeActionMenu = ref(null)

// Delete user state
const userToDelete = ref(null)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)

// Reset password state
const userToReset = ref(null)
const showResetPasswordModal = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const resetLoading = ref(false)

// Register user state
const showRegisterModal = ref(false)
const registerLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const profilePhotoPreview = ref(null)
const profilePhotoFile = ref(null)
const profilePhotoInput = ref(null)

const registerForm = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  username: '',
  role: '',
  password: '',
  password_confirmation: '',
})

const errors = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
})

const filters = reactive({
  search: '',
  role: '',
  status: '',
  sortBy: 'created_at',
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
  total: 0,
  active: 0,
  admins: 0,
  recent: 0,
})

// Computed
const hasActiveFilters = computed(() => {
  return filters.search || filters.role || filters.status
})

const paginationPages = computed(() => {
  const pages = []
  const maxVisible = 5
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

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
})

// Methods
const loadUsers = async () => {
  loading.value = true
  error.value = null

  try {
    const params = {
      search: filters.search || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder,
      per_page: filters.perPage,
      page: filters.page,
    }

    const response = await userStore.fetchUsers(params)

    let responseData = null

    if (response && response.success && response.data) {
      responseData = response.data
    } else if (response && response.data) {
      responseData = response.data
    } else {
      responseData = response
    }

    if (responseData) {
      if (responseData.data && Array.isArray(responseData.data)) {
        users.value = responseData.data
      } else if (Array.isArray(responseData)) {
        users.value = responseData
      } else {
        users.value = []
      }

      pagination.currentPage =
        responseData.current_page || responseData.currentPage || filters.page || 1
      pagination.lastPage = responseData.last_page || responseData.lastPage || 1
      pagination.perPage = responseData.per_page || responseData.perPage || filters.perPage || 10
      pagination.total = responseData.total || 0
      pagination.from = responseData.from || 0
      pagination.to = responseData.to || 0

      if (pagination.total === 0 && users.value.length > 0) {
        pagination.total = users.value.length
        pagination.lastPage = Math.ceil(pagination.total / pagination.perPage)
        pagination.from = (pagination.currentPage - 1) * pagination.perPage + 1
        pagination.to = Math.min(pagination.currentPage * pagination.perPage, pagination.total)
      }
    } else {
      users.value = []
    }

    await loadStatistics()
  } catch (err) {
    console.error('Error loading users:', err)
    error.value =
      err.response?.data?.message || 'Imeshindwa kupakia watumiaji. Tafadhali jaribu tena.'
    showToastMessage(error.value, 'error')
  } finally {
    loading.value = false
  }
}

const changePerPage = () => {
  filters.page = 1
  loadUsers()
}

const getUserProfilePhoto = (user) => {
  if (!user) return defaultAvatar.value
  if (user.profile_photo_url) return user.profile_photo_url
  if (user.profile_photo) {
    // const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
    const baseUrl = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

    return `${baseUrl}/storage/${user.profile_photo}`
  }
  return defaultAvatar.value
}

const loadStatistics = async () => {
  try {
    const activeCount = users.value.filter((u) => u.status === 'active').length
    const adminsCount = users.value.filter((u) => u.role === 'admin').length

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const recentCount = users.value.filter((u) => new Date(u.created_at) >= weekAgo).length

    statistics.value = {
      total: pagination.total || users.value.length,
      active: activeCount,
      admins: adminsCount,
      recent: recentCount,
    }
  } catch (err) {
    console.error('Error loading statistics:', err)
  }
}

const debouncedSearch = debounce(() => {
  filters.page = 1
  loadUsers()
}, 500)

watch(
  () => filters.search,
  () => {
    debouncedSearch()
  },
)

const clearSearch = () => {
  filters.search = ''
  filters.page = 1
  loadUsers()
}

const clearFilter = (filter) => {
  filters[filter] = ''
  filters.page = 1
  loadUsers()
}

const clearAllFilters = () => {
  filters.search = ''
  filters.role = ''
  filters.status = ''
  filters.sortBy = 'created_at'
  filters.sortOrder = 'desc'
  filters.perPage = 10
  filters.page = 1
  loadUsers()
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    filters.page = page
    loadUsers()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const getRoleText = (role) => {
  const roleMap = {
    admin: 'Admin',
    manager: 'Meneja',
    officer: 'Afisa Mikopo',
    cashier: 'Keshia',
    viewer: 'Mtazamaji',
  }
  return roleMap[role] || role
}

const getRoleIcon = (role) => {
  const iconMap = {
    admin: 'fas fa-crown',
    manager: 'fas fa-chart-line',
    officer: 'fas fa-hand-holding-usd',
    cashier: 'fas fa-money-bill-wave',
    viewer: 'fas fa-eye',
  }
  return iconMap[role] || 'fas fa-user'
}

const getStatusText = (status) => {
  const statusMap = {
    active: 'Anafanya kazi',
    inactive: 'Hafanyi kazi',
    suspended: 'Amesimamishwa',
  }
  return statusMap[status] || status
}

const getUserName = (id) => {
  const user = users.value.find((u) => u.id === id)
  return user ? `${user.first_name} ${user.last_name}` : ''
}

// Action Menu methods
const toggleActionMenu = (userId) => {
  if (activeActionMenu.value === userId) {
    activeActionMenu.value = null
  } else {
    activeActionMenu.value = userId
  }
}

const closeActionMenu = () => {
  activeActionMenu.value = null
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.action-dropdown')) {
    closeActionMenu()
  }
}

// Selection methods
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedUsers.value = users.value.map((u) => u.id)
  } else {
    selectedUsers.value = []
  }
}

const updateSelectAll = () => {
  selectAll.value = selectedUsers.value.length === users.value.length
}

const clearSelection = () => {
  selectedUsers.value = []
  selectAll.value = false
}

// Register User Methods
const openRegisterModal = () => {
  showRegisterModal.value = true
  // Reset form
  registerForm.first_name = ''
  registerForm.last_name = ''
  registerForm.email = ''
  registerForm.phone = ''
  registerForm.username = ''
  registerForm.role = ''
  registerForm.password = ''
  registerForm.password_confirmation = ''
  errors.first_name = ''
  errors.last_name = ''
  errors.email = ''
  errors.password = ''
  profilePhotoPreview.value = null
  profilePhotoFile.value = null
}

const closeRegisterModal = () => {
  showRegisterModal.value = false
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const triggerFileInput = () => {
  profilePhotoInput.value.click()
}

const handleProfilePhoto = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      showToastMessage('Picha inazidi 2MB. Tafadhali chagua picha ndogo.', 'error')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      showToastMessage('Tafadhali chagua picha ya aina ya JPEG, PNG, au GIF', 'error')
      return
    }

    profilePhotoFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      profilePhotoPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeProfilePhoto = () => {
  profilePhotoPreview.value = null
  profilePhotoFile.value = null
  if (profilePhotoInput.value) {
    profilePhotoInput.value.value = ''
  }
}

const registerUser = async () => {
  // Clear previous errors
  Object.keys(errors).forEach((key) => (errors[key] = ''))

  // Validation
  let hasError = false

  if (!registerForm.first_name) {
    errors.first_name = 'Jina la kwanza linahitajika'
    hasError = true
  }

  if (!registerForm.last_name) {
    errors.last_name = 'Jina la mwisho linahitajika'
    hasError = true
  }

  if (!registerForm.email) {
    errors.email = 'Barua pepe inahitajika'
    hasError = true
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
    errors.email = 'Barua pepe si sahihi'
    hasError = true
  }

  if (!registerForm.password) {
    errors.password = 'Nenosiri linahitajika'
    hasError = true
  } else if (registerForm.password.length < 6) {
    errors.password = 'Nenosiri lazima iwe na herufi 6 au zaidi'
    hasError = true
  } else if (registerForm.password !== registerForm.password_confirmation) {
    errors.password = 'Manenosiri hayafanani'
    hasError = true
  }

  if (hasError) return

  registerLoading.value = true

  try {
    const formData = new FormData()
    formData.append('first_name', registerForm.first_name)
    formData.append('last_name', registerForm.last_name)
    formData.append('email', registerForm.email)
    if (registerForm.phone) formData.append('phone', registerForm.phone)
    if (registerForm.username) formData.append('username', registerForm.username)
    formData.append('role', registerForm.role)
    formData.append('password', registerForm.password)
    if (profilePhotoFile.value) formData.append('profile_photo', profilePhotoFile.value)

    const response = await userStore.createUser(formData)

    if (response.success) {
      showToastMessage('Mtumiaji amesajiliwa kwa mafanikio', 'success')
      closeRegisterModal()
      await loadUsers()
    } else {
      throw new Error(response.message || 'Failed to register user')
    }
  } catch (error) {
    console.error('Register error:', error)

    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors
      if (validationErrors.email) errors.email = validationErrors.email[0]
      if (validationErrors.password) errors.password = validationErrors.password[0]
      if (validationErrors.first_name) errors.first_name = validationErrors.first_name[0]
      if (validationErrors.last_name) errors.last_name = validationErrors.last_name[0]
    } else if (error.response?.data?.message) {
      showToastMessage(error.response.data.message, 'error')
    } else {
      showToastMessage('Imeshindwa kusajili mtumiaji. Tafadhali jaribu tena.', 'error')
    }
  } finally {
    registerLoading.value = false
  }
}

// Reset password
const resetUserPassword = (user) => {
  userToReset.value = user
  newPassword.value = ''
  confirmPassword.value = ''
  showResetPasswordModal.value = true
  closeActionMenu()
}

const closeResetPasswordModal = () => {
  showResetPasswordModal.value = false
  userToReset.value = null
  newPassword.value = ''
  confirmPassword.value = ''
}

const resetPassword = async () => {
  if (!newPassword.value) {
    showToastMessage('Tafadhali weka nenosiri mpya', 'error')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    showToastMessage('Nenosiri na rudia nenosiri hazifanani', 'error')
    return
  }

  if (newPassword.value.length < 6) {
    showToastMessage('Nenosiri lazima iwe na herufi 6 au zaidi', 'error')
    return
  }

  resetLoading.value = true

  try {
    await userStore.resetPassword(userToReset.value.id, newPassword.value)
    showToastMessage('Nenosiri limewekwa kwa mafanikio', 'success')
    closeResetPasswordModal()
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Imeshindwa kuweka nenosiri'
    showToastMessage(errorMessage, 'error')
  } finally {
    resetLoading.value = false
  }
}

// Toggle user status
const toggleUserStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  const action = user.status === 'active' ? 'kumzuia' : 'kumwezesha'

  if (confirm(`Una uhakika unataka ${action} mtumiaji huyu?`)) {
    try {
      await userStore.updateUserStatus(user.id, newStatus)
      user.status = newStatus
      showToastMessage(`Mtumiaji ame${action}wa kwa mafanikio`, 'success')
      await loadStatistics()
      closeActionMenu()
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Hitilafu imetokea. Tafadhali jaribu tena.'
      showToastMessage(errorMessage, 'error')
    }
  }
}

// Delete user
const confirmDelete = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
  closeActionMenu()
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  userToDelete.value = null
}

const deleteUser = async () => {
  if (!userToDelete.value) return

  deleteLoading.value = true

  try {
    const result = await userStore.deleteUser(userToDelete.value.id)

    if (result && (result.success || result.status === 'success')) {
      showToastMessage('Mtumiaji amefutwa kwa mafanikio', 'success')
      closeDeleteModal()
      await loadUsers()
      clearSelection()
    } else {
      throw new Error(result?.message || 'Failed to delete user')
    }
  } catch (error) {
    console.error('Delete error:', error)

    let errorMessage = 'Hitilafu imetokea wakati wa kufuta'

    if (error.response) {
      const responseData = error.response.data

      if (responseData.message) {
        errorMessage = responseData.message
      } else if (responseData.error) {
        errorMessage = responseData.error
      }

      if (error.response.status === 403) {
        errorMessage = 'Hauna ruhusa ya kufuta mtumiaji huyu'
      } else if (error.response.status === 404) {
        errorMessage = 'Mtumiaji hakupatikana'
      }
    } else if (error.request) {
      errorMessage =
        'Hakuna majibu kutoka kwa server. Tafadhali hakikisha una muunganiko wa intaneti.'
    } else if (error.message) {
      errorMessage = error.message
    }

    showToastMessage(errorMessage, 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Bulk actions
const bulkActivate = async () => {
  if (selectedUsers.value.length === 0) {
    showToastMessage('Tafadhali chagua watumiaji wa kuwasha', 'warning')
    return
  }

  try {
    await Promise.all(selectedUsers.value.map((id) => userStore.updateUserStatus(id, 'active')))
    showToastMessage(`Watumiaji ${selectedUsers.value.length} wamewashwa kwa mafanikio`, 'success')
    await loadUsers()
    clearSelection()
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || 'Hitilafu imetokea wakati wa kuwasha watumiaji'
    showToastMessage(errorMessage, 'error')
  }
}

const bulkDeactivate = async () => {
  if (selectedUsers.value.length === 0) {
    showToastMessage('Tafadhali chagua watumiaji wa kuzima', 'warning')
    return
  }

  try {
    await Promise.all(selectedUsers.value.map((id) => userStore.updateUserStatus(id, 'inactive')))
    showToastMessage(`Watumiaji ${selectedUsers.value.length} wamezimwa kwa mafanikio`, 'success')
    await loadUsers()
    clearSelection()
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || 'Hitilafu imetokea wakati wa kuzima watumiaji'
    showToastMessage(errorMessage, 'error')
  }
}

const confirmBulkDelete = () => {
  if (selectedUsers.value.length === 0) {
    showToastMessage('Tafadhali chagua watumiaji wa kufuta', 'warning')
    return
  }
  showBulkDeleteModal.value = true
}

const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false
}

const bulkDelete = async () => {
  if (selectedUsers.value.length === 0) return

  deleteLoading.value = true

  try {
    const results = await Promise.allSettled(
      selectedUsers.value.map((id) => userStore.deleteUser(id)),
    )

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value?.success || r.value?.status === 'success'),
    ).length
    const failed = results.length - successful

    if (successful > 0) {
      showToastMessage(
        `${successful} watumiaji wamefutwa kwa mafanikio${failed > 0 ? `, ${failed} wameshindwa` : ''}`,
        successful > 0 ? 'success' : 'error',
      )
    } else {
      showToastMessage('Imeshindwa kufuta watumiaji waliopangwa', 'error')
    }

    closeBulkDeleteModal()
    await loadUsers()
    clearSelection()
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || 'Hitilafu imetokea wakati wa kufuta watumiaji'
    showToastMessage(errorMessage, 'error')
  } finally {
    deleteLoading.value = false
  }
}

// Export/Import
const exportUsers = async () => {
  try {
    showToastMessage('Watumiaji wanapakuliwa...', 'info')
    if (userStore.exportUsers) {
      await userStore.exportUsers(filters)
      showToastMessage('Watumiaji wamepakuliwa kwa mafanikio', 'success')
    } else {
      showToastMessage('Kipengele cha kuweka nje hakipo', 'warning')
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Hitilafu wakati wa kupakua'
    showToastMessage(errorMessage, 'error')
  }
}

const importUsers = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,.xlsx,.xls'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        if (userStore.importUsers) {
          await userStore.importUsers(file)
          showToastMessage('Watumiaji wameingizwa kwa mafanikio', 'success')
          await loadUsers()
        } else {
          showToastMessage('Kipengele cha kuingiza nje hakipo', 'warning')
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Hitilafu wakati wa kuingiza'
        showToastMessage(errorMessage, 'error')
      }
    }
  }
  input.click()
}

// Toast methods
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
  loadUsers()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  debouncedSearch.cancel()
})
</script>

<style scoped>
.users-list-container {
  padding: 5px 10px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left h1 {
  font-size: 1.8rem;
  color: #1a2639;
  margin: 0 0 5px;
  font-weight: 600;
}

.users-count {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-export,
.btn-import {
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
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 2px 5px rgba(52, 152, 219, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.btn-import {
  background: white;
  color: #f39c12;
  border: 1px solid #f39c12;
}

.btn-import:hover {
  background: #f39c12;
  color: white;
}

/* Filters Card */
.filters-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  gap: 15px;
}

@media (max-width: 1200px) {
  .filters-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .search-group {
    grid-column: span 3;
  }
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
  .search-group {
    grid-column: span 1;
  }
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

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 0.9rem;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 10px 35px 10px 35px;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
  background: #f8fafc;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
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
}

.clear-search:hover {
  color: #e74c3c;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.9rem;
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

/* Active Filters */
.active-filters {
  margin-top: 15px;
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
  font-size: 0.85rem;
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a2639;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
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

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  margin: -20px;
  padding: 20px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.users-table th {
  text-align: left;
  padding: 12px 10px;
  background: #f8fafc;
  color: #1a2639;
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 2px solid #eef2f6;
}

.users-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eef2f6;
  color: #666;
  font-size: 0.85rem;
}

.checkbox-col {
  width: 40px;
  text-align: center;
}

.users-table tbody tr:hover {
  background: #f8fafc;
}

.users-table tbody tr.row-selected {
  background: #e3f2fd;
}

/* User Cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-wrapper {
  position: relative;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eef2f6;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.active {
  background: #27ae60;
}

.status-indicator.inactive {
  background: #f39c12;
}

.status-indicator.suspended {
  background: #e74c3c;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.user-username {
  font-size: 0.75rem;
  color: #999;
}

/* Contact Info */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
}

.contact-item i {
  width: 16px;
  color: #3498db;
  font-size: 0.8rem;
}

/* Role Badge */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-badge.admin {
  background: #e74c3c;
  color: white;
}

.role-badge.manager {
  background: #3498db;
  color: white;
}

.role-badge.officer {
  background: #27ae60;
  color: white;
}

.role-badge.cashier {
  background: #f39c12;
  color: white;
}

.role-badge.viewer {
  background: #95a5a6;
  color: white;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #fff3cd;
  color: #856404;
}

.status-badge.suspended {
  background: #f8d7da;
  color: #721c24;
}

/* Date & Login Info */
.date-info,
.login-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date,
.login-date {
  font-size: 0.85rem;
  color: #333;
}

.time,
.login-time {
  font-size: 0.7rem;
  color: #999;
}

.text-muted {
  color: #999;
  font-size: 0.8rem;
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
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  margin-top: 5px;
  z-index: 1000;
  overflow: hidden;
}

.action-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  color: #333;
  text-decoration: none;
  transition: background 0.3s;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  text-align: left;
}

.action-menu-item:hover {
  background: #f8fafc;
}

.action-menu-item i {
  width: 18px;
  color: #666;
}

.action-menu-item.text-danger {
  color: #e74c3c;
}

.action-menu-item.text-danger i {
  color: #e74c3c;
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
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1976d2;
}

.bulk-info i {
  font-size: 1.1rem;
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
  font-size: 0.85rem;
  transition: all 0.3s;
}

.btn-bulk:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.btn-bulk.text-danger:hover {
  background: #fee;
  color: #e74c3c;
}

/* Pagination */
.pagination-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eef2f6;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.pagination-info {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.pagination-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #eef2f6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: #666;
  font-size: 0.85rem;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #3498db;
  color: #3498db;
}

.pagination-btn.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-color: #2980b9;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size-selector label {
  font-size: 0.85rem;
  color: #666;
}

.per-page-select {
  padding: 8px 12px;
  border: 1px solid #eef2f6;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
}

.page-indicator {
  text-align: center;
  font-size: 0.8rem;
  color: #999;
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
  border-radius: 12px;
  width: 90%;
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

.register-modal {
  max-width: 650px;
}

.delete-modal,
.reset-password-modal {
  max-width: 450px;
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header-left i {
  font-size: 1.3rem;
  color: #3498db;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.modal-header-actions {
  display: flex;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
  padding: 5px;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.modal-icon.warning {
  background: #fee;
  color: #e74c3c;
}

.modal-icon.info {
  background: #e3f2fd;
  color: #3498db;
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  position: sticky;
  bottom: 0;
  background: white;
}

/* Register Form Styles */
.register-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .register-form .form-row {
    grid-template-columns: 1fr;
  }
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-group .required {
  color: #e74c3c;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group i:first-child {
  position: absolute;
  left: 12px;
  color: #999;
  font-size: 0.9rem;
}

.input-group .form-control {
  padding-left: 35px;
}

.password-toggle {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
}

.password-toggle:hover {
  color: #3498db;
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 0.7rem;
  color: #999;
}

.error-text {
  display: block;
  margin-top: 5px;
  font-size: 0.75rem;
  color: #e74c3c;
}

/* File Upload Styles */
.file-upload-wrapper {
  margin-top: 5px;
}

.file-upload-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #eef2f6;
}

.file-upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-photo:hover {
  background: rgba(231, 76, 60, 0.8);
}

.file-upload-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed #eef2f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8fafc;
}

.file-upload-placeholder:hover {
  border-color: #3498db;
  background: #e3f2fd;
}

.file-upload-placeholder i {
  font-size: 2rem;
  color: #3498db;
  margin-bottom: 5px;
}

.file-upload-placeholder p {
  font-size: 0.7rem;
  color: #666;
  margin: 5px 0;
}

.file-upload-placeholder small {
  font-size: 0.6rem;
  color: #999;
}

/* Warning Text */
.warning-text {
  font-size: 1rem;
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
  font-size: 0.85rem;
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border-radius: 8px;
}

/* Selected List */
.selected-list {
  margin: 15px 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eef2f6;
  border-radius: 8px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-bottom: 1px solid #eef2f6;
}

.selected-item:last-child {
  border-bottom: none;
}

.selected-item i {
  color: #3498db;
}

.more-items {
  padding: 10px 15px;
  color: #999;
  font-style: italic;
  font-size: 0.85rem;
}

/* Buttons */
.btn-secondary {
  padding: 10px 20px;
  background: #f8fafc;
  color: #666;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #eef2f6;
}

.btn-danger {
  padding: 10px 20px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
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

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toast Notification */
.toast-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 12px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideInRight 0.3s ease;
  z-index: 2100;
  border-left: 4px solid;
  font-size: 0.85rem;
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
  font-size: 1rem;
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

/* Empty State */
.empty-state-small {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-state-small i {
  font-size: 3rem;
  margin-bottom: 10px;
  color: #ddd;
}

.text-center {
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .users-list-container {
    padding: 10px;
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
  .btn-import {
    flex: 1;
    justify-content: center;
  }

  .stats-cards {
    grid-template-columns: 1fr;
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

  .pagination-controls {
    flex-direction: column;
  }

  .pagination-buttons {
    justify-content: center;
  }

  .toast-notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }

  .modal-content {
    width: 95%;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-danger,
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
