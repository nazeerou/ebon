<template>
  <div class="machine-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Mashine</h1>
        <p class="machine-count" v-if="!loading">
          Jumla ya mashine: <strong>{{ formatNumber(pagination.total) }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            @input="debouncedSearch"
            placeholder="Tafuta kwa Jina au Serial No"
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="btn-primary" @click="openCreateModal">
          <i class="fas fa-microchip"></i>
          <span>Sajili Mashine</span>
        </button>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Inapakia mashine...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Hitilafu imetokea</h3>
      <p>{{ error }}</p>
      <button @click="loadMachines" class="btn-retry">
        <i class="fas fa-redo"></i> Jaribu Tena
      </button>
    </div>

    <!-- Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="machines-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th>Mashine</th>
              <th>Tawi</th>
              <th>Namba ya Serial</th>
              <th>Hali</th>
              <th>Tarehe ya Ufungaji</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="machine in machines"
              :key="machine.id"
              :class="{ 'row-selected': selectedMachines.includes(machine.id) }"
            >
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  v-model="selectedMachines"
                  :value="machine.id"
                  @change="updateSelectAll"
                />
              </td>
              <td>
                <div class="machine-cell">
                  <span class="machine-name">{{ machine.machine_name }}</span>
                  <span class="machine-code">{{ machine.machine_code }}</span>
                </div>
              </td>
              <td>
                <span class="branch-name">{{ machine.branch?.branch_name || '-' }}</span>
              </td>
              <td>
                <span class="serial-number">{{ machine.serial_number || '-' }}</span>
              </td>
              <td>
                <span class="status-badge" :class="machine.status">{{
                  getStatusText(machine.status)
                }}</span>
              </td>
              <td>
                <div class="date-info">
                  <span class="date">{{ formatDate(machine.installation_date) }}</span>
                  <span class="time">Imesajiliwa: {{ formatDate(machine.created_at) }}</span>
                </div>
              </td>
              <td>
                <div class="action-dropdown" :ref="(el) => setActionRef(el, machine.id)">
                  <button class="action-menu-btn" @click.stop="toggleActionMenu(machine.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeActionMenu === machine.id" class="action-menu">
                    <button @click="viewMachine(machine)" class="action-menu-item">
                      <i class="fas fa-eye"></i> <span>Angalia</span>
                    </button>
                    <button @click="openEditModal(machine)" class="action-menu-item">
                      <i class="fas fa-edit"></i> <span>Hariri</span>
                    </button>
                    <button @click="openTransferModal(machine)" class="action-menu-item">
                      <i class="fas fa-exchange-alt"></i> <span>Hamisha</span>
                    </button>
                    <button @click="confirmDelete(machine)" class="action-menu-item text-danger">
                      <i class="fas fa-trash-alt"></i> <span>Futa</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="machines.length === 0">
              <td colspan="7" class="text-center">
                <div class="empty-state-small">
                  <i class="fas fa-microchip"></i>
                  <p>Hakuna mashine zilizopatikana</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk actions -->
      <div v-if="selectedMachines.length > 0" class="bulk-actions">
        <div class="bulk-info">
          <i class="fas fa-check-circle"></i>
          <span
            >Umechagua <strong>{{ formatNumber(selectedMachines.length) }}</strong> mashine</span
          >
        </div>
        <div class="bulk-buttons">
          <button class="btn-bulk" @click="bulkActivate"><i class="fas fa-check"></i> Washa</button>
          <button class="btn-bulk" @click="bulkDeactivate"><i class="fas fa-ban"></i> Zima</button>
          <button class="btn-bulk text-danger" @click="confirmBulkDelete">
            <i class="fas fa-trash-alt"></i> Futa
          </button>
          <button class="btn-bulk" @click="clearSelection">
            <i class="fas fa-times"></i> Ghairi
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-section" v-if="pagination.lastPage > 1">
        <div class="pagination-info">
          Inaonyesha <strong>{{ formatNumber(pagination.from) }}</strong> -
          <strong>{{ formatNumber(pagination.to) }}</strong> kati ya
          <strong>{{ formatNumber(pagination.total) }}</strong> mashine
        </div>
        <div class="pagination-controls">
          <div class="pagination-buttons">
            <button
              @click="changePage(1)"
              :disabled="pagination.currentPage === 1"
              class="pagination-btn"
            >
              <i class="fas fa-angle-double-left"></i>
            </button>
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
              {{ formatNumber(page) }}
            </button>
            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="pagination-btn"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
            <button
              @click="changePage(pagination.lastPage)"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="pagination-btn"
            >
              <i class="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
        <div class="page-indicator">
          Ukurasa <strong>{{ formatNumber(pagination.currentPage) }}</strong> kati ya
          <strong>{{ formatNumber(pagination.lastPage) }}</strong>
        </div>
      </div>
    </div>

    <!-- ============ VIEW MODAL ============ -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content view-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-title">
            <div class="modal-header-icon view-icon">
              <i class="fas fa-microchip"></i>
            </div>
            <div>
              <h3>{{ viewMachineData?.machine_name || 'Mashine' }}</h3>
              <p class="modal-subtitle">
                {{ viewMachineData?.machine_code }} • {{ viewMachineData?.serial_number }}
              </p>
            </div>
          </div>
          <button class="close-btn" @click="closeViewModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body view-body">
          <div v-if="viewLoading && !viewMachineData" class="view-loading">
            <div class="spinner"></div>
            <p>Inapakia taarifa...</p>
          </div>

          <template v-else-if="viewMachineData">
            <!-- Photos -->
            <div class="view-section">
              <div class="form-section-title">
                <i class="fas fa-camera"></i>
                <span>Picha za Mashine</span>
              </div>
              <div v-if="viewPhotos.length" class="view-photo-grid">
                <div
                  v-for="(url, i) in viewPhotos"
                  :key="i"
                  class="view-photo"
                  @click="openLightbox(url)"
                >
                  <img :src="url" :alt="`Picha ${i + 1}`" />
                  <span class="view-photo-badge">{{ i + 1 }}</span>
                </div>
              </div>
              <div v-else class="view-empty">
                <i class="fas fa-image"></i>
                <span>Hakuna picha zilizopakiwa</span>
              </div>
            </div>

            <!-- Details -->
            <div class="view-section">
              <div class="form-section-title">
                <i class="fas fa-info-circle"></i>
                <span>Taarifa za Mashine</span>
              </div>
              <div class="view-details-grid">
                <div class="view-detail">
                  <span class="detail-label">Machine Code</span>
                  <span class="detail-value mono">{{ viewMachineData.machine_code || '-' }}</span>
                </div>
                <div class="view-detail">
                  <span class="detail-label">Namba ya Serial</span>
                  <span class="detail-value mono">{{ viewMachineData.serial_number || '-' }}</span>
                </div>
                <div class="view-detail">
                  <span class="detail-label">Tawi / Mahali</span>
                  <span class="detail-value">{{ viewMachineData.branch?.branch_name || '-' }}</span>
                </div>
                <div class="view-detail">
                  <span class="detail-label">Hali</span>
                  <span class="status-badge" :class="viewMachineData.status">
                    {{ getStatusText(viewMachineData.status) }}
                  </span>
                </div>
                <div class="view-detail">
                  <span class="detail-label">Tarehe ya Ufungaji</span>
                  <span class="detail-value">{{
                    formatDate(viewMachineData.installation_date)
                  }}</span>
                </div>
                <div class="view-detail">
                  <span class="detail-label">Imesajiliwa</span>
                  <span class="detail-value">{{ formatDate(viewMachineData.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Materials -->
            <div class="view-section" v-if="viewMaterials.length">
              <div class="form-section-title">
                <i class="fas fa-tools"></i>
                <span>Material / Vifaa</span>
              </div>
              <div class="view-materials">
                <span v-for="m in viewMaterials" :key="m" class="material-tag">
                  <i :class="materialIcons[m] || 'fas fa-cube'"></i>
                  {{ m }}
                </span>
              </div>
            </div>

            <!-- Transfer history -->
            <div class="view-section">
              <div class="form-section-title">
                <i class="fas fa-exchange-alt"></i>
                <span>Historia ya Uhamisho</span>
              </div>
              <div v-if="viewTransfers.length" class="transfer-timeline">
                <div v-for="(t, i) in viewTransfers" :key="t.id || i" class="transfer-item">
                  <div class="transfer-dot"></div>
                  <div class="transfer-content">
                    <div class="transfer-route">
                      <span class="transfer-branch">
                        {{ t.from_branch_name || t.from_branch?.branch_name || '—' }}
                      </span>
                      <i class="fas fa-arrow-right"></i>
                      <span class="transfer-branch to">
                        {{ t.to_branch_name || t.to_branch?.branch_name || '—' }}
                      </span>
                    </div>
                    <div class="transfer-meta">
                      <span>
                        <i class="fas fa-calendar"></i>
                        {{ formatDate(t.transfer_date || t.created_at) }}
                      </span>
                      <span v-if="t.reason"> • {{ t.reason }}</span>
                      <span v-if="t.transferred_by_name">
                        • <i class="fas fa-user"></i> {{ t.transferred_by_name }}
                      </span>
                    </div>
                    <div v-if="t.notes" class="transfer-notes">{{ t.notes }}</div>
                    <button
                      class="transfer-delete"
                      @click.stop="confirmDeleteTransfer(t)"
                      title="Futa rekodi"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="view-empty">
                <i class="fas fa-history"></i>
                <span>Hakuna historia ya uhamisho</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxUrl" class="lightbox-overlay" @click="lightboxUrl = null">
      <button class="lightbox-close" @click.stop="lightboxUrl = null">
        <i class="fas fa-times"></i>
      </button>
      <img :src="lightboxUrl" alt="photo" class="lightbox-img" @click.stop />
    </div>

    <!-- ============ CREATE / EDIT MODAL ============ -->
    <div v-if="showMachineModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content machine-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-title">
            <div class="modal-header-icon">
              <i class="fas fa-microchip"></i>
            </div>
            <div>
              <h3>{{ isEditing ? 'Hariri Mashine' : 'Sajili Mashine Mpya' }}</h3>
              <p class="modal-subtitle">
                {{ isEditing ? 'Sasisha taarifa za mashine' : 'Weka taarifa za mashine mpya' }}
              </p>
            </div>
          </div>
          <button class="close-btn" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveMachine" class="machine-form">
            <div class="form-section">
              <div class="form-section-title">
                <i class="fas fa-info-circle"></i>
                <span>Taarifa za Msingi</span>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Machine Code <span class="required">*</span></label>
                  <input
                    type="text"
                    v-model="form.machine_code"
                    class="form-control"
                    placeholder="Eg. A001"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Jina la Mashine <span class="required">*</span></label>
                  <input
                    type="text"
                    v-model="form.machine_name"
                    class="form-control"
                    placeholder="Jina la mashine"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Namba ya Serial <span class="required">*</span></label>
                  <input
                    type="text"
                    v-model="form.serial_number"
                    class="form-control"
                    placeholder="Eg. SNXXXXX"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Mahali <span class="required">*</span></label>
                  <select v-model="form.branch_id" class="form-control" required>
                    <option value="">Chagua Mahali</option>
                    <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                      {{ branch.branch_name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Tarehe ya Ufungaji <span class="required">*</span></label>
                  <input
                    type="date"
                    v-model="form.installation_date"
                    class="form-control"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Hali</label>
                  <select v-model="form.status" class="form-control">
                    <option value="active">Inafanya kazi</option>
                    <option value="maintenance">Matengenezo</option>
                    <option value="inactive">Haifanyi kazi</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">
                <i class="fas fa-tools"></i>
                <span>Material / Vifaa</span>
                <span class="optional">(chagua au ongeza)</span>
              </div>
              <div class="material-chips">
                <button
                  type="button"
                  v-for="mat in materialOptions"
                  :key="mat"
                  class="chip"
                  :class="{ active: form.materials.includes(mat) }"
                  @click="toggleMaterial(mat)"
                >
                  <i :class="materialIcons[mat] || 'fas fa-cube'"></i>
                  <span>{{ mat }}</span>
                </button>
                <button
                  type="button"
                  v-for="mat in customMaterials"
                  :key="mat"
                  class="chip"
                  :class="{ active: form.materials.includes(mat) }"
                  @click="toggleMaterial(mat)"
                >
                  <i class="fas fa-cube"></i>
                  <span>{{ mat }}</span>
                </button>
              </div>
              <div class="custom-material">
                <input
                  type="text"
                  v-model="customMaterial"
                  class="form-control"
                  placeholder="Ongeza material nyingine..."
                  @keydown.enter.prevent="addCustomMaterial"
                />
                <button type="button" class="btn-add-material" @click="addCustomMaterial">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <div v-if="form.materials.length" class="selected-materials">
                <span class="selected-label">Iliyochaguliwa:</span>
                <span v-for="m in form.materials" :key="m" class="selected-tag">
                  {{ m }}
                  <i class="fas fa-times" @click="toggleMaterial(m)"></i>
                </span>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">
                <i class="fas fa-camera"></i>
                <span>Picha za Mashine</span>
                <span class="optional">(hadi 4)</span>
              </div>
              <div class="photo-grid">
                <div v-for="(slot, index) in 4" :key="index" class="photo-slot">
                  <input
                    type="file"
                    accept="image/*"
                    class="photo-input"
                    :ref="(el) => setPhotoInputRef(el, index)"
                    @change="onPhotoSelected($event, index)"
                  />
                  <div
                    v-if="photoPreviews[index]"
                    class="photo-preview"
                    @click="triggerPhotoInput(index)"
                  >
                    <img :src="photoPreviews[index]" alt="preview" />
                    <button type="button" class="remove-photo" @click.stop="removePhoto(index)">
                      <i class="fas fa-times"></i>
                    </button>
                    <span class="photo-badge">{{ index + 1 }}</span>
                  </div>
                  <div v-else class="photo-placeholder" @click="triggerPhotoInput(index)">
                    <i class="fas fa-camera"></i>
                    <span>Picha {{ index + 1 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Ghairi</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                <span v-if="saving"><i class="fas fa-spinner fa-spin"></i> Inahifadhi...</span>
                <span v-else><i class="fas fa-save"></i> Hifadhi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ============ TRANSFER MODAL ============ -->
    <div v-if="showTransferModal" class="modal-overlay" @click="closeTransferModal">
      <div class="modal-content machine-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-title">
            <div class="modal-header-icon transfer-icon">
              <i class="fas fa-exchange-alt"></i>
            </div>
            <div>
              <h3>Hamisha Mashine</h3>
              <p class="modal-subtitle">
                {{ transferForm.machine_name }} • kutoka
                <strong>{{ transferForm.from_branch_name || '—' }}</strong>
              </p>
            </div>
          </div>
          <button class="close-btn" @click="closeTransferModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveTransfer" class="machine-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Tawi la Sasa</label>
                <input
                  type="text"
                  class="form-control"
                  :value="transferForm.from_branch_name || '—'"
                  disabled
                />
              </div>
              <div class="form-group">
                <label>Tawi Jipya <span class="required">*</span></label>
                <select v-model="transferForm.to_branch_id" class="form-control" required>
                  <option value="">Chagua Tawi</option>
                  <option
                    v-for="branch in branches"
                    :key="branch.id"
                    :value="branch.id"
                    :disabled="Number(branch.id) === Number(transferForm.from_branch_id)"
                  >
                    {{ branch.branch_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Tarehe ya Uhamisho <span class="required">*</span></label>
                <input
                  type="date"
                  v-model="transferForm.transfer_date"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label>Sababu</label>
                <input
                  type="text"
                  v-model="transferForm.reason"
                  class="form-control"
                  placeholder="Mf. Mahitaji ya biashara"
                  maxlength="255"
                />
              </div>
            </div>
            <div class="form-group" style="margin-top: 1rem">
              <label>Maelezo ya Ziada</label>
              <textarea
                v-model="transferForm.notes"
                class="form-control"
                rows="3"
                maxlength="1000"
              ></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeTransferModal">
                Ghairi
              </button>
              <button type="submit" class="btn-primary" :disabled="transferSaving">
                <span v-if="transferSaving">
                  <i class="fas fa-spinner fa-spin"></i> Inahamisha...
                </span>
                <span v-else><i class="fas fa-exchange-alt"></i> Hamisha</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete modals -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Futa Mashine</h3>
          <button class="close-btn" @click="closeDeleteModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p>Una uhakika unataka kufuta mashine hii?</p>
          <p class="warning-text" v-if="machineToDelete">
            <strong>{{ machineToDelete.machine_name }} ({{ machineToDelete.machine_code }})</strong>
          </p>
          <p class="warning-note">
            <i class="fas fa-info-circle"></i> Hatua hii haiwezi kutenguliwa.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="deleteMachine" class="btn-danger" :disabled="deleteLoading">
            Futa Mashine
          </button>
        </div>
      </div>
    </div>

    <div v-if="showBulkDeleteModal" class="modal-overlay" @click="closeBulkDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Futa Mashine Nyingi</h3>
          <button class="close-btn" @click="closeBulkDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Una uhakika unataka kufuta mashine
            <strong>{{ formatNumber(selectedMachines.length) }}</strong
            >?
          </p>
          <div class="selected-list">
            <div v-for="id in selectedMachines.slice(0, 5)" :key="id" class="selected-item">
              <i class="fas fa-microchip"></i> <span>{{ getMachineName(id) }}</span>
            </div>
            <div v-if="selectedMachines.length > 5" class="more-items">
              ... na wengine {{ formatNumber(selectedMachines.length - 5) }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeBulkDeleteModal" class="btn-secondary">Ghairi</button>
          <button @click="bulkDelete" class="btn-danger" :disabled="deleteLoading">
            Futa Wote
          </button>
        </div>
      </div>
    </div>

    <div v-if="showToast" class="toast-notification" :class="toastType">
      <i :class="toastIcon"></i> <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMachineStore } from '@/stores/Machine'
import { formatDate, formatNumber } from '@/utils/formatters'
import debounce from 'lodash/debounce'
import axios from 'axios'

const machineStore = useMachineStore()
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
// const API_URL = import.meta.env.VITE_API_URL || 'https://ebon.bas.co.tz/api/v1'

// ---- State ----
const machines = ref([])
const branches = ref([])
const loading = ref(false)
const error = ref(null)
const selectedMachines = ref([])
const selectAll = ref(false)
const showBulkDeleteModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const activeActionMenu = ref(null)
const actionRefs = ref({})

// Delete
const machineToDelete = ref(null)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)

// View modal
const showViewModal = ref(false)
const viewMachineData = ref(null)
const viewLoading = ref(false)
const lightboxUrl = ref(null)

// Transfer modal
const showTransferModal = ref(false)
const transferSaving = ref(false)
const transferForm = reactive({
  machine_id: null,
  machine_name: '',
  from_branch_id: null,
  from_branch_name: '',
  to_branch_id: '',
  transfer_date: '',
  reason: '',
  notes: '',
})

// Machine modal
const showMachineModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const form = reactive({
  machine_code: '',
  machine_name: '',
  serial_number: '',
  branch_id: '',
  installation_date: '',
  status: 'active',
  materials: [],
})

// Materials
const materialOptions = ['Betri', 'Solar', 'Grid', 'Generator', 'Inverter', 'Mafuta']
const materialIcons = {
  Betri: 'fas fa-car-battery',
  Solar: 'fas fa-solar-panel',
  Grid: 'fas fa-bolt',
  Generator: 'fas fa-industry',
  Inverter: 'fas fa-plug',
  Mafuta: 'fas fa-gas-pump',
}
const customMaterials = ref([])
const customMaterial = ref('')

// Photos
const photoFiles = ref([null, null, null, null])
const photoPreviews = ref([null, null, null, null])
const photoInputRefs = ref([])
const existingPhotos = ref([])
const removedPhotoPaths = ref([])

// Pagination
const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  total: 0,
  from: 0,
  to: 0,
})

const searchQuery = ref('')

// ---- Computed ----
const paginationPages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(pagination.lastPage, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const toastIcon = computed(() =>
  toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle',
)

const viewPhotos = computed(() => {
  const m = viewMachineData.value
  if (!m) return []
  if (Array.isArray(m.photo_urls) && m.photo_urls.length) return m.photo_urls.filter(Boolean)
  if (Array.isArray(m.photos) && m.photos.length) {
    return m.photos
      .map((p) => {
        if (!p) return null
        if (typeof p !== 'string') return p?.url || null
        if (/^https?:\/\//i.test(p)) return p
        return `/${p.replace(/^\/+/, '')}`
      })
      .filter(Boolean)
  }
  return []
})

const viewMaterials = computed(() => {
  const m = viewMachineData.value
  if (!m) return []
  let mats = m.materials || []
  if (typeof mats === 'string')
    mats = mats
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  return Array.isArray(mats) ? mats : []
})

const viewTransfers = computed(() => {
  const m = viewMachineData.value
  if (!m) return []
  const list = m.transfers || m.transfer_history || m.movements || []
  return Array.isArray(list) ? list : []
})

// ---- Helpers ----
const buildPhotoUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null
  if (typeof pathOrUrl !== 'string') return pathOrUrl?.url || null
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  if (pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) return pathOrUrl
  return `/${pathOrUrl.replace(/^\/+/, '')}`
}

const today = () => new Date().toISOString().slice(0, 10)

// ---- Load branches ----
const loadBranches = async () => {
  try {
    const response = await axios.get(`${API_URL}/branches`)
    if (response.data && response.data.data) branches.value = response.data.data
    else if (Array.isArray(response.data)) branches.value = response.data
    else branches.value = []
  } catch (err) {
    console.error('Error loading branches:', err)
    branches.value = []
  }
}

// ---- Load machines ----
const loadMachines = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      per_page: pagination.perPage,
      page: pagination.currentPage,
      search: searchQuery.value || undefined,
    }
    const response = await machineStore.fetchMachines(params)
    let responseData = response.data || response
    if (responseData.data && Array.isArray(responseData.data)) {
      machines.value = responseData.data
      pagination.currentPage = responseData.current_page || 1
      pagination.lastPage = responseData.last_page || 1
      pagination.total = responseData.total || 0
      pagination.from = responseData.from || 0
      pagination.to = responseData.to || 0
    } else if (Array.isArray(responseData)) {
      machines.value = responseData
    } else {
      machines.value = []
    }
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Imeshindwa kupakia mashine.'
    showToastMessage(error.value, 'error')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.lastPage) {
    pagination.currentPage = page
    loadMachines()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const debouncedSearch = debounce(() => {
  pagination.currentPage = 1
  loadMachines()
}, 500)
watch(searchQuery, () => debouncedSearch())

const clearSearch = () => {
  searchQuery.value = ''
  pagination.currentPage = 1
  loadMachines()
}

// ---- Photo helpers ----
const setPhotoInputRef = (el, i) => {
  if (el) photoInputRefs.value[i] = el
}

const triggerPhotoInput = (i) => {
  photoInputRefs.value[i]?.click()
}

const onPhotoSelected = (event, i) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showToastMessage('Tafadhali chagua faili la picha', 'error')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showToastMessage('Picha isizidi 5MB', 'error')
    return
  }
  const existing = existingPhotos.value.find((p) => p.index === i)
  if (existing && !removedPhotoPaths.value.includes(existing.path)) {
    removedPhotoPaths.value.push(existing.path)
  }
  if (photoPreviews.value[i] && photoPreviews.value[i].startsWith('blob:')) {
    URL.revokeObjectURL(photoPreviews.value[i])
  }
  photoFiles.value[i] = file
  photoPreviews.value[i] = URL.createObjectURL(file)
  event.target.value = ''
}

const removePhoto = (i) => {
  const existing = existingPhotos.value.find((p) => p.index === i)
  if (existing && !removedPhotoPaths.value.includes(existing.path)) {
    removedPhotoPaths.value.push(existing.path)
  }
  if (photoPreviews.value[i] && photoPreviews.value[i].startsWith('blob:')) {
    URL.revokeObjectURL(photoPreviews.value[i])
  }
  photoFiles.value[i] = null
  photoPreviews.value[i] = null
  if (photoInputRefs.value[i]) photoInputRefs.value[i].value = ''
}

const resetPhotos = () => {
  photoPreviews.value.forEach((p) => {
    if (p && p.startsWith('blob:')) URL.revokeObjectURL(p)
  })
  photoFiles.value = [null, null, null, null]
  photoPreviews.value = [null, null, null, null]
  existingPhotos.value = []
  removedPhotoPaths.value = []
}

// ---- Materials ----
const toggleMaterial = (mat) => {
  const idx = form.materials.indexOf(mat)
  if (idx >= 0) form.materials.splice(idx, 1)
  else form.materials.push(mat)
}

const addCustomMaterial = () => {
  const val = customMaterial.value.trim()
  if (!val) return
  if (!customMaterials.value.includes(val) && !materialOptions.includes(val)) {
    customMaterials.value.push(val)
  }
  if (!form.materials.includes(val)) form.materials.push(val)
  customMaterial.value = ''
}

// ---- View modal ----
const viewMachine = async (machine) => {
  closeActionMenu()
  showViewModal.value = true
  viewMachineData.value = machine
  viewLoading.value = true
  await refreshViewMachine(machine.id)
  viewLoading.value = false
}

const refreshViewMachine = async (id) => {
  try {
    const response = await machineStore.fetchMachine(id)
    const fresh = response?.data || machineStore.currentMachine || null
    if (fresh) viewMachineData.value = fresh
  } catch (err) {
    console.error('Error refreshing machine:', err)
  }
}

const closeViewModal = () => {
  showViewModal.value = false
  viewMachineData.value = null
  lightboxUrl.value = null
}

const openLightbox = (url) => {
  lightboxUrl.value = url
}

// ---- Create / Edit ----
const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.machine_code = ''
  form.machine_name = ''
  form.serial_number = ''
  form.branch_id = ''
  form.installation_date = ''
  form.status = 'active'
  form.materials = []
  customMaterials.value = []
  customMaterial.value = ''
  resetPhotos()
  showMachineModal.value = true
}

const openEditModal = (machine) => {
  isEditing.value = true
  editingId.value = machine.id
  form.machine_code = machine.machine_code || ''
  form.machine_name = machine.machine_name || ''
  form.serial_number = machine.serial_number || ''
  form.branch_id = machine.branch_id || ''
  form.installation_date = machine.installation_date
    ? String(machine.installation_date).slice(0, 10)
    : ''
  form.status = machine.status || 'active'

  let mats = machine.materials || []
  if (typeof mats === 'string')
    mats = mats
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  form.materials = Array.isArray(mats) ? [...mats] : []
  customMaterials.value = form.materials.filter((m) => !materialOptions.includes(m))

  resetPhotos()

  const paths = Array.isArray(machine.photos) ? machine.photos : []
  const urls = Array.isArray(machine.photo_urls) ? machine.photo_urls : []

  paths.slice(0, 4).forEach((path, i) => {
    const url = urls[i] || buildPhotoUrl(path)
    if (url) {
      existingPhotos.value.push({ index: i, path, url })
      photoPreviews.value[i] = url
    }
  })

  if (!paths.length && urls.length) {
    urls.slice(0, 4).forEach((url, i) => {
      photoPreviews.value[i] = url
    })
  }

  showMachineModal.value = true
  closeActionMenu()
}

const saveMachine = async () => {
  if (
    !form.machine_code ||
    !form.machine_name ||
    !form.serial_number ||
    !form.branch_id ||
    !form.installation_date
  ) {
    showToastMessage('Tafadhali jaza sehemu zote zinazohitajika.', 'error')
    return
  }

  saving.value = true
  try {
    const hasNewPhotos = photoFiles.value.some((f) => f)
    const hasRemovedPhotos = removedPhotoPaths.value.length > 0
    const photosChanged = hasNewPhotos || hasRemovedPhotos

    if (photosChanged) {
      const payload = new FormData()
      payload.append('machine_code', form.machine_code)
      payload.append('machine_name', form.machine_name)
      payload.append('serial_number', form.serial_number)
      payload.append('branch_id', form.branch_id)
      payload.append('installation_date', form.installation_date)
      payload.append('status', form.status)
      form.materials.forEach((m) => payload.append('materials[]', m))

      const kept = existingPhotos.value
        .filter((p) => !removedPhotoPaths.value.includes(p.path))
        .map((p) => p.path)
      kept.forEach((path) => payload.append('kept_photos[]', path))
      removedPhotoPaths.value.forEach((path) => payload.append('removed_photos[]', path))
      photoFiles.value.forEach((file, i) => {
        if (file) payload.append(`photos[${i}]`, file)
      })

      if (isEditing.value) payload.append('_method', 'PUT')

      if (isEditing.value && editingId.value) {
        await machineStore.updateMachine(editingId.value, payload)
        showToastMessage('Mashine imehaririwa kwa mafanikio', 'success')
      } else {
        await machineStore.createMachine(payload)
        showToastMessage('Mashine imesajiliwa kwa mafanikio', 'success')
      }
    } else {
      const payload = {
        machine_code: form.machine_code,
        machine_name: form.machine_name,
        serial_number: form.serial_number,
        branch_id: form.branch_id,
        installation_date: form.installation_date,
        status: form.status,
        materials: [...form.materials],
      }

      if (isEditing.value && editingId.value) {
        await machineStore.updateMachine(editingId.value, payload)
        showToastMessage('Mashine imehaririwa kwa mafanikio', 'success')
      } else {
        await machineStore.createMachine(payload)
        showToastMessage('Mashine imesajiliwa kwa mafanikio', 'success')
      }
    }

    closeModal()
    await loadMachines()
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      (err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Hitilafu wakati wa kuhifadhi')
    showToastMessage(msg, 'error')
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showMachineModal.value = false
  isEditing.value = false
  editingId.value = null
  resetPhotos()
}

// ---- Transfer ----
const openTransferModal = (machine) => {
  closeActionMenu()
  transferForm.machine_id = machine.id
  transferForm.machine_name = machine.machine_name
  transferForm.from_branch_id = machine.branch_id
  transferForm.from_branch_name = machine.branch?.branch_name || ''
  transferForm.to_branch_id = ''
  transferForm.transfer_date = today()
  transferForm.reason = ''
  transferForm.notes = ''
  showTransferModal.value = true
}

const closeTransferModal = () => {
  showTransferModal.value = false
  transferSaving.value = false
}

const saveTransfer = async () => {
  if (!transferForm.to_branch_id || !transferForm.transfer_date) {
    showToastMessage('Tafadhali chagua tawi na tarehe.', 'error')
    return
  }
  if (Number(transferForm.to_branch_id) === Number(transferForm.from_branch_id)) {
    showToastMessage('Chagua tawi tofauti na la sasa.', 'error')
    return
  }

  transferSaving.value = true
  try {
    await axios.post(`${API_URL}/machines/${transferForm.machine_id}/transfers`, {
      to_branch_id: transferForm.to_branch_id,
      transfer_date: transferForm.transfer_date,
      reason: transferForm.reason || null,
      notes: transferForm.notes || null,
    })

    showToastMessage('Mashine imehamishwa kwa mafanikio', 'success')
    const machineId = transferForm.machine_id
    closeTransferModal()

    await loadMachines()

    if (showViewModal.value && viewMachineData.value?.id === machineId) {
      await refreshViewMachine(machineId)
    }
  } catch (err) {
    const msg = err.response?.data?.message || 'Imeshindwa kuhamisha mashine'
    showToastMessage(msg, 'error')
  } finally {
    transferSaving.value = false
  }
}

const confirmDeleteTransfer = async (transfer) => {
  if (!confirm('Una uhakika unataka kufuta rekodi hii ya uhamisho?')) return
  try {
    await axios.delete(`${API_URL}/machines/${viewMachineData.value.id}/transfers/${transfer.id}`)
    showToastMessage('Rekodi imefutwa', 'success')
    await refreshViewMachine(viewMachineData.value.id)
  } catch (err) {
    showToastMessage(err.response?.data?.message || 'Imeshindwa kufuta rekodi', 'error')
  }
}

// ---- Delete machine ----
const confirmDelete = (machine) => {
  machineToDelete.value = machine
  showDeleteModal.value = true
  closeActionMenu()
}
const closeDeleteModal = () => {
  showDeleteModal.value = false
  machineToDelete.value = null
}
const deleteMachine = async () => {
  if (!machineToDelete.value) return
  deleteLoading.value = true
  try {
    await machineStore.deleteMachine(machineToDelete.value.id)
    showToastMessage('Mashine imefutwa', 'success')
    closeDeleteModal()
    await loadMachines()
    clearSelection()
  } catch (err) {
    showToastMessage(err.response?.data?.message || 'Imeshindwa kufuta', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// ---- Bulk ----
const bulkActivate = async () => {
  if (!selectedMachines.value.length)
    return showToastMessage('Chagua mashine za kuwasha', 'warning')
  try {
    await Promise.all(
      selectedMachines.value.map((id) => machineStore.updateMachineStatus(id, 'active')),
    )
    showToastMessage(`Mashine ${selectedMachines.value.length} zimewashwa`, 'success')
    await loadMachines()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  }
}
const bulkDeactivate = async () => {
  if (!selectedMachines.value.length) return showToastMessage('Chagua mashine za kuzima', 'warning')
  try {
    await Promise.all(
      selectedMachines.value.map((id) => machineStore.updateMachineStatus(id, 'inactive')),
    )
    showToastMessage(`Mashine ${selectedMachines.value.length} zimezimwa`, 'success')
    await loadMachines()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  }
}
const confirmBulkDelete = () => {
  if (selectedMachines.value.length) showBulkDeleteModal.value = true
}
const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false
}
const bulkDelete = async () => {
  if (!selectedMachines.value.length) return
  deleteLoading.value = true
  try {
    const results = await Promise.allSettled(
      selectedMachines.value.map((id) => machineStore.deleteMachine(id)),
    )
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value?.success || r.value?.status === 'success'),
    ).length
    showToastMessage(`${successful} mashine zimefutwa`, successful ? 'success' : 'error')
    closeBulkDeleteModal()
    await loadMachines()
    clearSelection()
  } catch (err) {
    showToastMessage('Hitilafu', 'error')
  } finally {
    deleteLoading.value = false
  }
}

const clearSelection = () => {
  selectedMachines.value = []
  selectAll.value = false
}
const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
  selectedMachines.value = selectAll.value ? machines.value.map((m) => m.id) : []
}
const updateSelectAll = () => {
  selectAll.value = selectedMachines.value.length === machines.value.length
}

// ---- Action menu ----
const setActionRef = (el, id) => {
  if (el) actionRefs.value[id] = el
}
const toggleActionMenu = (id) => {
  activeActionMenu.value = activeActionMenu.value === id ? null : id
}
const closeActionMenu = () => {
  activeActionMenu.value = null
}
const handleClickOutside = (event) => {
  if (!event.target.closest('.action-dropdown')) closeActionMenu()
}

const showToastMessage = (msg, type) => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
const getStatusText = (status) =>
  ({ active: 'Inafanya kazi', maintenance: 'Matengenezo', inactive: 'Haifanyi kazi' })[status] ||
  status
const getMachineName = (id) => machines.value.find((m) => m.id === id)?.machine_name || ''

onMounted(() => {
  loadBranches()
  loadMachines()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  debouncedSearch.cancel()
  resetPhotos()
})
</script>

<style scoped>
/* ============================
   Base layout
   ============================ */
.machine-list-container {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.header-left h1 {
  font-size: 1.75rem;
  color: #1e293b;
  margin: 0 0 0.25rem;
  font-weight: 600;
}
.machine-count {
  color: #64748b;
  margin: 0;
  font-size: 0.875rem;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Search */
.search-wrapper {
  position: relative;
  width: 280px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.875rem;
}
.search-input {
  padding: 0.6rem 2rem 0.6rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
}
.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
}
.clear-search:hover {
  color: #ef4444;
}

/* Buttons */
.btn-primary {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: #3b82f6;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* Table */
.table-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #eef2f6;
}
.table-responsive {
  /* overflow-x: auto; */
}
.machines-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.machines-table th {
  text-align: left;
  padding: 1rem;
  background: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}
.machines-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.machines-table tbody tr:hover {
  background: #f8fafc;
}
.machines-table tbody tr.row-selected {
  background: #eff6ff;
}
.checkbox-col {
  width: 40px;
  text-align: center;
}
.machine-cell {
  display: flex;
  flex-direction: column;
}
.machine-name {
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.2rem;
}
.machine-code {
  font-size: 0.75rem;
  color: #64748b;
  font-family: monospace;
}
.serial-number {
  font-family: monospace;
  color: #475569;
}
.branch-name {
  color: #334155;
}
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}
.status-badge.maintenance {
  background: #fed7aa;
  color: #9a3412;
}
.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}
.date-info {
  display: flex;
  flex-direction: column;
}
.date {
  font-weight: 500;
  color: #0f172a;
}
.time {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Action dropdown */
.action-dropdown {
  position: relative;
  display: inline-block;
}
.action-menu-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.action-menu-btn:hover {
  background: #f1f5f9;
  color: #3b82f6;
  border-color: #3b82f6;
}
.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 160px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.action-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #334155;
  transition: background 0.2s;
}
.action-menu-item:hover {
  background: #f1f5f9;
}
.action-menu-item i {
  width: 20px;
  color: #64748b;
}
.action-menu-item.text-danger {
  color: #dc2626;
}
.action-menu-item.text-danger i {
  color: #dc2626;
}

/* Bulk */
.bulk-actions {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.bulk-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e40af;
  font-size: 0.875rem;
}
.bulk-buttons {
  display: flex;
  gap: 0.5rem;
}
.btn-bulk {
  padding: 0.25rem 1rem;
  border-radius: 8px;
  background: white;
  border: 1px solid #cbd5e1;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-bulk:hover {
  background: #f1f5f9;
}
.btn-bulk.text-danger:hover {
  background: #fee2e2;
  border-color: #dc2626;
  color: #dc2626;
}

/* Pagination */
.pagination-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.pagination-info {
  font-size: 0.875rem;
  color: #64748b;
}
.pagination-controls {
  display: flex;
  justify-content: center;
}
.pagination-buttons {
  display: flex;
  gap: 0.5rem;
}
.pagination-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}
.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #3b82f6;
}
.pagination-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-indicator {
  text-align: center;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* ============================
   Modals
   ============================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}
.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
.machine-modal {
  max-width: 720px;
  border-radius: 18px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.view-modal {
  max-width: 820px;
  border-radius: 18px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #eff6ff);
  border-radius: 18px 18px 0 0;
}
.modal-header-title {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.modal-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}
.modal-header-icon.view-icon {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.3);
}
.modal-header-icon.transfer-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
}
.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}
.modal-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0.15rem 0 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s;
}
.close-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}
.modal-body {
  padding: 1.5rem;
}
.view-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.view-loading {
  text-align: center;
  padding: 2rem 0;
  color: #64748b;
}
.view-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.form-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  padding-bottom: 0.4rem;
  border-bottom: 1px dashed #e2e8f0;
}
.form-section-title i {
  color: #3b82f6;
  font-size: 0.85rem;
}
.form-section-title .optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: #94a3b8;
  font-size: 0.7rem;
  margin-left: auto;
}

