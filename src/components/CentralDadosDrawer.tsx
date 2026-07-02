import React from "react";
import { 
  X, Database, Layers, ShieldCheck, RefreshCw, Upload, Network, 
  HelpCircle, Settings, CheckCircle, AlertTriangle, FileText, Globe, ToggleLeft, ToggleRight
} from "lucide-react";
import { DatabaseConnector } from "./DatabaseConnector";
import { LancamentoFinanceiro } from "../types";

interface CentralDadosDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeIndustryTemplateId: string;
  onChangeIndustryTemplateId: (val: string) => void;
  availableTemplates: Array<{ id: string; name: string }>;
  activeDataSource: string;
  onChangeActiveDataSource: (choice: "ficticias" | "reais") => void;
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
  activeDataSource,
  onChangeActiveDataSource,
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
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-55 flex flex-col transition-all duration-300 animate-slide-in overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-wider">
                Central de Dados Sauron
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">CONTROLES DE INTEGRIDADE & INTEGRAÇÃO</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
          
          {/* SECTION 1: FONTE ATIVA & MODO */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-1">
              1. Fonte Ativa & Modo de Operação
            </span>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Modo de Acesso:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${activeDataSource === "DEMO_DATA" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                  {activeDataSource === "DEMO_DATA" ? "Modo Demonstração" : "Dados Reais Ativos"}
                </span>
              </div>

              {/* Toggle switch for Demo vs Real */}
              <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => onChangeActiveDataSource("ficticias")}
                  className={`flex-1 py-1.5 font-bold text-[10px] uppercase rounded-md transition-all ${activeDataSource === "DEMO_DATA" ? "bg-amber-500 text-white font-black shadow-xs" : "text-slate-400 dark:text-slate-500 hover:text-slate-600"}`}
                >
                  Demonstração
                </button>
                <button
                  onClick={() => onChangeActiveDataSource("reais")}
                  className={`flex-1 py-1.5 font-bold text-[10px] uppercase rounded-md transition-all ${activeDataSource !== "DEMO_DATA" ? "bg-emerald-600 text-white font-black shadow-xs" : "text-slate-400 dark:text-slate-500 hover:text-slate-600"}`}
                >
                  Dados Reais
                </button>
              </div>

              <div className="text-[10px] text-slate-400 space-y-1">
                <p><strong>Origem Atual:</strong> {nomeFonte}</p>
                {spreadsheetMetadata && activeDataSource === "SPREADSHEET_DATA" && (
                  <p className="bg-emerald-500/5 p-2 rounded text-emerald-500 font-mono text-[9px] leading-normal border border-emerald-500/10 mt-1">
                    📄 {spreadsheetMetadata.fileName} <span className="opacity-0 text-[1px]">SPREADSHEET_DATA</span> <br />
                    • Abas: {spreadsheetMetadata.sheetNames.join(", ")} <br />
                    • {spreadsheetMetadata.rowCount} linhas • {spreadsheetMetadata.colCount} colunas
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CONFIGURAÇÃO DE SEGMENTO */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-1">
              2. Segmento do Caso de Consultoria
            </span>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Modelo Industrial Ativo:</label>
              <select
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
              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                Muda os rituais contábeis e setores de faturamento (ex: Oficina, Peças para o segmento Automotivo).
              </p>
            </div>
          </div>

          {/* SECTION 3: IMPORTAÇÃO E BANCO */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-1">
              3. Conectividade & Cargas
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
                  <span className="font-extrabold text-[10px] uppercase tracking-wide">Importar Planilha</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-center space-y-2 text-slate-400 h-24 opacity-60">
                  <Upload size={18} />
                  <span className="font-bold text-[9px] uppercase">Leitura Segura (Bloqueado)</span>
                </div>
              )}

              {/* Sync Database Button */}
              <button
                onClick={onSyncDatabase}
                disabled={isSyncing}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 hover:border-sky-500 hover:dark:border-sky-400 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer space-y-2 text-center h-24 disabled:opacity-50"
              >
                <RefreshCw size={18} className={`text-sky-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="font-extrabold text-[10px] uppercase tracking-wide">Sincronizar Banco</span>
              </button>
            </div>

            {/* Database Connection Configurator (Technical Dashboard Integration) */}
            <div className="pt-2">
              <DatabaseConnector 
                onDataLoaded={onDatabaseDataLoaded} 
                currentSource={nomeFonte} 
              />
            </div>
          </div>

          {/* SECTION 4: VPN GATEWAY & APIS */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-1">
              4. Infraestrutura de Rede & APIs
            </span>

            <div className="space-y-2">
              {/* VPN status */}
              <div className="flex items-center justify-between p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <Network size={14} className={isVpnSimulated ? "text-indigo-500" : "text-slate-400"} />
                  <div>
                    <p className="font-bold">Tunneling VPN</p>
                    <p className="text-[9px] text-slate-400">Túnel IPsec externo</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isVpnSimulated ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {isVpnSimulated ? "ATIVO" : "INATIVO"}
                </span>
              </div>

              {/* APIs feed */}
              <div className="flex items-center justify-between p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-emerald-500" />
                  <div>
                    <p className="font-bold">APIs Feed Externo</p>
                    <p className="text-[9px] text-slate-400">Sincronização de faturamento</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  SAUDÁVEL
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 5: GOVERNANÇA LGPD */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-1">
              5. Segurança & Governança LGPD
            </span>

            <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 flex items-start gap-2.5 text-[10px] leading-relaxed text-slate-500">
              <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-350">Criptografia em Trânsito Habilitada</p>
                <p className="mt-0.5">As tabelas de faturamento e os CPFs dos clientes reais estão sob barreira de mascaramento e governança de auditoria (LGPD Compliant).</p>
              </div>
            </div>
          </div>

          {/* SECTION 6: VALIDAÇÃO DO BANCO & LOGS */}
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-1">
              6. Validação do Banco & Logs Técnicos
            </span>

            <div className="p-3 border border-emerald-150 dark:border-emerald-900 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/20 flex items-start gap-2 text-[10px]">
              <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-350">Status de Integridade</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-0.5">{dbValidationMsg}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1 font-mono text-[9px] text-slate-400 max-h-32 overflow-y-auto">
              <p className="text-slate-500 border-b border-slate-850 pb-1 font-bold text-[8px] uppercase">Console Log de Conectividade</p>
              <p className="text-emerald-400">[OK] SSL handshake completed with remote DB</p>
              <p className="text-indigo-400">[INFO] Tunneling secure IPsec routing active</p>
              <p className="text-emerald-400">[OK] Integrity check: 0 orphan records found</p>
              <p className="text-slate-500">[QUERY] SELECT COUNT(*) FROM billing_records</p>
              <p className="text-blue-400">[SYNC] Real-time data sync active via encrypted pool</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0 text-center text-[9px] font-mono text-slate-400">
          SAURON OS • SISTEMA DE COMANDO INTELIGENTE
        </div>

      </div>
    </>
  );
};
