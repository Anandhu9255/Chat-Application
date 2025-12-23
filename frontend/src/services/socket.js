import { io } from 'socket.io-client'
import api from './api'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
const token = api.getToken()
const socket = io(SOCKET_URL, {
  autoConnect: false,
  ...(token && { auth: { token } })
})

if (token) {
  socket.connect()
}

socket.on('connect_error', (err) => {
  console.error('Socket connect error:', err.message)
  if (err && err.message === 'Authentication error') {
    api.clearToken()
    // optionally trigger app-level re-login UI
  }
})

export default socket
