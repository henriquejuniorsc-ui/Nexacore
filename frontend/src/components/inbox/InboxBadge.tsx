"use client";

import { useInboxNotifications } from "@/hooks/useInboxNotifications";

export function InboxBadge() {
  const { stats } = useInboxNotifications({ pollInterval: 10000 });

  if (stats.totalUnread === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-pink text-white text-xs font-bold rounded-full px-1 animate-pulse">
      {stats.totalUnread > 99 ? "99+" : stats.totalUnread}
    </span>
  );
}
