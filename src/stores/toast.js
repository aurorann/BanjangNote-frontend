import { ref } from 'vue'

// 상태값들 (State)
export const isToastVisible = ref(false)
export const toastMessage = ref('')
export const toastType = ref('success')

// 상태를 변화시키는 함수 (Action)
export const showToast = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  isToastVisible.value = true

  setTimeout(() => {
    isToastVisible.value = false
  }, 3000)
}

// 사용하기 편하게 묶은 객체 (Helper)
// showToast 선언보다 아래에 있어야 안전합니다.
export const toast = {
  success: (msg) => showToast(msg, 'success'),
  error: (msg) => showToast(msg, 'error'),
  warn: (msg) => showToast(msg, 'warning'),
  info: (msg) => showToast(msg, 'info'),
}
