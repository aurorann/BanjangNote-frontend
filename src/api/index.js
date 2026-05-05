// 이곳에서 백엔드 주소를 딱 한 번만 정의합니다!
const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const api = {
  // GET 요청 (데이터 가져올 때)
  get: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    if (!response.ok) throw new Error('API GET Error')
    return response.json()
  },

  // POST 요청 (데이터 새로 추가할 때)
  post: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('API POST Error')
    return response.json()
  },

  // PUT 요청 (데이터 수정할 때 - 예: 일당 지급 완료 처리)
  put: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('API PUT Error')
    return response.json()
  },
}
