"use client";

import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, Mail, Shield, Clock, 
  MoreVertical, Edit, UserX, Loader2, AlertCircle, 
  RefreshCw, Check, X, Send, Copy, Crown, User,
  ShieldCheck, Headphones, Stethoscope, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  avatar: string | null;
  phone: string | null;
  professional: {
    id: string;
    name: string;
    specialty: string | null;
  } | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  isCurrentUser: boolean;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  professional: {
    id: string;
    name: string;
  } | null;
  expiresAt: string;
  createdAt: string;
  token: string;
  inviteUrl: string;
}

interface Professional {
  id: string;
  name: string;
  specialty: string | null;
  email: string | null;
}

// ==================== CONSTANTS ====================
const ROLE_CONFIG = {
  OWNER: { 
    icon: Crown, 
    color: "text-cta", 
    bgColor: "bg-cta/20",
    label: "Proprietário",
    description: "Acesso total ao sistema"
  },
  ADMIN: { 
    icon: ShieldCheck, 
    color: "text-trust", 
    bgColor: "bg-trust/20",
    label: "Administrador",
    description: "Acesso total exceto cobrança"
  },
  RECEPTIONIST: { 
    icon: Headphones, 
    color: "text-success", 
    bgColor: "bg-success/20",
    label: "Recepcionista",
    description: "Inbox, agendamentos, clientes"
  },
  PROFESSIONAL: { 
    icon: Stethoscope, 
    color: "text-brand-pink", 
    bgColor: "bg-brand-pink/20",
    label: "Profissional",
    description: "Própria agenda e produtos"
  },
};

