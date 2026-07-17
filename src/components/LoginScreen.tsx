/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Shield, Lock, AlertCircle, CheckCircle2, ChevronRight, Mail, User, Building, Sparkles } from "lucide-react";
import { userManager } from "../core/identity/UserManager";
import { organizationManager } from "../core/identity/OrganizationManager";
import { identityEngine } from "../core/identity/IdentityEngine";
import { auditLog } from "../utils/profileManager";
import { showToast } from "./Toast";

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; role: "consultor" | "diretor" | "gerente" | "analista" }) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  isExpired?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, darkMode, setDarkMode, isExpired }) => {
  const users = userManager.getUsers();
  const isFirstAccess = users.length === 0;

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Onboarding wizard state
  const [bootFullName, setBootFullName] = useState("");
  const [bootEmail, setBootEmail] = useState("");
  const [bootPassword, setBootPassword] = useState("");
  const [bootConfirmPassword, setBootConfirmPassword] = useState("");
  const [bootOrgName, setBootOrgName] = useState("");
  const [bootError, setBootError] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    setLoginError("");

    try {
      const user = identityEngine.login(email, password);
      if (user) {
        auditLog("AUTENTICAÇÃO_MANUAL", `Acesso concedido para ${user.profile.fullName}`, user.profile.fullName);
        onLogin({
          name: user.profile.fullName,
          email: user.profile.email,
          role: "consultor" // Legacy role mapping
        });
      } else {
        setLoginError("E-mail ou senha incorretos.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Erro ao autenticar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBootstrapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBootError("");

    if (!bootFullName || !bootEmail || !bootPassword || !bootConfirmPassword || !bootOrgName) {
      setBootError("Preencha todos os campos para configurar a plataforma.");
      return;
    }

    if (bootPassword !== bootConfirmPassword) {
      setBootError("As senhas não coincidem.");
      return;
    }

    if (bootPassword.length < 6) {
      setBootError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    const adminId = "user_" + Date.now();
    const orgId = "org_" + Date.now();
    const wsId = "ws_" + Date.now();

    try {
      // 1. Create Organization first
      organizationManager.createOrganization({
        id: orgId,
        name: bootOrgName,
        type: "consulting_firm",
        ownerUserId: adminId,
        members: [adminId],
        teams: [],
        workspaces: [wsId]
      });

      // 2. Create Workspace
      organizationManager.createWorkspace({
        id: wsId,
        name: `Workspace ${bootOrgName}`,
        organizationId: orgId,
        clientId: "client_" + Date.now(),
        companies: [],
        brands: [],
        stores: [],
        costCenters: [],
        allowedUsers: [adminId],
        allowedTeams: [],
        accessPolicies: [
          { id: "p1", role: "SUPER_ADMIN", permission: "workspace.view", scope: "global" },
          { id: "p2", role: "SUPER_ADMIN", permission: "workspace.manage", scope: "global" },
          { id: "p3", role: "CONSULTANT", permission: "workspace.view", scope: "workspace" },
          { id: "p4", role: "CONSULTANT", permission: "data.view", scope: "workspace" },
          { id: "p5", role: "CONSULTANT", permission: "data.import", scope: "workspace" },
          { id: "p6", role: "CONSULTANT", permission: "analytics.view", scope: "workspace" }
        ],
        dataSources: [],
        presentations: [],
        meetings: [],
        actionPlans: [],
        auditTrail: []
      });

      // 3. Create Super Admin user
      userManager.createUser({
        id: adminId,
        profile: {
          id: adminId,
          fullName: bootFullName,
          email: bootEmail,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(bootFullName)}`
        },
        role: "SUPER_ADMIN",
        organizationId: orgId,
        password: bootPassword
      });

      // 4. Force login
      identityEngine.login(bootEmail, bootPassword);

      auditLog("BOOTSTRAP_PLATAFORMA", `Plataforma inicializada com sucesso por ${bootFullName} (${bootEmail}).`, bootFullName);
      showToast("success", "Sauron inicializado com sucesso!");

      onLogin({
        name: bootFullName,
        email: bootEmail,
        role: "consultor"
      });
    } catch (err: any) {
      setBootError(err.message || "Falha ao inicializar plataforma.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      
      {/* Visual background enhancements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 z-10">
        
        {/* BRAND LOGO */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-full text-white font-mono font-black tracking-widest uppercase text-xs shadow-lg">
            <Shield size={14} className="text-blue-500 animate-pulse" />
            <span>Sauron OS</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase font-mono">
            Sauron
          </h1>
          <p className="text-sm text-slate-400">
            Inteligência empresarial para consultorias
          </p>
        </div>

        {isFirstAccess ? (
          /* ONBOARDING FLOW: INITIAL SUPER ADMIN CREATION */
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-400 animate-bounce" />
              <h3 className="text-xs font-black uppercase text-white tracking-widest">
                Inicializar Sauron — Criar primeiro Super Admin
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Nenhum consultor ou organização cadastrada no sistema. Preencha o formulário abaixo para registrar suas credenciais de Superadministrador e configurar seu ambiente de trabalho.
            </p>

            <form onSubmit={handleBootstrapSubmit} className="space-y-4">
              {bootError && (
                <div className="p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl text-xs font-semibold text-red-400 flex items-center gap-2.5 animate-shake">
                  <AlertCircle size={15} />
                  <span>{bootError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Nome completo"
                    value={bootFullName}
                    onChange={(e) => setBootFullName(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="E-mail corporativo"
                    value={bootEmail}
                    onChange={(e) => setBootEmail(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Senha secreta (mínimo 6 caracteres)"
                    value={bootPassword}
                    onChange={(e) => setBootPassword(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Confirmar senha"
                    value={bootConfirmPassword}
                    onChange={(e) => setBootConfirmPassword(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Nome da sua consultoria / organização"
                    value={bootOrgName}
                    onChange={(e) => setBootOrgName(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase tracking-wider text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <span>Inicializar Super Admin & Iniciar</span>
                <ChevronRight size={14} />
              </button>
            </form>
          </div>
        ) : (
          /* STANDARD CLEAN LOGIN SCREEN */
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4 flex items-center gap-2">
              <Lock size={16} className="text-blue-500" />
              <h3 className="text-xs font-black uppercase text-white tracking-widest">
                Controle de Acesso Governança
              </h3>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl text-xs font-semibold text-red-400 flex items-center gap-2.5">
                  <AlertCircle size={15} />
                  <span>{loginError}</span>
                </div>
              )}

              {isExpired && !loginError && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-900/50 rounded-xl text-xs font-semibold text-amber-400 flex items-center gap-2.5">
                  <AlertCircle size={15} />
                  <span>Sessão expirada. Por favor, autentique-se novamente.</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3.5 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3.5 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-extrabold uppercase tracking-wider text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isSubmitting ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <span>Entrar no Sauron</span>
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* FOOTER */}
        <p className="text-[10px] text-center text-slate-550 leading-normal font-medium font-mono">
          Sauron Platform &copy; 2026
        </p>
      </div>
    </main>
  );
};
