/**
 * NexaCore - Socket Module
 * 
 * Exports centralizados do módulo de WebSocket
 */

// Events e tipos
export * from './events';

// Cliente (apenas client-side)
export { default as socketClient, getSocketClient } from './client';
export type { ConnectionState } from './client';

// Servidor (apenas server-side)
export { socketServer, initializeSocketServer, getSocketServer } from './server';
