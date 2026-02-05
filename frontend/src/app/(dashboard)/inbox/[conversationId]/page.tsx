"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Paperclip,
  MoreVertical,
  User,
  Bot,
  Flame,
  Thermometer,
  Snowflake,
  Tag,
  StickyNote,
  X,
  Loader2,
  MessageSquare,
  Check,
  CheckCheck,
  Info,
  Wifi,
  WifiOff
} from "lucide-react";
import { TagSelector } from "@/components/inbox/TagSelector";
import { NotesPanel } from "@/components/inbox/NotesPanel";
import { QuickReplies } from "@/components/inbox/QuickReplies";
import { TypingBubble } from "@/components/inbox/TypingIndicator";
import { useInboxRealtime } from "@/hooks/useInboxRealtime";
import { MessagePayload } from "@/lib/socket/events";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  direction: "INBOUND" | "OUTBOUND";
  senderType: "CLIENT" | "AI" | "HUMAN";
  status: string;
  createdAt: string;
}

interface ConversationTag {
  id: string;
  tag: {
    id: string;
    name: string;
    color: string;
  };
}

interface Conversation {
  id: string;
  status: string;
  channel: string;
  aiEnabled: boolean;
  score: number;
  temperature: "COLD" | "WARM" | "HOT";
  unreadCount: number;
  client: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    birthDate: string | null;
    notes: string | null;
    createdAt: string;
  };
  tags: ConversationTag[];
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  // ============================================
  // WEBSOCKET INTEGRATION
  // ============================================

  const handleNewMessage = useCallback((message: MessagePayload) => {
    // Converter payload para formato local
    const newMsg: Message = {
      id: message.id,
      content: message.content,
      direction: message.direction,
      senderType: message.senderType,
      status: message.status,
      createdAt: message.createdAt,
    };

    // Adicionar mensagem se não existir
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  }, []);

  const handleConversationUpdate = useCallback((update: any) => {
    setConversation((prev) => {
      if (!prev) return prev;
      return { ...prev, ...update.changes };
    });
  }, []);

  const {
    typingUsers,
    isConnected,
    startTyping,
    stopTyping,
    markAsRead,
  } = useInboxRealtime({
    conversationId,
    onNewMessage: handleNewMessage,
    onConversationUpdate: handleConversationUpdate,
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  // ============================================
  // SMART SCROLL - só scroll se user está no bottom
  // ============================================

  const checkIsNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150; // px from bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewMessages(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    isNearBottomRef.current = checkIsNearBottom();
    if (isNearBottomRef.current) {
      setHasNewMessages(false);
    }
  }, [checkIsNearBottom]);

  const fetchConversation = async () => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}`);
      const data = await res.json();
      setConversation(data);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchConversation();
    fetchMessages();
  }, [conversationId]);

  // Polling fallback when WebSocket is not connected
  useEffect(() => {
    // Se WebSocket estiver conectado, não fazer polling
    if (isConnected) return;

    // Polling a cada 5 segundos como fallback
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, conversationId]);

  // Scroll on new messages (smart - only if near bottom)
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    // No new messages (polling refresh with same data) - skip
    if (currentCount === prevCount) return;

    // Initial load - always scroll to bottom
    if (prevCount === 0 && currentCount > 0) {
      // Use setTimeout to ensure DOM has rendered
      setTimeout(() => scrollToBottom(true), 50);
      return;
    }

    // New message arrived
    if (currentCount > prevCount) {
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage?.direction === "OUTBOUND";

      if (isOwnMessage) {
        // Always scroll for own messages
        scrollToBottom(true);
      } else if (isNearBottomRef.current) {
        // Scroll if user is near bottom
        scrollToBottom();
      } else {
        // User scrolled up - show "new messages" badge
        setHasNewMessages(true);
      }
    }
  }, [messages, scrollToBottom]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && conversation?.unreadCount && conversation.unreadCount > 0) {
      const unreadIds = messages
        .filter((m) => m.direction === "INBOUND")
        .slice(-conversation.unreadCount)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
        // Also update via API
        fetch(`/api/inbox/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAsRead: true }),
        }).catch(console.error);
      }
    }
  }, [messages, conversation?.unreadCount, conversationId, markAsRead]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    // Stop typing indicator
    stopTyping();

    setSending(true);

    // Optimistic update - add message immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      direction: "OUTBOUND",
      senderType: "HUMAN",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace optimistic message with real one
        if (data.message && data.message.createdAt) {
          setMessages((prev) =>
            prev.map((m) => m.id === optimisticMessage.id ? data.message : m)
          );
        } else {
          // Se não tiver formato esperado, manter a mensagem otimista com status SENT
          console.warn('[Chat] Unexpected API response:', data);
          setMessages((prev) =>
            prev.map((m) => m.id === optimisticMessage.id ? { ...m, status: "SENT" } : m)
          );
        }
      } else {
        // Mark as failed
        setMessages((prev) =>
          prev.map((m) => m.id === optimisticMessage.id ? { ...m, status: "FAILED" } : m)
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticMessage.id ? { ...m, status: "FAILED" } : m)
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Trigger typing indicator
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleQuickReply = (content: string) => {
    setNewMessage(content);
    inputRef.current?.focus();
    startTyping();
  };

  const toggleAI = async () => {
    if (!conversation) return;

    try {
      await fetch(`/api/inbox/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled: !conversation.aiEnabled }),
      });
      fetchConversation();
    } catch (error) {
      console.error("Error toggling AI:", error);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READ":
        return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
      case "DELIVERED":
        return <CheckCheck className="w-3.5 h-3.5 text-text-tertiary" />;
      case "SENT":
        return <Check className="w-3.5 h-3.5 text-text-tertiary" />;
      case "PENDING":
        return <Loader2 className="w-3.5 h-3.5 text-text-tertiary animate-spin" />;
      case "FAILED":
        return <X className="w-3.5 h-3.5 text-red-500" />;
      default:
        return null;
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    // Proteção contra mensagens sem createdAt
    if (!message || !message.createdAt) {
      console.warn('[Chat] Message without createdAt:', message);
      return groups;
    }
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-8 h-8 text-brand-pink animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-text-tertiary">
        <MessageSquare className="w-12 h-12 mb-4" />
        <p>Conversa não encontrada</p>
        <button
          onClick={() => router.push("/inbox")}
          className="mt-4 text-brand-pink hover:underline"
        >
          Voltar para o Inbox
        </button>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface rounded-xl border border-white/10 overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/inbox")}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold flex-shrink-0">
              {conversation.client.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-semibold text-text-primary truncate">
                  {conversation.client.name}
                </h2>
                {getTemperatureIcon(conversation.temperature)}
                {/* Connection status */}
                {isConnected ? (
                  <span title="Conectado em tempo real">
                    <Wifi className="w-3.5 h-3.5 text-green-500" />
                  </span>
                ) : (
                  <span title="Desconectado">
                    <WifiOff className="w-3.5 h-3.5 text-text-tertiary" />
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary truncate">
                {conversation.client.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleAI}
              className={cn(
                "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                conversation.aiEnabled
                  ? "bg-brand-pink/20 text-brand-pink"
                  : "bg-surface-hover text-text-tertiary"
              )}
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">IA {conversation.aiEnabled ? "On" : "Off"}</span>
            </button>

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4 relative"
        >
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex justify-center mb-4">
                <span className="px-3 py-1 bg-surface-hover rounded-full text-xs text-text-tertiary">
                  {formatDate(msgs[0].createdAt)}
                </span>
              </div>

              {msgs.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex mb-3",
                    message.direction === "OUTBOUND" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5",
                      message.direction === "OUTBOUND"
                        ? "bg-brand-gradient text-white rounded-br-md"
                        : "bg-surface-hover text-text-primary rounded-bl-md"
                    )}
                  >
                    {message.direction === "INBOUND" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        {message.senderType === "AI" ? (
                          <Bot className="w-3.5 h-3.5 text-brand-pink" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-text-tertiary" />
                        )}
                        <span className="text-xs text-text-tertiary">
                          {message.senderType === "AI" ? "Assistente IA" : conversation.client.name}
                        </span>
                        {message.content.startsWith("🎤") && (
                          <span className="text-[10px] text-text-tertiary bg-surface px-1.5 py-0.5 rounded-full">
                            áudio transcrito
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>

                    <div className={cn(
                      "flex items-center gap-1 mt-1",
                      message.direction === "OUTBOUND" ? "justify-end" : "justify-start"
                    )}>
                      <span className={cn(
                        "text-[10px]",
                        message.direction === "OUTBOUND" ? "text-white/70" : "text-text-tertiary"
                      )}>
                        {formatTime(message.createdAt)}
                      </span>
                      {message.direction === "OUTBOUND" && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <TypingBubble conversationId={conversationId} />
          )}

          <div ref={messagesEndRef} />

          {/* New Messages Floating Button */}
          {hasNewMessages && (
            <button
              onClick={() => scrollToBottom(true)}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-brand-pink text-white text-xs font-semibold rounded-full shadow-lg shadow-brand-pink/30 hover:bg-brand-pink/90 transition-all animate-bounce"
            >
              <ArrowLeft className="w-3.5 h-3.5 rotate-[-90deg]" />
              Novas mensagens
            </button>
          )}
        </div>

        {/* Quick Actions Bar */}
        <div className="px-3 sm:px-4 py-2 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => {
              setShowNotes(!showNotes);
              if (!showSidebar) setShowSidebar(true);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
              showNotes
                ? "bg-brand-pink text-white"
                : "bg-surface-hover text-text-secondary hover:text-text-primary"
            )}
          >
            <StickyNote className="w-3.5 h-3.5" />
            Notas
          </button>
          <button
            onClick={() => {
              setShowTags(!showTags);
              if (!showSidebar) setShowSidebar(true);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
              showTags
                ? "bg-brand-pink text-white"
                : "bg-surface-hover text-text-secondary hover:text-text-primary"
            )}
          >
            <Tag className="w-3.5 h-3.5" />
            Tags
          </button>
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-white/10">
          <div className="flex items-end gap-2">
            <QuickReplies inputValue={newMessage} onSelect={handleQuickReply} />

            <button className="p-2.5 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={() => stopTyping()}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="w-full px-4 py-2.5 bg-surface-hover border border-white/10 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-pink/50 focus:ring-1 focus:ring-brand-pink/50 transition-all resize-none text-sm sm:text-base"
                style={{ maxHeight: "120px" }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className={cn(
                "p-2.5 rounded-lg transition-colors flex-shrink-0",
                newMessage.trim() && !sending
                  ? "bg-brand-gradient text-white shadow-glow"
                  : "bg-surface-hover text-text-tertiary"
              )}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 bg-surface border-l border-white/10 transform transition-transform duration-300 lg:relative lg:transform-none lg:w-80 lg:flex-shrink-0 lg:rounded-xl lg:border overflow-y-auto",
          showSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 lg:hidden">
          <h2 className="font-heading font-semibold text-lg text-text-primary">
            Detalhes
          </h2>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-2 hover:bg-surface-hover rounded-lg text-text-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {conversation.client.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-heading text-lg text-text-primary">
              {conversation.client.name}
            </h3>
            <p className="text-text-secondary text-sm">{conversation.client.phone}</p>
            {conversation.client.email && (
              <p className="text-text-tertiary text-xs mt-1">{conversation.client.email}</p>
            )}
          </div>

          <div className="glass-card p-4 mb-4">
            <h4 className="text-xs font-medium text-text-tertiary uppercase mb-3">
              Lead Score
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTemperatureIcon(conversation.temperature)}
                <span className="text-text-primary capitalize">
                  {conversation.temperature === "HOT" ? "Quente" :
                    conversation.temperature === "WARM" ? "Morno" : "Frio"}
                </span>
              </div>
              <span className="text-2xl font-bold text-brand-yellow font-mono">
                {conversation.score}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-text-tertiary uppercase">
                Etiquetas
              </h4>
              <button
                onClick={() => setShowTags(!showTags)}
                className="text-brand-pink text-xs hover:underline"
              >
                {showTags ? "Fechar" : "Editar"}
              </button>
            </div>

            {showTags ? (
              <TagSelector
                conversationId={conversationId}
                currentTags={conversation.tags}
                onTagsChange={(newTags) => {
                  setConversation(prev => prev ? { ...prev, tags: newTags } : null);
                }}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {conversation.tags.length === 0 ? (
                  <p className="text-text-tertiary text-sm">Sem etiquetas</p>
                ) : (
                  conversation.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        border: `1px solid ${tag.color}40`,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-text-tertiary uppercase">
                Notas Internas
              </h4>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-brand-pink text-xs hover:underline"
              >
                {showNotes ? "Fechar" : "Ver todas"}
              </button>
            </div>

            {showNotes && (
              <NotesPanel
                conversationId={conversationId}
              />
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <span className="text-text-tertiary">Status</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                conversation.status === "OPEN" ? "bg-green-500/20 text-green-400" :
                  conversation.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400" :
                    conversation.status === "RESOLVED" ? "bg-blue-500/20 text-blue-400" :
                      "bg-gray-500/20 text-gray-400"
              )}>
                {conversation.status}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <span className="text-text-tertiary">Canal</span>
              <span className="text-text-primary">{conversation.channel}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <span className="text-text-tertiary">Cliente desde</span>
              <span className="text-text-primary">
                {new Date(conversation.client.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
            {conversation.assignedTo && (
              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <span className="text-text-tertiary">Atribuído a</span>
                <span className="text-text-primary">{conversation.assignedTo.name}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}