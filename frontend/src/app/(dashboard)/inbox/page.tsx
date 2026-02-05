"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  MessageSquare, 
  Flame, 
  Thermometer, 
  Snowflake,
  Plus,
  RefreshCw,
  User,
  LayoutGrid,
  Kanban,
  Settings,
  Filter,
  X
} from "lucide-react";
import { TagManager } from "@/components/inbox/TagManager";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  status: string;
  channel: string;
  aiEnabled: boolean;
  messageCount: number;
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  score: number;
  temperature: "COLD" | "WARM" | "HOT";
  client: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  assignedTo: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: { conversations: number };
}

export default function InboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [temperatureFilter, setTemperatureFilter] = useState("ALL");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (temperatureFilter !== "ALL") params.set("temperature", temperatureFilter);
      if (selectedTagId) params.set("tagId", selectedTagId);

      const res = await fetch(`/api/inbox/conversations?${params}`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/inbox/tags");
      const data = await res.json();
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchTags();
  }, [statusFilter, temperatureFilter, selectedTagId]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchConversations();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case "HOT":
        return <Flame className="w-4 h-4 text-red-500" />;
      case "WARM":
        return <Thermometer className="w-4 h-4 text-orange-500" />;
      default:
        return <Snowflake className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: "bg-green-500/20 text-green-400 border border-green-500/30",
      PENDING: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      RESOLVED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      CLOSED: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    };
    return styles[status] || styles.OPEN;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return "Agora";
  };

  const handleTagCreated = () => {
    fetchTags();
  };

  const activeFiltersCount = [
    statusFilter !== "ALL",
    temperatureFilter !== "ALL",
    selectedTagId !== null
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("ALL");
    setTemperatureFilter("ALL");
    setSelectedTagId(null);
  };

  const FiltersContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-white/10 lg:hidden">
          <h2 className="font-heading font-semibold text-lg text-text-primary">Filtros</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg text-text-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="font-heading font-semibold text-lg mb-4 text-text-primary hidden lg:block">
          Inbox
        </h2>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="w-full mb-4 px-3 py-2 text-sm text-brand-pink hover:bg-brand-pink/10 rounded-lg transition-colors text-left"
          >
            Limpar filtros ({activeFiltersCount})
          </button>
        )}

        <div className="mb-4">
          <p className="text-xs font-medium text-text-tertiary uppercase mb-2">Status</p>
          <div className="space-y-1">
            {[
              { value: "ALL", label: "Todas" },
              { value: "OPEN", label: "Abertas" },
              { value: "PENDING", label: "Pendentes" },
              { value: "RESOLVED", label: "Resolvidas" },
              { value: "CLOSED", label: "Fechadas" },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => {
                  setStatusFilter(status.value);
                  if (onClose && window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                  statusFilter === status.value
                    ? "bg-brand-gradient text-white shadow-glow"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-text-tertiary uppercase mb-2">Lead Score</p>
          <div className="space-y-1">
            {[
              { value: "ALL", label: "Todos", icon: null },
              { value: "HOT", label: "Quente", icon: <Flame className="w-4 h-4 text-red-500" /> },
              { value: "WARM", label: "Morno", icon: <Thermometer className="w-4 h-4 text-orange-500" /> },
              { value: "COLD", label: "Frio", icon: <Snowflake className="w-4 h-4 text-blue-400" /> },
            ].map((temp) => (
              <button
                key={temp.value}
                onClick={() => {
                  setTemperatureFilter(temp.value);
                  if (onClose && window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                  temperatureFilter === temp.value
                    ? "bg-brand-gradient text-white shadow-glow"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                {temp.icon}
                {temp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-text-tertiary uppercase">Etiquetas</p>
            <button 
              onClick={() => setShowTagManager(true)}
              className="text-brand-pink hover:text-brand-orange transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                setSelectedTagId(null);
                if (onClose && window.innerWidth < 1024) onClose();
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                !selectedTagId
                  ? "bg-brand-gradient text-white shadow-glow"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              Todas
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  setSelectedTagId(tag.id);
                  if (onClose && window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                  selectedTagId === tag.id
                    ? "bg-brand-gradient text-white shadow-glow"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">{tag.name}</span>
                <span className="ml-auto text-xs text-text-tertiary">
                  {tag._count.conversations}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {onClose && (
        <div className="p-4 border-t border-white/10 lg:hidden">
          <button
            onClick={onClose}
            className="w-full py-3 bg-brand-gradient text-white rounded-lg font-medium"
          >
            Ver Resultados
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-4">
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-white/10 transform transition-transform duration-300 lg:relative lg:transform-none lg:w-64 lg:flex-shrink-0 lg:rounded-xl lg:border",
          showFilters ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <FiltersContent onClose={() => setShowFilters(false)} />
      </aside>

      <div className="flex-1 bg-surface rounded-xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-white/10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className={cn(
                  "lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                  activeFiltersCount > 0 
                    ? "bg-brand-pink/20 border-brand-pink/50 text-brand-pink"
                    : "bg-surface-hover border-white/10 text-text-secondary"
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand-pink text-white text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="flex items-center bg-surface-hover rounded-lg p-1 border border-white/10">
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm bg-brand-gradient text-white shadow-glow"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
                <button
                  onClick={() => router.push("/inbox/kanban")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Kanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-hover border border-white/10 rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50 focus:ring-1 focus:ring-brand-pink/50 transition-all text-sm"
                />
              </div>

              <button
                onClick={() => setShowTagManager(true)}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
                title="Gerenciar Etiquetas"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={fetchConversations}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
              >
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 text-brand-pink animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary p-4">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p className="text-center">Nenhuma conversa encontrada</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-brand-pink text-sm hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/inbox/${conv.id}`)}
                  className={cn(
                    "p-3 sm:p-4 hover:bg-surface-hover cursor-pointer transition-all active:bg-surface-hover/80",
                    conv.unreadCount > 0 && "bg-brand-pink/5 border-l-2 border-brand-pink"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-gradient flex items-center justify-center text-white font-medium flex-shrink-0">
                      {conv.client.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-medium text-text-primary truncate max-w-[150px] sm:max-w-none">
                          {conv.client.name}
                        </span>
                        {getTemperatureIcon(conv.temperature)}
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full hidden sm:inline-block",
                          getStatusBadge(conv.status)
                        )}>
                          {conv.status}
                        </span>
                        {!conv.aiEnabled && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="hidden sm:inline">Humano</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        {conv.lastMessagePreview || "Sem mensagens"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {conv.tags.slice(0, 2).map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                              border: `1px solid ${tag.color}40`,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {conv.tags.length > 2 && (
                          <span className="text-xs text-text-tertiary">
                            +{conv.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-text-tertiary">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-brand-pink text-white text-xs px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                      <span className="text-xs text-text-tertiary hidden sm:block">
                        Score: <span className="text-brand-yellow font-mono">{conv.score}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TagManager 
        isOpen={showTagManager} 
        onClose={() => setShowTagManager(false)} 
        onTagCreated={handleTagCreated}
      />
    </div>
  );
}