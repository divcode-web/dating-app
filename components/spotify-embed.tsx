"use client";

import { Card } from "@/components/ui/card";
import { Music } from "lucide-react";

interface SpotifyEmbedProps {
  trackId?: string;
  type?: 'track' | 'playlist' | 'album' | 'artist';
  height?: number;
}

export function SpotifyEmbed({ trackId, type = 'track', height = 152 }: SpotifyEmbedProps) {
  if (!trackId) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6 text-purple-500" />
          <p className="text-gray-600">No Spotify track selected</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <iframe
        style={{ borderRadius: '12px' }}
        src={`https://open.spotify.com/embed/${type}/${trackId}?utm_source=generator&theme=0`}
        width="100%"
        height={height}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
