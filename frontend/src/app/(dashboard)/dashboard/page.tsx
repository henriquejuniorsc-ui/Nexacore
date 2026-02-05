"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Users, CreditCard, TrendingUp, ArrowUpRight, 
  ArrowDownRight, Clock, Bell, Plus, ChevronRight,
  MessageSquare, Bot, AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Animation constants
const EASE = [0.25, 0.1, 0.25, 1];
const staggerChildren = { staggerChildren: 0.08, delayChildren: 0.1 };
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

// Types
interface DashboardData {
  stats: { todayAppointments: number; appointmentsChange: number; newClients: number; clientsChange: number; monthRevenue: number; revenueChange: number; conversionRate: number; totalClients: number; };
  todayAppointments: Array<{ id: string; time: string; client: string; service: string; professional: string; status: string; }>;
  pendingReminders: Array<{ id: string; client: string; phone: string; procedure: string; performedAt: string; nextReminderAt: string; }>;
  recentConversations: Array<{ id: string; client: string; phone: string; lastMessage: string; time: string; }>;
  tenant: { name: string; aiEnabled: boolean; };
}

// Skeleton components
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-surface-hover", className)}>
      <motion.div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent" animate={{ translateX: ["100%", "-100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
    </div>
  );
}

function StatsCardSkeleton() {
  return (
    <div className="bg-surface/70 backdrop-blur border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <SkeletonPulse className="w-12 h-12 rounded-xl" />
        <SkeletonPulse className="w-16 h-5 rounded-md" />
      </div>
      <SkeletonPulse className="w-24 h-8 rounded-md mb-2" />
      <SkeletonPulse className="w-32 h-4 rounded-md" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <SkeletonPulse className="w-48 h-8 rounded-md mb-2" />
          <SkeletonPulse className="w-64 h-4 rounded-md" />
        </div>
        <div className="flex gap-3">
          <SkeletonPulse className="w-28 h-10 rounded-lg" />
          <SkeletonPulse className="w-40 h-10 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface/70 backdrop-blur border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <SkeletonPulse className="w-48 h-6 rounded-md" />
            <SkeletonPulse className="w-24 h-5 rounded-md" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-surface-hover/50">
                <SkeletonPulse className="w-16 h-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="w-32 h-4 rounded-md" />
                  <SkeletonPulse className="w-48 h-3 rounded-md" />
                </div>
                <SkeletonPulse className="w-20 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-surface/70 backdrop-blur border border-white/10 rounded-xl p-6">
            <SkeletonPulse className="w-40 h-6 rounded-md mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface-hover/50">
                  <SkeletonPulse className="w-24 h-4 rounded-md mb-2" />
                  <SkeletonPulse className="w-32 h-3 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card
function StatCard({ name, value, change, changeType, icon: Icon, href, index }: {
  name: string; value: string; change: string; changeType: "positive" | "negative" | "neutral"; icon: React.ElementType; href: string; index: number;
}) {
  return (
    <motion.div variants={fadeInUp} custom={index}>
      <Link href={href}>
        <motion.div
          className="relative bg-surface/70 backdrop-blur border border-white/10 rounded-xl p-6 overflow-hidden group"
          whileHover={{ y: -4, borderColor: "rgba(255,255,255,0.2)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="absolute inset-0 bg-gradient-to-br from-brand-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <motion.div className="w-12 h-12 rounded-xl bg-brand-gradient/20 flex items-center justify-center" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.2 }}>
                <Icon className="w-6 h-6 text-brand-pink" />
              </motion.div>
              <div className={cn("flex items-center gap-1 text-sm font-medium", changeType === "positive" ? "text-success" : changeType === "negative" ? "text-error" : "text-text-secondary")}>
                {changeType === "positive" ? <ArrowUpRight className="w-4 h-4" /> : changeType === "negative" ? <ArrowDownRight className="w-4 h-4" /> : null}
                {change}
              </div>
            </div>
            <motion.p className="text-2xl font-bold text-text-primary mb-1 font-mono" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + index * 0.1 }}>
              {value}
            </motion.p>
            <p className="text-text-secondary text-sm">{name}</p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Appointment Item
function AppointmentItem({ apt, index }: { apt: DashboardData["todayAppointments"][0]; index: number }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    CONFIRMED: { bg: "bg-success/20", text: "text-success", label: "Confirmado" },
    SCHEDULED: { bg: "bg-warning/20", text: "text-warning", label: "Agendado" },
    IN_PROGRESS: { bg: "bg-trust/20", text: "text-trust", label: "Em andamento" },
    COMPLETED: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Concluído" },
    CANCELED: { bg: "bg-error/20", text: "text-error", label: "Cancelado" },
  };
  const status = statusConfig[apt.status] || statusConfig.SCHEDULED;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ x: 4, backgroundColor: "rgba(31, 41, 55, 0.8)" }}
      className="flex items-center gap-4 p-3 rounded-lg bg-surface-hover/50 transition-colors cursor-pointer"
    >
      <div className="w-16 text-center">
        <span className="text-lg font-bold text-text-primary font-mono">{apt.time}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-medium truncate">{apt.client}</p>
        <p className="text-text-secondary text-sm truncate">{apt.service} • {apt.professional}</p>
      </div>
      <motion.span className={cn("px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", status.bg, status.text)} whileHover={{ scale: 1.05 }}>
        {status.label}
      </motion.span>
    </motion.div>
  );
}

