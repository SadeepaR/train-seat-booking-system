/**
 * Segment Overlap Utility
 * 
 * Railway journeys are modeled as continuous sequence intervals [fromSequence, toSequence).
 * The interval is half-open:
 * - A journey from Colombo (seq 0) to Kandy (seq 5) occupies [0, 5).
 * - A journey from Kandy (seq 5) to Badulla (seq 11) occupies [5, 11).
 * 
 * Two intervals [A_start, A_end) and [B_start, B_end) OVERLAP if and only if:
 *    Math.max(A_start, B_start) < Math.min(A_end, B_end)
 * 
 * Notice that if A_end == B_start (e.g. 5 == 5), Math.max(0, 5) = 5, Math.min(5, 11) = 5.
 * 5 < 5 is FALSE, so contiguous segments do NOT overlap and can be booked by different passengers!
 */

export function checkSegmentOverlap(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number
): boolean {
  return Math.max(fromA, fromB) < Math.min(toA, toB);
}

/**
 * Validates whether a journey request is structurally valid:
 * - fromSequence must be strictly less than toSequence (direction of train travel).
 */
export function isValidJourneySegment(fromSequence: number, toSequence: number): boolean {
  return typeof fromSequence === 'number' && typeof toSequence === 'number' && fromSequence < toSequence;
}
