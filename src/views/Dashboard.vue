<template>
  <div class="dashboard-screen">
    <header class="top-nav">
      <h2>진행 중인 현장</h2>
      <div class="nav-buttons">
        <button class="add-btn" @click="$router.push('/project/add')">+ 추가</button>
      </div>
    </header>

    <!-- 인라인 스타일 제거 & 클래스 부여 -->
    <div class="action-section">
      <button class="client-manage-btn" @click="$router.push('/clients')">
        🏢 거래처(발주처) 관리 가기
      </button>
    </div>

    <div class="project-list">
      <div v-if="loading" class="loading-msg">
        데이터를 불러오는 중입니다...
      </div>

      <div
        v-else
        class="project-card"
        v-for="project in projects"
        :key="project.id"
        @click="$router.push(`/project/${project.id}`)"
      >
        <div class="card-content">
          <!-- 왼쪽: 현장 정보 묶음 -->
          <div class="card-body">
            <h3>{{ project.name }}</h3>
            <p v-if="project.client" class="client-name">
              🏢 {{ project.client.name }}
            </p>
            <p class="project-period">
              📅 {{ project.startDate }} ~ {{ project.endDate || '미정' }}
            </p>
          </div>

          <!-- 오른쪽: 수금 상황 뱃지 -->
          <div class="card-right">
            <div :class="['status-badge', project.isSettled ? 'settled' : 'unpaid']">
              {{ project.isSettled ? '완료' : '대기' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api/index.js'

const projects = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await api.get('/projects')
    projects.value = data
  } catch (error) {
    console.error('데이터를 불러오지 못했습니다:', error)
    alert('DB 연결 또는 서버를 확인해주세요!')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped src="../assets/css/dashboard.css"></style>
