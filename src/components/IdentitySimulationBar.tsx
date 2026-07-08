/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  ChevronRight, 
  Search, 
  Plus, 
  Sparkles, 
  User, 
  Building, 
  Calendar, 
  ChevronDown, 
  SlidersHorizontal, 
  Command, 
  Bell, 
  X, 
  Activity,
  FolderOpen,
  ShieldCheck,
  Check,
  CheckSquare,
  ShieldAlert,
  Clock,
  ExternalLink,
  Users,
  Lock,
  UserPlus,
  Link2,
  FileText
} from "lucide-react";
import { identityEngine } from "../core/identity/IdentityEngine";
import { userManager } from "../core/identity/UserManager";
import { organizationManager } from "../core/identity/OrganizationManager";
import { accessControlEngine } from "../core/identity/AccessControlEngine";
import { roleManager } from "../core/identity/RoleManager";
import { permissionManager } from "../core/identity/PermissionManager";
import { invitationManager } from "../core/identity/InvitationManager";
import { shareLinkManager } from "../core/identity/ShareLinkManager";
import { digitalTwinEngine } from "../core/identity/digitalTwin/DigitalTwinEngine";
import { PlatformUser, Role, Permission, PermissionScope } from "../core/identity/types";
import { auditEngine } from "../core/audit/AuditEngine";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { WorkspaceContext, ContextEntity, ContextPeriod } from "../core/workspace-intelligence/types";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";

interface IdentitySimulationBarProps {
  onContextChanged: () => void;
}

