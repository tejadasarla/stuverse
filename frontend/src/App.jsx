import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout/Layout';
import Auth from './pages/Auth/Auth';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Home from './pages/Home/Home';
import Communities from './pages/Communities/Communities';
import CommunityChat from './pages/Communities/CommunityChat';
import Events from './pages/Events/Events';
import Colleges from './pages/Colleges/Colleges';
import Profile from './pages/Profile/Profile';
import Search from './pages/Search/Search';
import About from './pages/About/About';
import CommunitySettings from './pages/Communities/CommunitySettings';
import GroupSettings from './pages/Communities/GroupSettings';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="communities" element={<Communities />} />
        <Route path="communities/:id" element={<CommunityChat />} />
        <Route path="communities/:id/settings" element={<CommunitySettings />} />
        <Route path="communities/:id/groups/:groupId/settings" element={<GroupSettings />} />
        <Route path="events" element={<Events />} />
        <Route path="colleges" element={<Colleges />} />
        <Route path="login" element={<Auth />} />
        <Route path="signup" element={<Auth />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search" element={<Search />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}

export default App;
