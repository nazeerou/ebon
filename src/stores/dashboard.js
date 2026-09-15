// stores/dashboard.js
import { defineStore } from 'pinia'
import api from '@/services/api' // your axios instance

// const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    dashboardData: {
      total_machines: 0,
      active_machines: 0,
      today_revenue: 0,
      monthly_revenue: 0,
      total_collections: 0,
      pending_readings: 0,
      today_growth: 0,
      monthly_growth: 0,
      top_machine: null,
      top_branch: null,
      branch_count: 0,
      revenue_by_day: [],
      revenue_by_month: [],
      top_machines: [],
      branch_performance: [],
    },
    recentActivities: [],
    pendingMachines: [],
    loading: false,
    error: null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    activePercentage: (state) => {
      const total = state.dashboardData.total_machines
      const active = state.dashboardData.active_machines
      return total ? Math.round((active / total) * 100) : 0
    },
    todayGrowth: (state) => state.dashboardData.today_growth || 0,
    monthlyGrowth: (state) => state.dashboardData.monthly_growth || 0,
  },

  actions: {
    /**
     * Fetch main dashboard data from API
     * GET /api/dashboard
     */
    async fetchDashboardData() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`${API_URL}/dashboard`)
        const data = response.data.data || response.data

        this.dashboardData = {
          total_machines: data.total_machines ?? 0,
          active_machines: data.active_machines ?? 0,
          today_revenue: data.today_revenue ?? 0,
          monthly_revenue: data.monthly_revenue ?? 0,
          total_collections: data.total_collections ?? 0,
          pending_readings: data.pending_readings ?? 0,
          today_growth: data.today_growth ?? 0,
          monthly_growth: data.monthly_growth ?? 0,
          top_machine: data.top_machine ?? null,
          top_branch: data.top_branch ?? null,
          branch_count: data.branch_count ?? 0,
          revenue_by_day: data.revenue_by_day ?? [],
          revenue_by_month: data.revenue_by_month ?? [],
          top_machines: data.top_machines ?? [],
          branch_performance: data.branch_performance ?? [],
        }
        return this.dashboardData
      } catch (err) {
        this.error = err.response?.data?.message || 'Hitilafu ya kupakia data'
        console.error('Dashboard fetch error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch recent activities from audit trail
     * GET /api/audit-trails?limit=5
     */
    async fetchRecentActivities(limit = 5) {
      try {
        const response = await api.get(`${API_URL}/audit-trails`, { params: { limit } })
        this.recentActivities = response.data.data || []
        return this.recentActivities
      } catch (err) {
        console.error('Failed to fetch recent activities:', err)
        this.recentActivities = []
        return []
      }
    },

    /**
     * Fetch machines with pending readings today
     * GET /api/machines/pending-readings
     */
    async fetchPendingMachines() {
      try {
        const response = await api.get(`${API_URL}/machines/pending-readings`)
        this.pendingMachines = response.data.data || []
        return this.pendingMachines
      } catch (err) {
        console.error('Failed to fetch pending machines:', err)
        this.pendingMachines = []
        return []
      }
    },

    /**
     * Refresh all dashboard data
     */
    async refreshAll() {
      await Promise.all([
        this.fetchDashboardData(),
        this.fetchRecentActivities(5),
        this.fetchPendingMachines(),
      ])
    },

    /**
     * Clear store (e.g., on logout)
     */
    clearDashboard() {
      this.dashboardData = {
        total_machines: 0,
        active_machines: 0,
        today_revenue: 0,
        monthly_revenue: 0,
        total_collections: 0,
        pending_readings: 0,
        today_growth: 0,
        monthly_growth: 0,
        top_machine: null,
        top_branch: null,
        branch_count: 0,
        revenue_by_day: [],
        revenue_by_month: [],
        top_machines: [],
        branch_performance: [],
      }
      this.recentActivities = []
      this.pendingMachines = []
      this.error = null
      this.loading = false
    },
  },
})
