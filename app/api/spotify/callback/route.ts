import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This is the userId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?spotify_error=access_denied`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?spotify_error=invalid_callback`
    );
  }

  const userId = state;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?spotify_error=config_error`
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user's top artists
    const artistsResponse = await fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!artistsResponse.ok) {
      throw new Error('Failed to get top artists');
    }

    const artistsData = await artistsResponse.json();
    const topArtists = artistsData.items.map((artist: any) => artist.name);

    // Get user's top track (anthem)
    const tracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=medium_term',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    let anthem = null;
    if (tracksResponse.ok) {
      const tracksData = await tracksResponse.json();
      if (tracksData.items.length > 0) {
        const track = tracksData.items[0];
        anthem = {
          track_id: track.id,
          track_name: track.name,
          artist_name: track.artists[0]?.name || 'Unknown',
          preview_url: track.preview_url,
          album_image: track.album?.images[0]?.url,
        };
      }
    }

    // Save to database
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        spotify_top_artists: topArtists,
        spotify_anthem: anthem,
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?spotify_success=true`
    );
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?spotify_error=unknown`
    );
  }
}
