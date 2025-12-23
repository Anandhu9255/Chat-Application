import { useEffect, useState, useRef } from 'react'
import socket from '../services/socket'
import api from '../services/api'

export default function ChatWindow({ chat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();
  const currentUserId = api.getUserIdFromToken();

  const otherUser = chat?.users?.find(u => String(u._id) !== String(currentUserId));

  useEffect(() => {
    if (!chat?._id) return;
    
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${chat._id}`);
        const data = Array.isArray(res.data) ? res.data : (res.data.messages || []);
        setMessages(data);
        socket.emit('join chat', chat._id);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    
    fetchMessages();

    return () => {
      setMessages([]); 
    };
  }, [chat?._id]);

  useEffect(() => {
    if (!chat?._id) return;

    const handleNewMessage = (msg) => {
      const msgChatId = msg.chat?._id || msg.chat;
      if (String(msgChatId) === String(chat._id)) {
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on('receive_message', handleNewMessage);
    
    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [chat?._id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat?._id) return;

    const messageContent = newMessage;
    setNewMessage(""); 

    try {
      const res = await api.post('/messages', { content: messageContent, chatId: chat._id });
      socket.emit('new message', res.data);
      setMessages(prev => {
        if (prev.some(m => String(m._id) === String(res.data._id))) return prev;
        return [...prev, res.data];
      });
    } catch (err) {
      console.error("Failed to send:", err);
      setNewMessage(messageContent);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chat) return (
    <div className="flex-1 bg-[#0b141a] flex items-center justify-center">
      <p className="text-[#8696a0] text-xl font-light">Select a chat to start messaging</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      <div className="flex items-center p-3 bg-[#202c33] border-b border-gray-800">
        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
          {otherUser?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="ml-4">
          <h2 className="text-white font-medium">{otherUser?.name || "User"}</h2>
          {otherUser?.isOnline ? (
            <p className="text-[11px] text-[#00a884]">online</p>
          ) : otherUser?.lastSeen ? (
            <p className="text-[11px] text-gray-400">
              last seen today at {new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          ) : (
            <p className="text-[11px] text-gray-500">offline</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((m) => {
          const isMe = String(m.sender?._id || m.sender) === String(currentUserId);
          return (
            <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-2 rounded-lg text-sm shadow-sm ${isMe ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#e9edef]'}`}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className="text-[10px] text-[#8696a0] text-right mt-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-[#202c33] flex items-center gap-2">
        <input 
          type="text" 
          placeholder="Type a message" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-[#2a3942] text-[#d1d7db] rounded-lg px-4 py-2 outline-none"
        />
        <button type="submit" className="bg-[#00a884] p-2 rounded-full text-white hover:bg-[#008f6f]">
           <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
        </button>
      </form>
    </div>
  );
}