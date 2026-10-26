import React from 'react';
import {
  X,
  Compass,
  MapPin,
  Route,
  AlertTriangle,
  Award,
  Fuel,
  Gauge,
  Calendar,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { OFFICIAL_WILLOWVALE_ROUTES, WILLOWVALE_WAREHOUSE } from '../../services/storage';

interface RouteGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (destination: string) => void;
}

export const RouteGuideModal: React.FC<RouteGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/20">
              <Compass size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Willowvale Depot Fleet Guide & Rules
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  7 Routes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Warehouse dispatch rules, along-the-way drops, and driver fuel bonus qualification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Key Rule 1: Single Central Warehouse */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                Single Origin Depot: {WILLOWVALE_WAREHOUSE}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                All deliveries in the fleet depart from and return to the Willowvale Central Depot.
                Any driver can be assigned to any truck in the fleet based on dispatch needs.
              </p>
            </div>
          </div>

          {/* Key Rule 2: The 7 Routes Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Route size={16} className="text-teal-400" />
                The 7 Official Corridors from Willowvale
              </h3>
              <span className="text-xs text-slate-400">Click any route to quick-log</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OFFICIAL_WILLOWVALE_ROUTES.map((rt) => {
                const isLocal = rt.scope === 'local';
                return (
                  <div
                    key={rt.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      isLocal
                        ? 'bg-slate-950 border-amber-500/30 hover:border-amber-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{rt.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isLocal
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isLocal ? 'Local (Bonus Exempt)' : 'Highway (Ranked)'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span>{rt.corridor}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400 font-semibold">{rt.roundtripKm} km roundtrip</span>
                        </div>
                      </div>

                      {onSelectRoute && (
                        <button
                          onClick={() => {
                            onSelectRoute(rt.destination);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {rt.description}
                    </p>

                    {rt.compatibleAlongWayDestinations.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-teal-400 font-semibold">Along the way drops:</span>
                        {rt.compatibleAlongWayDestinations.map((along) => (
                          <span
                            key={along}
                            className="px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 text-[10px] font-bold border border-teal-500/30"
                          >
                            {along}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Rule 3: Multi-destination along the way */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-sm sm:text-base">
              <Layers size={18} />
              <h4>Multi-Destination "Along The Way" Deliveries (A5 Highway Corridor)</h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When a driver travels west on the A5 corridor, they can stop at up to <strong>two destinations along the way</strong> without returning to the depot in between:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-center">
                <span className="text-emerald-400 font-bold block">1st Stop</span>
                <span className="text-white">Chegutu</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">105 km</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-center">
                <span className="text-emerald-400 font-bold block">2nd Stop</span>
                <span className="text-white">Kadoma</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">142 km</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-center">
                <span className="text-emerald-400 font-bold block">3rd Stop</span>
                <span className="text-white">Kwekwe</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">213 km</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-center">
                <span className="text-emerald-400 font-bold block">4th Stop</span>
                <span className="text-white">Gweru</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">275 km</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic">
              Example: If a driver delivers to Chegutu and continues along the way to Kadoma, select "Chegutu" as 1st destination and "Kadoma" as the along-the-way stop. The app automatically calculates the corridor benchmark and credits the driver's bonus!
            </p>
          </div>

          {/* Key Rule 4: Willowvale Local Exemption */}
          <div className="bg-amber-950/20 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-amber-300 text-sm sm:text-base">
                Why Willowvale Local Runs Are Excluded from Monthly Bonuses
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Local Harare deliveries involve high-traffic stop-and-go congestion, heavy warehouse dock idling, and short loops.
                Including local runs in the fuel rankings would unfairly penalize city distribution drivers.
                Therefore, <strong>local deliveries are tracked in delivery logs and history for full accountability, but excluded from driver incentive bonuses and monthly rankings</strong>.
              </p>
            </div>
          </div>

          {/* Key Rule 5: The 9 Delivery Details Checklist */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 sm:p-5">
            <h4 className="font-bold text-white text-sm sm:text-base mb-2 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              The 9 Required Logging Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">1. Date of Delivery</strong>
                Departure date & time
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">2. Driver's Name</strong>
                Assigned driver
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">3. Truck Being Used</strong>
                Vehicle plate & tank size
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">4. Millage Before Going</strong>
                Odometer at Willowvale depot
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">5. Fuel Gauge Before Going</strong>
                Starting fuel dial reading
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">6. Destination</strong>
                Corridor & along-the-way stop
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">7. Fuel Added If There Is?</strong>
                En-route refuel liters
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">8. Fuel Gauge After Arrival</strong>
                Ending fuel dial reading
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <strong className="text-emerald-400 block">9. Millage After Arrival</strong>
                Odometer upon return
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
