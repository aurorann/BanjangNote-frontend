<template>
  <div class="dashboard-screen">
    <header class="top-nav">
      <h2>진행 중인 현장</h2>
      <div class="nav-buttons">
        <button class="add-btn" @click="$router.push('/project/add')">+ 추가</button>
        <button class="logout-btn" @click="$router.push('/')">로그아웃</button>
      </div>
    </header>

    <div class="project-list">
      <!-- 서버에서 데이터를 불러오는 중일 때 -->
      <div v-if="loading" style="text-align: center; padding: 20px; color: #888">
        데이터를 불러오는 중입니다...
      </div>

      <!-- 진짜 데이터가 들어갈 카드 영역! -->
      <div
        v-else
        class="project-card"
        v-for="project in projects"
        :key="project.id"
        @click="$router.push(`/project/${project.id}`)"
      >
        <div
          class="card-header"
          style="display: flex; justify-content: space-between; margin-bottom: 10px"
        >
          <div class="badge">진행중</div>
          <!-- 🔥 업체 수금 상태를 뱃지로 보여줍니다 -->
          <div :class="project.isSettled ? 'status-badge settled' : 'status-badge unpaid'">
            {{ project.isSettled ? '수금 완료 💰' : '수금 대기' }}
          </div>
        </div>
        <h3>{{ project.name }}</h3>
        <!-- 백엔드에서 업체(Client) 정보도 같이 가져옵니다 -->
        <p v-if="project.client" style="color: #3b82f6; font-weight: bold; margin-bottom: 5px">
          🏢 발주처: {{ project.client.name }}
        </p>
        <p>기간: {{ project.startDate }} ~ {{ project.endDate || '미정' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api/index.js'

const projects = ref([])
const loading = ref(true)

// 화면이 켜지자마자 실행되는 함수 (Spring Boot API 호출)
onMounted(async () => {
  try {
    const data = await api.get('/projects')
    projects.value = data // 받아온 진짜 데이터를 화면 변수에 쏙 넣습니다
    console.log('백엔드에서 받은 데이터:', data)
  } catch (error) {
    console.error('데이터를 불러오지 못했습니다:', error)
    alert('DB 연결 또는 서버를 확인해주세요!')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.status-badge.unpaid {
  background-color: #fee2e2;
  color: #b91c1c;
}
.status-badge.settled {
  background-color: #dcfce3;
  color: #15803d;
}
</style>
