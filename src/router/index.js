import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import ProjectAdd from '../views/ProjectAdd.vue'
import ProjectDetail from '../views/ProjectDetail.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: Login },
    { path: '/dashboard', name: 'dashboard', component: Dashboard },
    { path: '/project/add', name: 'projectAdd', component: ProjectAdd },
    // :id 는 주소창에 /project/1, /project/2 처럼 번호가 들어올 수 있게 해줍니다.
    {
      path: '/project/edit/:id',
      name: 'projectEdit',
      component: ProjectAdd,
    },
    {
      path: '/project/:id',
      name: 'projectDetail',
      component: ProjectDetail,
    },
  ],
})

export default router
