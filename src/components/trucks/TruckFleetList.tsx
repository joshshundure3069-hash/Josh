import React, { useState } from 'react';
import {
  Truck as TruckIcon,
  Plus,
  Edit2,
  Trash2,
  Fuel,
  Gauge,
  User,
  CheckCircle,
  X,
} from 'lucide-react';
import { Driver, FleetSettings, Truck } from '../../types/fleet';
import { getGaugeLabel, getLitersFromGauge } from '../../services/fuelCalculator';

interface TruckFleetListProps {
  trucks: Truck[];
  drivers: Driver[];
  settings: FleetSettings;
  onSaveTruck: (truck: Truck) => void;
  onDeleteTruck: (truckId: string) => void;
  onManualEntryClick: (truckId: string) => void;
}

export const TruckFleetList: React.FC<TruckFleetListProps> = ({
  trucks,
  drivers,
  settings,
  onSaveTruck,
  onDeleteTruck,
  onManualEntryClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);

  // Form states
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [tankCapacityL, setTankCapacityL] = useState(400);
  const [baselineRateL100km, setBaselineRateL100km] = useState(29.0);
  const [currentOdoKm, setCurrentOdoKm] = useState(150000);
  const [currentFuelGauge, setCurrentFuelGauge] = useState(0.75);
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingTruck(null);
    setPlate('');
    setModel('');
    setTankCapacityL(400);
    setBaselineRateL100km(29.0);
    setCurrentOdoKm(150000);
    setCurrentFuelGauge(0.75);
    setAssignedDriverId('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (truck: Truck) => {
    setEditingTruck(truck);
    setPlate(truck.plate);
    setModel(truck.model);
    setTankCapacityL(truck.tankCapacityL);
    setBaselineRateL100km(truck.baselineRateL100km);
    setCurrentOdoKm(truck.currentOdoKm);
    setCurrentFuelGauge(truck.currentFuelGauge);
    setAssignedDriverId(truck.assignedDriverId || '');
    setNotes(truck.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() || !model.trim()) return;

    const truckData: Truck = {
      id: editingTruck ? editingTruck.id : `trk-${Date.now()}`,
      plate: plate.trim().toUpperCase(),
      model: model.trim(),
      tankCapacityL: Number(tankCapacityL) || 400,
      baselineRateL100km: Number(baselineRateL100km) || 29.0,
      currentOdoKm: Number(currentOdoKm) || 0,
      currentFuelGauge: Number(currentFuelGauge) || 0.75,
      fuelType: 'diesel',
      status: editingTruck ? editingTruck.status : 'active',
      assignedDriverId: assignedDriverId || undefined,
      notes: notes.trim(),
    };

    onSaveTruck(truckData);
    setIsModalOpen(false);
  };

  const driverMap = new Map(drivers.map((d) => [d.id, d]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TruckIcon className="text-emerald-400" size={24} />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Truck Fleet Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage tank capacities, baseline consumption rates, and real-time dashboard fuel levels
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onManualEntryClick(trucks[0]?.id || '')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs sm:text-sm font-semibold transition"
          >
            <Gauge size={16} />
            <span>Manual Data Entry</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-950 transition"
          >
            <Plus size={16} />
            <span>Add Truck</span>
          </button>
        </div>
      </div>

      {/* Grid of Trucks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map((truck) => {
          const assignedDriver = truck.assignedDriverId ? driverMap.get(truck.assignedDriverId) : null;
          const currentLitres = getLitersFromGauge(truck.currentFuelGauge, truck.tankCapacityL);
          const gaugeLabel = getGaugeLabel(truck.currentFuelGauge);

          return (
            <div
              key={truck.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                {/* Truck Plate & Actions */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base text-white tracking-wide bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                      {truck.plate}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        truck.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : truck.status === 'in-transit'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {truck.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(truck)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Edit Truck Specs"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove truck ${truck.plate}?`)) {
                          onDeleteTruck(truck.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete Truck"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Model & Assigned Driver */}
                <h3 className="mt-3 text-sm font-bold text-white">{truck.model}</h3>

                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <label className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <User size={13} className="text-emerald-400" />
                    <span>Assign Driver:</span>
                  </label>
                  <select
                    value={truck.assignedDriverId || ''}
                    onChange={(e) => {
                      const newDriverId = e.target.value;
                      onSaveTruck({
                        ...truck,
                        assignedDriverId: newDriverId || undefined,
                      });
                    }}
                    className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-1 text-xs text-white font-medium focus:ring-1 focus:ring-emerald-500 max-w-[170px] truncate"
                    title="Assign any driver to this truck"
                  >
                    <option value="">(Unassigned)</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gauge & Tank Level Card */}
                <div className="mt-4 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Fuel size={13} className="text-emerald-400" />
                      Dashboard Fuel Gauge
                    </span>
                    <span className="font-mono font-bold text-white">
                      {gaugeLabel} ({Math.round(truck.currentFuelGauge * 100)}%)
                    </span>
                  </div>

                  {/* Visual Gauge Level Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.round(truck.currentFuelGauge * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                    <span>{currentLitres} L in tank</span>
                    <span>{truck.tankCapacityL} L capacity</span>
                  </div>
                </div>

                {/* Specs */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-sans">Baseline Rate</span>
                    <span className="text-white font-bold">{truck.baselineRateL100km} L/100km</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-sans">Odometer</span>
                    <span className="text-white font-bold">{truck.currentOdoKm.toLocaleString()} km</span>
                  </div>
                </div>

                {/* Last Check-in Telemetry (if available) */}
                {truck.lastCheckIn && (
                  <div className="mt-3 bg-teal-950/20 border border-teal-500/20 rounded-xl p-2.5 text-[11px]">
                    <div className="flex items-center justify-between text-teal-300 font-semibold mb-0.5">
                      <span>Recent Check-In</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {truck.lastCheckIn.timestamp ? new Date(truck.lastCheckIn.timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-300 font-mono text-[10px]">
                      Burned {truck.lastCheckIn.fuelConsumedL}L over {truck.lastCheckIn.distanceKm}km ({truck.lastCheckIn.rateL100km} L/100km)
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button: Manual Check-In */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onManualEntryClick(truck.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-teal-200 border border-teal-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Gauge size={14} />
                  <span>Update Gauge & Status</span>
                </button>
              </div>

              {truck.notes && (
                <p className="mt-2 text-[11px] text-slate-500 italic line-clamp-1 border-t border-slate-800/40 pt-1.5">
                  {truck.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Truck Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <TruckIcon className="text-emerald-400" size={20} />
                {editingTruck ? 'Edit Truck Specs' : 'Register New Truck'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    License Plate / Unit ID
                  </label>
                  <input
                    type="text"
                    required
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="e.g. KAA-492B"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Truck Model & Year
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Freightliner Cascadia"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tank Capacity (Liters)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="1500"
                    required
                    value={tankCapacityL}
                    onChange={(e) => setTankCapacityL(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Baseline Rate (L/100km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="100"
                    required
                    value={baselineRateL100km}
                    onChange={(e) => setBaselineRateL100km(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Odometer (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentOdoKm}
                    onChange={(e) => setCurrentOdoKm(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Fuel Gauge
                  </label>
                  <select
                    value={currentFuelGauge}
                    onChange={(e) => setCurrentFuelGauge(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2"
                  >
                    <option value="1.0">Full (100%)</option>
                    <option value="0.875">7/8 Tank (87.5%)</option>
                    <option value="0.75">3/4 Tank (75%)</option>
                    <option value="0.625">5/8 Tank (62.5%)</option>
                    <option value="0.5">1/2 Tank (50%)</option>
                    <option value="0.375">3/8 Tank (37.5%)</option>
                    <option value="0.25">1/4 Tank (25%)</option>
                    <option value="0.125">1/8 Tank (12.5%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Assigned Driver
                </label>
                <select
                  value={assignedDriverId}
                  onChange={(e) => setAssignedDriverId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2"
                >
                  <option value="">No driver assigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.licenseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Refrigerated trailer rig, low resistance tires"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  {editingTruck ? 'Save Changes' : 'Add Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
