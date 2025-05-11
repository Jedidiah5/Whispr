"use client";

import React, { useEffect } from 'react';
import useSpeechRecognition from '@/hooks/use-speech-recognition';
import { Button } from '@/components/ui/button';
import { JournalEntryForm } from './journal-entry-form';
import { Mic, MicOff, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { JournalEntry } from '@/lib/types';

interface VoiceInputSectionProps {
  currentTitle: string;
  onTitleChange: (title: string) => void;
  currentTranscript: string;
  onTranscriptChange: (transcript: string) => void;
  onSave: () => Promise<void>;
  onClear: () => void;
  isSavingAi: boolean;
  selectedEntry: JournalEntry | null;
  onAudioDataRecorded: (data: { audioUrl: string | null; audioDuration: number | null }) => void;
}

export function VoiceInputSection({
  currentTitle,
  onTitleChange,
  currentTranscript,
  onTranscriptChange,
  onSave,
  onClear,
  isSavingAi,
  selectedEntry,
  onAudioDataRecorded,
}: VoiceInputSectionProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    isSpeechRecognitionSupported,
    resetTranscript,
    audioUrl,
    audioDuration,
    isMicrophonePermissionGranted,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!isListening && transcript) {
      onTranscriptChange(transcript);
    } else if (isListening) {
      onTranscriptChange(transcript + interimTranscript);
    }
  }, [transcript, interimTranscript, isListening, onTranscriptChange]);

  useEffect(() => {
    onAudioDataRecorded({ audioUrl, audioDuration });
  }, [audioUrl, audioDuration, onAudioDataRecorded]);


  const handleToggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!selectedEntry) {
        onClear(); 
      }
      resetTranscript(); 
      startListening();
    }
  };
  
  const handleClearAndReset = () => {
    if (isListening) {
      stopListening();
    }
    resetTranscript();
    onClear(); 
    onAudioDataRecorded({ audioUrl: null, audioDuration: null }); 
  };

  const isDirty = selectedEntry
    ? selectedEntry.title !== currentTitle || selectedEntry.content !== currentTranscript
    : currentTitle !== '' || currentTranscript !== '';

  const getButtonText = () => {
    if (!isSpeechRecognitionSupported) return 'Recording N/A';
    if (isListening) return 'Stop Recording';
    if (isMicrophonePermissionGranted === null && !isListening) return 'Checking Mic...';
    if (isMicrophonePermissionGranted === false) return 'Mic Denied. Try Again?';
    return 'Start Recording';
  };

  // Button should be enabled to allow user to trigger permission prompt or retry.
  // Disable only if SR not supported or AI is saving.
  const isButtonDisabled = isSavingAi || !isSpeechRecognitionSupported;


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg shadow">
        <h2 className="text-xl font-semibold text-foreground">
          {isListening ? "Listening..." : (selectedEntry ? "Editing Entry" : "Ready to Record")}
          {isMicrophonePermissionGranted === null && !isListening && <Loader2 className="inline-block ml-2 h-5 w-5 animate-spin" />}
        </h2>
        {!isSpeechRecognitionSupported ? (
           <Alert variant="destructive" className="w-full sm:w-auto">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Unsupported Browser</AlertTitle>
             <AlertDescription>
               Speech recognition and audio recording may not be supported. Try Chrome or Edge.
             </AlertDescription>
           </Alert>
        ) : isMicrophonePermissionGranted === false && !isListening && speechError ? ( // Show specific error if permission denied and an attempt was made
            <Alert variant="destructive" className="w-full sm:w-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Microphone Access Denied</AlertTitle>
                <AlertDescription>
                {speechError || "Please allow microphone access in your browser settings to record."}
                </AlertDescription>
            </Alert>
        ) : (
          <Button
            onClick={handleToggleRecording}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className={`min-w-[200px] transition-all duration-300 ease-in-out transform hover:scale-105 ${
              isListening ? 'pulsating-mic' : ''
            }`}
            disabled={isButtonDisabled}
          >
            {isListening ? (
              <MicOff className="mr-2 h-5 w-5" />
            ) : (
              <Mic className="mr-2 h-5 w-5" />
            )}
            {getButtonText()}
          </Button>
        )}
      </div>

      {speechError && isMicrophonePermissionGranted !== false && ( // Show general speech errors, but not if it's a specific permission denied message shown above
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recording Issue</AlertTitle>
          <AlertDescription>{speechError}</AlertDescription>
        </Alert>
      )}
      
      <JournalEntryForm
        currentTitle={currentTitle}
        onTitleChange={onTitleChange}
        currentTranscript={currentTranscript}
        onTranscriptChange={onTranscriptChange}
        onSave={onSave}
        onClear={handleClearAndReset}
        isSaving={isSavingAi}
        isDirty={isDirty}
        selectedEntry={selectedEntry}
      />
    </div>
  );
}
