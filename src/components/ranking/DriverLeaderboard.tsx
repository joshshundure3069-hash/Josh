import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Award,
  Download,
  Calendar,
  Fuel,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Truck as TruckIcon,
  Filter,
} from 'lucide-react';
import { DeliveryTrip, Driver, FleetSettings, MonthlyDriverRanking, Truck } from '../../types/fleet';
import { calculateMonthlyRankings } from '../../services/fuelCalculator';
import { DriverAvatar } from '../common/DriverAvatar';

interface DriverLeaderboardProps {
  trips: DeliveryTrip[];
  drivers: Driver[];
  trucks: Truck[];
  settings: FleetSettings;
  onSelectDriver: (driverId: string, month: string) => void;
  onNewTripClick: () => void;
  onOpenHistory?: () => void;
  onOpenGuide?: () => void;
}

export const DriverLeaderboard: React.FC<DriverLeaderboardProps> = ({
  trips,
  drivers,
  trucks,
  settings,
  onSelectDriver,
  onNewTripClick,
  onOpenHistory,
  onOpenGuide,
}) => {
  const availableMonths = [
    { value: '2026-10', label: 'October 2026 (Current Month)' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-08', label: 'August 2026' },
  ];

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedTruckReference, setSelectedTruckReference] = useState<string>('all');

  const selectedTruckObj = useMemo(() => {
    return selectedTruckReference !== 'all' ? trucks.find((t) => t.id === selectedTruckReference) : null;
  }, [selectedTruckReference, trucks]);

  const rankings: MonthlyDriverRanking[] = calculateMonthlyRankings(
    trips,
    drivers,
    selectedMonth,
    settings,
    selectedTruckReference
  );

  const truckMap = new Map(trucks.map((t) => [t.id, t]));

  // Month summary metrics
  const totalFuelSavedMonth = rankings.reduce((acc, r) => acc + r.totalFuelSavedL, 0);
  const totalIncentiveBonuses = rankings.reduce((acc, r) => acc + r.incentiveBonus, 0);
  const totalRankedTrips = rankings.reduce((acc, r) => acc + r.outsideTripsCount, 0);

  const champion = rankings[0];

  const triggerCelebration = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b'],
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Driver Name',
      'Month',
      'Ranked Trips',
      'Distance (km)',
      'Fuel Used (L)',
      'Expected Fuel (L)',
      'Fuel Saved (L)',
      'Avg L/100km',
      'Incentive Bonus',
    ];

    const rows = rankings.map((r) => [
      r.rank,
      `"${r.driverName}"`,
      `"${selectedMonth}"`,
      r.outsideTripsCount,
      r.totalDistanceKm,
      r.totalFuelUsedL,
      r.totalExpectedFuelL,
      r.totalFuelSavedL,
      r.avgL100km,
      `${settings.currencySymbol}${r.incentiveBonus}`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `driver_rankings_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-amber-950/40 shrink-0">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shrink-0">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200 font-black text-sm flex items-center justify-center shadow-md shrink-0">
          3
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700 shrink-0">
        {rank}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Driver Rankings & Fuel Bonuses
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Ranked by fuel saved on deliveries from Willowvale Depot (Local city runs excluded)
          </p>
        </div>

        {/* Month selector, Truck Reference Selector & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select ranking month"
              className="bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer font-semibold"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Truck Reference Dropdown: Compare using same truck as reference */}
          <div className="relative">
            <select
              value={selectedTruckReference}
              onChange={(e) => setSelectedTruckReference(e.target.value)}
              aria-label="Select truck reference for fuel comparison"
              className="bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="all">Reference: All Fleet (Per-Truck Baselines)</option>
              {trucks.map((trk) => (
                <option key={trk.id} value={trk.id}>
                  Same Truck: {trk.plate} ({trk.model} – {trk.baselineRateL100km} L/100km)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
            title="Download rankings as CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
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

      {/* Truck Reference Comparison Explainer Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <TruckIcon size={16} />
          </div>
          <div>
            <span className="font-bold text-white">Truck Benchmark Reference: </span>
            {selectedTruckObj ? (
              <span className="text-slate-300">
                Comparing driver savings specifically on <strong className="text-emerald-400">{selectedTruckObj.plate}</strong> ({selectedTruckObj.model}) using its verified baseline rate of <strong className="text-white">{selectedTruckObj.baselineRateL100km} L/100km</strong> ({selectedTruckObj.tankCapacityL}L tank).
              </span>
            ) : (
              <span className="text-slate-300">
                Every delivery's fuel saved is strictly compared against that <strong>same truck's verified baseline rate</strong> (e.g. 30.5 L/100km for Freightliner vs 22.0 L/100km for Isuzu), ensuring completely fair comparison across the fleet.
              </span>
            )}
          </div>
        </div>

        {selectedTruckReference !== 'all' && (
          <button
            onClick={() => setSelectedTruckReference('all')}
            className="text-emerald-400 hover:text-emerald-300 underline font-semibold self-start sm:self-auto shrink-0 cursor-pointer"
          >
            Reset to All Trucks
          </button>
        )}
      </div>

      {/* 3 Simple Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Fuel size={14} />
            Net Fuel Saved
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {totalFuelSavedMonth > 0 ? `+${Math.round(totalFuelSavedMonth * 10) / 10}` : Math.round(totalFuelSavedMonth * 10) / 10} L
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Liters saved by drivers below baseline
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <DollarSign size={14} />
            Total Bonuses Earned
          </span>
          <div className="text-2xl font-black font-mono text-teal-300 mt-1">
            {settings.currencySymbol}{totalIncentiveBonuses.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            At {settings.currencySymbol}{settings.ecoBonusPerLitreSaved}/L saved cash bonus
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Trophy size={14} />
            Monthly Champion
          </span>
          <div className="flex items-center gap-2 mt-1 truncate">
            {champion && (
              <>
                <DriverAvatar
                  name={champion.driverName}
                  avatarUrl={champion.driverAvatar}
                  size="sm"
                  className="w-7 h-7"
                />
                <span className="text-lg font-black text-white truncate">
                  {champion.driverName}
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-amber-300/80 mt-0.5 font-mono">
            {champion ? `+${champion.totalFuelSavedL}L saved • ${settings.currencySymbol}${champion.incentiveBonus} bonus` : 'No data'}
          </p>
        </div>
      </div>

      {/* Simplified Driver Rankings List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Leaderboard Standings
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {rankings.length} Drivers • {totalRankedTrips} Ranked Trips
          </span>
        </div>

        <div className="space-y-2.5">
          {rankings.map((r) => {
            const isWinner = r.rank === 1;
            const isPositive = r.totalFuelSavedL > 0;
            const driverObj = drivers.find((d) => d.id === r.driverId);
            const truckObj = driverObj?.assignedTruckId ? truckMap.get(driverObj.assignedTruckId) : undefined;

            return (
              <div
                key={r.driverId}
                onClick={() => onSelectDriver(r.driverId, selectedMonth)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
                  isWinner
                    ? 'bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left: Rank, Avatar & Driver Info */}
                <div className="flex items-center gap-3">
                  {getRankBadge(r.rank)}

                  <DriverAvatar
                    name={r.driverName}
                    avatarUrl={r.driverAvatar}
                    size="md"
                    className="w-10 h-10 shrink-0"
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {r.driverName}
                      </h3>
                      {isWinner && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Champion
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{truckObj ? truckObj.plate : 'Fleet Driver'}</span>
                      <span>•</span>
                      <span>{r.outsideTripsCount} deliveries</span>
                      <span>•</span>
                      <span className="font-mono">{r.totalDistanceKm.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>

                {/* Right: Fuel Saved, Bonus & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850">
                  {/* Consumption Rate */}
                  <div className="text-right hidden md:block">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Rate</span>
                    <span className="text-xs font-mono font-bold text-slate-200 block">
                      {r.avgL100km} L/100km
                    </span>
                  </div>

                  {/* Fuel Saved */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fuel Saved</span>
                    <span
                      className={`text-sm sm:text-base font-black font-mono block ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${r.totalFuelSavedL} L` : `${r.totalFuelSavedL} L`}
                    </span>
                  </div>

                  {/* Cash Bonus */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cash Bonus</span>
                    <span className="text-sm sm:text-base font-black font-mono text-teal-300 block">
                      {settings.currencySymbol}{r.incentiveBonus.toFixed(2)}
                    </span>
                  </div>

                  {/* Chevron Button */}
                  <div className="p-2 rounded-xl bg-slate-900 text-slate-400 group-hover:text-white shrink-0">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Small Friendly Policy Footer */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center gap-2 text-xs text-slate-400">
          <Info size={14} className="text-emerald-400 shrink-0" />
          <span>
            Willowvale Local Harare city deliveries are automatically excluded so drivers are not penalized for urban congestion or warehouse dock idling.
          </span>
        </div>
      </div>
    </div>
  );
};
