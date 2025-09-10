<template>
  <div class="profile-container">
    <div class="profile-box">
      <h2 class="profile-title">个人信息</h2>
      <form @submit.prevent="handleUpdateProfile" class="profile-form">
        <div class="form-group">
          <label for="nickname">昵称</label>
          <input
            id="nickname"
            v-model="profileForm.nickname"
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
            v-model="profileForm.username"
            type="text"
            placeholder="请输入用户名"
            disabled
            class="form-input disabled"
          />
        </div>
        <div class="form-group">
          <label for="avatar">头像</label>
          <div class="avatar-upload">
            <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar-preview" alt="头像预览" />
            <div v-else class="avatar-placeholder">暂无头像</div>
            <input
              type="file"
              id="avatar"
              accept="image/*"
              @change="handleAvatarChange"
              class="avatar-input"
            />
            <label for="avatar" class="avatar-btn">选择图片</label>
          </div>
        </div>
        <div class="form-group">
          <label for="bio">个人简介</label>
          <textarea
            id="bio"
            v-model="profileForm.bio"
            placeholder="请输入个人简介"
            class="form-textarea"
          ></textarea>
        </div>
        <button type="submit" class="update-btn" :disabled="loading">
          {{ loading ? '更新中...' : '更新信息' }}
        </button>
      </form>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div class="back-link">
        <router-link to="/chatroom" class="link">返回聊天室</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '../api/request'

const router = useRouter()

// 表单数据
const profileForm = ref({
  nickname: '',
  username: '',
  avatar: '',
  bio: ''
})

// 状态管理
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const avatarFile = ref(null)

// 获取用户信息
const fetchUserProfile = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    // 从本地存储获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    
    // 如果有本地存储的用户信息，先填充表单
    if (userInfo) {
      profileForm.value.nickname = userInfo.nickname || ''
      profileForm.value.username = userInfo.username || ''
      profileForm.value.avatar = userInfo.avatar || ''
      profileForm.value.bio = userInfo.bio || ''
    }
    
    // 从服务器获取最新的用户信息
    const response = await request('/user/profile', 'get')
    if (response.data && response.data.data) {
      const userData = response.data.data
      profileForm.value.nickname = userData.nickname || ''
      profileForm.value.username = userData.username || ''
      profileForm.value.avatar = userData.avatar || ''
      profileForm.value.bio = userData.bio || ''
      
      // 更新本地存储的用户信息
      localStorage.setItem('userInfo', JSON.stringify(userData))
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    errorMessage.value = '获取用户信息失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// 处理头像变更
const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件类型
  if (!file.type.includes('image/')) {
    errorMessage.value = '请选择图片文件'
    return
  }
  
  // 验证文件大小（限制为2MB）
  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = '图片大小不能超过2MB'
    return
  }
  
  avatarFile.value = file
  
  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.value.avatar = e.target.result
  }
  reader.readAsDataURL(file)
}

// 更新个人信息处理函数
const handleUpdateProfile = async () => {
  // 表单验证
  if (!profileForm.value.nickname) {
    errorMessage.value = '昵称不能为空'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    // 准备表单数据
    const formData = new FormData()
    formData.append('nickname', profileForm.value.nickname)
    formData.append('bio', profileForm.value.bio || '')
    
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value)
    }
    
    // 发送更新请求
    const response = await request('/user/update-profile', 'post', formData)
    
    if (response.data) {
      successMessage.value = '个人信息更新成功'
      
      // 更新本地存储的用户信息
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      userInfo.nickname = profileForm.value.nickname
      userInfo.bio = profileForm.value.bio
      
      if (response.data.data && response.data.data.avatar) {
        userInfo.avatar = response.data.data.avatar
        profileForm.value.avatar = response.data.data.avatar
      }
      
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      // 重置头像文件
      avatarFile.value = null
    }
  } catch (error) {
    console.error('更新个人信息失败:', error)
    errorMessage.value = '更新个人信息失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.profile-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.profile-box {
  width: 90%;
  max-width: 500px;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.profile-title {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
  font-size: 24px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #666;
}

.form-input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: #4a90e2;
  outline: none;
}

.form-input.disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.3s;
}

.form-textarea:focus {
  border-color: #4a90e2;
  outline: none;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ddd;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
  border: 1px dashed #ddd;
}

.avatar-input {
  display: none;
}

.avatar-btn {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.avatar-btn:hover {
  background-color: #e5e5e5;
}

.update-btn {
  padding: 12px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 8px;
}

.update-btn:hover {
  background-color: #3a80d2;
}

.update-btn:disabled {
  background-color: #a0c3e8;
  cursor: not-allowed;
}

.error-message {
  margin-top: 16px;
  color: #e74c3c;
  text-align: center;
  font-size: 14px;
}

.success-message {
  margin-top: 16px;
  color: #2ecc71;
  text-align: center;
  font-size: 14px;
}

.back-link {
  margin-top: 16px;
  text-align: center;
}

.link {
  color: #4a90e2;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.link:hover {
  color: #3a80d2;
  text-decoration: underline;
}

@media (max-width: 600px) {
  .profile-box {
    width: 95%;
    padding: 20px;
  }
}
</style>