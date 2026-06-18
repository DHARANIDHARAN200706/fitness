import React, { useState, useEffect } from 'react';
import { ChevronLeft, Activity as Heartbeat, Footprints, Droplets, SlidersHorizontal, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyActivity = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setData(JSON.parse(userStr));
  }, []);

  const totalScore = data?.score || 1200;
  const steps = Math.floor(totalScore * 2.5);

  return (
    <div style={{ backgroundColor: '#0A0A0C', color: 'white', minHeight: '100vh', padding: '24px', paddingBottom: '120px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <header className="flex-between" style={{ marginBottom: '32px', paddingTop: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#242426', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>My Activity</h1>
        <button style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#242426', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <SlidersHorizontal size={20} />
        </button>
      </header>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        
        {/* Heart Rate / Calories */}
        <div style={{ background: '#1C1C1E', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
          
          <div className="flex-between">
            <div style={{ background: '#FF3B3020', padding: '8px', borderRadius: '50%' }}>
              <Flame size={20} color="#FF3B30" />
            </div>
            <SlidersHorizontal size={16} color="#4A4A4C" />
          </div>

          <div className="flex-col" style={{ gap: '4px', marginTop: '12px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1px' }}>{totalScore}</span>
            <span style={{ fontSize: '1rem', color: '#8E8E93', fontWeight: 500 }}>Active kcal</span>
          </div>

          <div style={{ width: '100%', height: '40px', marginTop: '8px' }}>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path d="M0,30 Q10,20 20,25 T40,15 L50,5 L60,25 T80,20 T100,25" fill="none" stroke="#FF3B30" strokeWidth="3" />
              <circle cx="50" cy="5" r="4" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        <div className="flex-col" style={{ gap: '16px' }}>
          {/* Steps */}
          <div style={{ background: '#1C1C1E', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="flex-between">
              <Footprints size={18} color="#FFC107" />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '16px' }}>{steps}</span>
            <span style={{ fontSize: '0.85rem', color: '#8E8E93', fontWeight: 500 }}>Total Steps</span>
          </div>
          
          {/* Water */}
          <div style={{ background: '#1C1C1E', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="flex-between">
              <Droplets size={18} color="#3B82F6" />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '16px' }}>1.8<span style={{ fontSize: '1rem', color: '#8E8E93', marginLeft: '4px' }}>L</span></span>
            <span style={{ fontSize: '0.85rem', color: '#8E8E93', fontWeight: 500 }}>Water drank</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Activity */}
      <div style={{ background: '#1C1C1E', borderRadius: '24px', padding: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="flex-between">
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Weekly Activity</span>
          <SlidersHorizontal size={18} color="#4A4A4C" />
        </div>

        <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative' }}>
          {/* Tooltip */}
          <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', background: '#FFFFFF', color: '#000', padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700 }}>
            {totalScore} kcal
          </div>

          {[1, 2, 3, 4, 5, 6, 7].map((day, i) => (
            <div key={day} className="flex-col flex-center" style={{ gap: '12px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ 
                width: '8px', 
                height: i === 4 ? '120px' : `${40 + Math.random() * 50}px`, 
                background: i === 4 ? '#FFFFFF' : '#3A3A3C',
                borderRadius: '8px' 
              }}></div>
              <span style={{ fontSize: '0.75rem', color: '#8E8E93', fontWeight: 500 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default MyActivity;
