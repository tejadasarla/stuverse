import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout/Layout';
import Auth from './pages/Auth/Auth';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Home from './pages/Home/Home';
import Communities from './pages/Communities/Communities';
import Profile from './pages/Profile/Profile';
import Search from './pages/Search/Search';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="communities" element={<Communities />} />
        <Route path="login" element={<Auth />} />
        <Route path="signup" element={<Auth />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search" element={<Search />} />
      </Route>
    </Routes>
  );
}

export default App;
