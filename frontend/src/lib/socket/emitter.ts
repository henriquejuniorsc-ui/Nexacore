/**
 * NexaCore - Socket Emitter
 * 
 * Helper para emitir eventos WebSocket a partir das API routes
 * Usa a instância global do Socket.io criada pelo server.js
 * 
 * @example
 * import { emitNewMessage, emitStatsUpdate } from '@/lib/socket/emitter';
 * 
 * // Na API route de mensagens:
 * emitNewMessage(conversationId, message);
 * emitStatsUpdate(tenantId, stats);
 */

import { Server as SocketIOServer } from 'socket.io';
import {
    MessagePayload,
    StatsUpdatePayload,
    ConversationUpdatePayload,
    ConversationNewPayload,
    NotificationPayload,
    getConversationRoom,
    getTenantRoom,
    getUserRoom,
    SOCKET_EVENTS,
} from './events';

// ============================================
// TIPOS
// ============================================

declare global {
    // eslint-disable-next-line no-var
    var socketIO: SocketIOServer | undefined;
}

// ============================================
// GET IO INSTANCE
// ============================================

function getIO(): SocketIOServer | null {
    if (typeof global.socketIO === 'undefined') {
        console.warn('[Socket Emitter] Socket.IO not initialized. Make sure server.js is running.');
        return null;
    }
    return global.socketIO;
}

// ============================================
// EMIT FUNCTIONS
// ============================================

/**
 * Emitir nova mensagem para uma conversa
 */
export function emitNewMessage(conversationId: string, message: MessagePayload): boolean {
    const io = getIO();
    if (!io) return false;

    console.log(`[Socket Emitter] New message to conversation ${conversationId}`);
    io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
    return true;
}

/**
 * Emitir atualização de status de mensagem
 */
export function emitMessageStatus(
    conversationId: string,
    messageId: string,
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
): boolean {
    const io = getIO();
    if (!io) return false;

    io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_STATUS, {
        messageId,
        conversationId,
        status,
        updatedAt: new Date().toISOString(),
    });
    return true;
}

/**
 * Emitir que mensagens foram lidas
 */
export function emitMessageRead(
    conversationId: string,
    messageIds: string[],
    readBy: string
): boolean {
    const io = getIO();
    if (!io) return false;

    io.to(getConversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_READ, {
        conversationId,
        messageIds,
        readBy,
        readAt: new Date().toISOString(),
    });
    return true;
}

/**
 * Emitir atualização de conversa para o tenant
 */
export function emitConversationUpdate(
    tenantId: string,
    update: ConversationUpdatePayload
): boolean {
    const io = getIO();
    if (!io) return false;

    console.log(`[Socket Emitter] Conversation update to tenant ${tenantId}`);
    io.to(getTenantRoom(tenantId)).emit(SOCKET_EVENTS.CONVERSATION_UPDATE, update);

    // Também emitir para a sala da conversa específica
    io.to(getConversationRoom(update.id)).emit(SOCKET_EVENTS.CONVERSATION_UPDATE, update);
    return true;
}

/**
 * Emitir nova conversa para o tenant
 */
export function emitNewConversation(
    tenantId: string,
    conversation: ConversationNewPayload
): boolean {
    const io = getIO();
    if (!io) return false;

    console.log(`[Socket Emitter] New conversation to tenant ${tenantId}`);
    io.to(getTenantRoom(tenantId)).emit(SOCKET_EVENTS.CONVERSATION_NEW, conversation);
    return true;
}

/**
 * Emitir atualização de stats do inbox para o tenant
 */
export function emitStatsUpdate(tenantId: string, stats: StatsUpdatePayload): boolean {
    const io = getIO();
    if (!io) return false;

    console.log(`[Socket Emitter] Stats update to tenant ${tenantId}`);
    io.to(getTenantRoom(tenantId)).emit(SOCKET_EVENTS.STATS_UPDATE, stats);
    return true;
}

/**
 * Emitir notificação para um usuário específico
 */
export function emitNotification(userId: string, notification: NotificationPayload): boolean {
    const io = getIO();
    if (!io) return false;

    io.to(getUserRoom(userId)).emit(SOCKET_EVENTS.NOTIFICATION, notification);
    return true;
}

/**
 * Emitir para todos em uma sala
 */
export function emitToRoom(room: string, event: string, data: unknown): boolean {
    const io = getIO();
    if (!io) return false;

    io.to(room).emit(event, data);
    return true;
}

/**
 * Broadcast para todos conectados de um tenant
 */
export function broadcastToTenant(tenantId: string, event: string, data: unknown): boolean {
    const io = getIO();
    if (!io) return false;

    io.to(getTenantRoom(tenantId)).emit(event, data);
    return true;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Verificar se o Socket.IO está disponível
 */
export function isSocketAvailable(): boolean {
    return typeof global.socketIO !== 'undefined';
}

/**
 * Obter número de clientes conectados
 */
export function getConnectedClients(): number {
    const io = getIO();
    return io?.engine.clientsCount ?? 0;
}

/**
 * Obter número de clientes em uma sala
 */
export function getClientsInRoom(room: string): number {
    const io = getIO();
    return io?.sockets.adapter.rooms.get(room)?.size ?? 0;
}

// ============================================
// HELPER PARA ATUALIZAR STATS APÓS MUDANÇAS
// ============================================

/**
 * Helper para calcular e emitir stats atualizados
 * Chamar após criar/atualizar mensagens ou conversas
 */

// Tipo para o resultado da query de conversas
interface ConversationWithUnread {
    id: string;
    unreadCount: number;
    lastMessageAt: Date | null;
    lastMessagePreview: string | null;
    client: { name: string };
}

export async function refreshAndEmitStats(
    tenantId: string,
    prisma: any // PrismaClient
): Promise<void> {
    try {
        // Buscar stats atualizados
        const conversations: ConversationWithUnread[] = await prisma.conversation.findMany({
            where: {
                tenantId,
                unreadCount: { gt: 0 },
            },
            select: {
                id: true,
                unreadCount: true,
                lastMessageAt: true,
                lastMessagePreview: true,
                client: {
                    select: { name: true },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
            take: 20,
        });

        const totalUnread = conversations.reduce(
            (sum: number, c: ConversationWithUnread) => sum + c.unreadCount,
            0
        );

        const stats: StatsUpdatePayload = {
            tenantId,
            totalUnread,
            openConversations: 0, // Calcular se necessário
            pendingConversations: 0, // Calcular se necessário
            conversations: conversations.map((c: ConversationWithUnread) => ({
                id: c.id,
                unreadCount: c.unreadCount,
                lastMessageAt: c.lastMessageAt?.toISOString() || '',
                clientName: c.client.name,
                lastMessagePreview: c.lastMessagePreview || '',
            })),
        };

        emitStatsUpdate(tenantId, stats);
    } catch (error) {
        console.error('[Socket Emitter] Error refreshing stats:', error);
    }
}
