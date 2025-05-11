

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '@/components/header';
import { VoiceInputSection } from '@/components/voice-input-section';
import { JournalEntriesSection } from '@/components/journal-entries-section';
import { CalendarFilter } from '@/components/calendar-filter';
import useLocalStorage from '@/hooks/use-local-storage';
import type { JournalEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateEntryTitle } from '@/ai/flows/generate-entry-title';
import { summarizeJournalEntry } from '@/ai/flows/summarize-journal-entry';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FilterX, CalendarDays, Archive, Expand } from 'lucide-react';
import { AudioPlayerModal } from '@/components/audio-player-modal';


export default function JournalPage() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('journalEntries', []);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentAudio, setCurrentAudio] = useState<{ url: string | null; duration: number | null }>({ url: null, duration: null });
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isEntriesModalOpen, setIsEntriesModalOpen] = useState(false);
  const [isAudioPlayerModalOpen, setIsAudioPlayerModalOpen] = useState(false);
  const [entryForAudioPlayer, setEntryForAudioPlayer] = useState<JournalEntry | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAudioDataRecorded = useCallback((data: { audioUrl: string | null; audioDuration: number | null }) => {
    setCurrentAudio({ url: data.audioUrl, duration: data.audioDuration });
  }, []);

  const handleSelectEntry = useCallback((entry: JournalEntry) => {
    setSelectedEntry(entry);
    setCurrentTitle(entry.title);
    setCurrentTranscript(entry.content);
    setCurrentAudio({ url: entry.audioUrl || null, duration: entry.audioDuration || null });
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0,0,0,0); 
    setSelectedCalendarDate(entryDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearForm = useCallback(() => {
    setSelectedEntry(null);
    setCurrentTitle('');
    setCurrentTranscript('');
    setCurrentAudio({ url: null, duration: null });
    // setSelectedCalendarDate(undefined); // Keep date filter if user wants to add new entry for that date
  }, []);

  const handleSaveEntry = async () => {
    if (!currentTranscript.trim() && !currentTitle.trim() && !selectedEntry?.id && !currentAudio.url) {
      toast({
        title: "Empty Entry",
        description: "Cannot save an empty journal entry.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAI(true);
    let titleToSave = currentTitle.trim();
    let summaryToSave: string | undefined = undefined;

    try {
      if (!titleToSave && currentTranscript.trim()) {
        const titleResult = await generateEntryTitle({ entryContent: currentTranscript });
        titleToSave = titleResult.title;
      }
      if (currentTranscript.trim()) {
        const summaryResult = await summarizeJournalEntry({ journalEntry: currentTranscript });
        summaryToSave = summaryResult.summary;
      }
    } catch (error) {
      console.error("AI operation failed:", error);
      toast({
        title: "AI Processing Error",
        description: "Could not generate title or summary. Entry will be saved without it.",
        variant: "destructive",
      });
    }
    
    const entryData: Omit<JournalEntry, 'id' | 'timestamp'> = {
      title: titleToSave || "Untitled Entry",
      content: currentTranscript,
      summary: summaryToSave,
      audioUrl: currentAudio.url || undefined,
      audioDuration: currentAudio.duration || undefined,
    };

    const timestamp = selectedEntry?.timestamp ? selectedEntry.timestamp : Date.now(); 
    const finalTimestamp = selectedCalendarDate && !selectedEntry ? selectedCalendarDate.getTime() : timestamp;


    if (selectedEntry) {
      const updatedEntry = { ...selectedEntry, ...entryData, timestamp: finalTimestamp }; 
      setEntries(prevEntries =>
        prevEntries.map(e => (e.id === selectedEntry.id ? updatedEntry : e))
      );
      toast({ title: "Entry Updated", description: "Your journal entry has been updated." });
    } else {
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        timestamp: finalTimestamp, 
        ...entryData,
      };
      setEntries(prevEntries => [newEntry, ...prevEntries].sort((a,b) => b.timestamp - a.timestamp));
      toast({ title: "Entry Saved", description: "Your new journal entry has been saved." });
    }

    setIsLoadingAI(false);
    handleClearForm();
  };

  const handleDeleteEntry = useCallback((id: string) => {
    setEntries(prevEntries => prevEntries.filter(e => e.id !== id));
    if (selectedEntry?.id === id) {
      handleClearForm();
    }
    toast({ title: "Entry Deleted", description: "The journal entry has been removed." });
  }, [selectedEntry, setEntries, handleClearForm, toast]);

  const entryDates = useMemo(() => {
    return entries.map(entry => {
        const date = new Date(entry.timestamp);
        date.setHours(0,0,0,0); 
        return date;
    });
  }, [entries]);
  
  const handleClearDateFilter = () => {
    setSelectedCalendarDate(undefined);
  };

  const handleOpenAudioPlayer = (entry: JournalEntry) => {
    setEntryForAudioPlayer(entry);
    setIsAudioPlayerModalOpen(true);
  };


  if (!isMounted) {
    return ( 
      <div className="min-h-screen flex flex-col bg-background items-center justify-center">
        <p className="text-foreground text-lg">Loading Whispr...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="flex flex-wrap gap-4 mb-6 items-center">
            <Button variant="outline" onClick={() => setIsCalendarModalOpen(true)} className="shadow-sm rounded-lg">
                <CalendarDays className="mr-2 h-5 w-5 text-primary" /> View Journal Calendar
            </Button>
            <Button variant="outline" onClick={() => setIsEntriesModalOpen(true)} className="shadow-sm rounded-lg">
                <Archive className="mr-2 h-5 w-5 text-primary" /> View Past Entries
            </Button>
            {selectedCalendarDate && (
            <Button
                variant="destructive"
                onClick={handleClearDateFilter}
                className="shadow-sm rounded-lg"
            >
                <FilterX className="mr-2 h-4 w-4" /> Clear Filter ({selectedCalendarDate.toLocaleDateString()})
            </Button>
            )}
        </div>

        <section className="space-y-6">
          <VoiceInputSection
            currentTitle={currentTitle}
            onTitleChange={setCurrentTitle}
            currentTranscript={currentTranscript}
            onTranscriptChange={setCurrentTranscript}
            onSave={handleSaveEntry}
            onClear={handleClearForm}
            isSavingAi={isLoadingAI}
            selectedEntry={selectedEntry}
            onAudioDataRecorded={handleAudioDataRecorded}
          />
        </section>

        {/* Calendar Modal */}
        <Dialog open={isCalendarModalOpen} onOpenChange={setIsCalendarModalOpen}>
          <DialogContent className="sm:max-w-[425px] md:max-w-md lg:max-w-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Journal Calendar</DialogTitle>
              <DialogDescription>Select a day to filter entries. Days with entries are highlighted.</DialogDescription>
            </DialogHeader>
            <CalendarFilter
              selectedDate={selectedCalendarDate}
              onDateChange={(date) => {
                setSelectedCalendarDate(date);
              }}
              entryDates={entryDates}
            />
            {selectedCalendarDate && (
                <Button
                    variant="outline"
                    onClick={() => {
                        handleClearDateFilter();
                    }}
                    className="w-full mt-4 rounded-md"
                >
                    <FilterX className="mr-2 h-4 w-4" /> Clear Date Filter
                </Button>
            )}
            <DialogFooter className="mt-2">
                <Button variant="ghost" onClick={() => setIsCalendarModalOpen(false)} className="rounded-md">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Entries Modal */}
        <Dialog open={isEntriesModalOpen} onOpenChange={setIsEntriesModalOpen}>
          <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[80vh] flex flex-col rounded-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedCalendarDate ? `Entries for ${selectedCalendarDate.toLocaleDateString()}` : "All Past Entries"}
              </DialogTitle>
              <DialogDescription>
                {selectedCalendarDate ? `Browse your journal entries for the selected date.` : `Browse all your past journal entries.`}
                {entries.length > 0 && !selectedCalendarDate && ` You have ${entries.length} entries in total.`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedCalendarDate && entries.length > 0 && ( // Only show if a date is selected and there are entries to filter from
              <Button
                variant="outline"
                onClick={handleClearDateFilter}
                className="my-4 w-full sm:w-auto self-start rounded-md"
              >
                <FilterX className="mr-2 h-4 w-4" /> Clear Date Filter ({selectedCalendarDate.toLocaleDateString()})
              </Button>
            )}
            
            <JournalEntriesSection
              className="flex-grow min-h-0" // Ensures section grows and scrollbar works within DialogContent
              entries={entries}
              onSelectEntry={(entry) => {
                handleSelectEntry(entry);
                setIsEntriesModalOpen(false); 
              }}
              onDeleteEntry={handleDeleteEntry}
              selectedEntryId={selectedEntry?.id || null}
              selectedDate={selectedCalendarDate}
              onExpandAudio={handleOpenAudioPlayer}
            />
            <DialogFooter className="mt-4 pt-4 border-t">
                <Button variant="ghost" onClick={() => setIsEntriesModalOpen(false)} className="rounded-md">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audio Player Modal */}
        {entryForAudioPlayer && (
          <AudioPlayerModal
            isOpen={isAudioPlayerModalOpen}
            onClose={() => setIsAudioPlayerModalOpen(false)}
            entry={entryForAudioPlayer}
            // coverImageUrl="https://picsum.photos/seed/abstract/1200/800" // Optional: pass a specific cover image
          />
        )}

      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-8">
        © {new Date().getFullYear()} Whispr. Crafted with care.
      </footer>
    </div>
  );
}

