import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './pages/Layout';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Auth />} />
        <Route path="signup" element={<Auth />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>
    </Routes>
  );
}

export default App;