export const IdentitySimulationBar: React.FC<IdentitySimulationBarProps> = ({ onContextChanged }) => {
  // Sync state with WorkspaceContextManager
  const [context, setContext] = useState<WorkspaceContext | null>(workspaceIntelligenceEngine.contextManager.getContext());
  const [showSimDropdown, setShowSimDropdown] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Administrative Modals
  const [showPermsList, setShowPermsList] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTwinModal, setShowTwinModal] = useState(false);

  // Admin Form States
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Client Manager");
  const [inviteScope, setInviteScope] = useState<PermissionScope>("store");
  const [inviteWorkspace, setInviteWorkspace] = useState("ws_topazio");

  const [shareResource, setShareResource] = useState<string>("pres_test_deck");
  const [shareType, setShareType] = useState<"presentation" | "actionPlan" | "meeting">("presentation");
  const [shareHours, setShareHours] = useState(24);
  const [shareCreatedLink, setShareCreatedLink] = useState("");

  const [invitations, setInvitations] = useState(invitationManager.getInvitations());
  const [shareLinks, setShareLinks] = useState(shareLinkManager.getShareLinks());
  const [auditLogs, setAuditLogs] = useState(auditEngine.getLogs().slice(-10).reverse());

  const twin = digitalTwinEngine.getGroupTwin();
  const structure = digitalTwinEngine.getStructure();

  // Watch context changes
  useEffect(() => {
    // Initial load
    const current = workspaceIntelligenceEngine.contextManager.getContext();
    if (current) {
      setContext(current);
    } else {
      workspaceIntelligenceEngine.initializeDefaultContext("SPREADSHEET_DATA", {}).then(setContext);
    }

    // Subscribe
    const unsubscribe = workspaceIntelligenceEngine.contextManager.subscribe((newContext) => {
      setContext(newContext);
    });

    const interval = setInterval(() => {
      setInvitations(invitationManager.getInvitations());
      setShareLinks(shareLinkManager.getShareLinks());
      setAuditLogs(auditEngine.getLogs().slice(-10).reverse());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const triggerGlobalContextRefresh = () => {
    onContextChanged();
  };

  const handleUserChange = (userId: string) => {
    identityEngine.switchUser(userId);
    const updatedUser = identityEngine.getCurrentUser();
    const updatedOrg = identityEngine.getCurrentOrganization();
    const updatedWorkspace = identityEngine.getCurrentWorkspace();
    
    if (context) {
      const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
        updatedUser,
        updatedOrg,
        updatedWorkspace,
        null,
        context.currentPeriod,
        context.entidadeSelecionada,
        context.filtrosAtivos,
        context.fonteDeDadosAtiva
      );
      workspaceIntelligenceEngine.contextManager.setContext(resolved);
    }
    setShowSimDropdown(false);
    triggerGlobalContextRefresh();
  };

  const handleOrgChange = (orgId: string) => {
    identityEngine.switchOrganization(orgId);
    const updatedUser = identityEngine.getCurrentUser();
    const updatedOrg = identityEngine.getCurrentOrganization();
    const updatedWorkspace = identityEngine.getCurrentWorkspace();
    
    if (context) {
      const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
        updatedUser,
        updatedOrg,
        updatedWorkspace,
        null,
        context.currentPeriod,
        null, // clear sub entity on org switch
        context.filtrosAtivos,
        context.fonteDeDadosAtiva
      );
      workspaceIntelligenceEngine.contextManager.setContext(resolved);
    }
    setShowOrgDropdown(false);
    triggerGlobalContextRefresh();
  };

  const handleProjectChange = async (projectId: string) => {
    await consultantWorkspaceManager.setActiveProject(projectId);
    const updatedUser = identityEngine.getCurrentUser();
    const updatedOrg = identityEngine.getCurrentOrganization();
    const updatedWorkspace = identityEngine.getCurrentWorkspace();
    const activeProject = await consultantWorkspaceManager.getActiveProject();

    if (context) {
      const resolved = workspaceIntelligenceEngine.resolver.resolveContext(
        updatedUser,
        updatedOrg,
        updatedWorkspace,
        activeProject,
        context.currentPeriod,
        null,
        context.filtrosAtivos,
        context.fonteDeDadosAtiva
      );
      workspaceIntelligenceEngine.contextManager.setContext(resolved);
    }
    setShowCaseDropdown(false);
    triggerGlobalContextRefresh();
  };

  const handleEntityChange = (entity: ContextEntity | null) => {
    workspaceIntelligenceEngine.switchEntity(entity);
    setShowEntityDropdown(false);
    triggerGlobalContextRefresh();
  };

  const handlePeriodChange = (period: ContextPeriod) => {
    workspaceIntelligenceEngine.switchPeriod(period);
    setShowPeriodDropdown(false);
    triggerGlobalContextRefresh();
  };

  // Administrative Handlers
  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !context) return;
    invitationManager.createInvitation(
      inviteEmail,
      context.currentOrganization.id,
      inviteRole,
      inviteScope,
      context.currentUser.id,
      inviteWorkspace
    );
    setInviteEmail("");
    setInvitations(invitationManager.getInvitations());
    setShowInviteModal(false);
    triggerGlobalContextRefresh();
  };

  const handleCreateShareLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!context) return;
    const link = shareLinkManager.createShareLink(
      shareResource,
      shareType,
      context.currentUser.id,
      [shareType === "presentation" ? "presentation.view" : "action.view"],
      shareHours
    );
    setShareCreatedLink(`https://sauron-os.secure/shared/token=${link.token}`);
    setShareLinks(shareLinkManager.getShareLinks());
  };

  const handleRevokeShareLink = (id: string) => {
    if (!context) return;
    shareLinkManager.revokeShareLink(id, context.currentUser.id);
    setShareLinks(shareLinkManager.getShareLinks());
  };

  const handleAcceptInviteSimulated = (inviteId: string) => {
    const invite = invitationManager.getInvitation(inviteId);
    if (!invite) return;

    const randomId = `user_acc_${Date.now().toString().substring(7)}`;
    userManager.createUser({
      id: randomId,
      profile: {
        id: randomId,
        fullName: `Aceitador Simulado (${invite.email.split("@")[0]})`,
        email: invite.email
      },
      role: "Guest",
      organizationId: invite.organizationId
    });

    invitationManager.acceptInvitation(inviteId, randomId);
    identityEngine.switchUser(randomId);
    triggerGlobalContextRefresh();
  };

  if (!context) return null;

  const currentRole = context.currentUser.role;
  const actions = workspaceIntelligenceEngine.actions.getActionsForContext(context);

  const getPillColor = (role: Role) => {
    switch (role) {
      case "Super Admin": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Consultant Admin": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Consultant": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Client Director": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Client Manager": return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "Financial User": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div id="simulation-bar" className="w-full bg-slate-900 border-b border-slate-800 text-slate-300 py-2.5 px-4 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left: Intelligent Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1.5 font-sans font-medium text-slate-400">
          {/* Organization */}
          <div className="relative">
            <button 
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold"
            >
              <Building size={14} className="text-slate-500 shrink-0" />
              <span>{context.currentOrganization.name}</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>
            {showOrgDropdown && (
              <div className="absolute left-0 mt-1.5 w-48 bg-slate-950 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                {identityEngine.getVisibleOrganizations().map(o => (
                  <button
                    key={o.id}
                    onClick={() => handleOrgChange(o.id)}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ChevronRight size={12} className="text-slate-600 shrink-0" />

          {/* Case / Workspace */}
          <div className="relative">
            <button 
              onClick={() => setShowCaseDropdown(!showCaseDropdown)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold"
            >
              <Briefcase size={14} className="text-slate-500 shrink-0" />
              <span>{context.currentCase?.name || "Sem Caso Selecionado"}</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>
            {showCaseDropdown && (
              <div className="absolute left-0 mt-1.5 w-60 bg-slate-950 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={async () => {
                    await consultantWorkspaceManager.setActiveProject("");
                    triggerGlobalContextRefresh();
                    setShowCaseDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-rose-400 font-bold text-xs"
                >
                  Desmarcar Projeto
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                {identityEngine.getVisibleWorkspaces().map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleProjectChange(w.id)}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ChevronRight size={12} className="text-slate-600 shrink-0" />

          {/* Entity (e.g. Nissan / Carlos Silva) */}
          <div className="relative">
            <button 
              onClick={() => setShowEntityDropdown(!showEntityDropdown)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold text-blue-400"
            >
              <Activity size={14} className="shrink-0 text-blue-500" />
              <span>{context.entidadeSelecionada ? context.entidadeSelecionada.name : "Unidade / Geral"}</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>
            {showEntityDropdown && (
              <div className="absolute left-0 mt-1.5 w-64 bg-slate-950 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => handleEntityChange(null)}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-400 font-bold text-xs"
                >
                  Limpar Foco (Visão Corporativa)
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                <p className="px-3 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">Lojas & Empresas</p>
                <button
                  onClick={() => handleEntityChange({ id: "company_alpha_nissan", type: "company", name: "Alpha Nissan", metadata: { brand: "Nissan" } })}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Alpha Nissan (Feira de Santana)
                </button>
                <button
                  onClick={() => handleEntityChange({ id: "company_alpha_renault", type: "company", name: "Alpha Renault", metadata: { brand: "Renault" } })}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Alpha Renault (Feira de Santana)
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                <p className="px-3 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">Pessoas (Vendedores)</p>
                <button
                  onClick={() => handleEntityChange({ id: "vendedor_1", type: "vendedor", name: "Carlos Silva", metadata: { role: "Destaque Nissan", store: "Nissan Feira" } })}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Carlos Silva (Nissan)
                </button>
                <button
                  onClick={() => handleEntityChange({ id: "vendedor_2", type: "vendedor", name: "Amanda Souza", metadata: { role: "Destaque Renault", store: "Renault Feira" } })}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Amanda Souza (Renault)
                </button>
              </div>
            )}
          </div>

          <ChevronRight size={12} className="text-slate-600 shrink-0" />

          {/* Period Selection */}
          <div className="relative">
            <button 
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold text-amber-400"
            >
              <Calendar size={14} className="shrink-0 text-amber-500" />
              <span>{context.currentPeriod?.name || "Junho/2026"}</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>
            {showPeriodDropdown && (
              <div className="absolute left-0 mt-1.5 w-40 bg-slate-950 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                {[
                  { id: "abril_2026", name: "Abril/2026" },
                  { id: "maio_2026", name: "Maio/2026" },
                  { id: "junho_2026", name: "Junho/2026" }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePeriodChange(p)}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Command badge, and Simulation Avatar */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Quick Search Shortcut */}
          <button 
            onClick={() => {
              // Fire keyboard event to open command palette
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors text-[10px]"
            title="Abrir Command Palette"
          >
            <Search size={12} />
            <span>Buscar...</span>
            <span className="bg-slate-900 border border-slate-800 px-1 py-0.2 rounded text-[8px] font-mono font-bold text-slate-400">Ctrl+K</span>
          </button>

          {/* Unified Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md shadow-blue-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={14} />
              <span>Criar</span>
              <ChevronDown size={11} />
            </button>
            {showCreateDropdown && (
              <div className="absolute right-0 mt-1.5 w-56 bg-slate-950 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                <p className="px-3 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">Ações Contextuais</p>
                {actions.length === 0 ? (
                  <p className="px-3 py-2 text-slate-500 text-xs italic">Nenhuma ação disponível.</p>
                ) : (
                  actions.map(act => (
                    <button
                      key={act.id}
                      onClick={() => {
                        // We simulate clicking these contextual creations
                        setShowCreateDropdown(false);
                        alert(`[Sauron] Ação engatilhada: "${act.label}" com base no escopo tático do usuário.`);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center gap-2"
                    >
                      <span>{act.label}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Simulation / Role selector Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSimDropdown(!showSimDropdown)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer`}
            >
              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
                {context.currentUser.profile.fullName[0]}
              </div>
              <span className="font-semibold text-slate-300">{context.currentUser.profile.fullName}</span>
              <span className={`text-[9px] font-extrabold uppercase px-1 rounded-sm ${getPillColor(context.currentUser.role)}`}>
                {context.currentUser.role}
              </span>
              <ChevronDown size={11} className="opacity-60" />
            </button>
            {showSimDropdown && (
              <div className="absolute right-0 mt-1.5 w-64 bg-slate-950 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                <p className="px-3 py-1.5 text-[9px] uppercase font-bold text-slate-500 tracking-wider">Simular Papel / Usuário</p>
                {userManager.getUsers().map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleUserChange(u.id)}
                    className="w-full text-left px-4 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-medium flex items-center justify-between"
                  >
                    <span>{u.profile.fullName}</span>
                    <span className="text-[9px] opacity-70 bg-slate-900 px-1 py-0.2 rounded font-mono uppercase font-bold">{u.role}</span>
                  </button>
                ))}
                
                <div className="border-t border-slate-800 my-1"></div>
                <p className="px-3 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">Controles Administrativos</p>
                <button
                  onClick={() => { setShowPermsList(true); setShowSimDropdown(false); }}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ShieldCheck size={13} className="text-indigo-400" />
                  <span>Auditar Permissões</span>
                </button>
                <button
                  onClick={() => { setShowInviteModal(true); setShowSimDropdown(false); }}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <UserPlus size={13} className="text-emerald-400" />
                  <span>Onboardar Colaboradores</span>
                </button>
                <button
                  onClick={() => { setShowShareModal(true); setShowSimDropdown(false); }}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Link2 size={13} className="text-blue-400" />
                  <span>Gerenciar Compartilhamentos</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 1. Permissions Audit dropdown checkmarks */}
      {showPermsList && (
        <div className="bg-slate-950 border-t border-slate-850 px-4 py-4 animate-fade-in text-xs">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-extrabold text-xs uppercase flex items-center gap-1">
                <ShieldCheck size={12} className="text-indigo-400" />
                <span>Auditor Tático de Permissões para o papel {context.currentUser.role}</span>
              </h4>
              <button onClick={() => setShowPermsList(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed max-w-3xl">
              As permissões verdes indicam controle autorizado sob as regras do Sauron Platform. O sistema monitora cada ação e gera logs de auditoria automáticos em caso de acesso negado.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {permissionManager.getAllPermissions().map(p => {
                const isAuthorized = accessControlEngine.can(context.currentUser, p.permission, context.currentWorkspace);
                return (
                  <div key={p.permission} className={`p-2 rounded border flex items-center justify-between gap-1 transition-all ${isAuthorized ? "bg-emerald-950/20 border-emerald-900/60 text-emerald-400" : "bg-slate-900/40 border-slate-800/40 text-slate-500"}`}>
                    <div className="truncate">
                      <p className="font-extrabold text-[9px] uppercase tracking-wide truncate">{p.title}</p>
                      <p className="text-[8px] font-mono leading-none truncate opacity-80 mt-0.5">{p.permission}</p>
                    </div>
                    {isAuthorized ? <Check size={12} className="shrink-0 stroke-[3]" /> : <X size={11} className="shrink-0 opacity-40" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. INVITATION MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl animate-scale-up text-xs text-slate-300">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2.5">
              <h3 className="text-white text-sm font-black uppercase flex items-center gap-1.5">
                <UserPlus size={16} className="text-indigo-400" />
                <span>Onboarding de Consultores & Clientes — InvitationManager</span>
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white font-bold p-1 bg-slate-800 rounded">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Form */}
              <form onSubmit={handleCreateInvite} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail do Colaborador</label>
                  <input 
                    type="email" 
                    placeholder="ex: gerente.nissan@grupotopazio.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Papel (Role)</label>
                    <select 
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                    >
                      {roleManager.getAllRoles().map(r => (
                        <option key={r.name} value={r.name}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Escopo de Acesso</label>
                    <select 
                      value={inviteScope}
                      onChange={(e) => setInviteScope(e.target.value as PermissionScope)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                    >
                      <option value="global">Toda Organização</option>
                      <option value="workspace">Apenas Caso Selecionado</option>
                      <option value="store">Apenas uma Unidade/Loja</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Enviar Convite Oficial
                </button>
              </form>

              {/* Right Column: Active Invites */}
              <div className="space-y-3">
                <h4 className="text-white font-black text-[10px] uppercase tracking-wider">Convites em Aberto (Simulado)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {invitations.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Nenhum convite ativo no momento.</p>
                  ) : (
                    invitations.map(inv => (
                      <div key={inv.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-white truncate max-w-[160px]">{inv.email}</p>
                            <p className="text-[10px] text-slate-500 font-mono">ID: {inv.id.substring(4, 12)}</p>
                          </div>
                          <span className="text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                            {inv.role}
                          </span>
                        </div>
                        <div className="flex gap-1.5 justify-end mt-1">
                          <button
                            onClick={() => handleAcceptInviteSimulated(inv.id)}
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-900/60 rounded text-[9px] font-bold hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                          >
                            Simular Aceite
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SHARE LINK MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl animate-scale-up text-xs text-slate-300">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2.5">
              <h3 className="text-white text-sm font-black uppercase flex items-center gap-1.5">
                <Link2 size={16} className="text-blue-400" />
                <span>Links Temporários Compartilháveis — ShareLinkManager</span>
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white font-bold p-1 bg-slate-800 rounded">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Generator */}
              <form onSubmit={handleCreateShareLink} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Recurso</label>
                  <select 
                    value={shareType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setShareType(val);
                      setShareResource(val === "presentation" ? "pres_test_deck" : val === "actionPlan" ? "plan_aceleracao" : "meet_audit");
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="presentation">Apresentação / Deck de Slides</option>
                    <option value="actionPlan">Plano de Ações Executivas</option>
                    <option value="meeting">Ata / Reunião Estratégica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tempo de Expiração (Horas)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={168}
                    value={shareHours}
                    onChange={(e) => setShareHours(parseInt(e.target.value) || 24)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Gerar Link Seguro
                </button>

                {shareCreatedLink && (
                  <div className="p-2.5 bg-slate-950 border border-blue-900/60 text-blue-400 rounded-lg font-mono text-[10px] select-all break-all flex flex-col gap-1">
                    <p className="font-sans font-bold uppercase text-[8px] text-blue-500">Link Gerado (Copie):</p>
                    <span>{shareCreatedLink}</span>
                  </div>
                )}
              </form>

              {/* Right Column: Active Links */}
              <div className="space-y-3">
                <h4 className="text-white font-black text-[10px] uppercase tracking-wider">Links Ativos no Momento</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {shareLinks.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Nenhum link ativo compartilhado.</p>
                  ) : (
                    shareLinks.map(lnk => (
                      <div key={lnk.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-white uppercase text-[9px] tracking-wide">{lnk.resourceType}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Token: {lnk.token.substring(0, 10)}...</p>
                          </div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${lnk.revoked ? "bg-red-950 text-red-400 border border-red-900" : "bg-emerald-950 text-emerald-400 border border-emerald-900"}`}>
                            {lnk.revoked ? "REVOGADO" : "ATIVO"}
                          </span>
                        </div>
                        {!lnk.revoked && (
                          <div className="flex justify-end gap-1 mt-1.5">
                            <button
                              onClick={() => handleRevokeShareLink(lnk.id)}
                              className="px-2 py-0.5 bg-red-900/20 text-red-400 border border-red-900/60 rounded text-[9px] font-bold hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                            >
                              Revogar Acesso
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
