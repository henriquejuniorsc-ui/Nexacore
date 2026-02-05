/**
 * NexaCore - Socket.io Server
 * 
 * Servidor WebSocket para comunicação em tempo real
 * Integrado com Next.js App Router
 * 
 * @see https://socket.io/docs/v4/server-api/
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
    SOCKET_EVENTS,
    AuthPayload,
    MessagePayload,
    StatsUpdatePayload,
    ConversationUpdatePayload,
    getConversationRoom,
    getTenantRoom,
    getUserRoom,
    ServerToClientEvents,
    ClientToServerEvents,
} from './events';

// ============================================
// TYPES
// ============================================

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
    userId?: string;
    tenantId?: string;
    userName?: string;
}

interface TypingUser {
    userId: string;
    userName: string;
    startedAt: Date;
}

// ============================================
// GLOBAL REFERENCE (para Next.js)
// ============================================

declare global {
    // eslint-disable-next-line no-var
    var socketIO: SocketIOServer | undefined;
}

// ============================================
// SOCKET SERVER CLASS
// ============================================

class SocketServer {
    private static instance: SocketServer | null = null;
    private io: SocketIOServer | null = null;

    // Armazenar quem está digitando por conversa
    private typingUsers: Map<string, Map<string, TypingUser>> = new Map();

    // Timeout para "digitando" (5 segundos sem atualização = parou)
    private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

    private constructor() { }

    static getInstance(): SocketServer {
        if (!SocketServer.instance) {
            SocketServer.instance = new SocketServer();
        }
        return SocketServer.instance;
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    initialize(httpServer: HTTPServer): SocketIOServer {
        // Reutilizar instância global se existir (hot reload)
        if (global.socketIO) {
            console.log('[Socket Server] Reusing existing instance');
            this.io = global.socketIO;
            return this.io;
        }

        if (this.io) {
            console.log('[Socket Server] Already initialized');
            return this.io;
        }

        console.log('[Socket Server] Initializing...');

        this.io = new SocketIOServer(httpServer, {
            path: '/api/socket/io',
            addTrailingSlash: false,
            cors: {
                origin: process.env.NEXT_PUBLIC_APP_URL || '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        // Salvar globalmente
        global.socketIO = this.io;

        this.setupMiddleware();
        this.setupEventHandlers();

        console.log('[Socket Server] Initialized successfully');
        return this.io;
    }

    // ============================================
    // MIDDLEWARE
    // ============================================

    private setupMiddleware(): void {
        if (!this.io) return;

        // Middleware de autenticação
        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                const { token, userId, tenantId, userName } = socket.handshake.auth as AuthPayload;

                if (!userId || !tenantId) {
                    return next(new Error('Autenticação inválida: userId e tenantId são obrigatórios'));
                }

                // TODO: Validar token com Clerk em produção
                // const clerk = await clerkClient();
                // await clerk.verifyToken(token);

                socket.userId = userId;
                socket.tenantId = tenantId;
                socket.userName = userName || 'Usuário';

                console.log(`[Socket Server] User ${userId} authenticated for tenant ${tenantId}`);
                next();
            } catch (error) {
                console.error('[Socket Server] Auth error:', error);
                next(new Error('Erro de autenticação'));
            }
        });
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    private setupEventHandlers(): void {
        if (!this.io) return;

        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`[Socket Server] Client connected: ${socket.id}, user: ${socket.userId}`);

            // Entrar automaticamente na sala do tenant e usuário
            if (socket.tenantId) {
                socket.join(getTenantRoom(socket.tenantId));
                socket.join(getUserRoom(socket.userId!));

                // Emitir sucesso de autenticação
                socket.emit(SOCKET_EVENTS.AUTH_SUCCESS, {
                    userId: socket.userId!,
                    tenantId: socket.tenantId,
                    connectedAt: new Date().toISOString(),
                });
            }

            // ----------------------------------------
            // Room Management
            // ----------------------------------------

            socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, ({ conversationId }) => {
                const room = getConversationRoom(conversationId);
                socket.join(room);
                console.log(`[Socket Server] User ${socket.userId} joined conversation ${conversationId}`);
            });

            socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, ({ conversationId }) => {
                const room = getConversationRoom(conversationId);
                socket.leave(room);
                this.handleStopTyping(socket, conversationId);
                console.log(`[Socket Server] User ${socket.userId} left conversation ${conversationId}`);
            });

            socket.on('join:room' as any, ({ room }: { room: string }) => {
                socket.join(room);
            });

            socket.on('leave:room' as any, ({ room }: { room: string }) => {
                socket.leave(room);
            });

            // ----------------------------------------
            // Typing Indicators
            // ----------------------------------------

            socket.on(SOCKET_EVENTS.TYPING_START, ({ conversationId }) => {
                this.handleStartTyping(socket, conversationId);
            });

            socket.on(SOCKET_EVENTS.TYPING_STOP, ({ conversationId }) => {
                this.handleStopTyping(socket, conversationId);
            });

            // ----------------------------------------
            // Message Read Status
            // ----------------------------------------

            socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ conversationId, messageIds }) => {
                this.handleMessageRead(socket, conversationId, messageIds);
            });

            // ----------------------------------------
            // Disconnect
            // ----------------------------------------

            socket.on('disconnect', (reason) => {
                console.log(`[Socket Server] Client disconnected: ${socket.id}, reason: ${reason}`);

                // Limpar status de digitando de todas as conversas
                this.typingUsers.forEach((users, conversationId) => {
                    if (users.has(socket.userId!)) {
                        this.handleStopTyping(socket, conversationId);
                    }
                });
            });
        });
    }

    // ============================================
    // TYPING HANDLERS
    // ============================================

    private handleStartTyping(socket: AuthenticatedSocket, conversationId: string): void {
        if (!socket.userId) return;

        // Inicializar mapa se não existe
        if (!this.typingUsers.has(conversationId)) {
            this.typingUsers.set(conversationId, new Map());
        }

        const users = this.typingUsers.get(conversationId)!;

        // Adicionar/atualizar usuário digitando
        users.set(socket.userId, {
            userId: socket.userId,
            userName: socket.userName || 'Usuário',
            startedAt: new Date(),
        });

        // Limpar timeout anterior se existir
        const timeoutKey = `${conversationId}:${socket.userId}`;
        if (this.typingTimeouts.has(timeoutKey)) {
            clearTimeout(this.typingTimeouts.get(timeoutKey)!);
        }

        // Configurar timeout para parar automaticamente (5s)
        this.typingTimeouts.set(
            timeoutKey,
            setTimeout(() => {
                this.handleStopTyping(socket, conversationId);
            }, 5000)
        );

        // Emitir para todos na conversa
        this.emitTypingUpdate(conversationId);
    }

    private handleStopTyping(socket: AuthenticatedSocket, conversationId: string): void {
        if (!socket.userId) return;

        const users = this.typingUsers.get(conversationId);
        if (!users) return;

        users.delete(socket.userId);

        // Limpar mapa vazio
        if (users.size === 0) {
            this.typingUsers.delete(conversationId);
        }

        // Limpar timeout
        const timeoutKey = `${conversationId}:${socket.userId}`;
        if (this.typingTimeouts.has(timeoutKey)) {
            clearTimeout(this.typingTimeouts.get(timeoutKey)!);
            this.typingTimeouts.delete(timeoutKey);
        }

        // Emitir atualização
        this.emitTypingUpdate(conversationId);
    }

    private emitTypingUpdate(conversationId: string): void {
        const users = this.typingUsers.get(conversationId);
        const typingUsers = users
            ? Array.from(users.values()).map((u) => ({
                userId: u.userId,
                userName: u.userName,
                startedAt: u.startedAt.toISOString(),
            }))
            : [];

        this.io?.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.TYPING_UPDATE, {
            conversationId,
            typingUsers,
        });
    }

    // ============================================
    // MESSAGE READ HANDLER
    // ============================================

    private handleMessageRead(
        socket: AuthenticatedSocket,
        conversationId: string,
        messageIds: string[]
    ): void {
        // Emitir para todos na conversa
        this.io?.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_READ, {
            conversationId,
            messageIds,
            readBy: socket.userId!,
            readAt: new Date().toISOString(),
        });
    }

    // ============================================
    // PUBLIC EMIT METHODS (para uso nas APIs)
    // ============================================

    /**
     * Emitir nova mensagem para uma conversa
     */
    emitNewMessage(conversationId: string, message: MessagePayload): void {
        console.log(`[Socket Server] Emitting new message to conversation ${conversationId}`);
        this.io?.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
    }

    /**
     * Emitir atualização de status de mensagem
     */
    emitMessageStatus(
        conversationId: string,
        messageId: string,
        status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
    ): void {
        this.io?.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_STATUS, {
            messageId,
            conversationId,
            status,
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Emitir atualização de conversa para o tenant
     */
    emitConversationUpdate(tenantId: string, update: ConversationUpdatePayload): void {
        console.log(`[Socket Server] Emitting conversation update to tenant ${tenantId}`);
        this.io?.to(getTenantRoom(tenantId)).emit(SOCKET_EVENTS.CONVERSATION_UPDATE, update);
    }

    /**
     * Emitir nova conversa para o tenant
     */
    emitNewConversation(tenantId: string, conversation: any): void {
        this.io?.to(getTenantRoom(tenantId)).emit(SOCKET_EVENTS.CONVERSATION_NEW, conversation);
    }

    /**
     * Emitir atualização de stats para o tenant
     */
    emitStatsUpdate(tenantId: string, stats: StatsUpdatePayload): void {
        console.log(`[Socket Server] Emitting stats update to tenant ${tenantId}`);
        this.io?.to(getTenantRoom(tenantId)).emit(SOCKET_EVENTS.STATS_UPDATE, stats);
    }

    /**
     * Emitir notificação para um usuário específico
     */
    emitNotification(userId: string, notification: any): void {
        this.io?.to(getUserRoom(userId)).emit(SOCKET_EVENTS.NOTIFICATION, notification);
    }

    /**
     * Emitir para todos em uma sala
     */
    emitToRoom(room: string, event: string, data: unknown): void {
        this.io?.to(room).emit(event as keyof ServerToClientEvents, data as any);
    }

    /**
     * Broadcast para todos conectados
     */
    broadcast(event: string, data: unknown): void {
        this.io?.emit(event as keyof ServerToClientEvents, data as any);
    }

    // ============================================
    // UTILITIES
    // ============================================

    getIO(): SocketIOServer | null {
        return this.io;
    }

    getConnectedClients(): number {
        return this.io?.engine.clientsCount ?? 0;
    }

    getClientsInRoom(room: string): number {
        return this.io?.sockets.adapter.rooms.get(room)?.size ?? 0;
    }

    isInitialized(): boolean {
        return this.io !== null || global.socketIO !== undefined;
    }
}

// ============================================
// EXPORTS
// ============================================

export const socketServer = SocketServer.getInstance();

export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
    return socketServer.initialize(httpServer);
}

export function getSocketServer(): SocketServer {
    return SocketServer.getInstance();
}

export default socketServer;
