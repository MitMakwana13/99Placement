/**
 * Normalizes dates to strict ISO 8601 UTC strings.
 */
export function toUTCString(date: Date | string | number): string {
  return new Date(date).toISOString();
}

/**
 * Returns current date/time as a Javascript Date object locked to system UTC scope.
 */
export function currentUTCDate(): Date {
  return new Date();
}

/**
 * Adds duration intervals to target date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Checks if target date is before today.
 */
export function isExpired(expiryDate: Date | string): boolean {
  return new Date(expiryDate).getTime() < Date.now();
}
