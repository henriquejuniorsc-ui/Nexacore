/**
 * NexaCore - Custom Server
 * 
 * Servidor customizado para Next.js com Socket.io
 * Necessário porque o App Router não suporta WebSockets nativamente
 * 
 * Uso:
 * - Development: node server.js (ao invés de next dev)
 * - Production: node server.js (ao invés de next start)
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Inicializar Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ============================================
// SOCKET.IO SETUP
// ============================================

function setupSocketIO(httpServer) {
    const io = new SocketIOServer(httpServer, {
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

    // Armazenar quem está digitando
    const typingUsers = new Map();
    const typingTimeouts = new Map();

    // Middleware de autenticação
    io.use((socket, next) => {
        const { token, userId, tenantId, userName } = socket.handshake.auth;

        if (!userId || !tenantId) {
            return next(new Error('Autenticação inválida'));
        }

        // Adicionar dados ao socket
        socket.userId = userId;
        socket.tenantId = tenantId;
        socket.userName = userName || 'Usuário';

        console.log(`[Socket] User ${userId} authenticated for tenant ${tenantId}`);
        next();
    });

    // Event handlers
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // Entrar nas salas do tenant e usuário
        if (socket.tenantId) {
            socket.join(`tenant:${socket.tenantId}`);
            socket.join(`user:${socket.userId}`);

            // Emitir sucesso
            socket.emit('auth:success', {
                userId: socket.userId,
                tenantId: socket.tenantId,
                connectedAt: new Date().toISOString(),
            });
        }

        // Join conversation
        socket.on('join:conversation', ({ conversationId }) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`[Socket] User ${socket.userId} joined conversation ${conversationId}`);
        });

        // Leave conversation
        socket.on('leave:conversation', ({ conversationId }) => {
            socket.leave(`conversation:${conversationId}`);
            handleStopTyping(socket, conversationId);
            console.log(`[Socket] User ${socket.userId} left conversation ${conversationId}`);
        });

        // Generic room join/leave
        socket.on('join:room', ({ room }) => socket.join(room));
        socket.on('leave:room', ({ room }) => socket.leave(room));

        // Typing start
        socket.on('typing:start', ({ conversationId }) => {
            handleStartTyping(socket, conversationId);
        });

        // Typing stop
        socket.on('typing:stop', ({ conversationId }) => {
            handleStopTyping(socket, conversationId);
        });

        // Message read
        socket.on('message:read', ({ conversationId, messageIds }) => {
            io.to(`conversation:${conversationId}`).emit('message:read', {
                conversationId,
                messageIds,
                readBy: socket.userId,
                readAt: new Date().toISOString(),
            });
        });

        // Disconnect
        socket.on('disconnect', (reason) => {
            console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);

            // Limpar typing
            typingUsers.forEach((users, conversationId) => {
                if (users.has(socket.userId)) {
                    handleStopTyping(socket, conversationId);
                }
            });
        });
    });

    // Typing handlers
    function handleStartTyping(socket, conversationId) {
        if (!typingUsers.has(conversationId)) {
            typingUsers.set(conversationId, new Map());
        }

        const users = typingUsers.get(conversationId);
        users.set(socket.userId, {
            userId: socket.userId,
            userName: socket.userName,
            startedAt: new Date(),
        });

        // Clear existing timeout
        const timeoutKey = `${conversationId}:${socket.userId}`;
        if (typingTimeouts.has(timeoutKey)) {
            clearTimeout(typingTimeouts.get(timeoutKey));
        }

        // Auto-stop after 5s
        typingTimeouts.set(
            timeoutKey,
            setTimeout(() => handleStopTyping(socket, conversationId), 5000)
        );

        emitTypingUpdate(conversationId);
    }

    function handleStopTyping(socket, conversationId) {
        const users = typingUsers.get(conversationId);
        if (!users) return;

        users.delete(socket.userId);
        if (users.size === 0) {
            typingUsers.delete(conversationId);
        }

        const timeoutKey = `${conversationId}:${socket.userId}`;
        if (typingTimeouts.has(timeoutKey)) {
            clearTimeout(typingTimeouts.get(timeoutKey));
            typingTimeouts.delete(timeoutKey);
        }

        emitTypingUpdate(conversationId);
    }

    function emitTypingUpdate(conversationId) {
        const users = typingUsers.get(conversationId);
        const typingList = users
            ? Array.from(users.values()).map(u => ({
                userId: u.userId,
                userName: u.userName,
                startedAt: u.startedAt.toISOString(),
            }))
            : [];

        io.to(`conversation:${conversationId}`).emit('typing:update', {
            conversationId,
            typingUsers: typingList,
        });
    }

    // Salvar globalmente para uso nas API routes
    global.socketIO = io;

    console.log('[Socket] Server initialized');
    return io;
}

// ============================================
// START SERVER
// ============================================

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // Inicializar Socket.IO
    setupSocketIO(httpServer);

    httpServer.listen(port, () => {
        console.log(
            `> Ready on http://${hostname}:${port} as ${dev ? 'development' : process.env.NODE_ENV}`
        );
    });
});
