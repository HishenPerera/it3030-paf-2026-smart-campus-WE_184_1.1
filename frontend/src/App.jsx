import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import CreateTicket from './pages/CreateTicket';
import ViewTickets from './pages/ViewTickets';
import TicketDetails from './pages/TicketDetails';
import ResourceBooking from './pages/ResourceBooking';
import { NotificationProvider } from './context/NotificationContext';
import AlertBanner from './components/AlertBanner';
import ToastContainer from './components/ToastContainer';
import useNotifications from './context/useNotifications';

function AppInner() {
  const { toasts, removeToast } = useNotifications();
  return (
    <>
      <AlertBanner />
      <ToastContainer toasts={toasts || []} onClose={removeToast} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/create-ticket" element={<CreateTicket />} />
        <Route path="/tickets" element={<ViewTickets />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
        <Route path="/booking" element={<ResourceBooking />} />
        
        {/* Default route redirects to dashboard, which will handle auth check */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
