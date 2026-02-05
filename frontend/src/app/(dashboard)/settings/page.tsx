"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Building2, Bell, CreditCard, Bot, Calendar,
  MessageSquare, Shield, ChevronRight, Save, Loader2, Check,
  Clock, Send, Eye, AlertCircle, X, Smartphone, Mail,
  MessageCircle, Sparkles, RefreshCw, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import WhatsAppConnection from "@/components/settings/whatsapp-connection";
import GoogleCalendarConnection from "@/components/settings/google-calendar-connection";

type TabId = "clinic" | "notifications" | "ai" | "integrations" | "billing" | "security";

const tabs = [
  { id: "clinic" as TabId, name: "Clínica", icon: Building2 },
  { id: "notifications" as TabId, name: "Notificações", icon: Bell },
  { id: "ai" as TabId, name: "Assistente IA", icon: Bot },
  { id: "integrations" as TabId, name: "Integrações", icon: Calendar },
  { id: "billing" as TabId, name: "Cobrança", icon: CreditCard },
  { id: "security" as TabId, name: "Segurança", icon: Shield },
];

// ==================== TYPES ====================
interface ReminderSettings {
  enabled24h: boolean;
  enabled2h: boolean;
  message24h: string;
  message2h: string;
}

interface ClinicSettings {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

// ==================== DEFAULT VALUES ====================
const DEFAULT_MESSAGE_24H = `Olá {nome}! 😊

Lembrando que você tem um agendamento amanhã:

📅 {data}
⏰ {hora}
💆 {servico}
👩‍⚕️ {profissional}
📍 {clinica}

Por favor, confirme sua presença respondendo:
✅ SIM - Confirmo
❌ NÃO - Preciso remarcar`;

const DEFAULT_MESSAGE_2H = `Olá {nome}! ⏰

Seu agendamento é daqui a 2 horas!

⏰ {hora}
💆 {servico}
👩‍⚕️ {profissional}

Estamos te esperando! 😊`;

const MESSAGE_VARIABLES = [
  { key: "{nome}", description: "Nome do cliente" },
  { key: "{data}", description: "Data do agendamento" },
  { key: "{hora}", description: "Horário do agendamento" },
  { key: "{servico}", description: "Nome do serviço" },
  { key: "{profissional}", description: "Nome do profissional" },
  { key: "{clinica}", description: "Nome da clínica" },
  { key: "{valor}", description: "Valor do serviço" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("clinic");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Clinic settings state
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Reminder settings state
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled24h: true,
    enabled2h: true,
    message24h: DEFAULT_MESSAGE_24H,
    message2h: DEFAULT_MESSAGE_2H,
  });

  // AI settings state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<"24h" | "2h">("24h");

