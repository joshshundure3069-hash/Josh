import {
  DeliveryTrip,
  Driver,
  FleetSettings,
  PresetRoute,
  RouteEfficiencySummary,
  RouteType,
  Truck,
  TruckCheckInLog,
} from '../types/fleet';
import { calculateTripMetrics } from './fuelCalculator';

const STORAGE_KEYS = {
  TRUCKS: 'ecotrack_trucks_v1',
  DRIVERS: 'ecotrack_drivers_v1',
  TRIPS: 'ecotrack_trips_v1',
  SETTINGS: 'ecotrack_settings_v1',
  CHECKIN_LOGS: 'ecotrack_checkins_v1',
  SNAPSHOTS: 'ecotrack_snapshots_v1',
  AUDIT_LOGS: 'ecotrack_audit_logs_v1',
};

export const WILLOWVALE_WAREHOUSE = 'Willowvale Central Depot, Harare';

export interface WillowvaleRouteInfo {
  id: string;
  name: string;
  destination: string;
  corridor: string;
  scope: 'outside' | 'local';
  routeType: RouteType;
  roundtripKm: number;
  oneWayKm: number;
  typicalCargo: 'light' | 'medium' | 'heavy';
  description: string;
  compatibleAlongWayDestinations: string[];
}

export const OFFICIAL_WILLOWVALE_ROUTES: WillowvaleRouteInfo[] = [
  {
    id: 'rt-bindura',
    name: 'Willowvale – Bindura Route',
    destination: 'Bindura',
    corridor: 'A11 North-Eastern Highway',
    scope: 'outside',
    routeType: 'highway',
    roundtripKm: 176,
    oneWayKm: 88,
    typicalCargo: 'medium',
    description: 'Outside highway corridor from Willowvale Depot to Bindura mining and farming hub. Ranked for monthly fuel bonus.',
    compatibleAlongWayDestinations: [],
  },
  {
    id: 'rt-chinhoyi',
    name: 'Willowvale – Chinhoyi Route',
    destination: 'Chinhoyi',
    corridor: 'A1 North-Western Highway',
    scope: 'outside',
    routeType: 'highway',
    roundtripKm: 230,
    oneWayKm: 115,
    typicalCargo: 'medium',
    description: 'North-West arterial highway haul from Willowvale Depot to Chinhoyi commercial depot. Ranked for monthly fuel savings.',
    compatibleAlongWayDestinations: [],
  },
  {
    id: 'rt-chegutu',
    name: 'Willowvale – Chegutu Route',
    destination: 'Chegutu',
    corridor: 'A5 Western Highway Corridor',
    scope: 'outside',
    routeType: 'highway',
    roundtripKm: 210,
    oneWayKm: 105,
    typicalCargo: 'medium',
    description: 'First major hub along the A5 corridor from Willowvale Depot. Kadoma, Kwekwe, and Gweru lie further along the way.',
    compatibleAlongWayDestinations: ['Kadoma', 'Kwekwe', 'Gweru'],
  },
  {
    id: 'rt-kadoma',
    name: 'Willowvale – Kadoma Route',
    destination: 'Kadoma',
    corridor: 'A5 Western Highway Corridor',
    scope: 'outside',
    routeType: 'highway',
    roundtripKm: 284,
    oneWayKm: 142,
    typicalCargo: 'heavy',
    description: 'A5 corridor haul from Willowvale to Kadoma industrial center. Chegutu lies directly along the way for multi-drops.',
    compatibleAlongWayDestinations: ['Chegutu', 'Kwekwe', 'Gweru'],
  },
  {
    id: 'rt-kwekwe',
    name: 'Willowvale – Kwekwe Route',
    destination: 'Kwekwe',
    corridor: 'A5 Western Highway Corridor',
    scope: 'outside',
    routeType: 'highway',
    roundtripKm: 426,
    oneWayKm: 213,
    typicalCargo: 'heavy',
    description: 'Midlands arterial corridor to Kwekwe steel & mining hub. Chegutu and Kadoma are directly en-route along the way.',
    compatibleAlongWayDestinations: ['Chegutu', 'Kadoma', 'Gweru'],
  },
  {
    id: 'rt-gweru',
    name: 'Willowvale – Gweru Route',
    destination: 'Gweru',
    corridor: 'A5 Western Highway Corridor',
    scope: 'outside',
    routeType: 'highway',
    roundtripKm: 550,
    oneWayKm: 275,
    typicalCargo: 'heavy',
    description: 'Longest outside route from Willowvale to Gweru Midlands terminal. Chegutu, Kadoma, and Kwekwe are along the way.',
    compatibleAlongWayDestinations: ['Chegutu', 'Kadoma', 'Kwekwe'],
  },
  {
    id: 'rt-willowvale-local',
    name: 'Willowvale Local City Deliveries',
    destination: 'Willowvale Local / Harare Urban',
    corridor: 'Harare Urban & Industrial Ring',
    scope: 'local',
    routeType: 'urban',
    roundtripKm: 65,
    oneWayKm: 32,
    typicalCargo: 'light',
    description: 'Local intra-city distribution, Southerton/Graniteside loops, and dock queues. Strictly EXCLUDED from monthly fuel bonuses.',
    compatibleAlongWayDestinations: [],
  },
];

export const A5_CORRIDOR_DESTINATIONS = ['Chegutu', 'Kadoma', 'Kwekwe', 'Gweru'];

export function calculateCorridorDistance(primary: string, secondary?: string): number {
  const ONE_WAY_KM: Record<string, number> = {
    'Chegutu': 105,
    'Kadoma': 142,
    'Kwekwe': 213,
    'Gweru': 275,
    'Bindura': 88,
    'Chinhoyi': 115,
    'Willowvale Local / Harare Urban': 32,
  };

  const d1 = ONE_WAY_KM[primary] || 140;
  if (!secondary || !ONE_WAY_KM[secondary] || secondary === primary) {
    return Math.round(d1 * 2);
  }
  const d2 = ONE_WAY_KM[secondary];
  const maxOneWay = Math.max(d1, d2);
  // Roundtrip to farthest destination + 25 km detour for intermediate town drop-off
  return Math.round(maxOneWay * 2 + 25);
}

