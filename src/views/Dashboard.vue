<template>
  <div class="dashboard-screen">
    <!-- 1. 상단 네비게이션 -->
    <header class="top-nav">
      <h2>진행 중인 현장</h2>
      <div class="nav-buttons">
        <button class="nav-add-btn" @click="$router.push('/project/add')">+ 추가</button>
        <button class="filter-btn" @click="openFilterModal">🔍 필터</button>
      </div>
    </header>

    <!-- 2. 뷰 모드 전환 버튼 -->
    <div class="view-toggle-wrapper">
      <div class="view-toggle">
        <button :class="{ active: viewMode === 'card' }" @click="setViewMode('card')">
          📋 리스트
        </button>
        <button :class="{ active: viewMode === 'calendar' }" @click="setViewMode('calendar')">
          📅 달력
        </button>
      </div>
    </div>

    <!-- 3. 액션 버튼 -->
    <div class="action-section">
      <button class="client-manage-btn" @click="$router.push('/clients')">
        🏢 거래처(발주처) 관리 가기
      </button>
    </div>

    <!-- 4. 필터 모달 -->
    <FilterModal
      v-if="showFilterModal"
      :clients="clients"
      :view-mode="viewMode"
      :initial-filter="appliedFilter"
      @close="closeFilterModal"
      @apply="applyFilter"
    />

    <!-- 5. 필터 요약 표시 바 -->
    <div class="filter-summary" v-if="viewMode === 'card'">
      <div class="summary-content">
        <span class="calendar-icon">📅</span>
        <span
          class="date-text"
          :class="{ 'is-filtered': appliedFilter.startDate || appliedFilter.endDate }"
        >
          <template v-if="!appliedFilter.startDate && !appliedFilter.endDate">전체 기간</template>
          <template v-else
            >{{ appliedFilter.startDate || '전체' }} ~
            {{ appliedFilter.endDate || '전체' }}</template
          >
        </span>
        <span v-if="appliedFilter.clientId" class="client-badge">
          🏢 {{ clients.find((c) => c.id === appliedFilter.clientId)?.name }}
        </span>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- [A] 카드(리스트) 뷰 영역                         -->
    <!-- ============================================== -->
    <div v-if="viewMode === 'card'">
      <div class="project-list">
        <div v-if="loading && page === 0" class="loading-msg">데이터를 불러오는 중입니다...</div>
        <div v-else-if="projects.length === 0" class="dash-empty-msg">
          조건에 맞는 현장이 없습니다.
        </div>

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
                {{ project.isSettled ? '수금 완료' : '수금 대기' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref="loadMoreTrigger" class="load-more-area">
        <div v-if="loading && page > 0" class="mini-spinner"></div>
        <p v-if="isLastPage && projects.length > 0" class="end-msg">마지막 현장입니다.</p>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- [B] 달력 뷰 영역                                 -->
    <!-- ============================================== -->
    <div v-if="viewMode === 'calendar'">
      <div class="calendar-header">
        <div class="month-control">
          <button @click="changeMonth(-1)">◀</button>
          <h3>{{ currentYear }}년 {{ currentMonth }}월</h3>
          <button @click="changeMonth(1)">▶</button>
        </div>
        <button class="today-btn" @click="goToToday">오늘</button>
      </div>

      <div v-if="loading" class="loading-msg" style="padding: 20px">
        달력을 불러오는 중입니다...
      </div>

      <div v-else class="calendar-container">
        <div class="calendar-days-header">
          <div
            v-for="day in ['일', '월', '화', '수', '목', '금', '토']"
            :key="day"
            class="day-name"
          >
            {{ day }}
          </div>
        </div>

        <div
          class="calendar-week"
          v-for="week in weeksInMonth"
          :key="week.id"
          :style="{ minHeight: Math.max(90, week.maxSlot * 24 + 35) + 'px' }"
        >
          <div class="week-bg">
            <div
              v-for="day in week.days"
              :key="day.date"
              class="day-cell"
              :class="{ 'not-current': !day.isCurrentMonth, 'is-today': day.isToday }"
            >
              <span class="day-number" :class="{ 'is-today': day.isToday }">{{ day.dayNum }}</span>
            </div>
          </div>

          <div class="events-layer">
            <div
              v-for="proj in week.events"
              :key="proj.id"
              class="event-bar-wrapper"
              :style="{
                left: `calc(100% / 7 * ${proj.startIdx})`,
                width: `calc(100% / 7 * ${proj.span})`,
                top: `${proj.slotIdx * 24}px`,
              }"
            >
              <div
                class="event-bar-pro"
                :class="{ settled: proj.isSettled }"
                @click="$router.push(`/project/${proj.id}`)"
              >
                {{ proj.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, onActivated, onDeactivated } from 'vue'
import { api } from '@/api/index.js'
import FilterModal from '@/views/FilterModal.vue'

// eslint-disable-next-line vue/multi-word-component-names
defineOptions({ name: 'Dashboard' })

// ==========================================
// 1. 공통 상태 및 뷰 모드 관리
// ==========================================
const clients = ref([])
const loading = ref(false)
const viewMode = ref(sessionStorage.getItem('dashboardViewMode') || 'card')

const setViewMode = (mode) => {
  viewMode.value = mode
  sessionStorage.setItem('dashboardViewMode', mode)
  mode === 'calendar' ? fetchProjectsForCalendar() : fetchProjects(true)
}

// ==========================================
// 2. 필터 모달 관리
// ==========================================
const getDefaultDates = () => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 7)
  const end = new Date(today)
  end.setDate(today.getDate() + 7)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

const defaultDates = getDefaultDates()
const savedFilter = sessionStorage.getItem('projectSearchFilter')
const appliedFilter = ref(
  savedFilter
    ? JSON.parse(savedFilter)
    : {
        clientId: '',
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate,
      },
)
const showFilterModal = ref(false)

watch(
  appliedFilter,
  (newVal) => {
    sessionStorage.setItem('projectSearchFilter', JSON.stringify(newVal))
  },
  { deep: true },
)

const openFilterModal = () => {
  showFilterModal.value = true
}

const closeFilterModal = () => {showFilterModal.value = false}

const applyFilter = (newFilter) => {
  appliedFilter.value = newFilter
  showFilterModal.value = false
  viewMode.value === 'calendar' ? fetchProjectsForCalendar() : fetchProjects(true)
}

// ==========================================
// 3. 리스트(카드) 뷰 & 무한 스크롤
// ==========================================
const projects = ref([])
const page = ref(0)
const isLastPage = ref(false)
const loadMoreTrigger = ref(null)
let observer = null

const fetchProjects = async (isNewSearch = false, silent = false) => {
  if ((loading.value && !silent) || (isLastPage.value && !isNewSearch)) return
  if (!silent) loading.value = true

  if (isNewSearch && !silent) {
    page.value = 0
    projects.value = []
    isLastPage.value = false
  }

  try {
    const query = new URLSearchParams()
    if (appliedFilter.value.clientId) query.append('clientId', appliedFilter.value.clientId)
    if (appliedFilter.value.startDate) query.append('startDate', appliedFilter.value.startDate)
    if (appliedFilter.value.endDate) query.append('endDate', appliedFilter.value.endDate)

    const fetchPage = silent ? 0 : page.value
    const fetchSize = silent ? (page.value === 0 ? 1 : page.value) * 10 : 10
    query.append('page', fetchPage)
    query.append('size', fetchSize)

    const response = await api.get(`/projects?${query.toString()}`)
    const newItems = response.content || response

    if (silent) {
      projects.value = newItems
      isLastPage.value = response.last ?? newItems.length < fetchSize
    } else {
      projects.value.push(...newItems)
      isLastPage.value = response.last ?? newItems.length < 10
      if (!isLastPage.value) page.value++
    }
  } catch (error) {
    console.error('현장 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// ==========================================
// 4. 달력 뷰 로직
// ==========================================
const calendarProjects = ref([])
const savedCalendarDate = sessionStorage.getItem('calendarViewDate')
const currentDate = ref(savedCalendarDate ? new Date(savedCalendarDate) : new Date())

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)

const weeksInMonth = computed(() => {
  const weeks = []
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDayOfMonth = new Date(currentYear.value, currentMonth.value, 0)

  let currentDay = new Date(firstDayOfMonth)
  currentDay.setDate(currentDay.getDate() - currentDay.getDay())

  const todayStr = new Date().toISOString().split('T')[0]
  let weekIdx = 0

  while (currentDay <= lastDayOfMonth || currentDay.getDay() !== 0) {
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const dStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`
      weekDays.push({
        date: dStr,
        dayNum: currentDay.getDate(),
        isCurrentMonth: currentDay.getMonth() === currentMonth.value - 1,
        isToday: dStr === todayStr,
      })
      currentDay.setDate(currentDay.getDate() + 1)
    }

    const weekStartStr = weekDays[0].date
    const weekEndStr = weekDays[6].date

    const eventsThisWeek = calendarProjects.value.filter(
      (p) => p.startDate <= weekEndStr && (p.endDate || p.startDate) >= weekStartStr,
    )
    eventsThisWeek.sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate)
      return (
        new Date(b.endDate || b.startDate) -
        new Date(b.startDate) -
        (new Date(a.endDate || a.startDate) - new Date(a.startDate))
      )
    })

    const slots = []
    const renderedEvents = eventsThisWeek.map((p) => {
      let startIdx = weekDays.findIndex((d) => d.date === p.startDate)
      if (startIdx === -1) startIdx = 0
      let endIdx = weekDays.findIndex((d) => d.date === (p.endDate || p.startDate))
      if (endIdx === -1) endIdx = 6

      let slotIdx = 0
      while (slots[slotIdx] && slots[slotIdx] >= weekDays[startIdx].date) slotIdx++
      slots[slotIdx] = weekDays[endIdx].date

      return { ...p, startIdx, span: endIdx - startIdx + 1, slotIdx }
    })

    weeks.push({ id: weekIdx++, days: weekDays, events: renderedEvents, maxSlot: slots.length })
  }
  return weeks
})

const changeMonth = (delta) => {
  currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + delta))
  sessionStorage.setItem('calendarViewDate', currentDate.value.toISOString())
  fetchProjectsForCalendar()
}

const goToToday = () => {
  currentDate.value = new Date()
  sessionStorage.setItem('calendarViewDate', currentDate.value.toISOString())
  fetchProjectsForCalendar()
}

const fetchProjectsForCalendar = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const gridStart = new Date(currentYear.value, currentMonth.value - 1, 1)
    gridStart.setDate(gridStart.getDate() - gridStart.getDay())

    const gridEnd = new Date(currentYear.value, currentMonth.value, 0)
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()))

    const formatDate = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const query = new URLSearchParams({
      startDate: formatDate(gridStart),
      endDate: formatDate(gridEnd),
      page: 0,
      size: 100,
    })
    if (appliedFilter.value.clientId) query.append('clientId', appliedFilter.value.clientId)

    const response = await api.get(`/projects?${query.toString()}`)
    calendarProjects.value = response.content || response
  } catch (error) {
    console.error('달력 데이터 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// ==========================================
// 5. 라이프사이클 훅 (진입, 이탈)
// ==========================================
onMounted(async () => {
  try {
    clients.value = await api.get('/clients')
  } catch (error) {
    console.error('초기 데이터 로드 에러:', error)
  }
})

onActivated(async () => {
  const currentSessionFilter = sessionStorage.getItem('projectSearchFilter')
  if (!currentSessionFilter) {
    appliedFilter.value = {
      clientId: '',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
    }
  }

  const isFirstLoad = projects.value.length === 0 && calendarProjects.value.length === 0

  viewMode.value === 'calendar'
    ? await fetchProjectsForCalendar(!isFirstLoad)
    : await fetchProjects(true, !isFirstLoad)

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        if (
          viewMode.value === 'card' &&
          entries[0].isIntersecting &&
          !isLastPage.value &&
          !loading.value
        ) {
          fetchProjects(false, false)
        }
      },
      { threshold: 0.5 },
    )
  }
  if (loadMoreTrigger.value) observer.observe(loadMoreTrigger.value)
})

onDeactivated(() => {
  if (observer && loadMoreTrigger.value) observer.unobserve(loadMoreTrigger.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped src="../assets/css/dashboard.css"></style>
