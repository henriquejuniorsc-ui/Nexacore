"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, User, Mail, Phone, 
  MapPin, FileText, Calendar
} from "lucide-react";
import Link from "next/link";

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    birthDate: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
    allowsMarketing: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar cliente");
        setIsLoading(false);
        return;
      }

      router.push("/clients");
    } catch (err) {
      setError("Erro ao criar cliente. Tente novamente.");
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/clients"
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Novo Cliente</h1>
          <p className="text-text-secondary">Cadastre um novo cliente</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-error/20 text-error">
            {error}
          </div>
        )}

        {/* Dados Pessoais */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <User className="w-5 h-5 text-brand-pink" />
            Dados Pessoais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="Maria da Silva"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                className="input-field"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="maria@email.com"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                CPF
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                className="input-field"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-pink" />
            Endereço
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-text-secondary text-sm mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="input-field"
                placeholder="Rua, número, complemento"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="input-field"
                placeholder="São Paulo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-secondary text-sm mb-1">
                  Estado
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="input-field"
                >
                  <option value="">UF</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="input-field"
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-pink" />
            Observações
          </h2>

          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="input-field min-h-[100px]"
            placeholder="Alergias, preferências, informações importantes..."
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.allowsMarketing}
              onChange={(e) => setFormData(prev => ({ ...prev, allowsMarketing: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-surface-hover text-brand-pink focus:ring-brand-pink"
            />
            <span className="text-text-secondary text-sm">
              Cliente autoriza receber mensagens promocionais
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/clients"
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
            {isLoading ? "Salvando..." : "Salvar Cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
