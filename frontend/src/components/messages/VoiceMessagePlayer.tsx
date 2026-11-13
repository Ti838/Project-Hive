'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VoiceMessagePlayer({ audioUrl, isMine }: { audioUrl: string; isMine: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Audio play error:', e));
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const bars = [35, 60, 85, 45, 95, 75, 55, 100, 70, 85, 60, 45, 80, 65, 50, 75, 90, 40];

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[210px] sm:min-w-[250px]">
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 shrink-0 shadow-xs cursor-pointer',
          isMine ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
        )}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1 h-6">
          {bars.map((height, i) => {
            const progress = duration > 0 ? currentTime / duration : 0;
            const barProgress = i / bars.length;
            const active = barProgress <= progress;
            return (
              <div
                key={i}
                className={cn(
                  'w-1 rounded-full transition-all duration-150',
                  active
                    ? isMine
                      ? 'bg-primary-foreground'
                      : 'bg-primary'
                    : isMine
                    ? 'bg-primary-foreground/35'
                    : 'bg-muted-foreground/30'
                )}
                style={{
                  height: isPlaying ? `${Math.max(25, Math.min(100, height * (0.6 + 0.8 * Math.random())))}%` : `${height}%`,
                }}
              />
            );
          })}
        </div>

        <div className={cn('flex justify-between text-[10px] font-mono', isMine ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : 'Voice note'}</span>
        </div>
      </div>
    </div>
  );
}

