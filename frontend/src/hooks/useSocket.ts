/**
 * NexaCore - useSocket Hook
 * 
 * Hook React para gerenciar conexão WebSocket
 * Integra com autenticação Clerk
 * 
 * @example
 * const { connected, error } = useSocket();
 */

"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import socketClient, { ConnectionState } from '@/lib/socket/client';
import { SOCKET_EVENTS, AuthPayload } from '@/lib/socket/events';

// ============================================
// TYPES
// ============================================

interface UseSocketOptions {
    autoConnect?: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
}

interface UseSocketReturn extends ConnectionState {
    connect: () => Promise<void>;
    disconnect: () => void;
    emit: <T = unknown>(event: string, data?: T) => void;
    on: <T = unknown>(event: string, callback: (data: T) => void) => () => void;
    joinRoom: (room: string) => void;
    leaveRoom: (room: string) => void;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
    markAsRead: (conversationId: string, messageIds: string[]) => void;
}

// ============================================
// HOOK
// ============================================

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
    const { autoConnect = true, onConnect, onDisconnect, onError } = options;

    const { getToken, userId, isSignedIn } = useAuth();
    const { user } = useUser();

    const [state, setState] = useState<ConnectionState>({
        connected: false,
        authenticated: false,
        reconnecting: false,
        error: null,
    });

    const callbacksRef = useRef({ onConnect, onDisconnect, onError });
    const connectingRef = useRef(false);
    const prevConnectedRef = useRef(false);

    // Atualizar refs
    callbacksRef.current = { onConnect, onDisconnect, onError };

    // Conectar ao WebSocket
    const connect = useCallback(async () => {
        if (!isSignedIn || !userId) {
            console.warn('[useSocket] User not signed in');
            return;
        }

        if (connectingRef.current) {
            console.log('[useSocket] Already connecting...');
            return;
        }

        if (socketClient.isConnected()) {
            console.log('[useSocket] Already connected');
            return;
        }

        connectingRef.current = true;

        try {
            // Obter token do Clerk
            const token = await getToken();
            if (!token) {
                throw new Error('Token não disponível');
            }

            // Obter tenantId do metadata do usuário ou da API
            let tenantId = user?.publicMetadata?.tenantId as string;

            if (!tenantId) {
                // Tentar buscar do backend como fallback
                try {
                    const response = await fetch('/api/tenants');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.tenant?.id) {
                            tenantId = data.tenant.id;
                        }
                    }
                } catch (e) {
                    console.warn('[useSocket] Could not fetch tenantId from API');
                }
            }

            if (!tenantId) {
                console.warn('[useSocket] No tenantId available, socket connection delayed');
                connectingRef.current = false;
                return;
            }

            const userName = user?.fullName || user?.firstName || 'Usuário';

            socketClient.connect({
                token,
                userId,
                tenantId,
                userName,
            });
        } catch (error) {
            console.error('[useSocket] Connection error:', error);
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro de conexão',
            }));
        } finally {
            connectingRef.current = false;
        }
    }, [isSignedIn, userId, getToken, user]);

    // Desconectar
    const disconnect = useCallback(() => {
        socketClient.disconnect();
    }, []);

    // Emitir evento
    const emit = useCallback(<T = unknown>(event: string, data?: T) => {
        socketClient.emit(event, data);
    }, []);

    // Subscrever a evento
    const on = useCallback(<T = unknown>(event: string, callback: (data: T) => void) => {
        return socketClient.on(event, callback);
    }, []);

    // Entrar em sala
    const joinRoom = useCallback((room: string) => {
        socketClient.joinRoom(room);
    }, []);

    // Sair de sala
    const leaveRoom = useCallback((room: string) => {
        socketClient.leaveRoom(room);
    }, []);

    // Entrar em conversa
    const joinConversation = useCallback((conversationId: string) => {
        socketClient.joinConversation(conversationId);
    }, []);

    // Sair de conversa
    const leaveConversation = useCallback((conversationId: string) => {
        socketClient.leaveConversation(conversationId);
    }, []);

    // Iniciar digitação
    const startTyping = useCallback((conversationId: string) => {
        socketClient.startTyping(conversationId);
    }, []);

    // Parar digitação
    const stopTyping = useCallback((conversationId: string) => {
        socketClient.stopTyping(conversationId);
    }, []);

    // Marcar como lido
    const markAsRead = useCallback((conversationId: string, messageIds: string[]) => {
        socketClient.markAsRead(conversationId, messageIds);
    }, []);

    // Efeito para gerenciar conexão e estado
    useEffect(() => {
        // Subscrever a mudanças de estado
        const unsubscribe = socketClient.onConnectionChange((newState) => {
            setState(newState);

            // Callbacks de conexão/desconexão
            if (newState.connected && !prevConnectedRef.current) {
                callbacksRef.current.onConnect?.();
            }
            if (!newState.connected && prevConnectedRef.current) {
                callbacksRef.current.onDisconnect?.();
            }
            if (newState.error) {
                callbacksRef.current.onError?.(newState.error);
            }

            prevConnectedRef.current = newState.connected;
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Auto-conectar quando usuário estiver autenticado
    useEffect(() => {
        if (autoConnect && isSignedIn && userId) {
            connect();
        }
    }, [autoConnect, isSignedIn, userId, connect]);

    return {
        ...state,
        connect,
        disconnect,
        emit,
        on,
        joinRoom,
        leaveRoom,
        joinConversation,
        leaveConversation,
        startTyping,
        stopTyping,
        markAsRead,
    };
}

// ============================================
// HOOK PARA EVENTOS ESPECÍFICOS
// ============================================

/**
 * Hook para subscrever a um evento específico do socket
 * 
 * @example
 * useSocketEvent('message:new', (message) => {
 *   console.log('Nova mensagem:', message);
 * });
 */
export function useSocketEvent<T = unknown>(
    event: string,
    callback: (data: T) => void,
    deps: React.DependencyList = []
): void {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const unsubscribe = socketClient.on<T>(event, (data) => {
            callbackRef.current(data);
        });

        return unsubscribe;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, ...deps]);
}

export default useSocket;
