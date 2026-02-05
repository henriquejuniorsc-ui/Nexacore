"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, DollarSign, Target, Percent, Plus, Edit2, Trash2,
  Loader2, X, ArrowRight, CheckCircle2, XCircle, Clock, Search,
  BarChart3, Sparkles, Gift, AlertTriangle, Eye, Filter, RefreshCw,
  ChevronDown, ChevronUp, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================
interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface UpsellRule {
  id: string;
  name: string;
  description: string | null;
  triggerService: Service;
  suggestService: Service;
  discountPercent: number;
  discountFixed: number;
  priority: number;
  suggestTiming: string;
  minDaysSinceLastService: number | null;
  maxTimesOffered: number | null;
  customMessage: string | null;
  isActive: boolean;
  stats: {
    totalSuggested: number;
    converted: number;
    accepted: number;
    rejected: number;
    conversionRate: number;
  };
}

interface UpsellSuggestion {
  id: string;
  createdAt: string;
  status: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  client: { id: string; name: string; phone: string };
  rule: { name: string };
  respondedAt: string | null;
  convertedAt: string | null;
}

interface Analytics {
  period: number;
  summary: {
    totalSuggested: number;
    converted: number;
    accepted: number;
    rejected: number;
    pending: number;
    conversionRate: number;
    totalRevenue: number;
    totalDiscount: number;
    averageTicket: number;
  };
  ruleAnalytics: any[];
  chartData: any[];
  topClients: any[];
}

