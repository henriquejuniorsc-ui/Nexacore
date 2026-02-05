/**
 * NexaCore - Socket.io Client
 * 
 * Cliente singleton para conexão WebSocket
 * Gerencia reconexão automática e autenticação
 * 
 * @see https://socket.io/docs/v4/client-api/
 */

"use client";

import { io, Socket } from 'socket.io-client';
import {
    SOCKET_EVENTS,
    AuthPayload,
    getTenantRoom,
    ServerToClientEvents,
    ClientToServerEvents,
} from './events';

// ============================================
// TYPES
// ============================================

interface SocketClientOptions {
    url?: string;
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    timeout?: number;
}

export interface ConnectionState {
    connected: boolean;
    authenticated: boolean;
    reconnecting: boolean;
    error: string | null;
}

type ConnectionCallback = (state: ConnectionState) => void;
type EventCallback<T = unknown> = (data: T) => void;

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ============================================
// SOCKET CLIENT CLASS
// ============================================

class SocketClient {
    private static instance: SocketClient | null = null;
    private socket: TypedSocket | null = null;
    private connectionCallbacks: Set<ConnectionCallback> = new Set();
    private eventCallbacks: Map<string, Set<EventCallback>> = new Map();
    private authData: AuthPayload | null = null;
    private options: SocketClientOptions;

    private state: ConnectionState = {
        connected: false,
        authenticated: false,
        reconnecting: false,
        error: null,
    };

    private constructor(options: SocketClientOptions = {}) {
        this.options = {
            url: typeof window !== 'undefined' ? window.location.origin : '',
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 10000,
            ...options,
        };
    }

