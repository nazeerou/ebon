// // stores/dashboard.js
// import { defineStore } from 'pinia'
// import api from '@/services/api' // your axios instance

// export const useDashboardStore = defineStore('dashboard', {
//   state: () => ({
//     // Main dashboard data (from GET /dashboard)
//     dashboardData: {
//       total_machines: 0,
//       active_machines: 0,
//       today_revenue: 0,
//       monthly_revenue: 0,
//       total_collections: 0,
//       pending_readings: 0,
//       top_machine: null, // { name, revenue }
//       top_branch: null, // { name, revenue }
//       branch_count: 0,
//       revenue_by_day: [], // [{ date, total }]
//       revenue_by_month: [], // [{ month, total }]
//       top_machines: [], // [{ machine_name, revenue }]
//       branch_performance: [], // [{ branch_name, revenue }]
//     },
//     recentActivities: [], // from /audit-trails?limit=5
//     pendingMachines: [], // from /machines/pending-readings
//     loading: false,
//     error: null,
//   }),

//   getters: {
//     isLoading: (state) => state.loading,
//     getError: (state) => state.error,

//     // Helper computed values
//     activePercentage: (state) => {
//       const total = state.dashboardData.total_machines
//       const active = state.dashboardData.active_machines
//       return total ? Math.round((active / total) * 100) : 0
//     },
//     todayGrowth: (state) => state.dashboardData.today_growth || 0,
//     monthlyGrowth: (state) => state.dashboardData.monthly_growth || 0,
//   },

//   actions: {
//     /**
//      * Fetch all main dashboard statistics and chart data
//      * Expects endpoint: GET /dashboard
//      * Response format:
//      * {
//      *   total_machines, active_machines, today_revenue, monthly_revenue,
//      *   total_collections, pending_readings, today_growth, monthly_growth,
//      *   top_machine, top_branch, branch_count,
//      *   revenue_by_day: [{date, total}],
//      *   revenue_by_month: [{month, total}],
//      *   top_machines: [{machine_name, revenue}],
//      *   branch_performance: [{branch_name, revenue}]
//      * }
//      */
//     async fetchDashboardData() {
//       this.loading = true
//       this.error = null
//       try {
//         const response = await api.get('/dashboard')
//         // Merge with existing state to keep structure
//         this.dashboardData = { ...this.dashboardData, ...response.data }
//         return response.data
//       } catch (err) {
//         this.error = err.response?.data?.message || 'Failed to load dashboard data'
//         console.error('Dashboard fetch error:', err)
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },

//     /**
//      * Fetch recent activities from audit trail
//      * GET /audit-trails?limit=5
//      */
//     async fetchRecentActivities(limit = 5) {
//       try {
//         const response = await api.get('/audit-trails', { params: { limit } })
//         this.recentActivities = response.data.data || []
//         return this.recentActivities
//       } catch (err) {
//         console.error('Failed to fetch recent activities:', err)
//         this.recentActivities = []
//         return []
//       }
//     },

//     /**
//      * Fetch machines that have no reading recorded today
//      * GET /machines/pending-readings
//      * Expected response: array of machines with branch_name, last_reading, last_reading_date
//      */
//     async fetchPendingMachines() {
//       try {
//         const response = await api.get('/machines/pending-readings')
//         this.pendingMachines = response.data || []
//         return this.pendingMachines
//       } catch (err) {
//         console.error('Failed to fetch pending machines:', err)
//         this.pendingMachines = []
//         return []
//       }
//     },

//     /**
//      * Refresh all dashboard data (main + activities + pending)
//      */
//     async refreshAll() {
//       await Promise.all([
//         this.fetchDashboardData(),
//         this.fetchRecentActivities(5),
//         this.fetchPendingMachines(),
//       ])
//     },

//     /**
//      * Clear store (e.g., on logout)
//      */
//     clearDashboard() {
//       this.dashboardData = {
//         total_machines: 0,
//         active_machines: 0,
//         today_revenue: 0,
//         monthly_revenue: 0,
//         total_collections: 0,
//         pending_readings: 0,
//         top_machine: null,
//         top_branch: null,
//         branch_count: 0,
//         revenue_by_day: [],
//         revenue_by_month: [],
//         top_machines: [],
//         branch_performance: [],
//       }
//       this.recentActivities = []
//       this.pendingMachines = []
//       this.error = null
//       this.loading = false
//     },
//   },
// })

