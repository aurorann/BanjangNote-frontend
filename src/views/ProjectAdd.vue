<template>
  <div class="project-add-screen">
    <header class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">◀ 이전</button>
      <h2>{{ isEditMode ? '현장 정보 수정' : '새 현장 등록' }}</h2>
      <div class="placeholder-box"></div>
    </header>

    <div class="form-container">
      <div class="form-group">
        <label>발주처 (업체)</label>
        <div style="display: flex; gap: 10px">
          <select v-model="form.clientId" class="form-select" style="flex: 1">
            <option value="">업체를 선택해주세요</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.name }} ({{ client.contactName || '담당자 없음' }})
            </option>
          </select>
          <button type="button" class="new-client-btn" @click="showClientModal = true">
            + 새 업체
          </button>
        </div>
      </div>

      <div class="form-group">
        <label>현장명</label>
        <input type="text" v-model="form.name" placeholder="예: 반포 자이 101동 도배" />
      </div>
      <div class="form-group">
        <label>현장 주소</label>
        <input type="text" v-model="form.address" placeholder="예: 서울시 서초구 반포동" />
      </div>
      <div class="form-group">
        <label>시작일</label>
        <input type="date" v-model="form.startDate" />
      </div>
      <div class="form-group">
        <label>종료일(예정)</label>
        <input type="date" v-model="form.endDate" />
      </div>

      <h3 class="section-title">투입 예정 작업자</h3>

      <div class="worker-row" v-for="(worker, index) in workers" :key="index">
        <input type="text" placeholder="이름" v-model="worker.name" />
        <input type="text" placeholder="직급(기공 등)" v-model="worker.role" />
        <input type="number" placeholder="일당(원)" v-model="worker.dailyRate" />
        <button class="remove-btn" @click="removeWorker(index)">X</button>
      </div>

      <button class="add-worker-btn" @click="addWorker">+ 작업자 추가</button>

      <!-- 버튼 그룹 영역 -->
      <div class="button-group">
        <button class="save-btn" @click="saveProject">
          {{ isEditMode ? '수정 완료' : '현장 등록하기' }}
        </button>

        <button v-if="isEditMode" class="delete-btn" @click="handleDelete">
          현장 삭제
        </button>
      </div>
    </div>

    <ClientModal
      v-if="showClientModal"
      @close="showClientModal = false"
      @saved="handleClientSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'
import ClientModal from '../components/ClientModal.vue'

const router = useRouter()
const route = useRoute()
const clients = ref([])

const isEditMode = computed(() => route.path.includes('/edit/'))
const projectId = route.params.id

const form = ref({
  clientId: '',
  name: '',
  address: '',
  startDate: '',
  endDate: '',
})
const workers = ref([{ name: '', role: '', dailyRate: '' }])

const showClientModal = ref(false)
const handleClientSaved = (savedClient) => {
  clients.value.push(savedClient)
  form.value.clientId = savedClient.id
  showClientModal.value = false
}

onMounted(async () => {
  try {
    clients.value = await api.get('/clients')

    if (isEditMode.value) {
      const projectData = await api.get(`/projects/${projectId}`)
      form.value = {
        clientId: projectData.client?.id || '',
        name: projectData.name,
        address: projectData.address,
        startDate: projectData.startDate || '',
        endDate: projectData.endDate || '',
      }

      const assignmentData = await api.get(`/projects/${projectId}/assignments`)
      if (assignmentData.length > 0) {
        workers.value = assignmentData.map((a) => ({
          name: a.worker.name,
          role: a.worker.role,
          dailyRate: a.appliedDailyRate,
        }))
      }
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error)
  }
})

const addWorker = () => {
  workers.value.push({ name: '', role: '', dailyRate: '' })
}

const removeWorker = (index) => {
  workers.value.splice(index, 1)
}

const saveProject = async () => {
  if (!form.value.name || !form.value.clientId) {
    alert('발주처와 현장명은 필수입니다!')
    return
  }

  const payload = { ...form.value, workers: workers.value }

  try {
    if (isEditMode.value) {
      await api.put(`/projects/${projectId}`, payload)
      alert('성공적으로 수정되었습니다.')
    } else {
      await api.post('/projects', payload)
      alert('현장이 성공적으로 등록되었습니다.')
    }
    router.push('/dashboard')
  } catch (error) {
    console.error('저장 에러:', error)
    alert(error.message || '저장에 실패했습니다.')
  }
}

const handleDelete = async () => {
  const confirmed = confirm('정말로 이 현장을 삭제하시겠습니까?\n이 현장에 속한 근무 기록도 모두 삭제되며 복구할 수 없습니다.')

  if (confirmed) {
    try {
      await api.delete(`/projects/${projectId}`)
      alert('현장이 정상적으로 삭제되었습니다.')
      router.push('/dashboard')
    } catch (error) {
      console.error('삭제 에러:', error)
      alert(error.message)
    }
  }
}
</script>

<style scoped src="../assets/css/project-add.css"></style>
