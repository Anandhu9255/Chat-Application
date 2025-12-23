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
        
        if (socket.connected) {
          socket.emit('request-online-status');
        }
      }catch(err){ console.error(err) }
    }
    init()
    
    const userId = api.getUserIdFromToken();
    if(userId) socket.emit('setup', userId);

    const onConnect = () => {
      socket.emit('request-online-status');
      if(userId) socket.emit('setup', userId);
    };

    const handleOnlineList = (onlineIds) => {
      setChats(prev => prev.map(chat => ({
        ...chat,
        users: chat.users.map(u => ({
          ...u,
          isOnline: onlineIds.includes(String(u._id))
        }))
      })));
    };

    const handleUserOnline = (data) => {
      // Handle both object {userId} and raw string
      const uId = typeof data === 'string' ? data : data.userId;
      setChats(prev => prev.map(chat => ({
        ...chat,
        users: chat.users.map(u => 
          String(u._id) === String(uId) ? { ...u, isOnline: true } : u
        )
      })));
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setChats(prev => prev.map(chat => ({
        ...chat,
        users: chat.users.map(u => 
          String(u._id) === String(userId) ? { ...u, isOnline: false, lastSeen } : u
        )
      })));
    };
    
    const handleIncoming = (message) => {
      setChats(prev => {
        if(!message || !message.chat) return prev;
        const chatId = message.chat._id || message.chat;
        
        return prev.map(chat => {
          if (String(chat._id) === String(chatId)) {
            return { 
              ...chat, 
              latestMessage: message,
              unreadCount: (activeChatRef.current?._id !== chatId) 
                ? (chat.unreadCount || 0) + 1 
                : 0
            };
          }
          return chat;
        });
      });
    };

    socket.on('connect', onConnect);
    socket.on('online-users-list', handleOnlineList);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('receive_message', handleIncoming);

    return () => {
      socket.off('connect', onConnect);
      socket.off('online-users-list', handleOnlineList);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('receive_message', handleIncoming);
    }
  },[])

  return (
    <div className="flex h-screen w-screen m-0 p-0 gap-0 overflow-hidden bg-[#0b141a]">
      <Sidebar 
        chats={chats} 
        setChats={setChats} 
        activeChat={activeChat} 
        onSelect={(c)=>{
          setActiveChatId(c._id)
          setChats(prev => prev.map(x => x._id === c._id ? { ...x, unreadCount: 0 } : x))
          socket.emit('message read', c._id)
        }} 
      />
      <div className="flex-1 h-full">
        <ChatWindow key={activeChatId} chat={activeChat} />
      </div>
    </div>
  )
}