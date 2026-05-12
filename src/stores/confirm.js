import { ref } from 'vue'

export const isConfirmVisible = ref(false)
export const confirmMessage = ref('')
let resolvePromise = null // 사용자의 응답을 기다릴 약속

export const showConfirm = (msg) => {
  confirmMessage.value = msg
  isConfirmVisible.value = true

  // 프라미스를 반환하여 호출한 곳에서 await로 기다릴 수 있게 함
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

// 사용자가 버튼을 눌렀을 때 실행될 함수
export const onConfirmResponse = (value) => {
  isConfirmVisible.value = false
  if (resolvePromise) resolvePromise(value) // true 또는 false 반환
}
