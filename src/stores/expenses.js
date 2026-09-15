// src/stores/expenses.js
import { defineStore } from 'pinia'
import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ebon.bas.co.tz/api/v1'

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

export const useExpenseStore = defineStore('expenses', {
  state: () => ({
    expenses: [],
    expense: null,

    loading: false,
    submitting: false,

    error: null,
    successMessage: null,

    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      total: 0,
    },

    statistics: null,
  }),

  getters: {
    getExpenses: (state) => state.expenses,
    getExpense: (state) => state.expense,
    getError: (state) => state.error,
    getSuccessMessage: (state) => state.successMessage,
    isLoading: (state) => state.loading,
    isSubmitting: (state) => state.submitting,

    totalAmount: (state) => state.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
  },

  actions: {
    clearError() {
      this.error = null
    },

    clearSuccess() {
      this.successMessage = null
    },

    /* ---------- LIST ---------- */
    async fetchExpenses(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_URL}/expenses`, { params })
        const list = extractArray(response.data, 'expenses')
        this.expenses = list

        const pagination = extractPagination(response.data)
        if (pagination) this.pagination = pagination

        return list
      } catch (err) {
        console.error('[expenses] fetchExpenses error:', err)
        this.error = err.response?.data?.message || 'Imeshindwa kupakia gharama.'
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ---------- CREATE ---------- */
    async createExpense(payload) {
      this.submitting = true
      this.error = null
      this.successMessage = null

      const body = {
        name: payload.name,
        description: payload.description ?? null,
        amount: payload.amount,
        branch_id: payload.branch_id ?? null,
        expense_date: payload.expense_date,
      }

      try {
        const response = await axios.post(`${API_URL}/expenses`, body)
        const resBody = response.data ?? {}

        if (resBody.success === false) {
          this.error = resBody.message || 'Imeshindwa kurekodi gharama.'
          throw new Error(this.error)
        }

        const created = resBody.data ?? resBody
        if (created && typeof created === 'object') this.expenses.unshift(created)
        this.expense = created
        this.successMessage = resBody.message || 'Gharama imerekodiwa kikamilifu!'

        return created
      } catch (err) {
        console.error('[expenses] createExpense error:', err)
        this.error = err.response?.data?.message || err.message || 'Imeshindwa kurekodi gharama.'
        throw err
      } finally {
        this.submitting = false
      }
    },

    /* ---------- UPDATE ---------- */
    async updateExpense(id, payload) {
      this.submitting = true
      this.error = null
      this.successMessage = null

      try {
        const response = await axios.put(`${API_URL}/expenses/${id}`, payload)
        const updated = response.data?.data ?? response.data

        const idx = this.expenses.findIndex((e) => e.id === id)
        if (idx !== -1) this.expenses.splice(idx, 1, updated)

        this.successMessage = response.data?.message || 'Gharama imeupdate-iwa!'
        return updated
      } catch (err) {
        this.error = err.response?.data?.message || 'Imeshindwa kuupdate gharama.'
        throw err
      } finally {
        this.submitting = false
      }
    },

    /* ---------- DELETE ---------- */
    async deleteExpense(id) {
      this.submitting = true
      this.error = null

      try {
        await axios.delete(`${API_URL}/expenses/${id}`)
        this.expenses = this.expenses.filter((e) => e.id !== id)
        this.successMessage = 'Gharama imefutwa!'
      } catch (err) {
        this.error = err.response?.data?.message || 'Imeshindwa kufuta gharama.'
        throw err
      } finally {
        this.submitting = false
      }
    },

    /* ---------- STATISTICS ---------- */
    async fetchStatistics() {
      try {
        const response = await axios.get(`${API_URL}/expenses/statistics`)
        const body = response.data ?? {}
        if (body.success !== false) this.statistics = body.data ?? body
      } catch (err) {
        console.error('[expenses] fetchStatistics error:', err)
      }
    },
  },
})
