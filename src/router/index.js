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
// import MachineForm from '@/views/machines/MachineForm.vue'
// import MachineDetail from '@/views/machines/MachineDetail.vue'

// // Branch pages
import BranchList from '@/views/branches/BranchList.vue'
// import BranchForm from '@/views/branches/BranchForm.vue'

// // Operator pages (Users)
// import OperatorList from '@/views/operators/OperatorList.vue'
// import OperatorForm from '@/views/operators/OperatorForm.vue'

// // Meter Reading pages
import ReadingList from '@/views/readings/ReadingList.vue'
import OCRScanner from '@/views/readings/OCRScanner.vue'
// import ReadingDetail from '@/views/readings/ReadingDetail.vue'

// // Collection pages
import CollectionList from '@/views/collections/CollectionList.vue'
// import CollectionForm from '@/views/collections/CollectionForm.vue'

// // Expense pages
// import ExpenseList from '@/views/expenses/ExpenseList.vue'
// import ExpenseForm from '@/views/expenses/ExpenseForm.vue'

// // Report pages
// import DailyReport from '@/views/reports/DailyReport.vue'
// import MonthlyReport from '@/views/reports/MonthlyReport.vue'
// import RevenueReport from '@/views/reports/RevenueReport.vue'
// import MachinePerformanceReport from '@/views/reports/MachinePerformanceReport.vue'

// // Audit Trail
// import AuditTrailList from '@/views/audit/AuditTrailList.vue'

// // Daily Closing
// import DailyClosingList from '@/views/closing/DailyClosingList.vue'

// // Notifications
// import NotificationList from '@/views/notifications/NotificationList.vue'

// // Settings
// import Settings from '@/views/settings/Settings.vue'

// // Profile
// import Profile from '@/views/profile/Profile.vue'

// // 404 page
// import NotFound from '@/views/errors/NotFound.vue'

