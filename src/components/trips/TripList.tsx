import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  PlusCircle,
  Download,
  Fuel,
  Calendar,
  Truck as TruckIcon,
  User,
  MapPin,
  Gauge,
  Layers,
  ChevronRight,
  X,
  Eye,
} from 'lucide-react';
import {
  DeliveryTrip,
  Driver,
  FleetSettings,
  Truck,
} from '../../types/fleet';
import { getGaugeLabel } from '../../services/fuelCalculator';
import { exportTripsToCSV, downloadCSV } from '../../services/storage';
import { DriverAvatar } from '../common/DriverAvatar';

interface TripListProps {
  trips: DeliveryTrip[];
  trucks: Truck[];
  drivers: Driver[];
  settings: FleetSettings;
  onSelectTrip: (trip: DeliveryTrip) => void;
  onNewTripClick: (routeName?: string) => void;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  trucks,
  drivers,
  settings,
  onSelectTrip,
  onNewTripClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('all');
  const [selectedTruckFilter, setSelectedTruckFilter] = useState('all');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<'all' | 'outside' | 'local'>('all');

  const truckMap = useMemo(() => new Map(trucks.map((t) => [t.id, t])), [trucks]);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const driver = driverMap.get(t.driverId);
      const truck = truckMap.get(t.truckId);
      const searchLower = searchQuery.toLowerCase().trim();

      // Search match
      if (searchLower) {
        const matches =
          t.tripCode.toLowerCase().includes(searchLower) ||
          t.destination.toLowerCase().includes(searchLower) ||
          (t.secondaryDestination && t.secondaryDestination.toLowerCase().includes(searchLower)) ||
          (t.routeName && t.routeName.toLowerCase().includes(searchLower)) ||
          (driver && driver.name.toLowerCase().includes(searchLower)) ||
          (truck && truck.plate.toLowerCase().includes(searchLower));
        if (!matches) return false;
      }

      // Truck Reference match
      if (selectedTruckFilter !== 'all' && t.truckId !== selectedTruckFilter) return false;

      // Scope match
      const tripScope = t.deliveryScope || 'outside';
      if (selectedScopeFilter !== 'all' && tripScope !== selectedScopeFilter) return false;

      // Route match
      if (selectedRouteFilter !== 'all') {
        if (selectedRouteFilter === 'along') {
          if (!t.isAlongTheWay && !t.secondaryDestination) return false;
        } else {
          const match =
            (t.routeName && t.routeName.toLowerCase().includes(selectedRouteFilter.toLowerCase())) ||
            (t.destination && t.destination.toLowerCase().includes(selectedRouteFilter.toLowerCase()));
          if (!match) return false;
        }
      }

