import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Register(){
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [showPassword, setShowPassword] = useState(false) // State for eye button
  const [error,setError]=useState(null)
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    try{
      await api.post('/auth/register',{ name, email, password })
      navigate('/login')
    }catch(err){
      setError(err?.response?.data?.message || 'Register failed')
    }
  }

  return (
    <div className="min-h-screen w-screen bg-[#0b141a] flex items-center justify-center p-0">
      <div className="w-full max-w-md bg-[#111b21] rounded-lg p-6 mx-4">
        <h2 className="text-2xl mb-4 text-white">Register</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full p-3 rounded-full border border-transparent bg-[#0b141a] text-white placeholder-gray-400 outline-none"
            placeholder="Name"
            value={name}
            onChange={e=>setName(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-full border border-transparent bg-[#0b141a] text-white placeholder-gray-400 outline-none"
            placeholder="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
          />
          
          {/* Password Container */}
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-3 rounded-full border border-transparent bg-[#0b141a] text-white placeholder-gray-400 outline-none"
              placeholder="Password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {error && <div className="text-red-500 text-sm px-2">{error}</div>}
          <button className="w-full px-4 py-3 bg-[#25D366] text-white rounded-full font-semibold">Register</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-300">Have an account? <Link to="/login" className="text-[#25D366]">Login</Link></p>
      </div>
    </div>
  )
}