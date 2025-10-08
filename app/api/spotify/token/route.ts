import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's stored Spotify tokens
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'No Spotify tokens found' }, { status: 404 });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = profile.spotify_token_expires_at ? new Date(profile.spotify_token_expires_at) : null;

    if (expiresAt && now < expiresAt) {
      // Token still valid
      return NextResponse.json({ access_token: profile.spotify_access_token });
    }

    // Token expired, refresh it
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret || !profile.spotify_refresh_token) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
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

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    // Update tokens in database
    const newExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);

    await supabase
      .from('user_profiles')
      .update({
        spotify_access_token: tokenData.access_token,
        spotify_token_expires_at: newExpiresAt.toISOString(),
      })
      .eq('id', userId);

    return NextResponse.json({ access_token: tokenData.access_token });
  } catch (error) {
    // console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
