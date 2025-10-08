"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipForward, SkipBack, Volume2, Music } from "lucide-react";
import { useAuth } from "./auth-provider";

interface SpotifyPlayerProps {
  trackUri?: string; // e.g., "spotify:track:xxxxx"
}

export function SpotifyPlayer({ trackUri }: SpotifyPlayerProps) {
  const { user } = useAuth();
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Load Spotify Web Playback SDK
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [user?.id]);

  const getAccessToken = async () => {
    try {
      const response = await fetch('/api/spotify/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      // console.error('Error getting access token:', error);
      return null;
    }
  };

  const initializePlayer = async () => {
    const token = await getAccessToken();
    if (!token) return;

    const spotifyPlayer = new window.Spotify.Player({
      name: 'Dating App Player',
      getOAuthToken: (cb: any) => { cb(token); },
      volume: 0.5,
    });

    // Ready
    spotifyPlayer.addListener('ready', ({ device_id }: any) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      setIsPremium(true);
    });

    // Not Ready
    spotifyPlayer.addListener('not_ready', ({ device_id }: any) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Player state changed
    spotifyPlayer.addListener('player_state_changed', (state: any) => {
      if (!state) return;

      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
    });

    // Connect to the player
    spotifyPlayer.connect();
    setPlayer(spotifyPlayer);
  };

  const handlePlayPause = async () => {
    if (!player) return;

    player.togglePlay();
  };

  const handleNext = async () => {
    if (!player) return;
    player.nextTrack();
  };

  const handlePrevious = async () => {
    if (!player) return;
    player.previousTrack();
  };

  const playTrack = async (uri: string) => {
    if (!deviceId) return;

    const token = await getAccessToken();
    if (!token) return;

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        uris: [uri],
      }),
    });
  };

  useEffect(() => {
    if (trackUri && deviceId) {
      playTrack(trackUri);
    }
  }, [trackUri, deviceId]);

  if (!isPremium) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="flex items-center gap-3">
          <Music className="w-8 h-8 text-purple-500" />
          <div>
            <p className="font-semibold">Spotify Premium Required</p>
            <p className="text-sm text-gray-600">
              Connect your Spotify Premium account to play music
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!currentTrack) {
    return (
      <Card className="p-4">
        <p className="text-gray-500 text-center">No track playing</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="flex items-center gap-4">
        {/* Album Art */}
        <img
          src={currentTrack.album.images[0]?.url}
          alt={currentTrack.name}
          className="w-16 h-16 rounded"
        />

        {/* Track Info */}
        <div className="flex-1">
          <p className="font-semibold">{currentTrack.name}</p>
          <p className="text-sm text-gray-600">
            {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
