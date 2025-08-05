import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import SecondView from '@/views/SecondView.vue'
import ThirdView from '@/views/ThirdView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'Home',
          component: HomeView,
        },
        {
          path: '/second',
          name: 'Second',
          component: SecondView,
        },
        {
          path: '/third',
          name: 'Third',
          component: ThirdView,
        },
      ],
    },
  ],
})

export default router