export const DEFAULT_ROUTE_NAMES: Record<string, string> = {
  'Bindura': 'Willowvale – Bindura Route',
  'Chinhoyi': 'Willowvale – Chinhoyi Route',
  'Chegutu': 'Willowvale – Chegutu Route',
  'Kadoma': 'Willowvale – Kadoma Route',
  'Kwekwe': 'Willowvale – Kwekwe Route',
  'Gweru': 'Willowvale – Gweru Route',
  'Willowvale Local / Harare Urban': 'Willowvale Local City Deliveries',
  'Chegutu & Kadoma (Along the way)': 'Willowvale – Chegutu & Kadoma (Along the way)',
  'Kadoma & Kwekwe (Along the way)': 'Willowvale – Kadoma & Kwekwe (Along the way)',
  'Kwekwe & Gweru (Along the way)': 'Willowvale – Kwekwe & Gweru (Along the way)',
  'Chegutu & Kwekwe (Along the way)': 'Willowvale – Chegutu & Kwekwe (Along the way)',
  'Chegutu & Gweru (Along the way)': 'Willowvale – Chegutu & Gweru (Along the way)',
  // Backwards compatibility mappings
  'Northern Distribution Port - Depot B': 'Willowvale – Bindura Route',
  'Central Cold Storage Hub': 'Willowvale – Chinhoyi Route',
  'West Valley Logistics Terminal': 'Willowvale – Chegutu Route',
  'Eastern Freight Railhead': 'Willowvale – Kadoma Route',
  'Midland Wholesale Distribution Center': 'Willowvale – Kwekwe Route',
  'Lakeside Industrial Complex': 'Willowvale – Gweru Route',
  'Downtown Supermarket Cluster': 'Willowvale Local City Deliveries',
  'Metro Regional Hospital Supply': 'Willowvale Local City Deliveries',
  'City Logistics Cross-Dock': 'Willowvale Local City Deliveries',
  'Harbor Bulk Terminal 3': 'Willowvale Local City Deliveries',
  'Airport Cargo Terminal': 'Willowvale Local City Deliveries',
  'Eastgate Retail Warehouse': 'Willowvale Local City Deliveries',
};

export const DEFAULT_LOCAL_ROUTES = new Set([
  'Willowvale Local City Deliveries',
  'Willowvale Local / Harare Urban',
  'Willowvale Local Deliveries',
  'Harare Local Distribution',
  'Metro Supermarket Cluster Loop',
  'Downtown Supermarket Cluster',
  'Regional Hospital Medical Corridor',
  'Metro Regional Hospital Supply',
  'City Logistics Cross-Dock Run',
  'City Logistics Cross-Dock',
  'Airport Air Cargo Shuttle',
  'Airport Cargo Terminal',
  'Eastgate Distribution Line',
  'Eastgate Retail Warehouse',
  'Harbor Bulk Terminal Line',
  'Harbor Bulk Terminal 3',
]);

export const PRESET_WAREHOUSE_ROUTES: PresetRoute[] = [
  // The 7 Official Routes from Willowvale
  {
    id: 'rt-bindura',
    name: 'Willowvale – Bindura Route',
    destination: 'Bindura',
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A11 North-Eastern Corridor',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 176,
    typicalCargo: 'medium',
    description: 'Outside haul from Willowvale to Bindura mining and farming hub. Ranked for monthly fuel bonus.',
  },
  {
    id: 'rt-chinhoyi',
    name: 'Willowvale – Chinhoyi Route',
    destination: 'Chinhoyi',
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A1 North-Western Corridor',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 230,
    typicalCargo: 'medium',
    description: 'A1 highway arterial haul from Willowvale to Chinhoyi. Ranked for monthly fuel savings.',
  },
  {
    id: 'rt-chegutu',
    name: 'Willowvale – Chegutu Route',
    destination: 'Chegutu',
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A5 Western Corridor',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 210,
    typicalCargo: 'medium',
    description: 'A5 Western highway corridor to Chegutu. Kadoma and Kwekwe lie further along the way.',
  },
  {
    id: 'rt-kadoma',
    name: 'Willowvale – Kadoma Route',
    destination: 'Kadoma',
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A5 Western Corridor',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 284,
    typicalCargo: 'heavy',
    description: 'A5 highway haul to Kadoma industrial center. Chegutu is along the way. Ranked for monthly bonus.',
  },
  {
    id: 'rt-kwekwe',
    name: 'Willowvale – Kwekwe Route',
    destination: 'Kwekwe',
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A5 Western Corridor',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 426,
    typicalCargo: 'heavy',
    description: 'Midlands arterial corridor to Kwekwe steel center. Chegutu & Kadoma are en-route along the way.',
  },
  {
    id: 'rt-gweru',
    name: 'Willowvale – Gweru Route',
    destination: 'Gweru',
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A5 Western Corridor',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 550,
    typicalCargo: 'heavy',
    description: 'Longest A5 outside route from Willowvale to Gweru. Chegutu, Kadoma, and Kwekwe are along the way.',
  },
  {
    id: 'rt-willowvale-local',
    name: 'Willowvale Local City Deliveries',
    destination: 'Willowvale Local / Harare Urban',
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'Harare Urban Distribution',
    scope: 'local',
    routeType: 'urban',
    estimatedKm: 65,
    typicalCargo: 'light',
    description: 'Local urban multi-drop and Southerton industrial loop. Strictly EXCLUDED from month-end rankings.',
  },

  // Multi-Drop En-Route Combinations (When driver goes to two destinations along the way)
  {
    id: 'rt-chegutu-kadoma-along',
    name: 'Willowvale – Chegutu & Kadoma (Along the way)',
    destination: 'Chegutu & Kadoma (Along the way)',
    secondaryDestination: 'Chegutu',
    isAlongTheWay: true,
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A5 Corridor Multi-Drop',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 310,
    typicalCargo: 'heavy',
    description: 'Drop-off at Chegutu en-route to Kadoma on A5 corridor. Multi-drop along the way ranked for monthly bonus.',
  },
  {
    id: 'rt-kadoma-kwekwe-along',
    name: 'Willowvale – Kadoma & Kwekwe (Along the way)',
    destination: 'Kadoma & Kwekwe (Along the way)',
    secondaryDestination: 'Kadoma',
    isAlongTheWay: true,
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A5 Corridor Multi-Drop',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 450,
    typicalCargo: 'heavy',
    description: 'Drop-off at Kadoma en-route to Kwekwe on A5 corridor. Multi-drop along the way ranked for monthly bonus.',
  },
  {
    id: 'rt-kwekwe-gweru-along',
    name: 'Willowvale – Kwekwe & Gweru (Along the way)',
    destination: 'Kwekwe & Gweru (Along the way)',
    secondaryDestination: 'Kwekwe',
    isAlongTheWay: true,
    warehouseOrigin: 'Willowvale Central Depot, Harare',
    corridor: 'A5 Corridor Multi-Drop',
    scope: 'outside',
    routeType: 'highway',
    estimatedKm: 570,
    typicalCargo: 'heavy',
    description: 'Drop-off at Kwekwe en-route to Gweru on A5 corridor. Multi-drop along the way ranked for monthly bonus.',
  },
];

