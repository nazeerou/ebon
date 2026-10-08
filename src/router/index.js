// router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/Layout/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

// Auth pages
import Login from '@/views/auth/Login.vue'

// Dashboard
import Dashboard from '@/views/Dashboard.vue'

// Machine pages
import MachineList from '@/views/machines/MachineList.vue'
import TokenForm from '@/views/machines/TokenForm.vue'
import TokenList from '@/views/machines/TokenList.vue'

// Branch pages
import BranchList from '@/views/branches/BranchList.vue'

// Reading pages
import ReadingList from '@/views/readings/ReadingList.vue'
import OCRScanner from '@/views/readings/OCRScanner.vue'

// Collection pages
import CollectionList from '@/views/collections/CollectionList.vue'
import BranchesList from '@/views/machines/BranchesList.vue'
import ExpenseList from '@/views/expenses/ExpenseList.vue'
import UserList from '@/views/users/UserList.vue'

// 404 page
import NotFound from '@/views/errors/NotFound.vue'

const routes = [
  /* =========================================================
   * Public routes — NO authentication required
   * ========================================================= */
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresGuest: true,
      title: 'Login - Bonanza Management System',
    },
  },

  /* =========================================================
   * Root redirect
   * ========================================================= */
  {
    path: '/',
    redirect: '/dashboard',
  },

  /* =========================================================
   * Protected routes — ALL require authentication
   * ========================================================= */
  {
    path: '/',
    component: MainLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: 'Dashibodi', icon: 'chart-pie' },
      },
      {
        path: 'branches-machines',
        name: 'BranchesMachines',
        component: BranchesList,
        meta: { title: 'Branches and Machines', icon: 'user-circle' },
      },
      {
        path: 'machines',
        name: 'Machines',
        component: MachineList,
        meta: { title: 'Mashine', icon: 'microchip' },
      },
      {
        path: 'tokens',
        name: 'Tokens',
        component: TokenForm,
        meta: { title: 'Tokens', icon: 'plus-circle' },
      },
      {
        path: 'tokens/lists',
        name: 'TokenList',
        component: TokenList,
        meta: { title: 'Taarifa za Tokens', icon: 'info-circle' },
      },
      {
        path: 'expenses',
        name: 'ExpenseList',
        component: ExpenseList,
        meta: { title: 'Gharama na Matumizi', icon: 'edit' },
      },
      {
        path: 'alerts', // ← fixed: no leading slash
        name: 'OverdueAlerts',
        component: () => import('@/views/alerts/OverdueAlerts.vue'),
        meta: { title: 'Alerts', icon: 'exclamation-triangle' },
      },
      {
        path: 'branches',
        name: 'Branches',
        component: BranchList,
        meta: { title: 'Matawi', icon: 'store' },
      },
      {
        path: 'users',
        name: 'Users',
        component: UserList,
        meta: { title: 'Users', icon: 'plus-circle' },
      },
      {
        path: 'readings',
        name: 'Readings',
        component: ReadingList,
        meta: { title: 'Usomaji wa Mita', icon: 'camera' },
      },
      {
        path: 'readings/ocr',
        name: 'OCRScanner',
        component: OCRScanner,
        meta: { title: 'Soma Mita (OCR)', icon: 'camera-retro' },
      },
      {
        path: 'collections',
        name: 'Collections',
        component: CollectionList,
        meta: { title: 'Makusanyo', icon: 'hand-holding-usd' },
      },
    ],
  },

  /* =========================================================
   * 404 — MUST be last, catches all unmatched routes
   * ========================================================= */
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '404 - Ukurasa Haupatikani',
      requiresAuth: false,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

/* =========================================================
 * Navigation guard — simplified
 * ========================================================= */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Update page title
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // No matched route → 404
  if (to.matched.length === 0) {
    return next({ name: 'NotFound' })
  }

  // Guest-only routes (login) — redirect authenticated users to dashboard
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  // Auth-required routes — redirect guests to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login' })
  }

  next()
})

export default router
