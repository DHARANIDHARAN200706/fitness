import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

const BACKEND_URL = `https://fitness-1ro9.onrender.com`;

export default function NotificationManager() {
  const [notification, setNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const socket = io(BACKEND_URL);
    
    socket.on('connect', () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        socket.emit('userJoined', { _id: u._id, name: u.name, avatar: u.avatar });
      }
    });

    socket.on('receivePrivateMessage', (msg) => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const u = JSON.parse(userStr);

      // If we are the recipient AND we are NOT on the chat page with this sender
      if (msg.recipientId === u._id) {
        const isOnChatPage = location.pathname === `/chat/${msg.sender._id}`;
        if (!isOnChatPage) {
          setNotification({ ...msg, isFollow: false });
          setTimeout(() => setNotification(null), 5000);
        }
      }
    });

    socket.on('receiveFollowNotification', (notif) => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const u = JSON.parse(userStr);
      
      if (notif.targetUserId === u._id) {
        setNotification({
          isFollow: true,
          fromUser: notif.fromUser,
          text: 'started following you!'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    });

    return () => socket.disconnect();
  }, [location.pathname]);

  if (!notification) return null;

  return (
    <div 
      onClick={() => {
        if (notification.isFollow) {
          navigate('/notifications');
        } else {
          navigate(`/chat/${notification.sender._id}`);
        }
        setNotification(null);
      }}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        background: 'var(--btn-black)',
        color: 'white',
        padding: '16px',
        borderRadius: '16px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        cursor: 'pointer'
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden' }}>
        <UserAvatar user={notification.isFollow ? notification.fromUser : notification.sender} />
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>
          {notification.isFollow ? 'New Follower' : `New message from ${notification.sender.name}`}
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
          {notification.isFollow ? `${notification.fromUser.name} ${notification.text}` : notification.text}
        </p>
      </div>
    </div>
  );
}
