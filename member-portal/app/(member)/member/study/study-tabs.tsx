"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { StudyAssistant } from "./study-assistant";
import { StudyNotes } from "./study-notes";
import { SavedScriptures } from "./saved-scriptures";
import { BibleNotesList } from "./bible-notes-list";

type Session = { id: string; title: string; updated_at: string };
type StudyNote = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};
type SavedScripture = {
  id: string;
  verse_id: string;
  reference: string;
  verse_text: string;
  note: string | null;
  created_at: string;
};
type BibleNote = {
  id: string;
  content: string;
  updated_at: string;
  verse_id: string;
  reference: string;
  verse_text: string;
};

export function StudyTabs({
  sessions,
  studyNotes,
  savedScriptures,
  bibleNotes,
  bibleNotesTotal,
}: {
  sessions: Session[];
  studyNotes: StudyNote[];
  savedScriptures: SavedScripture[];
  bibleNotes: BibleNote[];
  bibleNotesTotal: number;
}) {
  return (
    <Tabs defaultValue="chat" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="notes">My Notes</TabsTrigger>
        <TabsTrigger value="scriptures">
          Saved Scriptures
          {savedScriptures.length > 0 && (
            <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {savedScriptures.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="bible-notes">Bible Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        <StudyAssistant sessions={sessions} />
      </TabsContent>

      <TabsContent value="notes">
        <StudyNotes initialNotes={studyNotes} />
      </TabsContent>

      <TabsContent value="scriptures">
        <SavedScriptures initialScriptures={savedScriptures} />
      </TabsContent>

      <TabsContent value="bible-notes">
        <BibleNotesList
          initialNotes={bibleNotes}
          initialTotal={bibleNotesTotal}
        />
      </TabsContent>
    </Tabs>
  );
}
