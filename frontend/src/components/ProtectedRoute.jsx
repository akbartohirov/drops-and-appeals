import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const storedUser = localStorage.getItem('active_user');
  
  if (!storedUser) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = JSON.parse(storedUser);

  if (requireAdmin && user.role !== 'Admin') {
    // If admin role is required but user is an operator, show access denied view
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-white border border-outline-variant rounded-xl shadow-sm animate-slide-up">
        <div className="w-20 h-20 bg-error-container text-error rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl">gpp_bad</span>
        </div>
        <h2 className="text-display-md text-primary font-bold mb-2">Kirish taqiqlangan!</h2>
        <p className="text-on-surface-variant max-w-md mb-8">
          Sizda ushbu sahifaga (Admin Paneli) kirish huquqi yo'q. Ushbu sahifa faqat bank bosh administratorlari uchun mo'ljallangan.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-primary text-white font-label-md px-8 py-3 rounded-lg hover:bg-primary-container transition-all shadow-sm active:scale-95"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
