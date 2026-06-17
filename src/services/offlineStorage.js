// IndexedDB wrapper for offline storage
class OfflineStorage {
  constructor(dbName = 'CustomerDB', version = 1) {
    this.dbName = dbName
    this.version = version
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', {
            keyPath: 'localId',
            autoIncrement: true,
          })
          customerStore.createIndex('synced', 'synced', { unique: false })
          customerStore.createIndex('id', 'id', { unique: true })
        }

        // Create pending sync store
        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', {
            keyPath: 'id',
            autoIncrement: true,
          })
          syncStore.createIndex('action', 'action', { unique: false })
          syncStore.createIndex('status', 'status', { unique: false })
          syncStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Create form drafts store
        if (!db.objectStoreNames.contains('formDrafts')) {
          db.createObjectStore('formDrafts', { keyPath: 'id' })
        }
      }
    })
  }

  // Customer methods
  async saveCustomer(customerData) {
    const customer = {
      ...customerData,
      localId: Date.now() + Math.random().toString(36).substr(2, 9),
      synced: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customers'], 'readwrite')
      const store = transaction.objectStore('customers')
      const request = store.add(customer)

      request.onsuccess = () => {
        // Add to pending sync
        this.addToPendingSync({
          action: 'create',
          data: customer,
          localId: customer.localId,
          status: 'pending',
        })
        resolve(customer)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async updateCustomer(localId, customerData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customers'], 'readwrite')
      const store = transaction.objectStore('customers')

      // First get the existing customer
      const getRequest = store.get(localId)

      getRequest.onsuccess = () => {
        const existingCustomer = getRequest.result
        const updatedCustomer = {
          ...existingCustomer,
          ...customerData,
          updatedAt: new Date().toISOString(),
          synced: false,
        }

        const putRequest = store.put(updatedCustomer)

        putRequest.onsuccess = () => {
          // Add to pending sync
          this.addToPendingSync({
            action: 'update',
            data: updatedCustomer,
            localId: updatedCustomer.localId,
            status: 'pending',
          })
          resolve(updatedCustomer)
        }
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async getCustomers() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customers'], 'readonly')
      const store = transaction.objectStore('customers')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedCustomers() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customers'], 'readonly')
      const store = transaction.objectStore('customers')
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async markAsSynced(localId, serverId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customers'], 'readwrite')
      const store = transaction.objectStore('customers')
      const getRequest = store.get(localId)

      getRequest.onsuccess = () => {
        const customer = getRequest.result
        customer.synced = true
        customer.id = serverId
        customer.syncedAt = new Date().toISOString()

        const putRequest = store.put(customer)

        putRequest.onsuccess = () => {
          // Remove from pending sync
          this.removeFromPendingSync(localId)
          resolve()
        }
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Pending sync methods
  async addToPendingSync(item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingSync'], 'readwrite')
      const store = transaction.objectStore('pendingSync')
      const request = store.add({
        ...item,
        createdAt: new Date().toISOString(),
        attempts: 0,
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingSync() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingSync'], 'readonly')
      const store = transaction.objectStore('pendingSync')
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromPendingSync(localId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingSync'], 'readwrite')
      const store = transaction.objectStore('pendingSync')

      // Find and delete by localId
      const index = store.index('localId')
      const getRequest = index.getAll(localId)

      getRequest.onsuccess = () => {
        const items = getRequest.result
        items.forEach((item) => {
          store.delete(item.id)
        })
        resolve()
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async updateSyncAttempt(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingSync'], 'readwrite')
      const store = transaction.objectStore('pendingSync')
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const item = getRequest.result
        item.attempts = (item.attempts || 0) + 1
        if (item.attempts >= 5) {
          item.status = 'failed'
        }

        const putRequest = store.put(item)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Form drafts
  async saveFormDraft(draftId, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['formDrafts'], 'readwrite')
      const store = transaction.objectStore('formDrafts')
      const request = store.put({
        id: draftId,
        data,
        updatedAt: new Date().toISOString(),
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFormDraft(draftId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['formDrafts'], 'readonly')
      const store = transaction.objectStore('formDrafts')
      const request = store.get(draftId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearFormDraft(draftId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['formDrafts'], 'readwrite')
      const store = transaction.objectStore('formDrafts')
      const request = store.delete(draftId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export default new OfflineStorage()

// services/offlineStorage.js
// class OfflineStorage {
//   constructor() {
//     this.dbName = 'TamaraOfflineDB'
//     this.dbVersion = 1
//     this.db = null
//     this.initDB()
//   }

//   // Initialize IndexedDB
//   initDB() {
//     const request = indexedDB.open(this.dbName, this.dbVersion)

//     request.onerror = (event) => {
//       console.error('IndexedDB error:', event.target.error)
//     }

//     request.onsuccess = (event) => {
//       this.db = event.target.result
//       console.log('IndexedDB initialized')
//     }

//     request.onupgradeneeded = (event) => {
//       const db = event.target.result

//       // Create customers store
//       if (!db.objectStoreNames.contains('customers')) {
//         const customerStore = db.createObjectStore('customers', { keyPath: 'localId' })
//         customerStore.createIndex('status', 'status', { unique: false })
//         customerStore.createIndex('createdAt', 'createdAt', { unique: false })
//       }

//       // Create failed syncs store
//       if (!db.objectStoreNames.contains('failedSyncs')) {
//         db.createObjectStore('failedSyncs', { keyPath: 'localId' })
//       }

//       // Create form drafts store
//       if (!db.objectStoreNames.contains('formDrafts')) {
//         db.createObjectStore('formDrafts', { keyPath: 'id' })
//       }
//     }
//   }

//   // Wait for DB to be ready
//   async waitForDB() {
//     if (this.db) return this.db

//     return new Promise((resolve) => {
//       const checkDB = setInterval(() => {
//         if (this.db) {
//           clearInterval(checkDB)
//           resolve(this.db)
//         }
//       }, 100)
//     })
//   }

//   // Save customer offline
//   async saveCustomer(customer) {
//     const db = await this.waitForDB()
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['customers'], 'readwrite')
//       const store = transaction.objectStore('customers')
//       const request = store.put(customer)

//       request.onsuccess = () => resolve(request.result)
//       request.onerror = () => reject(request.error)
//     })
//   }

//   // Get all offline customers
//   async getCustomers() {
//     const db = await this.waitForDB()
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['customers'], 'readonly')
//       const store = transaction.objectStore('customers')
//       const request = store.getAll()

//       request.onsuccess = () => resolve(request.result)
//       request.onerror = () => reject(request.error)
//     })
//   }

//   // Remove customer from offline storage
//   async removeCustomer(localId) {
//     const db = await this.waitForDB()
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['customers'], 'readwrite')
//       const store = transaction.objectStore('customers')
//       const request = store.delete(localId)

//       request.onsuccess = () => resolve()
//       request.onerror = () => reject(request.error)
//     })
//   }

//   // Save failed sync
//   async saveFailedSync(item) {
//     const db = await this.waitForDB()
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['failedSyncs'], 'readwrite')
//       const store = transaction.objectStore('failedSyncs')
//       const request = store.put(item)

//       request.onsuccess = () => resolve()
//       request.onerror = () => reject(request.error)
//     })
//   }

//   // Get failed syncs
//   async getFailedSyncs() {
//     const db = await this.waitForDB()
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['failedSyncs'], 'readonly')
//       const store = transaction.objectStore('failedSyncs')
//       const request = store.getAll()

//       request.onsuccess = () => resolve(request.result)
//       request.onerror = () => reject(request.error)
//     })
//   }

//   // Save form draft
//   async saveFormDraft(id, data) {
//     const db = await this.waitForDB()
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['formDrafts'], 'readwrite')
//       const store = transaction.objectStore('formDrafts')
//       const request = store.put({ id, data, updatedAt: new Date().toISOString() })

//       request.onsuccess = () => resolve()
//       request.onerror = () => reject(request.error)
//     })
//   }

//   // Get form draft
//   async getFormDraft(id) {
//     const db = await this.waitForDB()
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['formDrafts'], 'readonly')
//       const store = transaction.objectStore('formDrafts')
//       const request = store.get(id)

//       request.onsuccess = () => resolve(request.result)
//       request.onerror = () => reject(request.error)
//     })
//   }

//   // Clear form draft
//   async clearFormDraft(id) {
//     const db = await this.waitForDB()
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['formDrafts'], 'readwrite')
//       const store = transaction.objectStore('formDrafts')
//       const request = store.delete(id)

//       request.onsuccess = () => resolve()
//       request.onerror = () => reject(request.error)
//     })
//   }
// }

// export default new OfflineStorage()
