import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, MessageCircle, Share2, Award } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

const BACKEND_URL = `http://${window.location.hostname}:5000`;

export default function Network() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
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
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/users/post/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentText[postId];
    if (!text || !text.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/users/post/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text })
      });
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      fetchUsers();
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  // Extract real posts and mix with non-fake mock posts
  let allPosts = [];
  users.filter(u => u._id !== currentUser?._id).forEach((u, i) => {
    if (u.posts && u.posts.length > 0) {
      u.posts.forEach(post => {
        allPosts.push({
          id: post.id,
          user: u,
          image: post.image,
          text: 'Just uploaded a new photo! Check it out! 🔥',
          likesCount: post.likes ? post.likes.length : 0,
          isLiked: post.likes && currentUser ? post.likes.includes(currentUser._id) : false,
          commentsCount: post.comments ? post.comments.length : 0,
          comments: post.comments || [],
          time: 'Just now'
        });
      });
    }

    // Add mock post but with REAL 0 starting metrics
    allPosts.push({
      id: `mock_${i}`,
      user: u,
      image: i % 2 === 0 ? 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' : null,
      text: i % 2 === 0 ? 'Just smashed my deadlift PR! Feeling stronger every day. 💪' : 'Consistency is key. Great cardio session this morning! 🏃‍♂️',
      achievement: i % 3 === 0 ? 'Completed "7 Day Streak"' : null,
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
      time: `${i + 1}h ago`
    });
  });

  // Sort so real posts (which have numeric timestamp IDs) appear at the top, or just reverse the array if we want newest first.
  allPosts.sort((a, b) => {
    if (a.time === 'Just now') return -1;
    if (b.time === 'Just now') return 1;
    return 0;
  });

  return (
    <div className="page-container flex-col" style={{ padding: 0, gap: '20px', backgroundColor: '#F5F6F8' }}>
      <div className="network-header" style={{ padding: '24px 24px 16px', background: '#FFFFFF' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Network</h1>
        <button 
          onClick={() => navigate('/search')}
          style={{ background: '#F5F6F8', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Search size={20} color="#1C1C1E" />
        </button>
      </div>

      {/* Stories Section */}
      <div style={{ padding: '0 24px', background: '#FFFFFF', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          
          {/* Add Story Button */}
          <div className="flex-col flex-center" style={{ gap: '8px', minWidth: '72px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px dashed #D1D1D6', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6F8', position: 'relative' }}>
              <UserAvatar user={currentUser} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', border: '2px solid white' }}>+</div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1C1C1E' }}>Your Story</span>
          </div>

          {/* User Stories */}
          {users.filter(u => u._id !== currentUser?._id).map((user, i) => (
            <div key={user._id} style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 16px' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', padding: '2px', background: 'linear-gradient(45deg, #FF3B30, #FF9500)', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--bg-app)' }}>
                  <UserAvatar user={user} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed Section */}
      <div className="flex-col" style={{ gap: '16px', paddingBottom: '100px' }}>
        {allPosts.map(post => (
          <div key={post.id} style={{ background: '#FFFFFF', padding: '16px 0' }}>
            <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex-center" style={{ gap: '12px', cursor: 'pointer' }} onClick={() => navigate(`/search`)}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#E5E5EA' }}>
                  <UserAvatar user={post.user} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700 }}>{post.user.name}</h3>
                  <p style={{ fontSize: '0.8rem', margin: 0, color: '#8E8E93' }}>{post.time}</p>
                </div>
              </div>
            </div>

            {post.achievement && (
              <div style={{ padding: '0 24px', marginBottom: '12px' }}>
                <div className="flex-center" style={{ background: '#F5F6F8', padding: '12px 16px', borderRadius: '12px', gap: '12px', border: '1px solid #E5E5EA' }}>
                  <div style={{ background: '#FFD60A15', padding: '8px', borderRadius: '50%' }}>
                    <Award size={20} color="#FF9F0A" />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1C1C1E' }}>{post.achievement}</span>
                </div>
              </div>
            )}

            <div style={{ padding: '0 24px', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: '#1C1C1E' }}>{post.text}</p>
            </div>

            {post.image && (
              <img src={post.image} alt="Post" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', marginBottom: '16px' }} />
            )}

            <div className="flex-between" style={{ padding: '0 24px' }}>
              <div className="flex-center" style={{ gap: '24px' }}>
                <button 
                  onClick={() => post.id.startsWith('mock_') ? alert('Cannot like a mock post') : handleLike(post.id)}
                  className="flex-center" 
                  style={{ gap: '6px', background: 'none', border: 'none', color: post.isLiked ? '#FF3B30' : '#1C1C1E', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  <Heart size={20} fill={post.isLiked ? '#FF3B30' : 'none'} />
                  <span>{post.likesCount}</span>
                </button>
                <button 
                  onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  className="flex-center" 
                  style={{ gap: '6px', background: 'none', border: 'none', color: '#1C1C1E', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  <MessageCircle size={20} />
                  <span>{post.commentsCount}</span>
                </button>
              </div>
              <button 
                onClick={() => alert('Link copied to clipboard!')}
                style={{ background: 'none', border: 'none', color: '#1C1C1E', cursor: 'pointer', padding: 0 }}
              >
                <Share2 size={20} />
              </button>
            </div>

            {showComments[post.id] && (
              <div style={{ padding: '16px 24px 0 24px' }}>
                {post.comments.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    {post.comments.map(c => (
                      <p key={c.id} style={{ fontSize: '0.85rem', margin: '4px 0' }}>
                        <strong>{users.find(u => u._id === c.userId)?.name || 'User'}</strong> {c.text}
                      </p>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    value={commentText[post.id] || ''}
                    onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #E5E5EA', outline: 'none' }}
                  />
                  <button 
                    onClick={() => post.id.startsWith('mock_') ? alert('Cannot comment on mock post') : handleCommentSubmit(post.id)}
                    style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '20px', padding: '0 16px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
