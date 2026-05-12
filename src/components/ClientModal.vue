<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3 style="margin-bottom: 20px">새 발주처 등록</h3>
      <div class="form-group">
        <input
          type="text"
          v-model="newClient.name"
          placeholder="업체명 (필수)"
          class="modal-input"
        />
      </div>
      <div class="form-group">
        <input
          type="text"
          v-model="newClient.contactName"
          placeholder="담당자 이름 (선택)"
          class="modal-input"
        />
      </div>
      <div class="form-group">
        <input
          type="text"
          v-model="newClient.contactPhone"
          placeholder="담당자 연락처 (선택)"
          class="modal-input"
        />
      </div>

      <div class="modal-actions">
        <!-- 취소 버튼을 누르면 부모에게 'close' 이벤트를 보냅니다 -->
        <button class="modal-cancel-btn" @click="$emit('close')">취소</button>
        <button class="modal-save-btn" @click="saveNewClient">등록</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/api/index.js'
import { toast } from '@/stores/toast.js'

// 부모(ProjectAdd)에게 신호를 보내기 위한 이벤트 정의
const emit = defineEmits(['close', 'saved'])

const newClient = ref({ name: '', contactName: '', contactPhone: '' })

const saveNewClient = async () => {
  if (!newClient.value.name.trim()) {
    toast.warn('업체명은 필수입니다!')
    return
  }

  try {
    const savedClient = await api.post('/clients', newClient.value)
    toast.success('새 업체가 등록되었습니다.')
    // 저장 성공시 부모에게 'saved' 이벤트와 함께 저장된 데이터 넘김
    emit('saved', savedClient)
  } catch (error) {
    console.error('업체 등록 실패:', error)
    toast.error('업체 등록 중 에러가 발생했습니다.')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
.form-group {
  margin-bottom: 15px;
}
.modal-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
.modal-cancel-btn {
  flex: 1;
  padding: 12px;
  background: #e5e7eb;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  color: #4b5563;
}
.modal-save-btn {
  flex: 1;
  padding: 12px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  color: white;
}
</style>
