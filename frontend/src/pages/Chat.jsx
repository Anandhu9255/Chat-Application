import { useEffect, useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import socket from '../services/socket'
import api from '../services/api'

export default function Chat(){
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const activeChatRef = useRef(null)

  useEffect(()=>{
    const init = async()=>{
      try{
        const res = await api.get('/chats')
        setChats(res.data)
      }catch(err){ console.error(err) }
    }
    init()
    
    const token = api.getToken()
    if(token){
      socket.emit('setup', api.getUserIdFromToken())
    }
    
    const handleIncoming = (message) => {
      setChats(prev => {
        if(!message || !message.chat) return prev
        const chatId = message.chat._id || message.chat
        const existing = prev.find(c => String(c._id) === String(chatId))
        let updated = prev.filter(c => String(c._id) !== String(chatId))
        if(existing){
          const merged = { ...existing, latestMessage: message }
          if(!activeChatRef.current || String(activeChatRef.current._id) !== String(chatId)){
            merged.unreadCount = (merged.unreadCount || 0) + 1
          }
          updated = [merged, ...prev.filter(c => String(c._id) !== String(chatId))]
        } else {
          const placeholder = { _id: chatId, users: message.chat.users || [], latestMessage: message, unreadCount: (!activeChatRef.current || String(activeChatRef.current._id) !== String(chatId)) ? 1 : 0 }
          updated = [placeholder, ...prev]
        }
        return updated
      })
    }

    socket.on('receive_message', handleIncoming)
    return () => {
      socket.off('receive_message', handleIncoming)
    }
  },[])

  useEffect(()=>{ activeChatRef.current = activeChat },[activeChat])

  return (
    /* FIXED: Added gap-0, p-0, and m-0 to the main wrapper to remove gaps 1 and 2 */
    <div className="flex h-screen w-screen m-0 p-0 gap-0 overflow-hidden bg-[#0b141a]">
      
      {/* Sidebar: Fixed width to prevent it from collapsing */}
      <Sidebar 
        chats={chats} 
        setChats={setChats} 
        activeChat={activeChat} 
        onSelect={(c)=>{
          setActiveChat(c)
          setChats(prev => prev.map(x => x._id === c._id ? { ...x, unreadCount: 0 } : x))
          try{ socket.emit('message read', c._id) }catch(e){}
        }} 
      />

      {/* ChatWindow: flex-1 forces it to touch the absolute right edge (Gap 3) */}
      <div className="flex-1 h-full">
        <ChatWindow chat={activeChat} />
      </div>
    </div>
  )
}