import React from 'react';
import { useAntifraud } from '../../context/AntifraudContext';
import { PageType } from '../../types/antifraud';
import {
  LayoutDashboard,
  Inbox,
  CreditCard,
  FileWarning,
  FileSpreadsheet,
  Network,
  Users,
  Shield,
} from 'lucide-react';

interface NavItem {
  id: PageType;
  label: string;
  subLabel: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useAntifraud();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Asosiy Dashboard',
      subLabel: 'Monitoring ko\'rsatkichlari',
      icon: LayoutDashboard,
    },
    {
      id: 'appeals',
      label: 'Murojaatlar ro\'yxati',
      subLabel: 'Mijozlar e\'tirozi va da\'volar',
      icon: Inbox,
    },
    {
      id: 'drop-cards',
      label: 'Drop kartalar ro\'yxati',
      subLabel: 'Bloklangan va xavfli kartalar',
      icon: CreditCard,
    },
    {
      id: 'fraud-list',
      label: 'Firibgarlik ro\'yxati',
      subLabel: 'Hujjatlar va fayllar biriktirish',
      icon: FileWarning,
    },
    {
      id: 'humo-clearing',
      label: 'Humo kliring tahlili',
      subLabel: 'Settlement fayllari va qoidalar',
      icon: FileSpreadsheet,
    },
    {
      id: 'droppers-find',
      label: 'Dropperlarni aniqlash',
      subLabel: 'DWH tahlili va hisobraqamlar',
      icon: Network,
    },
    {
      id: 'admin-panel',
      label: 'Admin Panel',
      subLabel: 'Foydalanuvchilar boshqaruvi',
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col py-4 select-none min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-4">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-300">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-mono truncate">Anti-Fraud Engine v2.4</span>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all group ${
                  isActive
                    ? 'bg-blue-600/15 border border-blue-500/40 text-blue-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <div className="truncate">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{item.subLabel}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