export const DEFAULT_SETTINGS: FleetSettings = {
  companyName: 'Willowvale Freight & Logistics',
  currencySymbol: '$',
  fuelPricePerLitre: 1.68,
  ecoBonusPerLitreSaved: 0.45,
  distanceUnit: 'km',
  volumeUnit: 'L',
};

export const INITIAL_TRUCKS: Truck[] = [
  {
    id: 'trk-101',
    plate: 'KAA-492B',
    model: 'Freightliner Cascadia 126',
    tankCapacityL: 450,
    baselineRateL100km: 30.5,
    currentOdoKm: 184520,
    currentFuelGauge: 0.75, // 3/4
    fuelType: 'diesel',
    status: 'active',
    assignedDriverId: 'drv-01',
    notes: 'Long haul dual tank rig. Good aerodynamics.',
  },
  {
    id: 'trk-102',
    plate: 'KDC-810H',
    model: 'Volvo FH16 540 Turbo',
    tankCapacityL: 500,
    baselineRateL100km: 29.0,
    currentOdoKm: 212400,
    currentFuelGauge: 0.625, // 5/8
    fuelType: 'diesel',
    status: 'active',
    assignedDriverId: 'drv-02',
    notes: 'I-Shift transmission with eco-roll function.',
  },
  {
    id: 'trk-103',
    plate: 'KBF-339M',
    model: 'Isuzu FTR 850 Freight',
    tankCapacityL: 280,
    baselineRateL100km: 22.0,
    currentOdoKm: 98350,
    currentFuelGauge: 0.5, // 1/2
    fuelType: 'diesel',
    status: 'active',
    assignedDriverId: 'drv-03',
    notes: 'Urban distribution delivery truck with hydraulic tailgate.',
  },
  {
    id: 'trk-104',
    plate: 'KCE-194X',
    model: 'Kenworth T680 Next-Gen',
    tankCapacityL: 400,
    baselineRateL100km: 31.0,
    currentOdoKm: 142100,
    currentFuelGauge: 0.875, // 7/8
    fuelType: 'diesel',
    status: 'in-transit',
    assignedDriverId: 'drv-04',
    notes: 'Interstate container hauler.',
  },
  {
    id: 'trk-105',
    plate: 'KBQ-677L',
    model: 'Mercedes-Benz Actros 1845',
    tankCapacityL: 420,
    baselineRateL100km: 27.5,
    currentOdoKm: 164800,
    currentFuelGauge: 0.375, // 3/8
    fuelType: 'diesel',
    status: 'active',
    assignedDriverId: 'drv-05',
    notes: 'Predictive Powertrain Control equipped.',
  },
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv-01',
    name: 'Marcus Vance',
    phone: '+1 (555) 234-8901',
    licenseNumber: 'CDL-A-94021',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedTruckId: 'trk-101',
    experienceYears: 12,
    hireDate: '2021-03-15',
    status: 'active',
  },
  {
    id: 'drv-02',
    name: 'Elena Rostova',
    phone: '+1 (555) 389-1142',
    licenseNumber: 'CDL-A-81204',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    assignedTruckId: 'trk-102',
    experienceYears: 8,
    hireDate: '2022-06-10',
    status: 'active',
  },
  {
    id: 'drv-03',
    name: 'David Chen',
    phone: '+1 (555) 745-6623',
    licenseNumber: 'CDL-B-44019',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assignedTruckId: 'trk-103',
    experienceYears: 6,
    hireDate: '2023-01-20',
    status: 'active',
  },
  {
    id: 'drv-04',
    name: 'Jamal Washington',
    phone: '+1 (555) 902-3314',
    licenseNumber: 'CDL-A-67129',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    assignedTruckId: 'trk-104',
    experienceYears: 10,
    hireDate: '2020-09-01',
    status: 'on-trip',
  },
  {
    id: 'drv-05',
    name: 'Carlos Mendez',
    phone: '+1 (555) 412-8871',
    licenseNumber: 'CDL-A-30911',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    assignedTruckId: 'trk-105',
    experienceYears: 4,
    hireDate: '2024-02-18',
    status: 'active',
  },
  {
    id: 'drv-06',
    name: 'Sarah Jenkins',
    phone: '+1 (555) 678-2234',
    licenseNumber: 'CDL-A-51980',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    experienceYears: 3,
    hireDate: '2024-05-12',
    status: 'active',
  },
];

