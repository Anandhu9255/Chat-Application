import axios from 'axios'

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || 'https://chat-application-7hvg.onrender.com/api' 
})

API.getToken = () => {
  try {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || null
  } catch(e) { return null }
}

API.setToken = (token, { persist = true } = {}) => {
  try {
    sessionStorage.setItem('token', token)
    if(persist) localStorage.setItem('token', token)
  } catch(e) {}
}

API.clearToken = () => {
  try { sessionStorage.removeItem('token') } catch(e) {}
  try { localStorage.removeItem('token') } catch(e) {}
}

API.interceptors.request.use(cfg => {
  const token = API.getToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

API.getUserIdFromToken = () => {
  try {
    const token = API.getToken()
    if(!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.id
  } catch(e) { return null }
}

export default API