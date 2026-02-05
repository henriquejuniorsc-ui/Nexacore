/**
 * NexaCore - TypingIndicator Component
 * 
 * Componente visual para exibir "fulano está digitando..."
 * Com animação de pontos
 * 
 * @example
 * <TypingIndicator conversationId={conversationId} />
 */

"use client";

import { useTypingIndicator } from '@/hooks/useInboxRealtime';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface TypingIndicatorProps {
    conversationId?: string;
    className?: string;
    showAvatar?: boolean;
}

// ============================================
// ANIMATED DOTS COMPONENT
// ============================================

function AnimatedDots() {
    return (
        <span className="inline-flex items-center gap-0.5 ml-0.5">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TypingIndicator({
    conversationId,
    className,
    showAvatar = true,
}: TypingIndicatorProps) {
    const { isTyping, typingUsers, typingText } = useTypingIndicator(conversationId);

    if (!isTyping) return null;

    return (
        <div className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm text-text-secondary animate-in fade-in slide-in-from-bottom-2 duration-200",
            className
        )}>
            {/* Avatar(s) */}
            {showAvatar && (
                <div className="flex -space-x-2">
                    {typingUsers.slice(0, 3).map((user, index) => (
                        <div
                            key={user.userId}
                            className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-surface"
                            style={{ zIndex: 3 - index }}
                        >
                            {user.userName.charAt(0).toUpperCase()}
                        </div>
                    ))}
                </div>
            )}

            {/* Text + Animation */}
            <div className="flex items-center text-text-tertiary">
                <span>{typingText.replace('...', '')}</span>
                <AnimatedDots />
            </div>
        </div>
    );
}

// ============================================
// BUBBLE VARIANT (dentro da área de mensagens)
// ============================================

export function TypingBubble({
    conversationId,
    className,
}: Omit<TypingIndicatorProps, 'showAvatar'>) {
    const { isTyping, typingUsers } = useTypingIndicator(conversationId);

    if (!isTyping) return null;

    const firstUser = typingUsers[0];

    return (
        <div className={cn(
            "flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200",
            className
        )}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary text-xs font-bold flex-shrink-0">
                {firstUser?.userName.charAt(0).toUpperCase() || '?'}
            </div>

            {/* Bubble with dots */}
            <div className="bg-surface-hover rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

// ============================================
// COMPACT VARIANT (para header/sidebar)
// ============================================

export function TypingIndicatorCompact({
    conversationId,
    className,
}: Omit<TypingIndicatorProps, 'showAvatar'>) {
    const { isTyping } = useTypingIndicator(conversationId);

    if (!isTyping) return null;

    return (
        <span className={cn(
            "inline-flex items-center text-xs text-brand-pink font-medium",
            className
        )}>
            digitando
            <AnimatedDots />
        </span>
    );
}

export default TypingIndicator;
