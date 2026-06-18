import React from 'react';
import Avatar from 'react-nice-avatar';

const STANDARD_DEFAULT_CONFIG = {
  sex: "man",
  faceColor: "#F9C9B6",
  earSize: "small",
  eyeStyle: "circle",
  hairColor: "#000",
  hairStyle: "normal",
  hatStyle: "none",
  glassesStyle: "none",
  noseStyle: "short",
  mouthStyle: "smile",
  shirtStyle: "short",
  shirtColor: "#9287FF",
  bgColor: "#E0DDFF",
  shape: "circle"
};

export default function UserAvatar({ user, style }) {
  const avatarStyle = { 
    width: '100%', height: '100%', 
    position: 'relative', zIndex: 1, transform: 'translateZ(0)',
    ...style 
  };
  const imgStyle = { width: '100%', height: '100%', objectFit: 'cover', ...style };

  if (!user) {
    return <Avatar style={avatarStyle} {...STANDARD_DEFAULT_CONFIG} />;
  }

  if (user.avatar && user.avatar.startsWith('{')) {
    try {
      const config = JSON.parse(user.avatar);
      return <Avatar style={avatarStyle} {...config} />;
    } catch (e) {
      return <Avatar style={avatarStyle} {...STANDARD_DEFAULT_CONFIG} />;
    }
  }

  if (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))) {
    return <img src={user.avatar} alt={user.name || 'User'} style={imgStyle} />;
  }

  // Fallback
  return <Avatar style={avatarStyle} {...STANDARD_DEFAULT_CONFIG} />;
}
