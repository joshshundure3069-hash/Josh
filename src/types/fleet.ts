export type GaugeFraction = 0 | 0.125 | 0.25 | 0.375 | 0.5 | 0.625 | 0.75 | 0.875 | 1;

export interface TruckCheckInLog {
  id: string;
  truckId: string;
  timestamp: string;
  prevOdoKm: number;
  newOdoKm: number;
  distanceKm: number;
  prevFuelGauge: number;
  newFuelGauge: number;
  fuelConsumedL: number;
  rateL100km: number;
  updatedStatus: 'active' | 'in-transit' | 'maintenance';
  reason: string;
  notes?: string;
  driverId?: string;
  refuelAddedL?: number;
}

export interface Truck {
  id: string;
  plate: string;
  model: string;
  tankCapacityL: number; // e.g. 350 Litres
  baselineRateL100km: number; // e.g. 28.5 L/100km
  currentOdoKm: number;
  currentFuelGauge: number; // 0.0 to 1.0
  fuelType: 'diesel' | 'biodiesel' | 'lng';
  status: 'active' | 'in-transit' | 'maintenance';
  assignedDriverId?: string;
  notes?: string;
  lastCheckIn?: {
    timestamp: string;
    distanceKm: number;
    fuelConsumedL: number;
    rateL100km: number;
    status: 'active' | 'in-transit' | 'maintenance';
  };
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  avatarUrl?: string;
  assignedTruckId?: string;
  experienceYears: number;
  hireDate: string;
  status: 'active' | 'on-trip' | 'off-duty';
}

export interface RefuelRecord {
  id: string;
  litres: number;
  cost: number;
  odometerKm?: number;
  stationName?: string;
  receiptNote?: string;
}

export type RouteType = 'urban' | 'highway' | 'mountain' | 'mixed';
export type CargoWeightCategory = 'empty' | 'light' | 'medium' | 'heavy' | 'full';
export type DeliveryScope = 'outside' | 'local';

export interface DeliveryTrip {
  id: string;
  tripCode: string; // e.g. "DEL-1042"
  truckId: string;
  driverId: string;
  destination: string;
  warehouseOrigin?: string; // e.g. "Willowvale Warehouse"
  secondaryDestination?: string; // 2nd stop along the way if multi-destination
  isAlongTheWay?: boolean; // True if multi-drop corridor run
  routeName?: string; // Named route from warehouse (e.g. "Willowvale – Kadoma Route")
  deliveryScope: DeliveryScope; // 'outside' (calculated in monthly bonus) or 'local' (excluded from monthly calculations)
  routeType: RouteType;
  cargoWeightCategory: CargoWeightCategory;
  cargoWeightTons?: number;
  
  // Start departure state
  startDate: string; // ISO string
  startOdoKm: number;
  startFuelGauge: number; // 0.0 to 1.0 (from dashboard gauge)
  startGaugePhoto?: string; // base64 thumbnail if snapped

  // End arrival state
  endDate: string; // ISO string
  endOdoKm: number;
  endFuelGauge: number; // 0.0 to 1.0 (from dashboard gauge)
  endGaugePhoto?: string; // base64 thumbnail if snapped

  // Refills en-route
  refuels: RefuelRecord[];

  // Idling / delays
  idleHours?: number; // e.g. 1.5 hours engine idle at warehouse dock
  notes?: string;

  // Computed metrics (cached for instant lookup)
  distanceKm: number;
  fuelUsedL: number;
  expectedFuelL: number;
  fuelSavedL: number;
  fuelSavedPercent: number;
  actualRateL100km: number;
  expectedRateL100km: number;
  ecoScore: number; // 0 to 100
  costSaved: number;
  status: 'completed' | 'in-progress';
}

export interface MonthlyDriverRanking {
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  tripsCount: number; // Ranked outside trips count
  outsideTripsCount: number; // Ranked trips
  localTripsCount: number; // Excluded local trips
  totalDistanceKm: number; // Ranked distance
  totalFuelUsedL: number;
  totalExpectedFuelL: number;
  totalFuelSavedL: number; // Can be positive (saved) or negative (excess)
  fuelSavedPercent: number;
  avgL100km: number;
  avgExpectedL100km: number;
  avgEcoScore: number;
  rank: number;
  tier: 'champion' | 'expert' | 'standard' | 'needs-training';
  incentiveBonus: number;
  estimatedCostSavings: number;
}

export interface FleetSettings {
  currencySymbol: string; // e.g. "$" or "€" or "£" or "R"
  fuelPricePerLitre: number; // e.g. 1.65
  ecoBonusPerLitreSaved: number; // e.g. 0.40
  distanceUnit: 'km' | 'mi';
  volumeUnit: 'L' | 'gal';
  companyName: string;
}

export interface RouteEfficiencySummary {
  routeName: string;
  destination: string;
  scope: DeliveryScope; // 'outside' or 'local'
  routeType: RouteType;
  tripsCount: number;
  totalDistanceKm: number;
  avgDistanceKm: number;
  totalFuelUsedL: number;
  totalFuelSavedL: number;
  avgL100km: number;
  targetL100km: number;
  efficiencyVariance: number; // avgL100km - targetL100km (negative means saving fuel!)
  avgEcoScore: number;
  efficiencyRating: 'excellent' | 'good' | 'average' | 'poor';
  bestDriverName?: string;
  bestRateL100km?: number;
  lastTraveled?: string;
}

export interface PresetRoute {
  id: string;
  name: string;
  destination: string;
  secondaryDestination?: string;
  isAlongTheWay?: boolean;
  warehouseOrigin?: string; // Default: "Willowvale Depot"
  corridor?: string; // e.g. "A5 Western Corridor"
  scope: DeliveryScope; // 'outside' | 'local'
  routeType: RouteType;
  estimatedKm: number;
  typicalCargo: CargoWeightCategory;
  description: string;
}



