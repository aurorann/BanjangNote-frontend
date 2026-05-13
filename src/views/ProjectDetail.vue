<template>
  <div class="project-detail-screen">
    <!-- 로딩 바 (통신 중일 때만 표시) -->
    <div v-if="loading" class="full-screen-loader">
      <div class="spinner"></div>
      <p>현장 정보를 불러오는 중...</p>
    </div>
    <template v-else-if="project">
    <header class="top-nav">
      <button class="back-btn" @click="$router.push('/dashboard')">◀ 이전</button>
      <h2>현장 관리</h2>
      <button class="nav-edit-btn" @click="$router.push(`/project/edit/${project.id}`)">수정</button>
    </header>

    <!-- 현장 기본 정보 -->
    <div class="info-card" v-if="project">
      <h3>{{ project.name }}</h3>
      <p class="client-name">🏢 {{ project.client?.name }}</p>
      <p class="project-info">📍 {{ project.address }}</p>
      <p class="project-info">📅 {{ project.startDate }} ~ {{ project.endDate || '미정' }}</p>
      <div v-if="project.memo" style="margin-top: 15px; padding: 12px; background-color: #f9fafb; border-radius: 8px; font-size: 14px; color: #4b5563;">
        <strong>📝 메모:</strong><br/>
        <span style="white-space: pre-wrap; margin-top: 5px; display: inline-block;">{{ project.memo }}</span>
      </div>

      <div class="settlement-row">
        <span class="settlement-label">발주처 대금 수금</span>
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
      <h3 class="section-title">투입 작업자 정산</h3>

      <div class="worker-card" v-for="assignment in assignments" :key="assignment.id">
        <div class="worker-header">
          <div>
            <span class="worker-name">{{ assignment.worker.name }}</span>
            <span class="worker-role">{{ assignment.worker.role }}</span>
          </div>
          <span class="worker-rate">
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
    </template>
    <div v-else class="error-container">
      <p>데이터를 불러오지 못했습니다.</p>
      <button @click="$router.push('/dashboard')">대시보드로 돌아가기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/index.js'
import { toast } from '@/stores/toast.js'
import { showConfirm } from '@/stores/confirm.js'

const route = useRoute()
const project = ref(null)
const assignments = ref([])
const loading = ref(true)

onMounted(async () => {
  const projectId = route.params.id
  loading.value = true

  try {
    // 두 API를 동시에 기다림 (속도 최적화)
    const [projectRes, assignmentRes] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/assignments`)
    ])

    project.value = projectRes
    assignments.value = assignmentRes
  } catch (error) {
    console.error('데이터를 불러오는 중 에러 발생:', error)
  } finally {
    // 0.5초 정도 최소 로딩 시간을 주면 화면 깜빡임이 덜합니다.
    setTimeout(() => { loading.value = false }, 500)
  }
})

const toggleProjectSettled = async () => {
  if (!project.value) return;

  const currentStatus = project.value.isSettled;
  const message = currentStatus
    ? "수금 완료를 취소하시겠습니까?"
    : "수금 완료 상태로 변경하시겠습니까?";

  const ok = await showConfirm(message);
  if (!ok) return;

  try {
    // 더 이상 복잡한 payload(이름, 날짜, 작업자 등)를 보낼 필요가 없습니다!
    await api.patch(`/projects/${project.value.id}/settle`);

    // 화면에 보이는 상태 즉시 반영
    project.value.isSettled = !currentStatus;

    toast.success('수금 상태가 변경되었습니다!')
  } catch (error) {
    console.error('수금 상태 변경 실패:', error);
    toast.error('변경에 실패했습니다.');

    // 실패했을 경우 화면 상태 롤백 (선택 사항)
    project.value.isSettled = currentStatus;
  }
}

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

<style scoped src="../assets/css/project-detail.css"></style>
