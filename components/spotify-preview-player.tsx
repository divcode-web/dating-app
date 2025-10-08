"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";

interface SpotifyPreviewPlayerProps {
  previewUrl?: string;
  trackName?: string;
  artistName?: string;
  albumImage?: string;
}

export function SpotifyPreviewPlayer({
  previewUrl,
  trackName,
  artistName,
  albumImage,
}: SpotifyPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // Spotify previews are 30 seconds
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  if (!previewUrl) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6 text-purple-500" />
          <div>
            <p className="font-medium text-gray-700">
              {trackName || "No preview available"}
            </p>
            <p className="text-sm text-gray-500">
              {artistName || "30-second preview not available for this track"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
      <audio ref={audioRef} src={previewUrl} />

      <div className="flex items-center gap-4">
        {/* Album Art */}
        {albumImage ? (
          <img
            src={albumImage}
            alt={trackName || 'Track'}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-purple-200 flex items-center justify-center">
            <Music className="w-8 h-8 text-purple-500" />
          </div>
        )}

        {/* Track Info & Controls */}
        <div className="flex-1">
          <div className="mb-2">
            <p className="font-semibold text-gray-800 truncate">{trackName || 'Unknown Track'}</p>
            <p className="text-sm text-gray-600 truncate">{artistName || 'Unknown Artist'}</p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(currentTime / duration) * 100}%, #e9d5ff ${(currentTime / duration) * 100}%, #e9d5ff 100%)`
              }}
            />
            <span className="text-xs text-gray-500 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Play/Pause & Volume Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        30-second preview - No Spotify Premium required
      </p>
    </Card>
  );
}
