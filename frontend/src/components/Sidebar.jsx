import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'

export default function Sidebar({ chats = [], setChats, activeChat, onSelect }){
  const [q, setQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const navigate = useNavigate()
  const me = api.getUserIdFromToken()

  useEffect(() => {
    const searchUsers = async () => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/users?search=${q}`);
        setSearchResults(res.data);
      } catch (e) { 
        console.error("Search failed", e);
      }
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const handleSelectSearchResult = async (user) => {
    try {
      const res = await api.post('/chats', { userId: user._id });
      if (!chats.find(c => String(c._id) === String(res.data._id))) {
        setChats(prev => [res.data, ...prev]);
      }
      onSelect(res.data);
      setQ(''); 
    } catch (e) {
      console.error("Could not start chat", e);
    }
  };

  return (
    <aside className="flex h-full w-[350px] md:w-[400px] flex-shrink-0 bg-[#111b21] border-r border-gray-700">
      <div className="w-12 bg-[#0f1619] h-full flex flex-col items-center py-3">
        <div className="flex-1" />
        <button onClick={() => { api.clearToken(); socket.disconnect(); navigate('/login') }} className="p-2 text-gray-400 hover:text-white">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 flex items-center px-4">
          <h1 className="text-xl font-bold text-white">Chats</h1>
        </div>

        <div className="px-3 pb-2">
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder="Search for people..." 
            className="w-full p-2 rounded-lg bg-[#202c33] text-white outline-none placeholder-gray-500" 
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-dark">
          {q.trim() !== "" && (
            <div className="bg-[#202c33]/30 mb-2 border-b border-gray-800">
              <p className="px-4 py-2 text-xs text-[#00a884] uppercase font-bold">New Contacts</p>
              {searchResults.length > 0 ? (
                searchResults.map(u => (
                  <div key={u._id} onClick={() => handleSelectSearchResult(u)} className="flex items-center p-3 cursor-pointer hover:bg-[#2a3942]">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="ml-3 text-white font-medium">{u.name}</div>
                  </div>
                ))
              ) : (
                <p className="px-4 py-2 text-sm text-gray-500 italic">No registered users found</p>
              )}
            </div>
          )}

          <ul className="space-y-0.5">
            {chats.map(c => {
              const otherUser = c.users.find(u => String(u._id) !== String(me));
              const isActive = activeChat?._id === c._id;
              if (!otherUser) return null;

              return (
                <li key={c._id} onClick={() => onSelect(c)} className={`flex items-center p-3 cursor-pointer ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}>
                  <div className="relative w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                    {otherUser.name[0].toUpperCase()}
                    {otherUser.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]" />}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between text-white font-semibold">
                      <span className="truncate">{otherUser.name}</span>
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {/* This will now update instantly because handleNewMessage in Chat.jsx updates the 'chats' state */}
                      {c.latestMessage?.content || 'No messages yet'}
                    </div>
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