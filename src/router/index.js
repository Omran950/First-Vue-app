import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import SecondView from '@/views/SecondView.vue'
import ThirdView from '@/views/ThirdView.vue'
import NotFound from '@/views/NotFound.vue'
import Viewer from '@/components/Viewer.vue'

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
        {
          path: '/viewer',
          name: 'Viewer',
          component: Viewer,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
    },
  ],
})

export default router