      return true;
    });
  }, [trips, searchQuery, selectedRouteFilter, selectedTruckFilter, selectedScopeFilter, driverMap, truckMap]);

  // Filtered totals
  const totalKm = filteredTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
  const totalFuel = filteredTrips.reduce((acc, t) => acc + (t.fuelUsedL || 0), 0);
  const totalSaved = filteredTrips.reduce((acc, t) => acc + (t.fuelSavedL || 0), 0);

  const handleExportCSV = () => {
    const csvStr = exportTripsToCSV(filteredTrips, trucks, drivers, settings);
    downloadCSV(csvStr, `willowvale_delivery_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="text-emerald-400" size={24} />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Delivery Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Dispatches and fuel gauge telemetry from Willowvale Central Depot
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onNewTripClick()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Log Delivery</span>
          </button>
        </div>
      </div>

      {/* Top 3 Simple Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Deliveries
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
            {filteredTrips.length}
          </span>
          <span className="text-[10px] text-slate-500">{totalKm.toLocaleString()} km total</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Fuel Consumed
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
            {Math.round(totalFuel * 10) / 10} L
          </span>
          <span className="text-[10px] text-slate-500">
            Avg {totalKm > 0 ? (Math.round((totalFuel / totalKm) * 1000) / 10).toFixed(1) : 0} L/100km
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
            Fuel Variance
          </span>
          <span
            className={`text-xl sm:text-2xl font-black font-mono mt-0.5 block ${
              totalSaved >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalSaved > 0 ? `+${Math.round(totalSaved * 10) / 10}` : Math.round(totalSaved * 10) / 10} L
          </span>
          <span className="text-[10px] text-teal-400">
            {totalSaved >= 0 ? 'Fuel saved' : 'Over baseline'}
          </span>
        </div>
      </div>

      {/* Simple Search & Route Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by trip code, driver, truck plate, destination..."
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

        {/* Route Filter Dropdown */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedRouteFilter}
            onChange={(e) => setSelectedRouteFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-950 border border-slate-750 text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">All Willowvale Routes</option>
            <option value="Bindura">Bindura Corridor (A11)</option>
            <option value="Chinhoyi">Chinhoyi Corridor (A1)</option>
            <option value="Chegutu">Chegutu Corridor (A5)</option>
            <option value="Kadoma">Kadoma Corridor (A5)</option>
            <option value="Kwekwe">Kwekwe Corridor (A5)</option>
            <option value="Gweru">Gweru Corridor (A5)</option>
            <option value="Local">Willowvale Local (Harare Urban)</option>
            <option value="along">Along The Way Runs</option>
          </select>
        </div>

        {/* Truck Reference Dropdown: Compare using same truck as reference */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedTruckFilter}
            onChange={(e) => setSelectedTruckFilter(e.target.value)}
            aria-label="Filter deliveries by truck reference"
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

        {/* Scope Pill Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto shrink-0">
          <button
            onClick={() => setSelectedScopeFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              selectedScopeFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedScopeFilter('outside')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              selectedScopeFilter === 'outside' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Outside (Ranked)
          </button>
          <button
            onClick={() => setSelectedScopeFilter('local')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
              selectedScopeFilter === 'local' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Local City
          </button>
        </div>
      </div>

      {/* Deliveries List */}
      {filteredTrips.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <ClipboardList size={22} />
          </div>
          <h3 className="text-base font-bold text-white">No delivery logs found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or clearing route filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRouteFilter('all');
              setSelectedScopeFilter('all');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs transition cursor-pointer"
          >
            Clear Filters
          </button>
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
                onClick={() => onSelectTrip(trip)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition shadow-md cursor-pointer space-y-3"
              >
                {/* Top Row: Trip Code, Route, Status, and View Receipt */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm text-white">
                      {trip.tripCode}
                    </span>

                    <span className="text-xs font-bold text-slate-200">
                      {trip.destination}
                      {trip.secondaryDestination && (
                        <span className="text-emerald-400 ml-1">
                          & {trip.secondaryDestination} (Along)
                        </span>
                      )}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLocal
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isLocal ? 'Local (Excluded)' : 'Outside Highway'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        isSaved
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isSaved ? `+${trip.fuelSavedL} L Saved` : `${trip.fuelSavedL} L Over`}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrip(trip);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition"
                    >
                      <Eye size={12} />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>

                {/* The 9 Required Details in a clean, legible grid */}
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

                {/* Performance summary line */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-850 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span>Distance: <strong className="text-white font-mono">{trip.distanceKm} km</strong></span>
                    <span>•</span>
                    <span>Fuel Used: <strong className="text-white font-mono">{trip.fuelUsedL} L</strong></span>
                    <span>•</span>
                    <span>Rate: <strong className="text-teal-300 font-mono">{trip.actualRateL100km} L/100km</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span>Truck Ref: <strong className="text-emerald-400 font-mono">{truck?.plate} ({truck?.baselineRateL100km} L/100km)</strong></span>
                    <span>•</span>
                    <span>Target: <strong className="text-slate-300 font-mono">{trip.expectedFuelL} L</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
