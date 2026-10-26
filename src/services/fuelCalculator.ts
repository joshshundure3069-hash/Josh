import {
  CargoWeightCategory,
  DeliveryTrip,
  FleetSettings,
  MonthlyDriverRanking,
  RefuelRecord,
  RouteType,
  Truck
} from '../types/fleet';

export const GAUGE_FRACTIONS = [
  { value: 0.0, label: 'E', display: 'Empty (0%)', fractionText: '0' },
  { value: 0.125, label: '1/8', display: '1/8 Tank (12.5%)', fractionText: '1/8' },
  { value: 0.25, label: '1/4', display: '1/4 Tank (25%)', fractionText: '1/4' },
  { value: 0.375, label: '3/8', display: '3/8 Tank (37.5%)', fractionText: '3/8' },
  { value: 0.5, label: '1/2', display: 'Half Tank (50%)', fractionText: '1/2' },
  { value: 0.625, label: '5/8', display: '5/8 Tank (62.5%)', fractionText: '5/8' },
  { value: 0.75, label: '3/4', display: '3/4 Tank (75%)', fractionText: '3/4' },
  { value: 0.875, label: '7/8', display: '7/8 Tank (87.5%)', fractionText: '7/8' },
  { value: 1.0, label: 'F', display: 'Full Tank (100%)', fractionText: '1/1' },
];

export const ROUTE_MULTIPLIERS: Record<RouteType, { label: string; factor: number; desc: string }> = {
  highway: { label: 'Highway / Interstate', factor: 0.92, desc: 'Steady speed, aerodynamic haul' },
  mixed: { label: 'Mixed Regional', factor: 1.0, desc: 'Standard suburban & corridor mix' },
  urban: { label: 'City / Stop-and-Go', factor: 1.15, desc: 'Heavy traffic, frequent stop lights' },
  mountain: { label: 'Mountain / Heavy Grades', factor: 1.25, desc: 'Steep inclines and engine braking' },
};

export const CARGO_MULTIPLIERS: Record<CargoWeightCategory, { label: string; factor: number; desc: string }> = {
  empty: { label: 'Empty (Deadheading)', factor: 0.85, desc: 'Tractor/trailer with no cargo' },
  light: { label: 'Light Load (<5 tons)', factor: 0.95, desc: 'Partial or bulky low-weight cargo' },
  medium: { label: 'Medium Load (5-15 tons)', factor: 1.05, desc: 'Standard freight delivery load' },
  heavy: { label: 'Heavy Load (15-25 tons)', factor: 1.18, desc: 'Dense industrial or liquid cargo' },
  full: { label: 'Maximum Gross Load (>25 tons)', factor: 1.28, desc: 'At truck GVWR maximum limit' },
};

export const IDLE_BURN_RATE_L_HR = 2.2; // ~2.2 Liters per hour idling for standard commercial diesel engine

/**
 * Calculates liters remaining based on gauge position (0..1) and tank capacity (L)
 */
export function getLitersFromGauge(gaugeValue: number, tankCapacityL: number): number {
  return Math.round(gaugeValue * tankCapacityL * 10) / 10;
}

/**
 * Finds the nearest gauge fraction label
 */
