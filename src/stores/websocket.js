import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWebSocketStore = defineStore('websocket', () => {
  // WebSocket实例
  const ws = ref(null)
  
  // 连接状态
  const isConnected = ref(false)
  const isConnecting = ref(false)
  
  // 消息历史
  const messages = ref([])
  
  // 连接WebSocket
  const connect = () => {
    if (ws.value && (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket已连接或正在连接中')
      return
    }
    
    isConnecting.value = true
    
    try {
      // 连接WebSocket服务器
      ws.value = new WebSocket('ws://127.0.0.1:2345/ws')
      
      ws.value.onopen = () => {
        console.log('WebSocket连接已建立')
        isConnected.value = true
        isConnecting.value = false
        
        // 发送用户信息进行身份验证
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        if (userInfo && Object.keys(userInfo).length > 0) {
          ws.value.send(JSON.stringify({
            type: 'auth',
            data: {
              token: localStorage.getItem('token'),
              user: userInfo
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
        console.log('WebSocket连接已关闭')
        isConnected.value = false
        isConnecting.value = false
        
        // 尝试重连
        setTimeout(() => {
          if (!isConnected.value && !isConnecting.value) {
            connect()
          }
        }, 3000)
      }
      
      ws.value.onerror = (error) => {
        console.error('WebSocket连接错误:', error)
        isConnected.value = false
        isConnecting.value = false
      }
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      isConnecting.value = false
    }
  }
  
  // 处理WebSocket消息
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'message':
        // 接收到新消息
        const message = {
          id: data.data.id || Date.now(),
          sender: data.data.sender?.username || data.data.sender || '未知用户',
          text: data.data.text || '',
          timestamp: new Date(data.data.timestamp || Date.now()),
          isOwn: false
        }
        
        // 检查是否是自己发送的消息
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        if (userInfo) {
          message.isOwn = message.sender === userInfo.username || message.sender === userInfo.nickname
        }
        
        messages.value.push(message)
        break
        
      case 'auth_success':
        console.log('身份验证成功')
        break
        
      case 'auth_failed':
        console.error('身份验证失败')
        // 可以在这里处理身份验证失败的情况
        break
        
      case 'error':
        console.error('服务器错误:', data.message)
        break
        
      default:
        console.log('未知消息类型:', data)
    }
  }
  
  // 发送消息
  const sendMessage = (messageData) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未连接，无法发送消息')
      return false
    }
    
    try {
      ws.value.send(JSON.stringify(messageData))
      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      return false
    }
  }
  
  // 断开连接
  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
    isConnecting.value = false
  }
  
  // 清空消息历史
  const clearMessages = () => {
    messages.value = []
  }
  
  return {
    isConnected,
    isConnecting,
    messages,
    connect,
    sendMessage,
    disconnect,
    clearMessages
  }
})