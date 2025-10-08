import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Spotify client ID not configured' },
      { status: 500 }
    );
  }

  // Request user's top artists, tracks, and streaming permissions
  const scope = 'user-top-read user-read-email streaming user-read-private user-read-playback-state user-modify-playback-state';
  const state = userId; // Pass userId in state to retrieve after callback

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scope,
    state: state,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
