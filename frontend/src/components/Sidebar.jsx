import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  ShieldAlert, 
  LogOut,
  AlertTriangle
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('active_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user && user.role === 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('active_user');
    localStorage.removeItem('active_token');
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Boshqaruv paneli',
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: true
    },
    {
      to: '/appeals',
      label: 'Murojaatlar',
      icon: <FileText className="w-5 h-5" />,
      show: true
    },
    {
      to: '/drop-cards',
      label: 'Drop kartalar',
      icon: <CreditCard className="w-5 h-5" />,
      show: true
    },
    {
      to: '/fraud',
      label: 'Fraud reyestri',
      icon: <AlertTriangle className="w-5 h-5" />,
      show: true
    },
    {
      to: '/admin',
      label: 'Admin paneli',
      icon: <ShieldAlert className="w-5 h-5" />,
      show: isAdmin
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-primary-container text-white flex flex-col py-6 border-r border-outline-variant z-50">
      {/* Branding */}
      <div className="px-6 mb-10 flex flex-col gap-1">
        <span className="font-display-md text-display-md font-bold tracking-tight">Banking Admin</span>
        <span className="text-on-primary-container text-sm opacity-80 font-medium">Boshqaruvi tizimi</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.filter(item => item.show).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `px-6 py-3.5 flex items-center gap-3 active:scale-95 transition-all duration-200 ${
                isActive 
                  ? 'bg-secondary-container text-on-secondary-container border-l-4 border-tertiary-fixed-dim font-semibold active-nav-border' 
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="px-4 py-6 mt-auto border-t border-white/10">
        <div className="flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className="w-full px-6 py-2.5 flex items-center gap-3 text-sm text-blue-100/70 hover:text-red-300 hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Chiqish</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
