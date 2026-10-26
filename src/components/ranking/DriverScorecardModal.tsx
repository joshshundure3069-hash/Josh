import React from 'react';
import {
  X,
  Trophy,
  Award,
  Fuel,
  Route,
  TrendingUp,
  TrendingDown,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  Truck as TruckIcon,
  Phone,
  CreditCard,
} from 'lucide-react';
import { DeliveryTrip, Driver, FleetSettings, Truck } from '../../types/fleet';
import { calculateMonthlyRankings, getGaugeLabel } from '../../services/fuelCalculator';

interface DriverScorecardModalProps {
  driverId: string;
  month: string;
  drivers: Driver[];
  trips: DeliveryTrip[];
  trucks: Truck[];
  settings: FleetSettings;
  onClose: () => void;
  onSelectTrip?: (trip: DeliveryTrip) => void;
}

export const DriverScorecardModal: React.FC<DriverScorecardModalProps> = ({
  driverId,
  month,
  drivers,
  trips,
  trucks,
  settings,
  onClose,
  onSelectTrip,
}) => {
  const driver = drivers.find((d) => d.id === driverId);
  const truckMap = new Map(trucks.map((t) => [t.id, t]));

  // Month rankings
  const rankings = calculateMonthlyRankings(trips, drivers, month, settings);
  const driverRank = rankings.find((r) => r.driverId === driverId);

  // Trips by this driver in this month
  const driverTrips = trips.filter((t) => {
    if (t.driverId !== driverId) return false;
    const dateStr = t.endDate || t.startDate;
    return dateStr && dateStr.startsWith(month);
  });

  if (!driver) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header with Driver Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={driver.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                alt={driver.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-md"
              />
              {driverRank && (
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow flex items-center gap-0.5">
                  #{driverRank.rank}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{driver.name}</h2>
                {driverRank && driverRank.rank === 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    🏆 Gold Saver
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>{driver.licenseNumber}</span>
                <span>•</span>
                <span>{driver.experienceYears} yrs commercial</span>
                <span>•</span>
                <span>{driver.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              title="Print Scorecard Certificate"
            >
              <Printer size={14} />
              <span>Print Scorecard</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Monthly Scorecard Summary */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={15} className="text-emerald-400" />
              Monthly Performance Report • {month}
            </h3>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                {driverRank?.outsideTripsCount ?? 0} Outside (Ranked)
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                {driverRank?.localTripsCount ?? 0} Local (Excluded)
              </span>
            </div>
          </div>

          {/* Metric KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Outside Fuel Saved</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-xl font-black font-mono ${(driverRank?.totalFuelSavedL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(driverRank?.totalFuelSavedL ?? 0) > 0 ? `+${driverRank?.totalFuelSavedL}` : driverRank?.totalFuelSavedL}
                </span>
                <span className="text-xs text-slate-400">L</span>
              </div>
              <span className="text-[10px] text-emerald-400">
                {driverRank?.fuelSavedPercent}% vs expected
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Outside Avg Rate</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-white">
                  {driverRank?.avgL100km}
                </span>
                <span className="text-xs text-slate-400">L/100km</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Target: {driverRank?.avgExpectedL100km} L
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Eco Driving Score</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-emerald-400">
                  {driverRank?.avgEcoScore}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {driverRank?.tier}
              </span>
            </div>

            <div className="bg-amber-950/20 p-3.5 rounded-2xl border border-amber-500/30">
              <span className="text-[11px] text-amber-300 font-medium">Eco Incentive Reward</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-amber-300">
                  {settings.currencySymbol}
                  {driverRank?.incentiveBonus.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-amber-400/80">
                Cost saved: {settings.currencySymbol}{driverRank?.estimatedCostSavings.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Delivery Log History for this Driver */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Delivery Breakdown ({month})
              </h4>
              <span className="text-[11px] text-slate-400">
                Local deliveries excluded from month-end rankings
              </span>
            </div>

            {driverTrips.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-950/40 rounded-xl">
                No deliveries recorded for {driver.name} in {month}.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {driverTrips.map((t) => {
                  const truck = truckMap.get(t.truckId);
                  const isSaved = t.fuelSavedL > 0;
                  const isLocal = t.deliveryScope === 'local';

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTrip?.(t)}
                      className="p-3 bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">
                            {t.tripCode}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                              isLocal
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isLocal ? '🏙️ Local (Excl)' : '🛣️ Outside (Ranked)'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {t.startDate?.slice(0, 10)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {t.routeType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 font-medium">
                          {t.routeName ? `${t.routeName} → ` : ''}{t.destination}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Truck: {truck ? `${truck.plate} (${truck.model})` : t.truckId} • {t.distanceKm} km
                          {isLocal && <span className="text-amber-400 ml-2">※ Excluded from bonus</span>}
                        </p>
                      </div>

                      {/* Gauge readings & Fuel Saved pill */}
                      <div className="flex items-center gap-4 self-end sm:self-auto text-xs font-mono">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Gauge (Depart → Arrive)</span>
                          <span className="text-slate-300 font-semibold">
                            {getGaugeLabel(t.startFuelGauge)} ({Math.round(t.startFuelGauge * 100)}%) → {getGaugeLabel(t.endFuelGauge)} ({Math.round(t.endFuelGauge * 100)}%)
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Used / Expected</span>
                          <span className="text-slate-300">
                            {t.fuelUsedL} L / {t.expectedFuelL} L
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isSaved ? `+${t.fuelSavedL}` : t.fuelSavedL} L
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Incentive policy: {settings.currencySymbol}{settings.ecoBonusPerLitreSaved} earned per liter of fuel saved.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
