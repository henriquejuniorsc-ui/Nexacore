"use client";

import { useState, useEffect } from "react";
import { Plus, Pin, Trash2, Loader2, StickyNote } from "lucide-react";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  isPinned: boolean;
  authorId: string | null;
}

interface NotesPanelProps {
  conversationId: string;
}

export function NotesPanel({ conversationId }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/notes`);
      const data = await res.json();
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [conversationId]);

  const addNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (res.ok) {
        const note = await res.json();
        setNotes([note, ...notes]);
        setNewNote("");
      }
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/inbox/conversations/${conversationId}/notes/${noteId}`, {
        method: "DELETE",
      });
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const togglePin = async (noteId: string, isPinned: boolean) => {
    try {
      await fetch(`/api/inbox/conversations/${conversationId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
      setNotes(
        notes.map((n) =>
          n.id === noteId ? { ...n, isPinned: !isPinned } : n
        )
      );
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Adicionar Nota */}
      <div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Adicione uma nota interna..."
          rows={3}
          className="w-full px-3 py-2 bg-surface-hover border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50 resize-none"
        />
        <button
          onClick={addNote}
          disabled={saving || !newNote.trim()}
          className="mt-2 w-full px-3 py-2 bg-brand-gradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Adicionar Nota
        </button>
      </div>

      {/* Lista de Notas */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-brand-pink" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-text-tertiary">
          <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma nota ainda</p>
          <p className="text-xs mt-1">Notas são internas e não aparecem para o cliente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-3 rounded-lg border transition-all group ${
                note.isPinned
                  ? "bg-brand-yellow/10 border-brand-yellow/30"
                  : "bg-surface-hover border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-text-primary whitespace-pre-wrap flex-1">
                  {note.content}
                </p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => togglePin(note.id, note.isPinned)}
                    className={`p-1 rounded transition-colors ${
                      note.isPinned
                        ? "text-brand-yellow hover:bg-brand-yellow/20"
                        : "text-text-tertiary hover:text-text-primary hover:bg-surface"
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 hover:bg-red-500/20 rounded text-text-tertiary hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                {formatDate(note.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
