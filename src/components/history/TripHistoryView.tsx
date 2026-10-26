import React, { useState, useMemo, useRef } from 'react';
import {
  History,
  Search,
  Calendar,
  Download,
  Upload,
  PlusCircle,
  Truck as TruckIcon,
  User,
  Fuel,
  Gauge,
  Eye,
  Trash2,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  DeliveryTrip,
  Driver,
  FleetSettings,
  Truck,
  TruckCheckInLog,
} from '../../types/fleet';
import {
  exportTripsToCSV,
  downloadCSV,
  exportBackupJSON,
  importBackupJSON,
  recordAuditEvent,
} from '../../services/storage';
import { getGaugeLabel } from '../../services/fuelCalculator';
import { DriverAvatar } from '../common/DriverAvatar';

interface TripHistoryViewProps {
  trips: DeliveryTrip[];
  trucks: Truck[];
  drivers: Driver[];
  settings: FleetSettings;
  checkInLogs?: TruckCheckInLog[];
  onSelectTrip: (trip: DeliveryTrip) => void;
  onNewTripClick: () => void;
  onDeleteTrip: (tripId: string) => void;
  onDataRestored?: () => void;
}

export const TripHistoryView: React.FC<TripHistoryViewProps> = ({
  trips,
  trucks,
  drivers,
  settings,
  checkInLogs = [],
  onSelectTrip,
  onNewTripClick,
  onDeleteTrip,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'trips' | 'checkins'>('trips');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [selectedTruck, setSelectedTruck] = useState('all');
  const [tripToDelete, setTripToDelete] = useState<DeliveryTrip | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const truckMap = useMemo(() => new Map(trucks.map((t) => [t.id, t])), [trucks]);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);

  // Unique months from trips
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    trips.forEach((t) => {
      const d = t.endDate || t.startDate;
      if (d && d.length >= 7) set.add(d.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [trips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const tripDate = (t.endDate || t.startDate || '').slice(0, 10);
      const tripMonth = tripDate.slice(0, 7);

      if (selectedMonth !== 'all' && tripMonth !== selectedMonth) return false;

      // Truck Reference filter
      if (selectedTruck !== 'all' && t.truckId !== selectedTruck) return false;

      if (selectedRoute !== 'all') {
        if (selectedRoute === 'along') {
          if (!t.isAlongTheWay && !t.secondaryDestination) return false;
        } else {
          const match =
            (t.routeName && t.routeName.toLowerCase().includes(selectedRoute.toLowerCase())) ||
            (t.destination && t.destination.toLowerCase().includes(selectedRoute.toLowerCase()));
          if (!match) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const driver = driverMap.get(t.driverId);
        const truck = truckMap.get(t.truckId);
        const match =
          t.tripCode.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          (t.secondaryDestination && t.secondaryDestination.toLowerCase().includes(q)) ||
          (driver && driver.name.toLowerCase().includes(q)) ||
          (truck && truck.plate.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [trips, selectedMonth, selectedRoute, searchQuery, driverMap, truckMap]);

  // Filtered summary metrics
  const totalKm = filteredTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
  const totalFuel = filteredTrips.reduce((acc, t) => acc + (t.fuelUsedL || 0), 0);
  const totalSaved = filteredTrips.reduce((acc, t) => acc + (t.fuelSavedL || 0), 0);
  const totalSavingsDollars = filteredTrips.reduce((acc, t) => acc + (t.costSaved || 0), 0);

  // Export CSV
  const handleExportCSV = () => {
    const csvStr = exportTripsToCSV(filteredTrips, trucks, drivers, settings);
    downloadCSV(csvStr, `fleet_history_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Export JSON Backup
  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Restore JSON Backup
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const ok = importBackupJSON(content);
        if (ok) {
          setImportStatus('✓ Backup successfully restored!');
          setTimeout(() => {
            setIsBackupModalOpen(false);
            setImportStatus(null);
            if (onDataRestored) onDataRestored();
          }, 1200);
        } else {
          setImportStatus('❌ Error restoring backup. Invalid file format.');
        }
      } catch {
        setImportStatus('❌ Error reading file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="text-emerald-400" size={24} />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Delivery & Fleet History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Search past deliveries, view yard check-ins, and export backups
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <Upload size={14} />
            <span>Backup / Restore</span>
          </button>

          <button
            onClick={onNewTripClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Log Delivery</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Deliveries
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
            {filteredTrips.length}
          </span>
          <span className="text-[10px] text-slate-500">{totalKm.toLocaleString()} km logged</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Fuel Burned
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
            {Math.round(totalFuel)} L
          </span>
          <span className="text-[10px] text-slate-500">
            Avg {totalKm > 0 ? ((totalFuel / totalKm) * 100).toFixed(1) : 0} L/100km
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
            Net Fuel Saved
          </span>
          <span
            className={`text-xl sm:text-2xl font-black font-mono mt-0.5 block ${
              totalSaved >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalSaved > 0 ? `+${Math.round(totalSaved)}` : Math.round(totalSaved)} L
          </span>
          <span className="text-[10px] text-teal-400">
            {settings.currencySymbol}{Math.max(0, Math.round(totalSavingsDollars))} saved
          </span>
        </div>
      </div>

      {/* Simple 2-Tab Switcher: Past Deliveries vs Yard Check-Ins */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'trips'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText size={15} />
          <span>Past Deliveries</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/40 font-mono">
            {filteredTrips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('checkins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'checkins'
              ? 'bg-teal-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gauge size={15} />
          <span>Yard Gauge Check-Ins</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/40 font-mono">
            {checkInLogs.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PAST DELIVERIES HISTORY                            */}
      {/* ========================================================= */}
      {activeTab === 'trips' && (
        <div className="space-y-4">
          {/* Simple Search & Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by trip code, driver, truck, or destination..."
                className="w-full bg-slate-950 border border-slate-750 text-white text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2 focus:border-emerald-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-750 text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m === '2026-10' ? 'October 2026' : m === '2026-09' ? 'September 2026' : m}
                </option>
              ))}
            </select>

            {/* Route Filter */}
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-750 text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="all">All Routes</option>
              <option value="Bindura">Bindura</option>
              <option value="Chinhoyi">Chinhoyi</option>
              <option value="Chegutu">Chegutu</option>
              <option value="Kadoma">Kadoma</option>
              <option value="Kwekwe">Kwekwe</option>
              <option value="Gweru">Gweru</option>
              <option value="Local">Willowvale Local</option>
              <option value="along">Along The Way</option>
            </select>

            {/* Truck Reference Dropdown: Compare using same truck as reference */}
            <select
              value={selectedTruck}
              onChange={(e) => setSelectedTruck(e.target.value)}
              aria-label="Filter history by truck reference"
              className="w-full sm:w-auto bg-slate-950 border border-slate-750 text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="all">Truck Ref: All Trucks</option>
              {trucks.map((trk) => (
                <option key={trk.id} value={trk.id}>
                  Ref: {trk.plate} ({trk.baselineRateL100km} L/100km)
                </option>
              ))}
            </select>
          </div>

          {/* Trips List */}
          {filteredTrips.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <History size={22} />
              </div>
              <h3 className="text-base font-bold text-white">No historical deliveries match</h3>
              <p className="text-xs text-slate-400">Try clearing filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrips.map((trip) => {
                const driver = driverMap.get(trip.driverId);
                const truck = truckMap.get(trip.truckId);
                const isSaved = trip.fuelSavedL > 0;
                const isLocal = trip.deliveryScope === 'local';
                const fuelAdded = trip.refuels ? trip.refuels.reduce((acc, r) => acc + r.litres, 0) : 0;
                const tripDate = trip.startDate?.slice(0, 10) || trip.endDate?.slice(0, 10) || 'Date';

                return (
                  <div
                    key={trip.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition shadow-sm space-y-3"
                  >
                    {/* Header line of card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-white">
                          {trip.tripCode}
                        </span>

                        <span className="text-xs font-bold text-slate-200">
                          {trip.destination}
                          {trip.secondaryDestination && ` & ${trip.secondaryDestination}`}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isLocal
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isLocal ? 'Local (Excluded)' : 'Ranked'}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            isSaved
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isSaved ? `+${trip.fuelSavedL} L Saved` : `${trip.fuelSavedL} L Over`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => onSelectTrip(trip)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Receipt</span>
                        </button>

                        <button
                          onClick={() => setTripToDelete(trip)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete trip"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* The 9 Required Details in clear 3x3 layout on mobile, 9 columns on desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-xs">
                      {/* 1. Date */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">1. Date</span>
                        <span className="font-mono font-bold text-white block mt-0.5 truncate">{tripDate}</span>
                      </div>

                      {/* 2. Driver */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">2. Driver</span>
                        <span className="font-bold text-white block mt-0.5 truncate">{driver?.name || trip.driverId}</span>
                      </div>

                      {/* 3. Truck */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">3. Truck (Ref)</span>
                        <span className="font-mono font-bold text-white block mt-0.5 truncate">{truck?.plate || trip.truckId}</span>
                        <span className="text-[9px] text-emerald-400 font-mono block">Ref: {truck?.baselineRateL100km} L/100km</span>
                      </div>

                      {/* 4. Start Mileage */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">4. Start Odo</span>
                        <span className="font-mono font-bold text-slate-300 block mt-0.5 truncate">{trip.startOdoKm.toLocaleString()} km</span>
                      </div>

                      {/* 5. Start Fuel Gauge */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">5. Start Fuel</span>
                        <span className="font-mono font-bold text-emerald-400 block mt-0.5">
                          {getGaugeLabel(trip.startFuelGauge)} ({Math.round(trip.startFuelGauge * 100)}%)
                        </span>
                      </div>

                      {/* 6. Destination */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">6. Destination</span>
                        <span className="font-bold text-white block mt-0.5 truncate">{trip.destination}</span>
                      </div>

                      {/* 7. Fuel Added */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">7. Fuel Added</span>
                        <span className={`font-mono font-bold block mt-0.5 ${fuelAdded > 0 ? 'text-teal-300' : 'text-slate-400'}`}>
                          {fuelAdded > 0 ? `+${fuelAdded}L` : '0 L'}
                        </span>
                      </div>

                      {/* 8. Arrival Fuel Gauge */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">8. End Fuel</span>
                        <span className="font-mono font-bold text-amber-300 block mt-0.5">
                          {getGaugeLabel(trip.endFuelGauge)} ({Math.round(trip.endFuelGauge * 100)}%)
                        </span>
                      </div>

                      {/* 9. Arrival Mileage */}
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-semibold text-slate-400 block">9. End Odo</span>
                        <span className="font-mono font-bold text-white block mt-0.5 truncate">{trip.endOdoKm.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: YARD GAUGE CHECK-INS                               */}
      {/* ========================================================= */}
      {activeTab === 'checkins' && (
        <div className="space-y-3">
          {checkInLogs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
              No manual yard check-in logs recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checkInLogs.map((log) => {
                const truck = truckMap.get(log.truckId);
                const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent';

                return (
                  <div
                    key={log.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-mono font-black text-white">{truck?.plate || log.truckId}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-400 block font-semibold">Odometer</span>
                        <span className="font-mono font-bold text-white block">{log.newOdoKm.toLocaleString()} km</span>
                        <span className="text-[10px] text-emerald-400 font-bold">+{log.distanceKm} km delta</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-400 block font-semibold">Fuel Gauge</span>
                        <span className="font-mono font-bold text-teal-300 block">{Math.round(log.newFuelGauge * 100)}%</span>
                        <span className="text-[10px] text-amber-400 font-bold">{log.fuelConsumedL}L burned</span>
                      </div>
                    </div>

                    {log.reason && (
                      <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                        {log.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* BACKUP & RESTORE MODAL                                    */}
      {/* ========================================================= */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Upload size={18} className="text-teal-400" />
                Backup & Restore Fleet Data
              </h3>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Option 1: Download Backup */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <strong className="text-white block font-bold">1. Download Backup (JSON)</strong>
                <p className="text-slate-400">
                  Save all {trips.length} delivery trips and fleet settings to a file on your device.
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> Download Backup
                </button>
              </div>

              {/* Option 2: Upload File to Restore */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <strong className="text-white block font-bold">2. Restore from Backup File</strong>
                <p className="text-slate-400">
                  Select a previously downloaded backup JSON file to restore records.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={14} /> Select JSON File to Restore
                </button>
              </div>

              {importStatus && (
                <div className={`p-3 rounded-xl font-bold ${
                  importStatus.includes('✓') ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                }`}>
                  {importStatus}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-white text-base">Delete Delivery Record?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete delivery <strong>{tripToDelete.tripCode}</strong> to <strong>{tripToDelete.destination}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setTripToDelete(null)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteTrip(tripToDelete.id);
                  recordAuditEvent('trip_deleted', `Deleted trip ${tripToDelete.tripCode}`);
                  setTripToDelete(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
