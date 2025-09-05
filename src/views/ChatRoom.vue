<template>
  <div class="chat-wrapper">
    <div class="chat-container">
    <!-- 顶部导航栏 -->
    <div class="chat-header">
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
      <button @click="handleLogout" class="logout-btn">
        退出登录
      </button>
    </div>

    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id" 
        :class="['message', { 'own-message': message.isOwn }]"
      >
        <div class="message-avatar">
          {{ message.sender.charAt(0).toUpperCase() }}
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">{{ message.sender }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-text">{{ message.text }}</div>
        </div>
      </div>
      <div v-if="messages.length === 0" class="empty-messages">
        <p>暂无消息，开始聊天吧！</p>
      </div>
    </div>

    <!-- 消息输入区域 -->
    <div class="chat-input">
      <div class="input-container">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          type="text" 
          placeholder="输入消息..."
          class="message-input"
          :disabled="sending"
        />
        <button 
          @click="sendMessage" 
          :disabled="!newMessage.trim() || sending || !wsConnected"
          class="send-btn"
        >
          {{ sending ? '发送中...' : wsConnected ? '发送' : '离线' }}
        </button>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const router = useRouter()
const messagesContainer = ref(null)
const newMessage = ref('')
const sending = ref(false)
const userInfo = ref(null)

// WebSocket相关状态
const ws = ref(null)
const wsConnected = ref(false)
const wsConnecting = ref(false)

// 模拟消息数据
const messages = ref([
  {
    id: 1,
    sender: '系统',
    text: '欢迎来到聊天室！',
    timestamp: new Date(Date.now() - 60000),
    isOwn: false
  },
  {
    id: 2,
    sender: '小明',
    text: '大家好！',
    timestamp: new Date(Date.now() - 30000),
    isOwn: false
  }
])

// WebSocket连接函数
const connectWebSocket = () => {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    return
  }
  
  wsConnecting.value = true
  
  try {
    // 连接WebSocket服务器
    ws.value = new WebSocket('ws://127.0.0.1:2345/ws')
    
    ws.value.onopen = () => {
      message.success('WebSocket连接已建立')
      wsConnected.value = true
      wsConnecting.value = false
      
      // 发送用户信息进行身份验证
      if (userInfo.value) {
        ws.value.send(JSON.stringify({
          type: 'auth',
          data: {
            token: localStorage.getItem('token'),
            user: userInfo.value
          }
        }))
      }
    }
    
    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    }
    
    ws.value.onclose = () => {
      message.warning('WebSocket连接已关闭')
      wsConnected.value = false
      wsConnecting.value = false
      
      // 尝试重连
      setTimeout(() => {
        if (!wsConnected.value) {
          connectWebSocket()
        }
      }, 3000)
    }
    
    ws.value.onerror = (error) => {
      message.error('WebSocket连接错误:', error)
      wsConnected.value = false
      wsConnecting.value = false
    }
  } catch (error) {
    message.error('创建WebSocket连接失败:', error)
    wsConnecting.value = false
  }
}

// 处理WebSocket消息
const handleWebSocketMessage = (data) => {
  switch (data.type) {
    case 'message':
      // 接收到新消息
      const senderName = data.data.sender?.username || data.data.sender || '未知用户'
      const textMessage = {
        id: data.data.id || Date.now(),
        sender: senderName,
        text: data.data.text || '',
        timestamp: new Date(data.data.timestamp || Date.now()),
        isOwn: senderName === userInfo.value?.username || senderName === userInfo.value?.nickname
      }
      messages.value.push(textMessage)
      nextTick(() => {
        scrollToBottom()
      })
      break
      
    case 'auth_success':
      console.log('身份验证成功')
      break
      
    case 'auth_failed':
      message.error('身份验证失败')
      router.push('/login')
      break
      
    case 'error':
      message.error('服务器错误:', data.message)
      break
      
    default:
      console.log('未知消息类型:', data)
  }
}

// 获取用户信息并连接WebSocket
onMounted(() => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo)
    // 连接WebSocket
    connectWebSocket()
  } else {
    // 如果没有用户信息，跳转到登录页
    router.push('/login')
  }
})

// 组件卸载时关闭WebSocket连接
onUnmounted(() => {
  if (ws.value) {
    ws.value.close()
  }
})

