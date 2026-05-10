<template>
  <div class="dashboard-screen">
    <header class="top-nav">
      <h2>진행 중인 현장</h2>
      <div class="nav-buttons">
        <button class="add-btn" @click="$router.push('/project/add')">+ 추가</button>
        <button class="filter-btn" @click="showFilter = true">🔍 필터</button>
      </div>
    </header>

    <!-- 인라인 스타일 제거 & 클래스 부여 -->
    <div class="action-section">
      <button class="client-manage-btn" @click="$router.push('/clients')">
        🏢 거래처(발주처) 관리 가기
      </button>
    </div>

    <div v-if="showFilter" class="modal-overlay" @click.self="showFilter = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>현장 검색 필터</h3>
          <button class="close-btn" @click="showFilter = false">✖</button>
        </div>

        <div class="form-group">
          <label>발주처</label>
          <select v-model="filter.clientId" class="form-select" style="flex: 1">
            <option value="">전체 보기</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.name }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>시작일 (이후)</label>
            <input type="date" v-model="filter.startDate" class="form-input" />
          </div>
          <div class="form-group">
            <label>종료일 (이전)</label>
            <input type="date" v-model="filter.endDate" class="form-input" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="reset-btn" @click="resetFilter">초기화</button>
          <button class="apply-btn" @click="applyFilter">적용하기</button>
        </div>
      </div>
    </div>

    <div class="project-list">
      <div v-if="loading" class="loading-msg">데이터를 불러오는 중입니다...</div>
      <div v-else-if="projects.length === 0" class="empty-msg">조건에 맞는 현장이 없습니다.</div>
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
            <p v-if="project.client" class="client-name">🏢 {{ project.client.name }}</p>
            <p class="project-period">
              📅 {{ project.startDate }} ~ {{ project.endDate || '미정' }}
            </p>
          </div>

          <!-- 오른쪽: 수금 상황 뱃지 -->
          <div class="card-right">
            <div :class="['status-badge', project.isSettled ? 'settled' : 'unpaid']">
              {{ project.isSettled ? '수금 완료 💰' : '수금 대기' }}
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
const clients = ref([])
const loading = ref(true)
const showFilter = ref(false)

// 필터 상태값 저장
const filter = ref({
  clientId: '',
  startDate: '',
  endDate: '',
})

// 데이터 불러오기 함수 (파라미터 조합 포함)
const fetchProjects = async () => {
  loading.value = true
  try {
    // 값이 있는 필터만 파라미터로 조립 (?clientId=1&startDate=2024-01-01)
    const query = new URLSearchParams()
    if (filter.value.clientId) query.append('clientId', filter.value.clientId)
    if (filter.value.startDate) query.append('startDate', filter.value.startDate)
    if (filter.value.endDate) query.append('endDate', filter.value.endDate)

    const queryString = query.toString() ? `?${query.toString()}` : ''
    projects.value = await api.get(`/projects${queryString}`)
  } catch (error) {
    console.error('현장 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    // 팝업 셀렉트박스용 거래처 목록 미리 불러오기
    clients.value = await api.get('/clients')
    await fetchProjects()
  } catch (error) {
    console.error('초기 데이터 로드 에러:', error)
  }
})

const applyFilter = () => {
  showFilter.value = false
  fetchProjects() // 필터 적용 후 다시 호출
}

const resetFilter = () => {
  filter.value = { clientId: '', startDate: '', endDate: '' }
}
</script>

<style scoped src="../assets/css/dashboard.css"></style>
