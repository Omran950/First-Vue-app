import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import NotFound from '@/views/NotFound.vue'
import ViewerWithButtons from '@/components/ViewerWithButtons.vue'
import ViewerWithoutButtons from '@/components/ViewerWithoutButtons.vue'
import ViewerTest from '@/components/ViewerTest.vue'
import IdleMode from '@/components/SelectionModeOnly.vue'
import SelectionModeOnly from '@/components/SelectionModeOnly.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '/',
          name: 'Viewer',
          component: ViewerWithButtons,
        },
        {
          path: '/without-buttons',
          name: 'ViewerWithoutButtons',
          component: ViewerWithoutButtons,
        },
        {
          path: '/test',
          name: 'ViewerTest',
          component: ViewerTest,
        },
        {
          path: '/selection-only',
          name: 'SelectionModeOnly',
          component: SelectionModeOnly,
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
