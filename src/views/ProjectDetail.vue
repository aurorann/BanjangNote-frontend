<template>
  <div class="project-detail-screen">
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
      <div class="info-card">
        <h3>{{ project.name }}</h3>
        <p v-if="project.client" class="client-name">🏢 {{ project.client?.name }}</p>
        <p v-if="project.address" class="project-info">📍 {{ project.address }}</p>
        <p class="project-info">📅 {{ project.startDate }} ~ {{ project.endDate || '미정' }}</p>

        <div v-if="project.memo" class="memo-box">
          <strong>📝 메모:</strong><br/>
          <span>{{ project.memo }}</span>
        </div>

        <div class="settlement-row">
          <span class="settlement-label">발주처 대금 수금</span>
          <button class="pay-btn" :class="project.isSettled ? 'btn-paid' : 'btn-unpaid'" @click="toggleProjectSettled">
            {{ project.isSettled ? '수금 완료' : '수금 대기' }}
          </button>
        </div>
      </div>

      <!-- 상세 페이지 이동 버튼 (Hub UI) -->
      <div class="hub-menu">
        <button class="hub-btn" @click="$router.push(`/project/${project.id}/workers`)">
          <span>👥 투입 작업자</span>
          <span>{{ totalWorkers }}명 / {{ totalLaborCost.toLocaleString() }}원</span>
        </button>
        <button class="hub-btn" @click="$router.push(`/project/${project.id}/materials`)">
          <span>📦 부자재 관리</span>
          <span>상세 보기</span>
        </button>
      </div>
    </template>

    <div v-else class="error-container">
      <p>데이터를 불러오지 못했습니다.</p>
      <button @click="$router.push('/dashboard')">대시보드로 돌아가기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/index.js'
import { toast } from '@/stores/toast.js'
import { showConfirm } from '@/stores/confirm.js'
import '@/assets/css/project-detail.css'

const route = useRoute()
const project = ref(null)
const assignments = ref([])
const loading = ref(true)

const totalWorkers = computed(() => assignments.value.length)
const totalLaborCost = computed(() => {
  return assignments.value.reduce((sum, a) => sum + (a.days * a.appliedDailyRate), 0)
})

onMounted(async () => {
  const projectId = route.params.id
  loading.value = true
  try {
    const [projectRes, assignmentRes] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/assignments`)
    ])
    project.value = projectRes
    assignments.value = assignmentRes
  } catch (error) {
    console.error('데이터 로딩 에러:', error)
  } finally {
    setTimeout(() => { loading.value = false }, 500)
  }
})

const toggleProjectSettled = async () => {
  if (!project.value) return;
  const currentStatus = project.value.isSettled;
  const ok = await showConfirm(currentStatus ? "수금 완료를 취소하시겠습니까?" : "수금 완료 상태로 변경하시겠습니까?");
  if (!ok) return;

  try {
    await api.patch(`/projects/${project.value.id}/settle`);
    project.value.isSettled = !currentStatus;
    toast.success('수금 상태가 변경되었습니다!')
  } catch (error) {
    toast.error('변경에 실패했습니다.');
  }
}
</script>
