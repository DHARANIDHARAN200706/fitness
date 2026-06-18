import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Flame, Heart, Pause, Play, Square, Trophy, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

const BACKEND_URL = `http://${window.location.hostname}:5000`;

const WorkoutTimer = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('select'); // 'select', 'active', 'finished'
  const fallbackWorkouts = [
    { id: 1, name: 'Push-ups', sub: 'Chest & Core Focus', image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80' },
    { id: 2, name: 'Squats', sub: 'Lower Body Strength', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80' },
    { id: 3, name: 'Lunges', sub: 'Glutes & Legs', image: 'https://images.unsplash.com/photo-1434596922112-19c563067271?w=800&q=80' },
    { id: 4, name: 'Plank', sub: 'Core Stability', image: 'https://images.unsplash.com/photo-1566241142559-40e1e24729f2?w=800&q=80' },
    { id: 5, name: 'Burpees', sub: 'Full Body Cardio', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80' },
    { id: 6, name: 'Jumping Jacks', sub: 'Dynamic Warm-up', image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80' },
    { id: 7, name: 'Sit-ups', sub: 'Abdominal Burn', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80' },
    { id: 8, name: 'Deadlifts', sub: 'Back & Hamstrings', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80' },
    { id: 9, name: 'Bench Press', sub: 'Upper Body Power', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
    { id: 10, name: 'Pull-ups', sub: 'Back & Biceps', image: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=800&q=80' },
    { id: 11, name: 'Running', sub: 'Outdoor Cardio', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80' },
    { id: 12, name: 'Cycling', sub: 'Outdoor Endurance', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80' }
  ];

  const [workouts, setWorkouts] = useState(fallbackWorkouts);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);

  const [currentPos, setCurrentPos] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const isOutdoor = selectedWorkout?.name === 'Running' || selectedWorkout?.name === 'Cycling';

  // Haversine formula
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
  };

  useEffect(() => {
    let interval = null;
    if (mode === 'active' && !isPaused) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, isPaused]);

  useEffect(() => {
    let watchId;
    if (mode === 'active' && !isPaused && isOutdoor) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newPos = [latitude, longitude];
            
            setCurrentPos(prev => {
              if (prev && (prev[0] !== latitude || prev[1] !== longitude)) {
                const dist = getDistanceFromLatLonInKm(prev[0], prev[1], latitude, longitude);
                setDistanceKm(d => d + dist);
              }
              return newPos;
            });
          },
          (error) => {
            console.error('Error getting location:', error);
          },
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }
    }
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [mode, isPaused, isOutdoor]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startWorkout = (workout) => {
    setSelectedWorkout(workout);
    setMode('active');
    setSeconds(0);
    setIsPaused(false);
  };

  const finishWorkout = async () => {
    setMode('finished');
    setIsPaused(true);
    
    // Calculate score (10 points per second for testing purposes so they can see progress quickly)
    const calculatedScore = seconds * 10;
    setScore(calculatedScore);

    // Save to backend
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/users/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: calculatedScore })
      });
    } catch (e) {
      console.error('Error saving score:', e);
    }
  };

  if (mode === 'select') {
    return (
      <div className="page-container flex-col" style={{ padding: '0', backgroundColor: '#F8F9FA' }}>
        <header className="flex-between" style={{ padding: '32px 24px 24px', background: 'transparent' }}>
          <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Workouts</h2>
          <div style={{ width: 40 }}></div>
        </header>

        <div style={{ padding: '0 24px', overflowY: 'auto', flex: 1, paddingBottom: '120px' }}>
          {workouts.map(ex => (
            <div key={ex.id} className="card-soft flex-between" style={{ padding: '12px', marginBottom: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.6)', transition: 'transform 0.2s', alignItems: 'center' }} onClick={() => startWorkout(ex)}>
              <div className="flex-center" style={{ gap: '16px' }}>
                <img src={ex.image} alt={ex.name} style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <div className="flex-col" style={{ gap: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1A1A1A' }}>{ex.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#8E8E93', fontWeight: 500 }}>{ex.sub}</span>
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'finished') {
    return (
      <div className="page-container flex-col flex-center" style={{ padding: '24px', backgroundColor: '#F8F9FA', textAlign: 'center' }}>
        <Trophy size={64} color="#FFD60A" style={{ marginBottom: '24px' }} />
        <h1 style={{ marginBottom: '8px' }}>Workout Complete!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Great job completing {selectedWorkout?.name}</p>
        
        <div className="card-soft" style={{ padding: '32px', width: '100%', marginBottom: '32px', background: 'white' }}>
          <h2 style={{ fontSize: '3rem', margin: 0, color: 'var(--primary)' }}>+{score}</h2>
          <p style={{ margin: '8px 0 0 0', fontWeight: 'bold' }}>Points Earned</p>
        </div>

        <button className="btn-black" style={{ width: '100%', padding: '16px' }} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const displayDistance = isOutdoor ? distanceKm.toFixed(2) : 0;
  
  const calorieMultiplier = selectedWorkout?.name === 'Cycling' ? 0.14 : selectedWorkout?.name === 'Running' ? 0.19 : 0.15;
  const calories = Math.floor(seconds * calorieMultiplier);

  return (
    <div className="page-container flex-col" style={{ padding: '0', backgroundColor: '#F8F9FA' }}>
      {/* Top Bar overlay */}
      <header className="flex-between" style={{ padding: '24px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <button onClick={() => navigate(-1)} className="icon-btn-white" style={{ background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <ChevronLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedWorkout?.name || 'Workout'}</h2>
        <div style={{ width: 40 }}></div>
      </header>

      {/* Main Visual */}
      <div style={{ height: '60vh', width: '100%', position: 'relative' }}>
        {isOutdoor ? (
          <div style={{ width: '100%', height: '100%', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', overflow: 'hidden', position: 'relative', zIndex: 1, background: '#E5E5EA' }}>
            {currentPos ? (
              <MapContainer center={currentPos} zoom={16} style={{ width: '100%', height: '100%' }} zoomControl={false} dragging={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={currentPos} />
                <MapUpdater center={currentPos} />
              </MapContainer>
            ) : (
              <div className="flex-center" style={{ width: '100%', height: '100%', color: '#8E8E93', flexDirection: 'column', gap: '8px' }}>
                <MapPin size={32} color="#8E8E93" />
                <span>Acquiring GPS Signal...</span>
              </div>
            )}
          </div>
        ) : (
          <img 
            src={selectedWorkout?.image || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"} 
            alt="Workout" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }} 
          />
        )}
        
        {/* Floating Timer Widget */}
        <div style={{ position: 'absolute', bottom: '-40px', left: '24px', right: '24px', zIndex: 1000 }}>
          <div className="card-soft flex-between" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', padding: '24px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '24px' }}>
            
            <div className="flex-col" style={{ gap: '16px', width: '100%' }}>
              {/* Timer Bar */}
              <div className="flex-between" style={{ background: isPaused ? '#FF9F0A' : '#7BFB84', borderRadius: '16px', padding: '16px 20px', width: '100%', transition: 'background 0.3s' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#000' }}>{formatTime(seconds)}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setIsPaused(!isPaused)} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1C1C1E', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    {isPaused ? <Play size={18} fill="white" /> : <Pause size={18} fill="white" />}
                  </button>
                  <button 
                    onClick={finishWorkout} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FF3B30', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Square size={16} fill="white" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-between" style={{ padding: '0 8px' }}>
                <div className="flex-col" style={{ gap: '4px' }}>
                  <span className="flex-center" style={{ gap: '4px', fontSize: '0.8rem', color: '#8E8E93' }}>
                    <Flame size={14} color="#FF9F0A" /> Calories
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{calories} <span style={{ fontSize: '0.8rem', color: '#8E8E93', fontWeight: 400 }}>kcal</span></span>
                </div>

                {isOutdoor && (
                  <>
                    <div style={{ width: '1px', height: '30px', background: '#E5E5EA' }}></div>
                    <div className="flex-col" style={{ gap: '4px' }}>
                      <span className="flex-center" style={{ gap: '4px', fontSize: '0.8rem', color: '#8E8E93' }}>
                        <MapPin size={14} color="#34C759" /> Distance
                      </span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{displayDistance} <span style={{ fontSize: '0.8rem', color: '#8E8E93', fontWeight: 400 }}>km</span></span>
                    </div>
                  </>
                )}

                <div style={{ width: '1px', height: '30px', background: '#E5E5EA' }}></div>
                <div className="flex-col" style={{ gap: '4px' }}>
                  <span className="flex-center" style={{ gap: '4px', fontSize: '0.8rem', color: '#8E8E93' }}>
                    <Heart size={14} color="#FF3B30" /> Heartrate
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{isPaused ? 85 : (selectedWorkout?.name === 'Running' ? 155 : 135)} <span style={{ fontSize: '0.8rem', color: '#8E8E93', fontWeight: 400 }}>bpm</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutTimer;
