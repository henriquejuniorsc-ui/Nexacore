"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface InboxStats {
  totalUnread: number;
  conversations: Array<{
    id: string;
    unreadCount: number;
    lastMessageAt: string;
    clientName: string;
    lastMessagePreview: string;
  }>;
}

interface UseInboxNotificationsOptions {
  enabled?: boolean;
  pollInterval?: number; // ms
  soundEnabled?: boolean;
  soundVolume?: number; // 0-1
}

export function useInboxNotifications(options: UseInboxNotificationsOptions = {}) {
  const {
    enabled = true,
    pollInterval = 5000, // 5 segundos
    soundEnabled = true,
    soundVolume = 0.5,
  } = options;

  const [stats, setStats] = useState<InboxStats>({ totalUnread: 0, conversations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousUnread = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar audio
  useEffect(() => {
    if (typeof window !== "undefined" && soundEnabled) {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.volume = soundVolume;
    }
  }, [soundEnabled, soundVolume]);

  // Tocar som
  const playSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser pode bloquear autoplay
      });
    }
  }, [soundEnabled]);

  // Mostrar notificação do browser
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: "inbox-notification",
        });
      }
    }
  }, []);

  // Solicitar permissão de notificação
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/inbox/stats");
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data: InboxStats = await res.json();
      
      // Verificar se tem nova mensagem
      if (data.totalUnread > previousUnread.current) {
        playSound();
        
        // Encontrar a conversa com nova mensagem
        const newConversation = data.conversations.find(
          (c) => c.unreadCount > 0
        );
        
        if (newConversation) {
          showBrowserNotification(
            `Nova mensagem de ${newConversation.clientName}`,
            newConversation.lastMessagePreview || "Nova mensagem recebida"
          );
        }
      }
      
      previousUnread.current = data.totalUnread;
      setStats(data);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }, [playSound, showBrowserNotification]);

  // Polling
  useEffect(() => {
    if (!enabled) return;

    fetchStats();
    const interval = setInterval(fetchStats, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchStats]);

  // Solicitar permissão ao montar
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    requestNotificationPermission,
  };
}