export function getGaugeLabel(val: number): string {
  if (val <= 0.03) return 'E';
  if (val >= 0.97) return 'F';
  let closest = GAUGE_FRACTIONS[0];
  let minDiff = 1;
  for (const item of GAUGE_FRACTIONS) {
    const diff = Math.abs(item.value - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }
  return closest.label;
}

/**
 * Computes all delivery trip metrics based on truck specs, start/end readings, cargo, route, and refuels.
 */
export function calculateTripMetrics(params: {
  truck: Truck;
  startOdoKm: number;
  endOdoKm: number;
  startFuelGauge: number;
  endFuelGauge: number;
  refuels: RefuelRecord[];
  routeType: RouteType;
  cargoWeightCategory: CargoWeightCategory;
  idleHours?: number;
  settings: FleetSettings;
}) {
  const {
    truck,
    startOdoKm,
    endOdoKm,
    startFuelGauge,
    endFuelGauge,
    refuels,
    routeType,
    cargoWeightCategory,
    idleHours = 0,
    settings,
  } = params;

  const distanceKm = Math.max(0, endOdoKm - startOdoKm);

  // Total refueled liters
  const totalRefueledL = refuels.reduce((acc, r) => acc + (Number(r.litres) || 0), 0);

  // Fuel consumed from gauge difference + any refuels
  // e.g. Start 7/8 (0.875) -> End 2/8 (0.25) = 0.625 consumed * 400L = 250L + refuels
  const gaugeDelta = Math.max(0, startFuelGauge - endFuelGauge);
  const tankUsedL = gaugeDelta * truck.tankCapacityL;
  const fuelUsedL = Math.max(0, Math.round((tankUsedL + totalRefueledL) * 10) / 10);

  // Benchmark expected rate
  const routeFactor = ROUTE_MULTIPLIERS[routeType]?.factor ?? 1.0;
  const cargoFactor = CARGO_MULTIPLIERS[cargoWeightCategory]?.factor ?? 1.0;
  const expectedRateL100km = Math.round(truck.baselineRateL100km * routeFactor * cargoFactor * 10) / 10;

  // Expected fuel used for this trip
  const expectedDrivingFuelL = (distanceKm / 100) * expectedRateL100km;
  const expectedIdleFuelL = idleHours * IDLE_BURN_RATE_L_HR;
  const expectedFuelL = Math.round((expectedDrivingFuelL + expectedIdleFuelL) * 10) / 10;

  // Actual rate in L/100km
  const actualRateL100km = distanceKm > 0 ? Math.round((fuelUsedL / distanceKm) * 100 * 10) / 10 : 0;

  // Fuel saved (positive = saved fuel; negative = used more fuel than expected)
  const fuelSavedL = Math.round((expectedFuelL - fuelUsedL) * 10) / 10;
  const fuelSavedPercent = expectedFuelL > 0 ? Math.round((fuelSavedL / expectedFuelL) * 100 * 10) / 10 : 0;

  // Cost saved
  const costSaved = Math.round(fuelSavedL * settings.fuelPricePerLitre * 100) / 100;

  // Eco Score: 70 is baseline par. Every 1% saved adds 1.5 points. Max 100, Min 10.
  let ecoScore = 70;
  if (expectedFuelL > 0) {
    ecoScore = Math.round(70 + fuelSavedPercent * 1.5);
    ecoScore = Math.max(10, Math.min(100, ecoScore));
  }

  return {
    distanceKm,
    fuelUsedL,
    expectedFuelL,
    fuelSavedL,
    fuelSavedPercent,
    actualRateL100km,
    expectedRateL100km,
    ecoScore,
    costSaved,
  };
}

/**
 * Computes monthly driver ranking based on completed trips in a given month.
 */
export function calculateMonthlyRankings(
  trips: DeliveryTrip[],
  drivers: { id: string; name: string; avatarUrl?: string }[],
  yearMonth: string, // "YYYY-MM"
  settings: FleetSettings,
  truckIdFilter?: string
): MonthlyDriverRanking[] {
  // Filter trips by month, completed status, and truck reference (when comparing drivers on the same truck)
  const monthTrips = trips.filter((t) => {
    if (t.status !== 'completed') return false;
    if (!t.endDate && !t.startDate) return false;
    const dateStr = t.endDate || t.startDate;
    const matchesMonth = dateStr.startsWith(yearMonth);
    const matchesTruck = !truckIdFilter || truckIdFilter === 'all' || t.truckId === truckIdFilter;
    return matchesMonth && matchesTruck;
  });

  const driverStatsMap = new Map<
    string,
    {
      outsideTripsCount: number;
      localTripsCount: number;
      totalDistanceKm: number;
      totalFuelUsedL: number;
      totalExpectedFuelL: number;
      totalFuelSavedL: number;
      ecoScores: number[];
    }
  >();

  // Initialize for all known drivers
  for (const driver of drivers) {
    driverStatsMap.set(driver.id, {
      outsideTripsCount: 0,
      localTripsCount: 0,
      totalDistanceKm: 0,
      totalFuelUsedL: 0,
      totalExpectedFuelL: 0,
      totalFuelSavedL: 0,
      ecoScores: [],
    });
  }

  // Aggregate trips: EXCLUDE local deliveries from monthly ranking calculations!
  for (const trip of monthTrips) {
    let stat = driverStatsMap.get(trip.driverId);
    if (!stat) {
      stat = {
        outsideTripsCount: 0,
        localTripsCount: 0,
        totalDistanceKm: 0,
        totalFuelUsedL: 0,
        totalExpectedFuelL: 0,
        totalFuelSavedL: 0,
        ecoScores: [],
      };
      driverStatsMap.set(trip.driverId, stat);
    }

    if (trip.deliveryScope === 'local') {
      // Local deliveries are recorded, but explicitly excluded from end-of-month fuel calculations
      stat.localTripsCount += 1;
    } else {
      // Outside delivery: included in month-end driver fuel rankings and eco-bonus calculation
      stat.outsideTripsCount += 1;
      stat.totalDistanceKm += trip.distanceKm;
      stat.totalFuelUsedL += trip.fuelUsedL;
      stat.totalExpectedFuelL += trip.expectedFuelL;
      stat.totalFuelSavedL += trip.fuelSavedL;
      stat.ecoScores.push(trip.ecoScore);
    }
  }

  // Build ranking objects
  const list: MonthlyDriverRanking[] = [];

  for (const driver of drivers) {
    const stat = driverStatsMap.get(driver.id)!;
    const totalTrips = stat.outsideTripsCount + stat.localTripsCount;
    if (totalTrips === 0) {
      continue;
    }

    const hasOutsideTrips = stat.outsideTripsCount > 0;

    const fuelSavedPercent =
      hasOutsideTrips && stat.totalExpectedFuelL > 0
        ? Math.round((stat.totalFuelSavedL / stat.totalExpectedFuelL) * 100 * 10) / 10
        : 0;

    const avgL100km =
      hasOutsideTrips && stat.totalDistanceKm > 0
        ? Math.round((stat.totalFuelUsedL / stat.totalDistanceKm) * 100 * 10) / 10
        : 0;

    const avgExpectedL100km =
      hasOutsideTrips && stat.totalDistanceKm > 0
        ? Math.round((stat.totalExpectedFuelL / stat.totalDistanceKm) * 100 * 10) / 10
        : 0;

    const avgEcoScore =
      stat.ecoScores.length > 0
        ? Math.round(stat.ecoScores.reduce((a, b) => a + b, 0) / stat.ecoScores.length)
        : 70;

    const incentiveBonus =
      hasOutsideTrips && stat.totalFuelSavedL > 0
        ? Math.round(stat.totalFuelSavedL * settings.ecoBonusPerLitreSaved * 100) / 100
        : 0;

    const estimatedCostSavings = hasOutsideTrips
      ? Math.round(stat.totalFuelSavedL * settings.fuelPricePerLitre * 100) / 100
      : 0;

    let tier: MonthlyDriverRanking['tier'] = 'standard';
    if (!hasOutsideTrips) {
      tier = 'standard';
    } else if (fuelSavedPercent >= 10 && stat.totalFuelSavedL > 15) {
      tier = 'champion';
    } else if (fuelSavedPercent >= 4) {
      tier = 'expert';
    } else if (fuelSavedPercent < -5) {
      tier = 'needs-training';
    }

    list.push({
      driverId: driver.id,
      driverName: driver.name,
      driverAvatar: driver.avatarUrl,
      tripsCount: stat.outsideTripsCount, // Ranked trips count
      outsideTripsCount: stat.outsideTripsCount,
      localTripsCount: stat.localTripsCount,
      totalDistanceKm: Math.round(stat.totalDistanceKm),
      totalFuelUsedL: Math.round(stat.totalFuelUsedL * 10) / 10,
      totalExpectedFuelL: Math.round(stat.totalExpectedFuelL * 10) / 10,
      totalFuelSavedL: Math.round(stat.totalFuelSavedL * 10) / 10,
      fuelSavedPercent,
      avgL100km,
      avgExpectedL100km,
      avgEcoScore,
      rank: 0, // Assigned after sort
      tier,
      incentiveBonus,
      estimatedCostSavings,
    });
  }

  // Sort descending:
  // 1) Drivers with outside trips come first, sorted by totalFuelSavedL, then fuelSavedPercent
  // 2) Drivers with only local deliveries come last
  list.sort((a, b) => {
    if (a.outsideTripsCount === 0 && b.outsideTripsCount > 0) return 1;
    if (a.outsideTripsCount > 0 && b.outsideTripsCount === 0) return -1;
    if (b.totalFuelSavedL !== a.totalFuelSavedL) {
      return b.totalFuelSavedL - a.totalFuelSavedL;
    }
    if (b.fuelSavedPercent !== a.fuelSavedPercent) {
      return b.fuelSavedPercent - a.fuelSavedPercent;
    }
    return b.avgEcoScore - a.avgEcoScore;
  });

  // Assign ranks (only outside drivers get a competitive rank)
  let currentRank = 1;
  list.forEach((item) => {
    if (item.outsideTripsCount > 0) {
      item.rank = currentRank++;
      if (item.rank === 1 && item.totalFuelSavedL > 0) {
        item.tier = 'champion';
      }
    } else {
      item.rank = 0; // 0 denotes local-only
    }
  });

  return list;
}
