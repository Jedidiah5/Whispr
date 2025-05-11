
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePenLine, Trash2, CalendarDays, MessageSquareText, PlayCircle, PauseCircle, Expand, FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { JournalEntry } from '@/lib/types';
import { format as formatDateFns } from 'date-fns';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onSelect: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onExpandAudio?: (entry: JournalEntry) => void;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0 || seconds === Infinity) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

export function JournalEntryCard({ entry, onSelect, onDelete, isSelected, onExpandAudio }: JournalEntryCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(entry.audioDuration && Number.isFinite(entry.audioDuration) ? entry.audioDuration : 0);

  const formattedDate = formatDateFns(new Date(entry.timestamp), 'MMMM d, yyyy HH:mm');
  
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    const initialDuration = entry.audioDuration && Number.isFinite(entry.audioDuration) ? entry.audioDuration : 0;
    setDuration(initialDuration);

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.currentTime = 0;
      if (entry.audioUrl) {
        // Reload source if different, or if same but not loaded (e.g. network error previously)
        if (audioElement.currentSrc !== entry.audioUrl || 
            (audioElement.currentSrc === entry.audioUrl && audioElement.readyState === HTMLMediaElement.HAVE_NOTHING)
           ) {
          audioElement.src = entry.audioUrl;
          audioElement.load();
        }
      } else {
        audioElement.removeAttribute('src');
        audioElement.load(); 
        // Check current duration state before setting to 0, to avoid unnecessary re-render if already 0
        if (duration !== 0) setDuration(0); 
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id, entry.audioUrl, entry.audioDuration]);


  const handlePlayPause = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Error playing audio in JournalEntryCard:", error);
          setIsPlaying(false); 
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (Number.isFinite(audioDuration)) {
        setDuration(audioDuration);
      } else {
        // Fallback to 0 if browser reports non-finite duration (e.g. Infinity, NaN)
        setDuration(0); 
      }
    }
  };
  
  const handleSeek = (value: number[]) => {
    if (audioRef.current && Number.isFinite(duration) && duration > 0) {
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <Card className={cn('transition-all duration-200 ease-in-out hover:shadow-xl rounded-lg', isSelected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md')}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl">{entry.title || "Untitled Entry"}</CardTitle>
                <CardDescription className="flex items-center text-xs text-muted-foreground pt-1">
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> {formattedDate}
                </CardDescription>
            </div>
            {entry.audioUrl && onExpandAudio && (
                <Button variant="ghost" size="icon" onClick={() => onExpandAudio(entry)} className="text-primary hover:bg-primary/10 rounded-full">
                    <Expand className="h-5 w-5" />
                    <span className="sr-only">Open audio player</span>
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {entry.summary && (
          <div className="flex items-start">
            <MessageSquareText className="mr-2 h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground italic line-clamp-3">{entry.summary}</p>
          </div>
        )}
        
        {entry.content && (!entry.summary || entry.content.length < 150 ) && ( 
           <div className="flex items-start">
            <FileText className="mr-2 h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
             <p className="text-sm text-foreground line-clamp-4">
               {entry.content}
             </p>
           </div>
        )}

        {entry.content && entry.summary && entry.content.length >= 150 && (
           <div className="flex items-start pt-2 border-t border-border/50">
            <FileText className="mr-2 h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
             <p className="text-sm text-muted-foreground line-clamp-2 italic">
               Full content preview: {entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '')}
             </p>
           </div>
        )}


        {entry.audioUrl && (
          <div className="mt-3 pt-3 border-t">
            <div className="bg-card p-3 rounded-lg shadow-inner border border-border/70">
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="hidden" 
                preload="metadata"
                // src is set in useEffect to manage loading logic
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  className="rounded-full hover:bg-primary/10 p-1"
                  disabled={!entry.audioUrl} // Enable if audioUrl exists, even if duration is initially 0
                  aria-label={isPlaying ? "Pause recording" : "Play recording"}
                >
                  {isPlaying ? <PauseCircle className="h-8 w-8 text-primary" /> : <PlayCircle className="h-8 w-8 text-primary" />}
                </Button>
                <div className="flex-grow flex items-center gap-2">
                    <span className="text-xs w-12 text-center text-muted-foreground tabular-nums">{formatDuration(currentTime)}</span>
                    <Slider
                        value={[currentTime]}
                        max={duration > 0 ? duration : 0} // Ensure max is non-negative
                        step={0.1}
                        onValueChange={handleSeek}
                        className="flex-grow h-2 data-[disabled=true]:opacity-50"
                        disabled={!entry.audioUrl || !Number.isFinite(duration) || duration <= 0} // Disable slider if no url or duration is 0 or less or not finite
                        aria-label="Audio progress"
                    />
                    <span className="text-xs w-12 text-center text-muted-foreground tabular-nums">{formatDuration(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
         {!entry.summary && !entry.content && !entry.audioUrl && (
          <p className="text-sm text-muted-foreground italic">This entry appears to be empty.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">
        <Button variant="outline" size="sm" onClick={() => onSelect(entry)} className="rounded-md">
          <FilePenLine className="mr-2 h-4 w-4" /> Edit / View
        </Button>
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
           <AlertDialogTrigger asChild>
             <Button variant="destructive" size="sm" className="rounded-md">
               <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
           </AlertDialogTrigger>
          <AlertDialogContent className="rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the journal entry titled "{entry.title || "Untitled Entry"}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)} className="rounded-md">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDelete(entry.id);
                  setShowDeleteConfirm(false); 
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

