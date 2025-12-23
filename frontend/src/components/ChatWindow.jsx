import { useEffect, useState, useRef } from 'react'
import socket from '../services/socket'
import api from '../services/api'

export default function ChatWindow({ chat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();
  const me = api.getUserIdFromToken();
  const otherUser = chat?.users?.find(u => String(u._id) !== String(me));

  useEffect(() => {
    if (!chat?._id) return;
    api.get(`/messages/${chat._id}`).then(res => {
      setMessages(Array.isArray(res.data) ? res.data : res.data.messages || []);
      socket.emit('join chat', chat._id);
    });
  }, [chat?._id]);

  useEffect(() => {
    socket.on('receive_message', (msg) => {
      if (String(msg.chat?._id || msg.chat) === String(chat?._id)) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
      }
    });
    return () => socket.off('receive_message');
  }, [chat?._id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await api.post('/messages', { content: newMessage, chatId: chat._id });
      socket.emit('new message', res.data);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (e) { console.error(e) }
  };

  useEffect(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  if (!chat) return <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat</div>;

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      <div className="flex items-center p-3 bg-[#202c33]">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">{otherUser?.name[0].toUpperCase()}</div>
        <div className="ml-4">
          <h2 className="text-white font-medium">{otherUser?.name}</h2>
          <p className={`text-[11px] ${otherUser?.isOnline ? 'text-[#00a884]' : 'text-gray-400'}`}>
            {otherUser?.isOnline ? 'online' : otherUser?.lastSeen ? `last seen at ${new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'offline'}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map(m => {
          const isMe = String(m.sender?._id || m.sender) === String(me);
          return (
            <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-2 rounded-lg max-w-[70%] ${isMe ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-white'}`}>
                <p>{m.content}</p>
                <p className="text-[10px] text-right text-gray-400">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={sendMessage} className="p-3 bg-[#202c33] flex gap-2">
        <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} className="flex-1 bg-[#2a3942] text-white p-2 rounded-lg outline-none" placeholder="Type a message" />
        <button type="submit" className="bg-[#00a884] p-2 rounded-full text-white"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg></button>
      </form>
    </div>
  );
}