  // ==================== FETCH SETTINGS ====================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/settings");
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.tenant) {
            setClinicSettings({
              name: data.tenant.name || "",
              phone: data.tenant.phone || "",
              email: data.tenant.email || "",
              address: data.tenant.address || "",
              city: data.tenant.city || "",
              state: data.tenant.state || "",
              zipCode: data.tenant.zipCode || "",
            });
            
            setAiEnabled(data.tenant.aiEnabled ?? true);
            setSystemPrompt(data.tenant.systemPrompt || "");
            
            // Parse reminder settings from JSON
            if (data.tenant.reminderSettings) {
              const rs = typeof data.tenant.reminderSettings === "string" 
                ? JSON.parse(data.tenant.reminderSettings)
                : data.tenant.reminderSettings;
              
              setReminderSettings({
                enabled24h: rs.enabled24h ?? true,
                enabled2h: rs.enabled2h ?? true,
                message24h: rs.message24h || DEFAULT_MESSAGE_24H,
                message2h: rs.message2h || DEFAULT_MESSAGE_2H,
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ==================== SAVE SETTINGS ====================
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clinicSettings,
          aiEnabled,
          systemPrompt,
          reminderSettings: JSON.stringify(reminderSettings),
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar configurações");
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== HELPERS ====================
  const formatPreviewMessage = (message: string) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return message
      .replace("{nome}", "Maria Silva")
      .replace("{data}", tomorrow.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }))
      .replace("{hora}", "15:00")
      .replace("{servico}", "Botox")
      .replace("{profissional}", "Dra. Ana Costa")
      .replace("{clinica}", clinicSettings.name || "Sua Clínica")
      .replace("{valor}", "R$ 800,00");
  };

  const insertVariable = (variable: string, type: "24h" | "2h") => {
    const textarea = document.getElementById(`message-${type}`) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = type === "24h" ? reminderSettings.message24h : reminderSettings.message2h;
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      
      setReminderSettings(prev => ({
        ...prev,
        [type === "24h" ? "message24h" : "message2h"]: newValue,
      }));
    }
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-pink mx-auto mb-4" />
          <p className="text-text-secondary">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Configurações</h1>
          <p className="text-text-secondary">
            Personalize sua clínica e integrações
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-cta"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <Check className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-error/20 text-error flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-card p-2 lg:sticky lg:top-24">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    activeTab === tab.id
                      ? "bg-brand-gradient text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Clinic Settings */}
          {activeTab === "clinic" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="font-heading text-lg text-text-primary mb-4">
                  Informações da Clínica
                </h3>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">
                      Nome da Clínica
                    </label>
                    <input
                      type="text"
                      value={clinicSettings.name}
                      onChange={(e) => setClinicSettings({ ...clinicSettings, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">
                        Telefone/WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={clinicSettings.phone}
                        onChange={(e) => setClinicSettings({ ...clinicSettings, phone: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={clinicSettings.email}
                        onChange={(e) => setClinicSettings({ ...clinicSettings, email: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-secondary text-sm mb-2">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={clinicSettings.address}
                      onChange={(e) => setClinicSettings({ ...clinicSettings, address: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={clinicSettings.city}
                        onChange={(e) => setClinicSettings({ ...clinicSettings, city: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">
                        Estado
                      </label>
                      <select 
                        value={clinicSettings.state}
                        onChange={(e) => setClinicSettings({ ...clinicSettings, state: e.target.value })}
                        className="input-field"
                      >
                        <option value="">Selecione</option>
                        <option value="AC">Acre</option>
                        <option value="AL">Alagoas</option>
                        <option value="AP">Amapá</option>
                        <option value="AM">Amazonas</option>
                        <option value="BA">Bahia</option>
                        <option value="CE">Ceará</option>
                        <option value="DF">Distrito Federal</option>
                        <option value="ES">Espírito Santo</option>
                        <option value="GO">Goiás</option>
                        <option value="MA">Maranhão</option>
                        <option value="MT">Mato Grosso</option>
                        <option value="MS">Mato Grosso do Sul</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="PA">Pará</option>
                        <option value="PB">Paraíba</option>
                        <option value="PR">Paraná</option>
                        <option value="PE">Pernambuco</option>
                        <option value="PI">Piauí</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="RN">Rio Grande do Norte</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="RO">Rondônia</option>
                        <option value="RR">Roraima</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="SP">São Paulo</option>
                        <option value="SE">Sergipe</option>
                        <option value="TO">Tocantins</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={clinicSettings.zipCode}
                        onChange={(e) => setClinicSettings({ ...clinicSettings, zipCode: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="font-heading text-lg text-text-primary mb-4">
                  Horário de Funcionamento
                </h3>
                <p className="text-text-tertiary text-sm mb-4">
                  A IA só vai agendar dentro desses horários
                </p>
                
                {/* Simplified hours display */}
                <div className="space-y-2">
                  {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((day) => (
                    <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-surface-hover">
                      <span className="w-24 text-text-primary font-medium">{day}</span>
                      <input
                        type="time"
                        defaultValue="08:00"
                        className="px-3 py-2 rounded-lg bg-surface border border-white/10 text-text-primary text-sm"
                      />
                      <span className="text-text-tertiary">até</span>
                      <input
                        type="time"
                        defaultValue="18:00"
                        className="px-3 py-2 rounded-lg bg-surface border border-white/10 text-text-primary text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== NOTIFICATIONS SETTINGS ==================== */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="glass-card p-4 flex items-start gap-3 border-trust/30">
                <div className="w-10 h-10 rounded-lg bg-trust/20 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-trust" />
                </div>
                <div>
                  <h3 className="text-text-primary font-medium mb-1">Como funcionam os lembretes</h3>
                  <p className="text-text-secondary text-sm">
                    Os lembretes são enviados automaticamente via WhatsApp para os clientes com agendamentos. 
                    Um cron job verifica a cada hora se há agendamentos que precisam de lembrete.
                  </p>
                </div>
              </div>

              {/* 24h Reminder */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-pink/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-brand-pink" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-text-primary">Lembrete 24 horas antes</h3>
                      <p className="text-text-tertiary text-sm">Enviado um dia antes do agendamento</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderSettings.enabled24h}
                      onChange={(e) => setReminderSettings({ ...reminderSettings, enabled24h: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </div>

                {reminderSettings.enabled24h && (
                  <div className="space-y-4">
                    {/* Variables */}
                    <div className="p-3 rounded-lg bg-surface-hover/50">
                      <p className="text-text-tertiary text-xs mb-2">Variáveis disponíveis (clique para inserir):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {MESSAGE_VARIABLES.map((v) => (
                          <button
                            key={v.key}
                            onClick={() => insertVariable(v.key, "24h")}
                            className="px-2 py-1 rounded bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary text-xs font-mono transition-colors"
                            title={v.description}
                          >
                            {v.key}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message Textarea */}
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">
                        Mensagem do Lembrete
                      </label>
                      <textarea
                        id="message-24h"
                        rows={10}
                        value={reminderSettings.message24h}
                        onChange={(e) => setReminderSettings({ ...reminderSettings, message24h: e.target.value })}
                        className="input-field resize-none font-mono text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPreviewType("24h");
                          setShowPreview(true);
                        }}
                        className="btn-secondary py-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Pré-visualizar
                      </button>
                      <button
                        onClick={() => setReminderSettings({ ...reminderSettings, message24h: DEFAULT_MESSAGE_24H })}
                        className="btn-secondary py-2 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Restaurar Padrão
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2h Reminder */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cta/20 flex items-center justify-center">
                      <Send className="w-6 h-6 text-cta" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-text-primary">Lembrete 2 horas antes</h3>
                      <p className="text-text-tertiary text-sm">Enviado pouco antes do agendamento</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderSettings.enabled2h}
                      onChange={(e) => setReminderSettings({ ...reminderSettings, enabled2h: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cta/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cta"></div>
                  </label>
                </div>

                {reminderSettings.enabled2h && (
                  <div className="space-y-4">
                    {/* Variables */}
                    <div className="p-3 rounded-lg bg-surface-hover/50">
                      <p className="text-text-tertiary text-xs mb-2">Variáveis disponíveis (clique para inserir):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {MESSAGE_VARIABLES.map((v) => (
                          <button
                            key={v.key}
                            onClick={() => insertVariable(v.key, "2h")}
                            className="px-2 py-1 rounded bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary text-xs font-mono transition-colors"
                            title={v.description}
                          >
                            {v.key}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message Textarea */}
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">
                        Mensagem do Lembrete
                      </label>
                      <textarea
                        id="message-2h"
                        rows={8}
                        value={reminderSettings.message2h}
                        onChange={(e) => setReminderSettings({ ...reminderSettings, message2h: e.target.value })}
                        className="input-field resize-none font-mono text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPreviewType("2h");
                          setShowPreview(true);
                        }}
                        className="btn-secondary py-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Pré-visualizar
                      </button>
                      <button
                        onClick={() => setReminderSettings({ ...reminderSettings, message2h: DEFAULT_MESSAGE_2H })}
                        className="btn-secondary py-2 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Restaurar Padrão
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Card */}
              <div className="glass-card p-6">
                <h3 className="font-heading text-lg text-text-primary mb-4">Status dos Lembretes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-surface-hover">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        reminderSettings.enabled24h ? "bg-success" : "bg-text-tertiary"
                      )} />
                      <span className="text-text-secondary text-sm">24h antes</span>
                    </div>
                    <p className={cn(
                      "font-medium",
                      reminderSettings.enabled24h ? "text-success" : "text-text-tertiary"
                    )}>
                      {reminderSettings.enabled24h ? "Ativo" : "Desativado"}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-surface-hover">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        reminderSettings.enabled2h ? "bg-success" : "bg-text-tertiary"
                      )} />
                      <span className="text-text-secondary text-sm">2h antes</span>
                    </div>
                    <p className={cn(
                      "font-medium",
                      reminderSettings.enabled2h ? "text-success" : "text-text-tertiary"
                    )}>
                      {reminderSettings.enabled2h ? "Ativo" : "Desativado"}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-surface-hover">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-text-tertiary" />
                      <span className="text-text-secondary text-sm">Canal</span>
                    </div>
                    <p className="text-success font-medium">WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === "ai" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="font-heading text-lg text-text-primary mb-4">
                  Configurações do Assistente IA
                </h3>
                
                <label className="flex items-center justify-between p-4 rounded-lg bg-surface-hover cursor-pointer mb-4">
                  <div>
                    <p className="text-text-primary font-medium">Ativar IA no WhatsApp</p>
                    <p className="text-text-tertiary text-sm">
                      A IA responderá automaticamente às mensagens dos clientes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiEnabled}
                      onChange={(e) => setAiEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-surface peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-pink/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-pink"></div>
                  </label>
                </label>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Prompt do Sistema (Personalidade da IA)
                </label>
                <p className="text-text-tertiary text-xs mb-3">
                  Instruções adicionais para a IA. Ex: "Seja sempre simpática e use emojis"
                </p>
                <textarea
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Você é a secretária virtual da clínica. Seja sempre educada, acolhedora e profissional..."
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  FAQ Personalizado
                </label>
                <p className="text-text-tertiary text-xs mb-3">
                  Perguntas e respostas frequentes que a IA pode usar
                </p>
                <textarea
                  rows={4}
                  placeholder="P: Qual o endereço da clínica?&#10;R: Estamos na Av. Paulista, 1000 - Bela Vista, São Paulo.&#10;&#10;P: Vocês aceitam cartão?&#10;R: Sim! Aceitamos todas as bandeiras e também PIX."
                  className="input-field resize-none font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Integrations Settings */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              {/* WhatsApp Connection */}
              <WhatsAppConnection />

              {/* Google Calendar */}
              <GoogleCalendarConnection />

              {/* Asaas */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-text-primary">Asaas (Pagamentos)</h3>
                      <p className="text-text-tertiary text-sm">Gateway de pagamentos PIX/Boleto</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-medium">
                    Não configurado
                  </span>
                </div>
                
                <div className="p-4 rounded-lg bg-surface-hover text-center mb-4">
                  <p className="text-text-secondary text-sm">
                    Conecte sua conta Asaas para receber pagamentos via PIX e Boleto automaticamente.
                  </p>
                </div>
                
                <button className="btn-secondary text-sm py-2 w-full justify-center">
                  Configurar Asaas
                </button>
              </div>
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === "billing" && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-brand-gradient">
                <div>
                  <p className="text-white/80 text-sm">Seu Plano</p>
                  <p className="text-white text-2xl font-bold">Pro</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">Valor mensal</p>
                  <p className="text-white text-2xl font-bold font-mono">R$ 197</p>
                </div>
              </div>

              <div>
                <h3 className="font-heading text-lg text-text-primary mb-4">
                  Detalhes do Plano
                </h3>
                <ul className="space-y-2">
                  {[
                    "Até 5 profissionais",
                    "Atendimentos ilimitados",
                    "Lembretes de procedimentos",
                    "Recuperação de leads",
                    "Cobrança automática",
                    "Assistente IA para gestores",
                    "Suporte prioritário",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-text-secondary">
                      <Check className="w-4 h-4 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/10 pt-6">
                <button className="btn-secondary w-full justify-center">
                  Alterar Plano
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="font-heading text-lg text-text-primary mb-4">
                  Segurança da Conta
                </h3>
                
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-hover hover:bg-white/10 transition-colors">
                    <div>
                      <p className="text-text-primary font-medium">Alterar Senha</p>
                      <p className="text-text-tertiary text-sm">
                        Última alteração: há 30 dias
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-tertiary" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-hover hover:bg-white/10 transition-colors">
                    <div>
                      <p className="text-text-primary font-medium">Autenticação de Dois Fatores</p>
                      <p className="text-text-tertiary text-sm">
                        Adicione uma camada extra de segurança
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded bg-warning/20 text-warning text-xs font-medium">
                      Desativado
                    </span>
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-hover hover:bg-white/10 transition-colors">
                    <div>
                      <p className="text-text-primary font-medium">Sessões Ativas</p>
                      <p className="text-text-tertiary text-sm">
                        Gerencie dispositivos conectados
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-tertiary" />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="font-heading text-lg text-text-primary mb-4">
                  Dados e Privacidade
                </h3>
                
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 rounded-lg bg-surface-hover hover:bg-white/10 transition-colors">
                    <div>
                      <p className="text-text-primary font-medium">Exportar Dados</p>
                      <p className="text-text-tertiary text-sm">
                        Baixe uma cópia de todos os seus dados
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-tertiary" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-lg bg-error/10 hover:bg-error/20 transition-colors">
                    <div>
                      <p className="text-error font-medium">Excluir Conta</p>
                      <p className="text-error/70 text-sm">
                        Essa ação é irreversível
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-error" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== PREVIEW MODAL ==================== */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading text-text-primary">
                Pré-visualização - {previewType === "24h" ? "24 horas" : "2 horas"}
              </h2>
              <button onClick={() => setShowPreview(false)} className="text-text-tertiary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* WhatsApp Style Preview */}
            <div className="bg-[#0B141A] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-text-primary font-medium">{clinicSettings.name || "Sua Clínica"}</p>
                  <p className="text-success text-xs">online</p>
                </div>
              </div>
              
              <div className="bg-[#005C4B] rounded-lg rounded-tl-none p-3 ml-auto max-w-[90%]">
                <p className="text-white text-sm whitespace-pre-wrap">
                  {formatPreviewMessage(
                    previewType === "24h" 
                      ? reminderSettings.message24h 
                      : reminderSettings.message2h
                  )}
                </p>
                <p className="text-white/60 text-xs text-right mt-2">
                  {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            
            <button onClick={() => setShowPreview(false)} className="btn-cta w-full py-3">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}