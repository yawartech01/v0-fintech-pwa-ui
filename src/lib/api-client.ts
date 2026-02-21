import axios, { AxiosError } from 'axios'
import { io, Socket } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000'

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Add auth token to requests — use admin token for /admin/ routes
api.interceptors.request.use((config) => {
  const url = config.url || ''
  const isAdminRoute = url.startsWith('/admin/')
  const token = isAdminRoute
    ? localStorage.getItem('veltox_admin_token')
    : localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isAuthEndpoint = url.includes('/auth/')
      if (!isAuthEndpoint) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_id')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// WebSocket connection
let socket: Socket | null = null

export const connectWebSocket = (userId: string): Socket => {
  if (socket?.connected) {
    return socket
  }

  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('✅ WebSocket connected')
    socket?.emit('join_room', userId)
  })

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected')
  })

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error)
  })

  return socket
}

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getWebSocket = (): Socket | null => socket

export default api
