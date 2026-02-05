"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, Calendar, Clock, 
  User, Sparkles, MessageSquare
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// NEW APPOINTMENT PAGE - CORRIGIDO
// 
// Correções:
// - Envia horário no formato correto (sem conversão UTC indevida)
// - Usa o horário do slot diretamente
// - Exibe horários no timezone local
// =============================================================================

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface TimeSlot {
  start: string;
  end: string;
  formatted: string;
  available: boolean;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: "",
    professionalId: "",
    serviceId: "",
    date: "",
    selectedSlot: null as TimeSlot | null, // Armazena o slot completo
    notes: "",
    sendConfirmation: true,
  });

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, professionalsRes, servicesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/professionals"),
          fetch("/api/services"),
        ]);

        const clientsData = await clientsRes.json();
        const professionalsData = await professionalsRes.json();
        const servicesData = await servicesRes.json();

        setClients(clientsData.clients || []);
        setProfessionals(professionalsData.professionals || []);
        setServices(servicesData.services || []);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    fetchData();
  }, []);

  // Carregar horários disponíveis quando data/profissional/serviço mudar
  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.date || !formData.professionalId) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const params = new URLSearchParams({
          date: formData.date,
          professionalId: formData.professionalId,
          ...(formData.serviceId && { serviceId: formData.serviceId }),
        });

        const response = await fetch(`/api/appointments/available-slots?${params}`);
        const data = await response.json();
        
        // A API agora retorna slots com formato correto
        setAvailableSlots(data.slots || []);
      } catch (err) {
        console.error("Error loading slots:", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
    // Limpar slot selecionado quando mudar data/profissional/serviço
    setFormData(prev => ({ ...prev, selectedSlot: null }));
  }, [formData.date, formData.professionalId, formData.serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.selectedSlot) {
      setError("Selecione um horário");
      setIsLoading(false);
      return;
    }

    try {
      // =====================================================
      // CORREÇÃO: Usar o ISO string do slot diretamente
      // O slot.start já está no formato UTC correto
      // =====================================================
      
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formData.clientId,
          professionalId: formData.professionalId,
          serviceId: formData.serviceId,
          startTime: formData.selectedSlot.start, // ISO string UTC
          notes: formData.notes,
          sendConfirmation: formData.sendConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar agendamento");
        setIsLoading(false);
        return;
      }

      router.push("/appointments");
    } catch (err) {
      setError("Erro ao criar agendamento. Tente novamente.");
      setIsLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === formData.serviceId);

  // Data mínima = hoje
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/appointments"
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Novo Agendamento</h1>
          <p className="text-text-secondary">Agende uma consulta ou procedimento</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-error/20 text-error">
            {error}
          </div>
        )}

        {/* Cliente */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <User className="w-5 h-5 text-brand-pink" />
            Cliente
          </h2>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Selecione o Cliente *
            </label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
              className="input-field"
            >
              <option value="">Selecione...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.phone}
                </option>
              ))}
            </select>
            <Link 
              href="/clients/new" 
              className="text-brand-pink text-sm hover:underline inline-block mt-2"
            >
              + Cadastrar novo cliente
            </Link>
          </div>
        </div>

        {/* Profissional e Serviço */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-pink" />
            Profissional e Serviço
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Profissional *
              </label>
              <select
                required
                value={formData.professionalId}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  professionalId: e.target.value, 
                  selectedSlot: null 
                }))}
                className="input-field"
              >
                <option value="">Selecione...</option>
                {professionals.map((pro) => (
                  <option key={pro.id} value={pro.id}>
                    {pro.name} {pro.specialty && `- ${pro.specialty}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-1">
                Serviço *
              </label>
              <select
                required
                value={formData.serviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                className="input-field"
              >
                <option value="">Selecione...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration}min - R$ {service.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedService && (
            <div className="p-3 rounded-lg bg-surface-hover">
              <p className="text-text-secondary text-sm">
                <strong>Duração:</strong> {selectedService.duration} minutos | 
                <strong> Valor:</strong> R$ {selectedService.price.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Data e Horário */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-pink" />
            Data e Horário
          </h2>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Data *
            </label>
            <input
              type="date"
              required
              min={today}
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                date: e.target.value, 
                selectedSlot: null 
              }))}
              className="input-field max-w-xs"
            />
          </div>

          {formData.date && formData.professionalId && (
            <div>
              <label className="block text-text-secondary text-sm mb-2">
                Horários Disponíveis *
              </label>
              
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-text-tertiary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando horários...
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = formData.selectedSlot?.start === slot.start;
                    
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, selectedSlot: slot }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-brand-gradient text-white"
                            : "bg-surface-hover text-text-primary hover:bg-brand-pink/20"
                        }`}
                      >
                        {slot.formatted}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-tertiary">
                  Nenhum horário disponível nesta data. Selecione outra data.
                </p>
              )}
            </div>
          )}

          {formData.selectedSlot && (
            <div className="p-3 rounded-lg bg-success/20 text-success flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horário selecionado: {formData.selectedSlot.formatted}
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-heading text-lg text-text-primary flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-pink" />
            Observações
          </h2>

          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="input-field min-h-[100px]"
            placeholder="Informações adicionais, pedidos especiais..."
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.sendConfirmation}
              onChange={(e) => setFormData(prev => ({ ...prev, sendConfirmation: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-surface-hover text-brand-pink focus:ring-brand-pink"
            />
            <span className="text-text-secondary text-sm">
              Enviar confirmação por WhatsApp para o cliente
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/appointments"
            className="btn-secondary"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading || !formData.selectedSlot}
            className="btn-cta"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isLoading ? "Agendando..." : "Confirmar Agendamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
