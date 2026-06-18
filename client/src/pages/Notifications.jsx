import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, MessageCircle, Heart } from 'lucide-react';

const BACKEND_URL = `https://fitness-1ro9.onrender.com`;

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchNotifications();
    markAsRead();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${BACKEND_URL}/api/notifications/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...currentUser, following: data.following };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="private-chat-header" style={{ paddingBottom: '12px' }}>
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Notifications</h1>
      </div>

      <div style={{ padding: '24px' }}>
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No notifications yet.</p>
        ) : (
          notifications.map(notif => {
            if (notif.type === 'message') {
              return (
                <div key={notif.id} className="user-card" style={{ gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageCircle size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                      <strong>{notif.fromUser.name}</strong> sent you {notif.count} unread message{notif.count > 1 ? 's' : ''}.
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(notif.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <button 
                      onClick={() => navigate(`/chat/${notif.fromUser._id}`)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        background: 'var(--btn-black)',
                        color: 'var(--text-inverse)'
                      }}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              );
            }

            if (notif.type === 'like' || notif.type === 'comment') {
              return (
                <div key={notif.id} className="user-card" style={{ gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: notif.type === 'like' ? '#FF3B3015' : 'var(--primary)15', color: notif.type === 'like' ? '#FF3B30' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notif.type === 'like' ? <Heart size={20} fill="#FF3B30" /> : <MessageCircle size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                      <strong>{notif.fromUser.name}</strong> {notif.type === 'like' ? 'liked' : 'commented on'} your post.
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(notif.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            }

            const isFollowing = currentUser?.following?.includes(notif.fromUser._id);
            return (
              <div key={notif.id} className="user-card" style={{ gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--tag-green-bg)', color: 'var(--tag-green-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                    <strong>{notif.fromUser.name}</strong> started following you.
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(notif.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <button 
                    onClick={() => toggleFollow(notif.fromUser._id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      background: isFollowing ? 'var(--tag-green-bg)' : 'var(--btn-black)',
                      color: isFollowing ? 'var(--tag-green-text)' : 'var(--text-inverse)'
                    }}
                  >
                    {isFollowing ? 'Following' : 'Follow Back'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
