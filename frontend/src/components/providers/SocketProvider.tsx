/**
 * NexaCore - Socket Provider
 * 
 * Provider React para inicializar e gerenciar a conexão WebSocket globalmente
 * Deve ser usado no layout principal da aplicação
 * 
 * @example
 * // No layout.tsx:
 * <SocketProvider>
 *   {children}
 * </SocketProvider>
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { ConnectionState } from '@/lib/socket/client';

// ============================================
// TYPES
// ============================================

interface SocketContextValue extends ConnectionState {
    connect: () => Promise<void>;
    disconnect: () => void;
}

// ============================================
// CONTEXT
// ============================================

const SocketContext = createContext<SocketContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface SocketProviderProps {
    children: ReactNode;
    autoConnect?: boolean;
}

export function SocketProvider({ children, autoConnect = true }: SocketProviderProps) {
    const socket = useSocket({ autoConnect });

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useSocketContext(): SocketContextValue {
    const context = useContext(SocketContext);

    if (!context) {
        // Retornar valores padrão se fora do provider
        return {
            connected: false,
            authenticated: false,
            reconnecting: false,
            error: null,
            connect: async () => { },
            disconnect: () => { },
        };
    }

    return context;
}

// ============================================
// CONNECTION STATUS COMPONENT
// ============================================

interface ConnectionStatusProps {
    showWhenConnected?: boolean;
    className?: string;
}

export function ConnectionStatus({
    showWhenConnected = false,
    className = '',
}: ConnectionStatusProps) {
    const { connected, reconnecting, error } = useSocketContext();

    if (connected && !showWhenConnected) return null;

    return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
            {reconnecting ? (
                <>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-yellow-500">Reconectando...</span>
                </>
            ) : connected ? (
                <>
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-500">Conectado</span>
                </>
            ) : error ? (
                <>
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-red-500">{error}</span>
                </>
            ) : (
                <>
                    <span className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span className="text-gray-500">Desconectado</span>
                </>
            )}
        </div>
    );
}

export default SocketProvider;