// Helper to seed trips with realistic dates in current month (2026-10) and prior month (2026-09)
function createSeedTrips(): DeliveryTrip[] {
  const settings = DEFAULT_SETTINGS;
  const rawTrips = [
    // --- Marcus Vance (drv-01) - Champion Eco Driver ---
    // Flexible dispatch: drives trk-101 and trk-102
    {
      id: 'trip-oct-01',
      tripCode: 'DEL-8401',
      truckId: 'trk-101',
      driverId: 'drv-01',
      destination: 'Kadoma & Kwekwe (Along the way)',
      secondaryDestination: 'Kadoma',
      isAlongTheWay: true,
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Kadoma & Kwekwe (Along the way)',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'medium' as const,
      startDate: '2026-10-02T06:30:00Z',
      endDate: '2026-10-02T16:45:00Z',
      startOdoKm: 181200,
      endOdoKm: 181650, // 450 km (A5 corridor multi-drop)
      startFuelGauge: 1.0, // Full
      endFuelGauge: 0.72, // ~126L used
      refuels: [],
      idleHours: 0.5,
      notes: 'Departed Willowvale Depot. Dropped in Kadoma, then continued along the way to Kwekwe.',
    },
    {
      id: 'trip-oct-02',
      tripCode: 'DEL-8442',
      truckId: 'trk-101',
      driverId: 'drv-01',
      destination: 'Gweru',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Gweru Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'heavy' as const,
      startDate: '2026-10-08T07:00:00Z',
      endDate: '2026-10-08T18:15:00Z',
      startOdoKm: 182100,
      endOdoKm: 182650, // 550 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.65, // ~157.5L used
      refuels: [],
      idleHours: 0.6,
      notes: 'Direct long-haul run from Willowvale to Gweru along A5 highway.',
    },
    {
      id: 'trip-oct-03',
      tripCode: 'DEL-8510',
      truckId: 'trk-102', // Flexible assignment: dispatched in trk-102 Volvo!
      driverId: 'drv-01',
      destination: 'Chinhoyi',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Chinhoyi Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'medium' as const,
      startDate: '2026-10-15T05:45:00Z',
      endDate: '2026-10-15T15:30:00Z',
      startOdoKm: 211000,
      endOdoKm: 211230, // 230 km
      startFuelGauge: 0.875,
      endFuelGauge: 0.75, // 62.5L used
      refuels: [],
      idleHours: 0.4,
      notes: 'Dispatched in Volvo FH16. Smooth run along A1 corridor from Willowvale.',
    },
    {
      id: 'trip-oct-04',
      tripCode: 'DEL-8592',
      truckId: 'trk-101',
      driverId: 'drv-01',
      destination: 'Bindura',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Bindura Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'light' as const,
      startDate: '2026-10-21T06:00:00Z',
      endDate: '2026-10-21T17:00:00Z',
      startOdoKm: 183900,
      endOdoKm: 184076, // 176 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.89, // ~49.5L used
      refuels: [],
      idleHours: 0.5,
      notes: 'Willowvale to Bindura mining corridor. Outstanding eco score.',
    },

    // --- Elena Rostova (drv-02) - Runner-up Eco Star (#2) ---
    // Flexible truck dispatch: drives trk-102 (Volvo) & trk-104 (Kenworth)
    {
      id: 'trip-oct-05',
      tripCode: 'DEL-8409',
      truckId: 'trk-102',
      driverId: 'drv-02',
      destination: 'Kwekwe',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Kwekwe Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'medium' as const,
      startDate: '2026-10-03T06:15:00Z',
      endDate: '2026-10-03T16:00:00Z',
      startOdoKm: 209500,
      endOdoKm: 209926, // 426 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.77, // ~115L used
      refuels: [],
      idleHours: 0.6,
      notes: 'Willowvale to Kwekwe run via A5 highway.',
    },
    {
      id: 'trip-oct-06',
      tripCode: 'DEL-8458',
      truckId: 'trk-104', // Assigned to trk-104 Kenworth
      driverId: 'drv-02',
      destination: 'Chegutu & Kadoma (Along the way)',
      secondaryDestination: 'Chegutu',
      isAlongTheWay: true,
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Chegutu & Kadoma (Along the way)',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'heavy' as const,
      startDate: '2026-10-10T07:00:00Z',
      endDate: '2026-10-10T19:00:00Z',
      startOdoKm: 140000,
      endOdoKm: 140310, // 310 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.76, // 96L used
      refuels: [],
      idleHours: 0.7,
      notes: 'Multi-stop along the way: Chegutu hardware first, then Kadoma warehouse drop-off.',
    },
    {
      id: 'trip-oct-07',
      tripCode: 'DEL-8533',
      truckId: 'trk-102',
      driverId: 'drv-02',
      destination: 'Kadoma',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Kadoma Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'medium' as const,
      startDate: '2026-10-18T05:30:00Z',
      endDate: '2026-10-18T16:30:00Z',
      startOdoKm: 211700,
      endOdoKm: 211984, // 284 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.84, // ~80L used
      refuels: [],
      idleHours: 0.5,
      notes: 'Willowvale to Kadoma direct corridor run.',
    },

    // --- David Chen (drv-03) - City & Local Specialist ---
    // Runs local Willowvale runs (EXCLUDED from month-end calculations) + some outside
    {
      id: 'trip-oct-08',
      tripCode: 'DEL-8415',
      truckId: 'trk-103',
      driverId: 'drv-03',
      destination: 'Willowvale Local / Harare Urban',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale Local City Deliveries',
      deliveryScope: 'local' as const,
      routeType: 'urban' as const,
      cargoWeightCategory: 'light' as const,
      startDate: '2026-10-04T08:00:00Z',
      endDate: '2026-10-04T17:30:00Z',
      startOdoKm: 96800,
      endOdoKm: 96865, // 65 km local loop
      startFuelGauge: 0.875,
      endFuelGauge: 0.80, // ~21L used
      refuels: [],
      idleHours: 1.2,
      notes: 'Local Southerton & Willowvale industrial drop-offs. Excluded from monthly rankings.',
    },
    {
      id: 'trip-oct-09',
      tripCode: 'DEL-8480',
      truckId: 'trk-103',
      driverId: 'drv-03',
      destination: 'Willowvale Local / Harare Urban',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale Local City Deliveries',
      deliveryScope: 'local' as const,
      routeType: 'urban' as const,
      cargoWeightCategory: 'medium' as const,
      startDate: '2026-10-12T07:45:00Z',
      endDate: '2026-10-12T17:00:00Z',
      startOdoKm: 97400,
      endOdoKm: 97470, // 70 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.91, // ~25L used
      refuels: [],
      idleHours: 1.5,
      notes: 'Harare CBD supermarket cluster deliveries. Excluded from monthly calculations.',
    },
    {
      id: 'trip-oct-10',
      tripCode: 'DEL-8561',
      truckId: 'trk-101', // David Chen dispatched in truck 101! Flexible assignment
      driverId: 'drv-03',
      destination: 'Chegutu',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Chegutu Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'light' as const,
      startDate: '2026-10-19T08:00:00Z',
      endDate: '2026-10-19T16:00:00Z',
      startOdoKm: 184100,
      endOdoKm: 184310, // 210 km
      startFuelGauge: 0.75,
      endFuelGauge: 0.62, // ~58.5L used
      refuels: [],
      idleHours: 0.7,
      notes: 'Outside delivery to Chegutu farm supply warehouse.',
    },

    // --- Jamal Washington (drv-04) - Highway Long Hauler ---
    {
      id: 'trip-oct-11',
      tripCode: 'DEL-8422',
      truckId: 'trk-104',
      driverId: 'drv-04',
      destination: 'Kwekwe & Gweru (Along the way)',
      secondaryDestination: 'Kwekwe',
      isAlongTheWay: true,
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Kwekwe & Gweru (Along the way)',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'heavy' as const,
      startDate: '2026-10-05T06:00:00Z',
      endDate: '2026-10-05T18:00:00Z',
      startOdoKm: 140400,
      endOdoKm: 140970, // 570 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.55, // 180L used
      refuels: [],
      idleHours: 1.1,
      notes: 'Departed Willowvale. Offloaded steel components in Kwekwe, then continued along the way to Gweru.',
    },
    {
      id: 'trip-oct-12',
      tripCode: 'DEL-8495',
      truckId: 'trk-105', // Assigned to trk-105 Mercedes! Flexible assignment
      driverId: 'drv-04',
      destination: 'Chinhoyi',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Chinhoyi Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'heavy' as const,
      startDate: '2026-10-14T05:30:00Z',
      endDate: '2026-10-14T17:30:00Z',
      startOdoKm: 164100,
      endOdoKm: 164330, // 230 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.83, // 71.4L used
      refuels: [],
      idleHours: 0.8,
      notes: 'Heavy bulk grain shipment from Willowvale to Chinhoyi.',
    },

    // --- Carlos Mendez (drv-05) ---
    {
      id: 'trip-oct-13',
      tripCode: 'DEL-8430',
      truckId: 'trk-105',
      driverId: 'drv-05',
      destination: 'Gweru',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Gweru Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'heavy' as const,
      startDate: '2026-10-06T06:30:00Z',
      endDate: '2026-10-06T19:00:00Z',
      startOdoKm: 163100,
      endOdoKm: 163650, // 550 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.58, // 176.4L used
      refuels: [],
      idleHours: 1.6,
      notes: 'Willowvale to Gweru highway run. Some excessive idle at dock.',
    },
    {
      id: 'trip-oct-14',
      tripCode: 'DEL-8520',
      truckId: 'trk-105',
      driverId: 'drv-05',
      destination: 'Bindura',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Bindura Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'heavy' as const,
      startDate: '2026-10-16T07:00:00Z',
      endDate: '2026-10-16T18:00:00Z',
      startOdoKm: 163700,
      endOdoKm: 163876, // 176 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.86, // ~58.8L used
      refuels: [],
      idleHours: 1.2,
      notes: 'Willowvale to Bindura run via Mazowe.',
    },

    // --- Sarah Jenkins (drv-06) ---
    {
      id: 'trip-oct-15',
      tripCode: 'DEL-8470',
      truckId: 'trk-103',
      driverId: 'drv-06',
      destination: 'Willowvale Local / Harare Urban',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale Local City Deliveries',
      deliveryScope: 'local' as const,
      routeType: 'urban' as const,
      cargoWeightCategory: 'medium' as const,
      startDate: '2026-10-11T09:00:00Z',
      endDate: '2026-10-11T17:30:00Z',
      startOdoKm: 97500,
      endOdoKm: 97565, // 65 km
      startFuelGauge: 0.875,
      endFuelGauge: 0.79, // ~23.8L used
      refuels: [],
      idleHours: 1.8,
      notes: 'Local warehouse transfer and urban loop. Excluded from monthly rankings.',
    },
    {
      id: 'trip-oct-16',
      tripCode: 'DEL-8575',
      truckId: 'trk-104', // Sarah dispatched in truck 104!
      driverId: 'drv-06',
      destination: 'Chegutu',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Chegutu Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'light' as const,
      startDate: '2026-10-20T08:00:00Z',
      endDate: '2026-10-20T17:00:00Z',
      startOdoKm: 141000,
      endOdoKm: 141210, // 210 km
      startFuelGauge: 0.75,
      endFuelGauge: 0.60, // 60L
      refuels: [],
      idleHours: 1.0,
      notes: 'Willowvale to Chegutu highway corridor run.',
    },

    // --- September 2026 trips (Historical comparison) ---
    {
      id: 'trip-sep-01',
      tripCode: 'DEL-7910',
      truckId: 'trk-101',
      driverId: 'drv-01',
      destination: 'Gweru',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Gweru Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'medium' as const,
      startDate: '2026-09-12T06:00:00Z',
      endDate: '2026-09-12T16:00:00Z',
      startOdoKm: 178500,
      endOdoKm: 179050, // 550 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.64, // 162L used
      refuels: [],
      idleHours: 0.4,
      notes: 'September Willowvale to Gweru corridor run.',
    },
    {
      id: 'trip-sep-02',
      tripCode: 'DEL-7935',
      truckId: 'trk-102',
      driverId: 'drv-02',
      destination: 'Kwekwe',
      warehouseOrigin: 'Willowvale Central Depot, Harare',
      routeName: 'Willowvale – Kwekwe Route',
      deliveryScope: 'outside' as const,
      routeType: 'highway' as const,
      cargoWeightCategory: 'heavy' as const,
      startDate: '2026-09-18T07:00:00Z',
      endDate: '2026-09-18T18:00:00Z',
      startOdoKm: 207100,
      endOdoKm: 207526, // 426 km
      startFuelGauge: 1.0,
      endFuelGauge: 0.75, // 125L used
      refuels: [],
      idleHours: 0.6,
      notes: 'Smooth delivery run to Kwekwe.',
    },
  ];

  return rawTrips.map((raw) => {
    const truck = INITIAL_TRUCKS.find((t) => t.id === raw.truckId) || INITIAL_TRUCKS[0];
    const metrics = calculateTripMetrics({
      truck,
      startOdoKm: raw.startOdoKm,
      endOdoKm: raw.endOdoKm,
      startFuelGauge: raw.startFuelGauge,
      endFuelGauge: raw.endFuelGauge,
      refuels: raw.refuels,
      routeType: raw.routeType,
      cargoWeightCategory: raw.cargoWeightCategory,
      idleHours: raw.idleHours,
      settings,
    });

    const routeName = (raw as any).routeName || DEFAULT_ROUTE_NAMES[raw.destination] || raw.destination;
    const deliveryScope =
      (raw as any).deliveryScope ||
      (DEFAULT_LOCAL_ROUTES.has(routeName) || DEFAULT_LOCAL_ROUTES.has(raw.destination)
        ? 'local'
        : 'outside');

    return {
      ...raw,
      routeName,
      deliveryScope,
      ...metrics,
      status: 'completed',
    };
  });
}

