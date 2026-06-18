import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;
const socket = io(BACKEND_URL);

const CommunityChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user details
    const token = localStorage.getItem('token') || '';
    fetch(`http://localhost:5000/api/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) throw new Error('Unauthorized');
          throw new Error('Server error');
        }
        return res.json();
      })
      .then(result => {
        setCurrentUser(result);
      })
      .catch(err => {
        console.error('Error fetching user', err);
        if (err.message === 'Unauthorized') {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });
  }, []);

  useEffect(() => {
    const handleReceive = (messageData) => {
      setMessages(prev => {
        if (prev.some(m => m.id === messageData.id)) return prev;
        return [...prev, messageData];
      });
    };

    const handleHistory = (history) => {
      setMessages(history);
    };

    const handleUpdateUsers = (users) => {
      const uniqueUsers = Array.from(new Map(users.map(u => [u._id, u])).values());
      setOnlineUsers(uniqueUsers);
    };

    socket.on('receiveMessage', handleReceive);
    socket.on('chatHistory', handleHistory);
    socket.on('updateOnlineUsers', handleUpdateUsers);

    if (currentUser) {
      socket.emit('userJoined', { _id: currentUser._id || 'mock_id_123', name: currentUser.name, avatar: currentUser.avatar });
    }

    const handleConnect = () => {
      if (currentUser) {
        socket.emit('userJoined', { _id: currentUser._id || 'mock_id_123', name: currentUser.name, avatar: currentUser.avatar });
      }
    };
    socket.on('connect', handleConnect);

    return () => {
      socket.off('receiveMessage', handleReceive);
      socket.off('chatHistory', handleHistory);
      socket.off('updateOnlineUsers', handleUpdateUsers);
      socket.off('connect', handleConnect);
    };
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageData = {
      id: Date.now().toString(),
      text: newMessage,
      sender: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        _id: currentUser._id || 'mock_id_123'
      },
      timestamp: new Date().toISOString()
    };

    // Optimistically update UI
    setMessages(prev => [...prev, messageData]);

    // Send to server
    socket.emit('sendMessage', messageData);
    setNewMessage('');
  };

  return (
    <div className="page-container flex-col" style={{ padding: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
      
      {/* Header */}
      <header className="flex-between" style={{ padding: '24px 24px 16px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5EA' }}>
        <div className="flex-center" style={{ gap: '16px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </button>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Community Chat</h2>
            <p style={{ fontSize: '0.8rem', color: '#34C759', margin: '2px 0 0 0', fontWeight: 600 }}>● Online</p>
          </div>
        </div>
        <div className="flex-center" style={{ gap: '-8px' }}>
          {onlineUsers.slice(0, 3).map((user, index) => (
            <div key={index} style={{ width: '32px', height: '32px', border: '2px solid white', borderRadius: '50%', zIndex: 3 - index, marginLeft: index > 0 ? '-12px' : '0' }}>
              <UserAvatar user={user} />
            </div>
          ))}
          {onlineUsers.length > 3 && (
            <div className="flex-center" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E5EA', border: '2px solid white', zIndex: 0, marginLeft: '-12px', fontSize: '0.7rem', fontWeight: 600, color: '#8E8E93' }}>
              +{onlineUsers.length - 3}
            </div>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {messages.length === 0 && (
          <div className="flex-col flex-center" style={{ height: '100%', color: '#8E8E93', gap: '12px' }}>
            <div style={{ padding: '20px', borderRadius: '50%', backgroundColor: '#E5E5EA' }}>
              <Send size={32} color="#8E8E93" />
            </div>
            <p>Start the conversation!</p>
          </div>
        )}
        
        {messages.map((msg, index) => {
          const isMe = currentUser && msg.sender._id === (currentUser._id || 'mock_id_123') && msg.sender.name === currentUser.name;
          const showAvatar = index === 0 || messages[index - 1].sender.name !== msg.sender.name;

          return (
            <div key={msg.id} style={{ 
              display: 'flex', 
              flexDirection: isMe ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: '12px'
            }}>
              <div style={{ width: '36px', height: '36px' }}>
                {showAvatar && (
                  <UserAvatar user={msg.sender} />
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                {showAvatar && (
                  <span style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '4px', marginLeft: isMe ? '0' : '4px', marginRight: isMe ? '4px' : '0' }}>
                    {msg.sender.name}
                  </span>
                )}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '20px',
                  borderBottomLeftRadius: !isMe && showAvatar ? '4px' : '20px',
                  borderBottomRightRadius: isMe && showAvatar ? '4px' : '20px',
                  backgroundColor: isMe ? '#34C759' : '#FFFFFF',
                  color: isMe ? '#FFFFFF' : '#1C1C1E',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontSize: '0.95rem',
                  lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px 24px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E5EA', position: 'sticky', bottom: 0, zIndex: 10, flexShrink: 0, paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <form onSubmit={handleSend} className="flex-center" style={{ gap: '12px' }}>
          <button type="button" style={{ background: 'none', border: 'none', padding: '8px', color: '#8E8E93', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon size={24} />
          </button>
          
          <input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '24px',
              border: '1px solid #E5E5EA',
              backgroundColor: '#F5F6F8',
              fontSize: '0.95rem',
              outline: 'none',
              color: '#1C1C1E'
            }}
          />
          
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            style={{ 
              background: newMessage.trim() ? '#34C759' : '#E5E5EA', 
              border: 'none', 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#FFFFFF',
              transition: 'background 0.2s'
            }}
          >
            <Send size={20} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default CommunityChat;
