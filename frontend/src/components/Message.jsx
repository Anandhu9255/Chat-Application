import React from 'react'
import api from '../services/api'

export default function Message({ message, isMe }){
  const createdAt = message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ''

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}> 
      <div className="relative max-w-[70%]">
        <div className={`${isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-900'} p-3 rounded-lg shadow` }>
          <div className="text-sm">
            {!isMe && <div className="font-semibold text-sm mb-1">{message.sender?.name}</div>}
            <div>{message.content}</div>
          </div>
          <div className="text-xs mt-2 text-gray-400 flex items-center justify-between">
            <span>{createdAt}</span>
            {message.readBy && message.readBy.length > 0 && (
              <span className="ml-2 inline-flex items-center" title={message.readBy.map(entry=>entry.user?.name || entry.user?.email || entry.user).join(', ')}>
                {message.readBy.slice(0,3).map((entry, idx) => {
                  const u = entry.user || entry
                  const name = (u && (u.name || u.email)) || 'User'
                  const initials = name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()
                  return (
                    <span key={idx} className="w-6 h-6 rounded-full bg-gray-300 text-xs flex items-center justify-center -ml-1 border border-white" title={name}>
                      {initials}
                    </span>
                  )
                })}
                {message.readBy.length > 3 && <span className="text-xs ml-2 text-gray-600">+{message.readBy.length - 3}</span>}
              </span>
            )}
          </div>
        </div>

        {/* SVG tail */}
        <div className={`absolute ${isMe ? 'right-0 -bottom-1' : 'left-0 -bottom-1'} w-4 h-4 overflow-visible`} aria-hidden>
          {isMe ? (
            <svg width="12" height="12" viewBox="0 0 10 10" className="transform rotate-45" style={{ overflow: 'visible' }}>
              <rect width="10" height="10" fill="#16A34A" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 10 10" className="transform rotate-45" style={{ overflow: 'visible' }}>
              <rect width="10" height="10" fill="#ffffff" rx="1" stroke="#e5e7eb" strokeWidth="0.5" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