// Main Component
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Erro ao carregar dados");
      const result = await response.json();
      setData(result);
      setError("");
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          </motion.div>
          <p className="text-text-primary text-lg mb-2">{error || "Erro ao carregar"}</p>
          <p className="text-text-secondary text-sm mb-4">Tente novamente em alguns instantes</p>
          <motion.button onClick={() => fetchData()} className="inline-flex items-center gap-2 px-4 py-2 bg-surface-hover rounded-lg text-text-primary hover:bg-white/10 transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const stats: Array<{ name: string; value: string; change: string; changeType: "positive" | "negative" | "neutral"; icon: React.ElementType; href: string }> = [
    { name: "Agendamentos Hoje", value: data.stats.todayAppointments.toString(), change: `${data.stats.appointmentsChange > 0 ? "+" : ""}${data.stats.appointmentsChange}%`, changeType: data.stats.appointmentsChange >= 0 ? "positive" : "negative", icon: Calendar, href: "/appointments" },
    { name: "Novos Clientes", value: data.stats.newClients.toString(), change: `${data.stats.clientsChange > 0 ? "+" : ""}${data.stats.clientsChange}%`, changeType: data.stats.clientsChange >= 0 ? "positive" : "negative", icon: Users, href: "/clients" },
    { name: "Faturamento do Mês", value: formatCurrency(data.stats.monthRevenue), change: `${data.stats.revenueChange > 0 ? "+" : ""}${data.stats.revenueChange}%`, changeType: data.stats.revenueChange >= 0 ? "positive" : "negative", icon: CreditCard, href: "/payments" },
    { name: "Taxa de Conversão", value: `${data.stats.conversionRate}%`, change: `${data.stats.totalClients} clientes`, changeType: "neutral", icon: TrendingUp, href: "/clients" },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: staggerChildren } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Bem-vindo(a)! 👋</h1>
          <p className="text-text-secondary">{data.tenant.name} • {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="flex gap-3">
          <motion.button onClick={() => fetchData(true)} disabled={refreshing} className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-hover rounded-lg text-text-primary hover:bg-white/10 transition-colors disabled:opacity-50" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Atualizar
          </motion.button>
          <Link href="/appointments/new">
            <motion.span className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta text-cta-text font-bold rounded-lg shadow-cta" whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(255, 195, 0, 0.45)" }} whileTap={{ scale: 0.98 }}>
              <Plus className="w-5 h-5" />
              Novo Agendamento
            </motion.span>
          </Link>
        </div>
      </motion.div>

      {/* AI Banner */}
      <AnimatePresence>
        {!data.tenant.aiEnabled && (
          <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -20, height: 0 }} className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-4">
            <Bot className="w-6 h-6 text-warning" />
            <div className="flex-1">
              <p className="text-text-primary font-medium">Assistente IA desativado</p>
              <p className="text-text-secondary text-sm">Ative a IA para responder automaticamente aos clientes via WhatsApp</p>
            </div>
            <Link href="/settings">
              <motion.span className="px-4 py-2 bg-surface-hover rounded-lg text-text-primary text-sm font-medium hover:bg-white/10 transition-colors" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Configurar</motion.span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div variants={{ visible: { transition: staggerChildren } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => <StatCard key={stat.name} {...stat} index={index} />)}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <motion.div variants={fadeInUp} className="lg:col-span-2 bg-surface/70 backdrop-blur border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-pink" />
              Agendamentos de Hoje
            </h2>
            <Link href="/appointments" className="text-brand-pink text-sm hover:underline flex items-center gap-1 group">
              Ver todos <motion.span whileHover={{ x: 4 }} className="inline-block"><ChevronRight className="w-4 h-4" /></motion.span>
            </Link>
          </div>
          {data.todayAppointments.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary mb-2">Nenhum agendamento para hoje</p>
              <Link href="/appointments/new" className="text-brand-pink text-sm hover:underline">Criar agendamento</Link>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {data.todayAppointments.map((apt, index) => <AppointmentItem key={apt.id} apt={apt} index={index} />)}
            </div>
          )}
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Reminders */}
          <motion.div variants={fadeInUp} className="bg-surface/70 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
                <Bell className="w-5 h-5 text-warning" />
                Lembretes
              </h2>
              {data.pendingReminders.length > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-2 py-1 rounded-full bg-warning/20 text-warning text-xs font-medium">
                  {data.pendingReminders.length}
                </motion.span>
              )}
            </div>
            {data.pendingReminders.length === 0 ? (
              <p className="text-text-tertiary text-sm text-center py-6">Nenhum lembrete pendente</p>
            ) : (
              <div className="space-y-2">
                {data.pendingReminders.slice(0, 3).map((reminder, index) => (
                  <motion.div key={reminder.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ x: 4 }} className="p-3 rounded-lg bg-surface-hover/50 cursor-pointer">
                    <p className="text-text-primary text-sm font-medium truncate">{reminder.client}</p>
                    <p className="text-text-secondary text-xs truncate">{reminder.procedure}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Conversations */}
          <motion.div variants={fadeInUp} className="bg-surface/70 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-pink" />
                Conversas
              </h2>
            </div>
            {data.recentConversations.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-tertiary text-sm">Nenhuma conversa recente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentConversations.slice(0, 3).map((conv, index) => (
                  <motion.div key={conv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ x: 4 }} className="p-3 rounded-lg bg-surface-hover/50 cursor-pointer">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-text-primary text-sm font-medium truncate">{conv.client}</p>
                      <span className="text-text-tertiary text-xs whitespace-nowrap ml-2">{new Date(conv.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-text-secondary text-xs truncate">{conv.lastMessage}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp} className="bg-surface/70 backdrop-blur border border-white/10 rounded-xl p-6">
            <h2 className="font-heading text-lg text-text-primary mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/appointments/new", icon: Calendar, label: "Agendar", gradient: true },
                { href: "/clients/new", icon: Users, label: "Novo Cliente", gradient: false },
                { href: "/ai-assistant", icon: Bot, label: "Assistente IA", gradient: false },
                { href: "/settings", icon: Bell, label: "Configurações", gradient: false },
              ].map((action, index) => (
                <Link key={action.href} href={action.href}>
                  <motion.div
                    className={cn("p-3 rounded-lg text-center text-sm font-medium", action.gradient ? "bg-brand-gradient text-white" : "bg-surface-hover text-text-primary hover:bg-white/10")}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <action.icon className="w-5 h-5 mx-auto mb-1" />
                    {action.label}
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
