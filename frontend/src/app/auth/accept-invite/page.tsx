"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  CheckCircle2, XCircle, Clock, Building2, Mail, Shield,
  Loader2, ArrowRight, UserPlus, LogIn, AlertTriangle,
  Sparkles, Users, Calendar, MessageSquare, Crown,
  ShieldCheck, Headphones, Stethoscope, User
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================
interface InvitationData {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  status: string;
  expiresAt: string;
  tenant: {
    name: string;
    logo: string | null;
  };
  professional: {
    name: string;
    specialty: string | null;
  } | null;
}

// ==================== CONSTANTS ====================
const ROLE_CONFIG = {
  OWNER: { 
    icon: Crown, 
    color: "text-cta", 
    bgColor: "bg-cta/20",
    label: "Proprietário",
    permissions: ["Acesso total ao sistema", "Gerenciar cobrança", "Gerenciar equipe"]
  },
  ADMIN: { 
    icon: ShieldCheck, 
    color: "text-trust", 
    bgColor: "bg-trust/20",
    label: "Administrador",
    permissions: ["Acesso quase total", "Gerenciar equipe", "Ver relatórios"]
  },
  RECEPTIONIST: { 
    icon: Headphones, 
    color: "text-success", 
    bgColor: "bg-success/20",
    label: "Recepcionista",
    permissions: ["Inbox de mensagens", "Agendamentos", "Clientes"]
  },
  PROFESSIONAL: { 
    icon: Stethoscope, 
    color: "text-brand-pink", 
    bgColor: "bg-brand-pink/20",
    label: "Profissional",
    permissions: ["Própria agenda", "Próprios clientes", "Próprios produtos"]
  },
};

