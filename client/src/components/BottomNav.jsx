import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Dumbbell, Bot, MessageCircle, Users } from 'lucide-react';
import clsx from 'clsx';

const BottomNav = () => {
  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'Workout', path: '/timer', icon: Dumbbell },
    { name: 'Chat', path: '/community', icon: MessageCircle },
    { name: 'Network', path: '/network', icon: Users },
    { name: 'AI Coach', path: '/ai', icon: Bot },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
          >
            {({ isActive }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
