"use client";

import { useState, useEffect } from "react";
import { X, Plus, Palette, Loader2 } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { conversations: number };
}

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTagCreated?: (tag: Tag) => void;
}

const PRESET_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Sky
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
];

export function TagManager({ isOpen, onClose, onTagCreated }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[10]);
  const [error, setError] = useState("");

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/inbox/tags");
      const data = await res.json();
      setTags(data || []);
    } catch (err) {
      console.error("Error fetching tags:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const createTag = async () => {
    if (!newTagName.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/inbox/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar tag");
      }

      const tag = await res.json();
      setTags([...tags, tag]);
      setNewTagName("");
      onTagCreated?.(tag);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    if (!confirm("Remover esta etiqueta de todas as conversas?")) return;

    try {
      await fetch(`/api/inbox/tags/${tagId}`, { method: "DELETE" });
      setTags(tags.filter((t) => t.id !== tagId));
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-text-primary">Gerenciar Etiquetas</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Criar nova tag */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nova Etiqueta
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nome da etiqueta"
                className="flex-1 px-3 py-2 bg-surface-hover border border-white/10 rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50"
                onKeyDown={(e) => e.key === "Enter" && createTag()}
              />
              <button
                onClick={createTag}
                disabled={creating || !newTagName.trim()}
                className="px-4 py-2 bg-brand-gradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Criar
              </button>
            </div>

            {/* Cores */}
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    newTagColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-surface scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>

          {/* Lista de tags */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Etiquetas Existentes
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand-pink" />
              </div>
            ) : tags.length === 0 ? (
              <p className="text-text-tertiary text-center py-8">
                Nenhuma etiqueta criada ainda
              </p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-surface-hover rounded-lg border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-text-primary font-medium">{tag.name}</span>
                      <span className="text-xs text-text-tertiary">
                        {tag._count?.conversations || 0} conversas
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="p-1 hover:bg-red-500/20 rounded text-text-tertiary hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
