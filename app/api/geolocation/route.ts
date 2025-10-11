import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

    console.log('Client IP:', clientIp);

    // Use IP-API.com to get geolocation
    // If IP is localhost/unknown, IP-API will detect the server's IP
    const apiUrl = clientIp && clientIp !== 'unknown' && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1')
      ? `http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
      : 'http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query';

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`IP-API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'fail') {
      return NextResponse.json(
        { error: data.message || 'Geolocation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      ip: data.query,
    });
  } catch (error) {
    console.error('Geolocation API error:', error);
    return NextResponse.json(
      { error: 'Failed to get location' },
      { status: 500 }
    );
  }
}