const routes = [
  // Public routes - NO authentication required
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresGuest: true,
      title: 'Login - Bonanza Management System',
    },
  },

  // Root path - redirect to dashboard
  {
    path: '/',
    redirect: '/dashboard',
  },

  // Protected routes - ALL require authentication
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
        meta: {
          title: 'Dashibodi',
          icon: 'chart-pie',
        },
      },
      // {
      //   path: 'profile',
      //   name: 'Profile',
      //   component: Profile,
      //   meta: {
      //     title: 'Wasifu Wangu',
      //     icon: 'user-circle',
      //   },
      // },
      {
        path: 'machines',
        name: 'Machines',
        component: MachineList,
        meta: {
          title: 'Mashine',
          icon: 'microchip',
        },
      },
      // {
      //   path: 'machines/create',
      //   name: 'MachineCreate',
      //   component: MachineForm,
      //   meta: {
      //     title: 'Sajili Mashine',
      //     icon: 'plus-circle',
      //   },
      // },
      // {
      //   path: 'machines/:id',
      //   name: 'MachineDetail',
      //   component: MachineDetail,
      //   meta: {
      //     title: 'Taarifa za Mashine',
      //     icon: 'info-circle',
      //   },
      // },
      // {
      //   path: 'machines/:id/edit',
      //   name: 'MachineEdit',
      //   component: MachineForm,
      //   meta: {
      //     title: 'Hariri Mashine',
      //     icon: 'edit',
      //   },
      // },
      {
        path: 'branches',
        name: 'Branches',
        component: BranchList,
        meta: {
          title: 'Matawi',
          icon: 'store',
        },
      },
      // {
      //   path: 'branches/create',
      //   name: 'BranchCreate',
      //   component: BranchForm,
      //   meta: {
      //     title: 'Sajili Tawi',
      //     icon: 'plus-circle',
      //   },
      // },
      // {
      //   path: 'branches/:id/edit',
      //   name: 'BranchEdit',
      //   component: BranchForm,
      //   meta: {
      //     title: 'Hariri Tawi',
      //     icon: 'edit',
      //   },
      // },
      // {
      //   path: 'operators',
      //   name: 'Operators',
      //   component: OperatorList,
      //   meta: {
      //     title: 'Watumiaji',
      //     icon: 'users',
      //   },
      // },
      // {
      //   path: 'operators/create',
      //   name: 'OperatorCreate',
      //   component: OperatorForm,
      //   meta: {
      //     title: 'Sajili Mtumiaji',
      //     icon: 'user-plus',
      //   },
      // },
      // {
      //   path: 'operators/:id/edit',
      //   name: 'OperatorEdit',
      //   component: OperatorForm,
      //   meta: {
      //     title: 'Hariri Mtumiaji',
      //     icon: 'user-edit',
      //   },
      // },
      {
        path: 'readings',
        name: 'Readings',
        component: ReadingList,
        meta: {
          title: 'Usomaji wa Mita',
          icon: 'camera',
        },
      },
      {
        path: 'readings/ocr',
        name: 'OCRScanner',
        component: OCRScanner,
        meta: {
          title: 'Soma Mita (OCR)',
          icon: 'camera-retro',
        },
      },
      // {
      //   path: 'readings/:id',
      //   name: 'ReadingDetail',
      //   component: ReadingDetail,
      //   meta: {
      //     title: 'Taarifa za Usomaji',
      //     icon: 'file-alt',
      //   },
      // },
      {
        path: 'collections',
        name: 'Collections',
        component: CollectionList,
        meta: {
          title: 'Makusanyo',
          icon: 'hand-holding-usd',
        },
      },
      // {
      //   path: 'collections/create',
      //   name: 'CollectionCreate',
      //   component: CollectionForm,
      //   meta: {
      //     title: 'Rekodi Makusanyo',
      //     icon: 'cash-register',
      //   },
      // },
      // {
      //   path: 'expenses',
      //   name: 'Expenses',
      //   component: ExpenseList,
      //   meta: {
      //     title: 'Gharama',
      //     icon: 'receipt',
      //   },
      // },
      // {
      //   path: 'expenses/create',
      //   name: 'ExpenseCreate',
      //   component: ExpenseForm,
      //   meta: {
      //     title: 'Rekodi Gharama',
      //     icon: 'plus-circle',
      //   },
      // },
      // {
      //   path: 'reports/daily',
      //   name: 'DailyReport',
      //   component: DailyReport,
      //   meta: {
      //     title: 'Ripoti ya Siku',
      //     icon: 'calendar-day',
      //   },
      // },
      // {
      //   path: 'reports/monthly',
      //   name: 'MonthlyReport',
      //   component: MonthlyReport,
      //   meta: {
      //     title: 'Ripoti ya Mwezi',
      //     icon: 'calendar-alt',
      //   },
      // },
      // {
      //   path: 'reports/revenue',
      //   name: 'RevenueReport',
      //   component: RevenueReport,
      //   meta: {
      //     title: 'Ripoti ya Mapato',
      //     icon: 'chart-line',
      //   },
      // },
      // {
      //   path: 'reports/machine-performance',
      //   name: 'MachinePerformanceReport',
      //   component: MachinePerformanceReport,
      //   meta: {
      //     title: 'Utendaji wa Mashine',
      //     icon: 'tachometer-alt',
      //   },
      // },
      // {
      //   path: 'audit-trail',
      //   name: 'AuditTrail',
      //   component: AuditTrailList,
      //   meta: {
      //     title: 'Audit Trail',
      //     icon: 'history',
      //   },
      // },
      // {
      //   path: 'daily-closing',
      //   name: 'DailyClosing',
      //   component: DailyClosingList,
      //   meta: {
      //     title: 'Kufunga Siku',
      //     icon: 'lock',
      //   },
      // },
      // {
      //   path: 'notifications',
      //   name: 'Notifications',
      //   component: NotificationList,
      //   meta: {
      //     title: 'Arifa',
      //     icon: 'bell',
      //   },
      // },
      // {
      //   path: 'settings',
      //   name: 'Settings',
      //   component: Settings,
      //   meta: {
      //     title: 'Mipangilio',
      //     icon: 'cog',
      //   },
      // },
    ],
  },

  // 404 page - MUST be last - catches all unmatched routes
  // {
  //   path: '/:pathMatch(.*)*',
  //   name: 'NotFound',
  //   component: NotFound,
  //   meta: {
  //     title: '404 - Ukurasa Haupatikani',
  //     requiresAuth: false,
  //   },
  // },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Update page title
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // Check if route exists in our routes
  const routeExists = router.getRoutes().some((route) => {
    if (route.name === 'NotFound') return false
    if (route.path === to.path) return true
    const routePathRegex = routePathToRegex(route.path)
    if (routePathRegex && routePathRegex.test(to.path)) return true
    return false
  })

  if (!routeExists && to.path !== '/login' && to.name !== 'NotFound') {
    next({ name: 'NotFound' })
    return
  }

  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      next('/dashboard')
    } else {
      next()
    }
  } else if (to.name === 'NotFound') {
    next()
  } else if (!authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

// Helper function to convert route path to regex
function routePathToRegex(path) {
  if (!path.includes(':')) return null
  const regexPattern = path.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/')
  return new RegExp(`^${regexPattern}$`)
}

export default router
