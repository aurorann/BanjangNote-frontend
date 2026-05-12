import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import ProjectAdd from '../views/ProjectAdd.vue'
import ProjectDetail from '../views/ProjectDetail.vue'
import ClientList from '@/views/ClientList.vue'
import { toast } from '@/stores/toast.js'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/project/add', name: 'ProjectAdd', component: ProjectAdd, meta: { requiresAuth: true } },
  { path: '/project/edit/:id', name: 'ProjectEdit', component: ProjectAdd, meta: { requiresAuth: true } },
  { path: '/project/:id', name: 'ProjectDetail', component: ProjectDetail, meta: { requiresAuth: true } },
  { path: '/clients', name: 'ClientList', component: ClientList, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 👮‍♂️ 라우터 보초병 (Navigation Guard)
// 화면을 이동할 때마다 '토큰(통행증)'이 있는지 검사
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')

  // 가려는 화면이 'requiresAuth(로그인 필수)'인데 토큰 없을경우
  if (to.meta.requiresAuth && !token) {
    toast.error('로그인이 필요한 서비스입니다.')
    return '/' // ⬅️ next('/') 대신 return '/' 사용
  }

  return true // ⬅️ next() 대신 return true 사용하여 통과
})

export default router
