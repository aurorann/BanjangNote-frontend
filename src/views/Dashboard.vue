<template>
  <div class="dashboard-screen">
    <header class="top-nav">
      <h2>진행 중인 현장</h2>
      <div class="nav-buttons">
        <button class="add-btn" @click="$router.push('/project/add')">+ 추가</button>
        <button class="filter-btn" @click="showFilter = true">🔍 필터</button>
      </div>
    </header>

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

    <div class="filter-summary">
      <div class="summary-content">
        <span class="calendar-icon">📅</span>
        <span class="date-text">
          <template v-if="!filter.startDate && !filter.endDate">전체 기간</template>
          <template v-else>
            {{ filter.startDate || '전체' }} ~ {{ filter.endDate || '전체' }}
          </template>
        </span>
        <span v-if="filter.clientId" class="client-badge">
      🏢 {{ clients.find(c => c.id === filter.clientId)?.name }}
    </span>
      </div>
    </div>

    <div class="project-list">
      <div v-if="loading && page === 0" class="loading-msg">데이터를 불러오는 중입니다...</div>

      <div v-else-if="projects.length === 0" class="empty-msg">조건에 맞는 현장이 없습니다.</div>

      <div
        v-else
        class="project-card"
        v-for="project in projects"
        :key="project.id"
        @click="$router.push(`/project/${project.id}`)"
      >
        <div class="card-content">
          <div class="card-body">
            <h3>{{ project.name }}</h3>
            <p v-if="project.client" class="client-name">🏢 {{ project.client.name }}</p>
            <p class="project-period">
              📅 {{ project.startDate }} ~ {{ project.endDate || '미정' }}
            </p>
          </div>

          <div class="card-right">
            <div :class="['status-badge', project.isSettled ? 'settled' : 'unpaid']">
              {{ project.isSettled ? '수금 완료 💰' : '수금 대기' }}
            </div>
          </div>
        </div>
      </div> <div ref="loadMoreTrigger" class="load-more-area">
      <div v-if="loading && page > 0" class="mini-spinner"></div>
      <p v-if="isLastPage && projects.length > 0" class="end-msg">마지막 현장입니다.</p>
    </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { api } from '@/api/index.js'

const projects = ref([])
const clients = ref([])
const loading = ref(false)
const showFilter = ref(false)

const page = ref(0)
const isLastPage = ref(false)
const loadMoreTrigger = ref(null)
let observer = null

// 기본 날짜 계산 (오늘 기준 -7일, +7일)
const getDefaultDates = () => {
  const today = new Date()

  const start = new Date(today)
  start.setDate(today.getDate() - 7)

  const end = new Date(today)
  end.setDate(today.getDate() + 7)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  }
}

const defaultDates = getDefaultDates()

// 세션 스토리지에서 기존 필터 불러오기
const savedFilter = sessionStorage.getItem('projectSearchFilter')

// 저장된 필터가 있으면 쓰고, 없으면 기본 날짜 세팅
const filter = ref(
  savedFilter ? JSON.parse(savedFilter) : {
    clientId: '',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  }
)

// 필터 값이 바뀔 때마다 세션 스토리지에 자동 저장 (페이지 이동 시 유지용)
watch(filter, (newVal) => {
  sessionStorage.setItem('projectSearchFilter', JSON.stringify(newVal))
}, { deep: true }) // 객체 내부의 값이 바뀌는 것까지 감지


const fetchProjects = async (isNewSearch = false) => {
  if (loading.value || (isLastPage.value && !isNewSearch)) return

  loading.value = true

  if (isNewSearch) {
    page.value = 0
    projects.value = []
    isLastPage.value = false
  }

  try {
    const query = new URLSearchParams()
    if (filter.value.clientId) query.append('clientId', filter.value.clientId)
    if (filter.value.startDate) query.append('startDate', filter.value.startDate)
    if (filter.value.endDate) query.append('endDate', filter.value.endDate)

    query.append('page', page.value)
    query.append('size', 10)

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const response = await api.get(`/projects${queryString}`)

    const newItems = response.content || response
    projects.value.push(...newItems)

    isLastPage.value = response.last ?? (newItems.length < 10)
    if (!isLastPage.value) page.value++

  } catch (error) {
    console.error('현장 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    clients.value = await api.get('/clients')
    await fetchProjects(true)

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLastPage.value && !loading.value) {
        fetchProjects(false)
      }
    }, { threshold: 0.5 })

    if (loadMoreTrigger.value) observer.observe(loadMoreTrigger.value)

  } catch (error) {
    console.error('초기 데이터 로드 에러:', error)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

const applyFilter = () => {
  showFilter.value = false
  fetchProjects(true)
}

const resetFilter = () => {
  filter.value = {
    clientId: '',
    startDate: '',
    endDate: ''
  }
}
</script>

<style scoped src="../assets/css/dashboard.css"></style>