export function loadSettings(): FleetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.companyName === 'Apex Logistics & Freight') {
        parsed.companyName = DEFAULT_SETTINGS.companyName;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: FleetSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadTrucks(): Truck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRUCKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse trucks', e);
  }
  // Initialize with initial trucks
  saveTrucks(INITIAL_TRUCKS);
  return INITIAL_TRUCKS;
}

export function saveTrucks(trucks: Truck[]): void {
  localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(trucks));
}

export function loadDrivers(): Driver[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRIVERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse drivers', e);
  }
  // Initialize with initial drivers
  saveDrivers(INITIAL_DRIVERS);
  return INITIAL_DRIVERS;
}

export function saveDrivers(drivers: Driver[]): void {
  localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
}

export function loadTrips(): DeliveryTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If legacy dataset from old demo port/coastal terminal, refresh with Willowvale warehouse data
        const isLegacySample = parsed.some(
          (t: any) =>
            t.destination &&
            (t.destination.includes('Northern Distribution') ||
              t.destination.includes('Central Cold Storage') ||
              t.destination.includes('Coastal Marine'))
        );
        if (!isLegacySample) {
          return parsed.map((t: DeliveryTrip) => {
            const routeName = t.routeName || DEFAULT_ROUTE_NAMES[t.destination] || t.destination;
            const deliveryScope =
              t.deliveryScope ||
              (DEFAULT_LOCAL_ROUTES.has(routeName) || DEFAULT_LOCAL_ROUTES.has(t.destination)
                ? 'local'
                : 'outside');
            return {
              ...t,
              warehouseOrigin: t.warehouseOrigin || 'Willowvale Central Depot, Harare',
              routeName,
              deliveryScope,
            };
          });
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse trips', e);
  }
  // Initialize with seed trips
  const seeds = createSeedTrips();
  saveTrips(seeds);
  return seeds;
}

