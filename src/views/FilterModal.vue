<!-- src/components/FilterModal.vue -->
<template>
  <div class="filter-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>현장 검색 필터</h3>
        <button class="close-btn" @click="$emit('close')">✖</button>
      </div>

      <div class="form-group">
        <label>발주처</label>
        <select v-model="tempFilter.clientId" class="form-select" style="flex: 1">
          <option value="">전체 보기</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.name }}
          </option>
        </select>
      </div>

      <div v-if="viewMode === 'card'" class="form-row">
        <div class="form-group">
          <label>시작일 (이후)</label>
          <input type="date" v-model="tempFilter.startDate" class="form-input" />
        </div>
        <div class="form-group">
          <label>종료일 (이전)</label>
          <input type="date" v-model="tempFilter.endDate" class="form-input" />
        </div>
      </div>

      <div class="modal-actions">
        <button class="reset-btn" @click="handleReset">초기화</button>
        <button class="apply-btn" @click="handleApply">적용하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  clients: {
    type: Array,
    required: true
  },
  viewMode: {
    type: String,
    required: true
  },
  initialFilter: {
    type: Object,
    required: true
  }
})

// 부모에게 이벤트를 보낼 목록
const emit = defineEmits(['close', 'apply'])

// 부모로부터 받은 현재 필터 상태를 모달 내부에서 쓸 임시 필터로 복사
const tempFilter = ref({ ...props.initialFilter })

// 적용하기 버튼 클릭 시에만 부모로 데이터 전달
const handleApply = () => {
  emit('apply', { ...tempFilter.value })
}

// 초기화 버튼 클릭 시: 모달 내부의 값만 초기화하고 부모에게 보내지 않음
const handleReset = () => {
  tempFilter.value = { startDate: '', endDate: '', clientId: '' }
}
</script>

<style scoped>
.filter-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  width: 90%;
  max-width: 400px;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
}

.modal-header h3, .modal-content h3 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 18px;
  text-align: center;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1f2937;
}

.form-input {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background-color: #fff;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 10px;
}

.form-row .form-group {
  flex: 1;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.apply-btn, .reset-btn {
  flex: 1;
  padding: 14px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
  border: none;
}

.apply-btn {
  background-color: #3b82f6;
  color: white;
}

.reset-btn {
  background-color: #f3f4f6;
  color: #4b5563;
}
</style>
