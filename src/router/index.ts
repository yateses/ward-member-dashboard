import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import DailyDashboardView from '../views/DailyDashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'daily',
      component: DailyDashboardView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/import',
      name: 'import',
      component: () => import('../views/ImportView.vue'),
    },
    {
      path: '/members',
      name: 'members',
      component: () => import('../views/MembersView.vue'),
    },
    {
      path: '/households',
      name: 'households',
      component: () => import('../views/HouseholdsView.vue'),
    },
    {
      path: '/callings',
      name: 'callings',
      component: () => import('../views/CallingsView.vue'),
    },
    {
      path: '/families',
      name: 'families',
      component: () => import('../views/FamiliesView.vue'),
    },
    {
      path: '/daily',
      redirect: '/',
    },
    {
      path: '/maps',
      name: 'maps',
      component: () => import('../views/ImageMapView.vue'),
    },
    {
      path: '/youth',
      name: 'youth',
      component: () => import('../views/YouthView.vue'),
    },
  ],
})

export default router
