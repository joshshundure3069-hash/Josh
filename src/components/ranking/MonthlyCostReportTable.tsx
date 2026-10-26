import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Fuel,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  ArrowUpDown,
  ShieldCheck,
  ChevronRight,
  Calculator,
  FileSpreadsheet,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { MonthlyDriverRanking, FleetSettings } from '../../types/fleet';
import { DriverAvatar } from '../common/DriverAvatar';

interface MonthlyCostReportTableProps {
  rankings: MonthlyDriverRanking[];
  settings: FleetSettings;
  selectedMonth: string;
  onSelectDriver: (driverId: string, month: string) => void;
  onNewTripClick: () => void;
}

type SortField = 'fuelSpend' | 'fuelUsed' | 'fuelSaved' | 'costSaved' | 'distance' | 'driverName' | 'costPer100km';
type SortOrder = 'asc' | 'desc';

export const MonthlyCostReportTable: React.FC<MonthlyCostReportTableProps> = ({
  rankings,
  settings,
  selectedMonth,
  onSelectDriver,
  onNewTripClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('fuelSpend');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Format month name for display
  const monthDisplay = useMemo(() => {
    try {
      const [year, month] = selectedMonth.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // Enriched driver records with cost calculations strictly for outside routes
  const enrichedRows = useMemo(() => {
    return rankings.map((r) => {
      const fuelCostSpend = Number((r.totalFuelUsedL * settings.fuelPricePerLitre).toFixed(2));
      const expectedFuelCost = Number((r.totalExpectedFuelL * settings.fuelPricePerLitre).toFixed(2));
      const costVariance = Number((r.totalFuelSavedL * settings.fuelPricePerLitre).toFixed(2));
      const costPer100km =
        r.totalDistanceKm > 0 ? Number(((fuelCostSpend / r.totalDistanceKm) * 100).toFixed(2)) : 0;
      const isLocalExemptOnly = r.outsideTripsCount === 0 && r.localTripsCount > 0;

      return {
        ...r,
        fuelCostSpend,
        expectedFuelCost,
        costVariance,
        costPer100km,
        isLocalExemptOnly,
      };
    });
  }, [rankings, settings.fuelPricePerLitre]);

  // Filtered and sorted rows
  const filteredRows = useMemo(() => {
    let result = enrichedRows.filter((row) =>
      row.driverName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'fuelSpend':
          comparison = a.fuelCostSpend - b.fuelCostSpend;
          break;
        case 'fuelUsed':
          comparison = a.totalFuelUsedL - b.totalFuelUsedL;
          break;
        case 'fuelSaved':
          comparison = a.totalFuelSavedL - b.totalFuelSavedL;
          break;
        case 'costSaved':
          comparison = a.costVariance - b.costVariance;
          break;
        case 'distance':
          comparison = a.totalDistanceKm - b.totalDistanceKm;
          break;
        case 'costPer100km':
          comparison = a.costPer100km - b.costPer100km;
          break;
        case 'driverName':
          comparison = a.driverName.localeCompare(b.driverName);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [enrichedRows, searchQuery, sortField, sortOrder]);

  // Fleet Monthly Aggregate Totals (Strictly outside deliveries)
  const totals = useMemo(() => {
    const activeOutsideDrivers = rankings.filter((r) => r.outsideTripsCount > 0);
    const outsideTrips = rankings.reduce((sum, r) => sum + r.outsideTripsCount, 0);
    const localTrips = rankings.reduce((sum, r) => sum + r.localTripsCount, 0);
    const distanceKm = rankings.reduce((sum, r) => sum + r.totalDistanceKm, 0);
    const fuelUsedL = Number(rankings.reduce((sum, r) => sum + r.totalFuelUsedL, 0).toFixed(1));
    const fuelCostSpend = Number((fuelUsedL * settings.fuelPricePerLitre).toFixed(2));
    const expectedFuelL = Number(rankings.reduce((sum, r) => sum + r.totalExpectedFuelL, 0).toFixed(1));
    const expectedFuelCost = Number((expectedFuelL * settings.fuelPricePerLitre).toFixed(2));
    const netFuelSavedL = Number((expectedFuelL - fuelUsedL).toFixed(1));
    const netCostSaved = Number((netFuelSavedL * settings.fuelPricePerLitre).toFixed(2));
    const totalBonuses = Number(rankings.reduce((sum, r) => sum + r.incentiveBonus, 0).toFixed(2));
    const fleetAvgL100km = distanceKm > 0 ? Number(((fuelUsedL / distanceKm) * 100).toFixed(1)) : 0;
    const fleetAvgCostPer100km =
      distanceKm > 0 ? Number(((fuelCostSpend / distanceKm) * 100).toFixed(2)) : 0;

    return {
      activeOutsideDriversCount: activeOutsideDrivers.length,
      outsideTrips,
      localTrips,
      distanceKm,
      fuelUsedL,
      fuelCostSpend,
      expectedFuelL,
      expectedFuelCost,
      netFuelSavedL,
      netCostSaved,
      totalBonuses,
      fleetAvgL100km,
      fleetAvgCostPer100km,
    };
  }, [rankings, settings.fuelPricePerLitre]);

  // CSV Export for Monthly Fuel & Cost Report
  const handleExportCostReportCSV = () => {
    const headers = [
      'Driver Name',
      'Reporting Month',
      'Outside Runs (Ranked)',
      'Local Runs (Excluded)',
      'Outside Distance (km)',
      'Fuel Consumed (L)',
      `Total Fuel Spend (${settings.currencySymbol})`,
      'Benchmark Expected Fuel (L)',
      `Benchmark Expected Cost (${settings.currencySymbol})`,
      'Net Fuel Saved (L)',
      `Net Cost Saved / Variance (${settings.currencySymbol})`,
      'Avg Consumption (L/100km)',
      `Cost per 100km (${settings.currencySymbol})`,
      `Incentive Bonus (${settings.currencySymbol})`,
      'Evaluation Status',
    ];

    const rows = enrichedRows.map((r) => [
      `"${r.driverName}"`,
      `"${selectedMonth}"`,
      r.outsideTripsCount,
      r.localTripsCount,
      r.totalDistanceKm,
      r.totalFuelUsedL,
      r.fuelCostSpend.toFixed(2),
      r.totalExpectedFuelL,
      r.expectedFuelCost.toFixed(2),
      r.totalFuelSavedL,
      r.costVariance.toFixed(2),
      r.avgL100km,
      r.costPer100km.toFixed(2),
      r.incentiveBonus.toFixed(2),
      r.isLocalExemptOnly ? '"Local Routes Exempt"' : '"Ranked Outside Routes"',
    ]);

    // Summary row
    const summaryRow = [
      '"FLEET TOTALS (OUTSIDE ONLY)"',
      `"${selectedMonth}"`,
      totals.outsideTrips,
      totals.localTrips,
      totals.distanceKm,
      totals.fuelUsedL,
      totals.fuelCostSpend.toFixed(2),
      totals.expectedFuelL,
      totals.expectedFuelCost.toFixed(2),
      totals.netFuelSavedL,
      totals.netCostSaved.toFixed(2),
      totals.fleetAvgL100km,
      totals.fleetAvgCostPer100km.toFixed(2),
      totals.totalBonuses.toFixed(2),
      '"Summary"',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(',')), summaryRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecotrack_monthly_fuel_cost_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Notice: Strict Exclusion of Local Deliveries */}
      <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-emerald-950/60 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 shrink-0 mt-0.5">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Monthly Fuel Consumption & Cost Report ({monthDisplay})
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  Highway & Outside Deliveries Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                This audit view aggregates <strong className="text-white">total fuel burned and actual cost spend</strong> by driver for payroll, finance, and accounting. As requested, all <span className="text-amber-400 font-semibold underline decoration-amber-500/40">local delivery routes are strictly excluded</span> from fuel consumption, cost variance, and incentive totals to eliminate urban idle distortions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={handleExportCostReportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
              title="Export complete Monthly Fuel & Cost Report as CSV"
            >
              <FileSpreadsheet size={15} />
              <span>Export Cost CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Outside Fuel Consumed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Fuel Consumed</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Fuel size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {totals.fuelUsedL.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-400">Liters</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {totals.outsideTrips} outside deliveries ({totals.distanceKm.toLocaleString()} km)
          </p>
        </div>

        {/* Total Fuel Expenditure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Fuel Spend</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-emerald-400 font-mono">
              {settings.currencySymbol}
              {totals.fuelCostSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            At {settings.currencySymbol}{settings.fuelPricePerLitre}/L benchmark rate
          </p>
        </div>

        {/* Net Cost Savings / Variance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Net Financial Savings</span>
            <span className={`p-2 rounded-xl ${totals.netCostSaved >= 0 ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {totals.netCostSaved >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black tracking-tight font-mono ${totals.netCostSaved >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {totals.netCostSaved >= 0 ? '+' : ''}
              {settings.currencySymbol}
              {Math.abs(totals.netCostSaved).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totals.netFuelSavedL >= 0 ? `+${totals.netFuelSavedL}` : totals.netFuelSavedL} L vs baseline gauge
          </p>
        </div>

        {/* Fleet Efficiency & Unit Cost */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Fleet Unit Cost</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Calculator size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {settings.currencySymbol}
              {totals.fleetAvgCostPer100km.toFixed(2)}
            </span>
            <span className="text-xs font-medium text-slate-400">/ 100km</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Fleet avg: {totals.fleetAvgL100km} L/100km outside
          </p>
        </div>
      </div>

      {/* Main Aggregated Table by Driver */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Controls: Search & Sort Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/40">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
            <input
              type="text"
              placeholder="Search driver by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <ArrowUpDown size={13} />
              Sort by:
            </span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              aria-label="Sort monthly report columns"
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer font-medium"
            >
              <option value="fuelSpend">Fuel Spend ($)</option>
              <option value="fuelUsed">Fuel Consumed (L)</option>
              <option value="costSaved">Cost Savings ($)</option>
              <option value="fuelSaved">Fuel Saved (L)</option>
              <option value="distance">Distance (km)</option>
              <option value="costPer100km">Cost per 100km</option>
              <option value="driverName">Driver Name</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold"
              title="Toggle sort direction"
            >
              {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
            </button>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <Fuel className="mx-auto text-slate-600 mb-3" size={36} />
            <p className="text-slate-300 font-medium">No drivers found matching your search</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing the search filter or select another month.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                <tr>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition"
                    onClick={() => handleSort('driverName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Driver</span>
                      {sortField === 'driverName' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    Runs (Outside / Local)
                  </th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition"
                    onClick={() => handleSort('distance')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Outside Km</span>
                      {sortField === 'distance' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition"
                    onClick={() => handleSort('fuelUsed')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Fuel Consumed</span>
                      {sortField === 'fuelUsed' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition"
                    onClick={() => handleSort('fuelSpend')}
                  >
                    <div className="flex items-center justify-end gap-1 text-emerald-400">
                      <span>Total Fuel Spend</span>
                      {sortField === 'fuelSpend' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right text-slate-400">
                    Baseline Cost
                  </th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition"
                    onClick={() => handleSort('fuelSaved')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Fuel Saved (L)</span>
                      {sortField === 'fuelSaved' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition"
                    onClick={() => handleSort('costSaved')}
                  >
                    <div className="flex items-center justify-end gap-1 text-teal-400">
                      <span>Cost Saved / Variance</span>
                      {sortField === 'costSaved' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Avg Rate</th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition"
                    onClick={() => handleSort('costPer100km')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Cost / 100km</span>
                      {sortField === 'costPer100km' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right text-amber-400">Eco Bonus</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredRows.map((row) => {
                  const isPositive = row.totalFuelSavedL > 0;
                  const isZero = row.totalFuelSavedL === 0;

                  return (
                    <tr
                      key={row.driverId}
                      className="hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => onSelectDriver(row.driverId, selectedMonth)}
                    >
                      {/* Driver Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <DriverAvatar
                            name={row.driverName}
                            avatarUrl={row.driverAvatar}
                            size="sm"
                            className="ring-1 ring-slate-700"
                          />
                          <div>
                            <span className="font-bold text-white group-hover:text-teal-300 transition text-sm">
                              {row.driverName}
                            </span>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {row.isLocalExemptOnly ? (
                                <span className="text-amber-400 font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  Exclusively Local City Routes (Exempt)
                                </span>
                              ) : (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  Ranked Highway / Outside Driver
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Outside Runs vs Excluded Local Runs */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono text-xs font-bold text-emerald-400">
                          {row.outsideTripsCount} outside
                        </div>
                        {row.localTripsCount > 0 ? (
                          <div className="text-[10px] text-amber-400/90 font-mono">
                            {row.localTripsCount} local (excl)
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono">0 local</div>
                        )}
                      </td>

                      {/* Distance (km) */}
                      <td className="py-3.5 px-4 text-right text-slate-300 font-mono">
                        {row.isLocalExemptOnly ? (
                          <span className="text-slate-500 italic text-[11px]">Exempt (Local)</span>
                        ) : (
                          `${row.totalDistanceKm.toLocaleString()} km`
                        )}
                      </td>

                      {/* Total Fuel Consumed (L) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {row.isLocalExemptOnly ? (
                          <span className="text-slate-500 text-[11px]">—</span>
                        ) : (
                          <span className="text-white font-bold text-xs">
                            {row.totalFuelUsedL.toLocaleString()} L
                          </span>
                        )}
                      </td>

                      {/* Total Fuel Spend ($) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {row.isLocalExemptOnly ? (
                          <span className="text-slate-500 text-[11px]">—</span>
                        ) : (
                          <span className="text-emerald-400 font-bold text-xs">
                            {settings.currencySymbol}
                            {row.fuelCostSpend.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </td>

                      {/* Baseline Expected Spend ($) */}
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                        {row.isLocalExemptOnly ? (
                          <span className="text-slate-500 text-[11px]">—</span>
                        ) : (
                          <span>
                            {settings.currencySymbol}
                            {row.expectedFuelCost.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </td>

                      {/* Fuel Saved (L) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {row.isLocalExemptOnly ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20">
                            Local Exempt
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-xs ${
                              isPositive
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : isZero
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {isPositive ? `+${row.totalFuelSavedL}` : row.totalFuelSavedL} L
                          </span>
                        )}
                      </td>

                      {/* Cost Variance / Financial Savings */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {row.isLocalExemptOnly ? (
                          <span className="text-slate-500 text-[11px]">—</span>
                        ) : (
                          <span
                            className={`font-bold text-xs ${
                              row.costVariance > 0
                                ? 'text-teal-400'
                                : row.costVariance === 0
                                ? 'text-slate-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {row.costVariance > 0 ? '+' : ''}
                            {settings.currencySymbol}
                            {row.costVariance.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Consumption Rate (L/100km) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {row.isLocalExemptOnly ? (
                          <span className="text-slate-500 text-[11px]">—</span>
                        ) : (
                          <span className="text-slate-200">
                            {row.avgL100km} <span className="text-[10px] text-slate-500">L/100km</span>
                          </span>
                        )}
                      </td>

                      {/* Cost per 100km */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {row.isLocalExemptOnly ? (
                          <span className="text-slate-500 text-[11px]">—</span>
                        ) : (
                          <span className="text-slate-300 font-semibold">
                            {settings.currencySymbol}
                            {row.costPer100km.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Eco Bonus */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {row.isLocalExemptOnly ? (
                          <span className="text-slate-500 text-[11px]">Exempt</span>
                        ) : row.incentiveBonus > 0 ? (
                          <span className="text-amber-300">
                            {settings.currencySymbol}
                            {row.incentiveBonus.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDriver(row.driverId, selectedMonth);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Open Driver Monthly Scorecard"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Fleet Totals Summary Footer */}
              <tfoot className="bg-slate-950 text-slate-200 font-bold border-t-2 border-slate-700">
                <tr>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-teal-400" />
                      <div>
                        <span className="text-sm font-black text-white uppercase tracking-wider">
                          Fleet Totals (Outside Only)
                        </span>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {totals.activeOutsideDriversCount} ranked drivers • {totals.localTrips} local runs excluded
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-emerald-400">
                    {totals.outsideTrips} outside
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-200">
                    {totals.distanceKm.toLocaleString()} km
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white text-sm">
                    {totals.fuelUsedL.toLocaleString()} L
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-400 text-sm">
                    {settings.currencySymbol}
                    {totals.fuelCostSpend.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-400">
                    {settings.currencySymbol}
                    {totals.expectedFuelCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs ${
                        totals.netFuelSavedL >= 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {totals.netFuelSavedL >= 0 ? `+${totals.netFuelSavedL}` : totals.netFuelSavedL} L
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    <span
                      className={`text-sm ${
                        totals.netCostSaved >= 0 ? 'text-teal-400' : 'text-rose-400'
                      }`}
                    >
                      {totals.netCostSaved >= 0 ? '+' : ''}
                      {settings.currencySymbol}
                      {totals.netCostSaved.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-300">
                    {totals.fleetAvgL100km} L
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-300">
                    {settings.currencySymbol}
                    {totals.fleetAvgCostPer100km.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-amber-300 text-sm">
                    {settings.currencySymbol}
                    {totals.totalBonuses.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Summary</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Accounting & Operations Documentation Note */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs text-slate-400">
        <Info size={18} className="text-teal-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-200">Financial Audit & Policy Notice</h4>
          <p className="mt-1 leading-relaxed">
            All outside fuel consumption figures are reconciled directly against certified dashboard gauge levels at departure and arrival, incorporating fuel refuels and verified dock idling. Local urban delivery routes are documented in the Delivery Logs tab but are excluded from monthly aggregate fuel burn and bonus calculation formulas to maintain fair compensation across drivers.
          </p>
        </div>
      </div>
    </div>
  );
};
