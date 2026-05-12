<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="logo">👷‍♂️ 반장노트</h1>
      <p class="subtitle">{{ isLoginMode ? '현장 관리를 시작하세요' : '새로운 반장님을 환영합니다' }}</p>

      <!-- 폼 영역 -->
      <form @submit.prevent="handleSubmit" class="auth-form">

        <!-- 회원가입일 때만 이름 입력 보이기 -->
        <div v-if="!isLoginMode" class="form-group">
          <label>이름</label>
          <input type="text" v-model="form.name" placeholder="예: 홍길동 반장님" required />
        </div>

        <div class="form-group">
          <label>이메일</label>
          <input
            type="email"
            v-model="form.email"
            @blur="validateEmail"
            @input="emailError ? validateEmail() : null"
            placeholder="example@email.com"
            :class="{ 'input-error': emailError }"
            required
          />
          <!-- 에러 메시지 출력 영역 -->
          <span v-if="emailError" class="error-text">{{ emailError }}</span>
        </div>

        <div class="form-group">
          <label>비밀번호</label>
          <input type="password" v-model="form.password" placeholder="비밀번호를 입력하세요" required />
        </div>

        <button type="submit" class="submit-btn">
          {{ isLoginMode ? '로그인' : '회원가입' }}
        </button>
      </form>

      <!-- 모드 전환 버튼 -->
      <div class="toggle-mode">
        <span>{{ isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?' }}</span>
        <button @click="toggleMode" class="text-btn">
          {{ isLoginMode ? '회원가입 하기' : '로그인 하기' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/index.js'
import { toast } from '@/stores/toast.js'

const router = useRouter()
const isLoginMode = ref(true)

const form = ref({
  name: '',
  email: '',
  password: ''
})

// 이메일 에러 메시지를 담을 변수
const emailError = ref('')

// 이메일 유효성 검사 함수 (정규식 사용)
const validateEmail = () => {
  // 영어/숫자 @ 영어/숫자 . 영어/숫자 구조인지 확인하는 정규식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!form.value.email) {
    emailError.value = '이메일을 입력해주세요.'
    return false
  }
  if (!emailRegex.test(form.value.email)) {
    emailError.value = '올바른 이메일 형식이 아닙니다.'
    return false
  }

  // 에러가 없으면 메시지 초기화
  emailError.value = ''
  return true
}

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  form.value = { name: '', email: '', password: '' }
  emailError.value = '' // 모드 전환 시 에러 메시지도 초기화
}

const handleSubmit = async () => {
  // 서버로 보내기 전 이메일 유효성 마지막 확인
  if (!validateEmail()) {
    toast.warn('이메일 형식을 확인해주세요.')
    return
  }

  try {
    if (isLoginMode.value) {
      const response = await api.post('/auth/login', {
        email: form.value.email,
        password: form.value.password
      })
      localStorage.setItem('token', response.token)
      localStorage.setItem('userName', response.name)
      toast.info(`환영합니다, ${response.name}님!`)
      router.push('/dashboard')
    } else {
      await api.post('/auth/signup', form.value)
      toast.info('회원가입이 완료되었습니다. 로그인해주세요!')
      toggleMode()
    }
  } catch (error) {
    console.error('인증 에러:', error)
    // 서버가 완전히 죽었거나 네트워크가 끊긴 경우 (Fetch 자체의 실패)
    if (error.message.includes('Failed to fetch') || error.message.includes('API POST Error')) {
      toast.error(isLoginMode.value
        ? '서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.'
        : '회원가입 처리 중 서버 문제가 발생했습니다.')
    }
    else {
      toast.error(error.message)
    }
  }
}
</script>

<style scoped src="../assets/css/login.css"></style>
