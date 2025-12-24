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
        const sorted = res.data.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setChats(sorted)
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
    
    const handleNewMessage = (msg) => {
      setChats(prev => {
        const chatId = msg.chat?._id || msg.chat;
        const existingChatIndex = prev.findIndex(c => String(c._id) === String(chatId));

        if (existingChatIndex !== -1) {
          const updatedList = [...prev];
          const updatedChat = {
            ...updatedList[existingChatIndex],
            latestMessage: msg,
            updatedAt: new Date().toISOString()
          };
          updatedList.splice(existingChatIndex, 1);
          return [updatedChat, ...updatedList];
        } else if (msg.chat && typeof msg.chat === 'object') {
          return [{ ...msg.chat, latestMessage: msg, updatedAt: new Date().toISOString() }, ...prev];
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
          socket.emit('join chat', c._id); // Join room immediately on select
          socket.emit('message read', c._id)
        }} 
      />
      <div className="flex-1 h-full">
        <ChatWindow key={activeChatId} chat={activeChat} />
      </div>
    </div>
  )
}