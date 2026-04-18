import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import CreateTicket from './pages/CreateTicket';
import ViewTickets from './pages/ViewTickets';
import { NotificationProvider } from './context/NotificationContext';
import AlertBanner from './components/AlertBanner';

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AlertBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/tickets" element={<ViewTickets />} />
          
          {/* Default route redirects to dashboard, which will handle auth check */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
