import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Get a fresh access token for the user
async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at')
    .eq('id', userId)
    .single();

  if (!profile?.spotify_access_token) {
    return null;
  }

  // Check if token is still valid
  const expiresAt = new Date(profile.spotify_token_expires_at);
  const now = new Date();

  if (expiresAt > now) {
    return profile.spotify_access_token;
  }

  // Token expired, refresh it
  if (!profile.spotify_refresh_token) {
    return null;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: profile.spotify_refresh_token,
    }),
  });

  if (!refreshResponse.ok) {
    return null;
  }

  const tokenData = await refreshResponse.json();
  const newAccessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in;
  const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // Update the new access token in database
  await supabase
    .from('user_profiles')
    .update({
      spotify_access_token: newAccessToken,
      spotify_token_expires_at: newExpiresAt.toISOString(),
    })
    .eq('id', userId);

  return newAccessToken;
}

export const dynamic = 'force-dynamic';export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'artist,track';
  const userId = searchParams.get('userId');

  if (!query || !userId) {
    return NextResponse.json(
      { error: 'Missing query or userId parameter' },
      { status: 400 }
    );
  }

  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not connected to Spotify' },
        { status: 401 }
      );
    }

    // Search Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Spotify search failed:', errorText);
      return NextResponse.json(
        { error: 'Spotify search failed' },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();

    return NextResponse.json({
      artists: searchData.artists?.items || [],
      tracks: searchData.tracks?.items || [],
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
