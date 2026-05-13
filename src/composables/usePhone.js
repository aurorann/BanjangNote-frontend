import { ref } from 'vue'
import { autoFormatPhoneNumber, isValidPhoneNumber } from '@/utils/formatters.js'

export function usePhone() {
  // 에러 메시지 상태를 공통 파일에서 관리합니다
  const phoneError = ref('')

  // 이벤트 객체를 받아서 포맷팅과 검증을 동시에 처리하는 함수
  const formatAndValidate = (event) => {
    const formatted = autoFormatPhoneNumber(event.target.value)

    // 커서 튐 방지
    event.target.value = formatted

    // 실시간 에러 검증 (12~13자리일 때 검사)
    if (formatted.length >= 12 && !isValidPhoneNumber(formatted)) {
      phoneError.value = '올바른 전화번호 형식이 아닙니다.'
    } else {
      phoneError.value = ''
    }

    // 예쁘게 바뀐 값을 컴포넌트 쪽으로 돌려줍니다
    return formatted
  }

  // 컴포넌트에서 쓸 수 있게 에러변수와 함수를 반환합니다
  return { phoneError, formatAndValidate }
}
