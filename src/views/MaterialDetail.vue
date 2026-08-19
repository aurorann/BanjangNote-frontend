<template>
  <div class="project-detail-screen">
    <div v-if="loading" class="full-screen-loader">
      <div class="spinner"></div>
      <p>부자재 정보를 불러오는 중...</p>
    </div>

    <template v-else>
      <header class="top-nav">
        <button class="back-btn" @click="$router.back()">◀ 이전</button>
        <h2>부자재 관리</h2>
        <div style="width: 60px;"></div>
      </header>

      <div class="worker-section">
        <div class="section-header-flex">
          <h3 class="section-title" style="margin: 0;">부자재 사용 내역</h3>
          <div class="summary-stats">
            <span class="stat-badge">총 {{ materials?.length || 0 }}건</span>
            <span class="stat-money">{{ totalMaterialCost.toLocaleString() }}원</span>
          </div>
        </div>

        <!-- 부자재 리스트 -->
        <div class="worker-card" v-for="item in materials" :key="item.id">
          <div class="worker-header">
            <div>
              <span class="worker-name">{{ item.material?.name || '이름 없음' }}</span>
            </div>
            <div class="header-right">
              <span class="worker-rate">단가: {{ (item.material?.unitPrice || 0).toLocaleString() }}원</span>
              <!-- 수정 버튼 추가 -->
              <button class="edit-text-btn" @click="openEditModal(item)">수정</button>
            </div>
          </div>

          <div class="worker-body">
            <div class="work-days-control">
              <button class="circle-btn" @click="updateQty(item, -1)">-</button>
              <span class="days-text">{{ item.quantity || 0 }}개</span>
              <button class="circle-btn" @click="updateQty(item, 1)">+</button>
            </div>
            <div class="pay-info">
              <div class="total-pay">{{ ((item.quantity || 0) * (item.material?.unitPrice || 0)).toLocaleString() }}원</div>
            </div>
          </div>
        </div>

        <!-- 새 부자재 추가 버튼 -->
        <button class="add-full-btn" @click="openAddModal">
          + 새 부자재 등록
        </button>
      </div>
    </template>

    <!-- 등록/수정 모달 (팝업) -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEditMode ? '부자재 수정' : '새 부자재 등록' }}</h3>

        <div class="form-group">
          <label>부자재명</label>
          <input type="text" v-model="form.name" placeholder="예: 벽지, 본드 등">
        </div>

        <div class="form-group">
          <label>단가 (원)</label>
          <input type="number" v-model="form.unitPrice" placeholder="0">
        </div>

        <div class="form-group">
          <label>수량</label>
          <input type="number" v-model="form.quantity" placeholder="0">
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">취소</button>
          <button class="save-btn" @click="saveMaterial">저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/index.js'
import '@/assets/css/project-detail.css'

const route = useRoute()
const projectId = route.params.id

const materials = ref([])
const loading = ref(true)

// 모달 제어 상태
const showModal = ref(false)
const isEditMode = ref(false)
const editTargetId = ref(null)

// 폼 데이터 (등록/수정에 사용)
const form = reactive({
  name: '',
  unitPrice: 0,
  quantity: 0
})

const totalMaterialCost = computed(() => {
  if (!Array.isArray(materials.value)) return 0;
  return materials.value.reduce((sum, item) => {
    const price = item.material?.unitPrice || 0;
    const qty = item.quantity || 0;
    return sum + (qty * price);
  }, 0)
})

// 데이터 불러오기
const fetchData = async () => {
  try {
    const res = await api.get(`/projects/${projectId}/materials`)
    materials.value = res.data ? res.data : res;
  } catch (error) {
    console.error('API 호출 에러:', error)
  }
}

onMounted(async () => {
  loading.value = true
  await fetchData()
  loading.value = false
})

// +, - 버튼으로 수량 즉시 변경
const updateQty = async (item, delta) => {
  if (item.quantity + delta < 0) return
  item.quantity += delta
  await api.put(`/materials/${item.id}`, { quantity: item.quantity })
}

// ------------------------------------
// 모달(팝업) 관련 로직
// ------------------------------------

const openAddModal = () => {
  isEditMode.value = false
  form.name = ''
  form.unitPrice = 0
  form.quantity = 0
  showModal.value = true
}

const openEditModal = (item) => {
  isEditMode.value = true
  editTargetId.value = item.id
  form.name = item.material?.name || ''
  form.unitPrice = item.material?.unitPrice || 0
  form.quantity = item.quantity || 0
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveMaterial = async () => {
  try {
    if (isEditMode.value) {
      // 수정
      await api.put(`/materials/${editTargetId.value}/detail`, form)
    } else {
      // 신규 등록
      await api.post(`/projects/${projectId}/materials`, form)
    }
    closeModal()
    await fetchData() // 저장 후 리스트 새로고침
  } catch (error) {
    console.error('저장 실패:', error)
    alert('저장에 실패했습니다.')
  }
}
</script>

<style scoped>
.worker-section {
  margin-top: 20px;
}

/* 리스트 내 우측 정렬용 */
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-text-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  padding: 4px;
}

/* 추가 버튼 */
.add-full-btn {
  width: 100%;
  padding: 15px;
  margin-top: 15px;
  background-color: #f3f4f6;
  border: 1px dashed #9ca3af;
  border-radius: 8px;
  color: #4b5563;
  font-weight: bold;
  cursor: pointer;
}

.add-full-btn:hover {
  background-color: #e5e7eb;
}

/* 모달 팝업 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
  color: #4b5563;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .save-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.cancel-btn {
  background: #f3f4f6;
  color: #4b5563;
}

.save-btn {
  background: #1f2937;
  color: white;
}
</style>
