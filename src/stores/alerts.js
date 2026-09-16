// src/stores/alerts.js
import { defineStore } from 'pinia'
import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

export const useAlertStore = defineStore('alerts', {
  state: () => ({
    alerts: [],
    summary: { warning: 0, critical: 0, total: 0 },
    thresholds: { warning_days: 3, critical_days: 7 },
    branch: '',

    loading: false,
    error: null,
    lastFetched: null,
  }),

  getters: {
    getAlerts: (state) => state.alerts,
    getSummary: (state) => state.summary,
    totalCount: (state) => state.summary.total,
    criticalCount: (state) => state.summary.critical,
    warningCount: (state) => state.summary.warning,
    hasAlerts: (state) => state.summary.total > 0,
  },

  actions: {
    async fetchAlerts(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/alerts/overdue-readings`, {
          params: {
            branch: this.branch,
            warning_days: this.thresholds.warning_days,
            critical_days: this.thresholds.critical_days,
            ...params,
          },
        })

        const body = response.data ?? {}
        const data = body.data ?? body

        this.alerts = data.alerts ?? []
        this.summary = data.summary ?? { warning: 0, critical: 0, total: 0 }
        if (data.thresholds) this.thresholds = data.thresholds
        if (data.branch) this.branch = data.branch

        this.lastFetched = new Date().toISOString()
        return data
      } catch (err) {
        console.error('[alerts] fetchAlerts error:', err)
        this.error = err.response?.data?.message || err.message || 'Imeshindwa kupakia tahadhari.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchSummary() {
      try {
        const response = await axios.get(`${API_URL}/alerts/summary`, {
          params: {
            branch: this.branch,
            warning_days: this.thresholds.warning_days,
            critical_days: this.thresholds.critical_days,
          },
        })
        const body = response.data ?? {}
        this.summary = body.data ?? body
      } catch (err) {
        console.error('[alerts] fetchSummary error:', err)
      }
    },

    // Poll every 60s while the app is open
    startPolling(intervalMs = 60000) {
      this.stopPolling()
      this._pollTimer = setInterval(() => this.fetchSummary(), intervalMs)
    },

    stopPolling() {
      if (this._pollTimer) {
        clearInterval(this._pollTimer)
        this._pollTimer = null
      }
    },
  },
})
