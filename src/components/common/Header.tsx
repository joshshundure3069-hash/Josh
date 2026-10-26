import React from 'react';
import {
  Trophy,
  Truck,
  PlusCircle,
  Gauge,
  Users,
  Settings,
  ClipboardList,
  Fuel,
  Calculator,
  History,
  Compass,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';

export type NavTab = 'rankings' | 'trips' | 'history' | 'gauge-calc' | 'trucks' | 'drivers' | 'settings';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onNewTripClick: () => void;
  onManualEntryClick: () => void;
  onOpenRouteGuide?: () => void;
  companyName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onNewTripClick,
  onManualEntryClick,
  onOpenRouteGuide,
  companyName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & App Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('rankings')}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 ring-1 ring-white/20">
              <Fuel className="text-white" size={20} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">EcoTrack</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Fleet
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[160px] sm:max-w-xs">
                {companyName}
              </p>
            </div>
          </div>

          {/* Action buttons on right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <OfflineIndicator />
            <PWAInstallButton />

            {onOpenRouteGuide && (
              <button
                onClick={onOpenRouteGuide}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer"
                title="Willowvale Depot Route Guide & Fuel Bonus Rules"
              >
                <Compass size={15} />
                <span className="hidden sm:inline">Depot Guide</span>
                <span className="sm:hidden">Guide</span>
              </button>
            )}

            <button
              onClick={onManualEntryClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer"
              title="Manual Data Entry: Input Odometer & Fuel Gauge %"
            >
              <Gauge size={15} />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Entry</span>
            </button>

            <button
              onClick={onNewTripClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
            >
              <PlusCircle size={16} />
              <span className="hidden sm:inline">Log Delivery</span>
              <span className="sm:hidden">Log</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/80 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => onTabChange('rankings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'rankings'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy size={14} />
            <span>Rankings & Reports</span>
          </button>

          <button
            onClick={() => onTabChange('trips')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'trips'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ClipboardList size={14} />
            <span>Delivery Logs</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History size={14} />
            <span>Trip History</span>
          </button>

          <button
            onClick={() => onTabChange('gauge-calc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              currentTab === 'gauge-calc'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Gauge size={14} />
            <span>Gauge Tool</span>
          </button>

          <button
            onClick={() => onTabChange('trucks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              currentTab === 'trucks'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Truck size={14} />
            <span>Trucks Fleet</span>
          </button>

          <button
            onClick={() => onTabChange('drivers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              currentTab === 'drivers'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users size={14} />
            <span>Drivers Roster</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ml-auto ${
              currentTab === 'settings'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Fleet Settings & Offline Backup"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
