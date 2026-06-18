import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Video, Phone } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { io } from 'socket.io-client';

const BACKEND_URL = `https://fitness-1ro9.onrender.com`;

export default function PrivateChat() {
  const { userId: recipientId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    
    // Fetch recipient info
    fetch(`${BACKEND_URL}/api/users`)
      .then(res => res.json())
      .then(users => {
        const found = users.find(u => u._id === recipientId);
        if (found) setRecipient(found);
      })
      .catch(console.error);

    // Fetch initial chat history and mark as read
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${BACKEND_URL}/api/chat/private/${recipientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(console.error);

      fetch(`${BACKEND_URL}/api/chat/read/${recipientId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(console.error);
    }

    // Connect to Socket.io
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on('connect', () => {
      const uStr = localStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        socketRef.current.emit('userJoined', {
          name: u.name,
          avatar: u.avatar,
          _id: u._id
        });
      }
    });

    socketRef.current.on('receivePrivateMessage', (messageData) => {
      // Ensure the message belongs to this conversation
      const isRelevant = 
        (messageData.sender._id === recipientId) || 
        (messageData.recipientId === recipientId);
        
      if (isRelevant) {
        setMessages(prev => {
          if (prev.some(m => m.id === messageData.id)) return prev;
          return [...prev, messageData];
        });
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [recipientId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageData = {
      id: Date.now().toString(),
      text: newMessage,
      sender: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        _id: currentUser._id
      },
      recipientId: recipientId,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('sendPrivateMessage', messageData);
    setNewMessage('');
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="private-chat-header">
        <button 
          onClick={() => navigate('/network')}
          className="back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-center" style={{ gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
            <UserAvatar user={recipient} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>{recipient?.name || 'Loading...'}</h2>
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-messages">
        {messages.map((msg) => {
          const isMe = msg.sender._id === currentUser?._id;
          return (
            <div
              key={msg.id}
              className={`msg-row ${isMe ? 'me' : 'them'}`}
            >
              {!isMe && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px', alignSelf: 'flex-end', overflow: 'hidden' }}>
                  <UserAvatar user={msg.sender} />
                </div>
              )}
              <div className={`msg-bubble ${isMe ? 'me' : 'them'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="send-btn">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
