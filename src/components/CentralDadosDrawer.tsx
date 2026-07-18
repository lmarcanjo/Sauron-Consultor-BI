import React, { useEffect } from "react";
import { 
  X, Database, Layers, ShieldCheck, RefreshCw, Upload, Network, 
  HelpCircle, Settings, CheckCircle, AlertTriangle, FileText, Globe
} from "lucide-react";
import { DatabaseConnector } from "./DatabaseConnector";
import { LancamentoFinanceiro } from "../types";

interface CentralDadosDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeIndustryTemplateId: string;
  onChangeIndustryTemplateId: (val: string) => void;
  availableTemplates: Array<{ id: string; name: string }>;
  onTriggerFileSelect: () => void;
  nomeFonte: string;
  isSyncing: boolean;
  onSyncDatabase: () => void;
  isVpnSimulated: boolean;
  spreadsheetMetadata: {
    fileName: string;
    sheetNames: string[];
    rowCount: number;
    colCount: number;
    importedAt: string;
  } | null;
  currentUser: any;
  dbValidationMsg: string;
  onDatabaseDataLoaded: (data: LancamentoFinanceiro[], sourceName: string) => void;
}

export const CentralDadosDrawer: React.FC<CentralDadosDrawerProps> = ({
  isOpen,
  onClose,
  activeIndustryTemplateId,
  onChangeIndustryTemplateId,
  availableTemplates,
  onTriggerFileSelect,
  nomeFonte,
  isSyncing,
  onSyncDatabase,
  isVpnSimulated,
  spreadsheetMetadata,
  currentUser,
  dbValidationMsg,
  onDatabaseDataLoaded
}) => {
  // Handle Escape key to close drawer (WCAG 2.1 modal accessibility)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="central-dados-drawer-title"
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-55 flex flex-col transition-all duration-300 animate-slide-in overflow-hidden"
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500" aria-hidden="true">
              <Database size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 id="central-dados-drawer-title" className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider">
                Biblioteca de Planilhas
              </h2>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">Importe, acompanhe e confirme suas fontes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Fechar Biblioteca de Planilhas"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
          
          {/* SECTION 1: FONTE ATIVA & MODO */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-450 block border-b border-slate-100 dark:border-slate-800 pb-1">
              1. Fonte ativa
            </span>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Status:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${spreadsheetMetadata ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"}`}>
                  {spreadsheetMetadata ? "Dados ativos" : "Nenhuma fonte de dados ativa."}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-[10px] font-bold text-slate-500">
                {spreadsheetMetadata
                  ? "Planilha conectada e pronta para confirmação."
                  : "Nenhuma fonte de dados ativa."}
              </div>

              <div className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                <p><strong>Origem Atual:</strong> {spreadsheetMetadata ? nomeFonte : "Nenhuma fonte de dados ativa."}</p>
                {spreadsheetMetadata && (
                  <p className="bg-emerald-500/5 p-2 rounded text-emerald-500 font-mono text-[9px] leading-normal border border-emerald-500/10 mt-1">
                    {spreadsheetMetadata.fileName} <br />
                    • Abas: {spreadsheetMetadata.sheetNames.join(", ")} <br />
                    • {spreadsheetMetadata.rowCount} linhas • {spreadsheetMetadata.colCount} colunas
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CONFIGURAÇÃO DE SEGMENTO */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-450 block border-b border-slate-100 dark:border-slate-800 pb-1">
              2. Contexto do cliente
            </span>

            <div className="space-y-1.5">
              <label htmlFor="contexto-negocio-select" className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">Contexto de negócio:</label>
              <select
                id="contexto-negocio-select"
                value={activeIndustryTemplateId}
                onChange={(e) => onChangeIndustryTemplateId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wide"
              >
                {availableTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal mt-1">
                Usado apenas quando o contexto não puder ser identificado automaticamente.
              </p>
            </div>
          </div>

          {/* SECTION 3: IMPORTAÇÃO E BANCO */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-450 block border-b border-slate-100 dark:border-slate-800 pb-1">
              3. Adicionar dados
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Import Spreadsheet Button */}
              {["Super Admin", "Consultant Admin", "Consultant", "consultor"].includes(currentUser?.role || "") ? (
                <button
                  onClick={onTriggerFileSelect}
                  data-testid="btn-drawer-import"
                  className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 hover:border-blue-500 hover:dark:border-blue-400 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer space-y-2 text-center h-24"
                >
                  <Upload size={18} className="text-blue-500" />
                  <span className="font-extrabold text-[10px] uppercase tracking-wide">Importar planilha</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-center space-y-2 text-slate-600 dark:text-slate-400 h-24 opacity-60">
                  <Upload size={18} />
                  <span className="font-bold text-[9px] uppercase">Acesso somente leitura</span>
                </div>
              )}

              {/* Sync Database Button */}
              <button
                onClick={onSyncDatabase}
                disabled={isSyncing}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 hover:border-sky-500 hover:dark:border-sky-400 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer space-y-2 text-center h-24 disabled:opacity-50"
              >
                <RefreshCw size={18} className={`text-sky-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="font-extrabold text-[10px] uppercase tracking-wide">Atualizar conexão</span>
              </button>
            </div>

            {/* Conexões continuam disponíveis, mas não dominam o primeiro passo. */}
            <div className="pt-2">
              <DatabaseConnector 
                onDataLoaded={onDatabaseDataLoaded} 
                currentSource={nomeFonte} 
              />
            </div>
          </div>

          {/* SECTION 4: VPN GATEWAY & APIS */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-450 block border-b border-slate-100 dark:border-slate-800 pb-1">
              4. Integrações avançadas
            </span>

            <div className="space-y-2">
              {/* VPN status */}
              <div className="flex items-center justify-between p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <Network size={14} className={isVpnSimulated ? "text-indigo-500" : "text-slate-550 dark:text-slate-400"} />
                  <div>
                  <p className="font-bold">Conexão segura</p>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400">Integração de rede</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isVpnSimulated ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {isVpnSimulated ? "ATIVO" : "INATIVO"}
                </span>
              </div>

              {/* APIs feed */}
              <div className="flex items-center justify-between p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-emerald-500" />
                  <div>
                    <p className="font-bold">Integrações externas</p>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400">Configuração pendente</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                  PENDENTE
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 5: GOVERNANÇA LGPD */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-450 block border-b border-slate-100 dark:border-slate-800 pb-1">
              5. Segurança & Governança LGPD
            </span>

            <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 flex items-start gap-2.5 text-[10px] leading-relaxed text-slate-500">
              <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
              <p className="font-bold text-slate-700 dark:text-slate-350">Governança de Dados</p>
              <p className="mt-0.5">Ao conectar uma fonte real, o Sauron mantém os dados originais preservados e registra a origem usada nas análises.</p>
              </div>
            </div>
          </div>

          {/* SECTION 6: VALIDAÇÃO DO BANCO & LOGS */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-450 block border-b border-slate-100 dark:border-slate-800 pb-1">
              6. Saúde da fonte
            </span>

            <div className="p-3 border border-emerald-150 dark:border-emerald-900 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/20 flex items-start gap-2 text-[10px]">
              <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-350">Status de Integridade</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-0.5">{dbValidationMsg}</p>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0 text-center text-[9px] font-mono text-slate-600 dark:text-slate-400">
          SAURON OS • INTELIGÊNCIA PARA DECISÕES
        </div>

      </div>
    </>
  );
};