/* View photos */
.view-photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
.view-photo {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  cursor: zoom-in;
  transition: all 0.2s;
  background: #f1f5f9;
}
.view-photo:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.2);
  border-color: #3b82f6;
}
.view-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.view-photo-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(15, 23, 42, 0.75);
  color: white;
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}

/* View details */
.view-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}
.view-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.6rem 0.85rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #eef2f6;
}
.detail-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  font-weight: 600;
}
.detail-value {
  font-size: 0.9rem;
  color: #0f172a;
  font-weight: 500;
}
.detail-value.mono {
  font-family: monospace;
}

/* Materials in view */
.view-materials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.material-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1e40af;
  font-size: 0.8rem;
  font-weight: 500;
}
.material-tag i {
  font-size: 0.75rem;
}

/* Transfer timeline */
.transfer-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  padding-left: 1rem;
}
.transfer-timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(to bottom, #bfdbfe, #e2e8f0);
}
.transfer-item {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  position: relative;
}
.transfer-dot {
  position: absolute;
  left: -1rem;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #f59e0b;
  border: 3px solid #fef3c7;
  box-shadow: 0 0 0 2px white;
}
.transfer-content {
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 10px;
  padding: 0.6rem 2.2rem 0.6rem 0.85rem;
  flex: 1;
  position: relative;
}
.transfer-route {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #0f172a;
  font-size: 0.85rem;
}
.transfer-route i {
  color: #f59e0b;
  font-size: 0.75rem;
}
.transfer-branch {
  color: #475569;
}
.transfer-branch.to {
  color: #b45309;
}
.transfer-meta {
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  align-items: center;
}
.transfer-notes {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #475569;
  font-style: italic;
  padding-left: 0.5rem;
  border-left: 2px solid #e2e8f0;
}
.transfer-delete {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s;
}
.transfer-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.view-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.8rem;
}
.view-empty i {
  font-size: 1.3rem;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 2rem;
}
.lightbox-img {
  max-width: 95vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
}
.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background 0.2s;
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Form */
.machine-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: #334155;
}
.form-group .required {
  color: #ef4444;
}
.form-control {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  box-sizing: border-box;
  font-family: inherit;
}
.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.form-control::placeholder {
  color: #cbd5e1;
}
.form-control:disabled {
  background: #f1f5f9;
  color: #64748b;
}
textarea.form-control {
  resize: vertical;
  min-height: 70px;
}

