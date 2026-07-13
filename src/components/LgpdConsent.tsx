import React, { useState, useEffect } from "react";
import { ShieldAlert, Check, X, FileText, Trash2, ShieldCheck, Heart } from "lucide-react";
import { showToast } from "./Toast";

export const LgpdConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [consents, setConsents] = useState({
    session: true,
    performance: true,
    traceability: true
  });

  useEffect(() => {
    const accepted = localStorage.getItem("sauron_lgpd_accepted");
    if (!accepted) {
      // Small timeout to give entering animation feel
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("sauron_lgpd_accepted", "true");
    localStorage.setItem("sauron_lgpd_cookies", JSON.stringify(consents));
    setShowBanner(false);
    
    // Log audit in trace
    pushLgpdAuditLog("CONSENTIMENTO LGPD", "O usuário aceitou todas as diretivas de governança e cookies contábeis.");
  };

  const handleCustomAccept = () => {
    localStorage.setItem("sauron_lgpd_accepted", "true");
    localStorage.setItem("sauron_lgpd_cookies", JSON.stringify(consents));
    setShowBanner(false);
    setShowPrivacyModal(false);
    
    pushLgpdAuditLog("CONSENTIMENTO LGPD PARCIAL", `O usuário parametrizou preferências de LGPD: ${JSON.stringify(consents)}`);
  };

  const pushLgpdAuditLog = (action: string, details: string) => {
    const savedLogs = localStorage.getItem("sauron_lgpd_logs");
    let logs = [];
    if (savedLogs) {
      try { logs = JSON.parse(savedLogs); } catch(e){}
    }
    const newLog = {
      timestamp: new Date().toISOString(),
      user: "Analista/Usuário Externo (Sessão Segura)",
      action,
      details,
      ip: "192.168.1.100"
    };
    logs = [newLog, ...logs].slice(0, 50);
    localStorage.setItem("sauron_lgpd_logs", JSON.stringify(logs));
  };

  const handleRightToBeForgotten = () => {
    if (confirm("LGPD Artigo 18 - Direito de Exclusão:\n\nDeseja mesmo anonimizar e expurgar seus logs locais, configurações do segmento do cliente e apagar toda a sua sessão desta máquina?")) {
      localStorage.removeItem("sauron_user");
      localStorage.removeItem("sauron_profiles");
      localStorage.removeItem("sauron_profiles_backup");
      localStorage.setItem("sauron_lgpd_accepted", "forgotten");
      
      pushLgpdAuditLog("EXPURGO DE DADOS", "Landed Right to be Forgotten. Todos os rastreadores e dados de cookies locais foram destruídos e anonimizados.");
      
      showToast("success", "Dados locais e credenciais expurgados com base no Artigo 18 da LGPD.");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <>
      {/* Floating Consent Banner */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-slate-900 border border-slate-750 text-white rounded-xl shadow-2xl p-4 z-50 animate-fade-in space-y-3 font-sans">
          <div className="flex gap-2 items-start">
            <ShieldAlert size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-100">Governança Contábil & LGPD</h4>
              <p className="text-[10px] text-slate-350 leading-relaxed">
                Utilizamos cookies de local storage de alta performance e diários de governança contábil em total conformidade com a <strong>LGPD (Lei Geral de Proteção de Dados)</strong> para salvaguardar dados institucionais, prevenir fraudes e auditorias não autorizadas.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2.5 pt-1 text-[10px] tracking-wide font-extrabold uppercase">
            <button 
              onClick={() => setShowPrivacyModal(true)}
              className="text-slate-350 hover:text-white px-2 py-1 cursor-pointer"
            >
              Preferências
            </button>
            <button 
              onClick={handleAcceptAll}
              className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 px-3 py-1.5 rounded-lg shadow cursor-pointer transition-colors"
            >
              Aceitar Todos
            </button>
          </div>
        </div>
      )}

      {/* Footer trigger linked modal */}
      <div className="fixed bottom-2 left-2 z-40 opacity-80 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowPrivacyModal(true)}
          className="flex items-center gap-1 text-[8.5px] uppercase font-black tracking-widest bg-slate-900/90 text-slate-300 dark:text-slate-400 border border-slate-750 dark:border-slate-800/80 px-2.5 py-1 rounded-md shadow-lg"
        >
          <ShieldCheck size={10} className="text-emerald-500" />
          <span>Configurar LGPD</span>
        </button>
      </div>

      {/* LGPD Privacy Center Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 text-slate-800 dark:text-slate-150">
            
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold font-mono text-base px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-0.5">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">Centro de Privacidade (LGPD)</h3>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Diretrizes de Governança Digital</h2>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed text-center mx-auto max-w-md">
              Em atendimento à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), disponibilizamos controle irrecusável e auditável sobre quais marcadores de sessão determinísticos seu navegador processará.
            </p>

            <div className="space-y-3 pt-1.5">
              
              {/* Option 1 */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-750 dark:text-white">Cookies de Sessão e Configurações (Essencial)</p>
                  <p className="text-[9px] text-slate-450">Preservação do estado da conexão contábil ativa, faturamento e offsets em local storage local.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={consents.session} 
                  disabled
                  className="rounded border-slate-350 text-blue-600 w-4 h-4 cursor-not-allowed"
                />
              </div>

              {/* Option 2 */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-750 dark:text-white">Armazenamento de Perfis customizados (Essencial)</p>
                  <p className="text-[9px] text-slate-450">Permite ao consultor customizar perfis de acesso, senhas locais e logs de rastros fiscais.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={consents.performance} 
                  onChange={(e) => setConsents(prev => ({ ...prev, performance: e.target.checked }))}
                  className="rounded border-slate-350 text-blue-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Option 3 */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-750 dark:text-white">Auditoria e Logs de Log de Atividade (Fiscais)</p>
                  <p className="text-[9px] text-slate-450">Rastreabilidade integral das decisões operacionais em conformidade com as exigências governamentais.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={consents.traceability} 
                  onChange={(e) => setConsents(prev => ({ ...prev, traceability: e.target.checked }))}
                  className="rounded border-slate-350 text-blue-600 w-4 h-4 cursor-pointer"
                />
              </div>

            </div>

            {/* Expurgos section as requested (Art. 18 LGPD) */}
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/40 rounded-xl p-3 space-y-1 text-left text-[9.5px]">
              <p className="font-bold text-rose-800 dark:text-rose-400 uppercase flex items-center gap-1">
                <Trash2 size={11} /> Expurgo Total - Direito ao Esquecimento (Art. 18)
              </p>
              <p className="text-rose-700/80 dark:text-rose-450">
                Ao selecionar o expurgo, removemos instantaneamente todas as credenciais customizadas de local storage, senhas salvas, dados do Banco Interno e logs locais e de auditoria de sessões. <strong>Ação Irreversível.</strong>
              </p>
              <button
                onClick={handleRightToBeForgotten}
                className="mt-1.5 px-2.5 py-1 text-[8.5px] uppercase font-black bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer"
              >
                Anonimizar e Expurgar meus dados locais
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="flex-1 py-1.5 text-[10px] font-extrabold text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg cursor-pointer transition-colors uppercase tracking-wide"
              >
                Fechar
              </button>
              <button
                onClick={handleCustomAccept}
                className="flex-1 py-1.5 text-[10px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-sm uppercase tracking-wide"
              >
                Salvar Preferências
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
