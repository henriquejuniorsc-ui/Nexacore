"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  UserCircle, Plus, Search, Calendar, Mail, Phone,
  Edit, Star, Clock, Loader2, AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Professional {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  googleCalendarConnected: boolean;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  isActive: boolean;
  services: string[];
}

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("/api/professionals?includeInactive=true");
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar profissionais");
      }
      
      const data = await response.json();
      setProfessionals(data.professionals || []);
    } catch (err: any) {
      console.error("Error fetching professionals:", err);
      setError(err.message || "Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const filteredProfessionals = professionals.filter((pro) =>
    pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pro.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const activeProfessionals = professionals.filter(p => p.isActive).length;
  const totalAppointments = professionals.reduce((sum, p) => sum + p.appointmentsThisMonth, 0);
  const totalRevenue = professionals.reduce((sum, p) => sum + p.revenueThisMonth, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-pink mx-auto mb-4" />
          <p className="text-text-secondary">Carregando profissionais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Profissionais</h1>
          <p className="text-text-secondary">Gerencie a equipe da sua clínica</p>
        </div>
        <Link href="/professionals/new" className="btn-cta">
          <Plus className="w-5 h-5" />
          Novo Profissional
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-error/20 text-error flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={fetchProfessionals} className="ml-auto btn-secondary text-sm py-1">
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Profissionais Ativos</p>
          <p className="text-2xl font-bold text-text-primary font-mono">{activeProfessionals}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Atendimentos no Mês</p>
          <p className="text-2xl font-bold text-success font-mono">{totalAppointments}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Faturamento do Mês</p>
          <p className="text-2xl font-bold text-brand-pink font-mono">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-tertiary text-sm">Média por Profissional</p>
          <p className="text-2xl font-bold text-trust font-mono">
            {activeProfessionals > 0 ? formatCurrency(totalRevenue / activeProfessionals) : "R$ 0"}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar profissional..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      {filteredProfessionals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UserCircle className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-text-primary text-lg font-medium mb-2">Nenhum profissional encontrado</h3>
          <p className="text-text-secondary mb-4">Adicione profissionais para gerenciar a agenda</p>
          <Link href="/professionals/new" className="btn-cta inline-flex">
            <Plus className="w-5 h-5" /> Adicionar Profissional
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfessionals.map((pro) => (
            <div key={pro.id} className="glass-card p-6 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-gradient/20 flex items-center justify-center">
                    <span className="text-brand-pink font-bold text-lg">
                      {pro.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-text-primary font-medium">{pro.name}</h3>
                    <p className="text-text-tertiary text-sm">{pro.specialty || "Sem especialidade"}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  pro.isActive ? "bg-success/20 text-success" : "bg-error/20 text-error"
                )}>
                  {pro.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {pro.email && (
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Mail className="w-4 h-4" />
                    {pro.email}
                  </div>
                )}
                {pro.phone && (
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Phone className="w-4 h-4" />
                    {formatPhone(pro.phone)}
                  </div>
                )}
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Calendar className="w-4 h-4" />
                  {pro.googleCalendarConnected ? (
                    <span className="text-success">Google Calendar conectado</span>
                  ) : (
                    <span className="text-warning">Calendar não conectado</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-surface-hover mb-4">
                <div>
                  <p className="text-text-tertiary text-xs">Atendimentos</p>
                  <p className="text-text-primary font-bold font-mono">{pro.appointmentsThisMonth}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-xs">Faturamento</p>
                  <p className="text-text-primary font-bold font-mono">{formatCurrency(pro.revenueThisMonth)}</p>
                </div>
              </div>

              {pro.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {pro.services.slice(0, 3).map((service, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-surface-hover text-text-tertiary text-xs">
                      {service}
                    </span>
                  ))}
                  {pro.services.length > 3 && (
                    <span className="px-2 py-1 rounded-full bg-surface-hover text-text-tertiary text-xs">
                      +{pro.services.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Link href={`/professionals/${pro.id}`} className="flex-1 btn-secondary text-sm py-2 justify-center">
                  <Edit className="w-4 h-4" /> Editar
                </Link>
                <Link href={`/appointments?professionalId=${pro.id}`} className="flex-1 btn-secondary text-sm py-2 justify-center">
                  <Calendar className="w-4 h-4" /> Agenda
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