/* Material chips */
.material-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.chip:hover {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1e40af;
  transform: translateY(-1px);
}
.chip.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #2563eb;
  color: white;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.35);
}
.chip i {
  font-size: 0.75rem;
}
.custom-material {
  display: flex;
  gap: 0.5rem;
}
.custom-material .form-control {
  flex: 1;
}
.btn-add-material {
  width: 42px;
  min-width: 42px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.btn-add-material:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.35);
}
.selected-materials {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  background: #eff6ff;
  border-radius: 10px;
  font-size: 0.8rem;
}
.selected-label {
  color: #64748b;
  font-weight: 500;
}
.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  background: white;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-weight: 500;
}
.selected-tag i {
  font-size: 0.65rem;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.2s;
}
.selected-tag i:hover {
  color: #dc2626;
}

/* Photos */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
.photo-slot {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
}
.photo-input {
  display: none;
}
.photo-placeholder,
.photo-preview {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.photo-placeholder {
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 500;
}
.photo-placeholder:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
  transform: translateY(-2px);
}
.photo-placeholder i {
  font-size: 1.3rem;
}
.photo-preview {
  border: 2px solid #e2e8f0;
  background: #f1f5f9;
}
.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photo-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(15, 23, 42, 0.7);
  color: white;
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}
.remove-photo {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  cursor: pointer;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2;
}
.remove-photo:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 1.25rem;
}
.btn-secondary {
  padding: 0.6rem 1.1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: #e2e8f0;
}
.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}
.btn-danger:hover {
  background: #b91c1c;
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 2100;
  border-left: 4px solid;
}
.toast-notification.success {
  border-left-color: #10b981;
}
.toast-notification.error {
  border-left-color: #ef4444;
}

/* Loading */
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .machine-list-container {
    padding: 0.75rem;
  }
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    justify-content: stretch;
  }
  .search-wrapper {
    width: 100%;
  }
  .btn-primary {
    flex: 1;
    justify-content: center;
  }
  .machines-table th,
  .machines-table td {
    padding: 0.75rem;
  }
  .checkbox-col {
    width: 30px;
  }
  .action-menu {
    right: -20px;
  }
  .view-photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .view-details-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .modal-body,
  .view-body {
    padding: 1rem;
  }
}
</style>
