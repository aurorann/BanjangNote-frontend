<template>
  <div class="client-modal-overlay">
    <div class="client-modal-content">
      <h3 class="modal-title">새 발주처 등록</h3>

      <div class="form-group">
        <label>업체명</label>
        <input
          type="text"
          v-model="newClient.name"
          placeholder="업체명을 입력하세요 (필수)"
          maxlength="100"
        />
      </div>

      <div class="form-group">
        <label>담당자 이름</label>
        <input
          type="text"
          v-model="newClient.contactName"
          placeholder="담당자 성함을 입력하세요 (선택)"
          maxlength="50"
        />
      </div>

      <div class="form-group">
        <label>담당자 연락처</label>
        <input
          type="tel"
          v-model="newClient.contactPhone"
          @input="handlePhoneInput"
          placeholder="연락처를 입력하세요 (선택)"
          maxlength="50"
        />
      </div>

      <div class="button-group" style="margin-top: 10px;">
        <button class="client-modal-cancel-btn" @click="$emit('close')">취소</button>
        <button class="save-btn" @click="saveNewClient">등록하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/api/index.js'
import { toast } from '@/stores/toast.js'
import { usePhone } from '@/composables/usePhone.js'

const emit = defineEmits(['close', 'saved'])
const newClient = ref({ name: '', contactName: '', contactPhone: '' })

const saveNewClient = async () => {
  if (!newClient.value.name.trim()) {
    toast.warn('업체명은 필수입니다!')
    return
  }

  if (phoneError.value) {
    toast.warn('연락처 형식을 확인해주세요.')
    return
  }

  try {
    const savedClient = await api.post('/clients', newClient.value)
    toast.success('새 업체가 등록되었습니다.')
    emit('saved', savedClient)
  } catch (error) {
    console.error('업체 등록 실패:', error)
    toast.error('업체 등록 중 에러가 발생했습니다.')
  }
}

const { phoneError, formatAndValidate } = usePhone()

// 사용자가 입력할 때마다 실행되는 함수
const handlePhoneInput = (event) => {
  newClient.value.contactPhone = formatAndValidate(event)
}
</script>

<style scoped>
.client-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  /* 🔥 헤더(1000)보다 위에 오도록 설정 */
  z-index: 2000;
}

.client-modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #1f2937;
  text-align: center;
  font-weight: bold;
}

/* 취소 버튼만 모달에 맞춰 별도 스타일 유지 */
.client-modal-cancel-btn {
  flex: 1;
  height: 48px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  color: #4b5563;
  font-size: 16px;
  transition: background 0.2s;
}

.client-modal-cancel-btn:hover {
  background: #e5e7eb;
}
</style>
