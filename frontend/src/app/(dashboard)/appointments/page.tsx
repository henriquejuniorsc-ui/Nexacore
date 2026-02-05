"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock,
  User, Loader2, AlertCircle, RefreshCw, Check, X,
  Search, Filter, MoreHorizontal, Phone, Scissors,
  DollarSign, CalendarDays, Eye, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================
interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  client: { name: string; phone: string };
  professional: { name: string };
  service: { name: string; price: number; duration?: number };
  notes: string | null;
}

// ==================== CONSTANTS ====================
const EASE = [0.2, 0, 0, 1]; // Material Design standard
const FADE_UP = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

const STATUS_CONFIG: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  SCHEDULED: { bg: "bg-warning-subtle", dot: "bg-warning", text: "text-warning", label: "Agendado" },
  CONFIRMED: { bg: "bg-success-subtle", dot: "bg-success", text: "text-success", label: "Confirmado" },
  IN_PROGRESS: { bg: "bg-trust-subtle", dot: "bg-trust", text: "text-trust", label: "Em andamento" },
  COMPLETED: { bg: "bg-white/5", dot: "bg-text-tertiary", text: "text-text-tertiary", label: "Concluído" },
  CANCELED: { bg: "bg-error-subtle", dot: "bg-error", text: "text-error", label: "Cancelado" },
  NO_SHOW: { bg: "bg-error-subtle", dot: "bg-error", text: "text-error", label: "Não compareceu" },
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const TIMELINE_START = 7; // 07:00
const TIMELINE_END = 21; // 21:00

// ==================== HELPERS ====================
function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ==================== SKELETON COMPONENTS ====================
function SkeletonPulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("skeleton", className)} style={style} />;
}

function TimelineSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-start gap-4 py-3 border-b border-white/[0.04]">
          <SkeletonPulse className="w-14 h-5 rounded" />
          <div className="flex-1">
            <SkeletonPulse className="w-full h-16 rounded-lg" style={{ animationDelay: `${i * 80}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== MINI CALENDAR ====================
function MiniCalendar({
  selectedDate,
  onSelectDate,
  appointmentDates = [],
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  appointmentDates?: string[];
}) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const today = useMemo(() => new Date(), []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const hasAppointment = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointmentDates.includes(dateStr);
  };

  return (
    <div className="select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="btn-icon">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-text-primary">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="btn-icon">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="text-center text-[11px] font-medium text-text-tertiary py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(viewYear, viewMonth, day);
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isSameDay(date, today);
          const isPast = date < today && !isCurrentDay;
          const hasApt = hasAppointment(day);

          return (
            <motion.button
              key={day}
              onClick={() => onSelectDate(date)}
              className={cn(
                "relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-150",
                isSelected
                  ? "bg-brand-gradient text-white font-semibold shadow-glow"
                  : isCurrentDay
                    ? "bg-white/[0.06] text-text-primary font-medium ring-1 ring-brand-pink/30"
                    : isPast
                      ? "text-text-tertiary/60 hover:bg-white/[0.03]"
                      : "text-text-secondary hover:bg-white/[0.06] hover:text-text-primary"
              )}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              {day}
              {hasApt && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-pink" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== STAT CARD ====================
function StatCard({ label, value, icon: Icon, color, delay = 0 }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: EASE }}
      className="glass-card p-4 flex items-center gap-3"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", `bg-${color}/10`)}>
        <Icon className={cn("w-5 h-5", `text-${color}`)} />
      </div>
      <div className="min-w-0">
        <p className="text-text-tertiary text-xs">{label}</p>
        <p className={cn("text-xl font-bold font-mono", `text-${color}`)}>{value}</p>
      </div>
    </motion.div>
  );
}

// ==================== APPOINTMENT CARD ====================
function AppointmentCard({
  apt,
  onUpdateStatus,
  index,
}: {
  apt: Appointment;
  onUpdateStatus: (id: string, status: string) => void;
  index: number;
}) {
  const [showActions, setShowActions] = useState(false);
  const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED;
  const startTime = new Date(apt.startTime);
  const endTime = new Date(apt.endTime);
  const durationMin = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: EASE }}
      className={cn(
        "group glass-card overflow-hidden transition-all duration-200",
        "hover:border-white/[0.12]"
      )}
    >
      {/* Gradient accent top */}
      <div
        className="h-[2px]"
        style={{
          background: apt.status === "CANCELED" || apt.status === "NO_SHOW"
            ? "rgba(239, 68, 68, 0.5)"
            : apt.status === "COMPLETED"
              ? "rgba(148, 163, 184, 0.3)"
              : "linear-gradient(135deg, #FF006E 0%, #FB5607 100%)"
        }}
      />

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Time block */}
          <div className="flex-shrink-0 text-center min-w-[72px]">
            <p className="text-lg font-bold text-text-primary font-mono leading-none">
              {formatTime(apt.startTime)}
            </p>
            <p className="text-[11px] text-text-tertiary mt-1">
              {formatTime(apt.endTime)}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              {durationMin}min
            </p>
          </div>

          {/* Vertical separator */}
          <div className="w-px self-stretch bg-white/[0.06] flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-text-primary font-medium text-[15px] truncate">
                {apt.client.name}
              </span>
              <span className={cn(
                "status-badge flex-shrink-0",
                `status-${apt.status.toLowerCase().replace("_", "-")}`
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-text-tertiary" />
                {apt.service.name}
              </span>
              <span className="text-white/[0.15]">•</span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-text-tertiary" />
                {apt.professional.name}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-brand-pink font-mono">
                {formatCurrency(apt.service.price)}
              </span>

              {apt.client.phone && (
                <a
                  href={`https://wa.me/${apt.client.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-tertiary hover:text-success transition-colors"
                  title="WhatsApp"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start gap-1 flex-shrink-0">
            {apt.status === "SCHEDULED" && (
              <motion.button
                onClick={() => onUpdateStatus(apt.id, "CONFIRMED")}
                className="p-2 rounded-lg bg-success-subtle text-success hover:bg-success/20 transition-all duration-150"
                title="Confirmar"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Check className="w-4 h-4" />
              </motion.button>
            )}
            {(apt.status === "SCHEDULED" || apt.status === "CONFIRMED") && (
              <motion.button
                onClick={() => onUpdateStatus(apt.id, "CANCELED")}
                className="p-2 rounded-lg bg-error-subtle text-error hover:bg-error/20 transition-all duration-150"
                title="Cancelar"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
            {apt.status === "CONFIRMED" && (
              <motion.button
                onClick={() => onUpdateStatus(apt.id, "COMPLETED")}
                className="px-3 py-2 rounded-lg bg-brand-gradient text-white text-xs font-semibold hover:opacity-90 transition-all duration-150"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Concluir
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== TIMELINE VIEW ====================
function TimelineView({ appointments, selectedDate }: {
  appointments: Appointment[];
  selectedDate: Date;
}) {
  const now = new Date();
  const isToday = isSameDay(selectedDate, now);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Group appointments by hour
  const appointmentsByHour = useMemo(() => {
    const grouped: Record<number, Appointment[]> = {};
    appointments.forEach((apt) => {
      const hour = new Date(apt.startTime).getHours();
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(apt);
    });
    return grouped;
  }, [appointments]);

  return (
    <div className="relative">
      {/* Current time indicator */}
      {isToday && currentHour >= TIMELINE_START && currentHour < TIMELINE_END && (
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none"
          style={{
            top: `${((currentHour - TIMELINE_START) * 60 + currentMinute) / ((TIMELINE_END - TIMELINE_START) * 60) * 100}%`,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-error flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <div className="flex-1 h-px bg-error/50" />
          </div>
        </div>
      )}

      {/* Time slots */}
      {Array.from({ length: TIMELINE_END - TIMELINE_START }, (_, i) => {
        const hour = TIMELINE_START + i;
        const hourApts = appointmentsByHour[hour] || [];
        const isPastHour = isToday && hour < currentHour;
        const isCurrentHour = isToday && hour === currentHour;

        return (
          <div
            key={hour}
            className={cn(
              "flex items-start gap-3 border-b border-white/[0.04] min-h-[52px]",
              isPastHour && "opacity-40",
              isCurrentHour && "opacity-100"
            )}
          >
            {/* Hour label */}
            <div className={cn(
              "w-12 py-3 text-right text-xs font-mono flex-shrink-0",
              isCurrentHour ? "text-brand-pink font-semibold" : "text-text-tertiary"
            )}>
              {String(hour).padStart(2, "0")}:00
            </div>

            {/* Appointments in this hour */}
            <div className="flex-1 py-2 space-y-1.5">
              {hourApts.map((apt) => {
                const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED;
                return (
                  <div
                    key={apt.id}
                    className={cn(
                      "px-3 py-2 rounded-lg border-l-2 text-sm",
                      "bg-white/[0.03] hover:bg-white/[0.05] transition-colors duration-150",
                      `border-l-${apt.status === "CANCELED" ? "error" : apt.status === "COMPLETED" ? "text-tertiary" : "brand-pink"}`
                    )}
                    style={{
                      borderLeftColor: apt.status === "CANCELED" ? "#EF4444"
                        : apt.status === "COMPLETED" ? "#64748B"
                          : apt.status === "CONFIRMED" ? "#10B981"
                            : "#FF006E"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{apt.client.name}</span>
                      <span className="text-[11px] text-text-tertiary">
                        {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5">
                      {apt.service.name} • {apt.professional.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetch(`/api/appointments?date=${dateStr}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar agendamentos");
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (response.ok) fetchAppointments(true);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    let result = [...appointments].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    if (filterStatus !== "all") {
      result = result.filter((a) => a.status === filterStatus);
    }
    return result;
  }, [appointments, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;
    const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const totalValue = appointments
      .filter((a) => a.status !== "CANCELED" && a.status !== "NO_SHOW")
      .reduce((sum, a) => sum + (a.service?.price || 0), 0);
    return { scheduled, confirmed, completed, totalValue };
  }, [appointments]);

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const goToToday = () => setSelectedDate(new Date());
  const goToPrev = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };
  const goToNext = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const dateLabel = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">Gerencie os agendamentos da clínica</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => fetchAppointments(true)}
            disabled={refreshing}
            className="btn-secondary py-2.5 px-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </motion.button>
          <Link href="/appointments/new">
            <motion.span
              className="btn-cta"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </motion.span>
          </Link>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="p-3 rounded-lg bg-error-subtle border border-error-border flex items-center gap-3"
          >
            <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
            <span className="text-sm text-error">{error}</span>
            <button onClick={() => fetchAppointments()} className="ml-auto btn-ghost text-xs text-error">
              <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Agendados" value={stats.scheduled} icon={Clock} color="warning" delay={0} />
        <StatCard label="Confirmados" value={stats.confirmed} icon={Check} color="success" delay={0.05} />
        <StatCard label="Concluídos" value={stats.completed} icon={CalendarDays} color="text-secondary" delay={0.1} />
        <StatCard label="Valor do Dia" value={formatCurrency(stats.totalValue)} icon={DollarSign} color="brand-pink" delay={0.15} />
      </div>

      {/* Main Content: Calendar + Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: Mini Calendar + Filters */}
        <div className="space-y-4">
          {/* Mini Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: EASE }}
            className="glass-card p-4"
          >
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3, ease: EASE }}
            className="glass-card p-4 space-y-3"
          >
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Filtrar por status
            </h3>
            <div className="space-y-1">
              {[
                { key: "all", label: "Todos", count: appointments.length },
                { key: "SCHEDULED", label: "Agendados", count: stats.scheduled },
                { key: "CONFIRMED", label: "Confirmados", count: stats.confirmed },
                { key: "COMPLETED", label: "Concluídos", count: stats.completed },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilterStatus(item.key)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150",
                    filterStatus === item.key
                      ? "bg-white/[0.08] text-text-primary font-medium"
                      : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
                  )}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-text-tertiary font-mono">{item.count}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Date nav + Appointments */}
        <div className="space-y-4">
          {/* Date Navigation + View Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3, ease: EASE }}
            className="glass-card p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-1">
              <button onClick={goToPrev} className="btn-icon">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={goToNext} className="btn-icon">
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="ml-2 flex items-center gap-2">
                <h2 className="text-text-primary font-medium text-[15px] capitalize">
                  {dateLabel}
                </h2>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-pink/15 text-brand-pink text-[11px] font-semibold">
                    Hoje
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isToday && (
                <button onClick={goToToday} className="btn-ghost text-xs">
                  Ir para Hoje
                </button>
              )}

              {/* View mode toggle */}
              <div className="flex items-center bg-surface-hover rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                    viewMode === "list"
                      ? "bg-white/[0.08] text-text-primary"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  Lista
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                    viewMode === "timeline"
                      ? "bg-white/[0.08] text-text-primary"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  Timeline
                </button>
              </div>
            </div>
          </motion.div>

          {/* Appointments content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-4"
              >
                <TimelineSkeleton />
              </motion.div>
            ) : filteredAppointments.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card empty-state"
              >
                <Calendar className="empty-state-icon" />
                <h3 className="empty-state-title">
                  {filterStatus !== "all"
                    ? "Nenhum resultado para este filtro"
                    : "Nenhum agendamento"
                  }
                </h3>
                <p className="empty-state-text">
                  {filterStatus !== "all"
                    ? "Tente remover o filtro ou selecionar outra data"
                    : "Não há agendamentos para este dia"
                  }
                </p>
                <Link href="/appointments/new" className="btn-cta text-sm">
                  <Plus className="w-4 h-4" /> Criar Agendamento
                </Link>
              </motion.div>
            ) : viewMode === "timeline" ? (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-4 overflow-y-auto max-h-[calc(100vh-320px)]"
              >
                <TimelineView
                  appointments={filteredAppointments}
                  selectedDate={selectedDate}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {filteredAppointments.map((apt, index) => (
                  <AppointmentCard
                    key={apt.id}
                    apt={apt}
                    onUpdateStatus={updateStatus}
                    index={index}
                  />
                ))}

                {/* Day summary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between px-4 py-3 text-sm text-text-tertiary"
                >
                  <span>{filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? "s" : ""}</span>
                  <span className="font-mono font-medium text-text-secondary">
                    Total: {formatCurrency(stats.totalValue)}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}