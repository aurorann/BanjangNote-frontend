import { toast } from '@/stores/toast.js'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// localStorage에서 통행증을 꺼내서 헤더를 만드는 헬퍼 함수
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) {
    // 토큰이 있으면 Authorization 헤더를 붙임
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// 공통 응답 처리기 (에러 가로채기)
// 서버에서 온 응답을 이 함수가 먼저 받아서 검사한 뒤 컴포넌트로 넘김
const handleResponse = async (response) => {
  // 토큰 만료 (401 Unauthorized) 처리
  if (response.status === 401) {
    toast.error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.')
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/' // 로그인 화면으로 강제 이동 및 새로고침
    throw new Error('Session Expired') // 이후 로직 중단
  }

  // 삭제된 현장 등 없는 데이터에 접근 (404 Not Found) 처리
  if (response.status === 404) {
    toast.error('요청하신 데이터를 찾을 수 없습니다.')
    window.location.href = '/dashboard' // 대시보드로 복귀
    throw new Error('Not Found')
  }

  // 서버 응답 본문 텍스트 읽기
  const text = await response.text()

  // 그 외 에러 (400 잘못된 요청, 500 서버 에러 등)
  if (!response.ok) {
    console.log("🚨 서버 에러 원본 텍스트:", text)
    throw new Error(text || `API Error (${response.status})`)
  }

  // 정상 응답일 경우 JSON으로 변환해서 반환 (비어있으면 빈 객체)
  try {
    return text ? JSON.parse(text) : {}
  } catch (e) {
    return text // JSON 파싱이 안 되는 순수 텍스트면 텍스트 그대로 반환
  }
}

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  },

  delete: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  patch: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : null // 데이터가 있으면 넣고 없으면 null
    })
    return handleResponse(response)
  },
}
