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
        <input type="text" v-model="form.name" placeholder="예: 반포 자이 101동 도배" maxlength="100" />
      </div>
      <div class="form-group">
        <label>현장 주소</label>
        <input type="text" v-model="form.address" placeholder="예: 서울시 서초구 반포동" maxlength="255" />
      </div>
      <div class="form-group">
        <label>시작일</label>
        <input type="date" v-model="form.startDate" />
      </div>
      <div class="form-group">
        <label>종료일(예정)</label>
        <input type="date" v-model="form.endDate" />
      </div>

      <div class="form-group">
        <label>현장 메모 (특이사항)</label>
        <textarea
          v-model="form.memo"
          placeholder="현장 관련 특이사항이나 메모를 자유롭게 남겨주세요."
          maxlength="2000"
        ></textarea>
      </div>

      <h3 class="section-title">투입 예정 작업자</h3>

      <div class="worker-row" v-for="(worker, index) in workers" :key="index">
        <input type="text" placeholder="이름" v-model="worker.name" maxlength="50"/>
        <select v-model="worker.role" class="form-select">
          <option value="" disabled>직급 선택</option>
          <option value="초급">초급(조공)</option>
          <option value="중급">중급(준기공)</option>
          <option value="고급">고급(기공)</option>
          <option value="반장">반장</option>
          <option value="기타">기타</option>
        </select>
        <input
          type="tel"
          placeholder="일당(원)"
          :value="autoFormatCurrency(worker.dailyRate)"
          @input="handleDailyRateInput(index, $event)"
        />
        <button class="icon-remove-btn" @click="removeWorker(index)">✕</button>
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
import { autoFormatCurrency, stripCurrency } from '@/utils/formatters.js'
import { toast } from '@/stores/toast.js'
import { showConfirm } from '@/stores/confirm.js'

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
  memo: '',
})
const workers = ref([{ name: '', role: '', dailyRate: '' }])

const showClientModal = ref(false)

const handleClientSaved = (savedClient) => {
  clients.value.push(savedClient)
  form.value.clientId = savedClient.id
  showClientModal.value = false
}

const handleDailyRateInput = (index, event) => {
  // 1. 화면에 보일 콤마 찍힌 문자열 생성 (예: "150,000")
  const formatted = autoFormatCurrency(event.target.value)

  // 2. 입력창(UI)에 콤마가 찍힌 값을 즉시 강제로 덮어씌움
  event.target.value = formatted

  // 3. 실제 DB에 보낼 Vue 데이터(workers.value)에는 순수 숫자(예: 150000)만 저장
  workers.value[index].dailyRate = stripCurrency(formatted)
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
        memo: projectData.memo || '',
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
    toast.warn('발주처와 현장명은 필수입니다.')
    return
  }

  if (!form.value.startDate || !form.value.endDate) {
    toast.warn('시작일과 종료일은 필수입니다.')
    return
  }

  if (form.value.startDate && form.value.endDate) {
    const start = new Date(form.value.startDate)
    const end = new Date(form.value.endDate)

    if (end < start) {
      toast.warn('종료일은 시작일보다 빠를 수 없습니다. 날짜를 확인해주세요.')
      return
    }
  }

  const cleanedWorkers = workers.value
    .filter(worker => worker.name.trim() !== '') // 이름 없는 빈칸 데이터는 버림!
    .map(worker => ({
      ...worker,
      // 빈 문자열이거나 널이면 0으로, 아니면 숫자로 변환
      dailyRate: worker.dailyRate ? Number(worker.dailyRate) : 0
    }))

  const payload = {
    clientId: form.value.clientId,
    name: form.value.name,
    address: form.value.address?.trim() ? form.value.address : null,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    memo: form.value.memo?.trim() ? form.value.memo : null,
    workers: cleanedWorkers
  }

  try {
    if (isEditMode.value) {
      await api.put(`/projects/${projectId}`, payload)
      toast.success('성공적으로 수정되었습니다.')
    } else {
      await api.post('/projects', payload)
      toast.success('현장이 성공적으로 등록되었습니다.')
    }
    sessionStorage.removeItem('projectSearchFilter')
    await router.push('/dashboard')
  } catch (error) {
    console.error('저장 에러:', error)
    toast.error(error.message || '저장에 실패했습니다.');
  }
}

const handleDelete = async () => {
  if (await showConfirm('정말로 이 현장을 삭제하시겠습니까?\n이 현장에 속한 근무 기록도\n모두 삭제되며 복구할 수 없습니다.')) {
    try {
      await api.delete(`/projects/${projectId}`)
      toast.success('현장이 정상적으로 삭제되었습니다.')
      await router.push('/dashboard')
    } catch (error) {
      console.error('삭제 에러:', error)
      toast.error(error.message);
    }
  }
}
</script>

<style scoped src="../assets/css/project-add.css"></style>
