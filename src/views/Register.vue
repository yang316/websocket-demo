<template>
  <div class="register-container">
    <div class="register-box">
      <h2 class="register-title">用户注册</h2>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="nickname">昵称</label>
          <input
            id="nickname"
            v-model="registerForm.nickname"
            type="text"
            placeholder="请输入昵称"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="registerForm.username"
            type="text"
            placeholder="请输入用户名"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            required
            class="form-input"
          />
        </div>
        <button type="submit" class="register-btn" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div class="login-link">
        <span>已有账号？</span>
        <router-link to="/login" class="link">立即登录</router-link>
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
const registerForm = ref({
  nickname: '',
  username: '',
  password: '',
  confirmPassword: ''
})

// 状态管理
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 注册处理函数
const handleRegister = async () => {
  // 表单验证
  if (!registerForm.value.nickname || !registerForm.value.username || !registerForm.value.password) {
    errorMessage.value = '请填写完整的注册信息'
    return
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  if (registerForm.value.password.length < 6) {
    errorMessage.value = '密码长度不能少于6位'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await request('/auth/regist', 'post', {
      nickname: registerForm.value.nickname,
      username: registerForm.value.username,
      password: registerForm.value.password
    })

    if (response.data) {
      // 注册成功
      successMessage.value = '注册成功！即将跳转到登录页面...'
      
      // 2秒后跳转到登录页面
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  } catch (error) {
    console.error('注册失败:', error)
    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = '注册失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
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
}

/* 确保桌面端居中显示 */
@media (min-width: 769px) {
  .register-container {
    padding: 40px 20px;
  }
  
  .register-box {
    max-height: 80vh;
    overflow-y: auto;
  }
}

.register-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  min-width: 320px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  flex-shrink: 0;
}

/* 桌面端悬停效果 */
@media (min-width: 769px) {
  .register-box:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }
}

.register-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.register-form {
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

.register-btn {
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

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.register-btn:disabled {
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

.success-message {
  color: #27ae60;
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background: #f0f9f4;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  font-size: 14px;
}

.login-link {
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
  .register-container {
    padding: 40px;
  }
  
  .register-box {
    padding: 50px 45px;
    max-width: 520px;
    min-width: 450px;
    width: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  
  .register-title {
    font-size: 28px;
    margin-bottom: 35px;
  }
  
  .form-input {
    padding: 14px 18px;
    font-size: 16px;
  }
  
  .register-btn {
    padding: 16px;
    font-size: 17px;
  }
}

/* 中等桌面设备 */
@media (min-width: 992px) and (max-width: 1199px) {
  .register-container {
    padding: 30px;
  }
  
  .register-box {
    padding: 45px 40px;
    max-width: 480px;
    min-width: 400px;
    width: auto;
  }
  
  .register-title {
    font-size: 26px;
    margin-bottom: 32px;
  }
  
  .form-input {
    padding: 13px 17px;
    font-size: 16px;
  }
  
  .register-btn {
    padding: 15px;
    font-size: 16px;
  }
}

/* 平板设备 */
@media (max-width: 768px) {
  .register-container {
    padding: 15px;
  }
  
  .register-box {
    padding: 35px 25px;
    max-width: 450px;
  }
  
  .register-title {
    font-size: 22px;
    margin-bottom: 25px;
  }
  
  .form-input {
    padding: 14px 16px;
    font-size: 16px;
  }
  
  .register-btn {
    padding: 16px;
    font-size: 16px;
  }
}

/* 大屏手机 */
@media (max-width: 640px) {
  .register-container {
    padding: 10px;
  }
  
  .register-box {
    padding: 30px 20px;
    margin: 0 10px;
  }
  
  .register-title {
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
  
  .register-btn {
    padding: 14px;
    font-size: 16px;
  }
}

/* 小屏手机 */
@media (max-width: 480px) {
  .register-container {
    padding: 8px;
    min-height: 100vh;
    align-items: flex-start;
    padding-top: 5vh;
  }
  
  .register-box {
    padding: 25px 15px;
    margin: 0 5px;
    border-radius: 8px;
    min-width: 280px;
  }
  
  .register-title {
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
  
  .register-btn {
    padding: 12px;
    font-size: 16px;
    border-radius: 4px;
  }
  
  .error-message,
  .success-message {
    font-size: 13px;
    padding: 8px;
  }
}

/* 超小屏设备 */
@media (max-width: 360px) {
  .register-container {
    padding: 5px;
    padding-top: 3vh;
  }
  
  .register-box {
    padding: 20px 12px;
    margin: 0;
    min-width: 260px;
  }
  
  .register-title {
    font-size: 16px;
    margin-bottom: 18px;
  }
  
  .form-input {
    padding: 10px;
    font-size: 15px;
  }
  
  .register-btn {
    padding: 10px;
    font-size: 15px;
  }
}
</style>