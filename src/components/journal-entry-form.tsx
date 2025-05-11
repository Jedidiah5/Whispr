"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, RotateCcw, Eraser } from 'lucide-react';
import type { JournalEntry } from '@/lib/types';

interface JournalEntryFormProps {
  currentTitle: string;
  onTitleChange: (title: string) => void;
  currentTranscript: string;
  onTranscriptChange: (transcript: string) => void;
  onSave: () => void;
  onClear: () => void;
  isSaving: boolean;
  isDirty: boolean; // To enable/disable save based on changes
  selectedEntry: JournalEntry | null;
}

export function JournalEntryForm({
  currentTitle,
  onTitleChange,
  currentTranscript,
  onTranscriptChange,
  onSave,
  onClear,
  isSaving,
  isDirty,
  selectedEntry,
}: JournalEntryFormProps) {
  
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{selectedEntry ? 'Edit Journal Entry' : 'New Journal Entry'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleFormSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="entry-title" className="text-sm font-medium">Title</Label>
            <Input
              id="entry-title"
              placeholder="Enter a title for your entry (or let AI suggest one)"
              value={currentTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onTitleChange(e.target.value)}
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-content" className="text-sm font-medium">Content</Label>
            <Textarea
              id="entry-content"
              placeholder="Your transcribed thoughts will appear here. You can also type directly."
              value={currentTranscript}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onTranscriptChange(e.target.value)}
              rows={10}
              className="min-h-[200px] text-base leading-relaxed"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClear} disabled={isSaving}>
            {selectedEntry ? <Eraser className="mr-2 h-4 w-4" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            {selectedEntry ? 'Clear Edit' : 'Clear Current'}
          </Button>
          <Button type="submit" disabled={isSaving || (!isDirty && !selectedEntry)} className="min-w-[120px]">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {selectedEntry ? 'Update Entry' : 'Save Entry'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
