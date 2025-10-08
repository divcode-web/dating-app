import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    console.log('🎵 Spotify callback started for user:', userId);

    // Exchange code for access token
    console.log('🔄 Exchanging code for access token...');
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

    console.log('🔐 Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token data received:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    });

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in; // seconds

    if (!accessToken || !refreshToken) {
      throw new Error('Missing access token or refresh token in response');
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Get user's top artists
    console.log('🎤 Fetching top artists...');
    const artistsResponse = await fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('🎤 Artists response status:', artistsResponse.status);

    if (!artistsResponse.ok) {
      const errorText = await artistsResponse.text();
      console.error('❌ Artists fetch failed:', errorText);
      throw new Error(`Artists fetch failed: ${artistsResponse.status} ${errorText}`);
    }

    const artistsData = await artistsResponse.json();
    const topArtists = artistsData.items?.map((artist: any) => artist.name) || [];
    console.log('✅ Top artists:', topArtists);

    // Get user's top track (anthem)
    console.log('🎵 Fetching top track...');
    const tracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=medium_term',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('🎵 Tracks response status:', tracksResponse.status);

    let anthem = null;
    if (tracksResponse.ok) {
      const tracksData = await tracksResponse.json();
      if (tracksData.items?.length > 0) {
        const track = tracksData.items[0];
        anthem = {
          track_id: track.id,
          track_name: track.name,
          artist_name: track.artists[0]?.name || 'Unknown',
          preview_url: track.preview_url,
          album_image: track.album?.images[0]?.url,
        };
        console.log('✅ Anthem found:', anthem.track_name);
      }
    } else {
      console.log('⚠️ Tracks fetch failed, continuing without anthem');
    }

    // Save to database using service role key (bypasses RLS)
    console.log('💾 Saving to database...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Save all data in one update
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        spotify_access_token: accessToken,
        spotify_refresh_token: refreshToken,
        spotify_token_expires_at: expiresAt.toISOString(),
        spotify_top_artists: topArtists,
        spotify_anthem: anthem,
      })
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('❌ Database save failed:', updateError);
      throw updateError;
    }

    console.log('✅ Spotify integration completed successfully');
    console.log('✅ Data saved:', {
      hasTokens: true,
      artistsCount: topArtists.length,
      hasAnthem: !!anthem
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?spotify_success=true&_t=${Date.now()}`
    );
  } catch (error) {
    console.error('💥 Spotify callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', { message: errorMessage, stack: error });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?spotify_error=${encodeURIComponent(errorMessage)}`
    );
  }
}
