<template>
  <div class="client-list-screen">
    <header class="top-nav">
      <button class="back-btn" @click="$router.push('/dashboard')">◀ 대시보드</button>
      <h2>거래처 관리</h2>
      <div class="placeholder-box"></div>
    </header>

    <div class="content-container">
      <!-- 폼 열기 버튼 (폼이 닫혀있을 때만 보임) -->
      <button v-if="!showForm" class="block-add-btn" @click="openAddForm">+ 새 거래처 등록</button>

      <!-- 입력/수정 폼 영역 -->
      <div v-if="showForm" class="form-card">
        <h3>{{ isEditMode ? '거래처 수정' : '새 거래처 등록' }}</h3>

        <div class="form-group">
          <label>업체명 (필수)</label>
          <input type="text" v-model="form.name" placeholder="예: A인테리어" />
        </div>

        <div class="form-row" style="display: flex; gap: 10px">
          <div class="form-group" style="flex: 1">
            <label>담당자명</label>
            <input type="text" v-model="form.contactName" placeholder="예: 김과장" />
          </div>
          <div class="form-group" style="flex: 1">
            <label>연락처</label>
            <input
              type="tel"
              :value="form.contactPhone"
              @input="handlePhoneInput"
              placeholder="예: 010-1234-5678"
              maxlength="13"
            />
            <span v-if="phoneError" class="error-msg">{{ phoneError }}</span>
          </div>
        </div>

        <div class="button-group">
          <button class="save-btn" @click="saveClient">저장</button>
          <button class="cancel-btn" @click="closeForm">취소</button>
        </div>
      </div>

      <!-- 거래처 목록 영역 -->
      <ul class="client-list">
        <li v-for="client in clients" :key="client.id" class="client-item">
          <div class="client-info">
            <span class="client-name">{{ client.name }}</span>
            <!-- 담당자와 연락처를 함께 표기 -->
            <span class="client-contact">
              👤 {{ client.contactName || '담당자 미지정' }}
              <span v-if="client.contactPhone" style="margin-left: 8px"
                >📞 {{ client.contactPhone }}</span
              >
            </span>
          </div>
          <div class="client-actions">
            <button class="item-edit-btn" @click="openEditForm(client)">수정</button>
            <button class="item-delete-btn" @click="deleteClient(client.id)">삭제</button>
          </div>
        </li>
        <li v-if="clients.length === 0" class="empty-msg">등록된 거래처가 없습니다.</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { toast } from '@/stores/toast.js'
import { showConfirm } from '@/stores/confirm.js'
import { usePhone } from '@/composables/usePhone.js'

const clients = ref([])
const showForm = ref(false)
const isEditMode = ref(false)

const form = ref({
  id: null,
  name: '',
  contactName: '',
  contactPhone: '',
})
const { phoneError, formatAndValidate } = usePhone()
const handlePhoneInput = (event) => {
  form.value.contactPhone = formatAndValidate(event)
}

const fetchClients = async () => {
  try {
    clients.value = await api.get('/clients')
  } catch (error) {
    console.error('불러오기 실패:', error)
  }
}

onMounted(fetchClients)

const openAddForm = () => {
  isEditMode.value = false
  form.value = { id: null, name: '', contactName: '', contactPhone: '' }
  phoneError.value = ''
  showForm.value = true
}

const openEditForm = (client) => {
  isEditMode.value = true
  form.value = {
    id: client.id,
    name: client.name,
    contactName: client.contactName || '',
    contactPhone: client.contactPhone || ''
  }
  phoneError.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

const saveClient = async () => {
  if (!form.value.name.trim()) {
    toast.warn('업체명을 입력해주세요.')
    return
  }

  if (phoneError.value) {
    toast.warn('연락처 형식을 확인해주세요.')
    return
  }

  const payload = {
    name: form.value.name,
    contactName: form.value.contactName?.trim() ? form.value.contactName : null,
    contactPhone: form.value.contactPhone?.trim() ? form.value.contactPhone : null,
  }

  try {
    if (isEditMode.value) {
      await api.put(`/clients/${form.value.id}`, payload)
      toast.success('거래처가 수정되었습니다.')
    } else {
      await api.post('/clients', payload)
      toast.success('새 거래처가 등록되었습니다.')
    }
    closeForm()
    await fetchClients() // 목록 새로고침
  } catch (error) {
    toast.error(error.message || '저장에 실패했습니다.');
  }
}

const deleteClient = async (id) => {
  if (await showConfirm('이 거래처를 삭제하시겠습니까?\n주의: 관련된 현장 데이터에 영향을 줄 수 있습니다.')) {
    try {
      await api.delete(`/clients/${id}`)
      toast.success('삭제되었습니다.')
      await fetchClients() // 목록 새로고침
    } catch (error) {
      toast.error(error.message || '삭제에 실패했습니다.');
    }
  }
}
</script>

<style scoped src="../assets/css/client-list.css"></style>
