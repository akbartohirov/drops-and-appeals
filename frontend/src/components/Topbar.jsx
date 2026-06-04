import React from 'react';
import { useLocation } from 'react-router-dom';

const Topbar = () => {
  const location = useLocation();
  const storedUser = localStorage.getItem('active_user');
  const user = storedUser ? JSON.parse(storedUser) : { username: 'Foydalanuvchi', role: 'Operator' };

  // Determine page title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Bank Boshqaruvi';
      case '/appeals':
        return 'Murojaatlar reyestri';
      case '/drop-cards':
        return 'Drop kartalar reyestri';
      case '/admin':
        return 'Foydalanuvchilar boshqaruvi';
      default:
        return 'Bank Boshqaruvi';
    }
  };

  // User details formatting
  const getUserDisplayName = () => {
    return user.username;
  };

  const getUserRoleLabel = () => {
    const role = (user.role || '').toLowerCase();
    if (role === 'admin') return 'admin';
    return 'operator';
  };

  // Avatar placeholder background & initials
  const getAvatarInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="flex justify-between items-center h-16 px-gutter bg-white/80 backdrop-blur-md sticky top-0 border-b border-outline-variant z-40">
      {/* Left side: Dynamic Page Title */}
      <div className="flex items-center gap-4">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">{getPageTitle()}</h2>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-4">


        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-label-md text-on-surface leading-tight">{getUserDisplayName()}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">{getUserRoleLabel()}</p>
          </div>
          {/* Circular Initials Avatar matching premium style */}
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold border border-outline-variant shadow-sm select-none">
            {getAvatarInitials()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
