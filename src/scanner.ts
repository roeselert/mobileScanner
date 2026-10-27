import type { Scan } from './types';

/** True when the new detection is the same code still sitting in the frame:
 * same payload and same symbology. Timestamps differ on every hit and are
 * ignored, so a steady shot yields one result, not an accumulating history. */
export function isSameScan(previous: Scan | null, next: Scan): boolean {
  if (previous === null) return false;
  return previous.value === next.value && previous.format === next.format;
}