// 发送消息
const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value || !wsConnected.value) return
  
  sending.value = true
  
  try {
    // 通过WebSocket发送消息
    const messageData = {
      type: 'message',
      data: {
        text: newMessage.value.trim(),
        sender: {
          id: userInfo.value?.id,
          username: userInfo.value?.username || userInfo.value?.nickname || '我'
        },
        timestamp: Date.now()
      }
    }
    
    ws.value.send(JSON.stringify(messageData))
    
    // 清空输入框
    newMessage.value = ''
    
    // 发送成功后的处理
    setTimeout(() => {
      sending.value = false
    }, 300)
    
  } catch (error) {
    console.error('发送消息失败:', error)
    sending.value = false
    
    // 显示错误提示
    alert('发送消息失败，请检查网络连接')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

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
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}

// 组件挂载后滚动到底部
onMounted(() => {
  nextTick(() => {
    scrollToBottom()
  })
})
</script>

<style scoped>
/* 基础样式 - 将移动端样式作为基础 */
.chat-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  width: 100%;
  max-width: 100%;
}

.chat-header {
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

.logout-btn {
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;
}

.logout-btn:hover {
  background: #c0392b;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 0;
  height: 0;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 70%;
}

.message.own-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.own-message .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.sender-name {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.message-text {
  background: white;
  padding: 10px 14px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
}

.own-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.chat-input {
  padding: 15px 20px;
  background: white;
  border-top: 1px solid #e1e5e9;
}

.input-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.message-input:focus {
  border-color: #667eea;
}

.send-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 70px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 中等屏幕样式 (平板/小笔记本) */
@media (min-width: 769px) and (max-width: 1024px) {
  .chat-wrapper {
    padding: 15px;
    align-items: center;
    justify-content: center;
  }
  
  .chat-container {
    height: calc(100vh - 30px);
    border-radius: 8px;
    max-width: 100%;
    width: 100%;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  .chat-messages {
    height: 0;
    flex: 1;
  }
}

/* PC端样式 - 使用更高优先级 */
@media screen and (min-width: 1025px) {
  .chat-wrapper {
    padding: 30px !important;
    align-items: center !important;
    justify-content: center !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    min-height: 100vh !important;
  }
  
  .chat-container {
    height: calc(100vh - 60px) !important;
    border-radius: 16px !important;
    max-width: 1400px !important;
    width: 100% !important;
    overflow: hidden !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.15) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    background: white !important;
  }
  
  .chat-header {
    padding: 20px 30px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(225, 229, 233, 0.3);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    font-size: 18px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .user-details h3 {
    font-size: 18px;
    font-weight: 600;
  }
  
  .logout-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
    transition: all 0.3s ease;
  }
  
  .logout-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
  }
  
  .chat-messages {
    padding: 30px;
    gap: 20px;
    background: linear-gradient(180deg, #fafbfc 0%, #f8f9fa 100%);
  }
  
  .message {
    gap: 15px;
  }
  
  .message-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .message-text {
    padding: 12px 18px;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    font-size: 15px;
    line-height: 1.5;
  }
  
  .own-message .message-text {
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
  }
  
  .chat-input {
    padding: 20px 30px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(225, 229, 233, 0.3);
  }
  
  .message-input {
    padding: 14px 20px;
    border: 2px solid #e8ecf0;
    border-radius: 30px;
    font-size: 15px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  
  .message-input:focus {
    border-color: #667eea;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
    transform: translateY(-1px);
  }
  
  .send-btn {
    padding: 14px 24px;
    border-radius: 30px;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
  }
  
  .send-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  }
}

/* 移动端样式 */
@media (max-width: 768px) {
  .chat-wrapper {
    padding: 0;
    align-items: stretch;
  }
  
  .chat-container {
    height: 100dvh;
    min-height: 100vh;
    border-radius: 0;
    max-width: none;
  }
  
  .chat-header {
    padding: 12px 15px;
  }
  
  .user-details h3 {
    font-size: 14px;
  }
  
  .logout-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .chat-messages {
    padding: 15px;
    height: 0;
    flex: 1;
  }
  
  .message {
    max-width: 85%;
  }
  
  .chat-input {
    padding: 12px 15px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom)); /* 适配底部安全区域 */
  }
  
  .message-input {
    padding: 10px 14px;
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .send-btn {
    padding: 10px 16px;
    min-width: 60px;
  }
}

@media (max-width: 480px) {
  .avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  
  .message-avatar {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
  
  .message-text {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .chat-messages {
    padding: 10px;
    gap: 12px;
    height: 0;
    flex: 1;
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>