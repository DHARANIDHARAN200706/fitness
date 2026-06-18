import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Sparkles, Bot, Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AICoach = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment(ev.target.result);
    };
    reader.readAsDataURL(e.target.files[0]);
    e.target.value = null;
  };
  
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Good morning Jai 👋' },
    { id: 2, sender: 'ai', text: 'How did you sleep last night? Are you feeling energized for today\'s workout?' }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() && !attachment) return;

    // Add user message
    const newMsg = { id: Date.now(), sender: 'user', text: inputValue, image: attachment };
    const currentMessages = [...messages, newMsg];
    setMessages(currentMessages);
    setInputValue('');
    setAttachment(null);

    // Add typing indicator
    setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'typing...' }]);
    
    try {
      // Format history for Groq
      const history = currentMessages.map(m => {
        if (m.image) {
          const content = [];
          if (m.text) content.push({ type: 'text', text: m.text });
          else content.push({ type: 'text', text: 'Analyze this image.' });
          content.push({ type: 'image_url', image_url: { url: m.image } });
          return {
            role: m.sender === 'ai' ? 'assistant' : 'user',
            content: content
          };
        }
        return {
          role: m.sender === 'ai' ? 'assistant' : 'user',
          content: m.text
        };
      });

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();

      setMessages(prev => {
        const filtered = prev.filter(m => m.text !== 'typing...');
        return [...filtered, { 
          id: Date.now() + 2, 
          sender: 'ai', 
          text: data.reply || "Oops, I lost my connection! Let's get back to training."
        }];
      });
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const filtered = prev.filter(m => m.text !== 'typing...');
        return [...filtered, { id: Date.now() + 2, sender: 'ai', text: "Network error! Couldn't reach the AI." }];
      });
    }
  };

  return (
    <div className="page-container flex-col" style={{ padding: '0', backgroundColor: '#F8F9FA', height: '100vh', display: 'flex' }}>
      
      {/* Header */}
      <header className="flex-between" style={{ padding: '24px', background: 'white', borderBottom: '1px solid #E5E5EA', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} className="icon-btn-white" style={{ background: '#F2F2F7' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex-center" style={{ gap: '8px' }}>
          <div style={{ background: '#E8F8EE', padding: '6px', borderRadius: '50%' }}>
            <Sparkles size={16} color="#34C759" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>AI Coach</h2>
        </div>
        <div style={{ width: '32px' }}></div> {/* Spacer for centering */}
      </header>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <span style={{ fontSize: '0.75rem', color: '#8E8E93', background: '#F2F2F7', padding: '4px 12px', borderRadius: '100px' }}>
            Today, 07:30 AM
          </span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end',
            gap: '8px'
          }}>
            {msg.sender === 'ai' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1C1C1E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} color="white" />
              </div>
            )}
            
            <div style={{
              background: msg.sender === 'user' ? '#1C1C1E' : 'white',
              color: msg.sender === 'user' ? 'white' : '#1C1C1E',
              padding: '12px 16px',
              borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              maxWidth: '75%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              {msg.image && (
                <img src={msg.image} alt="Upload" style={{ width: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : '0' }} />
              )}
              {msg.text === 'typing...' ? (
                <div className="flex-center" style={{ gap: '4px', height: '24px' }}>
                  <div style={{ width: '6px', height: '6px', background: '#D1D1D6', borderRadius: '50%', animation: 'bounce 1s infinite' }} />
                  <div style={{ width: '6px', height: '6px', background: '#D1D1D6', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
                  <div style={{ width: '6px', height: '6px', background: '#D1D1D6', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }} />
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px 24px', background: 'white', borderTop: '1px solid #E5E5EA', position: 'sticky', bottom: '80px', zIndex: 10 }}>
        {attachment && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
            <img src={attachment} alt="Preview" style={{ height: '64px', borderRadius: '8px', border: '1px solid #E5E5EA' }} />
            <button onClick={() => setAttachment(null)} style={{ position: 'absolute', top: -8, right: -8, background: '#1C1C1E', color: 'white', borderRadius: '50%', border: 'none', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex-between" style={{ background: '#F2F2F7', borderRadius: '100px', padding: '6px 6px 6px 12px' }}>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8E8E93', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', marginRight: '4px' }}>
            <Camera size={20} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" style={{ display: 'none' }} />
          <input 
            type="text" 
            placeholder="Type your reply..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.95rem' }}
          />
          <button 
            onClick={handleSend}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#34C759', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Send size={18} color="white" style={{ transform: 'translateX(-1px)' }} />
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default AICoach;
