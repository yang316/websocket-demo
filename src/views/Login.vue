<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">用户登录</h2>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">账号</label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            placeholder="请输入账号"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            required
            class="form-input"
          />
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div class="register-link">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '../api/request'

const router = useRouter()

// 表单数据
const loginForm = ref({
  username: '',
  password: ''
})

// 状态管理
const loading = ref(false)
const errorMessage = ref('')

// 登录处理函数
const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    errorMessage.value = '请填写完整的登录信息'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await request('/auth/login', 'post', {
      username: loginForm.value.username,
      password: loginForm.value.password
    })

    if (response.data) {
      console.log(response.data)
      // 登录成功，保存token或用户信息
      localStorage.setItem('token', response.data.data.token)
      localStorage.setItem('userInfo', JSON.stringify(response.data.data.user))
      
      // 跳转到好友列表页面
      router.push('/friendlist')
    }
  } catch (error) {
    console.error('登录失败:', error)
    errorMessage.value = '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh; /* 动态视口高度，更好的移动端支持 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  margin: 0;
  background-size: 200% 200%;
  animation: gradient-animation 10s ease infinite;
}

@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 确保桌面端居中显示 */
@media (min-width: 769px) {
  .login-container {
    padding: 40px 20px;
  }
  
  .login-box {
    max-height: 80vh;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2), 0 10px 20px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  min-width: 320px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  flex-shrink: 0;
}

/* 桌面端悬停效果 */
@media (min-width: 769px) {
  .login-box:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 16px; /* 防止iOS缩放 */
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  -webkit-appearance: none; /* 移除默认样式 */
  -moz-appearance: none;
  appearance: none;
  background-color: #fff;
  line-height: 1.5;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input::placeholder {
  color: #aaa;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 10px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 14px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  margin-left: 5px;
}

.link:hover {
  text-decoration: underline;
}

/* 大屏桌面设备优化 */
@media (min-width: 1200px) {
  .login-container {
    padding: 40px;
  }
  
  .login-box {
    padding: 50px 45px;
    max-width: 480px;
    min-width: 400px;
    width: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  
  .login-title {
    font-size: 28px;
    margin-bottom: 35px;
  }
  
  .form-input {
    padding: 14px 18px;
    font-size: 16px;
  }
  
  .login-btn {
    padding: 16px;
    font-size: 17px;
  }
}

/* 中等桌面设备 */
@media (min-width: 992px) and (max-width: 1199px) {
  .login-container {
    padding: 30px;
  }
  
  .login-box {
    padding: 45px 40px;
    max-width: 450px;
    min-width: 380px;
    width: auto;
  }
  
  .login-title {
    font-size: 26px;
    margin-bottom: 32px;
  }
  
  .form-input {
    padding: 13px 17px;
    font-size: 16px;
  }
  
  .login-btn {
    padding: 15px;
    font-size: 16px;
  }
}

/* 平板设备 */
@media (max-width: 768px) {
  .login-container {
    padding: 15px;
  }
  
  .login-box {
    padding: 35px 25px;
    max-width: 450px;
  }
  
  .login-title {
    font-size: 22px;
    margin-bottom: 25px;
  }
  
  .form-input {
    padding: 14px 16px;
    font-size: 16px;
  }
  
  .login-btn {
    padding: 16px;
    font-size: 16px;
  }
}

/* 大屏手机 */
@media (max-width: 640px) {
  .login-container {
    padding: 10px;
  }
  
  .login-box {
    padding: 30px 20px;
    margin: 0 10px;
  }
  
  .login-title {
    font-size: 20px;
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 18px;
  }
  
  .form-input {
    padding: 12px 14px;
    font-size: 16px;
  }
  
  .login-btn {
    padding: 14px;
    font-size: 16px;
  }
}

/* 小屏手机 */
@media (max-width: 480px) {
  .login-container {
    padding: 8px;
    min-height: 100vh;
    align-items: flex-start;
    padding-top: 10vh;
  }
  
  .login-box {
    padding: 25px 15px;
    margin: 0 5px;
    border-radius: 8px;
    min-width: 280px;
  }
  
  .login-title {
    font-size: 18px;
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-group label {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .form-input {
    padding: 12px;
    font-size: 16px;
    border-radius: 4px;
  }
  
  .login-btn {
    padding: 12px;
    font-size: 16px;
    border-radius: 4px;
  }
  
  .error-message {
    font-size: 13px;
    padding: 8px;
  }
}

/* 超小屏设备 */
@media (max-width: 360px) {
  .login-container {
    padding: 5px;
    padding-top: 8vh;
  }
  
  .login-box {
    padding: 20px 12px;
    margin: 0;
    min-width: 260px;
  }
  
  .login-title {
    font-size: 16px;
    margin-bottom: 18px;
  }
  
  .form-input {
    padding: 10px;
    font-size: 15px;
  }
  
  .login-btn {
    padding: 10px;
    font-size: 15px;
  }
}
</style>
