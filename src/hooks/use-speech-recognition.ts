"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSpeechRecognitionSupported: boolean;
  audioUrl: string | null;
  audioDuration: number | null;
  isMicrophonePermissionGranted: boolean | null;
}

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isMicrophonePermissionGranted, setIsMicrophonePermissionGranted] = useState<boolean | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(false);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);

  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);


  useEffect(() => {
    isMountedRef.current = true;

    const checkInitialPermission = async () => {
        if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
            try {
                const permissionName = 'microphone' as PermissionName;
                permissionStatusRef.current = await navigator.permissions.query({ name: permissionName });
                if (!isMountedRef.current) return;
                
                if (permissionStatusRef.current.state === 'granted') {
                    setIsMicrophonePermissionGranted(true);
                } else if (permissionStatusRef.current.state === 'denied') {
                    setIsMicrophonePermissionGranted(false);
                } else { 
                    setIsMicrophonePermissionGranted(null);
                }

                permissionStatusRef.current.onchange = () => {
                    if (!isMountedRef.current || !permissionStatusRef.current) return;
                    const currentPermissionState = permissionStatusRef.current.state;
                    setIsMicrophonePermissionGranted(currentPermissionState === 'granted' ? true : currentPermissionState === 'denied' ? false : null);
                    if (currentPermissionState === 'denied') {
                        setError("Microphone access denied. Please allow microphone permissions in your browser settings.");
                        // If listening, stop it
                        if (isListeningRef.current) {
                            if (recognitionRef.current) recognitionRef.current.stop();
                            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();
                            if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
                            isListeningRef.current = false;
                            setIsListening(false);
                        }
                    } else if (currentPermissionState === 'granted') {
                        setError(null); // Clear error if permission granted
                    }
                };
            } catch (e) {
                console.warn("Permissions API query for microphone failed.", e);
                if (isMountedRef.current) setIsMicrophonePermissionGranted(null); 
            }
        } else {
            if (isMountedRef.current) setIsMicrophonePermissionGranted(null);
        }
    };

    checkInitialPermission();

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setIsSpeechRecognitionSupported(true);
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      const recognition = recognitionRef.current;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
    } else {
      setIsSpeechRecognitionSupported(false);
      setError('Speech recognition not supported in this browser.');
    }

    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        if (isListeningRef.current || mediaRecorderRef.current?.state === "recording") { 
            try { recognitionRef.current.stop(); } catch(e) { console.warn("Error stopping SR on unmount", e); }
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
         try { mediaRecorderRef.current.stop(); } catch(e) { console.warn("Error stopping MR on unmount", e); }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (permissionStatusRef.current) {
        permissionStatusRef.current.onchange = null;
      }
    };
  }, []);


  useEffect(() => {
    if (!isMountedRef.current || !recognitionRef.current || !isSpeechRecognitionSupported) {
      return;
    }

    const recognition = recognitionRef.current;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isMountedRef.current) return;
      let finalTrans = '';
      let interimTrans = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTrans += event.results[i][0].transcript;
        } else {
          interimTrans += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTrans);
      setInterimTranscript(interimTrans);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!isMountedRef.current) return;
      let errorMessage = event.error;
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Audio capture failed. Ensure microphone is enabled and working.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied by browser or system. Please allow microphone permissions.';
        setIsMicrophonePermissionGranted(false); 
      } else {
        errorMessage = `Speech recognition error: ${event.error}`;
      }
      setError(errorMessage);
      console.error('Speech recognition error:', event.error, event.message);

      isListeningRef.current = false;
      setIsListening(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      } else if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
    
    recognition.onend = () => {
      if (!isMountedRef.current || !recognitionRef.current) return;
      console.log("SR native onend. isListeningRef.current:", isListeningRef.current);

      if (isListeningRef.current) {
        try {
          console.log("SR attempting to restart from onend.");
          recognitionRef.current.start();
        } catch (e) {
          console.error("SR restart failed in onend:", e);
          setError("Speech recognition stopped unexpectedly and could not restart.");
          isListeningRef.current = false;
          setIsListening(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          } else if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
        }
      } else {
        console.log("SR onend: Not restarting as isListeningRef.current is false.");
        if (mediaRecorderRef.current?.state !== "recording" && mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
      }
    };

    recognition.onstart = () => {
        if (!isMountedRef.current) return;
        console.log("SR native onstart.");
        if (!isListeningRef.current) { 
            isListeningRef.current = true;
            setIsListening(true);
        }
        setError(null); 
    };

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onstart = null;
        }
    }
  }, [isSpeechRecognitionSupported]);


  const startListening = useCallback(async () => {
    if (isListeningRef.current || !isMountedRef.current || !isSpeechRecognitionSupported) return;

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setAudioUrl(null);
    setAudioDuration(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Media devices API not supported in this browser.");
        setIsMicrophonePermissionGranted(false);
        return;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsMicrophonePermissionGranted(true); 

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && isMountedRef.current) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (!isMountedRef.current) {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            return;
        }
        if (audioChunksRef.current.length === 0) {
            console.warn("MediaRecorder stopped with no audio chunks.");
             if (mediaStreamRef.current && !isListeningRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type || 'audio/webm' });
        audioChunksRef.current = []; 

        const tempAudio = document.createElement('audio');
        const objectUrl = URL.createObjectURL(audioBlob);
        tempAudio.src = objectUrl;
        
        tempAudio.onloadedmetadata = () => {
          if (isMountedRef.current) {
            const dur = tempAudio.duration;
            if (Number.isFinite(dur)) { // Check if dur is a finite number (includes 0, can be float)
              setAudioDuration(dur); // Store the actual finite duration
            } else {
              setAudioDuration(null); // If dur is NaN, Infinity, etc.
            }
          }
          URL.revokeObjectURL(objectUrl); 
        };
        tempAudio.onerror = () => {
            console.error("Error loading audio metadata for duration.");
            URL.revokeObjectURL(objectUrl);
            if (isMountedRef.current) setAudioDuration(null); // Set to null on error
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMountedRef.current) setAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        if (!isListeningRef.current && mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
      };
      
      mediaRecorderRef.current.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          setError("Error during audio recording.");
          isListeningRef.current = false;
          setIsListening(false);
          if (recognitionRef.current) recognitionRef.current.stop(); 
      }

      mediaRecorderRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);

    } catch (err: any) {
      console.error("Error starting recording: ", err);
      let specificError = "Failed to start recording.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        specificError = 'Microphone access denied. Please allow microphone permissions.';
        setIsMicrophonePermissionGranted(false);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        specificError = 'No microphone found. Please connect a microphone.';
        setIsMicrophonePermissionGranted(false);
      } else if (err.name === 'AbortError') {
        specificError = 'Microphone access request aborted.';
      } else if (err.name === 'SecurityError') {
        specificError = 'Microphone access denied due to security settings.';
        setIsMicrophonePermissionGranted(false);
      } else if (err.name === 'TrackStartError' || err.name === 'OverconstrainedError' || err.name === 'NotReadableError') {
        specificError = 'Microphone settings are not supported or microphone is already in use.';
        setIsMicrophonePermissionGranted(false); 
      }
      setError(specificError);
      isListeningRef.current = false;
      setIsListening(false);
      if (mediaStreamRef.current) { 
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isSpeechRecognitionSupported]);

  const stopListening = useCallback(() => {
    if (!isMountedRef.current || !isListeningRef.current) return;

    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("SR stop() called by user.");
      } catch (e) {
        console.error("Error calling recognition.stop():", e);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); 
    } else if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      console.log("Media stream tracks stopped directly in stopListening.");
    }
  }, []);

  const resetTranscript = useCallback(() => {
    if (isMountedRef.current) {
      setTranscript('');
      setInterimTranscript('');
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSpeechRecognitionSupported,
    audioUrl,
    audioDuration,
    isMicrophonePermissionGranted,
  };
};

export default useSpeechRecognition;
