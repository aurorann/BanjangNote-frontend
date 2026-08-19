<template>
  <div class="project-detail-screen">
    <div v-if="loading" class="full-screen-loader">
      <div class="spinner"></div>
      <p>작업자 정보를 불러오는 중...</p>
    </div>

    <template v-else>
      <header class="top-nav">
        <button class="back-btn" @click="$router.back()">◀ 이전</button>
        <h2>작업자 정산</h2>
        <div style="width: 60px;"></div>
      </header>

      <div class="worker-section">
        <div class="section-header-flex">
          <h3 class="section-title" style="margin: 0;">투입 작업자 정산</h3>
          <div class="summary-stats">
            <span class="stat-badge">총 {{ assignments.length }}명</span>
            <span class="stat-money">{{ totalLaborCost.toLocaleString() }}원</span>
          </div>
        </div>

        <div class="worker-card" v-for="assignment in assignments" :key="assignment.id">
          <div class="worker-header">
            <div>
              <span class="worker-name">{{ assignment.worker.name }}</span>
              <span class="worker-role">{{ assignment.worker.role }}</span>
            </div>
            <span class="worker-rate">단가: {{ assignment.appliedDailyRate.toLocaleString() }}원</span>
          </div>

          <div class="worker-body">
            <div class="work-days-control">
              <button class="circle-btn" @click="updateDays(assignment, -1)">-</button>
              <span class="days-text">{{ assignment.days }}일</span>
              <button class="circle-btn" @click="updateDays(assignment, 1)">+</button>
            </div>
            <div class="pay-info">
              <div class="total-pay">{{ (assignment.days * assignment.appliedDailyRate).toLocaleString() }}원</div>
              <button class="pay-btn" :class="assignment.isPaid ? 'btn-paid' : 'btn-unpaid'" @click="togglePaid(assignment)">
                {{ assignment.isPaid ? '지급 완료 ✔' : '미지급' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/index.js'
import '@/assets/css/project-detail.css'

const route = useRoute()
const assignments = ref([])
const loading = ref(true)

const totalLaborCost = computed(() => assignments.value.reduce((sum, a) => sum + (a.days * a.appliedDailyRate), 0))

onMounted(async () => {
  const projectId = route.params.id
  loading.value = true
  try {
    assignments.value = await api.get(`/projects/${projectId}/assignments`)
  } finally {
    loading.value = false
  }
})

const updateDays = async (assignment, delta) => {
  if (assignment.days + delta < 0) return
  assignment.days += delta
  await api.put(`/assignments/${assignment.id}`, assignment)
}

const togglePaid = async (assignment) => {
  assignment.isPaid = !assignment.isPaid
  await api.put(`/assignments/${assignment.id}`, assignment)
}
</script>

<style scoped>
.worker-section { margin-top: 20px; }
</style>
