import { useEffect, useState, useRef, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import socket from '../services/socket'
import api from '../services/api'

export default function Chat(){
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const activeChatRef = useRef(null)

  const activeChat = useMemo(() => {
    return chats.find(c => String(c._id) === String(activeChatId)) || null;
  }, [chats, activeChatId]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(()=>{
    const init = async()=>{
      try{
        const res = await api.get('/chats')
        setChats(res.data)
        if (socket.connected) socket.emit('request-online-status');
      }catch(err){ console.error(err) }
    }
    init()
    
    const userId = api.getUserIdFromToken();
    if(userId) socket.emit('setup', userId);

    const onConnect = () => {
      socket.emit('request-online-status');
      if(userId) socket.emit('setup', userId);
    };

    const handleUserOnline = (data) => {
      const uId = typeof data === 'string' ? data : data.userId;
      setChats(prev => prev.map(chat => ({
        ...chat,
        users: chat.users.map(u => String(u._id) === String(uId) ? { ...u, isOnline: true } : u)
      })));
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setChats(prev => prev.map(chat => ({
        ...chat,
        users: chat.users.map(u => String(u._id) === String(userId) ? { ...u, isOnline: false, lastSeen } : u)
      })));
    };
    
    // UPDATED: Forces sidebar to refresh message and move chat to top
    const handleNewMessage = (msg) => {
      setChats(prev => {
        const chatId = msg.chat?._id || msg.chat;
        const existingChatIndex = prev.findIndex(c => String(c._id) === String(chatId));

        if (existingChatIndex !== -1) {
          const updatedChats = [...prev];
          // Update message content
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            latestMessage: msg,
            updatedAt: new Date().toISOString()
          };

          // Re-order: Move this chat to the top
          const [movedChat] = updatedChats.splice(existingChatIndex, 1);
          return [movedChat, ...updatedChats];
        }
        return prev;
      });
    };

    socket.on('connect', onConnect);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('receive_message', handleNewMessage);
    }
  },[])

  return (
    <div className="flex h-screen w-screen m-0 p-0 overflow-hidden bg-[#0b141a]">
      <Sidebar 
        chats={chats} 
        setChats={setChats} 
        activeChat={activeChat} 
        onSelect={(c)=>{
          setActiveChatId(c._id)
          socket.emit('message read', c._id)
        }} 
      />
      <div className="flex-1 h-full">
        <ChatWindow key={activeChatId} chat={activeChat} />
      </div>
    </div>
  )
}