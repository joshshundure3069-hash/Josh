import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  Truck as TruckIcon,
  Trophy,
  X,
  CheckCircle,
} from 'lucide-react';
import { Driver, FleetSettings, Truck } from '../../types/fleet';
import { DriverAvatar } from '../common/DriverAvatar';

interface DriverListProps {
  drivers: Driver[];
  trucks: Truck[];
  settings: FleetSettings;
  onSaveDriver: (driver: Driver) => void;
  onDeleteDriver: (driverId: string) => void;
  onSelectDriverScorecard: (driverId: string) => void;
}

export const DriverList: React.FC<DriverListProps> = ({
  drivers,
  trucks,
  settings,
  onSaveDriver,
  onDeleteDriver,
  onSelectDriverScorecard,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [assignedTruckId, setAssignedTruckId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const openAddModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setLicenseNumber('');
    setExperienceYears(5);
    setAssignedTruckId('');
    setAvatarUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone);
    setLicenseNumber(driver.licenseNumber);
    setExperienceYears(driver.experienceYears);
    setAssignedTruckId(driver.assignedTruckId || '');
    setAvatarUrl(driver.avatarUrl || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const driverData: Driver = {
      id: editingDriver ? editingDriver.id : `drv-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      licenseNumber: licenseNumber.trim() || `CDL-${Math.floor(10000 + Math.random() * 90000)}`,
      experienceYears: Number(experienceYears) || 1,
      hireDate: editingDriver ? editingDriver.hireDate : new Date().toISOString().slice(0, 10),
      status: editingDriver ? editingDriver.status : 'active',
      assignedTruckId: assignedTruckId || undefined,
      avatarUrl:
        avatarUrl.trim() ||
        `https://images.unsplash.com/photo-${1534528741775 + (drivers.length * 1000)}?w=150&auto=format&fit=crop&q=80`,
    };

    onSaveDriver(driverData);
    setIsModalOpen(false);
  };

  const truckMap = new Map(trucks.map((t) => [t.id, t]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-emerald-400" size={24} />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Delivery Drivers Roster
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Profiles, assigned trucks, and eco-driving reward performance
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-950 transition self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => {
          const assignedTruck = driver.assignedTruckId ? truckMap.get(driver.assignedTruckId) : null;

          return (
            <div
              key={driver.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <DriverAvatar
                      name={driver.name}
                      avatarUrl={driver.avatarUrl}
                      size="lg"
                      className="ring-2 ring-emerald-500/30"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base">{driver.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{driver.licenseNumber}</p>
                      <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                        {driver.experienceYears} Years Commercial
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(driver)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Edit Driver"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove driver ${driver.name}?`)) {
                          onDeleteDriver(driver.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete Driver"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <TruckIcon size={14} className="text-emerald-400" />
                      Assigned Truck:
                    </span>
                    <select
                      value={driver.assignedTruckId || ''}
                      onChange={(e) => {
                        const newTruckId = e.target.value;
                        onSaveDriver({
                          ...driver,
                          assignedTruckId: newTruckId || undefined,
                        });
                      }}
                      className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-1 text-xs text-white font-medium focus:ring-1 focus:ring-emerald-500 max-w-[170px] truncate"
                      title="Assign any truck to this driver"
                    >
                      <option value="">(Pool / Any Truck)</option>
                      {trucks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.plate} • {t.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-500" />
                      Contact:
                    </span>
                    <span className="text-slate-300 font-mono">{driver.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: View Scorecard */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onSelectDriverScorecard(driver.id)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700/80"
                >
                  <Trophy size={14} className="text-amber-400" />
                  <span>View Monthly Scorecard</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="text-emerald-400" size={20} />
                {editingDriver ? 'Edit Driver' : 'Register New Driver'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CDL / License #
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="CDL-A-90123"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Commercial Experience (Yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Truck
                  </label>
                  <select
                    value={assignedTruckId}
                    onChange={(e) => setAssignedTruckId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2"
                  >
                    <option value="">No truck</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.plate} ({t.model.slice(0, 14)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Avatar Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
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
                  {editingDriver ? 'Save Changes' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
