import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WorkoutTimer from './pages/WorkoutTimer';
import MyActivity from './pages/MyActivity';
import AICoach from './pages/AICoach';
import Login from './pages/Login';
import CommunityChat from './pages/CommunityChat';
import Network from './pages/Network';
import SearchPage from './pages/Search';
import PrivateChat from './pages/PrivateChat';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import NotificationManager from './components/NotificationManager';
import BottomNav from './components/BottomNav';
import './index.css';

// A wrapper to hide bottom nav on login page
const Layout = ({ children }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/login' || location.pathname === '/community' || location.pathname.startsWith('/chat/') || location.pathname === '/profile' || location.pathname === '/notifications';
  
  return (
    <>
      <NotificationManager />
      {children}
      {!hideNav && <BottomNav />}
    </>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timer" element={<WorkoutTimer />} />
          <Route path="/schedule" element={<MyActivity />} />
          <Route path="/ai" element={<AICoach />} />
          <Route path="/community" element={<CommunityChat />} />
          <Route path="/network" element={<Network />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/chat/:userId" element={<PrivateChat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
