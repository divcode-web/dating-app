/**
 * IP Geolocation using IP-API.com
 * Free service - 45 requests per minute
 * No API key required
 * Accuracy: 95-99% country, 55-80% city
 */

export interface IPGeolocationData {
  status: 'success' | 'fail';
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
  message?: string; // Error message if status is 'fail'
}

/**
 * Get geolocation data from user's IP address
 * Uses IP-API.com free service
 */
export async function getIPGeolocation(): Promise<IPGeolocationData | null> {
  try {
    // IP-API endpoint - will automatically detect user's IP
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query');

    if (!response.ok) {
      throw new Error(`IP-API request failed: ${response.status}`);
    }

    const data: IPGeolocationData = await response.json();

    if (data.status === 'fail') {
      console.error('IP geolocation failed:', data.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching IP geolocation:', error);
    return null;
  }
}

/**
 * Get geolocation for a specific IP address
 * Useful for admin/debugging purposes
 */
export async function getIPGeolocationByIP(ipAddress: string): Promise<IPGeolocationData | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);

    if (!response.ok) {
      throw new Error(`IP-API request failed: ${response.status}`);
    }

    const data: IPGeolocationData = await response.json();

    if (data.status === 'fail') {
      console.error('IP geolocation failed:', data.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching IP geolocation:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format location for display
 */
export function formatLocation(data: IPGeolocationData): string {
  const parts = [];

  if (data.city) parts.push(data.city);
  if (data.regionName) parts.push(data.regionName);
  if (data.country) parts.push(data.country);

  return parts.join(', ');
}

/**
 * Check if IP geolocation is available
 * Can be used to show fallback UI if service is down
 */
export async function checkIPGeolocationAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://ip-api.com/json/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
