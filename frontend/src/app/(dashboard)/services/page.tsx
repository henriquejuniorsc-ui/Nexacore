"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Plus, Search, Clock, DollarSign, Edit, 
  Bell, Loader2, AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string | null;
  procedureType: string | null;
  reminderDays: number | null;
  isActive: boolean;
  appointmentsCount: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/services?includeInactive=${showInactive}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar serviços");
      }
      
      const data = await response.json();
      setServices(data.services || []);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError(err.message || "Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [showInactive]);

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${minutes}min`;
  };

  const activeServices = services.filter(s => s.isActive).length;
  const totalRevenuePotential = services.reduce((sum, s) => sum + (s.price * s.appointmentsCount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-pink mx-auto mb-4" />
          <p className="text-text-secondary">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Serviços</h1>
          <p className="text-text-secondary">Gerencie os procedimentos oferecidos</p>
        </div>
        <Link href="/services/new" className="btn-cta">
          <Plus className="w-5 h-5" />
          Novo Serviço
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-error/20 text-error flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={fetchServices} className="ml-auto btn-secondary text-sm py-1">
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Total de Serviços</p>
          <p className="text-2xl font-bold text-text-primary font-mono">{services.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Serviços Ativos</p>
          <p className="text-2xl font-bold text-success font-mono">{activeServices}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Preço Médio</p>
          <p className="text-2xl font-bold text-brand-pink font-mono">
            {services.length > 0 
              ? formatCurrency(services.reduce((sum, s) => sum + s.price, 0) / services.length)
              : "R$ 0"
            }
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Agendamentos Total</p>
          <p className="text-2xl font-bold text-trust font-mono">
            {services.reduce((sum, s) => sum + s.appointmentsCount, 0)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-surface-hover text-brand-pink focus:ring-brand-pink"
          />
          <span className="text-text-secondary text-sm">Mostrar inativos</span>
        </label>
      </div>

      {filteredServices.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Sparkles className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-text-primary text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
          <p className="text-text-secondary mb-4">Cadastre os procedimentos da sua clínica</p>
          <Link href="/services/new" className="btn-cta inline-flex">
            <Plus className="w-5 h-5" /> Adicionar Serviço
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div key={service.id} className={cn(
              "glass-card p-6 hover:border-white/20 transition-all",
              !service.isActive && "opacity-60"
            )}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-text-primary font-medium">{service.name}</h3>
                  {service.category && (
                    <span className="text-text-tertiary text-sm">{service.category}</span>
                  )}
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  service.isActive ? "bg-success/20 text-success" : "bg-error/20 text-error"
                )}>
                  {service.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>

              {service.description && (
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-primary text-sm">{formatDuration(service.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-primary text-sm font-medium">{formatCurrency(service.price)}</span>
                </div>
              </div>

              {service.reminderDays && service.reminderDays > 0 && (
                <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-surface-hover">
                  <Bell className="w-4 h-4 text-warning" />
                  <span className="text-text-secondary text-xs">
                    Lembrete em {service.reminderDays} dias
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-text-tertiary text-sm">
                  {service.appointmentsCount} agendamentos
                </span>
                <Link href={`/services/${service.id}`} className="btn-secondary text-sm py-1">
                  <Edit className="w-4 h-4" /> Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