// ==================== INNER COMPONENT ====================
function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  
  const token = searchParams.get("token");
  
  // State
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ==================== FETCH INVITATION ====================
  useEffect(() => {
    if (!token) {
      setError("Token de convite não encontrado");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/accept?token=${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Convite inválido");
        }
        
        setInvitation(data.invitation);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // ==================== ACCEPT INVITATION ====================
  const handleAccept = async () => {
    if (!token || !invitation) return;

    try {
      setAccepting(true);
      setError("");
      
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao aceitar convite");
      }
      
      console.log("[Accept Invite] Success:", data);
      setSuccess(true);
      
      // Aguardar mais tempo para sessão Clerk estabilizar
      // Isso evita o loop infinito de "Refreshing session token"
      setTimeout(async () => {
        // Forçar refresh da página para garantir que Clerk reconheça o novo usuário
        // Usar window.location ao invés de router.push para forçar reload completo
        window.location.href = "/dashboard";
      }, 3000);
    } catch (err: any) {
      console.error("[Accept Invite] Error:", err);
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  // ==================== HELPERS ====================
  const isEmailMatch = user?.emailAddresses?.some(
    (email) => email.emailAddress.toLowerCase() === invitation?.email.toLowerCase()
  );

  const getRemainingTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return "Expirado";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} dias restantes`;
    if (hours > 0) return `${hours} horas restantes`;
    return "Menos de 1 hora";
  };

  const roleConfig = invitation ? ROLE_CONFIG[invitation.role as keyof typeof ROLE_CONFIG] : null;
  const RoleIcon = roleConfig?.icon || User;

  // ==================== LOADING STATE ====================
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-pink mx-auto mb-4" />
          <p className="text-text-secondary">Verificando convite...</p>
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="glass-card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-error" />
            </div>
            <h1 className="text-2xl font-heading text-text-primary mb-3">Convite Inválido</h1>
            <p className="text-text-secondary mb-6">{error}</p>
            <Link href="/" className="btn-secondary inline-flex">
              Voltar para Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==================== SUCCESS STATE ====================
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="glass-card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-heading text-text-primary mb-3">Bem-vindo à Equipe!</h1>
            <p className="text-text-secondary mb-4">
              Você agora faz parte da equipe <strong className="text-text-primary">{invitation?.tenant.name}</strong>
            </p>
            <p className="text-text-tertiary text-sm mb-6">
              Redirecionando para o dashboard...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-brand-pink mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-pink/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative min-h-screen flex">
        {/* Left Side - Invitation Details */}
        <div className="hidden lg:flex lg:w-1/2 bg-surface/50 p-12 flex-col justify-center items-center">
          <div className="max-w-md w-full space-y-8">
            {/* Logo / Tenant Info */}
            <div className="text-center">
              {invitation?.tenant.logo ? (
                <img 
                  src={invitation.tenant.logo} 
                  alt={invitation.tenant.name}
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-gradient/20 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-brand-pink" />
                </div>
              )}
              <h2 className="text-3xl font-heading text-text-primary mb-2">
                {invitation?.tenant.name}
              </h2>
              <p className="text-text-secondary">convidou você para fazer parte da equipe</p>
            </div>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-hover/50">
                <div className="w-12 h-12 rounded-xl bg-brand-pink/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-brand-pink" />
                </div>
                <div>
                  <h3 className="text-text-primary font-medium">Agenda Inteligente</h3>
                  <p className="text-text-tertiary text-sm">Gerencie seus agendamentos com facilidade</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-hover/50">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-text-primary font-medium">WhatsApp Integrado</h3>
                  <p className="text-text-tertiary text-sm">Comunique-se diretamente com clientes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-hover/50">
                <div className="w-12 h-12 rounded-xl bg-cta/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-cta" />
                </div>
                <div>
                  <h3 className="text-text-primary font-medium">IA que Trabalha por Você</h3>
                  <p className="text-text-tertiary text-sm">Automações inteligentes para seu dia a dia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Accept Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-md w-full space-y-6">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              {invitation?.tenant.logo ? (
                <img 
                  src={invitation.tenant.logo} 
                  alt={invitation.tenant.name}
                  className="w-16 h-16 rounded-xl mx-auto mb-3 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-brand-gradient/20 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-8 h-8 text-brand-pink" />
                </div>
              )}
              <h2 className="text-xl font-heading text-text-primary">
                {invitation?.tenant.name}
              </h2>
            </div>
            
            {/* Invitation Card */}
            <div className="glass-card p-6 sm:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-heading text-text-primary mb-2">
                  Você foi convidado!
                </h1>
                <p className="text-text-secondary">
                  {invitation?.name}, você recebeu um convite para entrar na equipe
                </p>
              </div>
              
              {/* Invite Info */}
              <div className="space-y-4 mb-6">
                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover">
                  <Mail className="w-5 h-5 text-text-tertiary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-tertiary text-xs">Email do convite</p>
                    <p className="text-text-primary truncate">{invitation?.email}</p>
                  </div>
                </div>
                
                {/* Role */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", roleConfig?.bgColor)}>
                    <RoleIcon className={cn("w-5 h-5", roleConfig?.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-tertiary text-xs">Sua função</p>
                    <p className="text-text-primary font-medium">{roleConfig?.label}</p>
                  </div>
                </div>
                
                {/* Permissions Preview */}
                {roleConfig && (
                  <div className="p-3 rounded-lg bg-surface-hover/50">
                    <p className="text-text-tertiary text-xs mb-2">Suas permissões incluem:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {roleConfig.permissions.map((perm, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 rounded-full bg-surface text-text-secondary text-xs"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Professional Link */}
                {invitation?.professional && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-trust/10 border border-trust/20">
                    <Stethoscope className="w-5 h-5 text-trust" />
                    <div className="flex-1">
                      <p className="text-trust text-xs">Vinculado ao profissional</p>
                      <p className="text-text-primary font-medium">{invitation.professional.name}</p>
                      {invitation.professional.specialty && (
                        <p className="text-text-tertiary text-xs">{invitation.professional.specialty}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Expiration */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <Clock className="w-4 h-4" />
                    <span>{getRemainingTime(invitation?.expiresAt || "")}</span>
                  </div>
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-error/20 text-error text-sm flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Action Buttons */}
              {!isSignedIn ? (
                <div className="space-y-3">
                  <p className="text-text-secondary text-sm text-center mb-4">
                    Para aceitar o convite, faça login ou crie uma conta com o email <strong className="text-text-primary">{invitation?.email}</strong>
                  </p>
                  
                  <SignUpButton mode="modal">
                    <button className="btn-cta w-full py-3.5">
                      <UserPlus className="w-5 h-5" />
                      Criar Conta
                    </button>
                  </SignUpButton>
                  
                  <SignInButton mode="modal">
                    <button className="btn-secondary w-full py-3.5">
                      <LogIn className="w-5 h-5" />
                      Já tenho conta
                    </button>
                  </SignInButton>
                </div>
              ) : isEmailMatch ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="btn-cta w-full py-3.5 disabled:opacity-50"
                >
                  {accepting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Aceitar Convite
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-warning/20 border border-warning/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-warning font-medium mb-1">Email diferente</p>
                        <p className="text-text-secondary text-sm">
                          O convite foi enviado para <strong>{invitation?.email}</strong>, 
                          mas você está logado como <strong>{user?.emailAddresses?.[0]?.emailAddress}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-text-tertiary text-sm text-center">
                    Faça logout e entre com o email correto para aceitar o convite.
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="text-center">
              <p className="text-text-tertiary text-sm">
                Powered by{" "}
                <Link href="/" className="text-gradient font-semibold hover:underline">
                  NexaCore
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-pink" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}