    // Singleton instance
    static getInstance(options?: SocketClientOptions): SocketClient {
        if (typeof window === 'undefined') {
            // SSR - retornar instância mock
            return new SocketClient(options);
        }

        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient(options);
        }
        return SocketClient.instance;
    }

    // Reset instance (útil para testes)
    static resetInstance(): void {
        if (SocketClient.instance) {
            SocketClient.instance.disconnect();
            SocketClient.instance = null;
        }
    }

    // ============================================
    // CONNECTION MANAGEMENT
    // ============================================

    connect(authData: AuthPayload): void {
        if (typeof window === 'undefined') return;

        if (this.socket?.connected) {
            console.log('[Socket] Already connected');
            return;
        }

        this.authData = authData;

        // Criar socket com configurações
        this.socket = io(this.options.url!, {
            path: '/api/socket/io',
            autoConnect: false,
            reconnection: this.options.reconnection,
            reconnectionAttempts: this.options.reconnectionAttempts,
            reconnectionDelay: this.options.reconnectionDelay,
            timeout: this.options.timeout,
            transports: ['websocket', 'polling'],
            auth: {
                token: authData.token,
                userId: authData.userId,
                tenantId: authData.tenantId,
                userName: authData.userName,
            },
        }) as TypedSocket;

        this.setupEventListeners();
        this.socket.connect();
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.updateState({
            connected: false,
            authenticated: false,
            reconnecting: false,
            error: null,
        });
    }

    // ============================================
    // EVENT LISTENERS SETUP
    // ============================================

    private setupEventListeners(): void {
        if (!this.socket) return;

        // Conexão estabelecida
        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
            console.log('[Socket] Connected, socket id:', this.socket?.id);
            this.updateState({
                connected: true,
                reconnecting: false,
                error: null,
            });
        });

        // Desconexão
        this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            console.log('[Socket] Disconnected:', reason);
            this.updateState({
                connected: false,
                authenticated: false,
            });
        });

        // Erro de conexão
        this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
            console.error('[Socket] Connection error:', error.message);
            this.updateState({
                connected: false,
                error: error.message,
            });
        });

        // Tentando reconectar
        this.socket.io.on('reconnect_attempt', (attempt) => {
            console.log('[Socket] Reconnecting, attempt:', attempt);
            this.updateState({ reconnecting: true });
        });

        // Reconexão bem-sucedida
        this.socket.io.on('reconnect', () => {
            console.log('[Socket] Reconnected');
            this.updateState({ reconnecting: false });
        });

        // Falha na reconexão
        this.socket.io.on('reconnect_failed', () => {
            console.error('[Socket] Reconnection failed');
            this.updateState({
                reconnecting: false,
                error: 'Falha ao reconectar. Tente recarregar a página.',
            });
        });

        // Autenticação bem-sucedida
        this.socket.on(SOCKET_EVENTS.AUTH_SUCCESS, (data) => {
            console.log('[Socket] Authenticated:', data);
            this.updateState({ authenticated: true });

            // Entrar na sala do tenant automaticamente
            if (this.authData) {
                this.joinRoom(getTenantRoom(this.authData.tenantId));
            }
        });

        // Erro de autenticação
        this.socket.on(SOCKET_EVENTS.AUTH_ERROR, (error) => {
            console.error('[Socket] Auth error:', error);
            this.updateState({
                authenticated: false,
                error: 'Erro de autenticação',
            });
        });

        // Configurar listeners para eventos registrados previamente
        this.eventCallbacks.forEach((callbacks, event) => {
            this.socket?.on(event as keyof ServerToClientEvents, (data: unknown) => {
                callbacks.forEach((callback) => callback(data));
            });
        });
    }

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    private updateState(changes: Partial<ConnectionState>): void {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...changes };

        // Só notificar se algo mudou
        if (JSON.stringify(prevState) !== JSON.stringify(this.state)) {
            this.connectionCallbacks.forEach((callback) => callback(this.state));
        }
    }

    getState(): ConnectionState {
        return { ...this.state };
    }

    onConnectionChange(callback: ConnectionCallback): () => void {
        this.connectionCallbacks.add(callback);
        // Chamar imediatamente com estado atual
        callback(this.state);

        return () => {
            this.connectionCallbacks.delete(callback);
        };
    }

    // ============================================
    // ROOM MANAGEMENT
    // ============================================

    joinRoom(room: string): void {
        if (!this.socket?.connected) {
            console.warn('[Socket] Cannot join room, not connected');
            return;
        }

        console.log('[Socket] Joining room:', room);
        this.socket.emit('join:room' as any, { room });
    }

    leaveRoom(room: string): void {
        if (!this.socket?.connected) return;

        console.log('[Socket] Leaving room:', room);
        this.socket.emit('leave:room' as any, { room });
    }

    joinConversation(conversationId: string): void {
        if (!this.socket?.connected) {
            console.warn('[Socket] Cannot join conversation, not connected');
            return;
        }
        this.socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });
    }

    leaveConversation(conversationId: string): void {
        if (!this.socket?.connected) return;
        this.socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId });
    }

    // ============================================
    // EVENT SUBSCRIPTION
    // ============================================

    on<T = unknown>(event: string, callback: (data: T) => void): () => void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, new Set());

            // Se já conectado, adicionar listener ao socket
            if (this.socket) {
                this.socket.on(event as keyof ServerToClientEvents, (data: unknown) => {
                    this.eventCallbacks.get(event)?.forEach((cb) => cb(data));
                });
            }
        }

        this.eventCallbacks.get(event)!.add(callback as EventCallback);

        // Retornar função de cleanup
        return () => {
            this.eventCallbacks.get(event)?.delete(callback as EventCallback);
        };
    }

    off(event: string, callback?: EventCallback): void {
        if (callback) {
            this.eventCallbacks.get(event)?.delete(callback);
        } else {
            this.eventCallbacks.delete(event);
            this.socket?.off(event as keyof ServerToClientEvents);
        }
    }

    // ============================================
    // EMIT EVENTS
    // ============================================

    emit<T = unknown>(event: string, data?: T): void {
        if (!this.socket?.connected) {
            console.warn('[Socket] Cannot emit, not connected');
            return;
        }
        this.socket.emit(event as keyof ClientToServerEvents, data as any);
    }

    // ============================================
    // TYPING INDICATORS
    // ============================================

    startTyping(conversationId: string): void {
        this.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
    }

    stopTyping(conversationId: string): void {
        this.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }

    // ============================================
    // MESSAGE READ STATUS
    // ============================================

    markAsRead(conversationId: string, messageIds: string[]): void {
        this.emit(SOCKET_EVENTS.MESSAGE_READ, { conversationId, messageIds });
    }

    // ============================================
    // UTILITIES
    // ============================================

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    isAuthenticated(): boolean {
        return this.state.authenticated;
    }

    getSocketId(): string | undefined {
        return this.socket?.id;
    }
}

// ============================================
// EXPORTS
// ============================================

// Função para obter instância (lazy initialization)
export function getSocketClient(options?: SocketClientOptions): SocketClient {
    return SocketClient.getInstance(options);
}

// Export default para uso direto
const socketClient = SocketClient.getInstance();
export default socketClient;
