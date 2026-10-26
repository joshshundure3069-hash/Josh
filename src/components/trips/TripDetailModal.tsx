import React from 'react';
import {
  X,
  MapPin,
  Calendar,
  Truck as TruckIcon,
  User,
  Fuel,
  TrendingUp,
  TrendingDown,
  Trash2,
  Gauge,
  Navigation,
  Route,
  Sparkles,
  Info,
} from 'lucide-react';
import { DeliveryTrip, Driver, FleetSettings, Truck } from '../../types/fleet';
import { getGaugeLabel } from '../../services/fuelCalculator';

interface TripDetailModalProps {
  trip: DeliveryTrip;
  trucks: Truck[];
  drivers: Driver[];
  settings: FleetSettings;
  onClose: () => void;
  onDeleteTrip?: (tripId: string) => void;
}

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
  trip,
  trucks,
  drivers,
  settings,
  onClose,
  onDeleteTrip,
}) => {
  const truck = trucks.find((t) => t.id === trip.truckId);
  const driver = drivers.find((d) => d.id === trip.driverId);
  const isSaved = trip.fuelSavedL > 0;
  const isLocal = trip.deliveryScope === 'local';

  const tankCapacity = truck?.tankCapacityL || 400;
  const startLiters = Math.round(trip.startFuelGauge * tankCapacity);
  const endLiters = Math.round(trip.endFuelGauge * tankCapacity);
  const totalFuelAdded = trip.refuels ? trip.refuels.reduce((acc, r) => acc + r.litres, 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/30">
              <Fuel size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-black text-xl text-white">{trip.tripCode}</span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    isLocal
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isLocal ? '🏙️ Willowvale Local (Excluded from Rankings)' : '🛣️ Outside Delivery (Ranked)'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    isSaved
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isSaved ? `+${trip.fuelSavedL} L Saved` : `${trip.fuelSavedL} L Over`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
                <span>{trip.warehouseOrigin || 'Willowvale Central Depot'} ➔ </span>
                <strong className="text-white">{trip.destination}</strong>
                {trip.secondaryDestination && (
                  <span className="text-emerald-400 font-semibold">
                    & {trip.secondaryDestination} (Along the way)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDeleteTrip && (
              <button
                onClick={() => {
                  if (confirm(`Delete delivery record ${trip.tripCode}?`)) {
                    onDeleteTrip(trip.id);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                title="Delete this record"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Content: High Visibility 9 Logging Details Breakdown */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Group 1: Trip Metadata (1. Date, 2. Driver, 3. Truck) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Date */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar size={15} className="text-emerald-400" />
                1. Date of Delivery
              </span>
              <div className="text-lg font-mono font-black text-white mt-1">
                {trip.startDate?.slice(0, 10)}
              </div>
            </div>

            {/* 2. Driver */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User size={15} className="text-emerald-400" />
                2. Driver's Name
              </span>
              <div className="text-lg font-black text-white mt-1 truncate">
                {driver?.name || 'Driver'}
              </div>
              <div className="text-xs text-slate-400 font-mono">{driver?.licenseNumber}</div>
            </div>

            {/* 3. Truck */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TruckIcon size={15} className="text-emerald-400" />
                3. Truck Being Used
              </span>
              <div className="text-lg font-mono font-black text-white mt-1">
                {truck?.plate || 'Truck'}
              </div>
              <div className="text-xs text-slate-400">
                {truck?.model} ({tankCapacity}L tank)
              </div>
            </div>
          </div>

          {/* Group 2: Route & En-Route Fuel (6. Destination, 7. Fuel Added) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 6. Destination */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin size={15} className="text-emerald-400" />
                6. Destination
              </span>
              <div className="text-lg font-black text-white mt-1">
                {trip.destination}
                {trip.secondaryDestination && ` & ${trip.secondaryDestination}`}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Corridor: {trip.routeName || trip.destination} • {trip.deliveryScope === 'local' ? 'Local Route' : 'Outside Highway'}
              </div>
            </div>

            {/* 7. Fuel Added */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Fuel size={15} className="text-emerald-400" />
                7. Fuel Added If There Is?
              </span>
              <div className="text-lg font-mono font-black text-white mt-1">
                {totalFuelAdded > 0 ? (
                  <span className="text-emerald-400">+{totalFuelAdded} L Added</span>
                ) : (
                  <span className="text-slate-400">No Fuel Added (0 L)</span>
                )}
              </div>
              {trip.refuels && trip.refuels.length > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  {trip.refuels[0].stationName || 'En-route station'} • {settings.currencySymbol}{trip.refuels[0].cost}
                </div>
              )}
            </div>
          </div>

          {/* Group 3: Departure & Arrival Readings (4, 5, 8, 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Departure Readings (4 & 5) */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                  Departure Check
                </span>
                <span className="text-xs text-slate-400">At Willowvale</span>
              </div>

              {/* 4. Millage Before Going */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  4. Millage Before Going
                </span>
                <span className="text-2xl font-mono font-black text-white block mt-0.5">
                  {trip.startOdoKm.toLocaleString()} <span className="text-sm text-slate-400">KM</span>
                </span>
              </div>

              {/* 5. Fuel Gauge Before Going */}
              <div className="pt-2 border-t border-slate-850">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  5. Fuel Gauge Before Going
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-mono font-black text-white">
                    {getGaugeLabel(trip.startFuelGauge)} ({Math.round(trip.startFuelGauge * 100)}%)
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    {startLiters} L in tank
                  </span>
                </div>
              </div>
            </div>

            {/* Arrival Readings (8 & 9) */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-sm font-black text-teal-400 uppercase tracking-wider">
                  Arrival Check
                </span>
                <span className="text-xs text-slate-400">Upon Return</span>
              </div>

              {/* 9. Millage After Arrival */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  9. Millage After Arrival
                </span>
                <span className="text-2xl font-mono font-black text-white block mt-0.5">
                  {trip.endOdoKm.toLocaleString()} <span className="text-sm text-slate-400">KM</span>
                </span>
              </div>

              {/* 8. Fuel Gauge After Arrival */}
              <div className="pt-2 border-t border-slate-850">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  8. Fuel Gauge After Arrival
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-mono font-black text-white">
                    {getGaugeLabel(trip.endFuelGauge)} ({Math.round(trip.endFuelGauge * 100)}%)
                  </span>
                  <span className="text-xs text-teal-400 font-mono font-bold">
                    {endLiters} L remaining
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Group 4: Automatic Consumption & Cost Results */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                Automatic Fuel Consumption & Variance Summary
              </span>
              <span className="text-xs font-mono text-emerald-300 font-semibold">
                Reference: {truck?.plate} ({truck?.baselineRateL100km} L/100km baseline)
              </span>
            </div>

            {/* Truck Reference Clarification Banner */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <TruckIcon size={16} className="text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  Fuel savings is compared strictly using the <strong>same truck ({truck?.plate})</strong> as reference.
                </span>
              </div>
              <span className="font-mono text-slate-400 text-[11px] shrink-0">
                Baseline: {truck?.baselineRateL100km} L/100km • {tankCapacity}L tank
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance Driven</span>
                <span className="text-2xl font-mono font-black text-white mt-1 block">
                  {trip.distanceKm} <span className="text-xs text-slate-400">km</span>
                </span>
                <span className="text-[10px] text-slate-400">Odo Difference</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Fuel Used</span>
                <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">
                  {trip.fuelUsedL} <span className="text-xs text-slate-400">L</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{trip.actualRateL100km} L/100km</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Fuel</span>
                <span className="text-2xl font-mono font-black text-slate-200 mt-1 block">
                  {trip.expectedFuelL} <span className="text-xs text-slate-400">L</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Tgt {trip.expectedRateL100km} L/100km</span>
              </div>

              <div
                className={`p-3 rounded-2xl border ${
                  isSaved
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                }`}
              >
                <span className="text-[10px] uppercase font-bold block opacity-90">
                  {isSaved ? 'Net Fuel Saved' : 'Excess Burn'}
                </span>
                <span className="text-2xl font-mono font-black mt-1 block">
                  {isSaved ? `+${trip.fuelSavedL}` : trip.fuelSavedL} <span className="text-xs">L</span>
                </span>
                <span className="text-[10px] font-bold block mt-1">
                  {isLocal
                    ? 'Local (Excluded from Bonus)'
                    : isSaved
                    ? `+${settings.currencySymbol}${(trip.fuelSavedL * settings.ecoBonusPerLitreSaved).toFixed(2)} Bonus`
                    : 'Over Baseline'}
                </span>
              </div>
            </div>

            {trip.notes && (
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                <strong className="text-slate-400 block mb-0.5">Notes:</strong>
                {trip.notes}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t-2 border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
