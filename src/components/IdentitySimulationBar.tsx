/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Building, 
  FolderOpen, 
  ShieldCheck, 
  Send, 
  Link2, 
  Clock, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  UserPlus, 
  History,
  Activity
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

interface IdentitySimulationBarProps {
  onContextChanged: () => void;
}

export const IdentitySimulationBar: React.FC<IdentitySimulationBarProps> = ({ onContextChanged }) => {
  const [currentUser, setCurrentUser] = useState<PlatformUser>(identityEngine.getCurrentUser());
  const [currentOrg, setCurrentOrg] = useState(identityEngine.getCurrentOrganization());
  const [currentWorkspace, setCurrentWorkspace] = useState(identityEngine.getCurrentWorkspace());
  
  const [showPermsList, setShowPermsList] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTwinModal, setShowTwinModal] = useState(false);
  
  // Form States
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

  useEffect(() => {
    const handleInterval = setInterval(() => {
      setInvitations(invitationManager.getInvitations());
      setShareLinks(shareLinkManager.getShareLinks());
      setAuditLogs(auditEngine.getLogs().slice(-10).reverse());
    }, 2000);
    return () => clearInterval(handleInterval);
  }, []);

  const refreshContext = () => {
    setCurrentUser(identityEngine.getCurrentUser());
    setCurrentOrg(identityEngine.getCurrentOrganization());
    setCurrentWorkspace(identityEngine.getCurrentWorkspace());
    setInvitations(invitationManager.getInvitations());
    setShareLinks(shareLinkManager.getShareLinks());
    setAuditLogs(auditEngine.getLogs().slice(-10).reverse());
    onContextChanged();
  };

  const handleUserChange = (userId: string) => {
    identityEngine.switchUser(userId);
    refreshContext();
  };

  const handleOrgChange = (orgId: string) => {
    identityEngine.switchOrganization(orgId);
    refreshContext();
  };

  const handleWorkspaceChange = (wsId: string) => {
    identityEngine.switchWorkspace(wsId);
    refreshContext();
  };

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    invitationManager.createInvitation(
      inviteEmail,
      currentOrg.id,
      inviteRole,
      inviteScope,
      currentUser.id,
      inviteWorkspace
    );
    setInviteEmail("");
    setInvitations(invitationManager.getInvitations());
    setShowInviteModal(false);
  };

  const handleCreateShareLink = (e: React.FormEvent) => {
    e.preventDefault();
    const link = shareLinkManager.createShareLink(
      shareResource,
      shareType,
      currentUser.id,
      [shareType === "presentation" ? "presentation.view" : "action.view"],
      shareHours
    );
    setShareCreatedLink(`https://sauron-os.secure/shared/token=${link.token}`);
    setShareLinks(shareLinkManager.getShareLinks());
  };

  const handleRevokeShareLink = (id: string) => {
    shareLinkManager.revokeShareLink(id, currentUser.id);
    setShareLinks(shareLinkManager.getShareLinks());
  };

  const handleAcceptInviteSimulated = (inviteId: string) => {
    // We simulate creating a random acceptor user
    const randomId = `user_acc_${Date.now().toString().substring(7)}`;
    const invite = invitationManager.getInvitation(inviteId);
    if (!invite) return;

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
    refreshContext();
  };

  const handleCancelInvite = (id: string) => {
    invitationManager.cancelInvitation(id, currentUser.id);
    setInvitations(invitationManager.getInvitations());
  };

  const getPillColor = (role: Role) => {
    switch (role) {
      case "Super Admin": return "bg-rose-500 text-white";
      case "Consultant Admin": return "bg-purple-600 text-white";
      case "Consultant": return "bg-blue-600 text-white";
      case "Client Director": return "bg-emerald-600 text-white";
      case "Client Manager": return "bg-cyan-600 text-white";
      case "Financial User": return "bg-amber-600 text-white";
      case "Controller": return "bg-indigo-600 text-white";
      case "Auditor": return "bg-slate-700 text-white";
      default: return "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  // Determine active constraints
  const activeScopePolicies = currentWorkspace?.accessPolicies.filter(p => p.role === currentUser.role) || [];
  const restrictionText = activeScopePolicies.length > 0 
    ? activeScopePolicies.map(p => `${p.permission} (escopo: ${p.scope}${p.resourceId ? ` -> ${p.resourceId}` : ""})`).join(" | ")
    : "Sem restrições aplicadas";

  return (
    <div id="simulation-bar" className="w-full bg-slate-900 border-b border-slate-950 text-slate-300 font-sans shadow-lg select-none">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Logo & Sim Context Indicator */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2 rounded-lg text-white shadow-md animate-pulse shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-xs">SAURON IDENTITY CONTROL</span>
              <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Release v0.6.5</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">Painel de Simulação, Governança & Colaboração Tática.</p>
          </div>
        </div>

        {/* Center: Context Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-center">
          
          {/* User Select */}
          <div className="flex items-center gap-1.5 bg-slate-850 dark:bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-xs">
            <Users size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Simular:</span>
            <select 
              value={currentUser.id} 
              onChange={(e) => handleUserChange(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
            >
              {userManager.getUsers().map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.profile.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Org Select */}
          <div className="flex items-center gap-1.5 bg-slate-850 dark:bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-xs">
            <Building size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Organização:</span>
            <select 
              value={currentOrg.id} 
              onChange={(e) => handleOrgChange(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
            >
              {identityEngine.getVisibleOrganizations().map(o => (
                <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Workspace Select */}
          {currentWorkspace && (
            <div className="flex items-center gap-1.5 bg-slate-850 dark:bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-xs">
              <FolderOpen size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Workspace:</span>
              <select 
                value={currentWorkspace.id} 
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {identityEngine.getVisibleWorkspaces().map(w => (
                  <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>

        {/* Right Side: Quick Action and Modal Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          
          <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded shadow-xs ${getPillColor(currentUser.role)}`}>
            {currentUser.role}
          </span>

          <button 
            onClick={() => setShowPermsList(!showPermsList)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-705 text-white rounded text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
          >
            {showPermsList ? <EyeOff size={11} /> : <Eye size={11} />}
            <span>Permissões</span>
          </button>

          <button 
            onClick={() => { setShowInviteModal(true); setShareCreatedLink(""); }}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
          >
            <UserPlus size={11} />
            <span>Convidar</span>
          </button>

          <button 
            onClick={() => { setShowShareModal(true); setShareCreatedLink(""); }}
            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
          >
            <Link2 size={11} />
            <span>Compartilhar</span>
          </button>

          <button 
            onClick={() => setShowTwinModal(true)}
            className="px-2.5 py-1 bg-slate-750 hover:bg-slate-700 text-white rounded text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
            title="Ver Twin Digital e Estrutura Relacional"
          >
            <Activity size={11} />
            <span>Digital Twin</span>
          </button>

        </div>

      </div>

      {/* Constraints Indicator Line */}
      <div className="bg-slate-950 border-t border-slate-850 px-4 py-1 text-[9px] text-slate-400 font-mono text-center truncate">
        <span className="text-indigo-400 font-bold">Limites de Acesso Ativos: </span>
        <span className="font-semibold text-slate-350">{restrictionText}</span>
      </div>

      {/* 1. Permissions dropdown checkmarks */}
      {showPermsList && (
        <div className="bg-slate-950 border-t border-slate-850 px-4 py-4 animate-fade-in text-xs">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-extrabold text-xs uppercase flex items-center gap-1">
                <ShieldCheck size={12} className="text-indigo-400" />
                <span>Auditor Tático de Permissões para o papel {currentUser.role}</span>
              </h4>
              <button onClick={() => setShowPermsList(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed max-w-3xl">
              As permissões verdes indicam controle autorizado sob as regras da release v0.6.5. O Sauron monitora cada ação e gera logs de auditoria automáticos em caso de acesso negado.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {permissionManager.getAllPermissions().map(p => {
                const isAuthorized = accessControlEngine.can(currentUser, p.permission, currentWorkspace);
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
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Escopo</label>
                    <select 
                      value={inviteScope}
                      onChange={(e) => setInviteScope(e.target.value as PermissionScope)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                    >
                      <option value="workspace">Workspace Inteiro</option>
                      <option value="store">Loja Nissan Feira (Loja)</option>
                      <option value="costCenter">Administração (Centro Custo)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase py-2 rounded-lg transition"
                >
                  Criar e Emitir Convite
                </button>
              </form>

              {/* Right Column: Active Invites list */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg overflow-y-auto max-h-[250px] space-y-2">
                <p className="font-extrabold text-[10px] text-slate-400 uppercase border-b border-slate-850 pb-1">Lista de Convites Local</p>
                {invitations.length === 0 ? (
                  <p className="text-[10px] text-slate-500 py-4 text-center">Nenhum convite emitido no localStorage.</p>
                ) : (
                  invitations.map(inv => (
                    <div key={inv.id} className="p-2 bg-slate-900 border border-slate-850 rounded-lg flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white truncate max-w-[150px]">{inv.email}</span>
                        <span className={`text-[8px] font-black uppercase px-1 rounded ${inv.status === "pending" ? "bg-amber-950 text-amber-400 border border-amber-900" : inv.status === "accepted" ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-slate-800 text-slate-400"}`}>{inv.status}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Papel: <span className="font-bold text-indigo-400">{inv.role}</span> | Escopo: <span className="font-bold">{inv.scope}</span></p>
                      
                      {inv.status === "pending" && (
                        <div className="flex justify-end gap-1.5 mt-1 pt-1.5 border-t border-slate-850/40">
                          <button 
                            onClick={() => handleCancelInvite(inv.id)}
                            className="px-1.5 py-0.5 bg-rose-950 text-rose-400 border border-rose-900 rounded text-[8px] uppercase font-bold"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={() => handleAcceptInviteSimulated(inv.id)}
                            className="px-1.5 py-0.5 bg-emerald-900 text-emerald-300 rounded text-[8px] uppercase font-black"
                            title="Simula o convidado aceitando e logando"
                          >
                            Simular Aceite
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
      )}

      {/* 3. SHARE LINK MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl animate-scale-up text-xs text-slate-300">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2.5">
              <h3 className="text-white text-sm font-black uppercase flex items-center gap-1.5">
                <Link2 size={16} className="text-teal-400" />
                <span>Compartilhamento Temporário Sem Conta — ShareLinkManager</span>
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white font-bold p-1 bg-slate-800 rounded">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Form Column */}
              <form onSubmit={handleCreateShareLink} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Recurso para Compartilhar</label>
                  <select 
                    value={shareResource} 
                    onChange={(e) => {
                      setShareResource(e.target.value);
                      const type = e.target.value === "pres_test_deck" ? "presentation" : "actionPlan";
                      setShareType(type);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="pres_test_deck">Apresentação: Slides de Conselho</option>
                    <option value="action_1">Plano de Ação: Otimização de Oficina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Validade do Token (Horas)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={720}
                    value={shareHours} 
                    onChange={(e) => setShareHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold uppercase py-2 rounded-lg transition"
                >
                  Gerar Token e Link Seguro
                </button>

                {shareCreatedLink && (
                  <div className="bg-slate-950 border border-teal-900/60 p-2.5 rounded-lg text-teal-400 font-mono text-[10px] break-all select-all">
                    <p className="font-bold uppercase text-[8px] text-slate-400 mb-1">LINK COPIÁVEL GERADO:</p>
                    {shareCreatedLink}
                  </div>
                )}
              </form>

              {/* List Column */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg overflow-y-auto max-h-[250px] space-y-2">
                <p className="font-extrabold text-[10px] text-slate-400 uppercase border-b border-slate-850 pb-1">Links de Compartilhamento Ativos</p>
                {shareLinks.length === 0 ? (
                  <p className="text-[10px] text-slate-500 py-4 text-center">Nenhum link ativo gerado no localStorage.</p>
                ) : (
                  shareLinks.map(link => (
                    <div key={link.id} className="p-2 bg-slate-900 border border-slate-850 rounded-lg flex flex-col gap-1 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white truncate max-w-[120px]">Token: {link.token}</span>
                        <span className={`text-[8px] font-black uppercase px-1 rounded ${link.revoked ? "bg-rose-950 text-rose-400 border border-rose-900" : "bg-teal-950 text-teal-400 border border-teal-900"}`}>{link.revoked ? "REVOGADO" : "ATIVO"}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Tipo: <span className="font-bold uppercase text-teal-400">{link.resourceType}</span> | Recurso: <span className="font-bold">{link.resourceId}</span></p>
                      <p className="text-[8px] font-mono text-slate-500">Expira em: {new Date(link.expiresAt).toLocaleString()}</p>
                      
                      {!link.revoked && (
                        <div className="flex justify-end gap-1.5 mt-1 pt-1.5 border-t border-slate-850/40">
                          <button 
                            onClick={() => handleRevokeShareLink(link.id)}
                            className="px-1.5 py-0.5 bg-rose-950 text-rose-400 border border-rose-900 rounded text-[8px] uppercase font-bold"
                          >
                            Revogar Link
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
      )}

      {/* 4. DIGITAL TWIN MODAL */}
      {showTwinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full p-5 shadow-2xl animate-scale-up text-xs text-slate-300">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2.5">
              <h3 className="text-white text-sm font-black uppercase flex items-center gap-1.5">
                <Activity size={16} className="text-emerald-400 animate-pulse" />
                <span>Digital Twin de Governança Estrutural — {twin.name}</span>
              </h3>
              <button onClick={() => setShowTwinModal(false)} className="text-slate-400 hover:text-white font-bold p-1 bg-slate-800 rounded">✕</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Structural Tree */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg space-y-3.5 lg:col-span-2">
                <p className="font-extrabold text-[10px] text-slate-400 uppercase border-b border-slate-850 pb-1">Mapeamento Organizacional & Nós de Dados</p>
                
                {twin.companies.map(comp => (
                  <div key={comp.id} className="p-3 bg-slate-900 border border-slate-850 rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                      <span className="font-bold text-white text-xs">{comp.name} ({comp.legalName})</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">CNPJ: {comp.taxId}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {comp.stores.map(store => (
                        <div key={store.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-400">{store.name}</span>
                            <span className="text-[8px] bg-slate-900 text-slate-400 px-1 rounded font-bold">{store.brand}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 mt-0.5">Filial: {store.city} - {store.state}</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-1">Colaboradores Ativos: <span className="text-white font-black">{store.activeHeadcount}</span></p>
                          
                          <div className="mt-2 space-y-1">
                            <p className="text-[8px] font-bold uppercase text-slate-500">Departamentos & Centros de Custo:</p>
                            {store.departments.map(dept => (
                              <div key={dept.id} className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded flex justify-between items-center text-slate-300">
                                <span>{dept.name}</span>
                                <span className="text-[8px] font-mono text-indigo-300">{dept.costCenters.join(", ")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status and Audit Event list */}
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                  <p className="font-extrabold text-[10px] text-slate-400 uppercase border-b border-slate-850 pb-1">Estatísticas do Twin</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-slate-900 p-2 rounded text-center">
                      <p className="text-white font-black text-sm">{structure.totalWorkspaces}</p>
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Workspaces</p>
                    </div>
                    <div className="bg-slate-900 p-2 rounded text-center">
                      <p className="text-white font-black text-sm">{structure.totalUsers}</p>
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Usuários Ativos</p>
                    </div>
                    <div className="bg-slate-900 p-2 rounded text-center">
                      <p className="text-white font-black text-sm">{structure.totalTeams}</p>
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Times Ativos</p>
                    </div>
                    <div className="bg-slate-900 p-2 rounded text-center">
                      <p className="text-white font-black text-sm">{structure.dataSources.length}</p>
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Fontes de Dados</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                  <p className="font-extrabold text-[10px] text-slate-400 uppercase border-b border-slate-850 pb-1 flex items-center gap-1">
                    <History size={11} className="text-indigo-400" />
                    <span>Trilha de Auditoria Recente</span>
                  </p>
                  <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto">
                    {auditLogs.map((log, index) => (
                      <div key={log.id || index} className="p-1.5 bg-slate-900 border border-slate-850 rounded text-[9px] leading-tight space-y-0.5">
                        <div className="flex justify-between items-center font-bold text-slate-400">
                          <span className="text-white truncate max-w-[120px]">{log.type}</span>
                          <span className="text-[8px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-300 text-[8.5px] leading-snug">{log.message}</p>
                        <p className="text-[8px] text-indigo-400 font-bold">Responsável: {log.user}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