export function saveTrips(trips: DeliveryTrip[]): void {
  localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
}

export function computeRouteEfficiencySummaries(
  trips: DeliveryTrip[],
  drivers: Driver[] = []
): RouteEfficiencySummary[] {
  const driverMap = new Map(drivers.map((d) => [d.id, d.name]));
  const routeGroups = new Map<
    string,
    {
      routeName: string;
      destination: string;
      routeType: RouteType;
      trips: DeliveryTrip[];
    }
  >();

  // Group trips by routeName (or fallback to destination)
  trips.forEach((t) => {
    const key = (t.routeName || DEFAULT_ROUTE_NAMES[t.destination] || t.destination).trim();
    if (!key) return;

    if (!routeGroups.has(key)) {
      routeGroups.set(key, {
        routeName: key,
        destination: t.destination,
        routeType: t.routeType,
        trips: [],
      });
    }
    routeGroups.get(key)!.trips.push(t);
  });

  const summaries: RouteEfficiencySummary[] = [];

  routeGroups.forEach(({ routeName, destination, routeType, trips: groupTrips }) => {
    const tripsCount = groupTrips.length;
    const totalDistanceKm = groupTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
    const avgDistanceKm = tripsCount > 0 ? Math.round(totalDistanceKm / tripsCount) : 0;
    const totalFuelUsedL = groupTrips.reduce((acc, t) => acc + (t.fuelUsedL || 0), 0);
    const totalFuelSavedL = groupTrips.reduce((acc, t) => acc + (t.fuelSavedL || 0), 0);

    // Delivery scope
    const firstTrip = groupTrips[0];
    const scope =
      firstTrip?.deliveryScope ||
      (DEFAULT_LOCAL_ROUTES.has(routeName) || DEFAULT_LOCAL_ROUTES.has(destination)
        ? 'local'
        : 'outside');

    // Average actual consumption rate (L/100km)
    const avgL100km =
      totalDistanceKm > 0
        ? Math.round((totalFuelUsedL / totalDistanceKm) * 1000) / 10
        : 0;

    // Target benchmark rate
    const totalExpectedFuel = groupTrips.reduce((acc, t) => acc + (t.expectedFuelL || 0), 0);
    const targetL100km =
      totalDistanceKm > 0
        ? Math.round((totalExpectedFuel / totalDistanceKm) * 1000) / 10
        : 0;

    const efficiencyVariance = Math.round((avgL100km - targetL100km) * 10) / 10;
    const avgEcoScore =
      tripsCount > 0
        ? Math.round(groupTrips.reduce((acc, t) => acc + (t.ecoScore || 0), 0) / tripsCount)
        : 70;

    // Determine rating
    let efficiencyRating: 'excellent' | 'good' | 'average' | 'poor' = 'good';
    if (efficiencyVariance <= -2.0 || avgEcoScore >= 88) {
      efficiencyRating = 'excellent';
    } else if (efficiencyVariance <= 0 || avgEcoScore >= 78) {
      efficiencyRating = 'good';
    } else if (efficiencyVariance <= 2.5) {
      efficiencyRating = 'average';
    } else {
      efficiencyRating = 'poor';
    }

    // Find best performing driver on this route
    let bestDriverName: string | undefined = undefined;
    let bestRateL100km: number = Infinity;
    groupTrips.forEach((t) => {
      if (t.actualRateL100km > 0 && t.actualRateL100km < bestRateL100km) {
        bestRateL100km = t.actualRateL100km;
        bestDriverName = driverMap.get(t.driverId) || t.driverId;
      }
    });

    // Last traveled date
    const sortedDates = groupTrips
      .map((t) => t.startDate || t.endDate)
      .filter(Boolean)
      .sort()
      .reverse();
    const lastTraveled = sortedDates[0]?.slice(0, 10);

    summaries.push({
      routeName,
      destination,
      scope,
      routeType,
      tripsCount,
      totalDistanceKm: Math.round(totalDistanceKm),
      avgDistanceKm,
      totalFuelUsedL: Math.round(totalFuelUsedL * 10) / 10,
      totalFuelSavedL: Math.round(totalFuelSavedL * 10) / 10,
      avgL100km,
      targetL100km,
      efficiencyVariance,
      avgEcoScore,
      efficiencyRating,
      bestDriverName: bestDriverName || undefined,
      bestRateL100km: bestRateL100km !== Infinity ? bestRateL100km : undefined,
      lastTraveled,
    });
  });

  // Sort by frequency (most trips first), then by total distance
  return summaries.sort((a, b) => b.tripsCount - a.tripsCount || b.totalDistanceKm - a.totalDistanceKm);
}

export function resetAllData(): { trucks: Truck[]; drivers: Driver[]; trips: DeliveryTrip[]; settings: FleetSettings } {
  localStorage.removeItem(STORAGE_KEYS.TRUCKS);
  localStorage.removeItem(STORAGE_KEYS.DRIVERS);
  localStorage.removeItem(STORAGE_KEYS.TRIPS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);

  saveSettings(DEFAULT_SETTINGS);
  saveTrucks(INITIAL_TRUCKS);
  saveDrivers(INITIAL_DRIVERS);
  const seedTrips = createSeedTrips();
  saveTrips(seedTrips);

  return {
    trucks: INITIAL_TRUCKS,
    drivers: INITIAL_DRIVERS,
    trips: seedTrips,
    settings: DEFAULT_SETTINGS,
  };
}

export function exportBackupJSON(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings: loadSettings(),
    trucks: loadTrucks(),
    drivers: loadDrivers(),
    trips: loadTrips(),
    checkIns: loadCheckInLogs(),
    snapshots: loadHistoricalSnapshots(),
    auditLogs: loadAuditEvents(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.trucks && Array.isArray(data.trucks)) saveTrucks(data.trucks);
    if (data.drivers && Array.isArray(data.drivers)) saveDrivers(data.drivers);
    if (data.trips && Array.isArray(data.trips)) saveTrips(data.trips);
    if (data.settings) saveSettings(data.settings);
    if (data.checkIns && Array.isArray(data.checkIns)) saveCheckInLogs(data.checkIns);
    if (data.snapshots && Array.isArray(data.snapshots)) {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(data.snapshots));
    }
    recordAuditEvent('data_restored', 'Imported fleet and history archive JSON successfully', 'System Admin');
    return true;
  } catch (err) {
    console.error('Failed to import JSON backup', err);
    return false;
  }
}

