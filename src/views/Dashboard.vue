<template>
  <div class="dashboard-screen">
    <header class="top-nav">
      <h2>진행 중인 현장</h2>
      <div class="nav-buttons">
        <button class="nav-add-btn" @click="$router.push('/project/add')">+ 추가</button>
        <button class="filter-btn" @click="openFilterModal">🔍 필터</button>
      </div>
    </header>

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

    <div class="action-section">
      <button class="client-manage-btn" @click="$router.push('/clients')">
        🏢 거래처(발주처) 관리 가기
      </button>
    </div>

    <div v-if="showFilterModal" class="filter-modal-overlay" @click.self="closeFilterModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>현장 검색 필터</h3>
          <button class="close-btn" @click="closeFilterModal">✖</button>
        </div>

        <div class="form-group">
          <label>발주처</label>
          <select v-model="tempFilter.clientId" class="form-select" style="flex: 1">
            <option value="">전체 보기</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.name }}
            </option>
          </select>
        </div>

        <div v-if="viewMode === 'card'" class="form-row">
          <div class="form-group">
            <label>시작일 (이후)</label>
            <input type="date" v-model="tempFilter.startDate" class="form-input" />
          </div>
          <div class="form-group">
            <label>종료일 (이전)</label>
            <input type="date" v-model="tempFilter.endDate" class="form-input" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="reset-btn" @click="resetFilter">초기화</button>
          <button class="apply-btn" @click="applyFilter">적용하기</button>
        </div>
      </div>
    </div>

    <div class="filter-summary" v-if="viewMode === 'card'">
      <div class="summary-content">
        <span class="calendar-icon">📅</span>
        <span
          class="date-text"
          :class="{ 'is-filtered': appliedFilter.startDate || appliedFilter.endDate }"
        >
          <template v-if="!appliedFilter.startDate && !appliedFilter.endDate">전체 기간</template>
          <template v-else>
            {{ appliedFilter.startDate || '전체' }} ~ {{ appliedFilter.endDate || '전체' }}
          </template>
        </span>

        <span v-if="appliedFilter.clientId" class="client-badge">
          🏢 {{ clients.find((c) => c.id === appliedFilter.clientId)?.name }}
        </span>
      </div>
    </div>

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

    <div v-if="viewMode === 'calendar'">
      <div class="calendar-header">
        <div class="month-control">
          <button @click="changeMonth(-1)">◀</button>
          <h3>{{ currentYear }}년 {{ currentMonth }}월</h3>
          <button @click="changeMonth(1)">▶</button>
        </div>
        <button class="today-btn" @click="goToToday">오늘</button>
      </div>

      <div v-if="loading" class="loading-msg" style="padding: 20px;">달력을 불러오는 중입니다...</div>

      <div v-else class="calendar-container">
        <div class="calendar-days-header">
          <div v-for="day in ['일', '월', '화', '수', '목', '금', '토']" :key="day" class="day-name">{{ day }}</div>
        </div>

        <div
          class="calendar-week"
          v-for="week in weeksInMonth"
          :key="week.id"
          :style="{ minHeight: Math.max(90, week.maxSlot * 24 + 35) + 'px' }"
        >
          <div class="week-bg">
            <div v-for="day in week.days" :key="day.date" class="day-cell" :class="{ 'not-current': !day.isCurrentMonth }">
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
            top: `${proj.slotIdx * 24}px`
          }"
            >
              <div
                class="event-bar-pro"
                :class="{ 'settled': proj.isSettled }"
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

// eslint-disable-next-line vue/multi-word-component-names
defineOptions({ name: 'Dashboard' })

// --- 공통 상태 ---
const clients = ref([])
const loading = ref(false)
const savedViewMode = sessionStorage.getItem('dashboardViewMode')
const viewMode = ref(savedViewMode || 'card')

// 필터 상태
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
const tempFilter = ref({ startDate: '', endDate: '', clientId: '' })
const showFilterModal = ref(false)

watch(
  appliedFilter,
  (newVal) => {
    sessionStorage.setItem('projectSearchFilter', JSON.stringify(newVal))
  },
  { deep: true },
)