// ==================== CONSTANTS ====================
const TIMING_OPTIONS = [
  { value: "DURING_CHAT", label: "Durante a conversa", desc: "Enquanto agenda" },
  { value: "AFTER_BOOKING", label: "Após confirmar", desc: "Logo que confirma" },
  { value: "AFTER_SERVICE", label: "Após realizar", desc: "Depois do procedimento" },
  { value: "REMINDER", label: "No lembrete", desc: "No lembrete de 24h" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SUGGESTED: { label: "Pendente", color: "text-warning", icon: Clock },
  VIEWED: { label: "Visualizado", color: "text-trust", icon: Eye },
  ACCEPTED: { label: "Aceito", color: "text-success", icon: CheckCircle2 },
  REJECTED: { label: "Recusado", color: "text-error", icon: XCircle },
  CONVERTED: { label: "Convertido", color: "text-brand-pink", icon: DollarSign },
  EXPIRED: { label: "Expirado", color: "text-text-tertiary", icon: Clock },
};

// ==================== COMPONENT ====================
export default function UpsellPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<UpsellRule[]>([]);
  const [suggestions, setSuggestions] = useState<UpsellSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");

  // Modal state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<UpsellRule | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerServiceId: "",
    suggestServiceId: "",
    discountPercent: 0,
    discountFixed: 0,
    priority: 0,
    suggestTiming: "AFTER_BOOKING",
    minDaysSinceLastService: "",
    maxTimesOffered: "3",
    customMessage: "",
  });

  // Filters
  const [period, setPeriod] = useState("30");
  const [statusFilter, setStatusFilter] = useState("");

  // ==================== FETCH DATA ====================
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, suggestionsRes, analyticsRes, servicesRes] = await Promise.all([
        fetch("/api/upsell/rules"),
        fetch(`/api/upsell/suggestions?limit=20${statusFilter ? `&status=${statusFilter}` : ""}`),
        fetch(`/api/upsell/analytics?period=${period}`),
        fetch("/api/services"),
      ]);

      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules || []);
      }

      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestions(data.suggestions || []);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, statusFilter]);

  // ==================== HANDLERS ====================
  const handleCreateRule = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      description: "",
      triggerServiceId: "",
      suggestServiceId: "",
      discountPercent: 10,
      discountFixed: 0,
      priority: 0,
      suggestTiming: "AFTER_BOOKING",
      minDaysSinceLastService: "",
      maxTimesOffered: "3",
      customMessage: "",
    });
    setShowRuleModal(true);
  };

  const handleEditRule = (rule: UpsellRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      triggerServiceId: rule.triggerService.id,
      suggestServiceId: rule.suggestService.id,
      discountPercent: rule.discountPercent,
      discountFixed: rule.discountFixed,
      priority: rule.priority,
      suggestTiming: rule.suggestTiming,
      minDaysSinceLastService: rule.minDaysSinceLastService?.toString() || "",
      maxTimesOffered: rule.maxTimesOffered?.toString() || "3",
      customMessage: rule.customMessage || "",
    });
    setShowRuleModal(true);
  };

  const handleSaveRule = async () => {
    if (!formData.name || !formData.triggerServiceId || !formData.suggestServiceId) {
      setError("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...formData,
        minDaysSinceLastService: formData.minDaysSinceLastService 
          ? parseInt(formData.minDaysSinceLastService) 
          : null,
        maxTimesOffered: formData.maxTimesOffered 
          ? parseInt(formData.maxTimesOffered) 
          : null,
        ...(editingRule ? { id: editingRule.id } : {}),
      };

      const response = await fetch("/api/upsell/rules", {
        method: editingRule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar");
      }

      setShowRuleModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (rule: UpsellRule) => {
    try {
      const response = await fetch("/api/upsell/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
      });

      if (response.ok) {
        setRules(rules.map(r => 
          r.id === rule.id ? { ...r, isActive: !r.isActive } : r
        ));
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;

    try {
      const response = await fetch(`/api/upsell/rules?id=${ruleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRules(rules.filter(r => r.id !== ruleId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ==================== HELPERS ====================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-pink mx-auto mb-4" />
          <p className="text-text-secondary">Carregando dados de upsell...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-brand-pink" />
            Upsell Automático
          </h1>
          <p className="text-text-secondary">
            Configure ofertas inteligentes para aumentar o ticket médio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-field py-2 text-sm"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <button onClick={handleCreateRule} className="btn-cta">
            <Plus className="w-5 h-5" />
            Nova Regra
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-error/20 text-error flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-brand-pink/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-brand-pink" />
              </div>
              <span className="text-text-secondary text-sm">Ofertas Enviadas</span>
            </div>
            <p className="text-2xl font-bold text-text-primary font-mono">
              {analytics.summary.totalSuggested}
            </p>
            <p className="text-text-tertiary text-xs mt-1">
              {analytics.summary.pending} aguardando resposta
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <span className="text-text-secondary text-sm">Convertidos</span>
            </div>
            <p className="text-2xl font-bold text-text-primary font-mono">
              {analytics.summary.converted}
            </p>
            <p className="text-text-tertiary text-xs mt-1">
              {analytics.summary.rejected} recusados
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cta/20 flex items-center justify-center">
                <Percent className="w-5 h-5 text-cta" />
              </div>
              <span className="text-text-secondary text-sm">Taxa de Conversão</span>
            </div>
            <p className="text-2xl font-bold text-text-primary font-mono">
              {analytics.summary.conversionRate}%
            </p>
            <p className="text-text-tertiary text-xs mt-1">
              Meta: 15-25%
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-trust/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-trust" />
              </div>
              <span className="text-text-secondary text-sm">Receita Gerada</span>
            </div>
            <p className="text-2xl font-bold text-success font-mono">
              {formatCurrency(analytics.summary.totalRevenue)}
            </p>
            <p className="text-text-tertiary text-xs mt-1">
              Ticket médio: {formatCurrency(analytics.summary.averageTicket)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg text-text-primary">
              Regras de Upsell
            </h2>
            <span className="text-text-tertiary text-sm">
              {rules.filter(r => r.isActive).length} ativas
            </span>
          </div>

          {rules.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Gift className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="font-heading text-xl text-text-primary mb-2">
                Nenhuma regra configurada
              </h3>
              <p className="text-text-secondary mb-4">
                Crie regras de upsell para aumentar seu faturamento automaticamente
              </p>
              <button onClick={handleCreateRule} className="btn-cta">
                <Plus className="w-5 h-5" />
                Criar Primeira Regra
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "glass-card p-4 border transition-all",
                    rule.isActive 
                      ? "border-transparent hover:border-brand-pink/30" 
                      : "border-white/5 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-text-primary truncate">
                          {rule.name}
                        </h3>
                        {rule.discountPercent > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                            -{rule.discountPercent}%
                          </span>
                        )}
                        {rule.discountFixed > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                            -{formatCurrency(rule.discountFixed)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                        <span className="text-text-tertiary">{rule.triggerService.name}</span>
                        <ArrowRight className="w-4 h-4 text-brand-pink" />
                        <span className="text-brand-pink font-medium">{rule.suggestService.name}</span>
                      </div>

                      {/* Mini stats */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-text-tertiary">
                          {rule.stats.totalSuggested} sugeridos
                        </span>
                        <span className="text-success">
                          {rule.stats.converted} convertidos
                        </span>
                        <span className="text-cta font-medium">
                          {rule.stats.conversionRate}% taxa
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          onChange={() => handleToggleRule(rule)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
                      </label>

                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 rounded-lg hover:bg-error/20 text-text-tertiary hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg text-text-primary">
              Sugestões Recentes
            </h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-surface border border-white/10 rounded-lg px-2 py-1 text-text-secondary"
            >
              <option value="">Todos</option>
              <option value="SUGGESTED">Pendentes</option>
              <option value="CONVERTED">Convertidos</option>
              <option value="REJECTED">Recusados</option>
            </select>
          </div>

          <div className="glass-card divide-y divide-white/5">
            {suggestions.length === 0 ? (
              <div className="p-6 text-center">
                <Clock className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary text-sm">
                  Nenhuma sugestão ainda
                </p>
              </div>
            ) : (
              suggestions.slice(0, 10).map((suggestion) => {
                const statusInfo = STATUS_CONFIG[suggestion.status];
                const StatusIcon = statusInfo?.icon || Clock;

                return (
                  <div key={suggestion.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-text-primary font-medium truncate">
                          {suggestion.client.name}
                        </p>
                        <p className="text-text-tertiary text-xs">
                          {suggestion.rule.name}
                        </p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                        statusInfo?.color,
                        suggestion.status === "CONVERTED" ? "bg-brand-pink/20" :
                        suggestion.status === "ACCEPTED" ? "bg-success/20" :
                        suggestion.status === "REJECTED" ? "bg-error/20" :
                        "bg-surface-hover"
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo?.label}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary">
                        {formatDate(suggestion.createdAt)}
                      </span>
                      {suggestion.status === "CONVERTED" && (
                        <span className="text-success font-medium">
                          {formatCurrency(suggestion.finalPrice || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRuleModal(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="sticky top-0 bg-surface border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-xl font-heading text-text-primary">
                {editingRule ? "Editar Regra" : "Nova Regra de Upsell"}
              </h2>
              <button onClick={() => setShowRuleModal(false)} className="text-text-tertiary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Nome da Regra *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Botox + Preenchimento"
                  className="input-field"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva quando e por que essa oferta é boa"
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              {/* Serviços */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Quando agendar... *
                  </label>
                  <select
                    value={formData.triggerServiceId}
                    onChange={(e) => setFormData({ ...formData, triggerServiceId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Selecione o serviço gatilho</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {formatCurrency(s.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Sugerir... *
                  </label>
                  <select
                    value={formData.suggestServiceId}
                    onChange={(e) => setFormData({ ...formData, suggestServiceId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Selecione o serviço a oferecer</option>
                    {services
                      .filter((s) => s.id !== formData.triggerServiceId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - {formatCurrency(s.price)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Desconto */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Desconto
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-text-tertiary text-xs mb-1 block">Percentual (%)</label>
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discountPercent: parseFloat(e.target.value) || 0,
                        discountFixed: 0 
                      })}
                      min="0"
                      max="100"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-text-tertiary text-xs mb-1 block">Valor Fixo (R$)</label>
                    <input
                      type="number"
                      value={formData.discountFixed}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discountFixed: parseFloat(e.target.value) || 0,
                        discountPercent: 0 
                      })}
                      min="0"
                      step="0.01"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Quando sugerir
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIMING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, suggestTiming: opt.value })}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        formData.suggestTiming === opt.value
                          ? "border-brand-pink bg-brand-pink/10"
                          : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <p className="text-text-primary font-medium text-sm">{opt.label}</p>
                      <p className="text-text-tertiary text-xs">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Limites */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Mín. dias desde último serviço
                  </label>
                  <input
                    type="number"
                    value={formData.minDaysSinceLastService}
                    onChange={(e) => setFormData({ ...formData, minDaysSinceLastService: e.target.value })}
                    placeholder="Opcional"
                    min="0"
                    className="input-field"
                  />
                  <p className="text-text-tertiary text-xs mt-1">
                    Só sugere se cliente não fez há X dias
                  </p>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Máx. vezes para oferecer
                  </label>
                  <input
                    type="number"
                    value={formData.maxTimesOffered}
                    onChange={(e) => setFormData({ ...formData, maxTimesOffered: e.target.value })}
                    placeholder="3"
                    min="1"
                    className="input-field"
                  />
                  <p className="text-text-tertiary text-xs mt-1">
                    Evita ser repetitivo com o mesmo cliente
                  </p>
                </div>
              </div>

              {/* Mensagem customizada */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Mensagem Personalizada
                </label>
                <textarea
                  value={formData.customMessage}
                  onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                  placeholder="Deixe em branco para usar mensagem padrão. Variáveis: {servico}, {desconto}, {preco_original}, {preco_final}"
                  rows={3}
                  className="input-field resize-none font-mono text-sm"
                />
                <p className="text-text-tertiary text-xs mt-1">
                  Variáveis: {"{servico}"}, {"{desconto}"}, {"{preco_original}"}, {"{preco_final}"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-surface border-t border-white/10 p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRuleModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRule}
                disabled={saving}
                className="btn-cta"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {editingRule ? "Salvar Alterações" : "Criar Regra"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
