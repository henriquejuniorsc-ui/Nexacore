"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  RefreshCw,
  Flame,
  Thermometer,
  Snowflake,
  MessageSquare,
  ArrowLeft,
  LayoutGrid,
  Kanban,
  GripVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
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
}

const COLUMNS = [
  { id: "OPEN", label: "Abertas", color: "bg-green-500", textColor: "text-green-400" },
  { id: "PENDING", label: "Pendentes", color: "bg-yellow-500", textColor: "text-yellow-400" },
  { id: "RESOLVED", label: "Resolvidas", color: "bg-blue-500", textColor: "text-blue-400" },
  { id: "CLOSED", label: "Fechadas", color: "bg-gray-500", textColor: "text-gray-400" },
];

export default function KanbanPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState(0);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inbox/conversations?limit=100");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const getConversationsByStatus = (status: string) => {
    return conversations.filter((c) => c.status === status);
  };

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case "HOT":
        return <Flame className="w-3.5 h-3.5 text-red-500" />;
      case "WARM":
        return <Thermometer className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <Snowflake className="w-3.5 h-3.5 text-blue-400" />;
    }
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

  const handleDragStart = (e: React.DragEvent, conversationId: string) => {
    setDraggingId(conversationId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggingId) return;

    const conversation = conversations.find((c) => c.id === draggingId);
    if (!conversation || conversation.status === newStatus) {
      setDraggingId(null);
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === draggingId ? { ...c, status: newStatus } : c))
    );

    try {
      await fetch(`/api/inbox/conversations/${draggingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Error updating status:", error);
      fetchConversations();
    }

    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const scrollToColumn = (index: number) => {
    if (scrollRef.current) {
      const columnWidth = scrollRef.current.scrollWidth / COLUMNS.length;
      scrollRef.current.scrollTo({
        left: columnWidth * index,
        behavior: "smooth"
      });
      setActiveColumn(index);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const columnWidth = scrollRef.current.scrollWidth / COLUMNS.length;
      const newIndex = Math.round(scrollRef.current.scrollLeft / columnWidth);
      setActiveColumn(newIndex);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/inbox")}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-xl sm:text-2xl text-text-primary">
            Kanban
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface rounded-lg p-1 border border-white/10">
            <button
              onClick={() => router.push("/inbox")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm bg-brand-gradient text-white shadow-glow"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <button
            onClick={fetchConversations}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 lg:hidden">
        <button
          onClick={() => scrollToColumn(Math.max(0, activeColumn - 1))}
          disabled={activeColumn === 0}
          className="p-2 hover:bg-surface-hover rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        
        <div className="flex items-center gap-2">
          {COLUMNS.map((col, index) => (
            <button
              key={col.id}
              onClick={() => scrollToColumn(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                activeColumn === index ? col.color : "bg-white/20"
              )}
            />
          ))}
        </div>

        <button
          onClick={() => scrollToColumn(Math.min(COLUMNS.length - 1, activeColumn + 1))}
          disabled={activeColumn === COLUMNS.length - 1}
          className="p-2 hover:bg-surface-hover rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-brand-pink animate-spin" />
        </div>
      ) : (
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory lg:snap-none pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {COLUMNS.map((column) => {
            const columnConversations = getConversationsByStatus(column.id);
            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                className={cn(
                  "flex-shrink-0 w-[85vw] sm:w-[300px] lg:flex-1 lg:w-auto lg:min-w-[250px] flex flex-col bg-surface rounded-xl border transition-colors snap-center",
                  dragOverColumn === column.id
                    ? "border-brand-pink"
                    : "border-white/10"
                )}
              >
                <div className="p-3 sm:p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", column.color)} />
                      <span className="font-medium text-text-primary text-sm sm:text-base">
                        {column.label}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs sm:text-sm font-mono px-2 py-0.5 rounded-full bg-surface-hover",
                      column.textColor
                    )}>
                      {columnConversations.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                  {columnConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm text-center">Nenhuma conversa</p>
                    </div>
                  ) : (
                    columnConversations.map((conv) => (
                      <div
                        key={conv.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, conv.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => router.push(`/inbox/${conv.id}`)}
                        className={cn(
                          "p-3 bg-surface-hover rounded-lg cursor-pointer transition-all hover:bg-surface-hover/80 active:scale-[0.98]",
                          draggingId === conv.id && "opacity-50 scale-95",
                          conv.unreadCount > 0 && "border-l-2 border-brand-pink"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {conv.client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-text-primary text-sm truncate">
                                {conv.client.name}
                              </p>
                              <div className="flex items-center gap-1.5">
                                {getTemperatureIcon(conv.temperature)}
                                <span className="text-xs text-text-tertiary">
                                  {formatTime(conv.lastMessageAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="hidden sm:block cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary">
                            <GripVertical className="w-4 h-4" />
                          </div>
                        </div>

                        <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                          {conv.lastMessagePreview || "Sem mensagens"}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 flex-wrap">
                            {conv.tags.slice(0, 2).map(({ tag }) => (
                              <span
                                key={tag.id}
                                className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${tag.color}20`,
                                  color: tag.color,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {conv.unreadCount > 0 && (
                              <span className="bg-brand-pink text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                {conv.unreadCount}
                              </span>
                            )}
                            <span className="text-[10px] text-text-tertiary font-mono">
                              {conv.score}pts
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}