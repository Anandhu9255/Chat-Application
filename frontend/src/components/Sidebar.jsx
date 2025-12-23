import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'

export default function Sidebar({ chats = [], setChats, activeChat, onSelect }){
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const me = api.getUserIdFromToken()

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      try{
        const res = await api.get('/chats')
        if(!mounted) return
        const normalized = (res.data || []).map(c => ({ ...c, unreadCount: c.unreadCount || 0 }))
        if(setChats) setChats(normalized)
      }catch(e){ console.error(e) }
    }
    load()

    const onReceive = (message) => {
      if(!message) return
      const chatObj = message.chat || message.conversation || message.conversationId
      const chatId = (chatObj && (chatObj._id || chatObj)) || message.chatId
      if(!chatId) return
      setChats(prev => {
        const existing = prev.find(c => String(c._id) === String(chatId))
        const others = prev.filter(c => String(c._id) !== String(chatId))
        if(existing){
          const updated = { ...existing, latestMessage: message }
          if(!activeChat || String(activeChat._id) !== String(chatId)) updated.unreadCount = (updated.unreadCount || 0) + 1
          return [updated, ...others]
        }
        const placeholder = { _id: chatId, users: (message.chat && message.chat.users) || [], latestMessage: message, unreadCount: (!activeChat || String(activeChat._id) !== String(chatId)) ? 1 : 0 }
        return [placeholder, ...prev]
      })
    }

    socket.on('receive_message', onReceive)
    return ()=>{
      mounted = false
      socket.off('receive_message', onReceive)
    }
  },[setChats, activeChat])

  const handleSelect = (c) => { onSelect && onSelect(c) }

  return (
    <aside className="flex h-full w-[350px] md:w-[400px] flex-shrink-0 bg-transparent m-0 p-0">
      {/* Left rail - Contains only Logout now */}
      <div className="w-12 bg-[#0f1619] h-full flex flex-col items-center py-3">
        <div className="flex-1" />
        <button onClick={() => { try{ api.clearToken(); socket && socket.disconnect(); navigate('/login') }catch(e){} }} className="p-2 rounded text-gray-400 hover:text-white" title="Logout">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
        </button>
      </div>

      <div className="flex-1 bg-[#111b21] h-full flex flex-col border-r border-gray-700">
        {/* Header - Fixed: Removed the profile icon and made "Chats" bigger */}
        <div className="h-16 flex items-center px-4">
          <h1 className="text-2xl font-bold text-white tracking-wide">Chats</h1>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <input 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              placeholder="Search or start new chat" 
              className="w-full p-2 pl-4 rounded-lg bg-[#202c33] text-sm text-gray-300 outline-none placeholder-gray-500" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-dark">
          <ul className="space-y-0.5">
            {chats.map(c => {
              const others = (c.users || []).filter(u => String(u._id) !== String(me))
              const name = others.map(u=>u.name).join(', ') || 'Unknown'
              const last = c.latestMessage
              const isActive = activeChat && String(activeChat._id) === String(c._id)
              return (
                <li key={c._id} className={`flex items-center cursor-pointer p-3 border-b border-[#202c33]/30 ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`} onClick={()=>handleSelect(c)}>
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center text-lg font-bold text-white">
                    {(name[0] || '?').toUpperCase()}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-[15px] truncate text-white">{name}</div>
                      <div className="text-[11px] text-gray-400">
                        {last ? new Date(last.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 truncate mt-0.5">
                      {last ? last.content : 'No messages yet'}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </aside>
  )
}