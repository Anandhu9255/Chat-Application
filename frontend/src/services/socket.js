import { io } from 'socket.io-client'
import api from './api'

// UPDATED: Pointing to Render and added transports for stability
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://chat-application-7hvg.onrender.com'
const token = api.getToken()

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'], // Critical for Render/Vercel connectivity
  ...(token && { auth: { token } })
})

if (token) {
  socket.connect()
}

socket.on('connect_error', (err) => {
  console.error('Socket connect error:', err.message)
  if (err && err.message === 'Authentication error') {
    api.clearToken()
  }
})

export default socket