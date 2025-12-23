import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import DevMulti from './pages/DevMulti'
import api from './services/api'
import './App.css'

function RequireAuth({ children }){
  const [checking, setChecking] = useState(true)
  const [ok, setOk] = useState(false)
  const navigate = useNavigate()

  useEffect(()=>{
    const token = api.getToken()
    if (!token) { setChecking(false); setOk(false); return }
    // verify token with server
    api.get('/auth/me').then(()=>{
      setOk(true)
    }).catch(()=>{
      api.clearToken()
      setOk(false)
    }).finally(()=> setChecking(false))
  },[])

  if (checking) return null // or a spinner
  return ok ? children : <Navigate to="/login" />
}

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/chat" element={<RequireAuth><Chat/></RequireAuth>} />
        <Route path="/dev" element={<DevMulti/>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
