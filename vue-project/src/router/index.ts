import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layout/AppLayout.vue'
import HomeView from '../views/HomeView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import MemberListView from '../views/members/MemberListView.vue'
import MemberForm from '../views/members/MemberForm.vue'

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

export default router
