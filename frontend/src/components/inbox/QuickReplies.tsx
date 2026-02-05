"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Plus, X, Search, Loader2, Edit2, Trash2 } from "lucide-react";

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string | null;
  category: string | null;
}

interface QuickRepliesProps {
  onSelect: (content: string) => void;
  inputValue: string;
}

export function QuickReplies({ onSelect, inputValue }: QuickRepliesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formShortcut, setFormShortcut] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inbox/canned-responses");
      const data = await res.json();
      setResponses(data || []);
    } catch (err) {
      console.error("Error fetching responses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchResponses();
    }
  }, [isOpen]);

  // Detectar atalho no input (ex: /ola)
  useEffect(() => {
    if (inputValue.startsWith("/") && inputValue.length > 1) {
      const shortcut = inputValue.toLowerCase();
      const match = responses.find(
        (r) => r.shortcut && `/${r.shortcut.toLowerCase()}` === shortcut
      );
      if (match) {
        onSelect(match.content);
      }
    }
  }, [inputValue, responses, onSelect]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        resetForm();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setShowCreate(false);
    setEditingId(null);
    setFormTitle("");
    setFormContent("");
    setFormShortcut("");
    setFormCategory("");
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/inbox/canned-responses/${editingId}`
        : "/api/inbox/canned-responses";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          shortcut: formShortcut || null,
          category: formCategory || null,
        }),
      });

      if (res.ok) {
        fetchResponses();
        resetForm();
      }
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (response: CannedResponse) => {
    setEditingId(response.id);
    setFormTitle(response.title);
    setFormContent(response.content);
    setFormShortcut(response.shortcut || "");
    setFormCategory(response.category || "");
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta resposta rápida?")) return;

    try {
      await fetch(`/api/inbox/canned-responses/${id}`, { method: "DELETE" });
      setResponses(responses.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const filteredResponses = responses.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      r.shortcut?.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar por categoria
  const grouped = filteredResponses.reduce((acc, r) => {
    const cat = r.category || "Geral";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {} as Record<string, CannedResponse[]>);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-brand-yellow"
        title="Respostas Rápidas"
      >
        <Zap className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Respostas Rápidas</h3>
            <button
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
              className="p-1 hover:bg-surface-hover rounded text-brand-pink"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {showCreate ? (
            /* Formulário de Criar/Editar */
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Título</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Saudação inicial"
                  className="w-full px-3 py-2 bg-surface-hover border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50"
                />
              </div>

              <div>
                <label className="block text-xs text-text-tertiary mb-1">Conteúdo</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Olá! Como posso ajudar você hoje?"
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-hover border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Atalho (opcional)</label>
                  <div className="flex items-center">
                    <span className="text-text-tertiary mr-1">/</span>
                    <input
                      type="text"
                      value={formShortcut}
                      onChange={(e) => setFormShortcut(e.target.value.replace(/\s/g, ""))}
                      placeholder="ola"
                      className="flex-1 px-2 py-2 bg-surface-hover border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Geral"
                    className="w-full px-3 py-2 bg-surface-hover border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetForm}
                  className="flex-1 px-3 py-2 bg-surface-hover border border-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formTitle.trim() || !formContent.trim()}
                  className="flex-1 px-3 py-2 bg-brand-gradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </div>
          ) : (
            /* Lista de Respostas */
            <>
              {/* Search */}
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar respostas..."
                    className="w-full pl-9 pr-3 py-2 bg-surface-hover border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="max-h-72 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-pink" />
                  </div>
                ) : Object.keys(grouped).length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma resposta rápida</p>
                    <p className="text-xs mt-1">Clique em + para criar</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 bg-surface-hover/50 text-xs font-medium text-text-tertiary uppercase">
                        {category}
                      </div>
                      {items.map((response) => (
                        <div
                          key={response.id}
                          className="group px-3 py-2 hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="flex-1 min-w-0"
                              onClick={() => {
                                onSelect(response.content);
                                setIsOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text-primary text-sm">
                                  {response.title}
                                </span>
                                {response.shortcut && (
                                  <span className="text-xs px-1.5 py-0.5 bg-brand-pink/20 text-brand-pink rounded font-mono">
                                    /{response.shortcut}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-text-secondary truncate mt-0.5">
                                {response.content}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(response);
                                }}
                                className="p-1 hover:bg-surface rounded text-text-tertiary hover:text-text-primary"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(response.id);
                                }}
                                className="p-1 hover:bg-red-500/20 rounded text-text-tertiary hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Dica */}
              <div className="px-3 py-2 border-t border-white/5 bg-surface-hover/30">
                <p className="text-xs text-text-tertiary">
                  💡 Digite <span className="text-brand-pink font-mono">/atalho</span> no chat para usar rapidamente
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
