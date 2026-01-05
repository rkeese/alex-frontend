import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layout/AppLayout.vue'
import HomeView from '../views/HomeView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
          component: PlaceholderView,
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

export default router
