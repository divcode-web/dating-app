import { NextRequest, NextResponse } from 'next/server';

/**
 * Cache Busting Endpoint
 * Mobile users can visit /api/cache-bust to force clear cache
 * Returns cache-control headers to prevent caching
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Cache cleared! Please close and reopen the app.',
    timestamp: new Date().toISOString(),
    version: Date.now(), // Use as cache buster
  });

  // Set aggressive cache-busting headers
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  return response;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
