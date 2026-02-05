"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, Kanban, RefreshCw, Settings } from "lucide-react";
import { TagManager } from "./TagManager";
import { useState } from "react";

interface InboxHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function InboxHeader({ onRefresh, loading }: InboxHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showTagManager, setShowTagManager] = useState(false);

  const isKanban = pathname.includes("/kanban");

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Toggle View */}
        <div className="flex items-center bg-surface-hover rounded-lg p-1 border border-white/10">
          <button
            onClick={() => router.push("/inbox")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
              !isKanban
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Lista
          </button>
          <button
            onClick={() => router.push("/inbox/kanban")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
              isKanban
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Kanban className="w-4 h-4" />
            Kanban
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={() => setShowTagManager(true)}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          title="Gerenciar Etiquetas"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <TagManager isOpen={showTagManager} onClose={() => setShowTagManager(false)} />
    </>
  );
}
