import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appeals from './pages/Appeals';
import DropCards from './pages/DropCards';
import AdminPanel from './pages/AdminPanel';
import FraudRegistry from './pages/FraudRegistry';

// Main layout wrapper for authenticated routes
const MainLayout = ({ children }) => {
  return (
    <div className="flex bg-background text-on-background min-h-screen">
      {/* Sidebar - fixed left */}
      <Sidebar />
      
      {/* Main Content Area - shifted by sidebar width */}
      <div className="flex-1 ml-sidebar-width min-h-screen flex flex-col overflow-hidden">
        {/* Top Header - sticky top */}
        <Topbar />
        
        {/* Page Content area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-surface/40">
          <div className="p-container-padding space-y-gutter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Page - Full screen and guest access */}
        <Route path="/login" element={<Login />} />

        {/* Protected Pages - Wrapped with MainLayout & ProtectedRoute */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/appeals" element={
          <ProtectedRoute>
            <MainLayout>
              <Appeals />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/drop-cards" element={
          <ProtectedRoute>
            <MainLayout>
              <DropCards />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/fraud" element={
          <ProtectedRoute>
            <MainLayout>
              <FraudRegistry />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <MainLayout>
              <AdminPanel />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
