export interface JournalEntry {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  summary?: string;
  audioUrl?: string;
  audioDuration?: number; // Duration in seconds
}
