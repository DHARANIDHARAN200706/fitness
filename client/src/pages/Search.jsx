import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, UserCheck, MessageCircle, ArrowLeft } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { io } from 'socket.io-client';

const BACKEND_URL = `http://${window.location.hostname}:5000`;

export default function SearchPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        
        const userId = localStorage.getItem('userId');
        let localUserId = userId;
        if (!localUserId) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            localUserId = JSON.parse(userStr)._id;
          }
        }
        
        if (localUserId) {
          const updatedServerUser = data.find(u => u._id === localUserId);
          if (updatedServerUser) {
             setCurrentUser(updatedServerUser);
             localStorage.setItem('user', JSON.stringify(updatedServerUser));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socket.on('connect', () => {
      const uStr = localStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        socket.emit('userJoined', { name: u.name, avatar: u.avatar, _id: u._id });
      }
    });

    socket.on('updateUnreadMessages', (unreadMessages) => {
      setCurrentUser(prev => prev ? { ...prev, unreadMessages } : prev);
    });

    return () => socket.disconnect();
  }, []);

  const toggleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...currentUser, following: data.following };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  let filteredUsers = users.filter(u => u._id !== currentUser?._id);

  if (activeTab === 'followers') {
    filteredUsers = filteredUsers.filter(u => currentUser?.followers?.includes(u._id));
  } else if (activeTab === 'following') {
    filteredUsers = filteredUsers.filter(u => currentUser?.following?.includes(u._id));
  }

  if (searchQuery) {
    filteredUsers = filteredUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="network-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, flex: 1 }}>Search & Network</h1>
      </div>
      <div style={{ padding: '0 24px', marginTop: '-10px', marginBottom: '16px' }}>
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <Search className="search-icon" size={18} />
        </div>
      </div>

      <div className="network-tabs">
        <button 
          className={`network-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Profiles
        </button>
        <button 
          className={`network-tab ${activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({currentUser?.followers?.length || 0})
        </button>
        <button 
          className={`network-tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Following ({currentUser?.following?.length || 0})
        </button>
      </div>

      <div style={{ padding: '0 24px' }}>
        {filteredUsers.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>No profiles found.</p>
        ) : (
          filteredUsers.map(user => {
            const isFollowing = currentUser?.following?.includes(user._id);
            return (
              <div key={user._id} className="user-card">
                <div className="user-info">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E5E5EA', overflow: 'hidden' }}>
                    <UserAvatar user={user} />
                  </div>
                  <div>
                    <h3>{user.name}</h3>
                    <p>{user.followers?.length || 0} followers</p>
                  </div>
                </div>
                
                <div className="user-actions">
                  <button 
                    onClick={() => toggleFollow(user._id)}
                    className={`action-btn ${isFollowing ? 'following' : ''}`}
                  >
                    {isFollowing ? <UserCheck size={20} /> : <UserPlus size={20} />}
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => navigate(`/chat/${user._id}`)}
                      className="action-btn"
                    >
                      <MessageCircle size={20} />
                    </button>
                    {currentUser?.unreadMessages?.[user._id] > 0 && (
                      <div style={{ position: 'absolute', top: -4, right: -4, background: 'red', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid var(--bg-card)' }}>
                        {currentUser.unreadMessages[user._id]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
