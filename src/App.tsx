import React, { useState } from 'react';
import { ErpProvider, useErp } from './context/ErpContext';
import { ThemeProvider } from './context/ThemeContext';
import { AndroidFrame } from './components/AndroidFrame';
import { Navigation, NavTab } from './components/Navigation';
import { TopBar } from './components/TopBar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CleanDataModal } from './components/CleanDataModal';
import { CompanyLetterheadModal } from './components/CompanyLetterheadModal';
import { ThemeAndDashboardModal } from './components/ThemeAndDashboardModal';

import { DashboardScreen } from './screens/DashboardScreen';
import { SalesScreen } from './screens/SalesScreen';
import { InvoicesScreen } from './screens/InvoicesScreen';
import { PurchasingScreen } from './screens/PurchasingScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { AccountingScreen } from './screens/AccountingScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { PartnersScreen } from './screens/PartnersScreen';
import { AuditLogScreen } from './screens/AuditLogScreen';

import {
  Code2,
  Wifi,
  WifiOff,
  RefreshCw,
  Scan,
} from 'lucide-react';

const ErpMainContent: React.FC = () => {
  const {
    isOnline,
    offlineQueue,
    setIsOnline,
  } = useErp();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isCleanDataOpen, setIsCleanDataOpen] = useState(false);
  const [isLetterheadOpen, setIsLetterheadOpen] = useState(false);

  const renderScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setCurrentTab} />;
      case 'customers':
        return <PartnersScreen initialFilter="customer" onNavigate={setCurrentTab} />;
      case 'vendors':
        return <PartnersScreen initialFilter="vendor" onNavigate={setCurrentTab} />;
      case 'sales':
        return <SalesScreen />;
      case 'invoices':
        return <InvoicesScreen />;
      case 'purchasing':
        return <PurchasingScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'accounting':
        return <AccountingScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'partners':
        return <PartnersScreen initialFilter="all" onNavigate={setCurrentTab} />;
      case 'audit':
        return <AuditLogScreen />;
      default:
        return <DashboardScreen onNavigate={setCurrentTab} />;
    }
  };

  return (
    <>
      <AndroidFrame>
        {/* Top Bar for Company/Branch & Role Switching */}
        <TopBar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSync={() => setIsOfflineModalOpen(true)}
          onOpenArchitecture={() => setIsArchModalOpen(true)}
          onOpenCleanData={() => setIsCleanDataOpen(true)}
          onOpenLetterhead={() => setIsLetterheadOpen(true)}
        />

        {/* Offline Warning Banner if Offline */}
        {!isOnline && (
          <div className="bg-amber-950/80 border-b border-amber-600/60 px-4 py-2 flex items-center justify-between text-xs text-amber-200 shrink-0">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Changes queued in local Room DB ({offlineQueue.length} pending).
              </span>
            </div>
            <button
              onClick={() => setIsOnline(true)}
              className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-[10px]"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Content Area with Tablet/Desktop Rail or Phone View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Navigation Rail for Tablet / Desktop */}
          <div className="hidden md:flex shrink-0">
            <Navigation
              activeTab={currentTab}
              onTabChange={setCurrentTab}
              layout="rail"
            />
          </div>

          {/* Scrollable Viewport */}
          <div className="flex-1 overflow-y-auto bg-stone-950 pb-16 md:pb-4">
            {renderScreen()}
          </div>

          {/* Navigation Bottom Bar for Phone */}
          <div className="md:hidden">
            <Navigation
              activeTab={currentTab}
              onTabChange={setCurrentTab}
              layout="bottom"
            />
          </div>
        </div>
      </AndroidFrame>

      {/* Global Interactive Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => {
          setCurrentTab(tab as NavTab);
          setIsSearchOpen(false);
        }}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductFound={() => {
          setCurrentTab('inventory');
          setIsScannerOpen(false);
        }}
      />

      <OfflineSyncModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
      />

      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      <CleanDataModal
        isOpen={isCleanDataOpen}
        onClose={() => setIsCleanDataOpen(false)}
      />

      <CompanyLetterheadModal
        isOpen={isLetterheadOpen}
        onClose={() => setIsLetterheadOpen(false)}
      />

      <ThemeAndDashboardModal />
    </>
  );
};

export default function App() {
  return (
    <ErpProvider>
      <ThemeProvider>
        <ErpMainContent />
      </ThemeProvider>
    </ErpProvider>
  );
}
