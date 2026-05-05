<template>
  <div class="project-add-screen">
    <header class="top-nav">
      <!-- 텍스트가 상황에 맞게 바뀝니다! -->
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

      <!-- 작업자 추가 섹션 -->
      <h3 class="section-title">투입 예정 작업자</h3>

      <!-- v-for를 써서 추가 버튼을 누를 때마다 입력칸이 늘어납니다 -->
      <div class="worker-row" v-for="(worker, index) in workers" :key="index">
        <input type="text" placeholder="이름" v-model="worker.name" />
        <input type="text" placeholder="직급(기공 등)" v-model="worker.role" />
        <input type="number" placeholder="일당(원)" v-model="worker.dailyRate" />
        <button class="remove-btn" @click="removeWorker(index)">X</button>
      </div>

      <button class="add-worker-btn" @click="addWorker">+ 작업자 추가</button>

      <button class="save-btn" @click="saveProject">
        {{ isEditMode ? '수정 완료' : '현장 등록하기' }}
      </button>
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

// 사용자가 입력할 폼 데이터
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
  clients.value.push(savedClient) // 1. 드롭다운 목록에 새 업체 추가
  form.value.clientId = savedClient.id // 2. 방금 추가한 업체를 자동 선택!
  showClientModal.value = false // 3. 모달 닫기
}

onMounted(async () => {
  try {
    // 1. 업체 목록 무조건 가져오기
    clients.value = await api.get('/clients')

    // 2. 수정 모드라면, 기존 현장 데이터와 투입된 작업자 목록을 불러와서 폼에 채워넣습니다.
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

// 작업자 행 추가 함수
const addWorker = () => {
  workers.value.push({ name: '', role: '', dailyRate: '' })
}

// 작업자 행 삭제 함수
const removeWorker = (index) => {
  workers.value.splice(index, 1)
}

// 저장 버튼 클릭 시 실행
const saveProject = async () => {
  if (!form.value.name || !form.value.clientId) {
    alert('발주처와 현장명은 필수입니다!')
    return
  }

  // 폼 데이터와 작업자 배열을 하나로 합쳐서 백엔드로 보냅니다.
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
    alert('저장에 실패했습니다.')
  }
}
</script>

<style scoped>
/* select 박스 디자인만 살짝 추가 */
.form-select {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background-color: #fff;
}

.new-client-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 15px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}
</style>
