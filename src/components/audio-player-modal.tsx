/**
 * @fileoverview Modal component for playing journal entry audio.
 * Displays a cover image, entry title, summary, and audio playback controls.
 */
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { JournalEntry } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Rewind, FastForward, X, Maximize, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { format as formatDateFns } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  coverImageUrl?: string;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

export function AudioPlayerModal({ isOpen, onClose, entry, coverImageUrl }: AudioPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(entry.audioDuration && Number.isFinite(entry.audioDuration) ? entry.audioDuration : 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!isOpen || !audioElement) {
      if (audioElement && !audioElement.paused) {
        audioElement.pause();
        setIsPlaying(false);
      }
      return;
    }
    
    // Reset player state when entry or its audio changes, or modal opens
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(entry.audioDuration && Number.isFinite(entry.audioDuration) ? entry.audioDuration : 0);

    if (entry.audioUrl) {
      if (audioElement.currentSrc !== entry.audioUrl) {
        audioElement.src = entry.audioUrl;
        audioElement.load();
      } else if (audioElement.readyState === 0) { // If src is same but not loaded (e.g., network error previously)
        audioElement.load();
      }
    } else {
      audioElement.removeAttribute('src');
      audioElement.load(); // Reflect removal of src
      setDuration(0);
    }

    const handleMetadata = () => {
      if (audioElement.duration && Number.isFinite(audioElement.duration)) {
        setDuration(audioElement.duration);
      } else {
        setDuration(0);
      }
    };
    const handleTimeUpdateEvent = () => setCurrentTime(audioElement.currentTime);
    const handleEndedEvent = () => setIsPlaying(false);
    const handleErrorEvent = (e: Event) => {
      console.error("Audio Element Error:", e);
      const error = (e.target as HTMLAudioElement).error;
      let message = "Could not load or play audio.";
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED: message = "Playback aborted by user."; break;
          case MediaError.MEDIA_ERR_NETWORK: message = "A network error caused audio download to fail."; break;
          case MediaError.MEDIA_ERR_DECODE: message = "Audio decoding error."; break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: message = "Audio format not supported."; break;
        }
      }
      toast({ title: "Audio Error", description: message, variant: "destructive" });
      setIsPlaying(false);
      setDuration(0);
    };

    audioElement.addEventListener('loadedmetadata', handleMetadata);
    audioElement.addEventListener('timeupdate', handleTimeUpdateEvent);
    audioElement.addEventListener('ended', handleEndedEvent);
    audioElement.addEventListener('error', handleErrorEvent);
    audioElement.volume = isMuted ? 0 : volume;

    return () => {
      audioElement.removeEventListener('loadedmetadata', handleMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeUpdateEvent);
      audioElement.removeEventListener('ended', handleEndedEvent);
      audioElement.removeEventListener('error', handleErrorEvent);
      if (!audioElement.paused) {
        audioElement.pause();
      }
    };
  }, [isOpen, entry.id, entry.audioUrl, entry.audioDuration, toast, volume, isMuted]);


  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          toast({ title: "Playback Error", description: "Could not play audio.", variant: "destructive" });
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && Number.isFinite(duration) && duration > 0) {
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (amount: number) => {
    if (audioRef.current && Number.isFinite(duration) && duration > 0) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + amount));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume > 0 ? volume : 0.5; // Restore to previous or default volume
        setIsMuted(false);
        if(volume === 0) setVolume(0.5); // if main volume was 0, set to 0.5
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };


  if (!isOpen) return null;

  const actualCoverImageUrl = coverImageUrl || `https://picsum.photos/seed/${entry.id}/1200/800`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/70 backdrop-blur-sm" />
      <DialogContent 
        className={cn(
          "bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 text-white p-0 border-0 shadow-2xl rounded-xl",
          "w-[90vw] max-w-2xl md:w-full md:max-w-md lg:max-w-lg aspect-[9/13] sm:aspect-[3/4] md:aspect-[9/12] flex flex-col overflow-hidden"
        )}
        aria-describedby="audio-player-modal-description"
      >
        <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full z-20"
            aria-label="Close player"
          >
            <X className="h-6 w-6" />
        </Button>

        <div className="relative w-full h-2/5 md:h-1/2 flex-shrink-0">
          <Image
            src={actualCoverImageUrl}
            alt={entry.title || "Journal Entry Cover"}
            layout="fill"
            objectFit="cover"
            className="opacity-50"
            data-ai-hint="abstract mood"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
        </div>
        
        <div className="flex-grow flex flex-col justify-between p-6 md:p-8 space-y-4 overflow-y-auto -mt-16 md:-mt-24 z-10 relative">
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-wider text-accent">{formatDateFns(new Date(entry.timestamp), 'MMMM d, yyyy')}</p>
            <DialogTitle id="audio-player-title" className="text-2xl md:text-3xl font-bold tracking-tight">{entry.title || "Untitled Entry"}</DialogTitle>
            {entry.summary && <DialogDescription id="audio-player-modal-description" className="text-sm text-white/70 max-w-xl mx-auto line-clamp-2">{entry.summary}</DialogDescription>}
          </div>

          <div className="space-y-3 flex-grow flex flex-col justify-center">
            <audio ref={audioRef} className="hidden" preload="metadata" />
            <Slider
              value={[currentTime]}
              max={duration || 0} // Ensure max is not undefined/null for Slider
              step={0.1}
              onValueChange={handleSeek}
              disabled={!duration || duration === 0}
              aria-label="Audio progress"
              className="[&>span:first-child>span]:bg-accent [&>span:last-child]:bg-white [&>span:last-child]:border-accent [&>span:last-child]:h-4 [&>span:last-child]:w-4 [&>span:last-child]:-top-1"
            />
            <div className="flex justify-between text-xs text-white/70 tabular-nums">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6">
            <Button variant="ghost" size="icon" onClick={() => handleSkip(-10)} disabled={!duration} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
              <Rewind className="h-6 w-6" />
              <span className="sr-only">Rewind 10 seconds</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePlayPause} 
              disabled={!entry.audioUrl || (!duration && duration !== 0)}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full w-16 h-16 md:w-20 md:h-20"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-8 w-8 md:h-10 md:w-10" /> : <Play className="h-8 w-8 md:h-10 md:w-10" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleSkip(10)} disabled={!duration} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
              <FastForward className="h-6 w-6" />
              <span className="sr-only">Fast forward 10 seconds</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              aria-label="Volume"
              className="w-full max-w-[120px] [&>span:first-child>span]:bg-accent [&>span:last-child]:bg-white [&>span:last-child]:border-accent [&>span:last-child]:h-3 [&>span:last-child]:w-3 [&>span:last-child]:-top-0.5"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
