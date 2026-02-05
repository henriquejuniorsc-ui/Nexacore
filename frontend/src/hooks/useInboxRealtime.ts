/**
 * NexaCore - useInboxRealtime Hook
 * 
 * Hook específico para funcionalidades real-time do inbox:
 * - Novas mensagens instantâneas
 * - Status de "digitando..."
 * - Sincronização de leitura
 * - Atualizações de stats
 * 
 * @example
 * const { typingUsers, markAsRead, startTyping } = useInboxRealtime({ conversationId });
 */

"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import socketClient from '@/lib/socket/client';
import {
    SOCKET_EVENTS,
    MessagePayload,
    TypingUpdatePayload,
    StatsUpdatePayload,
    ConversationUpdatePayload,
    MessageReadPayload,
} from '@/lib/socket/events';
import { useSocket, useSocketEvent } from './useSocket';

// ============================================
// TYPES
// ============================================

interface TypingUser {
    userId: string;
    userName: string;
    startedAt: string;
}

interface UseInboxRealtimeOptions {
    conversationId?: string;
    onNewMessage?: (message: MessagePayload) => void;
    onMessageRead?: (data: MessageReadPayload) => void;
    onTypingUpdate?: (users: TypingUser[]) => void;
    onConversationUpdate?: (update: ConversationUpdatePayload) => void;
}

interface UseInboxRealtimeReturn {
    // Estado
    typingUsers: TypingUser[];
    isConnected: boolean;

    // Ações
    startTyping: () => void;
    stopTyping: () => void;
    markAsRead: (messageIds: string[]) => void;
    joinConversation: (id: string) => void;
    leaveConversation: (id: string) => void;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useInboxRealtime(options: UseInboxRealtimeOptions = {}): UseInboxRealtimeReturn {
    const {
        conversationId,
        onNewMessage,
        onMessageRead,
        onTypingUpdate,
        onConversationUpdate,
    } = options;

    const { connected, joinConversation: socketJoin, leaveConversation: socketLeave } = useSocket();
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

    // Refs para callbacks (evitar re-renders)
    const callbacksRef = useRef({
        onNewMessage,
        onMessageRead,
        onTypingUpdate,
        onConversationUpdate,
    });
    callbacksRef.current = {
        onNewMessage,
        onMessageRead,
        onTypingUpdate,
        onConversationUpdate,
    };

    // Ref para conversationId atual
    const currentConversationRef = useRef<string | undefined>(conversationId);

    // Debounce para typing
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    // ============================================
    // GERENCIAR SALA DA CONVERSA
    // ============================================

    useEffect(() => {
        if (!connected) return;

        // Sair da conversa anterior se mudou
        if (currentConversationRef.current && currentConversationRef.current !== conversationId) {
            socketLeave(currentConversationRef.current);
            setTypingUsers([]); // Limpar typing ao trocar de conversa
        }

        // Entrar na nova conversa
        if (conversationId) {
            socketJoin(conversationId);
            currentConversationRef.current = conversationId;
        }

        // Cleanup ao desmontar
        return () => {
            if (currentConversationRef.current) {
                socketLeave(currentConversationRef.current);
            }
        };
    }, [conversationId, connected, socketJoin, socketLeave]);

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Nova mensagem
    useSocketEvent<MessagePayload>(SOCKET_EVENTS.MESSAGE_NEW, (message) => {
        // Filtrar apenas mensagens da conversa atual
        if (message.conversationId === conversationId || !conversationId) {
            callbacksRef.current.onNewMessage?.(message);
        }
    }, [conversationId]);

    // Mensagem lida
    useSocketEvent<MessageReadPayload>(SOCKET_EVENTS.MESSAGE_READ, (data) => {
        if (data.conversationId === conversationId || !conversationId) {
            callbacksRef.current.onMessageRead?.(data);
        }
    }, [conversationId]);

    // Atualização de digitando
    useSocketEvent<TypingUpdatePayload>(SOCKET_EVENTS.TYPING_UPDATE, (data) => {
        if (data.conversationId === conversationId) {
            setTypingUsers(data.typingUsers);
            callbacksRef.current.onTypingUpdate?.(data.typingUsers);
        }
    }, [conversationId]);

    // Atualização de conversa
    useSocketEvent<ConversationUpdatePayload>(SOCKET_EVENTS.CONVERSATION_UPDATE, (update) => {
        if (update.id === conversationId || !conversationId) {
            callbacksRef.current.onConversationUpdate?.(update);
        }
    }, [conversationId]);

    // ============================================
    // AÇÕES
    // ============================================

    // Começar a digitar (com debounce automático)
    const startTyping = useCallback(() => {
        if (!conversationId || !connected) return;

        socketClient.startTyping(conversationId);

        // Limpar timeout anterior
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Parar automaticamente após 3 segundos sem chamar startTyping
        typingTimeoutRef.current = setTimeout(() => {
            socketClient.stopTyping(conversationId);
        }, 3000);
    }, [conversationId, connected]);

    // Parar de digitar
    const stopTyping = useCallback(() => {
        if (!conversationId || !connected) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        socketClient.stopTyping(conversationId);
    }, [conversationId, connected]);

    // Marcar mensagens como lidas
    const markAsRead = useCallback((messageIds: string[]) => {
        if (!conversationId || !connected || messageIds.length === 0) return;

        socketClient.markAsRead(conversationId, messageIds);
    }, [conversationId, connected]);

    // Entrar em conversa manualmente
    const joinConversation = useCallback((id: string) => {
        if (!connected) return;
        socketJoin(id);
    }, [connected, socketJoin]);

    // Sair de conversa manualmente
    const leaveConversation = useCallback((id: string) => {
        if (!connected) return;
        socketLeave(id);
    }, [connected, socketLeave]);

    // Cleanup do timeout ao desmontar
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return {
        typingUsers,
        isConnected: connected,
        startTyping,
        stopTyping,
        markAsRead,
        joinConversation,
        leaveConversation,
    };
}

// ============================================
// HOOK PARA NOTIFICAÇÕES DO INBOX (substitui polling)
// ============================================

interface UseInboxNotificationsRealtimeOptions {
    enabled?: boolean;
    onStatsUpdate?: (stats: StatsUpdatePayload) => void;
    onNewConversation?: (conversation: any) => void;
    onNewMessage?: (message: MessagePayload) => void;
    soundEnabled?: boolean;
    soundVolume?: number;
}

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

interface UseInboxNotificationsRealtimeReturn {
    stats: InboxStats;
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    refetch: () => Promise<void>;
    requestNotificationPermission: () => Promise<void>;
}

/**
 * Hook para receber atualizações de stats do inbox em tempo real
 * Substitui o polling do useInboxNotifications original
 * Mantém compatibilidade com a API anterior
 */
export function useInboxNotificationsRealtime(
    options: UseInboxNotificationsRealtimeOptions = {}
): UseInboxNotificationsRealtimeReturn {
    const {
        enabled = true,
        onStatsUpdate,
        onNewConversation,
        onNewMessage,
        soundEnabled = true,
        soundVolume = 0.5,
    } = options;

    const { connected } = useSocket({ autoConnect: enabled });
    const [stats, setStats] = useState<InboxStats>({ totalUnread: 0, conversations: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousUnreadRef = useRef(0);

    const callbacksRef = useRef({ onStatsUpdate, onNewConversation, onNewMessage });
    callbacksRef.current = { onStatsUpdate, onNewConversation, onNewMessage };

    // Inicializar audio
    useEffect(() => {
        if (typeof window !== 'undefined' && soundEnabled) {
            audioRef.current = new Audio('/sounds/notification.mp3');
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
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body,
                    icon: '/icons/icon-192.png',
                    badge: '/icons/icon-192.png',
                    tag: 'inbox-notification',
                });
            }
        }
    }, []);

