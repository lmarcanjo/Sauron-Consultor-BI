import React, { useState } from "react";
import { 
  Shield, Coins, Sliders, BookOpen, Lock, Sparkles, Building, BarChart3, 
  Sun, Moon, ChevronRight, ArrowLeft, Check, CheckCircle2, AlertCircle, Key, Users, Briefcase
} from "lucide-react";
import { userManager } from "../core/identity/UserManager";
import { organizationManager } from "../core/identity/OrganizationManager";
import { identityEngine } from "../core/identity/IdentityEngine";
import { auditLog } from "../utils/profileManager";
import { PlatformUser, Organization, Workspace } from "../core/identity/types";

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; role: "consultor" | "diretor" | "gerente" | "analista" }) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, darkMode, setDarkMode }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  // Manual fallback state
  const [showManual, setShowManual] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [manualError, setManualError] = useState("");

  const users = userManager.getUsers();

  const getLegacyMappedRole = (role: string): "consultor" | "diretor" | "gerente" | "analista" => {
    if (["Super Admin", "Consultant Admin", "Consultant"].includes(role)) return "consultor";
    if (["Client Director", "Controller"].includes(role)) return "diretor";
    if (["Client Manager"].includes(role)) return "gerente";
    return "analista";
  };

  const getRoleRights = (role: string) => {
    switch (role) {
      case "Super Admin":
        return ["Acesso total e irrestrito", "Administração e feature flags", "Central de Dados (Banco, VPN, ETL)", "Visualização e edições de DRE"];
      case "Consultant Admin":
        return ["Acesso de gestor de consultoria", "Conectar e validar dados", "Preparar decisões e rituais", "Visualizar relatórios financeiros"];
      case "Consultant":
        return ["Visualizar e importar dados", "Gerenciar planos de ação", "Acompanhar rituais e sessões", "Criar narrativas executivas"];
      case "Client Director":
        return ["Centro de comando e KPIs", "Histórico executivo consolidado", "Preparar e aprovar decisões", "Visualizar DRE e metas de performance"];
      case "Client Manager":
        return ["Controle de operações setoriais", "Executar planos de ação", "Visualizar comissões e performance de vendedores"];
      case "Financial User":
        return ["Leitura segura de dados", "Validar planilhas de faturamento", "Visualizar DRE e finanças básicas"];
      case "Controller":
        return ["Análise e conciliação contábil", "Auditoria de dados", "Visualização de fechamentos mensais"];
      case "Auditor":
        return ["Leitura técnica para compliance", "Verificar trilhas de auditoria", "Validar integridade de faturamento e LGPD"];
      case "Viewer":
        return ["Acesso somente leitura", "Visualizar centro de comando tático"];
      case "Guest":
        return ["Acesso restrito convidado", "Apenas visualiza narrativas compartilhadas"];
      default:
        return ["Acesso básico de leitura"];
    }
  };

  const handleSelectUser = (user: PlatformUser) => {
    setSelectedUser(user);
    
    // Find organizations this user belongs to
    const orgs = organizationManager.getOrganizations();
    const allowedOrgs = user.role === "Super Admin" 
      ? orgs 
      : orgs.filter(o => o.members.includes(user.id));
    
    if (allowedOrgs.length > 0) {
      setSelectedOrg(allowedOrgs[0]);
    } else {
      setSelectedOrg(null);
    }
    
    setStep(2);
  };

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
    
    // Find workspaces inside this organization that the user can see
    const workspaces = org.workspaces
      .map(id => organizationManager.getWorkspace(id))
      .filter((w): w is Workspace => !!w);
    
    if (workspaces.length > 0) {
      setSelectedWorkspace(workspaces[0]);
    } else {
      setSelectedWorkspace(null);
    }
    
    setStep(3);
  };

  const handleSelectWorkspace = (ws: Workspace) => {
    setSelectedWorkspace(ws);
    setStep(4);
  };

  const handleConfirmLogin = () => {
    if (!selectedUser || !selectedOrg || !selectedWorkspace) return;

    // Persist to IdentityEngine
    identityEngine.switchUser(selectedUser.id);
    identityEngine.switchOrganization(selectedOrg.id);
    identityEngine.switchWorkspace(selectedWorkspace.id);

    auditLog(
      "SESSÃO_INICIADA", 
      `Acesso concedido para ${selectedUser.profile.fullName} na organização ${selectedOrg.name} e caso ${selectedWorkspace.name}.`, 
      selectedUser.profile.fullName
    );

    onLogin({
      name: selectedUser.profile.fullName,
      email: selectedUser.profile.email,
      role: getLegacyMappedRole(selectedUser.role)
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail || !manualPassword) {
      setManualError("Preencha todos os campos.");
      return;
    }

    // Try to match preset passwords (role + "123")
    const matched = users.find(u => u.profile.email.toLowerCase() === manualEmail.toLowerCase());
    const expectedPassword = matched ? `${matched.role.toLowerCase().replace(/ /g, "")}123` : "sauron123";

    if (matched && manualPassword === expectedPassword) {
      setSelectedUser(matched);
      const org = organizationManager.getOrganization(matched.organizationId) || organizationManager.getOrganizations()[0];
      setSelectedOrg(org);
      const ws = org.workspaces.map(id => organizationManager.getWorkspace(id)).find(w => !!w) || null;
      setSelectedWorkspace(ws);
      
      // Persist to IdentityEngine
      identityEngine.switchUser(matched.id);
      identityEngine.switchOrganization(org.id);
      if (ws) identityEngine.switchWorkspace(ws.id);

      auditLog("AUTENTICAÇÃO_MANUAL", `Acesso manual concedido para ${matched.profile.fullName}`, matched.profile.fullName);
      
      onLogin({
        name: matched.profile.fullName,
        email: matched.profile.email,
        role: getLegacyMappedRole(matched.role)
      });
    } else {
      setManualError("Senha secreta incorreta para este perfil de demonstração.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-center items-center py-12 px-4 transition-colors duration-150 relative">
      
      {/* Dark mode switcher top-right */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
        >
          {darkMode ? (
            <>
              <Sun size={13} className="text-amber-500 animate-spin-slow" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon size={13} className="text-indigo-500" />
              <span>Modo Escuro</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-4xl w-full space-y-6">
        
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-white font-mono font-black tracking-wider uppercase text-[10px]">
            <Shield size={12} className="text-blue-500" />
            <span>Sauron OS — Consulting Operating System</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Portal de Acesso Governança
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Ambiente de Demonstração Controlado em conformidade contábil.
            Experimente os diferentes níveis de governança simulando acessos de consultores e conselheiros.
          </p>
        </div>

        {showManual ? (
          /* MANUAL CREDENTIALS FALLBACK */
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest flex items-center gap-1.5">
                <Lock size={13} className="text-blue-500" />
                <span>Credenciamento Manual</span>
              </h3>
              <button 
                onClick={() => setShowManual(false)}
                className="text-[10px] text-blue-500 font-extrabold hover:underline"
              >
                Voltar ao Wizard
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              {manualError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{manualError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">E-mail Corporativo:</label>
                <input
                  type="email"
                  placeholder="consultor@sauron.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Senha Secreta:</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase tracking-wider text-xs rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <span>Validar Acesso</span>
                <Sparkles size={12} />
              </button>
            </form>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-250 dark:border-slate-850 text-left space-y-1 text-[9px] font-mono leading-relaxed text-slate-500">
              <span className="font-extrabold text-slate-600 uppercase">Dica de Acesso:</span>
              <p>
                Qualquer e-mail oficial (ex: <span className="font-bold">consultor@sauron.com</span>) com senha <span className="font-bold">consultor123</span> (papel sem espaço + 123) permite login direto.
              </p>
            </div>
          </div>
        ) : (
          /* STEP WIZARD */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[460px]">
            
            {/* WIZARD PROCESS INDICATOR BAR */}
            <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850 px-6 py-3.5 flex flex-wrap gap-4 items-center justify-between text-xs font-bold shrink-0">
              <div className="flex items-center gap-1.5 md:gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  1. Perfil
                </span>
                <ChevronRight size={12} className="text-slate-400" />
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  2. Organização
                </span>
                <ChevronRight size={12} className="text-slate-400" />
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  3. Caso
                </span>
                <ChevronRight size={12} className="text-slate-400" />
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${step === 4 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  4. Revisão
                </span>
              </div>
              
              <button 
                onClick={() => setShowManual(true)}
                className="text-[10px] text-slate-400 hover:text-blue-500 font-extrabold uppercase tracking-wider"
              >
                Credenciamento Manual &rarr;
              </button>
            </div>

            {/* WIZARD MAIN WORKSPACE CONTENT */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              
              {/* STEP 1: SELECT SIMULATED USER */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider">
                      Passo 1: Selecione o Perfil Simulado
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Escolha uma identidade operacional. Cada nível de usuário possui restrições severas de visualização, auditoria e edição de dados.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="text-left p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 hover:dark:border-blue-400 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all flex items-start gap-3 group relative"
                      >
                        <img 
                          src={u.profile.avatarUrl} 
                          alt={u.profile.fullName} 
                          className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-[11px] font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {u.profile.fullName}
                          </h4>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {u.role}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate mt-1">
                            {u.profile.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT ORGANIZATION */}
              {step === 2 && selectedUser && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
                    <button 
                      onClick={() => setStep(1)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <div>
                      <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider">
                        Passo 2: Escolha a Organização
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Selecione sob qual corporação você deseja conduzir as análises nesta sessão de trabalho.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-w-md">
                    {organizationManager.getOrganizations()
                      .filter(o => selectedUser.role === "Super Admin" || o.members.includes(selectedUser.id))
                      .map((org) => (
                        <button
                          key={org.id}
                          onClick={() => handleSelectOrg(org)}
                          className="w-full text-left p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:dark:border-blue-400 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                              <Building size={16} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-white">{org.name}</h4>
                              <p className="text-[10px] text-slate-400">ID: {org.id} • CNPJ Simulado Ativo</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT CASE / WORKSPACE */}
              {step === 3 && selectedUser && selectedOrg && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
                    <button 
                      onClick={() => setStep(2)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <div>
                      <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider">
                        Passo 3: Selecione o Caso de Consultoria
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        O Caso de Consultoria unifica dados, metas de rituais, documentos de comissão e narrativas de fechamento.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-w-md">
                    {selectedOrg.workspaces
                      .map(id => organizationManager.getWorkspace(id))
                      .filter((w): w is Workspace => !!w)
                      .map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => handleSelectWorkspace(ws)}
                          className="w-full text-left p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:dark:border-blue-400 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                              <Briefcase size={16} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-white">{ws.name}</h4>
                              <p className="text-[10px] text-slate-400">Marcas: {ws.brands.join(", ")} • Lojas: {ws.stores.length}</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRM */}
              {step === 4 && selectedUser && selectedOrg && selectedWorkspace && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
                    <button 
                      onClick={() => setStep(3)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <div>
                      <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider">
                        Passo 4: Verifique Suas Credenciais de Governança
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        O Sauron OS estabelece escopo estrito de visualização para fins de conformidade. Confirme os limites do seu perfil.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Access breakdown card */}
                    <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Identidade de Sessão</span>
                      
                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedUser.profile.avatarUrl} 
                          alt={selectedUser.profile.fullName} 
                          className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">{selectedUser.profile.fullName}</h4>
                          <span className="inline-block text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded mt-0.5">{selectedUser.role}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-550 dark:text-slate-400">
                        <p><strong>Organização:</strong> {selectedOrg.name}</p>
                        <p><strong>Caso Ativo:</strong> {selectedWorkspace.name}</p>
                        <p><strong>Papel Comercial:</strong> {selectedUser.role}</p>
                      </div>
                    </div>

                    {/* Permission rules card */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Escopo de Permissões Disponíveis</span>
                      
                      <ul className="space-y-2">
                        {getRoleRights(selectedUser.role).map((right, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{right}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="bg-amber-500/10 text-amber-500 text-[9px] font-mono p-2.5 rounded border border-amber-500/20 leading-relaxed">
                        ⚠️ Todas as ações operacionais, visualizações e exportações serão logadas na Trilha de Auditoria em conformidade contábil.
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleConfirmLogin}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-md shadow-blue-500/20"
                    >
                      <span>Entrar no Centro de Comando Executivo</span>
                      <CheckCircle2 size={14} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* FOOTER */}
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-normal font-medium">
          Holding Sauron &copy; 2026 • Sauron Operating System — Operating System para Consultorias.
        </p>
      </div>
    </div>
  );
};
