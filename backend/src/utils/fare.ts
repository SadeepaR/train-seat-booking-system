import { CoachClass } from '../types';

/**
 * Class Rates per Kilometer (in LKR):
 * - 1st Class Observation: LKR 12.00 / km (Base Minimum: LKR 300)
 * - 2nd Class Reserved:    LKR 8.00 / km  (Base Minimum: LKR 200)
 * - 3rd Class Reserved:    LKR 5.00 / km  (Base Minimum: LKR 100)
 */

export const CLASS_RATES_PER_KM: Record<CoachClass, { ratePerKm: number; minFare: number }> = {
  [CoachClass.FIRST]: { ratePerKm: 12.0, minFare: 300 },
  [CoachClass.SECOND]: { ratePerKm: 8.0, minFare: 200 },
  [CoachClass.THIRD]: { ratePerKm: 5.0, minFare: 100 },
};

/**
 * Calculates distance in kilometers and monetary ticket fare in LKR.
 * 
 * Formula:
 *    distanceKm = | originDistanceKm - destinationDistanceKm |
 *    fareAmount = max(distanceKm * ratePerKm, minFare)
 */
export function calculateDistanceAndFare(
  originKm: number,
  destKm: number,
  classType: CoachClass
): { distanceKm: number; fareAmount: number } {
  const distanceKm = Math.abs(destKm - originKm);
  const classPricing = CLASS_RATES_PER_KM[classType] || CLASS_RATES_PER_KM[CoachClass.THIRD];
  
  const rawFare = distanceKm * classPricing.ratePerKm;
  const fareAmount = Math.max(classPricing.minFare, Math.round(rawFare));

  return { distanceKm, fareAmount };
}
