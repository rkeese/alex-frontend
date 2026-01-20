import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layout/AppLayout.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import MemberListView from '../views/members/MemberListView.vue'
import MemberStatisticsView from '../views/members/MemberStatisticsView.vue'
import BirthdayListView from '../views/members/BirthdayListView.vue'
import AnniversaryListView from '../views/members/AnniversaryListView.vue'
import MemberForm from '../views/members/MemberForm.vue'
import MemberImportView from '../views/members/MemberImportView.vue'
import SepaDirectDebitView from '../views/members/SepaDirectDebitView.vue'
import UserManagementView from '../views/admin/UserManagementView.vue'
import ClubSettingsView from '../views/admin/ClubSettingsView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { public: true }
    },
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'members',
          name: 'members',
          component: MemberListView,
          meta: { permission: 'members:read' }
        },
        {
          path: 'members/create',
          name: 'members-create',
          component: MemberForm,
          meta: { permission: 'members:write' }
        },
        {
          path: 'members/import',
          name: 'members-import',
          component: MemberImportView,
          meta: { permission: 'members:write' }
        },
        {
          path: 'members/sepa',
          name: 'members-sepa',
          component: SepaDirectDebitView,
          meta: { permission: 'finance:read' }
        },
        {
          path: 'members/statistics',
          name: 'members-statistics',
          component: MemberStatisticsView,
          meta: { permission: 'members:read' }
        },
        {
          path: 'members/birthdays',
          name: 'members-birthdays',
          component: BirthdayListView,
          meta: { permission: 'members:read' }
        },
        {
          path: 'members/anniversaries',
          name: 'members-anniversaries',
          component: AnniversaryListView,
          meta: { permission: 'members:read' }
        },
        {
          path: 'members/:id/edit',
          name: 'members-edit',
          component: MemberForm,
          meta: { permission: 'members:write' }
        },
        {
          path: 'departments',
          name: 'departments',
          component: PlaceholderView,
          meta: { permission: 'departments:read' }
        },
        {
          path: 'finance/receipts',
          name: 'receipts',
          component: PlaceholderView,
          meta: { permission: 'finance:read' }
        },
        {
          path: 'finance/accounts',
          name: 'accounts',
          component: PlaceholderView,
          meta: { permission: 'finance:read' }
        },
        {
          path: 'calendar',
          name: 'calendar',
          component: PlaceholderView,
          meta: { permission: 'calendar:read' }
        },
        {
          path: 'documents',
          name: 'documents',
          component: PlaceholderView,
          meta: { permission: 'documents:read' }
        },
        {          path: 'admin/club-settings',
          name: 'club-settings',
          component: ClubSettingsView,
          meta: { permission: 'club:write' }
        },
        {            path: 'admin/users',
            name: 'admin-users',
            component: UserManagementView,
            meta: { permission: 'users:manage' } // Assuming this permission exists or needs to be added to RBAC
        },
        {
            path: 'admin/clubs',
            name: 'admin-clubs',
            component: () => import('../views/admin/ClubManagementView.vue'),
            meta: { permission: 'clubs:manage' }
        }
      ]
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isPublic = to.matched.some(record => record.meta.public);
  const requiredPermission = to.meta.permission as string | undefined;

  if (!isPublic && !authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return next({ name: 'home' });
  }

  if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
    // If user doesn't have permission, redirect to home or show unauthorized
    // ideally, home if accessible, or maybe stay on current page
    console.warn(`User missing permission: ${requiredPermission}`);
    return next({ name: 'home' });
  }

  next();
});

export default router
