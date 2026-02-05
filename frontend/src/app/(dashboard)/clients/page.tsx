"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, Plus, Search, Phone, Mail,
  Calendar, Edit, MessageSquare,
  Loader2, AlertCircle, RefreshCw,
  ChevronRight, Filter, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  lastVisit: string | null;
  totalAppointments: number;
  totalSpent: number;
  isActive: boolean;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterStatus !== "all") params.append("status", filterStatus);
      
      const response = await fetch(`/api/clients?${params}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar clientes");
      }
      
      const data = await response.json();
      setClients(data.clients || []);
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      setError(err.message || "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.isActive).length;
  const totalRevenue = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-pink mx-auto mb-4" />
          <p className="text-text-secondary">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl text-text-primary">Clientes</h1>
          <p className="text-text-secondary text-sm sm:text-base">Gerencie sua base de clientes</p>
        </div>
        <Link href="/clients/new" className="btn-cta w-full sm:w-auto justify-center">
          <Plus className="w-5 h-5" />
          Novo Cliente
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-error/20 text-error flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-sm">{error}</span>
          <button onClick={fetchClients} className="btn-secondary text-sm py-1">
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-3 sm:p-4">
          <p className="text-text-tertiary text-xs sm:text-sm">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-text-primary font-mono">{totalClients}</p>
        </div>
        <div className="glass-card p-3 sm:p-4">
          <p className="text-text-tertiary text-xs sm:text-sm">Ativos</p>
          <p className="text-xl sm:text-2xl font-bold text-success font-mono">{activeClients}</p>
        </div>
        <div className="glass-card p-3 sm:p-4">
          <p className="text-text-tertiary text-xs sm:text-sm">Inativos</p>
          <p className="text-xl sm:text-2xl font-bold text-warning font-mono">{totalClients - activeClients}</p>
        </div>
        <div className="glass-card p-3 sm:p-4">
          <p className="text-text-tertiary text-xs sm:text-sm">Receita</p>
          <p className="text-lg sm:text-2xl font-bold text-brand-pink font-mono truncate">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "sm:hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors",
            filterStatus !== "all"
              ? "bg-brand-pink/20 border-brand-pink/50 text-brand-pink"
              : "bg-surface-hover border-white/10 text-text-secondary"
          )}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {filterStatus !== "all" && (
            <span className="w-2 h-2 rounded-full bg-brand-pink" />
          )}
        </button>

        <div className="hidden sm:flex gap-2">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filterStatus === status
                  ? "bg-brand-gradient text-white"
                  : "bg-surface-hover text-text-secondary hover:text-text-primary"
              )}
            >
              {status === "all" ? "Todos" : status === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="sm:hidden glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-primary">Filtrar por status</span>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setShowFilters(false);
                }}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  filterStatus === status
                    ? "bg-brand-gradient text-white"
                    : "bg-surface-hover text-text-secondary"
                )}
              >
                {status === "all" ? "Todos" : status === "active" ? "Ativos" : "Inativos"}
              </button>
            ))}
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <Users className="w-12 sm:w-16 h-12 sm:h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-text-primary text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
          <p className="text-text-secondary text-sm mb-4">Comece adicionando seu primeiro cliente</p>
          <Link href="/clients/new" className="btn-cta inline-flex">
            <Plus className="w-5 h-5" /> Adicionar Cliente
          </Link>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="glass-card p-4 block hover:border-white/20 transition-all active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-gradient/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-pink font-medium text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-text-primary truncate">
                        {client.name}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                        client.isActive ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                      )}>
                        {client.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{formatPhone(client.phone)}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(client.lastVisit)}</span>
                      </div>
                      <div>
                        <span className="font-mono text-text-primary">{client.totalAppointments}</span> atend.
                      </div>
                      <div className="text-brand-pink font-mono">
                        {formatCurrency(client.totalSpent || 0)}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden lg:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-text-tertiary font-medium text-sm">Cliente</th>
                    <th className="text-left p-4 text-text-tertiary font-medium text-sm">Contato</th>
                    <th className="text-left p-4 text-text-tertiary font-medium text-sm">Última Visita</th>
                    <th className="text-left p-4 text-text-tertiary font-medium text-sm">Atendimentos</th>
                    <th className="text-left p-4 text-text-tertiary font-medium text-sm">Total Gasto</th>
                    <th className="text-left p-4 text-text-tertiary font-medium text-sm">Status</th>
                    <th className="text-right p-4 text-text-tertiary font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-white/5 hover:bg-surface-hover transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-gradient/20 flex items-center justify-center">
                            <span className="text-brand-pink font-medium">{client.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-text-primary font-medium">{client.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-text-secondary text-sm">
                            <Phone className="w-4 h-4" />
                            {formatPhone(client.phone)}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-2 text-text-tertiary text-sm">
                              <Mail className="w-4 h-4" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-text-secondary text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDate(client.lastVisit)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-text-primary font-mono">{client.totalAppointments || 0}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-text-primary font-mono">{formatCurrency(client.totalSpent || 0)}</span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          client.isActive ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                        )}>
                          {client.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-success transition-colors" title="WhatsApp">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <Link href={`/clients/${client.id}`} className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}