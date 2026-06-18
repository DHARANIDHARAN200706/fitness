import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Calendar, Ruler, Scale, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    dob: '',
    height: '',
    weight: ''
  });

  const [profilePic, setProfilePic] = useState(null);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePic(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const response = await fetch('https://fitness-1ro9.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, avatar: profilePic, isLoginMode })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('userId', data.user._id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="page-container flex-col" style={{ padding: '32px 24px', backgroundColor: '#FFFFFF', minHeight: '100vh', justifyContent: 'center' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>
          {isLoginMode ? 'Welcome Back' : 'Join RiseFit AI'}
        </h1>
        <p style={{ color: '#8E8E93', fontSize: '0.95rem' }}>
          {isLoginMode ? 'Enter your mobile number to log in.' : 'Enter your details to personalize your AI fitness journey.'}
        </p>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#FF3B3015', color: '#FF3B30', padding: '12px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '20px' }}>
        
        {!isLoginMode && (
          <div className="flex-col flex-center" style={{ marginBottom: '8px' }}>
            <label style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{ 
                width: '96px', height: '96px', borderRadius: '50%', 
                background: '#F5F6F8', border: '2px dashed #E5E5EA', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                overflow: 'hidden' 
              }}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={32} color="#8E8E93" />
                )}
              </div>
              <div style={{ 
                position: 'absolute', bottom: 0, right: 0, 
                background: '#1C1C1E', padding: '6px', borderRadius: '50%', 
                border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>+</span>
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
            <span style={{ fontSize: '0.8rem', color: '#8E8E93', marginTop: '8px', fontWeight: 500 }}>Upload Profile Photo</span>
          </div>
        )}

        {/* Phone Number */}
        <div className="flex-col" style={{ gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1E', marginLeft: '8px' }}>Phone Number</label>
          <div className="flex-center" style={{ background: '#F5F6F8', padding: '16px', borderRadius: '16px', gap: '12px', border: '1px solid #E5E5EA' }}>
            <Phone size={20} color="#8E8E93" />
            <input 
              type="tel" 
              name="phone"
              placeholder="+1 (555) 000-0000" 
              required
              value={formData.phone}
              onChange={handleChange}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '1rem', color: '#1C1C1E' }}
            />
          </div>
        </div>

        {!isLoginMode && (
          <>
            {/* Full Name */}
            <div className="flex-col" style={{ gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1E', marginLeft: '8px' }}>Full Name</label>
              <div className="flex-center" style={{ background: '#F5F6F8', padding: '16px', borderRadius: '16px', gap: '12px', border: '1px solid #E5E5EA' }}>
                <User size={20} color="#8E8E93" />
                <input 
                  type="text" 
                  name="name"
                  placeholder="e.g. Jordan Eagle" 
                  required={!isLoginMode}
                  value={formData.name}
                  onChange={handleChange}
                  style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '1rem', color: '#1C1C1E' }}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="flex-col" style={{ gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1E', marginLeft: '8px' }}>Date of Birth</label>
              <div className="flex-center" style={{ background: '#F5F6F8', padding: '16px', borderRadius: '16px', gap: '12px', border: '1px solid #E5E5EA' }}>
                <Calendar size={20} color="#8E8E93" />
                <input 
                  type="date" 
                  name="dob"
                  required={!isLoginMode}
                  value={formData.dob}
                  onChange={handleChange}
                  style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '1rem', color: '#1C1C1E' }}
                />
              </div>
            </div>

            {/* Height & Weight Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="flex-col" style={{ gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1E', marginLeft: '8px' }}>Height (cm)</label>
                <div className="flex-center" style={{ background: '#F5F6F8', padding: '16px', borderRadius: '16px', gap: '12px', border: '1px solid #E5E5EA' }}>
                  <Ruler size={20} color="#8E8E93" />
                  <input 
                    type="number" 
                    name="height"
                    placeholder="175" 
                    required={!isLoginMode}
                    value={formData.height}
                    onChange={handleChange}
                    style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '1rem', color: '#1C1C1E' }}
                  />
                </div>
              </div>

              <div className="flex-col" style={{ gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1E', marginLeft: '8px' }}>Weight (kg)</label>
                <div className="flex-center" style={{ background: '#F5F6F8', padding: '16px', borderRadius: '16px', gap: '12px', border: '1px solid #E5E5EA' }}>
                  <Scale size={20} color="#8E8E93" />
                  <input 
                    type="number" 
                    name="weight"
                    placeholder="70" 
                    required={!isLoginMode}
                    value={formData.weight}
                    onChange={handleChange}
                    style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '1rem', color: '#1C1C1E' }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <button type="submit" className="btn-black" style={{ marginTop: '24px', padding: '18px 24px', justifyContent: 'center' }}>
          {isLoginMode ? 'Log In' : 'Get Started'}
          <ArrowRight size={20} color="white" style={{ marginLeft: '8px' }} />
        </button>

      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <p style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }}
            style={{ color: '#1C1C1E', fontWeight: 600, background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
          >
            {isLoginMode ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>

    </div>
  );
};

export default Login;
