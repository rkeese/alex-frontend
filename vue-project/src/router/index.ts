import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layout/AppLayout.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import MemberListView from '../views/members/MemberListView.vue'
import MemberForm from '../views/members/MemberForm.vue'
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
        },
        {
          path: 'members/create',
          name: 'members-create',
          component: MemberForm,
        },
        {
          path: 'members/:id/edit',
          name: 'members-edit',
          component: MemberForm,
        },
        {
          path: 'departments',
          name: 'departments',
          component: PlaceholderView,
        },
        {
          path: 'finance/receipts',
          name: 'receipts',
          component: PlaceholderView,
        },
        {
          path: 'finance/accounts',
          name: 'accounts',
          component: PlaceholderView,
        },
        {
          path: 'calendar',
          name: 'calendar',
          component: PlaceholderView,
        },
        {
          path: 'documents',
          name: 'documents',
          component: PlaceholderView,
        },
      ]
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isPublic = to.matched.some(record => record.meta.public);

  if (!isPublic && !authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return next({ name: 'home' });
  }

  next();
});

export default router
