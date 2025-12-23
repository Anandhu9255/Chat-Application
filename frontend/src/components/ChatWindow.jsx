import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import socket from '../services/socket'
import MessageInput from './MessageInput'

export default function ChatWindow({ chat }){
  const [messages, setMessages] = useState([])
  const userId = api.getUserIdFromToken()
  const containerRef = useRef(null)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }

  // Handle Sending
  const send = async (content) => {
    try {
      const res = await api.post('/messages', { content, chatId: chat._id })
      const newMessage = res.data;
      
      // Update UI for sender
      setMessages(prev => [...prev, newMessage])
      setTimeout(scrollToBottom, 50)

      // Broadcast to others
      socket.emit('new message', newMessage)
    } catch(e) {
      console.error(e)
    }
  }

  useEffect(()=>{
    if(!chat) return setMessages([])

    socket.emit('join_chat', chat._id)

    const load = async()=>{
      try{
        const res = await api.get(`/messages/${chat._id}?page=1&limit=30`)
        setMessages(res.data.messages)
        setTimeout(scrollToBottom, 50)
      }catch(e){ console.error(e) }
    }
    load()

    const onReceive = (message) => {
      if(!message) return
      
      const msgChatId = (message.chat?._id || message.chat || message.chatId)
      const senderId = (message.sender?._id || message.sender || message.senderId)

      // FIX: Only add to state if the message is for this chat AND NOT sent by me
      if(String(msgChatId) === String(chat._id) && String(senderId) !== String(userId)) {
        setMessages(prev => {
          const isDuplicate = prev.find(m => m._id === message._id)
          if (isDuplicate) return prev
          return [...prev, message]
        })
        setTimeout(scrollToBottom, 50)
      }
    }

    socket.on('receive_message', onReceive)
    return () => { socket.off('receive_message', onReceive) }
  }, [chat, userId]) 

  if(!chat) return <div className="h-full w-full flex items-center justify-center text-white bg-[#0b141a]">Select a chat</div>

  // WhatsApp Style: Show only the receiver's name
  const otherUsers = (chat.users || []).filter(u => String(u._id) !== String(userId))
  const chatTitle = otherUsers.map(u => u.name).join(', ') || 'Chat'

  return (
    <div className="h-full w-full flex flex-col relative m-0 p-0 bg-[#0b141a]">
      {/* Header - Fixed to show only receiver name */}
      <div className="h-16 flex items-center px-4 bg-[#202c33] border-b border-gray-700 w-full flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold text-white">
            {chatTitle[0]?.toUpperCase()}
          </div>
          <div className="font-medium text-white">{chatTitle}</div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 w-full overflow-y-auto p-4 space-y-3 bg-[#0b141a] scrollbar-dark">
        {messages.map(m=> {
          const senderId = (m.sender?._id || m.sender || m.senderId)
          const isMe = String(senderId) === String(userId)
          return (
            <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 ${isMe ? 'bg-[#005c4b] rounded-lg rounded-tr-none' : 'bg-[#202c33] rounded-lg rounded-tl-none'} shadow-sm`}> 
                <div className="text-sm text-white">{m.content}</div>
                <div className="text-[10px] text-gray-300 mt-1 text-right">
                    {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-[#202c33] p-3 w-full flex-shrink-0">
        <MessageInput onSend={send} />
      </div>
    </div>
  )
}