import React, { useState, useEffect } from 'react';
import {
  X,
  Truck as TruckIcon,
  User,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  TrendingUp,
  TrendingDown,
  Route,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Info,
  Navigation,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import {
  DeliveryScope,
  DeliveryTrip,
  Driver,
  FleetSettings,
  RefuelRecord,
  Truck,
} from '../../types/fleet';
import {
  OFFICIAL_WILLOWVALE_ROUTES,
  WILLOWVALE_WAREHOUSE,
  A5_CORRIDOR_DESTINATIONS,
  calculateCorridorDistance,
} from '../../services/storage';

interface NewTripModalProps {
  trucks: Truck[];
  drivers: Driver[];
  settings: FleetSettings;
  onClose: () => void;
  onSaveTrip: (trip: DeliveryTrip) => void;
  initialRouteName?: string;
}

// Visual Fuel Gauge Component for Maximum Visibility
interface VisualFuelMeterProps {
  value: number; // 0.0 to 1.0
  onChange: (val: number) => void;
  tankCapacityL: number;
  label: string;
  fieldNumber: number;
}

const VisualFuelMeter: React.FC<VisualFuelMeterProps> = ({
  value,
  onChange,
  tankCapacityL,
  label,
  fieldNumber,
}) => {
  const clampedVal = Math.max(0, Math.min(1, Number(value) || 0));
  const percentage = Math.round(clampedVal * 100);
  const liters = Math.round(clampedVal * tankCapacityL);

  // Fraction string
  const getFractionText = (val: number) => {
    if (val >= 0.98) return 'Full Tank';
    if (val >= 0.82) return '7/8 Tank';
    if (val >= 0.70) return '3/4 Tank';
    if (val >= 0.58) return '5/8 Tank';
    if (val >= 0.45) return '1/2 Tank';
    if (val >= 0.32) return '3/8 Tank';
    if (val >= 0.20) return '1/4 Tank';
    if (val >= 0.08) return '1/8 Tank (Reserve)';
    if (val > 0.0) return 'Critical Reserve';
    return 'Empty (0%)';
  };

  // Arc angles: -125deg to +125deg (250deg span)
  const startAngle = -125;
  const endAngle = 125;
  const span = endAngle - startAngle;
  const needleAngle = startAngle + clampedVal * span;

  // Polar to cartesian
  const polarToXY = (r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: 100 + r * Math.cos(rad),
      y: 100 + r * Math.sin(rad),
    };
  };

  const isReserve = clampedVal <= 0.125;

  return (
    <div className="bg-slate-950 border-2 border-slate-750 hover:border-slate-600 rounded-3xl p-4 sm:p-5 shadow-xl transition">
      {/* Field Number & Title */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        <label className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
            {fieldNumber}
          </span>
          <span>{label}</span>
        </label>
        <span
          className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-black border ${
            isReserve
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {percentage}% • {liters} L / {tankCapacityL} L
        </span>
      </div>

      {/* Visual Dial & Large Readout Container */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-2">
        {/* SVG Dial Meter */}
        <div className="relative w-44 h-40 sm:w-48 sm:h-44 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 200 185" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id={`grad-fuel-${fieldNumber}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="18%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Dial Background Face */}
            <circle cx="100" cy="100" r="82" fill="#090d16" stroke="#1e293b" strokeWidth="2.5" />

            {/* Background Arc Track */}
            <path
              d="M 33 147 A 75 75 0 1 1 167 147"
              fill="none"
              stroke="#1e293b"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Red Reserve Arc Warning */}
            <path
              d="M 33 147 A 75 75 0 0 1 45 125"
              fill="none"
              stroke="#ef4444"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.4"
            />

            {/* Active Colored Arc */}
            {clampedVal > 0.02 && (
              <path
                d={`M 33 147 A 75 75 0 ${clampedVal > 0.72 ? '1' : '0'} 1 ${polarToXY(75, needleAngle).x} ${polarToXY(75, needleAngle).y}`}
                fill="none"
                stroke={`url(#grad-fuel-${fieldNumber})`}
                strokeWidth="14"
                strokeLinecap="round"
              />
            )}

            {/* Dial Markings: E, 1/4, 1/2, 3/4, F */}
            {[
              { val: 0.0, label: 'E', color: '#ef4444' },
              { val: 0.25, label: '1/4', color: '#f59e0b' },
              { val: 0.5, label: '1/2', color: '#cbd5e1' },
              { val: 0.75, label: '3/4', color: '#10b981' },
              { val: 1.0, label: 'F', color: '#38bdf8' },
            ].map((mark) => {
              const ang = startAngle + mark.val * span;
              const outer = polarToXY(82, ang);
              const inner = polarToXY(mark.val === 0 || mark.val === 0.5 || mark.val === 1 ? 65 : 70, ang);
              const txtPos = polarToXY(52, ang);

              return (
                <g key={mark.label}>
                  <line
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={mark.color}
                    strokeWidth={mark.val === 0 || mark.val === 1 || mark.val === 0.5 ? 2.5 : 1.5}
                    strokeLinecap="round"
                  />
                  <text
                    x={txtPos.x}
                    y={txtPos.y + 3}
                    fill={mark.color}
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {mark.label}
                  </text>
                </g>
              );
            })}

            {/* Needle Line */}
            {(() => {
              const tip = polarToXY(73, needleAngle);
              const tail = polarToXY(-12, needleAngle);
              const needleCol = isReserve ? '#ef4444' : '#10b981';

              return (
                <g>
                  {/* Shadow */}
                  <line
                    x1={tail.x + 2}
                    y1={tail.y + 2}
                    x2={tip.x + 2}
                    y2={tip.y + 2}
                    stroke="#000000"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  {/* Needle */}
                  <line
                    x1={tail.x}
                    y1={tail.y}
                    x2={tip.x}
                    y2={tip.y}
                    stroke={needleCol}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Center Hub */}
                  <circle cx="100" cy="100" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <circle cx="100" cy="100" r="5" fill={needleCol} />
                </g>
              );
            })()}

            {/* Fuel Icon in center */}
            <g transform="translate(92, 126)">
              <Fuel size={16} className={isReserve ? 'text-rose-400 animate-pulse' : 'text-slate-400'} />
            </g>
          </svg>

          {isReserve && (
            <div className="absolute bottom-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40">
              Low Fuel
            </div>
          )}
        </div>

        {/* Readout & Fine Tuning */}
        <div className="flex-1 w-full space-y-2.5 text-center sm:text-left">
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
              Tank Level Fraction
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
              {getFractionText(clampedVal)}
            </div>
            <div className="text-xs sm:text-sm text-emerald-400 font-mono font-bold mt-0.5">
              {liters} Liters remaining in {tankCapacityL}L tank
            </div>
          </div>

          {/* Stepper Buttons for Fine Tuning */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, Math.round((clampedVal - 0.05) * 100) / 100))}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95"
              title="Decrease by 5%"
            >
              <Minus size={14} />
              <span>-5%</span>
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={clampedVal}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              aria-label={`${label} slider`}
              className="flex-1 accent-emerald-500 cursor-pointer h-3 bg-slate-900 border border-slate-700 rounded-lg"
            />

            <button
              type="button"
              onClick={() => onChange(Math.min(1, Math.round((clampedVal + 0.05) * 100) / 100))}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95"
              title="Increase by 5%"
            >
              <Plus size={14} />
              <span>+5%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Big Tactile Quick Preset Buttons */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 text-center sm:text-left">
          Tap Quick Gauge Presets:
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { label: 'Empty (0%)', val: 0.0 },
            { label: '1/4 (25%)', val: 0.25 },
            { label: '1/2 (50%)', val: 0.5 },
            { label: '3/4 (75%)', val: 0.75 },
            { label: 'Full (100%)', val: 1.0 },
          ].map((preset) => {
            const isMatch = Math.abs(clampedVal - preset.val) < 0.03;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.val)}
                className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold border transition active:scale-95 text-center ${
                  isMatch
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/60 ring-2 ring-emerald-400/50'
                    : 'bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const NewTripModal: React.FC<NewTripModalProps> = ({
  trucks,
  drivers,
  settings,
  onClose,
  onSaveTrip,
  initialRouteName,
}) => {
  // Modal layout mode: 'wizard' (step-by-step for ease & high visibility) or 'all' (all 9 on one screen)
  const [viewMode, setViewMode] = useState<'wizard' | 'all'>('wizard');
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Departure, 2: Route & Refuel, 3: Arrival

  // 1. DATE OF THE DELIVERY
  const todayStr = new Date().toISOString().slice(0, 10);
  const [deliveryDate, setDeliveryDate] = useState<string>(todayStr);

  // 2. DRIVER'S NAME (Assign any driver)
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    drivers[0]?.id || ''
  );

  // 3. TRUCK BEING USED (Choose any truck)
  const [selectedTruckId, setSelectedTruckId] = useState<string>(
    trucks[0]?.id || ''
  );
  const selectedTruck = trucks.find((t) => t.id === selectedTruckId) || trucks[0];

  // 4. MILLAGE BEFORE GOING
  const [startOdoKm, setStartOdoKm] = useState<number>(
    selectedTruck?.currentOdoKm || 150000
  );

  // 5. FUEL GAUGE BEFORE GOING
  const [startFuelGauge, setStartFuelGauge] = useState<number>(
    selectedTruck?.currentFuelGauge !== undefined ? selectedTruck.currentFuelGauge : 1.0
  );

  // 6. DESTINATION (The 7 Willowvale routes + along-the-way stop)
  const [primaryDestination, setPrimaryDestination] = useState<string>('Kadoma');
  const [hasTwoDestinations, setHasTwoDestinations] = useState<boolean>(false);
  const [secondaryDestination, setSecondaryDestination] = useState<string>('Chegutu');

  // 7. FUEL ADDED IF THERE IS?
  const [hasFuelAdded, setHasFuelAdded] = useState<boolean>(false);
  const [fuelAddedLitres, setFuelAddedLitres] = useState<number>(0);
  const [fuelAddedStation, setFuelAddedStation] = useState<string>('');

  // 8. THE FUEL GAUGE AFTER ARRIVAL
  const [endFuelGauge, setEndFuelGauge] = useState<number>(0.5);

  // 9. AND MILLAGE AFTER ARRIVAL
  const initialEstKm = calculateCorridorDistance('Kadoma');
  const [endOdoKm, setEndOdoKm] = useState<number>(
    (selectedTruck?.currentOdoKm || 150000) + initialEstKm
  );
  const [hasCustomEndOdo, setHasCustomEndOdo] = useState<boolean>(false);

  // Optional trip notes
  const [tripNotes, setTripNotes] = useState<string>('');

  // Auto-sync initial route if requested
  useEffect(() => {
    if (initialRouteName) {
      const matched = OFFICIAL_WILLOWVALE_ROUTES.find(
        (r) =>
          r.name.toLowerCase().includes(initialRouteName.toLowerCase()) ||
          r.destination.toLowerCase().includes(initialRouteName.toLowerCase())
      );
      if (matched) {
        setPrimaryDestination(matched.destination);
      }
    }
  }, [initialRouteName]);

  // When truck changes, update initial mileage before going & fuel gauge
  useEffect(() => {
    if (selectedTruck) {
      setStartOdoKm(selectedTruck.currentOdoKm);
      if (selectedTruck.currentFuelGauge !== undefined) {
        setStartFuelGauge(selectedTruck.currentFuelGauge);
      }
      if (!hasCustomEndOdo) {
        const estDist = calculateCorridorDistance(
          primaryDestination,
          hasTwoDestinations ? secondaryDestination : undefined
        );
        setEndOdoKm(selectedTruck.currentOdoKm + estDist);
      }
    }
  }, [selectedTruckId]);

  // Destination route info
  const primaryRouteInfo =
    OFFICIAL_WILLOWVALE_ROUTES.find((r) => r.destination === primaryDestination) ||
    OFFICIAL_WILLOWVALE_ROUTES[3]; // default Kadoma

  const isLocalRoute = primaryDestination === 'Willowvale Local / Harare Urban';
  const deliveryScope: DeliveryScope = isLocalRoute ? 'local' : 'outside';

  const isA5Primary = A5_CORRIDOR_DESTINATIONS.includes(primaryDestination);
  const alongTheWayOptions = A5_CORRIDOR_DESTINATIONS.filter(
    (d) => d !== primaryDestination
  );

  // Calculate official corridor distance
  const routeEstimatedKm = calculateCorridorDistance(
    primaryDestination,
    hasTwoDestinations ? secondaryDestination : undefined
  );

  // When destination or mileage before changes, update arrival mileage if user hasn't explicitly customized it
  useEffect(() => {
    if (!hasCustomEndOdo) {
      setEndOdoKm(Number(startOdoKm) + routeEstimatedKm);
    }
  }, [primaryDestination, secondaryDestination, hasTwoDestinations, startOdoKm]);

  // Actual Distance computed from millage after arrival - millage before going
  const actualTripDistanceKm = Math.max(0, Number(endOdoKm) - Number(startOdoKm));

  // Tank capacity & baseline
  const tankCapacity = selectedTruck?.tankCapacityL || 400;
  const baselineRate = selectedTruck?.baselineRateL100km || 29.0;

  // Fuel consumption calculation
  const gaugeDrop = Math.max(0, startFuelGauge - endFuelGauge);
  const fuelBurnedFromTank = gaugeDrop * tankCapacity;
  const totalFuelAdded = hasFuelAdded ? Math.max(0, Number(fuelAddedLitres) || 0) : 0;
  const totalFuelUsedL = Math.round((fuelBurnedFromTank + totalFuelAdded) * 10) / 10;

  // Expected fuel from distance & baseline
  const distanceForExpected = actualTripDistanceKm > 0 ? actualTripDistanceKm : routeEstimatedKm;
  const expectedFuelL = Math.round((distanceForExpected / 100) * baselineRate * 10) / 10;
  const fuelSavedL = Math.round((expectedFuelL - totalFuelUsedL) * 10) / 10;
  const fuelSavedPercent =
    expectedFuelL > 0
      ? Math.round(((expectedFuelL - totalFuelUsedL) / expectedFuelL) * 1000) / 10
      : 0;
  const actualRateL100km =
    actualTripDistanceKm > 0
      ? Math.round((totalFuelUsedL / (actualTripDistanceKm / 100)) * 10) / 10
      : baselineRate;

  const ecoScore = Math.max(
    40,
    Math.min(100, Math.round(80 + fuelSavedPercent * 0.8))
  );
  const costSaved =
    deliveryScope === 'outside'
      ? Math.round(
          Math.max(0, fuelSavedL) * settings.fuelPricePerLitre * 100
        ) / 100
      : 0;

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruck || !selectedDriverId) return;

    if (Number(endOdoKm) < Number(startOdoKm)) {
      alert('Millage after arrival cannot be lower than millage before going. Please check the odometer readings.');
      return;
    }

    const refuels: RefuelRecord[] = [];
    if (hasFuelAdded && totalFuelAdded > 0) {
      refuels.push({
        id: `ref-${Date.now()}`,
        litres: totalFuelAdded,
        cost: Math.round(totalFuelAdded * settings.fuelPricePerLitre * 100) / 100,
        stationName: fuelAddedStation.trim() || 'En-Route Fuel Station',
      });
    }

    let fullRouteName = primaryRouteInfo.name;
    if (hasTwoDestinations && secondaryDestination) {
      fullRouteName = `Willowvale – ${primaryDestination} & ${secondaryDestination} (Along the way)`;
    }

    const trip: DeliveryTrip = {
      id: `trip-${Date.now()}`,
      tripCode: `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
      truckId: selectedTruck.id,
      driverId: selectedDriverId,
      warehouseOrigin: WILLOWVALE_WAREHOUSE,
      routeName: fullRouteName,
      destination: primaryDestination,
      secondaryDestination: hasTwoDestinations ? secondaryDestination : undefined,
      isAlongTheWay: hasTwoDestinations,
      deliveryScope,
      routeType: primaryRouteInfo.routeType,
      cargoWeightCategory: primaryRouteInfo.typicalCargo,
      startDate: `${deliveryDate}T06:30:00.000Z`,
      startOdoKm: Number(startOdoKm),
      startFuelGauge,
      endDate: `${deliveryDate}T17:45:00.000Z`,
      endOdoKm: Number(endOdoKm),
      endFuelGauge,
      refuels,
      idleHours: isLocalRoute ? 1.5 : 0.5,
      notes: tripNotes.trim(),
      status: 'completed',
      distanceKm: actualTripDistanceKm > 0 ? actualTripDistanceKm : routeEstimatedKm,
      fuelUsedL: totalFuelUsedL,
      expectedFuelL,
      fuelSavedL,
      fuelSavedPercent,
      actualRateL100km,
      expectedRateL100km: baselineRate,
      ecoScore,
      costSaved,
    };

    onSaveTrip(trip);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 md:p-6 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-4">
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b-2 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/30">
              <Fuel size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Log Delivery Details
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Willowvale Central Depot
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                9 Required Logging Fields • Automated Fuel Consumption & Bonus Calculation
              </p>
            </div>
          </div>

          {/* Mode Switcher & Close Button */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-750 flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('wizard')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'wizard'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Step-by-Step
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All 9 Details
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Step Progress Tracker (Shown in Wizard Mode) */}
        {viewMode === 'wizard' && (
          <div className="bg-slate-950/90 px-4 sm:px-6 py-3 border-b border-slate-800">
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 border ${
                  currentStep === 1
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                  1
                </span>
                <span className="hidden sm:inline">Departure (1–5)</span>
                <span className="sm:hidden">Departure</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 border ${
                  currentStep === 2
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                  2
                </span>
                <span className="hidden sm:inline">Route & Refuel (6–7)</span>
                <span className="sm:hidden">Route</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 border ${
                  currentStep === 3
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                  3
                </span>
                <span className="hidden sm:inline">Arrival & Results (8–9)</span>
                <span className="sm:hidden">Arrival</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* ========================================================================= */}
          {/* SECTION 1: DEPARTURE DETAILS (Fields 1, 2, 3, 4, 5)                        */}
          {/* ========================================================================= */}
          {(viewMode === 'all' || currentStep === 1) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-sm border border-emerald-500/30">
                    Phase 1
                  </span>
                  <span>Departure Details from Willowvale Depot</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Fields 1 to 5
                </span>
              </div>

              {/* 1. DATE OF THE DELIVERY */}
              <div className="bg-slate-950 border-2 border-slate-750 hover:border-slate-600 rounded-3xl p-4 sm:p-5 transition shadow-lg">
                <label className="text-sm sm:text-base font-extrabold text-white mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <span>1. Date of the Delivery</span>
                  </span>
                  <span className="text-xs text-slate-400 font-normal">Delivery Date</span>
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="flex-1 bg-slate-900 border-2 border-slate-700 text-white font-mono text-base font-bold rounded-2xl px-4 py-3 focus:border-emerald-400 focus:bg-slate-850 focus:outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setDeliveryDate(todayStr)}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold border transition ${
                      deliveryDate === todayStr
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-750 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* 2. DRIVER'S NAME & 3. TRUCK BEING USED (Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2. DRIVER'S NAME */}
                <div className="bg-slate-950 border-2 border-slate-750 hover:border-slate-600 rounded-3xl p-4 sm:p-5 transition shadow-lg">
                  <label className="text-sm sm:text-base font-extrabold text-white mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                        2
                      </span>
                      <span>2. Driver's Name</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30">
                      Assign Any Driver
                    </span>
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full bg-slate-900 border-2 border-slate-700 text-white font-medium text-base rounded-2xl px-4 py-3 focus:border-emerald-400 focus:outline-none transition cursor-pointer"
                    required
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} • {d.licenseNumber} ({d.experienceYears} yrs experience)
                      </option>
                    ))}
                  </select>
                  {selectedDriver && (
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl">
                      <span>Assigned: <strong className="text-white">{selectedDriver.name}</strong></span>
                      <span className="text-emerald-400 font-mono font-bold">✓ Ready to Drive</span>
                    </div>
                  )}
                </div>

                {/* 3. TRUCK BEING USED */}
                <div className="bg-slate-950 border-2 border-slate-750 hover:border-slate-600 rounded-3xl p-4 sm:p-5 transition shadow-lg">
                  <label className="text-sm sm:text-base font-extrabold text-white mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                        3
                      </span>
                      <span>3. Truck Being Used</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30">
                      Choose Any Truck
                    </span>
                  </label>
                  <select
                    value={selectedTruckId}
                    onChange={(e) => setSelectedTruckId(e.target.value)}
                    className="w-full bg-slate-900 border-2 border-slate-700 text-white font-medium text-base rounded-2xl px-4 py-3 focus:border-emerald-400 focus:outline-none transition cursor-pointer"
                    required
                  >
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.plate} — {t.model} ({t.tankCapacityL}L tank, {t.baselineRateL100km} L/100km)
                      </option>
                    ))}
                  </select>
                  {selectedTruck && (
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl">
                      <span>Tank: <strong className="text-white">{selectedTruck.tankCapacityL} L</strong></span>
                      <span>Base Rate: <strong className="text-emerald-400 font-mono font-bold">{selectedTruck.baselineRateL100km} L/100km</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. MILLAGE BEFORE GOING */}
              <div className="bg-slate-950 border-2 border-slate-750 hover:border-slate-600 rounded-3xl p-4 sm:p-5 transition shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      4
                    </span>
                    <span>4. Millage Before Going (Departure Odometer)</span>
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    Departure Odo Reading (km)
                  </span>
                </div>

                <div className="relative mt-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={startOdoKm}
                    onChange={(e) => {
                      const newStart = Number(e.target.value);
                      setStartOdoKm(newStart);
                      if (!hasCustomEndOdo) {
                        setEndOdoKm(newStart + routeEstimatedKm);
                      }
                    }}
                    className="w-full bg-slate-900 border-2 border-slate-700 text-white font-mono font-black text-2xl sm:text-3xl rounded-2xl px-5 py-3.5 focus:border-emerald-400 focus:outline-none transition"
                    required
                  />
                  <span className="absolute right-5 top-4 text-base font-mono font-black text-slate-400">
                    KM
                  </span>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 mt-2.5">
                  <span className="text-xs text-slate-400">
                    Truck odometer reading when truck departs Willowvale warehouse gate
                  </span>
                  {selectedTruck && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartOdoKm(selectedTruck.currentOdoKm);
                        if (!hasCustomEndOdo) {
                          setEndOdoKm(selectedTruck.currentOdoKm + routeEstimatedKm);
                        }
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline"
                    >
                      Reset to truck recorded odo ({selectedTruck.currentOdoKm.toLocaleString()} km)
                    </button>
                  )}
                </div>
              </div>

              {/* 5. FUEL GAUGE BEFORE GOING (Ultra-Visible Visual Gauge) */}
              <VisualFuelMeter
                fieldNumber={5}
                label="5. Fuel Gauge Before Going (Departure Tank)"
                value={startFuelGauge}
                onChange={setStartFuelGauge}
                tankCapacityL={tankCapacity}
              />

              {/* Step 1 Next Button in Wizard Mode */}
              {viewMode === 'wizard' && (
                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <span>Proceed to 6. Destination & 7. Refuel</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: ROUTE & EN-ROUTE FUEL (Fields 6 and 7)                          */}
          {/* ========================================================================= */}
          {(viewMode === 'all' || currentStep === 2) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-sm border border-emerald-500/30">
                    Phase 2
                  </span>
                  <span>Route, Multi-Drop & Fuel Added</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Fields 6 to 7
                </span>
              </div>

              {/* 6. DESTINATION */}
              <div className="bg-slate-950 border-2 border-slate-750 hover:border-slate-600 rounded-3xl p-4 sm:p-5 transition shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      6
                    </span>
                    <span>6. Destination (From Willowvale Warehouse)</span>
                  </label>
                  <span className="text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Route Distance: {routeEstimatedKm} km
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Select from the 7 official routes dispatched from Willowvale Central Depot. Drivers may also make a 2nd stop if along the way.
                </p>

                {/* 7 Official Destination Cards with Big High-Contrast Touch Targets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {OFFICIAL_WILLOWVALE_ROUTES.map((route) => {
                    const isSelected = primaryDestination === route.destination;
                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => {
                          setPrimaryDestination(route.destination);
                          if (!route.compatibleAlongWayDestinations.length) {
                            setHasTwoDestinations(false);
                          } else if (!route.compatibleAlongWayDestinations.includes(secondaryDestination)) {
                            setSecondaryDestination(route.compatibleAlongWayDestinations[0]);
                          }
                        }}
                        className={`p-4 rounded-2xl text-left border-2 transition relative flex flex-col justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-400 text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-400/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-base font-black text-white">{route.destination}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{route.corridor}</div>
                          </div>
                          {route.scope === 'local' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                              Local (Excl)
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                              Outside (Ranked)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {route.roundtripKm} km roundtrip
                          </span>
                          <span className="text-slate-400">({route.oneWayKm} km 1-way)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Along the Way / Multi-Drop Selection for A5 Corridor */}
                {isA5Primary && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-750 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasTwoDestinations}
                        onChange={(e) => setHasTwoDestinations(e.target.checked)}
                        className="w-5 h-5 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-bold text-white">
                        Driver goes to two destinations if along the way (A5 Multi-Drop Delivery)
                      </span>
                    </label>

                    {hasTwoDestinations && (
                      <div className="pl-8 pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-xs text-slate-300 font-semibold">
                          Second Stop along A5 Corridor:
                        </span>
                        <select
                          value={secondaryDestination}
                          onChange={(e) => setSecondaryDestination(e.target.value)}
                          className="bg-slate-950 border-2 border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:border-emerald-400 cursor-pointer"
                        >
                          {alongTheWayOptions.map((dest) => (
                            <option key={dest} value={dest}>
                              {dest} (along highway corridor)
                            </option>
                          ))}
                        </select>
                        <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 ml-auto">
                          Combined Route Distance: {routeEstimatedKm} km
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isLocalRoute && (
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-300 bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-2xl">
                    <Info size={18} className="shrink-0 text-amber-400" />
                    <span>
                      <strong>Willowvale Local Policy:</strong> Intra-city and urban deliveries are tracked for log accuracy but strictly excluded from monthly fuel savings rankings so drivers are not penalized for urban congestion.
                    </span>
                  </div>
                )}
              </div>

              {/* 7. FUEL ADDED IF THERE IS? */}
              <div className="bg-slate-950 border-2 border-slate-750 hover:border-slate-600 rounded-3xl p-4 sm:p-5 transition shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      7
                    </span>
                    <span>7. Fuel Added If There Is?</span>
                  </label>
                  {hasFuelAdded && totalFuelAdded > 0 && (
                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-500/30">
                      +{totalFuelAdded} Liters Added En-Route
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  Did the driver add/pump diesel at a fuel station while on this delivery trip?
                </p>

                {/* Big Clear Toggle Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHasFuelAdded(false);
                      setFuelAddedLitres(0);
                    }}
                    className={`py-3.5 px-4 rounded-2xl border-2 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      !hasFuelAdded
                        ? 'bg-slate-800 text-white border-slate-600 shadow-md ring-2 ring-slate-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>✕ No Fuel Added (0 L)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasFuelAdded(true);
                      if (fuelAddedLitres === 0) setFuelAddedLitres(50);
                    }}
                    className={`py-3.5 px-4 rounded-2xl border-2 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      hasFuelAdded
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Fuel size={18} />
                    <span>⛽ Yes, Fuel Was Added En-Route</span>
                  </button>
                </div>

                {hasFuelAdded && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-750 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                          Liters of Fuel Added
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="800"
                            step="1"
                            value={fuelAddedLitres || ''}
                            onChange={(e) => setFuelAddedLitres(Math.max(0, Number(e.target.value)))}
                            placeholder="e.g. 50"
                            className="w-full bg-slate-950 border-2 border-slate-700 text-white font-mono font-black text-xl rounded-xl px-4 py-2.5 focus:border-emerald-400 focus:outline-none"
                            required
                          />
                          <span className="absolute right-4 top-3 text-sm font-bold text-slate-400 font-mono">
                            Liters
                          </span>
                        </div>

                        {/* Quick preset chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[20, 40, 50, 75, 100, 150].map((litersChip) => (
                            <button
                              key={litersChip}
                              type="button"
                              onClick={() => setFuelAddedLitres(litersChip)}
                              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition border ${
                                fuelAddedLitres === litersChip
                                  ? 'bg-emerald-600 text-white border-emerald-400'
                                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                              }`}
                            >
                              +{litersChip}L
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                          Fuel Station / Stop Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={fuelAddedStation}
                          onChange={(e) => setFuelAddedStation(e.target.value)}
                          placeholder="e.g. TotalEnergies Kadoma"
                          className="w-full bg-slate-950 border-2 border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:border-emerald-400 focus:outline-none"
                        />
                        <span className="text-xs text-slate-400 mt-2 block font-mono">
                          Estimated Cost: {settings.currencySymbol}
                          {(fuelAddedLitres * settings.fuelPricePerLitre).toFixed(2)} (@{settings.currencySymbol}{settings.fuelPricePerLitre}/L)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Nav Buttons */}
              {viewMode === 'wizard' && (
                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 transition"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Departure</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <span>Proceed to 8. Arrival Gauge & 9. Mileage</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: ARRIVAL READINGS & TRIP RESULTS (Fields 8 and 9)                */}
          {/* ========================================================================= */}
          {(viewMode === 'all' || currentStep === 3) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-sm border border-emerald-500/30">
                    Phase 3
                  </span>
                  <span>Arrival Readings & Fuel Calculations</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Fields 8 to 9
                </span>
              </div>

              {/* 8. THE FUEL GAUGE AFTER ARRIVAL (Ultra-Visible Visual Gauge) */}
              <VisualFuelMeter
                fieldNumber={8}
                label="8. The Fuel Gauge After Arrival"
                value={endFuelGauge}
                onChange={setEndFuelGauge}
                tankCapacityL={tankCapacity}
              />

              {/* 9. AND MILLAGE AFTER ARRIVAL */}
              <div className="bg-slate-950 border-2 border-slate-750 hover:border-slate-600 rounded-3xl p-4 sm:p-5 transition shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      9
                    </span>
                    <span>9. Millage After Arrival (Odometer on Return)</span>
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    Arrival Odo Reading (km)
                  </span>
                </div>

                <div className="relative mt-2">
                  <input
                    type="number"
                    min={startOdoKm}
                    step="1"
                    value={endOdoKm}
                    onChange={(e) => {
                      setHasCustomEndOdo(true);
                      setEndOdoKm(Number(e.target.value));
                    }}
                    className={`w-full bg-slate-900 border-2 text-white font-mono font-black text-2xl sm:text-3xl rounded-2xl px-5 py-3.5 focus:outline-none transition ${
                      Number(endOdoKm) < Number(startOdoKm)
                        ? 'border-rose-500 ring-2 ring-rose-500/50'
                        : 'border-slate-700 focus:border-emerald-400'
                    }`}
                    required
                  />
                  <span className="absolute right-5 top-4 text-base font-mono font-black text-slate-400">
                    KM
                  </span>
                </div>

                {/* Validation and Helper Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
                  <div className="text-xs sm:text-sm text-slate-300">
                    Distance Driven:{' '}
                    <strong className="text-emerald-400 font-mono text-base">
                      {actualTripDistanceKm} km
                    </strong>
                    {!hasCustomEndOdo && (
                      <span className="text-xs text-slate-400 ml-2">(Auto-set to {routeEstimatedKm} km route distance)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setHasCustomEndOdo(false);
                        setEndOdoKm(Number(startOdoKm) + routeEstimatedKm);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-750 text-xs font-mono font-bold"
                    >
                      Reset to Route (+{routeEstimatedKm} km)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasCustomEndOdo(true);
                        setEndOdoKm(Number(endOdoKm) + 20);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-750 text-xs font-mono font-bold"
                    >
                      +20 km
                    </button>
                  </div>
                </div>

                {Number(endOdoKm) < Number(startOdoKm) && (
                  <p className="mt-2 text-xs sm:text-sm text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle size={15} />
                    Millage after arrival ({Number(endOdoKm).toLocaleString()} km) cannot be less than millage before going ({Number(startOdoKm).toLocaleString()} km).
                  </p>
                )}
              </div>

              {/* LIVE TRIP CALCULATION SUMMARY CARD (Ultra High-Contrast) */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-emerald-400" size={20} />
                    <h4 className="text-base font-black text-white">
                      Automatic Trip Calculation
                    </h4>
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    Departure Odo: <strong className="text-white">{startOdoKm.toLocaleString()}</strong> ➔ Arrival Odo: <strong className="text-white">{endOdoKm.toLocaleString()} km</strong>
                  </div>
                </div>

                {/* 4 Metric Columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                      Total Distance
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white block mt-1">
                      {actualTripDistanceKm} <span className="text-sm text-slate-400">km</span>
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Odometer Difference
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                      Total Fuel Burned
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 block mt-1">
                      {totalFuelUsedL} <span className="text-sm text-slate-400">L</span>
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                      Rate: {actualRateL100km} L/100km
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                      Expected Benchmark
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-200 block mt-1">
                      {expectedFuelL} <span className="text-sm text-slate-400">L</span>
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                      Base {baselineRate} L/100km
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-center ${
                      fuelSavedL >= 0
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider block opacity-90">
                      {fuelSavedL >= 0 ? 'Net Fuel Saved' : 'Excess Burn'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono block mt-1">
                      {fuelSavedL >= 0 ? `+${fuelSavedL}` : fuelSavedL}{' '}
                      <span className="text-sm">L</span>
                    </span>
                    <span className="text-[10px] block font-bold mt-1">
                      {deliveryScope === 'outside'
                        ? fuelSavedL >= 0
                          ? `+${settings.currencySymbol}${costSaved.toFixed(2)} Driver Bonus`
                          : 'Over Baseline'
                        : 'Local (Excluded from bonus)'}
                    </span>
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <input
                    type="text"
                    value={tripNotes}
                    onChange={(e) => setTripNotes(e.target.value)}
                    placeholder="Optional trip notes (e.g. road conditions, heavy headwind, dock queue)..."
                    className="w-full bg-slate-950 border border-slate-750 text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Wizard Back button */}
              {viewMode === 'wizard' && (
                <div className="flex justify-start pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 transition"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Route & Refuel</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bottom Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border-2 border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/80 flex items-center gap-2.5 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle size={20} />
              <span>Save Delivery Trip Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
