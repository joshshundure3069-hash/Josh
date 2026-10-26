import React, { useState } from 'react';
import {
  Gauge,
  Calculator,
  Truck as TruckIcon,
  Fuel,
  ArrowRight,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { FleetSettings, Truck } from '../../types/fleet';
import { FuelGaugeDial } from '../gauge/FuelGaugeDial';
import {
  GAUGE_FRACTIONS,
  getGaugeLabel,
  getLitersFromGauge,
} from '../../services/fuelCalculator';

interface QuickGaugeCalculatorProps {
  trucks: Truck[];
  settings: FleetSettings;
}

export const QuickGaugeCalculator: React.FC<QuickGaugeCalculatorProps> = ({
  trucks,
  settings,
}) => {
  const [selectedTruckId, setSelectedTruckId] = useState<string>(trucks[0]?.id || '');
  const [gaugeVal, setGaugeVal] = useState<number>(0.625); // 5/8
  const [plannedKm, setPlannedKm] = useState<number>(350);

  const selectedTruck = trucks.find((t) => t.id === selectedTruckId) || trucks[0];
  const tankCapacity = selectedTruck?.tankCapacityL || 400;
  const baselineRate = selectedTruck?.baselineRateL100km || 28;

  // Remaining liters
  const currentLiters = getLitersFromGauge(gaugeVal, tankCapacity);

  // Expected fuel needed for planned trip
  const expectedNeededL = Math.round(((plannedKm / 100) * baselineRate) * 10) / 10;
  const willRunOut = expectedNeededL > currentLiters;
  const remainingLitersAfterTrip = Math.max(0, currentLiters - expectedNeededL);
  const remainingFractionAfterTrip = tankCapacity > 0 ? remainingLitersAfterTrip / tankCapacity : 0;

  // Maximum driving range on remaining fuel
  const maxRangeKm = baselineRate > 0 ? Math.round((currentLiters / baselineRate) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="text-emerald-400" size={24} />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Dashboard Gauge Reader & Range Estimator
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Simulate gauge needle positions, convert dial fractions to precise liters, and estimate trip range
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Interactive Gauge Dial */}
        <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center">
          <div className="w-full mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <TruckIcon size={14} className="text-emerald-400" />
              Target Truck Tank
            </label>
            <select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white font-medium text-xs sm:text-sm rounded-xl px-3 py-2"
            >
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plate} • {t.model} ({t.tankCapacityL} L tank, {t.baselineRateL100km} L/100km)
                </option>
              ))}
            </select>
          </div>

          <FuelGaugeDial
            value={gaugeVal}
            onChange={setGaugeVal}
            tankCapacityL={tankCapacity}
            size="lg"
            label="Dashboard Cluster Needle"
            sublabel="Touch or drag needle to match truck dashboard"
          />

          {/* 1-Tap Quick Needle Presets */}
          <div className="w-full mt-3 pt-3 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block text-center mb-1.5">
              1-Tap Dial Presets
            </span>
            <div className="grid grid-cols-5 gap-1 text-[11px] font-mono">
              {[
                { label: 'Full', val: 1.0 },
                { label: '3/4', val: 0.75 },
                { label: '1/2', val: 0.5 },
                { label: '1/4', val: 0.25 },
                { label: 'Empty', val: 0.0 },
              ].map((p) => {
                const isSelected = Math.abs(gaugeVal - p.val) < 0.02;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setGaugeVal(p.val)}
                    className={`py-1 rounded-lg border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow'
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry & Trip Range Simulator */}
        <div className="md:col-span-6 space-y-4">
          {/* Key Readouts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold block">Fuel in Tank</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {currentLiters}
                </span>
                <span className="text-xs text-slate-400">/ {tankCapacity} L</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Gauge at {getGaugeLabel(gaugeVal)} ({Math.round(gaugeVal * 100)}%)
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold block">Estimated Range</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-teal-400 font-mono">
                  ~{maxRangeKm}
                </span>
                <span className="text-xs text-slate-400">km</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                at {baselineRate} L/100km baseline
              </span>
            </div>
          </div>

          {/* Planned Delivery Range Simulator */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Calculator size={15} className="text-emerald-400" />
              Delivery Trip Feasibility Check
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Planned Delivery Distance (km):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="10"
                  max="2000"
                  step="10"
                  value={plannedKm}
                  onChange={(e) => setPlannedKm(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm px-3 py-2 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setPlannedKm(250)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  250km
                </button>
                <button
                  type="button"
                  onClick={() => setPlannedKm(500)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  500km
                </button>
              </div>
            </div>

            {/* Outcome simulation */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Expected Fuel Burn:</span>
                <span className="font-mono font-bold text-white">{expectedNeededL} Liters</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status upon arrival:</span>
                {willRunOut ? (
                  <span className="text-rose-400 font-bold font-mono">
                    ⚠️ Shortfall of {Math.round((expectedNeededL - currentLiters) * 10) / 10} L (Must refuel!)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                    <Check size={13} />
                    Sufficient fuel ({remainingLitersAfterTrip.toFixed(1)} L remaining)
                  </span>
                )}
              </div>

              {!willRunOut && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Expected Arrival Needle:</span>
                  <span className="font-mono font-bold text-teal-300">
                    {getGaugeLabel(remainingFractionAfterTrip)} ({Math.round(remainingFractionAfterTrip * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Fraction Reference Card */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Reference Table for {tankCapacity}L Tank
            </span>
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-mono">
              {GAUGE_FRACTIONS.filter((_, i) => i % 2 === 0).map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setGaugeVal(f.value)}
                  className="bg-slate-950 hover:bg-slate-800 p-2 rounded-xl border border-slate-800 transition"
                >
                  <span className="font-bold text-white block">{f.label}</span>
                  <span className="text-[10px] text-emerald-400 block">
                    {Math.round(f.value * tankCapacity)} L
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
