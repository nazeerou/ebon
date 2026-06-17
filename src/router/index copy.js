import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

// Auth pages
import Login from '@/views/auth/Login.vue'

// Dashboard
import Dashboard from '@/views/Dashboard.vue'

// Customer pages
import CustomerList from '@/views/customers/CustomerList.vue'
import CustomerCreate from '@/views/customers/CustomerForm.vue'
import CustomerDetail from '@/views/customers/CustomerDetail.vue'
import CustomerEdit from '@/views/customers/CustomerEdit.vue'

// User pages
import UserList from '@/views/users/UserList.vue'

// Loan pages
import LoanList from '@/views/loans/LoanList.vue'
import LoanForm from '@/views/loans/LoanForm.vue'
import LoanDetail from '@/views/loans/LoanDetail.vue'
import PendingLoan from '@/views/loans/PendingLoan.vue'
import LoanPenalty from '@/views/loans/LoanPenalty.vue'

// Payment pages
import PaymentList from '@/views/payments/PaymentList.vue'
import RecordPayment from '@/views/payments/RecordPayment.vue'

// Collateral pages
import CollateralList from '@/views/collaterals/CollateralList.vue'
import CollateralDetail from '@/views/collaterals/CollateralDetail.vue'

// Report pages
import Report from '@/views/reports/Report.vue'

// 404 page
import NotFound from '@/views/errors/NotFound.vue'

const routes = [
  // Public routes - NO authentication required
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresGuest: true,
      title: 'Login - TAMARA MicroFinance',
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
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/UserProfile.vue'),
        meta: {
          title: 'Wasifu Wangu',
          icon: 'user-circle',
        },
      },
      {
        path: 'customers',
        name: 'Customers',
        component: CustomerList,
        meta: {
          title: 'Wateja',
          icon: 'users',
        },
      },
      {
        path: 'customers/create',
        name: 'CustomerCreate',
        component: CustomerCreate,
        meta: {
          title: 'Sajili Mteja',
          icon: 'user-plus',
        },
      },
      {
        path: 'customers/:id',
        name: 'CustomerDetail',
        component: CustomerDetail,
        meta: {
          title: 'Taarifa za Mteja',
          icon: 'user',
        },
      },
      {
        path: 'customers/:id/edit',
        name: 'CustomerEdit',
        component: CustomerEdit,
        meta: {
          title: 'Hariri Mteja',
          icon: 'user-edit',
        },
      },
      {
        path: 'users',
        name: 'Users',
        component: UserList,
        meta: {
          title: 'Watumiaji Mfumo',
          icon: 'users',
        },
      },
      {
        path: 'loans',
        name: 'Loans',
        component: LoanList,
        meta: {
          title: 'Mikopo',
          icon: 'hand-holding-usd',
        },
      },
      {
        path: 'loans/create',
        name: 'Ombi la Mkopo',
        component: LoanForm,
        meta: {
          title: 'Ombi la Mkopo',
          icon: 'plus-circle',
        },
      },
      {
        path: 'loans/:id/edit',
        name: 'LoanForm',
        component: LoanForm,
        meta: {
          title: 'Ombi la Mkopo',
          icon: 'plus-circle',
        },
      },
      {
        path: 'loans/pending',
        name: 'PendingLoans',
        component: PendingLoan,
        meta: {
          title: 'Mikopo Inayosubiri',
          icon: 'clock',
        },
      },
      {
        path: 'loans/penalty',
        name: 'PenaltyLoans',
        component: LoanPenalty,
        meta: {
          title: 'Mikopo Inayopitiliza - Yenye Penalty',
          icon: 'clock',
        },
      },
      {
        path: 'loans/:id',
        name: 'LoanDetail',
        component: LoanDetail,
        meta: {
          title: 'Taarifa za Mkopo',
          icon: 'file-invoice',
        },
      },
      {
        path: 'payments',
        name: 'Payments',
        component: PaymentList,
        meta: {
          title: 'Malipo',
          icon: 'money-bill-wave',
        },
      },
      {
        path: 'payments/create',
        name: 'PaymentRecord',
        component: RecordPayment,
        meta: {
          title: 'Rekodi Malipo',
          icon: 'cash-register',
        },
      },
      {
        path: 'collateral',
        name: 'Collateral',
        component: CollateralList,
        meta: {
          title: 'Dhamana',
          icon: 'gem',
        },
      },
      {
        path: 'collateral/:id',
        name: 'CollateralDetail',
        component: CollateralDetail,
        meta: {
          title: 'Taarifa za Dhamana',
          icon: 'info-circle',
        },
      },
      {
        path: 'reports',
        name: 'Report',
        component: Report,
        meta: {
          title: 'Ripoti',
          icon: 'chart-bar',
        },
      },
    ],
  },

  // 404 page - MUST be last - catches all unmatched routes
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
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Navigation guard - FIXED to properly handle 404
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Update page title
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // Check if route exists in our routes
  const routeExists = router.getRoutes().some((route) => {
    // Skip the catch-all route itself
    if (route.name === 'NotFound') return false

    // Check if the route matches the path
    if (route.path === to.path) return true

    // Check for dynamic route matches
    const routePathRegex = routePathToRegex(route.path)
    if (routePathRegex && routePathRegex.test(to.path)) return true

    return false
  })

  // If route doesn't exist and it's not the login page, redirect to 404
  if (!routeExists && to.path !== '/login' && to.name !== 'NotFound') {
    next({ name: 'NotFound' })
    return
  }

  // Allow access to login page even if not authenticated
  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      next('/dashboard')
    } else {
      next()
    }
  }
  // Allow access to 404 page
  else if (to.name === 'NotFound') {
    next()
  }
  // All other routes require authentication
  else if (!authStore.isAuthenticated) {
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
