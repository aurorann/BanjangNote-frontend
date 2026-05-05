<template>
  <div class="login-screen">
    <div class="logo-area">
      <h1>BanjangNote</h1>
      <p>현장 마스터를 위한 일일 장부</p>
    </div>

    <div class="input-group">
      <input type="email" placeholder="이메일" />
      <input type="password" placeholder="비밀번호" />
      <button class="login-btn" @click="$router.push('/dashboard')">로그인</button>
    </div>
  </div>
</template>
