/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate bearing from one point to another
 * @param lat1 Latitude of starting point
 * @param lng1 Longitude of starting point
 * @param lat2 Latitude of end point
 * @param lng2 Longitude of end point
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Check if a pothole is ahead in the direction of travel
 * @param userLat User's current latitude
 * @param userLng User's current longitude
 * @param userBearing User's direction of travel (in degrees)
 * @param potholeLat Pothole latitude
 * @param potholeLng Pothole longitude
 * @param tolerance Tolerance angle in degrees (default: 45)
 * @returns True if pothole is ahead within tolerance
 */
export function isPotholeAhead(
  userLat: number,
  userLng: number,
  userBearing: number,
  potholeLat: number,
  potholeLng: number,
  tolerance: number = 45
): boolean {
  const bearingToPothole = calculateBearing(userLat, userLng, potholeLat, potholeLng);
  let angleDiff = Math.abs(bearingToPothole - userBearing);

  // Normalize angle difference to 0-180 range
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }

  return angleDiff <= tolerance;
}