    // Solicitar permissão
    const requestNotificationPermission = useCallback(async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }
    }, []);

    // Fetch inicial via HTTP (fallback e dados iniciais)
    const refetch = useCallback(async () => {
        try {
            const res = await fetch('/api/inbox/stats');
            if (!res.ok) throw new Error('Failed to fetch');

            const data: InboxStats = await res.json();
            setStats(data);
            previousUnreadRef.current = data.totalUnread;
            setError(null);
        } catch (err) {
            setError('Erro ao carregar notificações');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch inicial
    useEffect(() => {
        if (enabled) {
            refetch();
            requestNotificationPermission();
        }
    }, [enabled, refetch, requestNotificationPermission]);

    // Atualização de stats via WebSocket
    useSocketEvent<StatsUpdatePayload>(SOCKET_EVENTS.STATS_UPDATE, (newStats) => {
        const inboxStats: InboxStats = {
            totalUnread: newStats.totalUnread,
            conversations: newStats.conversations,
        };

        // Verificar se tem nova mensagem
        if (newStats.totalUnread > previousUnreadRef.current) {
            playSound();

            // Encontrar a conversa com nova mensagem
            const newConversation = newStats.conversations.find(c => c.unreadCount > 0);
            if (newConversation) {
                showBrowserNotification(
                    `Nova mensagem de ${newConversation.clientName}`,
                    newConversation.lastMessagePreview || 'Nova mensagem recebida'
                );
            }
        }

        previousUnreadRef.current = newStats.totalUnread;
        setStats(inboxStats);
        callbacksRef.current.onStatsUpdate?.(newStats);
    }, [playSound, showBrowserNotification]);

    // Nova conversa
    useSocketEvent(SOCKET_EVENTS.CONVERSATION_NEW, (conversation) => {
        callbacksRef.current.onNewConversation?.(conversation);
        playSound();
    }, [playSound]);

    // Nova mensagem (para tocar som mesmo sem estar na conversa)
    useSocketEvent<MessagePayload>(SOCKET_EVENTS.MESSAGE_NEW, (message) => {
        callbacksRef.current.onNewMessage?.(message);

        // Atualizar stats localmente
        if (message.direction === 'INBOUND') {
            setStats(prev => ({
                ...prev,
                totalUnread: prev.totalUnread + 1,
            }));
            playSound();
        }
    }, [playSound]);

    return {
        stats,
        loading,
        error,
        isConnected: connected,
        refetch,
        requestNotificationPermission,
    };
}

// ============================================
// HOOK PARA INDICADOR DE DIGITANDO
// ============================================

interface UseTypingIndicatorReturn {
    typingUsers: TypingUser[];
    isTyping: boolean;
    typingText: string;
}

/**
 * Hook simplificado apenas para exibir indicador de digitando
 */
export function useTypingIndicator(conversationId?: string): UseTypingIndicatorReturn {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

    useSocketEvent<TypingUpdatePayload>(SOCKET_EVENTS.TYPING_UPDATE, (data) => {
        if (data.conversationId === conversationId) {
            setTypingUsers(data.typingUsers);
        }
    }, [conversationId]);

    const isTyping = typingUsers.length > 0;

    let typingText = '';
    if (typingUsers.length === 1) {
        typingText = `${typingUsers[0].userName} está digitando...`;
    } else if (typingUsers.length === 2) {
        typingText = `${typingUsers[0].userName} e ${typingUsers[1].userName} estão digitando...`;
    } else if (typingUsers.length > 2) {
        typingText = `${typingUsers.length} pessoas estão digitando...`;
    }

    return {
        typingUsers,
        isTyping,
        typingText,
    };
}

export default useInboxRealtime;
