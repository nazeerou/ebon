// src/stores/tokens.js
import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
// const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

/* ---------------------------------------------------------
 * Helper: extract an array of items from any API shape
 * ------------------------------------------------------- */
function extractArray(payload, ...keys) {
  if (!payload) return []

  const candidates = [payload, payload.data, payload.data?.data]

  for (const c of candidates) {
    if (Array.isArray(c)) return c
  }

  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key]
    if (Array.isArray(payload.data?.[key])) return payload.data[key]
  }

  return []
}

/* ---------------------------------------------------------
 * Helper: extract pagination from a paginated response
 * ------------------------------------------------------- */
function extractPagination(payload) {
  const meta = payload?.data
  if (meta && !Array.isArray(meta) && meta.current_page) {
    return {
      currentPage: meta.current_page,
      lastPage: meta.last_page,
      perPage: meta.per_page,
      total: meta.total,
    }
  }
  return null
}

/* ---------------------------------------------------------
 * Helper: today's date in YYYY-MM-DD
 * ------------------------------------------------------- */
function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export const useTokenStore = defineStore('tokens', {
  /* ---------------------------------------------------------
   * STATE
   * ------------------------------------------------------- */
  state: () => ({
    // tokens
    tokens: [],
    token: null,
    tokenGroups: [],
    groupSummary: {
      grand_total: 0,
      total_tokens: 0,
      total_branches: 0,
    },
    loadingGroups: false,

    // branches (used by TokenForm select)
    branches: [],

    // machines (used by TokenForm machine picker)
    // Each machine may include `last_token: { amount, created_date } | null`
    machines: [],

    // NEW: last branch-level record (used by TokenForm history card)
    branchLastRecord: null,

    // loading flags
    loading: false,
    loadingBranches: false,
    loadingMachines: false,
    loadingHistory: false, // ← NEW
    submitting: false,

    // error / success
    error: null,
    successMessage: null,

    // pagination (tokens list)
    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      total: 0,
    },

    statistics: null,
  }),

  /* ---------------------------------------------------------
   * GETTERS
   * ------------------------------------------------------- */
  getters: {
    getTokens: (state) => state.tokens,
    getToken: (state) => state.token,
    getBranches: (state) => state.branches,
    getMachines: (state) => state.machines,
    getError: (state) => state.error,
    getSuccessMessage: (state) => state.successMessage,
    isLoading: (state) => state.loading,
    isLoadingBranches: (state) => state.loadingBranches,
    isLoadingMachines: (state) => state.loadingMachines,
    isLoadingHistory: (state) => state.loadingHistory,
    isSubmitting: (state) => state.submitting,

    /* Last branch-level record (for history card) */
    getBranchLastRecord: (state) => state.branchLastRecord,

    /* Machines that have a previous token recorded */
    machinesWithHistory: (state) =>
      state.machines.filter((m) => m.last_token && Number(m.last_token.amount) > 0),

    /* Total of all machines' last recorded amounts */
    machinesLastTotal: (state) =>
      state.machines.reduce((sum, m) => {
        const v = Number(m.last_token?.amount) || 0
        return sum + v
      }, 0),

    totalAmount: (state) => state.tokens.reduce((sum, t) => sum + Number(t.amount || 0), 0),

    getTokenGroups: (state) => state.tokenGroups,
    getGroupSummary: (state) => state.groupSummary,
    isLoadingGroups: (state) => state.loadingGroups,

    todayTokens: (state) => {
      const today = todayISO()
      return state.tokens.filter((t) => {
        const date = t.created_date || (t.created_at || '').split('T')[0]
        return date === today
      })
    },

    todayTotal: (state) => {
      const today = todayISO()
      return state.tokens
        .filter((t) => {
          const date = t.created_date || (t.created_at || '').split('T')[0]
          return date === today
        })
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    },

    // tokens grouped by created_date (for reporting)
    tokensByDate: (state) => {
      const groups = {}
      for (const t of state.tokens) {
        const date = t.created_date || (t.created_at || '').split('T')[0]
        if (!groups[date]) groups[date] = []
        groups[date].push(t)
      }
      return groups
    },
  },

  /* ---------------------------------------------------------
   * ACTIONS
   * ------------------------------------------------------- */
  actions: {
    clearError() {
      this.error = null
    },

    clearSuccess() {
      this.successMessage = null
    },

    clearMachines() {
      this.machines = []
    },

    /* NEW: clear branch history */
    clearBranchHistory() {
      this.branchLastRecord = null
    },

    /* NEW: reset both at once (used when switching branch) */
    clearBranchData() {
      this.machines = []
      this.branchLastRecord = null
    },

    /* ---------- BRANCHES ---------- */
    async fetchBranches(params = {}) {
      this.loadingBranches = true
      this.error = null

      const url = `${API_URL}/branches`
      console.log('[tokens] GET', url, params)

      try {
        const response = await axios.get(url, { params })
        console.log('[tokens] branches raw response:', response.data)

        const list = extractArray(response.data, 'branches')
        console.log('[tokens] branches extracted:', list)

        this.branches = list

        const pagination = extractPagination(response.data)
        if (pagination) this.pagination = pagination

        return this.branches
      } catch (err) {
        console.error('[tokens] fetchBranches error:', err)
        this.error = err.response?.data?.message || err.message || 'Imeshindwa kupakia matawi.'
        throw err
      } finally {
        this.loadingBranches = false
      }
    },

    /* ---------- MACHINES ---------- */
    /**
     * Fetch machines for a branch.
     * Each machine should include `last_token` in the API response so the
     * form can show the last recorded amount per machine.
     */
    async fetchMachinesByBranch(branchId, params = {}) {
      this.loadingMachines = true
      this.error = null
      this.machines = []

      const url = `${API_URL}/branches/${branchId}/machines`
      console.log('[tokens] GET', url, params)

      try {
        const response = await axios.get(url, { params })
        console.log('[tokens] machines raw response:', response.data)

        const list = extractArray(response.data, 'machines')

        /* Normalize each machine: ensure `last_token` key exists */
        this.machines = list.map((m) => ({
          ...m,
          last_token: m.last_token ?? null,
        }))

        console.log('[tokens] machines extracted:', this.machines)
        return this.machines
      } catch (err) {
        console.error('[tokens] fetchMachinesByBranch error:', err)
        this.error =
          err.response?.data?.message || err.message || 'Imeshindwa kupakia mashine za tawi hili.'
        throw err
      } finally {
        this.loadingMachines = false
      }
    },

    /* ---------- NEW: BRANCH LAST RECORD ---------- */
    /**
     * Fetch the last branch-level token record (machine_id = null).
     * Returns `null` if there is no prior record (not an error).
     */
    async fetchBranchLastRecord(branchId, params = {}) {
      this.loadingHistory = true
      this.error = null

      const url = `${API_URL}/branches/${branchId}/last-token`
      console.log('[tokens] GET', url, params)

      try {
        const response = await axios.get(url, { params })
        console.log('[tokens] branch last record raw response:', response.data)

        const body = response.data ?? {}

        /* Body may be: { success, data: {...} } | { success, data: null } */
        const record = body.data ?? body ?? null

        if (!record || (typeof record === 'object' && !record.id && !record.amount)) {
          this.branchLastRecord = null
        } else {
          this.branchLastRecord = record
        }

        return this.branchLastRecord
      } catch (err) {
        /* 404 = no record yet → not a real error */
        if (err.response?.status === 404) {
          this.branchLastRecord = null
          return null
        }

        console.error('[tokens] fetchBranchLastRecord error:', err)
        this.error =
          err.response?.data?.message || err.message || 'Imeshindwa kupakia historia ya tawi.'
        throw err
      } finally {
        this.loadingHistory = false
      }
    },

    /* ---------- GROUPED TOKENS ---------- */
    async fetchTokensGroupedByBranch(params = {}) {
      this.loadingGroups = true
      this.error = null

      const url = `${API_URL}/tokens/grouped-by-branch`
      console.log('[tokens] GET', url, params)

      try {
        const response = await axios.get(url, { params })
        const body = response.data ?? {}

        if (body.success === false) {
          this.error = body.message || 'Imeshindwa kupakia taarifa.'
          throw new Error(this.error)
        }

        const data = body.data ?? body
        this.tokenGroups = data.groups ?? []
        this.groupSummary = data.summary ?? {
          grand_total: 0,
          total_tokens: 0,
          total_branches: 0,
        }

        return data
      } catch (err) {
        console.error('[tokens] fetchTokensGroupedByBranch error:', err)
        this.error =
          err.response?.data?.message || err.message || 'Imeshindwa kupakia taarifa za tokens.'
        throw err
      } finally {
        this.loadingGroups = false
      }
    },

    /* ---------- CREATE TOKEN ---------- */
    /**
     * Record new token(s).
     *
     * Supports TWO payload shapes:
     *
     * A) Simple (single record):
     *    { branch_id, amount, created_date?, machine_id?, notes? }
     *
     * B) Bulk (branch + per-machine):
     *    {
     *      branch_id,
     *      branch_amount,        // amount for the whole branch (may be 0)
     *      created_date,
     *      machine_amounts: [
     *        { machine_id, amount },
     *        ...
     *      ]
     *    }
     */
    async createToken(payload) {
      this.submitting = true
      this.error = null
      this.successMessage = null

      const isBulk = payload.machine_amounts !== undefined || payload.branch_amount !== undefined

      /* Build request body */
      const body = {
        branch_id: payload.branch_id,
        created_date: payload.created_date || todayISO(),
      }

      if (isBulk) {
        body.branch_amount = Number(payload.branch_amount) || 0
        body.machine_amounts = Array.isArray(payload.machine_amounts)
          ? payload.machine_amounts
              .filter((row) => row && Number(row.amount) > 0)
              .map((row) => ({
                machine_id: row.machine_id,
                amount: Number(row.amount),
              }))
          : []

        if (payload.notes) body.notes = payload.notes
      } else {
        body.amount = Number(payload.amount) || 0
        if (payload.machine_id) body.machine_id = payload.machine_id
        if (payload.notes) body.notes = payload.notes
      }

      console.log('[tokens] POST', `${API_URL}/tokens`, body)

      try {
        const response = await axios.post(`${API_URL}/tokens`, body)
        const resBody = response.data ?? {}

        if (resBody.success === false) {
          this.error = resBody.message || 'Imeshindwa kurekodi token.'
          throw new Error(this.error)
        }

        const created = resBody.data ?? resBody

        /* If single record → push to top of list */
        if (!isBulk && created && typeof created === 'object') {
          this.tokens.unshift(created)
        }

        this.token = created
        this.successMessage = resBody.message || 'Token imerekodiwa kikamilifu!'

        return created
      } catch (err) {
        console.error('[tokens] createToken error:', err)
        this.error =
          err.response?.data?.message || err.message || 'Imeshindwa kurekodi token. Jaribu tena.'
        throw err
      } finally {
        this.submitting = false
      }
    },

    /* ---------- READ TOKENS ---------- */
    async fetchTokens(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/tokens`, { params })
        const list = extractArray(response.data, 'tokens')
        this.tokens = list

        const pagination = extractPagination(response.data)
        if (pagination) this.pagination = pagination

        return list
      } catch (err) {
        console.error('[tokens] fetchTokens error:', err)
        this.error = err.response?.data?.message || 'Imeshindwa kupakia tokens.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ---------- STATISTICS ---------- */
    async fetchStatistics() {
      try {
        const response = await axios.get(`${API_URL}/tokens/statistics`)
        const body = response.data ?? {}
        if (body.success !== false) this.statistics = body.data ?? body
      } catch (error) {
        console.error('[tokens] fetchStatistics error:', error)
      }
    },
  },
})
