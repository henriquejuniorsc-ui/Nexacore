/**
 * NexaCore - WebSocket Events
 * 
 * Tipos e constantes para eventos de WebSocket do sistema de inbox
 * 
 * @see https://socket.io/docs/v4/
 */

// ============================================
// EVENT NAMES
// ============================================

export const SOCKET_EVENTS = {
    // Conexão
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',

    // Autenticação
    AUTH: 'auth',
    AUTH_SUCCESS: 'auth:success',
    AUTH_ERROR: 'auth:error',

    // Rooms (salas)
    JOIN_CONVERSATION: 'join:conversation',
    LEAVE_CONVERSATION: 'leave:conversation',
    JOIN_TENANT: 'join:tenant',
    LEAVE_TENANT: 'leave:tenant',

    // Mensagens
    MESSAGE_NEW: 'message:new',
    MESSAGE_SENT: 'message:sent',
    MESSAGE_STATUS: 'message:status',
    MESSAGE_READ: 'message:read',
    MESSAGE_DELIVERED: 'message:delivered',

    // Digitando
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',
    TYPING_UPDATE: 'typing:update',

    // Conversa
    CONVERSATION_UPDATE: 'conversation:update',
    CONVERSATION_NEW: 'conversation:new',
    CONVERSATION_ASSIGNED: 'conversation:assigned',

    // Notificações/Stats
    STATS_UPDATE: 'stats:update',
    NOTIFICATION: 'notification',

    // Presença
    USER_ONLINE: 'user:online',
    USER_OFFLINE: 'user:offline',
    PRESENCE_UPDATE: 'presence:update',
} as const;

// ============================================
// PAYLOAD TYPES
// ============================================

// Autenticação
export interface AuthPayload {
    token: string;
    userId: string;
    tenantId: string;
    userName?: string;
}

export interface AuthSuccessPayload {
    userId: string;
    tenantId: string;
    connectedAt: string;
}

// Mensagem
export interface MessagePayload {
    id: string;
    conversationId: string;
    content: string;
    role: 'HUMAN' | 'ASSISTANT' | 'SYSTEM';
    senderType: 'CLIENT' | 'AI' | 'HUMAN';
    direction: 'INBOUND' | 'OUTBOUND';
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    createdAt: string;
    metadata?: Record<string, unknown>;
}

export interface MessageStatusPayload {
    messageId: string;
    conversationId: string;
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    updatedAt: string;
}

export interface MessageReadPayload {
    conversationId: string;
    messageIds: string[];
    readBy: string;
    readAt: string;
}

// Digitando
export interface TypingPayload {
    conversationId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
}

export interface TypingUpdatePayload {
    conversationId: string;
    typingUsers: Array<{
        userId: string;
        userName: string;
        startedAt: string;
    }>;
}

// Conversa
export interface ConversationUpdatePayload {
    id: string;
    changes: Partial<{
        status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
        aiEnabled: boolean;
        assignedToId: string | null;
        unreadCount: number;
        lastMessageAt: string;
        lastMessagePreview: string;
        score: number;
        temperature: 'COLD' | 'WARM' | 'HOT';
    }>;
    updatedAt: string;
}

export interface ConversationNewPayload {
    id: string;
    clientId: string;
    clientName: string;
    clientPhone: string;
    channel: 'WHATSAPP' | 'WEB' | 'INSTAGRAM' | 'TELEGRAM';
    createdAt: string;
}

// Stats
export interface StatsUpdatePayload {
    tenantId: string;
    totalUnread: number;
    openConversations: number;
    pendingConversations: number;
    conversations: Array<{
        id: string;
        unreadCount: number;
        lastMessageAt: string;
        clientName: string;
        lastMessagePreview: string;
    }>;
}

// Notificação
export interface NotificationPayload {
    id: string;
    type: 'NEW_MESSAGE' | 'CONVERSATION_ASSIGNED' | 'MENTION' | 'REMINDER';
    title: string;
    body: string;
    conversationId?: string;
    data?: Record<string, unknown>;
    createdAt: string;
}

// Presença
export interface PresencePayload {
    oduserId: string;
    status: 'online' | 'away' | 'offline';
    lastSeen?: string;
}

export interface PresenceUpdatePayload {
    tenantId: string;
    users: Array<{
        oduserId: string;
        userName: string;
        status: 'online' | 'away' | 'offline';
        currentConversationId?: string;
    }>;
}

// ============================================
// ROOM HELPERS
// ============================================

export function getConversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
}

export function getTenantRoom(tenantId: string): string {
    return `tenant:${tenantId}`;
}

export function getUserRoom(userId: string): string {
    return `user:${userId}`;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isMessagePayload(data: unknown): data is MessagePayload {
    return (
        typeof data === 'object' &&
        data !== null &&
        'id' in data &&
        'conversationId' in data &&
        'content' in data
    );
}

export function isTypingPayload(data: unknown): data is TypingPayload {
    return (
        typeof data === 'object' &&
        data !== null &&
        'conversationId' in data &&
        'userId' in data &&
        'isTyping' in data
    );
}

export function isStatsUpdatePayload(data: unknown): data is StatsUpdatePayload {
    return (
        typeof data === 'object' &&
        data !== null &&
        'tenantId' in data &&
        'totalUnread' in data
    );
}

// ============================================
// SERVER-TO-CLIENT EVENT TYPES (para tipagem)
// ============================================

export interface ServerToClientEvents {
    [SOCKET_EVENTS.AUTH_SUCCESS]: (payload: AuthSuccessPayload) => void;
    [SOCKET_EVENTS.AUTH_ERROR]: (error: { message: string }) => void;
    [SOCKET_EVENTS.MESSAGE_NEW]: (message: MessagePayload) => void;
    [SOCKET_EVENTS.MESSAGE_STATUS]: (payload: MessageStatusPayload) => void;
    [SOCKET_EVENTS.MESSAGE_READ]: (payload: MessageReadPayload) => void;
    [SOCKET_EVENTS.TYPING_UPDATE]: (payload: TypingUpdatePayload) => void;
    [SOCKET_EVENTS.CONVERSATION_UPDATE]: (payload: ConversationUpdatePayload) => void;
    [SOCKET_EVENTS.CONVERSATION_NEW]: (payload: ConversationNewPayload) => void;
    [SOCKET_EVENTS.STATS_UPDATE]: (payload: StatsUpdatePayload) => void;
    [SOCKET_EVENTS.NOTIFICATION]: (payload: NotificationPayload) => void;
    [SOCKET_EVENTS.PRESENCE_UPDATE]: (payload: PresenceUpdatePayload) => void;
}

export interface ClientToServerEvents {
    [SOCKET_EVENTS.AUTH]: (payload: AuthPayload) => void;
    [SOCKET_EVENTS.JOIN_CONVERSATION]: (data: { conversationId: string }) => void;
    [SOCKET_EVENTS.LEAVE_CONVERSATION]: (data: { conversationId: string }) => void;
    [SOCKET_EVENTS.TYPING_START]: (data: { conversationId: string }) => void;
    [SOCKET_EVENTS.TYPING_STOP]: (data: { conversationId: string }) => void;
    [SOCKET_EVENTS.MESSAGE_READ]: (data: { conversationId: string; messageIds: string[] }) => void;
}
