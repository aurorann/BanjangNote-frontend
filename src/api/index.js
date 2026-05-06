// 이곳에서 백엔드 주소를 딱 한 번만 정의합니다!
const BASE_URL = import.meta.env.VITE_API_BASE_URL

// 🔥 내 주머니(localStorage)에서 통행증을 꺼내서 헤더를 만드는 헬퍼 함수
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) {
    // 토큰이 있으면 "나 인증받은 사람이야!" 하고 Authorization 헤더를 붙입니다. (Bearer는 국제 표준 약속입니다)
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const api = {
  // GET 요청 (데이터 가져올 때)
  get: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers: getHeaders() })
    if (!response.ok) throw new Error('API GET Error')
    return response.json()
  },

  // POST 요청 (데이터 새로 추가할 때)
  post: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })

    // 1. 서버가 보낸 응답(텍스트)을 먼저 읽어냅니다.
    const text = await response.text()

    // 2. 서버가 400, 500 등 에러 코드를 보냈을 때 (🔥 이 부분이 핵심입니다!)
    if (!response.ok) {
      console.log("🚨 서버 에러 원본 텍스트:", text) // F12 개발자 도구에서 확인용

      // text(이미 존재하는 이메일입니다)가 있으면 그걸 던지고, 만약 텅 비어있으면 기본 에러를 던집니다.
      throw new Error(text || 'API POST Error')
    }

    // 3. 정상 응답일 때
    try {
      return text ? JSON.parse(text) : {}
    } catch (e) {
      return text
    }
  },

  // PUT 요청 (데이터 수정할 때 - 예: 일당 지급 완료 처리)
  put: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('API PUT Error')
    return response.json()
  },

  delete: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders() // 여기도 인증 헤더 필수!
    })
    const text = await response.text()
    if (!response.ok) throw new Error(text || 'API DELETE Error')
    try { return text ? JSON.parse(text) : {} } catch (e) { return text }
  }
}
