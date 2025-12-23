import { useState } from 'react'
import api from '../services/api'

export default function DevMulti(){
  const [email1,setEmail1]=useState('')
  const [pass1,setPass1]=useState('')
  const [email2,setEmail2]=useState('')
  const [pass2,setPass2]=useState('')
  const [error,setError]=useState(null)

  const openTwo = async (e) => {
    e.preventDefault()
    try{
      const res1 = await api.post('/auth/login',{ email: email1, password: pass1 })
      const res2 = await api.post('/auth/login',{ email: email2, password: pass2 })

      // Open windows passing token in hash to allow each window to set its own token
      const w1 = window.open(`/#token=${res1.data.token}`, '_blank')
      const w2 = window.open(`/#token=${res2.data.token}`, '_blank')
    }catch(err){
      setError(err?.response?.data?.message || 'Login failed for one of users')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl mb-4">Dev: Open two chat windows</h2>
      <form onSubmit={openTwo} className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input className="w-full p-2 border" placeholder="User1 email" value={email1} onChange={e=>setEmail1(e.target.value)} />
            <input type="password" className="w-full p-2 border mt-2" placeholder="User1 password" value={pass1} onChange={e=>setPass1(e.target.value)} />
          </div>
          <div>
            <input className="w-full p-2 border" placeholder="User2 email" value={email2} onChange={e=>setEmail2(e.target.value)} />
            <input type="password" className="w-full p-2 border mt-2" placeholder="User2 password" value={pass2} onChange={e=>setPass2(e.target.value)} />
          </div>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button className="px-4 py-2 bg-indigo-600 text-white rounded">Open two windows</button>
      </form>
    </div>
  )
}
