import React from 'react';
import { useAntifraud } from '../../context/AntifraudContext';
import { ShieldAlert, LogOut, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout, setCurrentPage } = useAntifraud();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Zone 1: Single text element Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-all">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
              SENTINEL ANTIFRAUD
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation / Contextual Breadcrumb Trail (Single line text links) */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Holat:</span>
          <span className="text-emerald-400 font-mono">Tizim faol (Online)</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">Kliring protokoli:</span>
          <span className="text-slate-300 font-mono">Humo v3.4 / Uzcard</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">DWH sinxron:</span>
          <span className="text-slate-300 font-mono">Har 5 daqiqada</span>
        </div>
      </div>

      {/* Zone 3: 1 Primary Action & Profile Info */}
      <div className="flex items-center gap-3 shrink-0">
        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold font-mono text-slate-200 whitespace-nowrap">
                {currentUser.username}
              </span>
              <span className="text-[11px] text-blue-400 font-mono">
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 text-red-400 text-xs font-medium transition-colors whitespace-nowrap"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Chiqish</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCurrentPage('login')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all whitespace-nowrap"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Tizimga kirish</span>
          </button>
        )}
      </div>
    </header>
  );
};
