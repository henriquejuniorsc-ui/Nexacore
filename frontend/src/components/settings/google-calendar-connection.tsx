"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Check, ExternalLink, Loader2, RefreshCw, 
  Trash2, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleCalendarStatus {
  connected: boolean;
  calendars?: { id: string; summary: string }[];
  selectedCalendars?: string[];
  error?: string;
}

export default function GoogleCalendarConnection() {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Buscar status inicial
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/google-calendar");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching Google Calendar status:", error);
      setStatus({ connected: false, error: "Erro ao verificar status" });
    } finally {
      setLoading(false);
    }
  };

  // Iniciar conexão OAuth
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/google-calendar/auth-url");
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error getting auth URL:", error);
    } finally {
      setConnecting(false);
    }
  };

  // Desconectar
  const handleDisconnect = async () => {
    try {
      await fetch("/api/google-calendar", { method: "DELETE" });
      setStatus({ connected: false });
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  // Selecionar calendário
  const handleSelectCalendar = async (calendarId: string, selected: boolean) => {
    try {
      await fetch("/api/google-calendar/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId, selected }),
      });
      fetchStatus();
    } catch (error) {
      console.error("Error selecting calendar:", error);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            status?.connected ? "bg-success/20" : "bg-trust/20"
          )}>
            <Calendar className={cn(
              "w-6 h-6",
              status?.connected ? "text-success" : "text-trust"
            )} />
          </div>
          <div>
            <h3 className="font-heading text-lg text-text-primary">Google Calendar</h3>
            <p className="text-text-tertiary text-sm">Sincronize agendamentos</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          status?.connected 
            ? "bg-success/20 text-success" 
            : "bg-warning/20 text-warning"
        )}>
          {status?.connected ? (
            <>
              <Check className="w-4 h-4" />
              Conectado
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              Não configurado
            </>
          )}
        </div>
      </div>

      {/* Connected State */}
      {status?.connected && (
        <div className="space-y-4">
          {/* Calendários disponíveis */}
          {status.calendars && status.calendars.length > 0 && (
            <div>
              <p className="text-text-secondary text-sm mb-3">
                Selecione os calendários para sincronizar:
              </p>
              <div className="space-y-2">
                {status.calendars.map((calendar) => {
                  const isSelected = status.selectedCalendars?.includes(calendar.id);
                  return (
                    <label
                      key={calendar.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                        isSelected 
                          ? "bg-success/10 border border-success/30" 
                          : "bg-surface-hover border border-transparent hover:border-white/10"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectCalendar(calendar.id, e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-surface-hover text-success focus:ring-success"
                      />
                      <Calendar className="w-4 h-4 text-text-tertiary" />
                      <span className="text-text-primary">{calendar.summary}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg bg-surface-hover">
            <p className="text-text-secondary text-sm">
              ✅ Os agendamentos serão sincronizados automaticamente com os calendários selecionados.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchStatus}
              className="flex-1 py-2 rounded-lg border border-white/20 text-text-secondary hover:text-text-primary hover:border-white/40 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              onClick={handleDisconnect}
              className="py-2 px-4 rounded-lg bg-error/20 text-error hover:bg-error/30 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Desconectar
            </button>
          </div>
        </div>
      )}

      {/* Disconnected State */}
      {!status?.connected && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-surface-hover text-center">
            <Calendar className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-primary font-medium mb-2">
              Google Calendar não conectado
            </p>
            <p className="text-text-secondary text-sm">
              Conecte para sincronizar agendamentos automaticamente e verificar disponibilidade em tempo real.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-3 rounded-lg bg-trust text-white hover:bg-trust/90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {connecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ExternalLink className="w-5 h-5" />
            )}
            {connecting ? "Redirecionando..." : "Conectar com Google"}
          </button>

          <p className="text-text-tertiary text-xs text-center">
            Você será redirecionado para fazer login na sua conta Google
          </p>
        </div>
      )}
    </div>
  );
}
