import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, Crown, MoreHorizontal, Bell, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import UserAvatar from '../components/UserAvatar';

const CircularProgress = ({ value, max, size = 64, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="flex-center" style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle stroke="#E8F8EE" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className="progress-ring__circle"
          stroke="#34C759"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1E' }}>
        {Math.round((value / max) * 100)}%
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
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
        setData(result);
        localStorage.setItem('user', JSON.stringify(result));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard', err);
        setLoading(false);
        if (err.message === 'Unauthorized') {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });

    // Fetch Notifications
    fetch(`http://localhost:5000/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(result => setNotifications(Array.isArray(result) ? result : []))
      .catch(console.error);

    // Fetch leaderboard
    fetch(`http://${window.location.hostname}:5000/api/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(users => {
        if (Array.isArray(users)) {
          const sorted = users.sort((a, b) => (b.score || 0) - (a.score || 0));
          setLeaderboard(sorted.slice(0, 5));
        }
      })
      .catch(console.error);

    const socket = io(`http://${window.location.hostname}:5000`);
    socket.on('receiveFollowNotification', (notif) => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (notif.targetUserId === u._id) {
          setNotifications(prev => [{ ...notif, read: false }, ...prev]);
        }
      }
    });

    socket.on('updateUnreadMessages', (unreadMsgs) => {
      setData(prev => prev ? { ...prev, unreadMessages: unreadMsgs } : prev);
    });

    return () => socket.disconnect();

  }, []);

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const unreadMessageCount = data?.unreadMessages ? Object.values(data.unreadMessages).reduce((a, b) => a + b, 0) : 0;
  const totalUnread = unreadNotifCount + unreadMessageCount;

  if (loading) {
    return <div className="page-container flex-center">Loading...</div>;
  }

  if (!data) {
    return <div className="page-container flex-center">Make sure the Node backend and MongoDB are running!</div>;
  }

  return (
    <div className="page-container flex-col" style={{ gap: '32px' }}>
      
      {/* Header */}
      <header className="flex-between">
        <div>
          <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>Welcome back 🙌</p>
          <h1>{data.name}</h1>
        </div>
        <div className="flex-center" style={{ gap: '16px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/notifications')}>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)' }}>
              <Bell size={20} color="var(--text-primary)" />
            </div>
            {totalUnread > 0 && (
              <div style={{ 
                position: 'absolute', top: 0, right: 0, 
                width: '10px', height: '10px', 
                backgroundColor: 'red', 
                borderRadius: '50%',
                border: '2px solid var(--bg-card)'
              }} />
            )}
          </div>
          <div 
            onClick={() => navigate('/profile')} 
            style={{ cursor: 'pointer' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden' }}>
              <UserAvatar user={data} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Progress Card */}
      <section className="card-soft" style={{ background: '#F8F9FA' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Progress</h3>
          <MoreHorizontal size={20} color="#8E8E93" />
        </div>
        
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <div className="flex-col" style={{ gap: '8px' }}>
            <div>
              <span className="tag tag-green">{data.progress.type}</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: '4px 0' }}>{data.progress.title}</h2>
            <div className="flex-center" style={{ gap: '12px', justifyContent: 'flex-start', color: '#8E8E93', fontSize: '0.8rem' }}>
              <span className="flex-center" style={{ gap: '4px' }}><Clock size={14} /> {data.progress.duration}</span>
              <span className="flex-center" style={{ gap: '4px' }}><Crown size={14} /> {data.progress.level}</span>
            </div>
          </div>
          <CircularProgress value={data.progress.percentage} max={100} />
        </div>

        <button className="btn-black" onClick={() => navigate('/timer')}>
          Continue the workout
          <div className="icon-btn-white">
            <ArrowRight size={18} />
          </div>
        </button>
      </section>

      {/* Recommendation List */}
      <section>
        <h2 style={{ marginBottom: '20px' }}>Recommendation</h2>
        <div className="flex-col" style={{ gap: '20px' }}>
          {data.recommendations.map((rec, index) => {
            let tagClass = 'tag-green';
            if (rec.type === 'Muscle') tagClass = 'tag-yellow';
            if (rec.type === 'Strength') tagClass = 'tag-purple';

            return (
              <div className="flex-between" key={index}>
                <div className="flex-center" style={{ gap: '16px' }}>
                  <img src={rec.image} alt={rec.title} style={{ width: '60px', height: '60px', borderRadius: '16px', objectFit: 'cover' }} />
                  <div className="flex-col" style={{ gap: '4px' }}>
                    <h3 style={{ margin: 0 }}>{rec.title}</h3>
                    <div className="flex-center" style={{ gap: '8px', justifyContent: 'flex-start', color: '#8E8E93', fontSize: '0.75rem' }}>
                      <span className="flex-center" style={{ gap: '4px' }}><Clock size={12} /> {rec.duration}</span>
                      <span className="flex-center" style={{ gap: '4px' }}><Crown size={12} /> {rec.level}</span>
                    </div>
                  </div>
                </div>
                <span className={`tag ${tagClass}`}>{rec.type}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="card-soft" style={{ padding: '24px', background: '#FFFFFF' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }} className="flex-center">
            <Trophy size={20} color="#FFD60A" style={{ marginRight: '8px' }} /> Leaderboard
          </h3>
        </div>
        
        <div className="flex-col" style={{ gap: '12px' }}>
          {leaderboard.map((u, index) => (
            <div key={u._id} className="flex-between" style={{ padding: '12px', background: '#F8F9FA', borderRadius: '12px' }}>
              <div className="flex-center" style={{ gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: index === 0 ? '#FFD60A' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E5E5EA', color: index < 3 ? 'white' : '#8E8E93', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                  {index + 1}
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserAvatar user={u} />
                </div>
                <span style={{ fontWeight: 600 }}>{u.name}</span>
              </div>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{u.score || 0} pts</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
