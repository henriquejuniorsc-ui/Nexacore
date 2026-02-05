"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, User, Mail, Phone, 
  Briefcase, Clock, Calendar 
} from "lucide-react";
import Link from "next/link";

const weekDays = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const defaultWorkingHours = {
  monday: { open: "08:00", close: "18:00", enabled: true },
  tuesday: { open: "08:00", close: "18:00", enabled: true },
  wednesday: { open: "08:00", close: "18:00", enabled: true },
  thursday: { open: "08:00", close: "18:00", enabled: true },
  friday: { open: "08:00", close: "18:00", enabled: true },
  saturday: { open: "08:00", close: "12:00", enabled: false },
  sunday: { open: "08:00", close: "12:00", enabled: false },
};

export default function NewProfessionalPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    bio: "",
    bufferTime: 15,
    workingHours: defaultWorkingHours,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar profissional");
        setIsLoading(false);
        return;
      }

      router.push("/professionals");
    } catch (err) {
      setError("Erro ao criar profissional. Tente novamente.");
      setIsLoading(false);
    }
  };

  const updateWorkingHours = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/professionals"
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Novo Profissional</h1>
          <p className="text-text-secondary">Adicione um novo membro à equipe</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-error/20 text-error">
            {error}
          </div>
        )}

        {/* Dados Básicos */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <User className="w-5 h-5 text-brand-pink" />
            Dados Básicos
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
                placeholder="Dr. João Silva"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="joao@clinica.com"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Especialidade
              </label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                className="input-field"
                placeholder="Dermatologista, Esteticista..."
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Biografia
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="input-field min-h-[100px]"
              placeholder="Breve descrição sobre o profissional..."
            />
          </div>

          <div className="w-48">
            <label className="block text-text-secondary text-sm mb-1">
              Intervalo entre consultas (min)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={formData.bufferTime}
              onChange={(e) => setFormData(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 0 }))}
              className="input-field"
            />
          </div>
        </div>

        {/* Horários de Trabalho */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-pink" />
            Horários de Trabalho
          </h2>

          <div className="space-y-3">
            {weekDays.map((day) => {
              const hours = formData.workingHours[day.key as keyof typeof formData.workingHours];
              return (
                <div 
                  key={day.key}
                  className="flex items-center gap-4 p-3 rounded-lg bg-surface-hover"
                >
                  <label className="flex items-center gap-2 w-40">
                    <input
                      type="checkbox"
                      checked={hours.enabled}
                      onChange={(e) => updateWorkingHours(day.key, "enabled", e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-surface-hover text-brand-pink focus:ring-brand-pink"
                    />
                    <span className="text-text-primary">{day.label}</span>
                  </label>

                  {hours.enabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateWorkingHours(day.key, "open", e.target.value)}
                        className="input-field py-1 px-2 w-28"
                      />
                      <span className="text-text-tertiary">até</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateWorkingHours(day.key, "close", e.target.value)}
                        className="input-field py-1 px-2 w-28"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/professionals"
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
            {isLoading ? "Salvando..." : "Salvar Profissional"}
          </button>
        </div>
      </form>
    </div>
  );
}