export interface HistoricalSnapshot {
  id: string;
  name: string;
  createdAt: string;
  tripsCount: number;
  totalDistanceKm: number;
  totalFuelUsedL: number;
  totalFuelSavedL: number;
  dateRange: string;
  notes?: string;
  tripsData: DeliveryTrip[];
}

export interface FleetAuditEvent {
  id: string;
  timestamp: string;
  type: 'trip_logged' | 'trip_deleted' | 'gauge_checkin' | 'truck_updated' | 'snapshot_created' | 'data_restored';
  description: string;
  actor?: string;
  details?: Record<string, unknown>;
}

export const INITIAL_CHECKIN_LOGS: TruckCheckInLog[] = [
  {
    id: 'chk-log-01',
    truckId: 'trk-101',
    driverId: 'drv-01',
    timestamp: '2026-10-22T17:40:00Z',
    prevOdoKm: 184344,
    newOdoKm: 184520,
    distanceKm: 176,
    prevFuelGauge: 1.0,
    newFuelGauge: 0.75,
    fuelConsumedL: 112.5,
    rateL100km: 63.9,
    updatedStatus: 'active',
    reason: 'Post-delivery yard check-in following Bindura highway corridor return.',
    notes: 'Tank physical dip matches dashboard 3/4 reading. No leaks detected.',
  },
  {
    id: 'chk-log-02',
    truckId: 'trk-102',
    driverId: 'drv-02',
    timestamp: '2026-10-20T06:30:00Z',
    prevOdoKm: 212170,
    newOdoKm: 212400,
    distanceKm: 230,
    prevFuelGauge: 1.0,
    newFuelGauge: 0.625,
    fuelConsumedL: 187.5,
    rateL100km: 81.5,
    updatedStatus: 'active',
    reason: 'Pre-dispatch calibration and visual odometer verification at Willowvale.',
    notes: 'Tyre pressures nominal at 110 PSI. Ready for Chinhoyi run.',
  },
  {
    id: 'chk-log-03',
    truckId: 'trk-103',
    driverId: 'drv-03',
    timestamp: '2026-10-18T18:00:00Z',
    prevOdoKm: 98285,
    newOdoKm: 98350,
    distanceKm: 65,
    prevFuelGauge: 0.65,
    newFuelGauge: 0.50,
    fuelConsumedL: 42.0,
    rateL100km: 64.6,
    updatedStatus: 'active',
    reason: 'Harare Urban multi-drop run completion check-in.',
    notes: 'Local run excluded from monthly driver fuel bonus per depot policy.',
  },
];

export function loadCheckInLogs(): TruckCheckInLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKIN_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse check-in logs', e);
  }
  saveCheckInLogs(INITIAL_CHECKIN_LOGS);
  return INITIAL_CHECKIN_LOGS;
}

export function saveCheckInLogs(logs: TruckCheckInLog[]): void {
  localStorage.setItem(STORAGE_KEYS.CHECKIN_LOGS, JSON.stringify(logs));
}

export function loadHistoricalSnapshots(): HistoricalSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse historical snapshots', e);
  }
  return [];
}

export function saveHistoricalSnapshot(snapshot: HistoricalSnapshot): void {
  const existing = loadHistoricalSnapshots();
  const filtered = existing.filter((s) => s.id !== snapshot.id);
  const updated = [snapshot, ...filtered];
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(updated));
  recordAuditEvent('snapshot_created', `Archived history snapshot: "${snapshot.name}" (${snapshot.tripsCount} trips)`);
}

export function deleteHistoricalSnapshot(snapshotId: string): void {
  const existing = loadHistoricalSnapshots();
  const updated = existing.filter((s) => s.id !== snapshotId);
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(updated));
}

export function loadAuditEvents(): FleetAuditEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse audit events', e);
  }
  return [
    {
      id: 'audit-init-1',
      timestamp: '2026-10-25T08:00:00Z',
      type: 'trip_logged',
      description: 'System initialized with Willowvale Warehouse 7 corridors fleet history',
      actor: 'System',
    },
  ];
}

export function recordAuditEvent(
  type: FleetAuditEvent['type'],
  description: string,
  actor: string = 'Dispatcher',
  details?: Record<string, unknown>
): void {
  try {
    const existing = loadAuditEvents();
    const newEvent: FleetAuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      description,
      actor,
      details,
    };
    const updated = [newEvent, ...existing].slice(0, 100); // keep last 100 audit items
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record audit event', e);
  }
}

export function clearAuditEvents(): void {
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
}

export function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

