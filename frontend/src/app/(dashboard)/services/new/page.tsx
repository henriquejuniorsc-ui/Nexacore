"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, Sparkles, Clock, 
  DollarSign, Bell, Tag
} from "lucide-react";
import Link from "next/link";

const categories = [
  "Injetáveis",
  "Facial",
  "Corporal",
  "Laser",
  "Capilar",
  "Outros",
];

export default function NewServicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    category: "",
    reminderDays: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar serviço");
        setIsLoading(false);
        return;
      }

      router.push("/services");
    } catch (err) {
      setError("Erro ao criar serviço. Tente novamente.");
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/services"
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Novo Serviço</h1>
          <p className="text-text-secondary">Cadastre um novo procedimento</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-error/20 text-error">
            {error}
          </div>
        )}

        {/* Informações do Serviço */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-pink" />
            Informações do Serviço
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-text-secondary text-sm mb-1">
                Nome do Serviço *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="Botox, Preenchimento Labial, Limpeza de Pele..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-text-secondary text-sm mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field min-h-[100px]"
                placeholder="Descreva o procedimento, benefícios, indicações..."
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Duração e Preço */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-pink" />
            Duração e Preço
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Duração (minutos) *
              </label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                className="input-field"
              />
              <p className="text-text-tertiary text-xs mt-1">
                Tempo estimado do procedimento
              </p>
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="input-field"
              />
              <p className="text-text-tertiary text-xs mt-1">
                {formatCurrency(formData.price)}
              </p>
            </div>
          </div>
        </div>

        {/* Lembrete de Retorno */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-pink" />
            Lembrete de Retorno
          </h2>

          <div className="max-w-xs">
            <label className="block text-text-secondary text-sm mb-1">
              Dias para lembrete de retorno
            </label>
            <input
              type="number"
              min="0"
              value={formData.reminderDays}
              onChange={(e) => setFormData(prev => ({ ...prev, reminderDays: parseInt(e.target.value) || 0 }))}
              className="input-field"
            />
            <p className="text-text-tertiary text-xs mt-1">
              {formData.reminderDays > 0 
                ? `Cliente receberá lembrete ${formData.reminderDays} dias após o procedimento`
                : "Sem lembrete automático de retorno"
              }
            </p>
          </div>

          {/* Sugestões de dias */}
          <div className="flex flex-wrap gap-2">
            {[30, 60, 90, 120, 180, 365].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, reminderDays: days }))}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  formData.reminderDays === days
                    ? "bg-brand-pink text-white"
                    : "bg-surface-hover text-text-secondary hover:text-text-primary"
                }`}
              >
                {days < 365 ? `${days} dias` : "1 ano"}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="glass-card p-6">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-text-primary font-medium">Serviço Ativo</p>
              <p className="text-text-tertiary text-sm">
                Serviços inativos não aparecem para agendamento
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div 
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${
                  formData.isActive ? "bg-success" : "bg-surface-hover"
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  formData.isActive ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/services"
            className="btn-secondary"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-cta"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isLoading ? "Salvando..." : "Salvar Serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}
