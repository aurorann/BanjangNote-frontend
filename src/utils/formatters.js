/**
 * 숫자를 입력받아 자동으로 전화번호 하이픈(-) 포맷을 맞춰줍니다.
 * @param {string} value
 * @returns {string} 010-1234-5678 형식의 문자열
 */
export const autoFormatPhoneNumber = (value) => {
  if (!value) return ''

  // 1. 숫자가 아닌 문자는 모두 제거
  const onlyNums = value.replace(/[^\d]/g, '')

  // 2. 길이에 따라 하이픈(-) 추가
  if (onlyNums.length <= 3) {
    return onlyNums
  }
  if (onlyNums.length <= 7) {
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`
  }
  // 8자리 이상일 때 (최대 11자리까지만 자름)
  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`
}

/**
 * 전화번호 형식이 올바른지 검증합니다. (필요 시 저장 버튼 누를 때 사용)
 * @param {string} value
 * @returns {boolean}
 */
export const isValidPhoneNumber = (value) => {
  const regex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/
  return regex.test(value)
}

/**
 * 숫자를 입력받아 천 단위 콤마(,)를 찍어줍니다.
 * @param {string|number} value
 * @returns {string} 예: 150,000
 */
export const autoFormatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return ''

  // 숫자 이외의 문자(콤마 등) 싹 제거
  const onlyNums = value.toString().replace(/[^\d]/g, '')
  if (!onlyNums) return ''

  // 자바스크립트 내장 함수로 예쁘게 콤마 찍기
  return Number(onlyNums).toLocaleString('ko-KR')
}

/**
 * 콤마가 포함된 문자열에서 순수 숫자만 뽑아냅니다. (DB 저장용)
 * @param {string|number} value
 * @returns {number|string}
 */
export const stripCurrency = (value) => {
  if (value === null || value === undefined || value === '') return ''

  const onlyNums = value.toString().replace(/[^\d]/g, '')
  return onlyNums ? Number(onlyNums) : ''
}
