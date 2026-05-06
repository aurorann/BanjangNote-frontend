<template>
  <div id="app">
    <!-- 로그인 페이지가 아닐 때만 전역 헤더 표시 -->
    <header v-if="showGlobalHeader" class="global-user-header">
      <div class="user-info">
        <span class="user-badge">반장</span>
        <span class="user-name"><strong>{{ userName }}</strong> 님 반갑습니다.</span>
      </div>
      <button class="global-logout-btn" @click="handleLogout">로그아웃</button>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userName = ref(localStorage.getItem('userName') || '사용자')

// 로그인, 회원가입 페이지에서는 전역 헤더를 숨깁니다.
const showGlobalHeader = computed(() => {
  return !['Login', 'Signup', 'Root'].includes(route.name)
})

const handleLogout = () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    localStorage.clear() // 토큰, 이름 등 삭제
    router.push('/')
  }
}
</script>

<style>
.global-user-header {
  background-color: #1f2937;
  color: white;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  width: 100%; /* 부모 500px 안에서 꽉 참 */
}

.user-info {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.user-badge {
  background-color: #3b82f6;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 8px;
  font-weight: bold;
}

.global-logout-btn {
  background: none;
  border: 1px solid #4b5563;
  color: #d1d5db;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}

.global-logout-btn:hover {
  background-color: #374151;
  color: white;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
