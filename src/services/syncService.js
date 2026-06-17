// import axios from 'axios'
// import offlineStorage from './offlineStorage'

// const API_URL = import.meta.env.VITE_API_URL || 'https://web.bas.co.tz/api/v1'

// class SyncService {
//   constructor() {
//     this.isOnline = navigator.onLine
//     this.syncInProgress = false
//     this.initEventListeners()
//   }

//   initEventListeners() {
//     window.addEventListener('online', () => {
//       this.isOnline = true
//       this.syncData()
//     })

//     window.addEventListener('offline', () => {
//       this.isOnline = false
//     })
//   }

//   async syncData() {
//     if (!this.isOnline || this.syncInProgress) return

//     this.syncInProgress = true

//     try {
//       const pendingItems = await offlineStorage.getPendingSync()

//       for (const item of pendingItems) {
//         try {
//           await this.processSyncItem(item)
//           await offlineStorage.removeFromPendingSync(item.localId)
//         } catch (error) {
//           console.error('Sync failed for item:', item, error)
//           await offlineStorage.updateSyncAttempt(item.id)
//         }
//       }
//     } catch (error) {
//       console.error('Sync process error:', error)
//     } finally {
//       this.syncInProgress = false
//     }
//   }

//   async processSyncItem(item) {
//     switch (item.action) {
//       case 'create':
//         return this.syncCreateCustomer(item)
//       case 'update':
//         return this.syncUpdateCustomer(item)
//       default:
//         throw new Error(`Unknown action: ${item.action}`)
//     }
//   }

//   async syncCreateCustomer(item) {
//     const formData = new FormData()

//     // Add all customer fields
//     Object.keys(item.data).forEach((key) => {
//       if (key !== 'localId' && key !== 'synced' && key !== 'createdAt' && key !== 'updatedAt') {
//         if (item.data[key] instanceof File) {
//           formData.append(key, item.data[key])
//         } else if (item.data[key] !== null && item.data[key] !== undefined) {
//           formData.append(key, item.data[key].toString())
//         }
//       }
//     })

//     const response = await axios.post(`${API_URL}/customers`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     })

//     if (response.data.success) {
//       await offlineStorage.markAsSynced(item.localId, response.data.data.id)
//     }

//     return response
//   }

//   async syncUpdateCustomer(item) {
//     const formData = new FormData()
//     formData.append('_method', 'PUT')

//     Object.keys(item.data).forEach((key) => {
//       if (key !== 'localId' && key !== 'synced' && key !== 'createdAt' && key !== 'updatedAt') {
//         if (item.data[key] instanceof File) {
//           formData.append(key, item.data[key])
//         } else if (item.data[key] !== null && item.data[key] !== undefined) {
//           formData.append(key, item.data[key].toString())
//         }
//       }
//     })

//     const response = await axios.post(`${API_URL}/customers/${item.data.id}`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     })

//     if (response.data.success) {
//       await offlineStorage.markAsSynced(item.localId, item.data.id)
//     }

//     return response
//   }

//   async checkServerStatus() {
//     try {
//       await axios.get(`${API_URL}/health`, { timeout: 3000 })
//       return true
//     } catch {
//       return false
//     }
//   }
// }

// export default new SyncService()
// services/syncService.js
import { useAuthStore } from '@/stores/auth'
import offlineStorage from './offlineStorage'

class SyncService {
  constructor() {
    this.syncInProgress = false
    this.queue = []
    this.authStore = null
  }

  // Initialize with auth store
  init(authStore) {
    this.authStore = authStore
  }

  // Add item to sync queue
  async addToQueue(item) {
    const queue = await this.getQueue()
    queue.push({
      ...item,
      status: 'pending',
      attempts: 0,
    })
    await this.saveQueue(queue)
    this.queue = queue
  }

  // Get sync queue
  async getQueue() {
    if (this.queue.length > 0) return this.queue

    const stored = localStorage.getItem('syncQueue')
    if (stored) {
      this.queue = JSON.parse(stored)
    }
    return this.queue
  }

  // Save queue
  async saveQueue(queue) {
    this.queue = queue
    localStorage.setItem('syncQueue', JSON.stringify(queue))
  }

  // Get pending count
  async getPendingCount() {
    const queue = await this.getQueue()
    return queue.filter((item) => item.status === 'pending').length
  }

  // Sync data
  async syncData() {
    if (this.syncInProgress || !navigator.onLine) return

    this.syncInProgress = true
    const queue = await this.getQueue()
    const pending = queue.filter((item) => item.status === 'pending')

    for (const item of pending) {
      try {
        await this.processSyncItem(item)
        // Mark as synced
        item.status = 'synced'
        item.syncedAt = new Date().toISOString()
      } catch (error) {
        console.error('Sync failed for item:', item, error)
        item.status = 'failed'
        item.error = error.message
        item.attempts = (item.attempts || 0) + 1
      }
    }

    await this.saveQueue(queue)
    this.syncInProgress = false
  }

  // Process individual sync item
  async processSyncItem(item) {
    if (!this.authStore) {
      this.authStore = useAuthStore()
    }

    const formData = new FormData()

    // Add all data fields
    for (let [key, value] of Object.entries(item.data)) {
      if (key === 'files') {
        // Handle files separately
        for (let [fileKey, fileData] of Object.entries(value)) {
          if (fileData.data) {
            // Convert base64 back to file
            const file = this.base64ToFile(fileData.data, fileData.name, fileData.type)
            formData.append(fileKey, file)
          }
        }
      } else if (value !== null && value !== undefined) {
        formData.append(key, value)
      }
    }

    try {
      let response
      if (item.action === 'create') {
        response = await this.authStore.api.post('/customers', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else if (item.action === 'update') {
        response = await this.authStore.api.post(`/customers/${item.data.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-HTTP-Method-Override': 'PUT',
          },
        })
      }

      // Remove from offline storage after successful sync
      if (response?.status === 200 || response?.status === 201) {
        await offlineStorage.removeCustomer(item.localId)
      }

      return response
    } catch (error) {
      // Don't retry validation errors (422)
      if (error.response?.status === 422) {
        console.error('Validation error:', error.response.data.errors)
        // Store validation errors for user to fix
        await offlineStorage.saveFailedSync({
          ...item,
          errors: error.response.data.errors,
          failedAt: new Date().toISOString(),
        })
        throw error
      }
      // Retry other errors
      throw error
    }
  }

  // Helper: Convert base64 to File
  base64ToFile(base64Data, filename, mimeType) {
    const arr = base64Data.split(',')
    const bstr = atob(arr[1] || arr[0])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new File([u8arr], filename, { type: mimeType })
  }

  // Clear synced items
  async clearSynced() {
    const queue = await this.getQueue()
    const filtered = queue.filter((item) => item.status !== 'synced')
    await this.saveQueue(filtered)
  }

  // Get failed items
  async getFailedItems() {
    const queue = await this.getQueue()
    return queue.filter((item) => item.status === 'failed')
  }
}

export default new SyncService()