// --- [카드형] 관련 상태 및 함수 ---
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

    // 조용한 새로고침(뒤로가기 복귀)일 때는 기존에 보던 페이지 분량만큼 한 번에 긁어오기!
    const fetchPage = silent ? 0 : page.value
    const fetchSize = silent ? (page.value === 0 ? 1 : page.value) * 10 : 10

    query.append('page', fetchPage)
    query.append('size', fetchSize)

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const response = await api.get(`/projects${queryString}`)
    const newItems = response.content || response

    if (silent) {
      // 화면 비우는 깜빡임 없이 결과물만 덮어쓰기
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

// --- [달력형] 관련 상태 및 함수 ---
const calendarProjects = ref([])
const savedCalendarDate = sessionStorage.getItem('calendarViewDate');
const currentDate = ref(savedCalendarDate ? new Date(savedCalendarDate) : new Date());

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)

// --- [달력형] 주 단위 계산 로직 (아이폰/구글 캘린더 방식) ---
const weeksInMonth = computed(() => {
  const weeks = []
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDayOfMonth = new Date(currentYear.value, currentMonth.value, 0)

  // 달력의 첫 시작일을 무조건 일요일로 맞춥니다 (전 달의 날짜가 포함될 수 있음)
  let currentDay = new Date(firstDayOfMonth)
  currentDay.setDate(currentDay.getDate() - currentDay.getDay())

  const todayStr = new Date().toISOString().split('T')[0]
  let weekIdx = 0

  // 마지막 날짜를 넘길 때까지 1주일(7일)씩 끊어서 배열을 만듭니다.
  while (currentDay <= lastDayOfMonth || currentDay.getDay() !== 0) {
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const dStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth()+1).padStart(2,'0')}-${String(currentDay.getDate()).padStart(2,'0')}`
      weekDays.push({
        date: dStr,
        dayNum: currentDay.getDate(),
        isCurrentMonth: currentDay.getMonth() === currentMonth.value - 1,
        isToday: dStr === todayStr
      })
      currentDay.setDate(currentDay.getDate() + 1)
    }

    const weekStartStr = weekDays[0].date
    const weekEndStr = weekDays[6].date

    // 이번 주(일~토) 안에 하루라도 걸치는 현장을 싹 다 가져옵니다.
    const eventsThisWeek = calendarProjects.value.filter(p => {
      const pStart = p.startDate
      const pEnd = p.endDate || p.startDate
      return pStart <= weekEndStr && pEnd >= weekStartStr
    })

    // 정렬 1순위: 빨리 시작하는 순 / 2순위: 일정이 긴 순
    eventsThisWeek.sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate)
      const aSpan = new Date(a.endDate || a.startDate) - new Date(a.startDate)
      const bSpan = new Date(b.endDate || b.startDate) - new Date(b.startDate)
      return bSpan - aSpan
    })

    // 슬롯(층수) 배정 로직 (겹치지 않게 1층, 2층, 3층 자리를 찾아줌)
    const slots = []
    const renderedEvents = eventsThisWeek.map(p => {
      const pStart = p.startDate
      const pEnd = p.endDate || p.startDate

      // 이번 주 안에서 몇 번째 요일(0~6)부터 몇 번째 요일까지인지 계산
      let startIdx = weekDays.findIndex(d => d.date === pStart)
      if (startIdx === -1) startIdx = 0 // 지난주부터 이어져 왔으면 일요일(0)부터

      let endIdx = weekDays.findIndex(d => d.date === pEnd)
      if (endIdx === -1) endIdx = 6 // 다음주까지 이어지면 토요일(6)까지

      const span = endIdx - startIdx + 1 // 막대기의 총 길이

      // 빈 층수 찾기
      let slotIdx = 0
      while (slots[slotIdx] && slots[slotIdx] >= weekDays[startIdx].date) {
        slotIdx++
      }
      slots[slotIdx] = weekDays[endIdx].date // 이 층수는 끝날 때까지 내꺼!

      return { ...p, startIdx, span, slotIdx }
    })

    weeks.push({
      id: weekIdx++,
      days: weekDays,
      events: renderedEvents,
      maxSlot: slots.length // 이벤트가 많으면 달력 한 줄의 높이를 늘려주기 위함
    })
  }
  return weeks
})

const changeMonth = (delta) => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + delta);
  currentDate.value = newDate;

  // 달력을 넘길 때마다 현재 보고 있는 기준 날짜를 세션에 저장
  sessionStorage.setItem('calendarViewDate', newDate.toISOString());
  fetchProjectsForCalendar();
}

const goToToday = () => {
  const today = new Date();
  currentDate.value = today;

  // 세션 스토리지 업데이트 및 데이터 리로드
  sessionStorage.setItem('calendarViewDate', today.toISOString());
  fetchProjectsForCalendar();
}

const fetchProjectsForCalendar = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const firstDayOfMonth = new Date(currentYear.value, currentMonth.value - 1, 1)
    const gridStart = new Date(firstDayOfMonth)
    gridStart.setDate(gridStart.getDate() - gridStart.getDay())

    const lastDayOfMonth = new Date(currentYear.value, currentMonth.value, 0)
    const gridEnd = new Date(lastDayOfMonth)
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()))

    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const query = new URLSearchParams()
    if (appliedFilter.value.clientId) query.append('clientId', appliedFilter.value.clientId)

    query.append('startDate', formatDate(gridStart))
    query.append('endDate', formatDate(gridEnd))
    query.append('page', 0)
    query.append('size', 100)

    const queryString = query.toString() ? `?${query.toString()}` : ''
    const response = await api.get(`/projects${queryString}`)
    calendarProjects.value = response.content || response // 화면 깜빡임 없이 덮어쓰기
  } catch (error) {
    console.error('달력 데이터 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// --- 공통 액션 ---
const setViewMode = (mode) => {
  viewMode.value = mode
  sessionStorage.setItem('dashboardViewMode', mode)
  if (mode === 'calendar') {
    fetchProjectsForCalendar()
  } else {
    // 카드로 돌아오면 달력 보느라 이동했던 observer를 위해 다시 페이징 리로드
    fetchProjects(true)
  }
}

const openFilterModal = () => {
  tempFilter.value = { ...appliedFilter.value }
  showFilterModal.value = true
}

const applyFilter = () => {
  appliedFilter.value = { ...tempFilter.value }
  showFilterModal.value = false
  if (viewMode.value === 'calendar') {
    fetchProjectsForCalendar()
  } else {
    fetchProjects(true)
  }
}

const closeFilterModal = () => {
  showFilterModal.value = false
}

const resetFilter = () => {
  tempFilter.value = { startDate: '', endDate: '', clientId: '' }
  appliedFilter.value = { ...tempFilter.value }
  showFilterModal.value = false
  if (viewMode.value === 'calendar') {
    fetchProjectsForCalendar()
  } else {
    fetchProjects(true)
  }
}

onMounted(async () => {
  try {
    clients.value = await api.get('/clients')
  } catch (error) {
    console.error('초기 데이터 로드 에러:', error)
  }
})

// 2. 대시보드 화면이 보일 때마다 실행 (처음 진입 + 상세에서 뒤로가기로 돌아왔을 때 모두)
onActivated(async () => {
  const isFirstLoad = projects.value.length === 0 && calendarProjects.value.length === 0;

  // 돌아왔을 때는 조용히(silent=true) 데이터만 업데이트해서 최신 상태 유지
  if (viewMode.value === 'calendar') {
    await fetchProjectsForCalendar(!isFirstLoad)
  } else {
    await fetchProjects(true, !isFirstLoad)
  }

  // 화면에 보일 때 무한 스크롤 감지기 켜기
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      if (viewMode.value === 'card' && entries[0].isIntersecting && !isLastPage.value && !loading.value) {
        fetchProjects(false, false)
      }
    }, { threshold: 0.5 })
  }

  if (loadMoreTrigger.value) observer.observe(loadMoreTrigger.value)
})

// 3. 상세 화면으로 넘어갈 때 무한 스크롤 감지기 잠시 끄기 (에러 방지)
onDeactivated(() => {
  if (observer && loadMoreTrigger.value) {
    observer.unobserve(loadMoreTrigger.value)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped src="../assets/css/dashboard.css"></style>
