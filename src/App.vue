<template>
  <div id="app">
    <transition name="slide-down">
      <div v-if="isToastVisible" class="toast-container" :class="toastType">
        {{ toastMessage }}
      </div>
    </transition>
    <div v-if="isConfirmVisible" class="modal-overlay">
      <div class="confirm-modal">
        <p class="confirm-msg">{{ confirmMessage }}</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="onConfirmResponse(false)">취소</button>
          <button class="confirm-btn" @click="onConfirmResponse(true)">확인</button>
        </div>
      </div>
    </div>
    <!-- 로그인 페이지가 아닐 때만 전역 헤더 표시 -->
    <header v-if="showGlobalHeader" class="global-user-header">
      <div class="user-info">
        <span class="user-badge">반장</span>
        <span class="user-name"
          ><strong>{{ userName }}</strong> 님 반갑습니다.</span
        >
      </div>
      <button class="global-logout-btn" @click="handleLogout">로그아웃</button>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isToastVisible, toastMessage, toastType } from '@/stores/toast.js'
import {
  isConfirmVisible,
  confirmMessage,
  onConfirmResponse,
  showConfirm,
} from '@/stores/confirm.js'

const route = useRoute()
const router = useRouter()
const userName = ref('')

// 페이지(route)가 바뀔 때마다 실행됨
watch(
  () => route.path,
  () => {
    userName.value = localStorage.getItem('userName') || '사용자'
  },
  { immediate: true },
) // 화면이 처음 켜질 때도 즉시 실행

// 로그인, 회원가입 페이지에서는 전역 헤더를 숨깁니다.
const showGlobalHeader = computed(() => {
  return !['Login', 'Signup', 'Root'].includes(route.name)
})

const handleLogout = async () => {
  if (await showConfirm('로그아웃 하시겠습니까?')) {
    localStorage.clear() // 토큰, 이름 등 삭제
    sessionStorage.removeItem('projectSearchFilter')
    userName.value = '' // 변수도 비워줌
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
  position: sticky;
  top: 0;
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

/* 🎨 토스트 스타일 */
.toast-container {
  position: fixed;
  top: 60px; /* 전역 헤더 바로 아래에 뜨게 조절 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  text-align: center;
}

/* 초록색 (성공) */
.toast-container.success {
  background-color: #10b981;
}

/* 빨간색 (에러/강한 경고) */
.toast-container.error {
  background-color: #ef4444;
}

/* 노란색 (주의) - 필요하시면 추가하세요! */
.toast-container.warning {
  background-color: #f59e0b;
  color: #ffffff;
}

/* 파란색 (일반 정보) - 필요하시면 추가하세요! */
.toast-container.info {
  background-color: #3b82f6;
}

/* ✨ 상단 슬라이드 애니메이션 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translate(-50%, -100%);
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5); /* 어두운 배경 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.confirm-modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 85%;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.confirm-msg {
  margin-bottom: 24px;
  line-height: 1.5;
  font-weight: 500;
  white-space: pre-wrap;
  word-break: break-all;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}
.confirm-actions button {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-weight: bold;
}
.cancel-btn {
  background: #f3f4f6;
  color: #4b5563;
}
.confirm-btn {
  background: #3b82f6;
  color: white;
}
</style>
