import React, { useState, useRef } from 'react';
import {
  Settings,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  DollarSign,
  Award,
  FileSpreadsheet,
  Truck as TruckIcon,
  Users,
  ClipboardList,
  Layers,
  FileDown,
  Table,
} from 'lucide-react';
import { DeliveryTrip, Driver, FleetSettings, Truck } from '../../types/fleet';
import {
  exportBackupJSON,
  importBackupJSON,
  resetAllData,
  exportCompleteFleetToCSV,
  exportTrucksToCSV,
  exportDriversToCSV,
  exportTripsToCSV,
  downloadCSV,
  loadTrucks,
  loadDrivers,
  loadTrips,
} from '../../services/storage';

interface SettingsModalProps {
  settings: FleetSettings;
  onSaveSettings: (settings: FleetSettings) => void;
  onDataReset: () => void;
  trucks?: Truck[];
  drivers?: Driver[];
  trips?: DeliveryTrip[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onDataReset,
  trucks: propTrucks,
  drivers: propDrivers,
  trips: propTrips,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState(settings.fuelPricePerLitre);
  const [ecoBonusPerLitreSaved, setEcoBonusPerLitreSaved] = useState(settings.ecoBonusPerLitreSaved);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [csvExportNotice, setCsvExportNotice] = useState<string | null>(null);

  // Resolve current active datasets (prefer reactive props, fallback to storage)
  const activeTrucks = propTrucks && propTrucks.length > 0 ? propTrucks : loadTrucks();
  const activeDrivers = propDrivers && propDrivers.length > 0 ? propDrivers : loadDrivers();
  const activeTrips = propTrips && propTrips.length > 0 ? propTrips : loadTrips();

  // Metrics summary for display
  const totalTripsKm = activeTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
  const totalFuelSavedL = activeTrips.reduce((acc, t) => acc + (t.fuelSavedL || 0), 0);

  const showCsvNotice = (msg: string) => {
    setCsvExportNotice(msg);
    setTimeout(() => setCsvExportNotice(null), 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: FleetSettings = {
      ...settings,
      companyName: companyName.trim() || 'Apex Fleet Logistics',
      currencySymbol: currencySymbol.trim() || '$',
      fuelPricePerLitre: Number(fuelPricePerLitre) || 1.65,
      ecoBonusPerLitreSaved: Number(ecoBonusPerLitreSaved) || 0.4,
    };
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  /**
   * Export function that allows exporting fleet, driver, and trip data
   * to CSV format for offline backups or external reporting.
   */
  const handleExportCSV = (scope: 'all' | 'trucks' | 'drivers' | 'trips') => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const sanitizedOrg = (settings.companyName || 'fleet')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');

    try {
      if (scope === 'all') {
        const csvContent = exportCompleteFleetToCSV(activeTrucks, activeDrivers, activeTrips, settings);
        const filename = `${sanitizedOrg}_master_fleet_backup_${dateStr}.csv`;
        downloadCSV(csvContent, filename);
        showCsvNotice(`Master fleet archive exported (${activeTrucks.length} trucks, ${activeDrivers.length} drivers, ${activeTrips.length} trips)`);
      } else if (scope === 'trips') {
        const csvContent = exportTripsToCSV(activeTrips, activeTrucks, activeDrivers, settings);
        const filename = `${sanitizedOrg}_trip_logs_${dateStr}.csv`;
        downloadCSV(csvContent, filename);
        showCsvNotice(`Exported ${activeTrips.length} delivery trip records to CSV`);
      } else if (scope === 'trucks') {
        const csvContent = exportTrucksToCSV(activeTrucks, activeDrivers);
        const filename = `${sanitizedOrg}_trucks_fleet_${dateStr}.csv`;
        downloadCSV(csvContent, filename);
        showCsvNotice(`Exported ${activeTrucks.length} fleet vehicles to CSV`);
      } else if (scope === 'drivers') {
        const csvContent = exportDriversToCSV(activeDrivers, activeTrucks);
        const filename = `${sanitizedOrg}_drivers_roster_${dateStr}.csv`;
        downloadCSV(csvContent, filename);
        showCsvNotice(`Exported ${activeDrivers.length} driver profiles to CSV`);
      }
    } catch (err) {
      console.error('CSV export failed', err);
      alert('Unable to generate CSV export. Please check device storage permissions.');
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecotrack_fleet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJSON(content);
        if (success) {
          alert('Fleet backup successfully restored!');
          onDataReset();
        } else {
          alert('Failed to parse the backup file. Please check file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (
      confirm(
        'Reset all fleet data to factory demonstration dataset (5 trucks, 6 drivers, and October/September delivery history)?'
      )
    ) {
      resetAllData();
      onDataReset();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="text-emerald-400" size={24} />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Fleet Configuration & Data Management
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Tune fuel rates, driver eco-bonuses, and export fleet records to CSV for offline backup and reporting
        </p>
      </div>

      {/* CSV Export Notice Banner */}
      {csvExportNotice && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl flex items-center justify-between text-white text-xs sm:text-sm shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="text-emerald-400 shrink-0" size={18} />
            <span className="font-medium">{csvExportNotice}</span>
          </div>
          <span className="text-[11px] text-emerald-300/80 font-mono">CSV Ready</span>
        </div>
      )}

      {/* Primary CSV Export Card for Offline Backup & External Reporting */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-400" size={18} />
              CSV Data Export & External Reporting
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Export current fleet vehicles, driver records, and trip telemetry to formatted CSV spreadsheets for offline records, Excel analysis, or audit reporting.
            </p>
          </div>
          {/* Quick dataset badge */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto font-mono">
            <span className="text-emerald-400 font-semibold">{activeTrucks.length} Trucks</span>
            <span>•</span>
            <span className="text-teal-400 font-semibold">{activeDrivers.length} Drivers</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{activeTrips.length} Trips</span>
          </div>
        </div>

        {/* Master All-in-One CSV Export Button */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-teal-950/30 border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Recommended
              </span>
              <h3 className="text-sm font-bold text-white">
                Export Complete Fleet Master Archive (.CSV)
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Consolidated spreadsheet with executive overview metadata, all fleet truck specifications, driver roster credentials, and every recorded delivery trip with gauge readings, fuel savings, and eco scores.
            </p>
            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
              <span>✓ UTF-8 BOM encoding for Excel & Sheets</span>
              <span>✓ Total logged: {Math.round(totalTripsKm).toLocaleString()} km</span>
              <span>✓ Total fuel saved: {Math.round(totalFuelSavedL)} L</span>
            </div>
          </div>

          <button
            onClick={() => handleExportCSV('all')}
            className="w-full md:w-auto shrink-0 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Export Master CSV</span>
          </button>
        </div>

        {/* Modular / Granular CSV Exports */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Table size={14} className="text-slate-400" />
            Individual CSV Tables for Specific Reporting
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Delivery Trips CSV */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <ClipboardList size={16} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-amber-400">
                    {activeTrips.length} Trips
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                  Delivery Trips & Telemetry
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Trip codes, routes, start/end odometers, dashboard gauge %, fuel used, baseline variances & eco-scores.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV('trips')}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download size={13} className="text-amber-400" />
                <span>Export Trips (.CSV)</span>
              </button>
            </div>

            {/* Fleet Trucks CSV */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <TruckIcon size={16} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400">
                    {activeTrucks.length} Trucks
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                  Fleet Trucks & Specifications
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  License plates, models, tank capacities, baseline L/100km, current odometers, gauge levels & status.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV('trucks')}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download size={13} className="text-emerald-400" />
                <span>Export Trucks (.CSV)</span>
              </button>
            </div>

            {/* Driver Roster CSV */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                    <Users size={16} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-teal-400">
                    {activeDrivers.length} Drivers
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition">
                  Driver Roster & Credentials
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Driver names, CDL license numbers, phone contacts, years of experience, hire dates & assigned rigs.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV('drivers')}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download size={13} className="text-teal-400" />
                <span>Export Drivers (.CSV)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fleet Economics Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={16} />
            Fleet Economics & Bonus Rates
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fuel Price Per Liter
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={fuelPricePerLitre}
                  onChange={(e) => setFuelPricePerLitre(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Award size={13} className="text-amber-400" />
                Driver Eco-Bonus per Liter Saved
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ecoBonusPerLitreSaved}
                onChange={(e) => setEcoBonusPerLitreSaved(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Incentive payout automatically calculated for drivers saving fuel each month.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle size={14} /> Settings Saved!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Offline Backup & Data Persistence (JSON & Demo Reset) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <HardDrive className="text-teal-400" size={16} />
            Offline JSON Archive & System Reset
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            All fleet records and gauge data are stored locally in IndexedDB / local device storage. You can save raw JSON snapshots to migrate to another device or restore demo values.
          </p>

          <div className="space-y-3 pt-2">
            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Download size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition block">
                    Download Raw Fleet JSON (.JSON)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Complete machine-readable JSON backup for device transfer
                  </span>
                </div>
              </div>
            </button>

            {/* Import JSON */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-teal-300 transition block">
                      Restore Backup from JSON File
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Import a previously exported fleet JSON archive
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Reset to Demo */}
            <button
              onClick={handleResetDemo}
              className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/50 flex items-center justify-between text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-rose-300 transition block">
                    Reset to Factory Demo Dataset
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Restores 5 commercial trucks, 6 drivers, and October logs
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
