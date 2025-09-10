<template>
  <div class="friend-list-container">
    <div class="friend-list-box">
      <!-- 顶部导航栏 -->
      <div class="friend-list-header">
        <div class="user-info">
          <div class="avatar">
            {{ userInfo?.nickname?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div class="user-details">
            <h3>{{ userInfo?.nickname || '用户' }}</h3>
            <span :class="['status', { 'connected': wsConnected, 'connecting': wsConnecting, 'disconnected': !wsConnected && !wsConnecting }]">
              {{ getConnectionStatus() }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <router-link to="/profile" class="profile-btn">
            个人信息
          </router-link>
          <button @click="handleLogout" class="logout-btn">
            退出登录
          </button>
        </div>
      </div>

      <!-- 好友列表 -->
      <div class="friend-list">
        <h2 class="section-title">好友列表</h2>
        
        <div v-if="loading" class="loading-state">
          <p>加载中...</p>
        </div>
        
        <div v-else-if="friends.length === 0" class="empty-state">
          <p>暂无好友</p>
          <button class="add-friend-btn">添加好友</button>
        </div>
        
        <div v-else class="friends-container">
          <div 
            v-for="friend in friends" 
            :key="friend.id" 
            class="friend-item"
            @click="enterChatRoom(friend)"
          >
            <div class="friend-avatar">
              {{ friend.nickname.charAt(0).toUpperCase() }}
            </div>
            <div class="friend-info">
              <h3 class="friend-name">{{ friend.nickname }}</h3>
              <p class="friend-status">{{ friend.online ? '在线' : '离线' }}</p>
            </div>
            <div class="last-message" v-if="friend.lastMessage">
              <p class="message-preview">{{ friend.lastMessage }}</p>
              <span class="message-time">{{ formatTime(friend.lastMessageTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 群聊列表 -->
      <div class="group-list">
        <h2 class="section-title">群聊</h2>
        
        <div v-if="groups.length === 0" class="empty-state">
          <p>暂无群聊</p>
          <button class="create-group-btn">创建群聊</button>
        </div>
        
        <div v-else class="groups-container">
          <div 
            v-for="group in groups" 
            :key="group.id" 
            class="group-item"
            @click="enterGroupChat(group)"
          >
            <div class="group-avatar">
              {{ group.name.charAt(0).toUpperCase() }}
            </div>
            <div class="group-info">
              <h3 class="group-name">{{ group.name }}</h3>
              <p class="group-members">{{ group.memberCount }}人</p>
            </div>
            <div class="last-message" v-if="group.lastMessage">
              <p class="message-preview">{{ group.lastMessage }}</p>
              <span class="message-time">{{ formatTime(group.lastMessageTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useWebSocketStore } from '../stores/websocket'

const router = useRouter()
const wsStore = useWebSocketStore()

// 从WebSocket store获取连接状态
const wsConnected = computed(() => wsStore.isConnected)
const wsConnecting = computed(() => wsStore.isConnecting)

// 用户信息
const userInfo = ref(null)
const loading = ref(true)

// 好友列表和群聊列表
const friends = ref([])
const groups = ref([])

// 获取连接状态文本
const getConnectionStatus = () => {
  if (wsConnecting.value) {
    return '连接中...'
  } else if (wsConnected.value) {
    return '在线'
  } else {
    return '离线'
  }
}

// 获取用户信息和好友列表
const fetchUserData = async () => {
  loading.value = true
  
  try {
    // 从本地存储获取用户信息
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      userInfo.value = JSON.parse(storedUserInfo)
    } else {
      // 如果没有用户信息，跳转到登录页
      router.push('/login')
      return
    }
    
    // 模拟获取好友列表数据
    // 实际项目中应该从API获取
    setTimeout(() => {
      friends.value = [
        {
          id: 1,
          username: 'user1',
          nickname: '小明',
          online: true,
          lastMessage: '你好，最近怎么样？',
          lastMessageTime: Date.now() - 3600000
        },
        {
          id: 2,
          username: 'user2',
          nickname: '小红',
          online: false,
          lastMessage: '下次再聊！',
          lastMessageTime: Date.now() - 86400000
        },
        {
          id: 3,
          username: 'user3',
          nickname: '小李',
          online: true,
          lastMessage: '好的，明天见！',
          lastMessageTime: Date.now() - 7200000
        }
      ]
      
      groups.value = [
        {
          id: 1,
          name: '项目讨论组',
          memberCount: 5,
          lastMessage: '小明: 明天开会讨论进度',
          lastMessageTime: Date.now() - 1800000
        },
        {
          id: 2,
          name: '朋友圈',
          memberCount: 8,
          lastMessage: '小红: 周末有人一起出去玩吗？',
          lastMessageTime: Date.now() - 3600000
        }
      ]
      
      loading.value = false
    }, 1000)
    
  } catch (error) {
    console.error('获取数据失败:', error)
    message.error('获取数据失败，请稍后再试')
    loading.value = false
  }
}

// 进入聊天室
const enterChatRoom = (friend) => {
  // 存储当前聊天对象信息
  localStorage.setItem('currentChat', JSON.stringify({
    type: 'private',
    id: friend.id,
    name: friend.nickname
  }))
  
  // 跳转到聊天室
  router.push('/chatroom')
}

// 进入群聊
const enterGroupChat = (group) => {
  // 存储当前聊天对象信息
  localStorage.setItem('currentChat', JSON.stringify({
    type: 'group',
    id: group.id,
    name: group.name
  }))
  
  // 跳转到聊天室
  router.push('/chatroom')
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (date.toDateString() === now.toDateString()) { // 今天
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('currentChat')
  wsStore.disconnect()
  router.push('/login')
}

// 页面加载时获取数据
onMounted(() => {
  fetchUserData()
  
  // 确保WebSocket连接
  if (!wsConnected.value && !wsConnecting.value) {
    wsStore.connect()
  }
})
</script>

<style scoped>
.friend-list-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.friend-list-box {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  width: 100%;
  max-width: 800px;
}

.friend-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e1e5e9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.user-details h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.status {
  font-size: 12px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.status.connected {
  color: #27ae60;
}

.status.connecting {
  color: #f39c12;
  animation: pulse 1.5s infinite;
}

.status.disconnected {
  color: #e74c3c;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.profile-btn {
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  text-decoration: none;
  display: inline-block;
}

.profile-btn:hover {
  background-color: #3a80d2;
}

.logout-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #d32f2f;
}

.section-title {
  padding: 15px 20px;
  margin: 0;
  font-size: 18px;
  color: #333;
  border-bottom: 1px solid #e1e5e9;
}

.friend-list, .group-list {
  background: white;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state, .empty-state {
  padding: 30px;
  text-align: center;
  color: #666;
}

.add-friend-btn, .create-group-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.add-friend-btn:hover, .create-group-btn:hover {
  background-color: #3a80d2;
}

.friend-item, .group-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.friend-item:hover, .group-item:hover {
  background-color: #f9f9f9;
}

.friend-item:last-child, .group-item:last-child {
  border-bottom: none;
}

.friend-avatar, .group-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  margin-right: 15px;
  flex-shrink: 0;
}

.friend-info, .group-info {
  flex: 1;
  min-width: 0;
}

.friend-name, .group-name {
  margin: 0 0 5px;
  font-size: 16px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-status, .group-members {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.last-message {
  text-align: right;
  margin-left: 10px;
  max-width: 30%;
}

.message-preview {
  margin: 0 0 5px;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-time {
  font-size: 12px;
  color: #999;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .friend-list-box {
    max-width: none;
    border-radius: 0;
  }
  
  .friend-list-header {
    padding: 12px 15px;
  }
  
  .user-details h3 {
    font-size: 14px;
  }
  
  .header-actions {
    gap: 8px;
  }
  
  .profile-btn,
  .logout-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .section-title {
    padding: 12px 15px;
    font-size: 16px;
  }
  
  .friend-item, .group-item {
    padding: 12px 15px;
  }
  
  .friend-avatar, .group-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
    margin-right: 12px;
  }
  
  .friend-name, .group-name {
    font-size: 15px;
  }
  
  .friend-status, .group-members {
    font-size: 13px;
  }
  
  .message-preview {
    font-size: 13px;
  }
  
  .message-time {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .last-message {
    display: none;
  }
  
  .friend-avatar, .group-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
}
</style>