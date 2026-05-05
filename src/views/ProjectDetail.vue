<template>
  <div class="project-detail-screen">
    <header class="top-nav">
      <button class="back-btn" @click="$router.push('/dashboard')">◀ 이전</button>
      <h2>현장 관리</h2>
      <button class="edit-btn" @click="$router.push(`/project/edit/${project.id}`)">수정</button>
    </header>

    <!-- 현장 기본 정보 -->
    <div class="info-card" v-if="project">
      <h3>{{ project.name }}</h3>
      <p style="color: #3b82f6; font-weight: bold">🏢 {{ project.client?.name }}</p>
      <p>📍 {{ project.address }}</p>
      <p>📅 {{ project.startDate }} ~ {{ project.endDate || '미정' }}</p>
      <div
        style="
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px dashed #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <span style="font-weight: bold; color: #333">발주처 대금 수금</span>
        <button
          class="pay-btn"
          :class="project.isSettled ? 'btn-paid' : 'btn-unpaid'"
          @click="toggleProjectSettled"
        >
          {{ project.isSettled ? '수금 완료 ✔' : '수금 대기' }}
        </button>
      </div>
    </div>

    <!-- 투입된 작업자 정산 리스트 -->
    <div class="worker-section">
      <h3 class="section-title" style="margin-bottom: 15px">투입 작업자 정산</h3>

      <div class="worker-card" v-for="assignment in assignments" :key="assignment.id">
        <div class="worker-header">
          <div>
            <span class="worker-name">{{ assignment.worker.name }}</span>
            <span class="worker-role">{{ assignment.worker.role }}</span>
          </div>
          <span style="font-size: 14px; color: #666">
            단가: {{ assignment.appliedDailyRate.toLocaleString() }}원
          </span>
        </div>

        <div class="worker-body">
          <div class="work-days-control">
            <button class="circle-btn" @click="updateDays(assignment, -1)">-</button>
            <span class="days-text">{{ assignment.days }}일</span>
            <button class="circle-btn" @click="updateDays(assignment, 1)">+</button>
          </div>

          <div class="pay-info">
            <div class="total-pay">
              {{ (assignment.days * assignment.appliedDailyRate).toLocaleString() }}원
            </div>
            <button
              class="pay-btn"
              :class="assignment.isPaid ? 'btn-paid' : 'btn-unpaid'"
              @click="togglePaid(assignment)"
            >
              {{ assignment.isPaid ? '지급 완료 ✔' : '미지급' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/index.js'

const route = useRoute()
const project = ref(null)
const assignments = ref([])

onMounted(async () => {
  const projectId = route.params.id // 주소창의 /project/1 에서 '1'을 가져옴

  try {
    // 1. 현장 정보 가져오기
    project.value = await api.get(`/projects/${projectId}`)
    // 2. 이 현장에 투입된 작업자 기록(assignments) 가져오기
    assignments.value = await api.get(`/projects/${projectId}/assignments`)
  } catch (error) {
    console.error('데이터를 불러오는 중 에러 발생:', error)
  }
})

const toggleProjectSettled = async () => {
  project.value.isSettled = !project.value.isSettled

  // 백엔드에 업데이트된 정보 전송
  const payload = {
    name: project.value.name,
    address: project.value.address,
    startDate: project.value.startDate,
    endDate: project.value.endDate,
    clientId: project.value.client?.id,
    isSettled: project.value.isSettled,
  }
  await api.put(`/projects/${project.value.id}`, payload)
}

// 공수 증감 함수
const updateDays = async (assignment, delta) => {
  if (assignment.days + delta < 0) return // 0일 미만으로 내려가지 않게 방어

  assignment.days += delta
  // DB에 바로 업데이트 요청!
  await api.put(`/assignments/${assignment.id}`, assignment)
}

// 지급 여부 변경 함수
const togglePaid = async (assignment) => {
  assignment.isPaid = !assignment.isPaid
  // DB에 바로 업데이트 요청!
  await api.put(`/assignments/${assignment.id}`, assignment)
}
</script>

<style scoped>
.edit-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #6b7280;
  font-weight: bold;
  width: 60px;
  text-align: right;
}
</style>
