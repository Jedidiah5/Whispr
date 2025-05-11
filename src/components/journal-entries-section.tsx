
"use client";

import { JournalEntryCard } from './journal-entry-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { JournalEntry } from '@/lib/types';
import { BookOpenText, CalendarX2 } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface JournalEntriesSectionProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  selectedEntryId: string | null;
  selectedDate: Date | undefined; 
  className?: string;
}

export function JournalEntriesSection({
  entries,
  onSelectEntry,
  onDeleteEntry,
  selectedEntryId,
  selectedDate,
  className,
}: JournalEntriesSectionProps) {

  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  const filteredEntries = selectedDate
    ? sortedEntries.filter(entry => isSameDay(new Date(entry.timestamp), selectedDate))
    : sortedEntries;

  if (entries.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed rounded-lg bg-card", className)}>
        <BookOpenText className="w-16 h-16 mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-foreground">No Journal Entries Yet</h3>
        <p className="text-muted-foreground">Start recording your thoughts to see them here.</p>
      </div>
    );
  }

  if (selectedDate && filteredEntries.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed rounded-lg bg-card", className)}>
        <CalendarX2 className="w-16 h-16 mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-foreground">No Entries for Selected Date</h3>
        <p className="text-muted-foreground">There are no journal entries for {selectedDate.toLocaleDateString()}.</p>
      </div>
    );
  }


  return (
    <div className={cn("flex flex-col", className)}> 
      <ScrollArea className="flex-grow"> 
        <div className="space-y-4 p-1"> {/* Added p-1 for slight padding around cards inside scroll area */}
          {filteredEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onSelect={onSelectEntry}
              onDelete={onDeleteEntry}
              isSelected={entry.id === selectedEntryId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

