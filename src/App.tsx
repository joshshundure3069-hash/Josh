import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/common/Header';
import { DriverLeaderboard } from './components/ranking/DriverLeaderboard';
import { DriverScorecardModal } from './components/ranking/DriverScorecardModal';
import { TripList } from './components/trips/TripList';
import { NewTripModal } from './components/trips/NewTripModal';
import { TripDetailModal } from './components/trips/TripDetailModal';
import { TripHistoryView } from './components/history/TripHistoryView';
import { RouteGuideModal } from './components/common/RouteGuideModal';
import { QuickGaugeCalculator } from './components/tools/QuickGaugeCalculator';
import { TruckFleetList } from './components/trucks/TruckFleetList';
import { ManualDataEntryModal } from './components/trucks/ManualDataEntryModal';
import { DriverList } from './components/drivers/DriverList';
import { SettingsModal } from './components/settings/SettingsModal';
import {
  loadCheckInLogs,
  loadDrivers,
  loadSettings,
  loadTrips,
  loadTrucks,
  saveCheckInLogs,
  saveDrivers,
  saveSettings,
  saveTrips,
  saveTrucks,
  recordAuditEvent,
} from './services/storage';
import { DeliveryTrip, Driver, FleetSettings, Truck, TruckCheckInLog } from './types/fleet';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('rankings');

  // Core state
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<DeliveryTrip[]>([]);
  const [checkInLogs, setCheckInLogs] = useState<TruckCheckInLog[]>([]);
  const [settings, setSettings] = useState<FleetSettings>(loadSettings());

  // Modals state
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [selectedRouteForNewTrip, setSelectedRouteForNewTrip] = useState<string | undefined>(undefined);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [manualEntryTruckId, setManualEntryTruckId] = useState<string | undefined>(undefined);
  const [selectedTripDetail, setSelectedTripDetail] = useState<DeliveryTrip | null>(null);
  const [isRouteGuideOpen, setIsRouteGuideOpen] = useState(false);
  const [selectedDriverScorecard, setSelectedDriverScorecard] = useState<{
    driverId: string;
    month: string;
  } | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load from offline storage
  useEffect(() => {
    setTrucks(loadTrucks());
    setDrivers(loadDrivers());
    setTrips(loadTrips());
    setCheckInLogs(loadCheckInLogs());
    setSettings(loadSettings());
  }, []);

  // Save new delivery trip
  const handleSaveTrip = (newTrip: DeliveryTrip) => {
    const updatedTrips = [newTrip, ...trips];
    setTrips(updatedTrips);
    saveTrips(updatedTrips);

    // Update truck odometer and current gauge level
    const updatedTrucks = trucks.map((t) => {
      if (t.id === newTrip.truckId) {
        return {
          ...t,
          currentOdoKm: Math.max(t.currentOdoKm, newTrip.endOdoKm),
          currentFuelGauge: newTrip.endFuelGauge,
          status: 'active' as const,
        };
      }
      return t;
    });
    setTrucks(updatedTrucks);
    saveTrucks(updatedTrucks);

    recordAuditEvent('trip_logged', `Delivery ${newTrip.tripCode} saved to ${newTrip.destination} (${newTrip.distanceKm} km, ${newTrip.fuelUsedL} L)`);
    setIsNewTripModalOpen(false);
    showToast(`Delivery ${newTrip.tripCode} saved! History and driver rank updated.`);
  };

  // Manual data entry: updates odometer, fuel gauge %, estimated fuel consumed, and status
  const handleOpenManualEntry = (truckId?: string) => {
    setManualEntryTruckId(truckId || trucks[0]?.id);
    setIsManualEntryModalOpen(true);
  };

  const handleManualDataEntry = (updatedTruck: Truck, checkInLog?: TruckCheckInLog) => {
    const updatedTrucks = trucks.map((t) => (t.id === updatedTruck.id ? updatedTruck : t));
    setTrucks(updatedTrucks);
    saveTrucks(updatedTrucks);

    if (checkInLog) {
      const existingLogs = loadCheckInLogs();
      const updatedLogs = [checkInLog, ...existingLogs];
      setCheckInLogs(updatedLogs);
      saveCheckInLogs(updatedLogs);
      recordAuditEvent('gauge_checkin', `Manual gauge check-in on ${updatedTruck.plate}: ${checkInLog.fuelConsumedL}L consumed, odo ${checkInLog.newOdoKm} km`);
    }

    setIsManualEntryModalOpen(false);
    const fuelMsg = checkInLog ? `${checkInLog.fuelConsumedL}L fuel consumed` : 'fuel gauge updated';
    showToast(`✓ Updated ${updatedTruck.plate}: ${fuelMsg}. Status set to ${updatedTruck.status.toUpperCase()}.`);
  };

  // Delete trip
  const handleDeleteTrip = (tripId: string) => {
    const updated = trips.filter((t) => t.id !== tripId);
    setTrips(updated);
    saveTrips(updated);
    recordAuditEvent('trip_deleted', `Deleted delivery log ${tripId}`);
    showToast('Delivery log deleted');
  };

  // Truck CRUD
  const handleSaveTruck = (truck: Truck) => {
    const exists = trucks.some((t) => t.id === truck.id);
    const updated = exists ? trucks.map((t) => (t.id === truck.id ? truck : t)) : [...trucks, truck];
    setTrucks(updated);
    saveTrucks(updated);
    showToast(`Truck ${truck.plate} saved`);
  };

  const handleDeleteTruck = (truckId: string) => {
    const updated = trucks.filter((t) => t.id !== truckId);
    setTrucks(updated);
    saveTrucks(updated);
    showToast('Truck removed from fleet');
  };

  // Driver CRUD
  const handleSaveDriver = (driver: Driver) => {
    const exists = drivers.some((d) => d.id === driver.id);
    const updated = exists ? drivers.map((d) => (d.id === driver.id ? driver : d)) : [...drivers, driver];
    setDrivers(updated);
    saveDrivers(updated);
    showToast(`Driver ${driver.name} saved`);
  };

  const handleDeleteDriver = (driverId: string) => {
    const updated = drivers.filter((d) => d.id !== driverId);
    setDrivers(updated);
    saveDrivers(updated);
    showToast('Driver removed');
  };

  // Settings update
  const handleSaveSettings = (newSettings: FleetSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast('Settings saved');
  };

  // Reload all data (e.g. after JSON backup restore or demo reset)
  const handleDataReset = () => {
    setTrucks(loadTrucks());
    setDrivers(loadDrivers());
    setTrips(loadTrips());
    setSettings(loadSettings());
    setCheckInLogs(loadCheckInLogs());
    showToast('Fleet data refreshed');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onNewTripClick={() => setIsNewTripModalOpen(true)}
        onManualEntryClick={() => handleOpenManualEntry()}
        onOpenRouteGuide={() => setIsRouteGuideOpen(true)}
        companyName={settings.companyName}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'rankings' && (
          <DriverLeaderboard
            trips={trips}
            drivers={drivers}
            trucks={trucks}
            settings={settings}
            onSelectDriver={(driverId, month) =>
              setSelectedDriverScorecard({ driverId, month })
            }
            onNewTripClick={() => setIsNewTripModalOpen(true)}
            onOpenHistory={() => setCurrentTab('history')}
            onOpenGuide={() => setIsRouteGuideOpen(true)}
          />
        )}

        {currentTab === 'trips' && (
          <TripList
            trips={trips}
            trucks={trucks}
            drivers={drivers}
            settings={settings}
            onSelectTrip={(trip) => setSelectedTripDetail(trip)}
            onNewTripClick={(routeName?: string) => {
              setSelectedRouteForNewTrip(routeName);
              setIsNewTripModalOpen(true);
            }}
          />
        )}

        {currentTab === 'history' && (
          <TripHistoryView
            trips={trips}
            trucks={trucks}
            drivers={drivers}
            settings={settings}
            checkInLogs={checkInLogs}
            onSelectTrip={(trip) => setSelectedTripDetail(trip)}
            onNewTripClick={() => setIsNewTripModalOpen(true)}
            onDeleteTrip={handleDeleteTrip}
            onDataRestored={handleDataReset}
          />
        )}

        {currentTab === 'gauge-calc' && (
          <QuickGaugeCalculator trucks={trucks} settings={settings} />
        )}

        {currentTab === 'trucks' && (
          <TruckFleetList
            trucks={trucks}
            drivers={drivers}
            settings={settings}
            onSaveTruck={handleSaveTruck}
            onDeleteTruck={handleDeleteTruck}
            onManualEntryClick={(truckId) => handleOpenManualEntry(truckId)}
          />
        )}

        {currentTab === 'drivers' && (
          <DriverList
            drivers={drivers}
            trucks={trucks}
            settings={settings}
            onSaveDriver={handleSaveDriver}
            onDeleteDriver={handleDeleteDriver}
            onSelectDriverScorecard={(driverId) =>
              setSelectedDriverScorecard({ driverId, month: '2026-10' })
            }
          />
        )}

        {currentTab === 'settings' && (
          <SettingsModal
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onDataReset={handleDataReset}
            trucks={trucks}
            drivers={drivers}
            trips={trips}
          />
        )}
      </main>

      {/* Modals */}
      {isManualEntryModalOpen && (
        <ManualDataEntryModal
          trucks={trucks}
          initialTruckId={manualEntryTruckId}
          settings={settings}
          onClose={() => setIsManualEntryModalOpen(false)}
          onUpdateTruck={handleManualDataEntry}
        />
      )}

      {isNewTripModalOpen && (
        <NewTripModal
          trucks={trucks}
          drivers={drivers}
          settings={settings}
          initialRouteName={selectedRouteForNewTrip}
          onClose={() => {
            setIsNewTripModalOpen(false);
            setSelectedRouteForNewTrip(undefined);
          }}
          onSaveTrip={handleSaveTrip}
        />
      )}

      {selectedTripDetail && (
        <TripDetailModal
          trip={selectedTripDetail}
          trucks={trucks}
          drivers={drivers}
          settings={settings}
          onClose={() => setSelectedTripDetail(null)}
          onDeleteTrip={handleDeleteTrip}
        />
      )}

      {selectedDriverScorecard && (
        <DriverScorecardModal
          driverId={selectedDriverScorecard.driverId}
          month={selectedDriverScorecard.month}
          drivers={drivers}
          trips={trips}
          trucks={trucks}
          settings={settings}
          onClose={() => setSelectedDriverScorecard(null)}
          onSelectTrip={(t) => {
            setSelectedDriverScorecard(null);
            setSelectedTripDetail(t);
          }}
        />
      )}

      {/* Willowvale Route Guide & Rules Modal */}
      <RouteGuideModal
        isOpen={isRouteGuideOpen}
        onClose={() => setIsRouteGuideOpen(false)}
        onSelectRoute={(destination) => {
          setSelectedRouteForNewTrip(destination);
          setIsNewTripModalOpen(true);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 border border-emerald-500/50 text-white font-semibold text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
