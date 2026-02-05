"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Users, Calendar, Sparkles, ArrowRight, ArrowLeft,
  Check, Loader2, Zap, Clock, MapPin, Phone, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FormData {
  // Step 1: Clinic Info
  clinicName: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  
  // Step 2: Business Hours
  businessHours: {
    [key: string]: { open: string; close: string; enabled: boolean };
  };
  
  // Step 3: Professionals
  professionals: Array<{
    name: string;
    specialty: string;
    email: string;
  }>;
  
  // Step 4: Services
  services: Array<{
    name: string;
    duration: number;
    price: number;
  }>;
}

const defaultBusinessHours = {
  monday: { open: "08:00", close: "18:00", enabled: true },
  tuesday: { open: "08:00", close: "18:00", enabled: true },
  wednesday: { open: "08:00", close: "18:00", enabled: true },
  thursday: { open: "08:00", close: "18:00", enabled: true },
  friday: { open: "08:00", close: "18:00", enabled: true },
  saturday: { open: "08:00", close: "12:00", enabled: true },
  sunday: { open: "08:00", close: "12:00", enabled: false },
};

const dayNames: { [key: string]: string } = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const steps = [
  { id: 1, name: "Clínica", icon: Building2 },
  { id: 2, name: "Horários", icon: Clock },
  { id: 3, name: "Equipe", icon: Users },
  { id: 4, name: "Serviços", icon: Calendar },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clinicName: "",
    slug: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    businessHours: defaultBusinessHours,
    professionals: [{ name: "", specialty: "", email: "" }],
    services: [{ name: "", duration: 60, price: 0 }],
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Erro ao salvar dados");
        setIsLoading(false);
        return;
      }

      // Redirecionar para dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving onboarding:", error);
      alert("Erro ao salvar dados. Tente novamente.");
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-surface/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-lg text-text-primary">NexaCore</span>
          </div>
          
          <span className="text-text-tertiary text-sm">
            Passo {currentStep} de {steps.length}
          </span>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-white/10 bg-surface/30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      currentStep > step.id
                        ? "bg-success text-white"
                        : currentStep === step.id
                        ? "bg-brand-gradient text-white shadow-glow"
                        : "bg-surface-hover text-text-tertiary"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-sm font-medium",
                      currentStep >= step.id ? "text-text-primary" : "text-text-tertiary"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-full h-0.5 mx-4",
                      currentStep > step.id ? "bg-success" : "bg-surface-hover"
                    )}
                    style={{ minWidth: "60px" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Step 1: Clinic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="font-heading text-display-3 text-text-primary mb-2">
                  Vamos configurar sua clínica
                </h1>
                <p className="text-text-secondary">
                  Essas informações serão usadas pela IA para atender seus pacientes.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Nome da Clínica *
                  </label>
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => {
                      updateFormData("clinicName", e.target.value);
                      updateFormData("slug", generateSlug(e.target.value));
                    }}
                    placeholder="Ex: Clínica Estética Renova"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Telefone/WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="contato@clinica.com"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    placeholder="Rua, número, bairro"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      placeholder="São Paulo"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => updateFormData("state", e.target.value)}
                      className="input-field"
                    >
                      <option value="">Selecione</option>
                      <option value="SP">São Paulo</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PR">Paraná</option>
                      <option value="RS">Rio Grande do Sul</option>
                      {/* Add more states */}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Hours */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="font-heading text-display-3 text-text-primary mb-2">
                  Horário de Funcionamento
                </h1>
                <p className="text-text-secondary">
                  A IA só vai agendar dentro desses horários.
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(formData.businessHours).map(([day, hours]) => (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-all",
                      hours.enabled
                        ? "bg-surface border-white/10"
                        : "bg-surface/50 border-white/5"
                    )}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hours.enabled}
                        onChange={(e) => {
                          const newHours = { ...formData.businessHours };
                          newHours[day].enabled = e.target.checked;
                          updateFormData("businessHours", newHours);
                        }}
                        className="w-5 h-5 rounded border-white/20 bg-surface-hover text-cta focus:ring-cta"
                      />
                      <span className={cn(
                        "w-24 font-medium",
                        hours.enabled ? "text-text-primary" : "text-text-tertiary"
                      )}>
                        {dayNames[day]}
                      </span>
                    </label>

                    {hours.enabled && (
                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => {
                            const newHours = { ...formData.businessHours };
                            newHours[day].open = e.target.value;
                            updateFormData("businessHours", newHours);
                          }}
                          className="px-3 py-2 rounded-lg bg-surface-hover border border-white/10 text-text-primary text-sm"
                        />
                        <span className="text-text-tertiary">até</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => {
                            const newHours = { ...formData.businessHours };
                            newHours[day].close = e.target.value;
                            updateFormData("businessHours", newHours);
                          }}
                          className="px-3 py-2 rounded-lg bg-surface-hover border border-white/10 text-text-primary text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Professionals */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="font-heading text-display-3 text-text-primary mb-2">
                  Sua Equipe
                </h1>
                <p className="text-text-secondary">
                  Adicione os profissionais que realizam atendimentos.
                </p>
              </div>

              <div className="space-y-4">
                {formData.professionals.map((professional, index) => (
                  <div key={index} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-text-primary font-medium">
                        Profissional {index + 1}
                      </span>
                      {index > 0 && (
                        <button
                          onClick={() => {
                            const newProfessionals = formData.professionals.filter(
                              (_, i) => i !== index
                            );
                            updateFormData("professionals", newProfessionals);
                          }}
                          className="text-error text-sm hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    
                    <div className="grid gap-4">
                      <input
                        type="text"
                        value={professional.name}
                        onChange={(e) => {
                          const newProfessionals = [...formData.professionals];
                          newProfessionals[index].name = e.target.value;
                          updateFormData("professionals", newProfessionals);
                        }}
                        placeholder="Nome completo"
                        className="input-field"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={professional.specialty}
                          onChange={(e) => {
                            const newProfessionals = [...formData.professionals];
                            newProfessionals[index].specialty = e.target.value;
                            updateFormData("professionals", newProfessionals);
                          }}
                          placeholder="Especialidade"
                          className="input-field"
                        />
                        <input
                          type="email"
                          value={professional.email}
                          onChange={(e) => {
                            const newProfessionals = [...formData.professionals];
                            newProfessionals[index].email = e.target.value;
                            updateFormData("professionals", newProfessionals);
                          }}
                          placeholder="Email"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    updateFormData("professionals", [
                      ...formData.professionals,
                      { name: "", specialty: "", email: "" },
                    ]);
                  }}
                  className="w-full py-3 rounded-lg border border-dashed border-white/20 text-text-secondary hover:text-text-primary hover:border-white/40 transition-colors"
                >
                  + Adicionar Profissional
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Services */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="font-heading text-display-3 text-text-primary mb-2">
                  Serviços Oferecidos
                </h1>
                <p className="text-text-secondary">
                  Cadastre os procedimentos que sua clínica realiza.
                </p>
              </div>

              <div className="space-y-4">
                {formData.services.map((service, index) => (
                  <div key={index} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-text-primary font-medium">
                        Serviço {index + 1}
                      </span>
                      {index > 0 && (
                        <button
                          onClick={() => {
                            const newServices = formData.services.filter(
                              (_, i) => i !== index
                            );
                            updateFormData("services", newServices);
                          }}
                          className="text-error text-sm hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    
                    <div className="grid gap-4">
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => {
                          const newServices = [...formData.services];
                          newServices[index].name = e.target.value;
                          updateFormData("services", newServices);
                        }}
                        placeholder="Nome do serviço (ex: Botox)"
                        className="input-field"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-text-tertiary text-sm mb-1">
                            Duração (min)
                          </label>
                          <input
                            type="number"
                            value={service.duration}
                            onChange={(e) => {
                              const newServices = [...formData.services];
                              newServices[index].duration = parseInt(e.target.value) || 0;
                              updateFormData("services", newServices);
                            }}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-text-tertiary text-sm mb-1">
                            Preço (R$)
                          </label>
                          <input
                            type="number"
                            value={service.price}
                            onChange={(e) => {
                              const newServices = [...formData.services];
                              newServices[index].price = parseFloat(e.target.value) || 0;
                              updateFormData("services", newServices);
                            }}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    updateFormData("services", [
                      ...formData.services,
                      { name: "", duration: 60, price: 0 },
                    ]);
                  }}
                  className="w-full py-3 rounded-lg border border-dashed border-white/20 text-text-secondary hover:text-text-primary hover:border-white/40 transition-colors"
                >
                  + Adicionar Serviço
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-surface/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
              currentStep === 1
                ? "text-text-tertiary cursor-not-allowed"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="btn-cta"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finalizando...
              </>
            ) : currentStep === 4 ? (
              <>
                <Sparkles className="w-5 h-5" />
                Concluir Configuração
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