// stores/dashboard.js
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    dashboardData: {
      total_machines: 12,
      active_machines: 10,
      today_revenue: 845000,
      monthly_revenue: 3250000,
      total_collections: 18750000,
      pending_readings: 3,
      today_growth: 8.5,
      monthly_growth: 12.3,
      top_machine: { name: 'BN007 - Bonanza Mwenge', revenue: 2340000 },
      top_branch: { name: 'Tawi la Kariakoo', revenue: 5670000 },
      branch_count: 4,
      revenue_by_day: [
        { date: '2025-06-08', total: 720000 },
        { date: '2025-06-09', total: 810000 },
        { date: '2025-06-10', total: 690000 },
        { date: '2025-06-11', total: 945000 },
        { date: '2025-06-12', total: 1020000 },
        { date: '2025-06-13', total: 1180000 },
        { date: '2025-06-14', total: 845000 },
      ],
      revenue_by_month: [
        { month: 'Jan 2025', total: 2100000 },
        { month: 'Feb 2025', total: 2350000 },
        { month: 'Mar 2025', total: 2780000 },
        { month: 'Apr 2025', total: 3010000 },
        { month: 'May 2025', total: 3250000 },
        { month: 'Jun 2025', total: 1520000 },
      ],
      top_machines: [
        { machine_name: 'BN001 - Bonanza Posta', revenue: 3120000 },
        { machine_name: 'BN002 - Bonanza Kariakoo', revenue: 2890000 },
        { machine_name: 'BN003 - Bonanza Mbagala', revenue: 2450000 },
        { machine_name: 'BN004 - Bonanza Kinondoni', revenue: 2100000 },
        { machine_name: 'BN005 - Bonanza Temeke', revenue: 1870000 },
      ],
      branch_performance: [
        { branch_name: 'Kariakoo', revenue: 5670000 },
        { branch_name: 'Posta', revenue: 4890000 },
        { branch_name: 'Mbagala', revenue: 4120000 },
        { branch_name: 'Kinondoni', revenue: 3760000 },
      ],
    },
    recentActivities: [
      {
        id: 1,
        user_name: 'Ahmed Juma',
        action: 'created',
        description: 'Aliweka usomaji mpya wa mita',
        table_name: 'machine_readings',
        record_id: 124,
        created_at: new Date(Date.now() - 25 * 60000).toISOString(),
        user_avatar: null,
      },
      {
        id: 2,
        user_name: 'Salma Hassan',
        action: 'collection',
        description: 'Aliweka makusanyo ya mashine BN002',
        table_name: 'collections',
        record_id: 89,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        user_avatar: null,
      },
      {
        id: 3,
        user_name: 'Juma Bakari',
        action: 'updated',
        description: 'Alisasisha taarifa za mashine BN007',
        table_name: 'machines',
        record_id: 7,
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        user_avatar: null,
      },
      {
        id: 4,
        user_name: 'Mariam Rashid',
        action: 'expense',
        description: 'Aliingiza gharama ya umeme',
        table_name: 'expenses',
        record_id: 23,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        user_avatar: null,
      },
      {
        id: 5,
        user_name: 'Ahmed Juma',
        action: 'reading',
        description: 'Alifanya usomaji wa mita BN004',
        table_name: 'machine_readings',
        record_id: 122,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        user_avatar: null,
      },
    ],
    pendingMachines: [
      {
        id: 3,
        machine_code: 'BN003',
        machine_name: 'Bonanza Mbagala',
        branch_name: 'Mbagala',
        last_reading: 245700,
        last_reading_date: '2025-06-13',
      },
      {
        id: 8,
        machine_code: 'BN008',
        machine_name: 'Bonanza Tandale',
        branch_name: 'Kariakoo',
        last_reading: 112300,
        last_reading_date: '2025-06-13',
      },
      {
        id: 11,
        machine_code: 'BN011',
        machine_name: 'Bonanza Magomeni',
        branch_name: 'Kinondoni',
        last_reading: 89400,
        last_reading_date: '2025-06-12',
      },
    ],
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
    // Demo: "fetch" data synchronously (just sets loading briefly for demo)
    async fetchDashboardData() {
      this.loading = true
      this.error = null
      try {
        // Simulate async delay (optional)
        await new Promise((resolve) => setTimeout(resolve, 500))
        // Data is already in state; no API call needed
        // If you want to refresh demo data dynamically, you can regenerate here
        return this.dashboardData
      } catch (err) {
        this.error = 'Demo data error'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchRecentActivities(limit = 5) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      // Return first 'limit' items (demo data already present)
      this.recentActivities = this.recentActivities.slice(0, limit)
      return this.recentActivities
    },

    async fetchPendingMachines() {
      await new Promise((resolve) => setTimeout(resolve, 300))
      // Demo pending machines already set
      return this.pendingMachines
    },

    async refreshAll() {
      await Promise.all([
        this.fetchDashboardData(),
        this.fetchRecentActivities(5),
        this.fetchPendingMachines(),
      ])
    },

    clearDashboard() {
      this.dashboardData = {
        total_machines: 0,
        active_machines: 0,
        today_revenue: 0,
        monthly_revenue: 0,
        total_collections: 0,
        pending_readings: 0,
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
