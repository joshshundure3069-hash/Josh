import React, { useState, useEffect } from 'react';
import {
  X,
  Gauge,
  Truck as TruckIcon,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Fuel,
  Activity,
  PlusCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { FleetSettings, Truck, TruckCheckInLog } from '../../types/fleet';
import { FuelGaugeDial } from '../gauge/FuelGaugeDial';
import { getGaugeLabel, getLitersFromGauge } from '../../services/fuelCalculator';

interface ManualDataEntryModalProps {
  trucks: Truck[];
  initialTruckId?: string;
  settings: FleetSettings;
  onClose: () => void;
  onUpdateTruck: (
    updatedTruck: Truck,
    checkInLog?: TruckCheckInLog
  ) => void;
}

export const ManualDataEntryModal: React.FC<ManualDataEntryModalProps> = ({
  trucks,
  initialTruckId,
  settings,
  onClose,
  onUpdateTruck,
}) => {
  // Selected truck
  const [selectedTruckId, setSelectedTruckId] = useState<string>(
    initialTruckId || trucks[0]?.id || ''
  );
  const truck = trucks.find((t) => t.id === selectedTruckId) || trucks[0];

  // Previous recorded baseline values
  const prevOdo = truck?.currentOdoKm || 0;
  const prevGauge = truck?.currentFuelGauge !== undefined ? truck.currentFuelGauge : 0.75;
  const prevStatus = truck?.status || 'active';
  const tankCapacity = truck?.tankCapacityL || 400;

  // Manual inputs
  const [currentOdo, setCurrentOdo] = useState<number>(prevOdo + 180);
  const [gaugePercentInput, setGaugePercentInput] = useState<number>(
    Math.max(5, Math.round(prevGauge * 100) - 20)
  ); // e.g. 55%
  const [updatedStatus, setUpdatedStatus] = useState<Truck['status']>(truck?.status || 'active');
  const [entryReason, setEntryReason] = useState<string>('Yard Check-in / Shift Handover');
  const [notes, setNotes] = useState<string>('');
  const [refuelAddedL, setRefuelAddedL] = useState<number>(0);
  const [showRefuelInput, setShowRefuelInput] = useState<boolean>(false);

  // When truck changes, reset values
  useEffect(() => {
    if (truck) {
      setCurrentOdo(truck.currentOdoKm + 150);
      setGaugePercentInput(Math.max(5, Math.round((truck.currentFuelGauge ?? 0.75) * 100) - 15));
      setUpdatedStatus(truck.status);
      setRefuelAddedL(0);
      setShowRefuelInput(false);
    }
  }, [selectedTruckId]);

  // Derived gauge ratio (0.0 to 1.0)
  const currentGaugeRatio = Math.max(0, Math.min(100, Number(gaugePercentInput) || 0)) / 100;

  // Litres currently in tank
  const currentLitersInTank = getLitersFromGauge(currentGaugeRatio, tankCapacity);
  const prevLitersInTank = getLitersFromGauge(prevGauge, tankCapacity);

  // Distance traveled
  const distanceKm = Math.max(0, currentOdo - prevOdo);

  // Fuel consumed:
  // (prevGauge - currentGaugeRatio) * tankCapacity + refuelAdded
  const gaugeLitersConsumed = (prevGauge - currentGaugeRatio) * tankCapacity;
  const estimatedFuelConsumedL = Math.max(
    0,
    Math.round((gaugeLitersConsumed + (Number(refuelAddedL) || 0)) * 10) / 10
  );

  // Rate in L/100km
  const calculatedRateL100km =
    distanceKm > 0 ? Math.round((estimatedFuelConsumedL / distanceKm) * 100 * 10) / 10 : 0;

  // Comparison with baseline
  const baselineRate = truck?.baselineRateL100km || 29.0;
  const isEcoFavorable =
    calculatedRateL100km > 0 && calculatedRateL100km <= baselineRate * 1.05;

  const estimatedCost = Math.round(estimatedFuelConsumedL * settings.fuelPricePerLitre * 100) / 100;

  // Validate odometer
  const isOdoDecreasing = currentOdo < prevOdo;

  // Auto detect if gauge increased without refuel declared
  const gaugeIncreased = currentGaugeRatio > prevGauge + 0.03;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truck) return;

    if (isOdoDecreasing) {
      const proceed = confirm(
        `The entered odometer (${currentOdo.toLocaleString()} km) is lower than the previous odometer (${prevOdo.toLocaleString()} km). Proceed anyway?`
      );
      if (!proceed) return;
    }

    const checkInLog: TruckCheckInLog = {
      id: `checkin-${Date.now()}`,
      truckId: truck.id,
      timestamp: new Date().toISOString(),
      prevOdoKm: prevOdo,
      newOdoKm: Number(currentOdo),
      distanceKm,
      prevFuelGauge: prevGauge,
      newFuelGauge: currentGaugeRatio,
      fuelConsumedL: estimatedFuelConsumedL,
      rateL100km: calculatedRateL100km,
      updatedStatus,
      reason: entryReason,
      notes: notes.trim(),
      refuelAddedL: refuelAddedL > 0 ? refuelAddedL : undefined,
    };

    const updatedTruck: Truck = {
      ...truck,
      currentOdoKm: Number(currentOdo),
      currentFuelGauge: currentGaugeRatio,
      status: updatedStatus,
      lastCheckIn: {
        timestamp: new Date().toISOString(),
        distanceKm,
        fuelConsumedL: estimatedFuelConsumedL,
        rateL100km: calculatedRateL100km,
        status: updatedStatus,
      },
    };

    onUpdateTruck(updatedTruck, checkInLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Gauge size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Manual Data Entry & Gauge Check-In</h2>
              <p className="text-xs text-slate-400">
                Input current odometer reading & fuel gauge % to calculate consumption and update truck status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {/* Select Truck */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <TruckIcon size={14} className="text-emerald-400" />
              Select Truck
            </label>
            <select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white font-medium text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500"
            >
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plate} • {t.model} ({t.tankCapacityL}L tank, {t.currentOdoKm.toLocaleString()} km, {Math.round(t.currentFuelGauge * 100)}% fuel)
                </option>
              ))}
            </select>
          </div>

          {/* Previous Baseline Reference Ribbon */}
          {truck && (
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Previous Reading:</span>
                <span className="font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {prevOdo.toLocaleString()} km
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Previous Fuel:</span>
                <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {getGaugeLabel(prevGauge)} ({Math.round(prevGauge * 100)}%) • {prevLitersInTank} L
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {prevStatus}
                </span>
              </div>
            </div>
          )}

          {/* Core Manual Inputs: Odometer & Fuel Gauge % */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Input 1: Current Odometer */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
                  <span>1. Current Odometer Reading (km)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    +{distanceKm.toLocaleString()} km driven
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Enter latest mileage shown on dashboard odometer
                </p>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={currentOdo}
                    onChange={(e) => setCurrentOdo(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-black text-xl px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-mono">
                    KM
                  </span>
                </div>
                {isOdoDecreasing && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={13} /> Odometer is lower than previous record ({prevOdo.toLocaleString()} km)
                  </p>
                )}
              </div>

              {/* Quick Distance Stepper Shortcuts */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500">Quick Add:</span>
                {[50, 100, 250, 500].map((addKm) => (
                  <button
                    key={addKm}
                    type="button"
                    onClick={() => setCurrentOdo(prevOdo + addKm)}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-800 transition"
                  >
                    +{addKm}km
                  </button>
                ))}
              </div>
            </div>

            {/* Input 2: Current Fuel Gauge Percentage */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
                  <span>2. Current Fuel Gauge % (0-100)</span>
                  <span className="text-[10px] text-teal-400 font-mono font-bold">
                    {currentLitersInTank} L in tank
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Enter the dashboard needle percentage reading
                </p>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      required
                      value={gaugePercentInput}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setGaugePercentInput(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-black text-xl px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-mono font-bold">
                      %
                    </span>
                  </div>

                  {/* Visual Fraction badge */}
                  <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[70px]">
                    <span className="text-[10px] text-slate-400 block">Dial</span>
                    <span className="text-sm font-black text-teal-400 font-mono">
                      {getGaugeLabel(currentGaugeRatio)}
                    </span>
                  </div>
                </div>

                {/* Range Slider for Gauge */}
                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={gaugePercentInput}
                    onChange={(e) => setGaugePercentInput(parseInt(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-1 text-xs">
                {[
                  { label: 'E (0%)', pct: 0 },
                  { label: '1/4', pct: 25 },
                  { label: '1/2', pct: 50 },
                  { label: '3/4', pct: 75 },
                  { label: 'Full', pct: 100 },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setGaugePercentInput(b.pct)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                      gaugePercentInput === b.pct
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Refuel Top-up Option (in case fuel was pumped since last reading) */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel size={15} className="text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Did the truck refuel during this period?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRefuelInput(!showRefuelInput);
                  if (showRefuelInput) setRefuelAddedL(0);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                  showRefuelInput
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {showRefuelInput ? 'Refuel Added ✓' : '+ Add Refuel'}
              </button>
            </div>

            {showRefuelInput && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-3">
                <label className="text-xs text-slate-400">Liters Pumped:</label>
                <div className="relative w-32">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={refuelAddedL}
                    onChange={(e) => setRefuelAddedL(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg"
                    placeholder="Liters"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-mono">
                    L
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  (Cost: ~{settings.currencySymbol}
                  {(refuelAddedL * settings.fuelPricePerLitre).toFixed(2)})
                </span>
              </div>
            )}

            {gaugeIncreased && !showRefuelInput && (
              <p className="mt-2 text-xs text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Fuel gauge reading increased from {Math.round(prevGauge * 100)}% to {gaugePercentInput}%. If fuel was added, please tap "+ Add Refuel" above.
              </p>
            )}
          </div>

          {/* Real-Time Calculated Consumption Metrics */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={14} />
                Calculated Fuel Consumption Output
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                Formula: (Δ Gauge % × {tankCapacity}L Tank) + Refuels
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Estimated Fuel Consumed */}
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Fuel Consumed
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {estimatedFuelConsumedL} L
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {Math.round(Math.abs(prevGauge - currentGaugeRatio) * 100)}% gauge drop
                </span>
              </div>

              {/* Distance Traveled */}
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Distance Driven
                </span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">
                  {distanceKm.toLocaleString()} km
                </span>
                <span className="text-[10px] text-slate-500">
                  {prevOdo.toLocaleString()} → {currentOdo.toLocaleString()}
                </span>
              </div>

              {/* Calculated Rate */}
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Consumption Rate
                </span>
                <span className="text-2xl font-black text-teal-300 font-mono mt-1 block">
                  {calculatedRateL100km}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  L/100km (base: {baselineRate})
                </span>
              </div>

              {/* Estimated Fuel Cost */}
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Burn Cost
                </span>
                <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
                  {settings.currencySymbol}
                  {estimatedCost.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  @{settings.currencySymbol}{settings.fuelPricePerLitre}/L
                </span>
              </div>
            </div>
          </div>

          {/* Update Truck Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Activity size={14} className="text-teal-400" />
                Update Truck Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'active', label: 'Active', desc: 'Ready / Yard' },
                  { key: 'in-transit', label: 'In Transit', desc: 'On Route' },
                  { key: 'maintenance', label: 'Maintenance', desc: 'In Service' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setUpdatedStatus(s.key as Truck['status'])}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      updatedStatus === s.key
                        ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs block">{s.label}</span>
                    <span className="text-[10px] opacity-70 block">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Check-in Reason & Context
              </label>
              <select
                value={entryReason}
                onChange={(e) => setEntryReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 mb-2"
              >
                <option value="Yard Check-in / Shift Handover">Yard Check-in / Shift Handover</option>
                <option value="Post-Delivery Inspection">Post-Delivery Inspection</option>
                <option value="Pre-Trip Departure Verification">Pre-Trip Departure Verification</option>
                <option value="Fuel Top-up / Refill Check">Fuel Top-up / Refill Check</option>
                <option value="Routine Yard Fuel Audit">Routine Yard Fuel Audit</option>
              </select>

              <input
                type="text"
                placeholder="Optional notes or remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950 transition active:scale-95 flex items-center gap-2"
            >
              <CheckCircle size={16} />
              <span>Calculate & Update Truck</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
