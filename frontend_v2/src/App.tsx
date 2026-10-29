/**
 * Sentinel Antifraud System Main Application
 * Modern Enterprise Bank Security & Anti-Fraud Operations Platform
 */

import React from 'react';
import { AntifraudProvider, useAntifraud } from './context/AntifraudContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { MainDashboardPage } from './pages/MainDashboardPage';
import { AppealsListPage } from './pages/AppealsListPage';
import { DropCardsListPage } from './pages/DropCardsListPage';
import { FraudListPage } from './pages/FraudListPage';
import { HumoClearingPage } from './pages/HumoClearingPage';
import { DroppersFindingPage } from './pages/DroppersFindingPage';
import { AdminPanelPage } from './pages/AdminPanelPage';

import { AppealDetailModal } from './components/modals/AppealDetailModal';
import { DropCardDetailModal } from './components/modals/DropCardDetailModal';
import { FraudFileUploadModal } from './components/modals/FraudFileUploadModal';

const AppContent: React.FC = () => {
  const { currentPage } = useAntifraud();

  // If user navigated to login page, show the dedicated high-security login layout
  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col">
        <main className="flex-1 flex flex-col">
          <LoginPage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Bar Contract compliant Navigation */}
      <Navbar />

      {/* Main Operations Split: Sidebar + Dynamic Content Viewport */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Viewport Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full overflow-x-hidden">
          {currentPage === 'dashboard' && <MainDashboardPage />}
          {currentPage === 'appeals' && <AppealsListPage />}
          {currentPage === 'drop-cards' && <DropCardsListPage />}
          {currentPage === 'fraud-list' && <FraudListPage />}
          {currentPage === 'humo-clearing' && <HumoClearingPage />}
          {currentPage === 'droppers-find' && <DroppersFindingPage />}
          {currentPage === 'admin-panel' && <AdminPanelPage />}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <AppealDetailModal />
      <DropCardDetailModal />
      <FraudFileUploadModal />
    </div>
  );
};

export default function App() {
  return (
    <AntifraudProvider>
      <AppContent />
    </AntifraudProvider>
  );
}
