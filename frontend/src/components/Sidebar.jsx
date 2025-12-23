import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'

export default function Sidebar({ chats = [], setChats, activeChat, onSelect }){
  const [q, setQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const navigate = useNavigate()
  const me = api.getUserIdFromToken()

  // Search Logic for all registered users
  useEffect(() => {
    const searchUsers = async () => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/users?search=${q}`);
        setSearchResults(res.data.filter(u => String(u._id) !== String(me)));
      } catch (e) { console.error(e) }
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [q, me]);

  const startNewChat = async (userId) => {
    try {
      const res = await api.post('/chats', { userId });
      if (!chats.find(c => c._id === res.data._id)) {
        setChats([res.data, ...chats]);
      }
      onSelect(res.data);
      setQ('');
    } catch (e) { console.error(e) }
  };

  const getStatusLabel = (u) => {
    if (u?.isOnline) return "online";
    if (u?.lastSeen) return new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return "";
  };

  return (
    <aside className="flex h-full w-[350px] md:w-[400px] flex-shrink-0 bg-[#111b21] border-r border-gray-700">
      <div className="w-12 bg-[#0f1619] h-full flex flex-col items-center py-3">
        <div className="flex-1" />
        <button onClick={() => { api.clearToken(); socket.disconnect(); navigate('/login') }} className="p-2 text-gray-400 hover:text-white">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 flex items-center px-4"><h1 className="text-xl font-bold text-white">Chats</h1></div>
        <div className="px-3 pb-2">
          <input 
            value={q} 
            onChange={e=>setQ(e.target.value)} 
            placeholder="Search for users..." 
            className="w-full p-2 rounded-lg bg-[#202c33] text-white outline-none" 
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* SEARCH RESULTS SECTION */}
          {q && searchResults.length > 0 && (
            <div className="bg-[#202c33]/50 mb-2">
              <p className="px-4 py-2 text-xs text-[#00a884] uppercase font-bold">Global Search</p>
              {searchResults.map(u => (
                <div key={u._id} onClick={() => startNewChat(u._id)} className="flex items-center p-3 cursor-pointer hover:bg-[#2a3942]">
                  <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">{u.name[0].toUpperCase()}</div>
                  <div className="ml-3 text-white">{u.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* CHAT LIST SECTION */}
          <ul className="space-y-0.5">
            {chats.filter(c => {
               const other = c.users.find(u => u._id !== me);
               return other?.name.toLowerCase().includes(q.toLowerCase());
            }).map(c => {
              const otherUser = c.users.find(u => u._id !== me);
              const isActive = activeChat?._id === c._id;
              return (
                <li key={c._id} onClick={()=>onSelect(c)} className={`flex items-center p-3 cursor-pointer border-b border-gray-800/30 ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}>
                  <div className="relative w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                    {otherUser?.name[0].toUpperCase()}
                    {otherUser?.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]" />}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between text-white font-semibold"><span>{otherUser?.name}</span></div>
                    <div className="text-sm text-gray-400 truncate">{c.latestMessage?.content || 'No messages yet'}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}