// ==================== COMPONENT ====================
export default function TeamPage() {
  // State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "PROFESSIONAL",
    professionalId: "",
  });
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // ==================== FETCH DATA ====================
  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("/api/team");
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar equipe");
      }
      
      const data = await response.json();
      setMembers(data.members || []);
      setPendingInvitations(data.pendingInvitations || []);
      setCurrentUserRole(data.currentUserRole || "");
    } catch (err: any) {
      console.error("Error fetching team:", err);
      setError(err.message || "Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const response = await fetch("/api/professionals");
      if (response.ok) {
        const data = await response.json();
        setProfessionals(data.professionals || []);
      }
    } catch (err) {
      console.error("Error fetching professionals:", err);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchProfessionals();
  }, []);

  // ==================== ACTIONS ====================
  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar convite");
      }
      
      setInviteUrl(data.inviteUrl);
      setInviteSuccess(true);
      fetchTeam();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedMember) return;

    try {
      setActionLoading(true);
      
      const response = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          role: newRole,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar membro");
      }
      
      setShowEditModal(false);
      setSelectedMember(null);
      fetchTeam();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/team?id=${selectedMember.id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover membro");
      }
      
      setShowRemoveModal(false);
      setSelectedMember(null);
      fetchTeam();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCancelInvite = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations?id=${invitationId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao cancelar convite");
      }
      
      fetchTeam();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ✅ CORREÇÃO: Feedback visual ao copiar
  const copyInviteUrl = (url?: string, id?: string) => {
    const urlToCopy = url || inviteUrl;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedId(id || "modal");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setInviteForm({ name: "", email: "", role: "PROFESSIONAL", professionalId: "" });
    setInviteUrl("");
    setInviteSuccess(false);
  };

  // ==================== HELPERS ====================
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
    return `${Math.floor(days / 30)} meses atrás`;
  };

  const getRemainingDays = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const canEditMember = (member: TeamMember) => {
    if (member.isCurrentUser) return false;
    if (currentUserRole === "OWNER") return true;
    if (currentUserRole === "ADMIN" && member.role !== "OWNER") return true;
    return false;
  };

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  // ==================== FILTER ====================
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.roleLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==================== STATS ====================
  const activeMembers = members.filter(m => m.isActive).length;
  const roleStats = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-pink mx-auto mb-4" />
          <p className="text-text-secondary">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Equipe</h1>
          <p className="text-text-secondary">Gerencie os membros e acessos da sua clínica</p>
        </div>
        {canInvite && (
          <button onClick={() => setShowInviteModal(true)} className="btn-cta">
            <UserPlus className="w-5 h-5" />
            Convidar Membro
          </button>
        )}
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brand-pink/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-pink" />
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Total de Membros</p>
              <p className="text-2xl font-bold text-text-primary font-mono">{members.length}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Membros Ativos</p>
              <p className="text-2xl font-bold text-success font-mono">{activeMembers}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Convites Pendentes</p>
              <p className="text-2xl font-bold text-warning font-mono">{pendingInvitations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-trust/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-trust" />
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Profissionais</p>
              <p className="text-2xl font-bold text-trust font-mono">{roleStats.PROFESSIONAL || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar membro..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-text-primary font-medium flex items-center gap-2">
            <Send className="w-4 h-4 text-warning" />
            Convites Pendentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingInvitations.map((invite) => {
              const remainingDays = getRemainingDays(invite.expiresAt);
              const roleConfig = ROLE_CONFIG[invite.role as keyof typeof ROLE_CONFIG];
              const RoleIcon = roleConfig?.icon || User;
              
              return (
                <div key={invite.id} className="glass-card p-4 border-warning/30 border-dashed">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="text-text-primary font-medium">{invite.name}</h3>
                        <p className="text-text-tertiary text-sm">{invite.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* ✅ CORREÇÃO: Botão para copiar link do convite */}
                      <button 
                        onClick={() => copyInviteUrl(invite.inviteUrl, invite.id)}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          copiedId === invite.id 
                            ? "text-success bg-success/20" 
                            : "text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
                        )}
                        title={copiedId === invite.id ? "Copiado!" : "Copiar link"}
                      >
                        {copiedId === invite.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleCancelInvite(invite.id)}
                        className="p-1.5 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                        title="Cancelar convite"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                      roleConfig?.bgColor,
                      roleConfig?.color
                    )}>
                      <RoleIcon className="w-3 h-3" />
                      {invite.roleLabel}
                    </div>
                    <span className={cn(
                      "text-xs",
                      remainingDays <= 2 ? "text-error" : "text-text-tertiary"
                    )}>
                      {remainingDays > 0 ? `Expira em ${remainingDays} dias` : "Expirado"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        <h2 className="text-text-primary font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-pink" />
          Membros da Equipe
        </h2>
        
        {filteredMembers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-text-primary text-lg font-medium mb-2">Nenhum membro encontrado</h3>
            <p className="text-text-secondary mb-4">Convide membros para sua equipe</p>
            {canInvite && (
              <button onClick={() => setShowInviteModal(true)} className="btn-cta inline-flex">
                <UserPlus className="w-5 h-5" /> Convidar Membro
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const roleConfig = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG];
              const RoleIcon = roleConfig?.icon || User;
              
              return (
                <div 
                  key={member.id} 
                  className={cn(
                    "glass-card p-5 hover:border-white/20 transition-all relative group",
                    !member.isActive && "opacity-60"
                  )}
                >
                  {/* Current User Badge */}
                  {member.isCurrentUser && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-brand-pink text-white text-xs font-medium rounded-full">
                      Você
                    </div>
                  )}
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-gradient/20 flex items-center justify-center relative">
                        <span className="text-brand-pink font-bold text-lg">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                        {/* Online indicator */}
                        {member.isActive && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-surface" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-text-primary font-medium">{member.name}</h3>
                        <p className="text-text-tertiary text-sm truncate max-w-[150px]">{member.email}</p>
                      </div>
                    </div>
                    
                    {/* Actions Menu */}
                    {canEditMember(member) && (
                      <div className="relative">
                        <button 
                          onClick={() => {
                            setSelectedMember(member);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Role Badge */}
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium mb-4",
                    roleConfig?.bgColor,
                    roleConfig?.color
                  )}>
                    <RoleIcon className="w-4 h-4" />
                    {member.roleLabel}
                  </div>
                  
                  {/* Professional Info */}
                  {member.professional && (
                    <div className="p-3 rounded-lg bg-surface-hover mb-4">
                      <p className="text-text-tertiary text-xs mb-1">Profissional vinculado</p>
                      <p className="text-text-primary text-sm font-medium">{member.professional.name}</p>
                      {member.professional.specialty && (
                        <p className="text-text-secondary text-xs">{member.professional.specialty}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-xs text-text-tertiary pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Último acesso: {member.lastLoginAt ? getTimeAgo(member.lastLoginAt) : "Nunca"}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      member.isActive ? "bg-success/20 text-success" : "bg-error/20 text-error"
                    )}>
                      {member.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== INVITE MODAL ==================== */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetInviteModal} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md p-6 animate-fade-in">
            {!inviteSuccess ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading text-text-primary">Convidar Membro</h2>
                  <button onClick={resetInviteModal} className="text-text-tertiary hover:text-text-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Nome *</label>
                    <input
                      type="text"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      placeholder="Nome do membro"
                      className="input-field w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Email *</label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="input-field w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Função</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(ROLE_CONFIG).filter(([key]) => key !== "OWNER").map(([key, config]) => {
                        const Icon = config.icon;
                        const isSelected = inviteForm.role === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setInviteForm({ ...inviteForm, role: key })}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all",
                              isSelected 
                                ? "border-brand-pink bg-brand-pink/10" 
                                : "border-white/10 hover:border-white/20"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={cn("w-4 h-4", config.color)} />
                              <span className="text-text-primary text-sm font-medium">{config.label}</span>
                            </div>
                            <p className="text-text-tertiary text-xs">{config.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {inviteForm.role === "PROFESSIONAL" && professionals.length > 0 && (
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">Vincular a Profissional</label>
                      <select
                        value={inviteForm.professionalId}
                        onChange={(e) => setInviteForm({ ...inviteForm, professionalId: e.target.value })}
                        className="input-field w-full"
                      >
                        <option value="">Selecione (opcional)</option>
                        {professionals.map((pro) => (
                          <option key={pro.id} value={pro.id}>
                            {pro.name} {pro.specialty && `- ${pro.specialty}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button onClick={resetInviteModal} className="btn-secondary flex-1 py-3">
                    Cancelar
                  </button>
                  <button 
                    onClick={handleInvite}
                    disabled={actionLoading || !inviteForm.name || !inviteForm.email}
                    className="btn-cta flex-1 py-3 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Convite
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-heading text-text-primary mb-2">Convite Enviado!</h3>
                <p className="text-text-secondary mb-6">
                  O convite foi criado para <strong>{inviteForm.email}</strong>
                </p>
                
                <div className="bg-surface-hover rounded-lg p-4 mb-6">
                  <p className="text-text-tertiary text-sm mb-2">Link do convite:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="input-field flex-1 text-sm"
                    />
                    <button 
                      onClick={() => copyInviteUrl(inviteUrl, "modal")}
                      className={cn(
                        "btn-secondary p-3 transition-colors",
                        copiedId === "modal" && "bg-success/20 border-success text-success"
                      )}
                      title={copiedId === "modal" ? "Copiado!" : "Copiar link"}
                    >
                      {copiedId === "modal" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-text-tertiary text-xs mt-2">
                    Compartilhe este link com o membro para ele aceitar o convite.
                  </p>
                </div>
                
                <button onClick={resetInviteModal} className="btn-cta w-full py-3">
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== EDIT ROLE MODAL ==================== */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading text-text-primary">Editar Membro</h2>
              <button onClick={() => setShowEditModal(false)} className="text-text-tertiary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-hover mb-6">
              <div className="w-12 h-12 rounded-full bg-brand-gradient/20 flex items-center justify-center">
                <span className="text-brand-pink font-bold text-lg">
                  {selectedMember.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-text-primary font-medium">{selectedMember.name}</h3>
                <p className="text-text-tertiary text-sm">{selectedMember.email}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <label className="block text-text-secondary text-sm">Alterar Função</label>
              {Object.entries(ROLE_CONFIG).filter(([key]) => key !== "OWNER").map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = selectedMember.role === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleUpdateRole(key)}
                    disabled={actionLoading || isSelected}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3",
                      isSelected 
                        ? "border-brand-pink bg-brand-pink/10" 
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-medium">{config.label}</p>
                      <p className="text-text-tertiary text-sm">{config.description}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-brand-pink" />}
                  </button>
                );
              })}
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShowRemoveModal(true);
                }}
                className="w-full p-3 rounded-lg border border-error/30 text-error hover:bg-error/10 transition-colors flex items-center justify-center gap-2"
              >
                <UserX className="w-5 h-5" />
                Remover Membro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REMOVE CONFIRMATION MODAL ==================== */}
      {showRemoveModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRemoveModal(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md p-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <UserX className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-heading text-text-primary mb-2">Remover Membro?</h3>
              <p className="text-text-secondary mb-6">
                Tem certeza que deseja remover <strong>{selectedMember.name}</strong> da equipe? 
                O membro perderá acesso ao sistema.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRemoveModal(false)} 
                  className="btn-secondary flex-1 py-3"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleRemoveMember}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-lg bg-error text-white font-medium hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserX className="w-5 h-5" />
                      Remover
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}