export function downloadCSV(csvContent: string, filename: string): void {
  // \ufeff is the UTF-8 BOM, ensuring Excel and Google Sheets render characters cleanly
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTrucksToCSV(trucks: Truck[], drivers: Driver[] = []): string {
  const driverMap = new Map(drivers.map((d) => [d.id, d]));

  const headers = [
    'Truck ID',
    'License Plate',
    'Make & Model',
    'Fuel Type',
    'Tank Capacity (L)',
    'Baseline Rate (L/100km)',
    'Current Odometer (km)',
    'Current Fuel Gauge (Fraction)',
    'Current Fuel Gauge (%)',
    'Estimated Fuel in Tank (L)',
    'Status',
    'Assigned Driver ID',
    'Assigned Driver Name',
    'Notes',
  ];

  const rows = trucks.map((t) => {
    const driver = t.assignedDriverId ? driverMap.get(t.assignedDriverId) : undefined;
    const estimatedL = Math.round(t.tankCapacityL * t.currentFuelGauge * 10) / 10;
    return [
      escapeCSV(t.id),
      escapeCSV(t.plate),
      escapeCSV(t.model),
      escapeCSV(t.fuelType.toUpperCase()),
      t.tankCapacityL,
      t.baselineRateL100km,
      t.currentOdoKm,
      t.currentFuelGauge,
      `${Math.round(t.currentFuelGauge * 100)}%`,
      estimatedL,
      escapeCSV(t.status.toUpperCase()),
      escapeCSV(t.assignedDriverId || 'None'),
      escapeCSV(driver ? driver.name : 'Unassigned'),
      escapeCSV(t.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function exportDriversToCSV(drivers: Driver[], trucks: Truck[] = []): string {
  const truckMap = new Map(trucks.map((t) => [t.id, t]));

  const headers = [
    'Driver ID',
    'Driver Name',
    'Phone',
    'License Number',
    'Experience (Years)',
    'Hire Date',
    'Status',
    'Assigned Truck ID',
    'Assigned Truck Plate',
    'Assigned Truck Model',
  ];

  const rows = drivers.map((d) => {
    const truck = d.assignedTruckId ? truckMap.get(d.assignedTruckId) : undefined;
    return [
      escapeCSV(d.id),
      escapeCSV(d.name),
      escapeCSV(d.phone),
      escapeCSV(d.licenseNumber),
      d.experienceYears,
      escapeCSV(d.hireDate),
      escapeCSV(d.status.toUpperCase()),
      escapeCSV(d.assignedTruckId || 'None'),
      escapeCSV(truck ? truck.plate : 'Unassigned'),
      escapeCSV(truck ? truck.model : ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function exportTripsToCSV(
  trips: DeliveryTrip[],
  trucks: Truck[],
  drivers: Driver[],
  settings?: FleetSettings
): string {
  const truckMap = new Map(trucks.map((t) => [t.id, t]));
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const currency = settings?.currencySymbol || '$';

  const headers = [
    'Trip Code',
    'Route Name',
    'Delivery Scope',
    'Destination',
    'Date',
    'Start Timestamp',
    'End Timestamp',
    'Driver ID',
    'Driver Name',
    'Driver License',
    'Truck ID',
    'Truck Plate',
    'Truck Model',
    'Route Type',
    'Cargo Weight Category',
    'Start Odo (km)',
    'End Odo (km)',
    'Distance (km)',
    'Start Fuel Gauge',
    'Start Fuel Gauge (%)',
    'End Fuel Gauge',
    'End Fuel Gauge (%)',
    'Fuel Used (L)',
    'Expected Fuel (L)',
    'Fuel Saved (L)',
    'Saved %',
    'Actual L/100km',
    'Target L/100km',
    'Idle Hours',
    'Eco Score (0-100)',
    `Cost Saved (${currency})`,
    'Status',
    'Notes',
  ];

  const rows = trips.map((t) => {
    const truck = truckMap.get(t.truckId);
    const driver = driverMap.get(t.driverId);
    const tripDate = t.startDate ? t.startDate.slice(0, 10) : '';

    return [
      escapeCSV(t.tripCode),
      escapeCSV(t.routeName || DEFAULT_ROUTE_NAMES[t.destination] || t.destination),
      escapeCSV(t.deliveryScope === 'local' ? 'Local Delivery (Excluded)' : 'Outside Delivery (Ranked)'),
      escapeCSV(t.destination),
      escapeCSV(tripDate),
      escapeCSV(t.startDate || ''),
      escapeCSV(t.endDate || ''),
      escapeCSV(t.driverId),
      escapeCSV(driver ? driver.name : t.driverId),
      escapeCSV(driver ? driver.licenseNumber : ''),
      escapeCSV(t.truckId),
      escapeCSV(truck ? truck.plate : t.truckId),
      escapeCSV(truck ? truck.model : ''),
      escapeCSV(t.routeType),
      escapeCSV(t.cargoWeightCategory),
      t.startOdoKm,
      t.endOdoKm,
      t.distanceKm,
      t.startFuelGauge,
      `${Math.round(t.startFuelGauge * 100)}%`,
      t.endFuelGauge,
      `${Math.round(t.endFuelGauge * 100)}%`,
      t.fuelUsedL,
      t.expectedFuelL,
      t.fuelSavedL,
      `${t.fuelSavedPercent}%`,
      t.actualRateL100km,
      t.expectedRateL100km,
      t.idleHours || 0,
      t.ecoScore,
      t.costSaved,
      escapeCSV(t.destination),
      escapeCSV(t.status),
      escapeCSV(t.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function exportCompleteFleetToCSV(
  trucks: Truck[],
  drivers: Driver[],
  trips: DeliveryTrip[],
  settings: FleetSettings
): string {
  const exportTimestamp = new Date().toISOString();
  const totalKm = trips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
  const totalFuelUsed = trips.reduce((acc, t) => acc + (t.fuelUsedL || 0), 0);
  const totalFuelSaved = trips.reduce((acc, t) => acc + (t.fuelSavedL || 0), 0);
  const totalCostSaved = trips.reduce((acc, t) => acc + (t.costSaved || 0), 0);

  const metaBlock = [
    '# =========================================================================',
    '# ECOTRACK FLEET MANAGEMENT - CONSOLIDATED OFFLINE BACKUP & REPORT',
    '# =========================================================================',
    `# Organization / Fleet,${escapeCSV(settings.companyName)}`,
    `# Export Date & Time,${escapeCSV(exportTimestamp)}`,
    `# Currency Symbol,${escapeCSV(settings.currencySymbol)}`,
    `# Fuel Price Per Liter,${settings.fuelPricePerLitre}`,
    `# Driver Eco-Bonus Rate Per Liter Saved,${settings.ecoBonusPerLitreSaved}`,
    `# Total Fleet Vehicles,${trucks.length}`,
    `# Total Active Drivers,${drivers.length}`,
    `# Total Recorded Deliveries,${trips.length}`,
    `# Total Fleet Distance Logged (km),${Math.round(totalKm * 10) / 10}`,
    `# Total Fuel Consumed (L),${Math.round(totalFuelUsed * 10) / 10}`,
    `# Total Fuel Saved vs Baseline (L),${Math.round(totalFuelSaved * 10) / 10}`,
    `# Net Estimated Cost Savings (${settings.currencySymbol}),${Math.round(totalCostSaved * 100) / 100}`,
    '# =========================================================================',
    '',
  ].join('\n');

  const trucksSectionHeader = [
    '# -------------------------------------------------------------------------',
    '# SECTION 1: FLEET TRUCKS & VEHICLE SPECIFICATIONS',
    '# -------------------------------------------------------------------------',
  ].join('\n');
  const trucksCSV = exportTrucksToCSV(trucks, drivers);

  const driversSectionHeader = [
    '',
    '# -------------------------------------------------------------------------',
    '# SECTION 2: DRIVER ROSTER & ASSIGNMENTS',
    '# -------------------------------------------------------------------------',
  ].join('\n');
  const driversCSV = exportDriversToCSV(drivers, trucks);

  const tripsSectionHeader = [
    '',
    '# -------------------------------------------------------------------------',
    '# SECTION 3: DELIVERY TRIPS & FUEL CONSUMPTION TELEMETRY',
    '# -------------------------------------------------------------------------',
  ].join('\n');
  const tripsCSV = exportTripsToCSV(trips, trucks, drivers, settings);

  return [
    metaBlock,
    trucksSectionHeader,
    trucksCSV,
    driversSectionHeader,
    driversCSV,
    tripsSectionHeader,
    tripsCSV,
  ].join('\n');
}

