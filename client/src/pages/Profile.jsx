import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Image as ImageIcon, Edit3, X, Check } from 'lucide-react';
import Avatar, { genConfig } from 'react-nice-avatar';
import UserAvatar from '../components/UserAvatar';

const BACKEND_URL = `https://fitness-1ro9.onrender.com`;

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  
  // Profile Edit & Avatar
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  
  const STANDARD_DEFAULT_CONFIG = {
    sex: "man", faceColor: "#F9C9B6", earSize: "small", eyeStyle: "circle", 
    hairColor: "#000", hairStyle: "normal", hatStyle: "none", glassesStyle: "none", 
    noseStyle: "short", mouthStyle: "smile", shirtStyle: "short", shirtColor: "#9287FF", bgColor: "#E0DDFF", shape: "circle"
  };
  
  const [avatarConfig, setAvatarConfig] = useState(STANDARD_DEFAULT_CONFIG);
  const [uploadedAvatarBase64, setUploadedAvatarBase64] = useState(null);

  const OptionVisual = ({ active, configOverride, onClick }) => {
    const previewConfig = { ...STANDARD_DEFAULT_CONFIG, ...configOverride };
    return (
      <div 
        onClick={onClick}
        style={{
          padding: '4px',
          borderRadius: '12px',
          border: active ? '2px solid var(--primary)' : '2px solid var(--border-color)',
          background: active ? 'rgba(0,0,0,0.05)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '50px',
          height: '50px'
        }}
      >
        <Avatar style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, transform: 'translateZ(0)' }} {...previewConfig} />
      </div>
    );
  };
  
  // Photo Upload & Adjust
  const [uploading, setUploading] = useState(false);
  const [adjustingPhoto, setAdjustingPhoto] = useState(null);
  const [photoScale, setPhotoScale] = useState(1);
  const fileInputRef = useRef(null);
  const profilePicRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
        
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
             setEditName(updatedServerUser.name);
             
             // Try parsing avatar config
             try {
               const config = JSON.parse(updatedServerUser.avatar);
               if (config && config.sex) setAvatarConfig(config);
             } catch(e) {
               // Default image or error
             }
             
             localStorage.setItem('user', JSON.stringify(updatedServerUser));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem('token');
      // Encode avatarConfig as JSON string OR use the uploaded photo base64
      const avatarToSave = uploadedAvatarBase64 || JSON.stringify(avatarConfig);
      
      const res = await fetch(`${BACKEND_URL}/api/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: editName, avatar: avatarToSave })
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        setEditMode(false);
        setShowAvatarEditor(false);
      }
    } catch (e) {
      console.error('Failed to update profile', e);
    }
  };

  const handleProfilePhotoUpload = (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedAvatarBase64(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handlePhotoSelect = (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      setAdjustingPhoto(event.target.result);
      setPhotoScale(1);
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const finalizeUpload = () => {
    setUploading(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      
      // Calculate scaled dimensions and centering
      const scaledWidth = img.width * photoScale;
      const scaledHeight = img.height * photoScale;
      const dx = (size - scaledWidth) / 2;
      const dy = (size - scaledHeight) / 2;
      
      // White background fill just in case
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.9);
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/users/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ image: base64Image })
        });
        if (response.ok) {
          const data = await response.json();
          const updatedUser = { ...currentUser, posts: data.posts };
          setCurrentUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error('Error uploading photo:', err);
      } finally {
        setUploading(false);
        setAdjustingPhoto(null);
      }
    };
    img.src = adjustingPhoto;
  };

  if (!currentUser) return <div className="page-container flex-center">Loading...</div>;

  let displayIds = activeTab === 'followers' ? (currentUser.followers || []) : (currentUser.following || []);
  let displayUsers = allUsers.filter(u => displayIds.includes(u._id));

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="private-chat-header" style={{ paddingBottom: '12px' }}>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>My Profile</h1>
        <div style={{ width: '32px' }}></div> {/* Spacer for alignment */}
      </div>

      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary)', margin: '0 auto' }}>
            {uploadedAvatarBase64 ? (
              <img src={uploadedAvatarBase64} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : editMode && avatarConfig ? (
              <Avatar style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, transform: 'translateZ(0)' }} {...avatarConfig} />
            ) : currentUser.avatar && currentUser.avatar.startsWith('{') ? (
              <Avatar style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, transform: 'translateZ(0)' }} {...JSON.parse(currentUser.avatar)} />
            ) : currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Avatar style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, transform: 'translateZ(0)' }} {...STANDARD_DEFAULT_CONFIG} />
            )}
          </div>
          {editMode && (
            <div 
              onClick={() => setShowAvatarEditor(!showAvatarEditor)}
              style={{ marginTop: '12px', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Change Photo or Avatar
            </div>
          )}
        </div>

        {editMode ? (
          <input 
            type="text" 
            value={editName} 
            onChange={(e) => setEditName(e.target.value)}
            style={{ display: 'block', margin: '0 auto 16px', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
          />
        ) : (
          <h2 style={{ marginBottom: '16px' }}>{currentUser.name}</h2>
        )}
        
        <div className="flex-center" style={{ gap: '24px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          <div className="flex-col">
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{currentUser.followers?.length || 0}</span>
            <span style={{ fontSize: '0.85rem' }}>Followers</span>
          </div>
          <div className="flex-col">
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{currentUser.following?.length || 0}</span>
            <span style={{ fontSize: '0.85rem' }}>Following</span>
          </div>
        </div>

        {editMode ? (
          <div className="flex-center" style={{ gap: '12px', padding: '0 24px' }}>
            <button onClick={() => { setEditMode(false); setShowAvatarEditor(false); }} className="btn-black" style={{ flex: 1, background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', justifyContent: 'center' }}>
              Cancel
            </button>
            <button onClick={handleSaveProfile} className="btn-black" style={{ flex: 1, justifyContent: 'center' }}>
              Save Profile
            </button>
          </div>
        ) : (
          <div style={{ padding: '0 24px' }}>
            <button onClick={() => { setEditMode(true); setEditName(currentUser.name); }} className="btn-black" style={{ width: '100%' }}>
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Avatar Customization Drawer */}
      {showAvatarEditor && (
        <div className="card-soft" style={{ margin: '0 24px 24px', padding: '16px', animation: 'slideUp 0.3s ease' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Customize Avatar</h3>
            <button onClick={() => profilePicRef.current?.click()} className="btn-black" style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '16px' }}>
               Or Upload Photo
            </button>
            <input type="file" ref={profilePicRef} onChange={handleProfilePhotoUpload} accept="image/*" style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: uploadedAvatarBase64 ? 0.5 : 1, pointerEvents: uploadedAvatarBase64 ? 'none' : 'auto' }}>
            
            <div className="flex-col" style={{ gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Hat Style</span>
              <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                <OptionVisual active={avatarConfig.hatStyle === 'none'} configOverride={{ hatStyle: 'none' }} onClick={() => setAvatarConfig({...avatarConfig, hatStyle: 'none'})} />
                <OptionVisual active={avatarConfig.hatStyle === 'beanie'} configOverride={{ hatStyle: 'beanie' }} onClick={() => setAvatarConfig({...avatarConfig, hatStyle: 'beanie'})} />
                <OptionVisual active={avatarConfig.hatStyle === 'turban'} configOverride={{ hatStyle: 'turban' }} onClick={() => setAvatarConfig({...avatarConfig, hatStyle: 'turban'})} />
              </div>
            </div>

            <div className="flex-col" style={{ gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Glasses</span>
              <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                <OptionVisual active={avatarConfig.glassesStyle === 'none'} configOverride={{ glassesStyle: 'none' }} onClick={() => setAvatarConfig({...avatarConfig, glassesStyle: 'none'})} />
                <OptionVisual active={avatarConfig.glassesStyle === 'round'} configOverride={{ glassesStyle: 'round' }} onClick={() => setAvatarConfig({...avatarConfig, glassesStyle: 'round'})} />
                <OptionVisual active={avatarConfig.glassesStyle === 'square'} configOverride={{ glassesStyle: 'square' }} onClick={() => setAvatarConfig({...avatarConfig, glassesStyle: 'square'})} />
              </div>
            </div>

            <div className="flex-col" style={{ gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Outfit</span>
              <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                <OptionVisual active={avatarConfig.shirtStyle === 'short'} configOverride={{ shirtStyle: 'short' }} onClick={() => setAvatarConfig({...avatarConfig, shirtStyle: 'short'})} />
                <OptionVisual active={avatarConfig.shirtStyle === 'hoody'} configOverride={{ shirtStyle: 'hoody' }} onClick={() => setAvatarConfig({...avatarConfig, shirtStyle: 'hoody'})} />
                <OptionVisual active={avatarConfig.shirtStyle === 'polo'} configOverride={{ shirtStyle: 'polo' }} onClick={() => setAvatarConfig({...avatarConfig, shirtStyle: 'polo'})} />
              </div>
            </div>

            <div className="flex-col" style={{ gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Hair</span>
              <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                <OptionVisual active={avatarConfig.hairStyle === 'normal'} configOverride={{ hairStyle: 'normal' }} onClick={() => setAvatarConfig({...avatarConfig, hairStyle: 'normal'})} />
                <OptionVisual active={avatarConfig.hairStyle === 'thick'} configOverride={{ hairStyle: 'thick' }} onClick={() => setAvatarConfig({...avatarConfig, hairStyle: 'thick'})} />
                <OptionVisual active={avatarConfig.hairStyle === 'mohawk'} configOverride={{ hairStyle: 'mohawk' }} onClick={() => setAvatarConfig({...avatarConfig, hairStyle: 'mohawk'})} />
                <OptionVisual active={avatarConfig.hairStyle === 'womanLong'} configOverride={{ hairStyle: 'womanLong' }} onClick={() => setAvatarConfig({...avatarConfig, hairStyle: 'womanLong'})} />
                <OptionVisual active={avatarConfig.hairStyle === 'womanShort'} configOverride={{ hairStyle: 'womanShort' }} onClick={() => setAvatarConfig({...avatarConfig, hairStyle: 'womanShort'})} />
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="network-tabs" style={{ justifyContent: 'center' }}>
        <button 
          className={`network-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button 
          className={`network-tab ${activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers
        </button>
        <button 
          className={`network-tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Following
        </button>
      </div>

      <div style={{ padding: '0 24px', paddingBottom: '32px' }}>
        {activeTab === 'posts' && (
          <div>
            <div className="flex-center" style={{ marginBottom: '16px' }}>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="btn-black flex-center"
                style={{ gap: '8px', padding: '12px 24px', width: '100%', justifyContent: 'center' }}
                disabled={uploading}
              >
                <ImageIcon size={20} />
                {uploading ? 'Uploading...' : 'Add New Photo'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoSelect} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>

            {/* Photo Adjuster Overlay */}
            {adjustingPhoto && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ width: '100%', maxWidth: '350px', aspectRatio: '1/1', overflow: 'hidden', borderRadius: '16px', background: '#fff', position: 'relative', marginBottom: '24px' }}>
                  <img 
                    src={adjustingPhoto} 
                    alt="Preview" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      transform: `scale(${photoScale})`, 
                      transformOrigin: 'center center',
                      transition: 'transform 0.1s ease'
                    }} 
                  />
                </div>
                
                <div style={{ width: '100%', maxWidth: '350px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px' }}>
                  <label style={{ color: 'white', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span>Zoom/Scale Photo</span>
                    <span>{Math.round(photoScale * 100)}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" max="3" step="0.1" 
                    value={photoScale} 
                    onChange={e => setPhotoScale(parseFloat(e.target.value))}
                    style={{ width: '100%', marginBottom: '24px' }}
                  />
                  <div className="flex-between">
                    <button onClick={() => setAdjustingPhoto(null)} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '10px 24px', borderRadius: '24px' }}>Cancel</button>
                    <button onClick={finalizeUpload} disabled={uploading} style={{ background: 'white', color: 'black', border: 'none', padding: '10px 24px', borderRadius: '24px', fontWeight: 'bold' }}>
                      {uploading ? 'Saving...' : 'Post Photo'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(currentUser.posts || []).map(post => (
                <div key={post.id} style={{ aspectRatio: '1/1', background: '#E5E5EA', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={post.image} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            {(!currentUser.posts || currentUser.posts.length === 0) && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>No photos yet.</p>
            )}
          </div>
        )}

        {(activeTab === 'followers' || activeTab === 'following') && (
          <>
            {displayUsers.length === 0 ? (
              <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>No {activeTab} yet.</p>
            ) : (
              displayUsers.map(user => (
                <div key={user._id} className="user-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/chat/${user._id}`)}>
                  <div className="user-info">
                    <div className="user-avatar" style={{ overflow: 'hidden', width: '40px', height: '40px', position: 'relative', zIndex: 1, transform: 'translateZ(0)' }}>
                      <UserAvatar user={user} />
                    </div>
                    <div>
                      <h3>{user.name}</h3>
                    </div>
                  </div>
                  <MessageCircle size={20} color="var(--text-secondary)" />
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
