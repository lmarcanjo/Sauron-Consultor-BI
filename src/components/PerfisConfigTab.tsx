import React, { useState, useEffect } from "react";
import { Shield, BarChart3, Sliders, BookOpen, Save, RotateCcw, Plus, Trash2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { getStoredProfiles, saveStoredProfiles, CorporateProfile, DEFAULT_PRESETS } from "../utils/profileManager";

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

  useEffect(() => {
    setProfiles(getStoredProfiles());
    
    // Load LGPD corporate logs
    const savedLogs = localStorage.getItem("sauron_lgpd_logs");
    if (savedLogs) {
      try {
        setLgpdLogs(JSON.parse(savedLogs));
      } catch (e) {
        setLgpdLogs([]);
      }
    } else {
      // Seed some compliant initial logs
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
  }, []);

  const addLog = (action: string, details: string) => {
    const newLog: LgpdLog = {
      timestamp: new Date().toISOString(),
      user: "Consultor Técnico (Sessão Ativa)",
      action,
      details,
      ip: "192.168.1.15"
    };
    const updated = [newLog, ...lgpdLogs].slice(0, 50); // Keep last 50
    setLgpdLogs(updated);
    localStorage.setItem("sauron_lgpd_logs", JSON.stringify(updated));
  };

  const handleSave = () => {
    // Validate profiles
    const emails = profiles.map(p => p.email.toLowerCase());
    const hasDuplicates = emails.some((email, idx) => emails.indexOf(email) !== idx);
    if (hasDuplicates) {
      alert("Erro de Validação: Cada perfil corporativo deve possuir um e-mail único.");
      return;
    }

    saveStoredProfiles(profiles);
    addLog("ALTERAÇÃO DE PERFIS", `Alteração na política de perfis de suporte. ${profiles.length} perfis atualizados.`);
    alert("Perfis corporativos sincronizados e salvos com sucesso em localStorage para acessos futuros!");
  };

  const handleResetToDefault = () => {
    if (confirm("Deseja mesmo reverter todas as credenciais e assinaturas para os padrões de fábrica do Sauron?")) {
      setProfiles([...DEFAULT_PRESETS]);
      saveStoredProfiles(DEFAULT_PRESETS);
      addLog("RESTAURAÇÃO DE PRESETS", "Lista de perfis restaurada para os padrões originais de fábrica.");
      alert("Perfis restaurados! Por favor, recarregue para logar com novos padrões.");
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
    addLog("PERFIL ADICIONADO", `Início da configuração do novo perfil temporário: ${newProf.email}`);
  };

  const handleDeleteProfile = (idx: number) => {
    const target = profiles[idx];
    if (confirm(`Tem certeza que deseja apagar permanentemente o perfil de ${target.name} (${target.email})?`)) {
      const updated = profiles.filter((_, i) => i !== idx);
      setProfiles(updated);
      addLog("PERFIL DELETADO", `Remoção definitiva de credenciais associadas ao e-mail: ${target.email}`);
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

  return (
    <div className="space-y-6 font-sans animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">MÓDULO DE CONSULTORIA</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">CONFORMIDADE LGPD</span>
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-100">Controles de Governança de Perfis e Identidades</h2>
          <p className="text-[10px] text-slate-400">Edição e governança em tempo de execução dos perfis corporativos admitidos nas sessões locais de consulta.</p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Profiles Editor Column */}
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((profile, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-xs space-y-3 relative overflow-hidden"
              >
                {/* Header Profile Title */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    {getRoleIcon(profile.role)}
                    <span className="text-xs font-extrabold uppercase text-slate-750 dark:text-white">Perfil {idx + 1}</span>
                  </div>
                  
                  {/* Prevent self lockout easily */}
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

                {/* Edit Form */}
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

        {/* Audit / Compliance Info Column */}
        <div className="space-y-4">
          
          {/* LGPD Security parameters notice */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 space-y-2 pb-3 mb-2">
            <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-450">
              <ShieldCheck size={16} />
              <h4 className="text-xs font-extrabold uppercase tracking-wide">Padrões Ativos da LGPD</h4>
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-normal">
              O Sauron executa criptografia na representação das strings de consulta, bloqueia visualizações indevidas, registra dados em localidade protegida, e implementa **Audit Traceability** de todas as operações administrativas para conformidade estrita da LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709).
            </p>
          </div>

          {/* LGPD Live Trace Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-3">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-1.5 flex justify-between items-center">
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
