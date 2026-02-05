"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Check, X, Loader2 } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  conversationId: string;
  currentTags: Array<{ id: string; tag: Tag }>;
  onTagsChange: (tags: Array<{ id: string; tag: Tag }>) => void;
}

export function TagSelector({ conversationId, currentTags, onTagsChange }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/inbox/tags");
      const data = await res.json();
      setAllTags(data || []);
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = async (tagId: string) => {
    setAdding(tagId);
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });

      if (res.ok) {
        const tag = allTags.find((t) => t.id === tagId);
        if (tag) {
          onTagsChange([...currentTags, { id: `temp-${tagId}`, tag }]);
        }
      }
    } catch (err) {
      console.error("Error adding tag:", err);
    } finally {
      setAdding(null);
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/tags/${tagId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onTagsChange(currentTags.filter((t) => t.tag.id !== tagId));
      }
    } catch (err) {
      console.error("Error removing tag:", err);
    }
  };

  const currentTagIds = currentTags.map((t) => t.tag.id);
  const availableTags = allTags.filter((t) => !currentTagIds.includes(t.id));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tags atuais */}
      <div className="flex flex-wrap gap-2">
        {currentTags.map(({ tag }) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm group"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              border: `1px solid ${tag.color}40`,
            }}
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="opacity-0 group-hover:opacity-100 hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Botão de adicionar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border border-dashed border-white/20 text-text-tertiary hover:text-text-secondary hover:border-white/40 transition-all"
        >
          <Plus className="w-3 h-3" />
          Adicionar
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {availableTags.length === 0 ? (
            <div className="p-3 text-center text-text-tertiary text-sm">
              {allTags.length === 0 ? "Nenhuma etiqueta criada" : "Todas as etiquetas já adicionadas"}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag.id)}
                  disabled={adding === tag.id}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-text-primary text-sm flex-1 text-left">{tag.name}</span>
                  {adding === tag.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}