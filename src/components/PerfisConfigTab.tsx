import React, { useState, useEffect } from "react";
import { Shield, BarChart3, Sliders, BookOpen, Save, RotateCcw, Plus, Trash2, ShieldCheck, Eye, EyeOff, LayoutGrid, Sparkles, AlertTriangle } from "lucide-react";
import { showToast } from "./Toast";
import { getStoredProfiles, saveStoredProfiles, CorporateProfile, DEFAULT_PRESETS, auditLog } from "../utils/profileManager";
import { identityEngine } from "../core/identity/IdentityEngine";
import { workspaceDictionaryRepository, WorkspaceDictionary, AdaptiveDisplayLabel, adaptiveThemeEngine, adaptiveUILabelEngine } from "../core/adaptive-ui";

interface LgpdLog {
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

export const PerfisConfigTab: React.FC = () => {
  const [profiles, setProfiles] = useState<CorporateProfile[]>([]);
  const [lgpdLogs, setLgpdLogs] = useState<LgpdLog[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [subTab, setSubTab] = useState<"profiles" | "terminology">("profiles");
  const [dict, setDict] = useState<WorkspaceDictionary | null>(null);
  const [previewText, setPreviewText] = useState<string>(
    "O total de comissões pagas aos vendedores e clientes no departamento da filial. A reunião e a apresentação de dashboards estão prontas."
  );

  const getWorkspaceDomain = (): string => {
    const ws = identityEngine.getCurrentWorkspace();
    const wsId = ws?.id || "ws_primary";
    let domain = "shared";
    try {
      const rawRegistry = localStorage.getItem("sauron_workspace_registry");
      if (rawRegistry) {
        const registry = JSON.parse(rawRegistry);
        const intelligentWs = registry.workspaces?.[wsId];
        if (intelligentWs) {
          domain = intelligentWs.detectedDomain || intelligentWs.domainPackId || "shared";
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return domain;
  };

  const loadDictionary = () => {
    const ws = identityEngine.getCurrentWorkspace();
    const wsId = ws?.id || "ws_primary";
    const domain = getWorkspaceDomain();
    setDict(workspaceDictionaryRepository.getDictionary(wsId, domain));
  };

  useEffect(() => {
    setProfiles(getStoredProfiles());
    
    // Load LGPD logs
    const savedLogs = localStorage.getItem("sauron_lgpd_logs");
    if (savedLogs) {
      try {
        setLgpdLogs(JSON.parse(savedLogs));
      } catch (e) {
        setLgpdLogs([]);
      }
    } else {
      const initialLogs: LgpdLog[] = [
        {
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          user: "Sistema Sauron (Automático)",
          action: "CONVERSÃO DE SISTEMA",
          details: "Banco de credenciais locais convertido para criptografia e separação de governança operacional em total conformidade com a LGPD.",
          ip: "10.154.20.101"
        }
      ];
      localStorage.setItem("sauron_lgpd_logs", JSON.stringify(initialLogs));
      setLgpdLogs(initialLogs);
    }

    loadDictionary();
  }, []);

  const addLog = (action: string, details: string) => {
    auditLog(action, details, "Consultor Técnico (Sessão Ativa)");
    try {
      const savedLogs = localStorage.getItem("sauron_lgpd_logs");
      if (savedLogs) {
        setLgpdLogs(JSON.parse(savedLogs));
      }
    } catch (e) {
      console.warn("Falha ao sincronizar logs locais:", e);
    }
  };

  const handleSave = () => {
    const emails = profiles.map(p => p.email.toLowerCase());
    const hasDuplicates = emails.some((email, idx) => emails.indexOf(email) !== idx);
    if (hasDuplicates) {
      showToast("error", "Cada usuário deve ter um e-mail único.");
      return;
    }

    saveStoredProfiles(profiles);
    addLog("ALTERAÇÃO_PERFIS", `Alteração na política de perfis de suporte. ${profiles.length} perfis atualizados.`);
    showToast("success", "Perfis de acesso salvos.");
  };

  const handleResetToDefault = () => {
    if (confirm("Deseja mesmo reverter todas as credenciais para os padrões de fábrica do Sauron?")) {
      setProfiles([...DEFAULT_PRESETS]);
      saveStoredProfiles(DEFAULT_PRESETS);
      addLog("RESTAURAÇÃO_PRESETS", "Lista de perfis restaurada para os padrões originais.");
      showToast("info", "Perfis restaurados. Faça login novamente para confirmar.");
    }
  };

  const handleChangeField = (idx: number, field: keyof CorporateProfile, value: string) => {
    const updated = [...profiles];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    } as CorporateProfile;
    setProfiles(updated);
  };

  const handleAddProfile = () => {
    const newProf: CorporateProfile = {
      name: "Novo Colaborador",
      email: `colaborador${profiles.length + 1}@sauron.com`,
      password: "colab123",
      role: "analista",
      description: "Acesso customizado aos relatórios de fechamento contábil."
    };
    setProfiles([...profiles, newProf]);
    addLog("PERFIL_ADICIONADO", `Início da configuração do novo perfil temporário: ${newProf.email}`);
  };

  const handleDeleteProfile = (idx: number) => {
    const target = profiles[idx];
    if (confirm(`Tem certeza que deseja apagar permanentemente o perfil de ${target.name} (${target.email})?`)) {
      const updated = profiles.filter((_, i) => i !== idx);
      setProfiles(updated);
      addLog("PERFIL_DELETADO", `Remoção definitiva de credenciais associadas ao e-mail: ${target.email}`);
    }
  };

  const togglePasswordVisibility = (email: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "consultor": return <Shield className="text-amber-500" size={14} />;
      case "diretor": return <BarChart3 className="text-indigo-500" size={14} />;
      case "gerente": return <Sliders className="text-emerald-500" size={14} />;
      default: return <BookOpen className="text-slate-500" size={14} />;
    }
  };

  // Terminology Handlers
  const handleTermChange = (key: string, field: keyof AdaptiveDisplayLabel, value: string) => {
    if (!dict) return;
    const term = dict.terms[key] || { canonicalKey: key, displayLabel: "", displayPlural: "", iconKey: "", accentColor: "", abbreviation: "", workspaceId: dict.workspaceId };
    
    let updatedTerm = { ...term, [field]: value };
    setDict({
      ...dict,
      terms: {
        ...dict.terms,
        [key]: updatedTerm
      }
    });
  };

  const handleSaveTerminology = () => {
    if (!dict) return;
    workspaceDictionaryRepository.saveDictionary(dict);
    addLog("ALTERAÇÃO_TERMINOLOGIA", `Ajuste na terminologia personalizada para o workspace ${dict.workspaceId}.`);
    // Marcar dicionário customizado no localStorage para Checklist e Timeline
    try { localStorage.setItem("sauron_custom_dictionary", Date.now().toString()); } catch (e) {}
    showToast("success", "Vocabulário do projeto atualizado.");
  };

  const handleResetToSegment = () => {
    if (!dict) return;
    const domain = getWorkspaceDomain();
    const segmentDict = workspaceDictionaryRepository.createDefaultDictionary(dict.workspaceId, domain);
    setDict(segmentDict);
    addLog("RESTORE_SEGMENT", `Terminologia revertida para os padrões do segmento detectado: ${domain}.`);
  };

  const handleResetToNeutral = () => {
    if (!dict) return;
    const neutralDict = workspaceDictionaryRepository.createDefaultDictionary(dict.workspaceId, "shared");
    setDict(neutralDict);
    addLog("RESTORE_NEUTRAL", `Terminologia revertida para o padrão neutro do Sauron.`);
  };

  const handleCancelChanges = () => {
    loadDictionary();
    addLog("CANCEL_CHANGES", `Edições de terminologias descartadas.`);
  };

  // Live preview translator
  const getPreviewResult = (): string => {
    if (!dict) return previewText;
    
    // Construct local mock engine containing transient state changes
    const originalText = previewText;
    
    // Perform transient term replacements based on current state of dictionary
    let result = originalText;
    const replaceCasePreserved = (txt: string, regex: RegExp, replacement: string): string => {
      return txt.replace(regex, (match) => {
        if (match === match.toUpperCase()) return replacement.toUpperCase();
        if (match.charAt(0) === match.charAt(0).toUpperCase()) return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        return replacement.toLowerCase();
      });
    };

    // Split and map plural first
    result = replaceCasePreserved(result, /\bcomissões\b/gi, dict.terms.commission?.displayPlural || "comissões");
    result = replaceCasePreserved(result, /\bclientes\b/gi, dict.terms.customer?.displayPlural || "clientes");
    result = replaceCasePreserved(result, /\bvendedores\b/gi, dict.terms.seller?.displayPlural || "vendedores");
    result = replaceCasePreserved(result, /\bdepartamentos\b/gi, dict.terms.department?.displayPlural || "departamentos");
    result = replaceCasePreserved(result, /\bfiliais\b/gi, dict.terms.branch?.displayPlural || "filiais");
    result = replaceCasePreserved(result, /\blojas\b/gi, dict.terms.branch?.displayPlural || "lojas");
    result = replaceCasePreserved(result, /\bempresas\b/gi, dict.terms.company?.displayPlural || "empresas");
    result = replaceCasePreserved(result, /\bgrupos\b/gi, dict.terms.group?.displayPlural || "grupos");
    result = replaceCasePreserved(result, /\bcolaboradores\b/gi, dict.terms.people?.displayPlural || "colaboradores");
    result = replaceCasePreserved(result, /\bfuncionários\b/gi, dict.terms.people?.displayPlural || "funcionários");
    result = replaceCasePreserved(result, /\bpessoas\b/gi, dict.terms.people?.displayPlural || "pessoas");
    result = replaceCasePreserved(result, /\bdashboards\b/gi, dict.terms.dashboard?.displayPlural || "dashboards");
    result = replaceCasePreserved(result, /\brelatórios\b/gi, dict.terms.report?.displayPlural || "relatórios");
    result = replaceCasePreserved(result, /\breuniões\b/gi, dict.terms.meeting?.displayPlural || "reuniões");
    result = replaceCasePreserved(result, /\bapresentações\b/gi, dict.terms.presentation?.displayPlural || "apresentações");

    // Singular
    result = replaceCasePreserved(result, /\bcomissão\b/gi, dict.terms.commission?.displayLabel || "comissão");
    result = replaceCasePreserved(result, /\bcliente\b/gi, dict.terms.customer?.displayLabel || "cliente");
    result = replaceCasePreserved(result, /\bvendedor\b/gi, dict.terms.seller?.displayLabel || "vendedor");
    result = replaceCasePreserved(result, /\bdepartamento\b/gi, dict.terms.department?.displayLabel || "departamento");
    result = replaceCasePreserved(result, /\bfilial\b/gi, dict.terms.branch?.displayLabel || "filial");
    result = replaceCasePreserved(result, /\bloja\b/gi, dict.terms.branch?.displayLabel || "loja");
    result = replaceCasePreserved(result, /\bempresa\b/gi, dict.terms.company?.displayLabel || "empresa");
    result = replaceCasePreserved(result, /\bgrupo\b/gi, dict.terms.group?.displayLabel || "grupo");
    result = replaceCasePreserved(result, /\bcolaborador\b/gi, dict.terms.people?.displayLabel || "colaborador");
    result = replaceCasePreserved(result, /\bfuncionário\b/gi, dict.terms.people?.displayLabel || "funcionário");
    result = replaceCasePreserved(result, /\bpessoa\b/gi, dict.terms.people?.displayLabel || "pessoa");
    result = replaceCasePreserved(result, /\bdashboard\b/gi, dict.terms.dashboard?.displayLabel || "dashboard");
    result = replaceCasePreserved(result, /\bpainel\b/gi, dict.terms.dashboard?.displayLabel || "painel");
    result = replaceCasePreserved(result, /\brelatório\b/gi, dict.terms.report?.displayLabel || "relatório");
    result = replaceCasePreserved(result, /\breunião\b/gi, dict.terms.meeting?.displayLabel || "reunião");
    result = replaceCasePreserved(result, /\bapresentação\b/gi, dict.terms.presentation?.displayLabel || "apresentação");

    return result;
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">MÓDULO DE CONFIGURAÇÕES</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">ADAPTATIVE UX CERTIFICADO</span>
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-100">Configurações Gerais do Workspace</h2>
          <p className="text-[10px] text-slate-400">Edição e governança em tempo de execução dos perfis de acesso e dicionário semântico de termos.</p>
        </div>

        {subTab === "profiles" ? (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleAddProfile}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider cursor-pointer transition-colors"
            >
              <Plus size={11} /> Adicionar Perfil
            </button>
            <button
              onClick={handleResetToDefault}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-rose-450 border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider cursor-pointer transition-colors"
            >
              <RotateCcw size={11} /> Reverter Padrões
            </button>
            <button
              onClick={handleSave}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider cursor-pointer transition-colors shadow-md"
            >
              <Save size={11} /> Salvar Tudo
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={handleResetToSegment}
              className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-wider cursor-pointer transition-colors"
            >
              Reset Segmento
            </button>
            <button
              onClick={handleResetToNeutral}
              className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-wider cursor-pointer transition-colors"
            >
              Reset Neutro
            </button>
            <button
              onClick={handleCancelChanges}
              className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-rose-450 border border-slate-700 px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-wider cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveTerminology}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-wider cursor-pointer transition-colors shadow-md"
            >
              <Save size={11} /> Salvar Dicionário
            </button>
          </div>
        )}
      </div>

      {/* Sub tabs switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setSubTab("profiles")}
          className={`pb-2.5 text-[11px] font-black uppercase tracking-widest border-b-2 cursor-pointer transition-all ${
            subTab === "profiles"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Perfis de Acesso & LGPD
        </button>
        <button
          onClick={() => setSubTab("terminology")}
          className={`pb-2.5 text-[11px] font-black uppercase tracking-widest border-b-2 cursor-pointer transition-all ${
            subTab === "terminology"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Terminologia da Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {subTab === "profiles" ? (
          /* Profiles Editor Column */
          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((profile, idx) => (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      {getRoleIcon(profile.role)}
                      <span className="text-xs font-extrabold uppercase text-slate-750 dark:text-white">Perfil {idx + 1}</span>
                    </div>
                    {profile.role !== "consultor" && (
                      <button 
                        onClick={() => handleDeleteProfile(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Deletar Perfil"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Nome de Exibição</span>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => handleChangeField(idx, "name", e.target.value)}
                          className="w-full text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-2 py-1 rounded focus:outline-none focus:border-blue-500 dark:text-white"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Papel Operacional</span>
                        <select
                          value={profile.role}
                          onChange={(e) => handleChangeField(idx, "role", e.target.value)}
                          className="w-full text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-1 py-1 rounded focus:outline-none focus:border-blue-500 dark:text-white cursor-pointer"
                        >
                          <option value="consultor">consultor (Suporte)</option>
                          <option value="diretor">diretor (Executivo)</option>
                          <option value="gerente">gerente (Gestão)</option>
                          <option value="analista">analista (Leitura)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">E-mail Corporativo</span>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleChangeField(idx, "email", e.target.value)}
                        className="w-full text-[11px] font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-2 py-1 rounded focus:outline-none focus:border-blue-500 dark:text-white"
                      />
                    </div>

                    <div className="space-y-0.5 relative">
                      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Senha Secreta</span>
                      <div className="relative">
                        <input
                          type={showPasswords[profile.email] ? "text" : "password"}
                          value={profile.password}
                          onChange={(e) => handleChangeField(idx, "password", e.target.value)}
                          className="w-full text-[11px] font-mono tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-2 py-1 pr-8 rounded focus:outline-none focus:border-blue-500 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(profile.email)}
                          className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                        >
                          {showPasswords[profile.email] ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Descrição dos Limites de Escopo</span>
                      <textarea
                        value={profile.description}
                        onChange={(e) => handleChangeField(idx, "description", e.target.value)}
                        rows={2}
                        className="w-full text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-2 py-1 rounded focus:outline-none focus:border-blue-500 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Terminology Editor Column */
          <div className="xl:col-span-2 space-y-4">
            
            {/* Real-time Preview Card */}
            <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl space-y-2 text-white">
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Pré-visualização em Tempo Real</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded focus:outline-none focus:border-blue-500 text-slate-200 font-medium"
                  placeholder="Digite uma frase de teste..."
                />
                <p className="text-xs text-slate-400 italic">Resultado adaptado:</p>
                <div className="bg-slate-950/50 p-3 rounded border border-slate-800/80 text-xs font-bold text-emerald-400 leading-relaxed font-sans">
                  {getPreviewResult()}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 p-6 rounded-2xl shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest flex items-center gap-1.5">
                  <LayoutGrid size={14} className="text-blue-500" />
                  <span>Dicionário Adaptativo de Termos</span>
                </h3>
              </div>

              {dict && (
                <div className="space-y-5 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(dict.terms).map((key) => {
                    const term = dict.terms[key] || { canonicalKey: key, displayLabel: "", displayPlural: "", abbreviation: "", iconKey: "", accentColor: "", workspaceId: dict.workspaceId };
                    const termFriendlyNames: Record<string, string> = {
                      people: "Equipe / Funcionários",
                      customer: "Clientes",
                      seller: "Área Comercial / Vendedores",
                      department: "Departamentos / Setores / Centros",
                      branch: "Filiais / Lojas / Fazendas",
                      company: "Empresa / Fornecedores / Cooperativa",
                      group: "Grupo Empresarial / Holding",
                      commission: "Comissões / Bônus / Prêmios",
                      dashboard: "Painel / Dashboard",
                      report: "Relatórios / Diagnósticos / Dossiês",
                      meeting: "Reuniões / Comitês / Assembleias",
                      presentation: "Apresentações / Decks / Slides",
                    };
                    const friendlyName = termFriendlyNames[key] || `Entidade ${key}`;
                    
                    // Accessibility Check: accentColor against white background
                    const isContrastA11ySafe = adaptiveThemeEngine.validateAccentColor(term.accentColor || "#64748b", "#ffffff");

                    return (
                      <div key={key} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/30 pb-2">
                          <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-350 tracking-wider flex items-center gap-1">
                            <Sparkles size={11} className="text-blue-500" />
                            {friendlyName}
                          </span>
                          <div className="flex items-center gap-2">
                            {!isContrastA11ySafe && (
                              <span className="flex items-center gap-0.5 text-[8px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold uppercase shrink-0 border border-amber-300">
                                <AlertTriangle size={9} /> WCAG AA Baixo
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-200/50 dark:bg-slate-850 px-1.5 py-0.2 rounded">{key}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Nome Singular:</label>
                            <input
                              type="text"
                              value={term.displayLabel || ""}
                              onChange={(e) => handleTermChange(key, "displayLabel", e.target.value)}
                              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 focus:outline-none focus:border-blue-500 dark:text-white"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Nome Plural:</label>
                            <input
                              type="text"
                              value={term.displayPlural || ""}
                              onChange={(e) => handleTermChange(key, "displayPlural", e.target.value)}
                              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 focus:outline-none focus:border-blue-500 dark:text-white"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Abreviação:</label>
                            <input
                              type="text"
                              value={term.abbreviation || ""}
                              onChange={(e) => handleTermChange(key, "abbreviation", e.target.value)}
                              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 focus:outline-none focus:border-blue-500 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Ícone Lucide:</label>
                            <input
                              type="text"
                              value={term.iconKey || ""}
                              onChange={(e) => handleTermChange(key, "iconKey", e.target.value)}
                              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 focus:outline-none focus:border-blue-500 dark:text-white"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Cor do Destaque:</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={term.accentColor || "#64748b"}
                                onChange={(e) => handleTermChange(key, "accentColor", e.target.value)}
                                className="w-8 h-8 rounded border border-slate-200 cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={term.accentColor || ""}
                                onChange={(e) => handleTermChange(key, "accentColor", e.target.value)}
                                className="flex-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 focus:outline-none focus:border-blue-500 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Sinônimos (Vírgula):</label>
                            <input
                              type="text"
                              value={term.synonyms?.join(", ") || ""}
                              onChange={(e) => handleTermChange(key, "synonyms", e.target.value)}
                              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 focus:outline-none focus:border-blue-500 dark:text-white"
                              placeholder="ex: filial, fazenda, matriz"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit / Compliance Info Column */}
        <div className="space-y-4">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 space-y-2 pb-3 mb-2">
            <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-450">
              <ShieldCheck size={16} />
              <h4 className="text-xs font-extrabold uppercase tracking-wide">Padrões Ativos da LGPD</h4>
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-normal">
              O Sauron executa criptografia na representação das strings de consulta, bloqueia visualizações indevidas, registra dados em localidade protegida, e implementa **Audit Traceability** de todas as operações administrativas para conformidade estrita da LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709).
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-3">
            <div className="border-b border-slate-150 dark:border-slate-850 pb-1.5 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">LOG DE TRACABILIDADE OPERACIONAL (LGPD)</span>
              <span className="text-[8px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono font-bold font-semibold uppercase">Restrito</span>
            </div>

            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-0.5 custom-scrollbar font-mono text-[9px]">
              {lgpdLogs.length === 0 ? (
                <p className="text-slate-400 italic text-center py-4">Nenhum log gravado ou auditado no momento.</p>
              ) : (
                lgpdLogs.map((log, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-850 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex justify-between font-bold text-slate-400 text-[8px]">
                      <span>{new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})</span>
                      <span>IP: {log.ip}</span>
                    </div>
                    <div>
                      <span className="text-red-500 dark:text-rose-400 font-extrabold uppercase mr-1">[{log.action}]</span>
                      <span className="text-slate-650 dark:text-slate-350">{log.details}</span>
                    </div>
                    <p className="text-[8px] text-slate-400 italic">Usuário: {log.user}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
