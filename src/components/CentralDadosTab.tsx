import React, { useState } from "react";
import { Database, ShieldAlert, Cpu, Layers, RefreshCw, AlertTriangle, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { LancamentoFinanceiro } from "../types";
import { DatabaseConnector } from "./DatabaseConnector";

interface CentralDadosTabProps {
  dataOrigem: LancamentoFinanceiro[];
  onDataLoaded: (data: LancamentoFinanceiro[], sourceName: string) => void;
  currentSource: string;
  camposAusentes: string[];
}

export const CentralDadosTab: React.FC<CentralDadosTabProps> = ({
  dataOrigem,
  onDataLoaded,
  currentSource,
  camposAusentes
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"visualizar" | "conectar">("visualizar");

  // Inconsistencies analysis
  const registrosComLucroInconsistente = dataOrigem.filter(
    (d) => Math.abs((d.Receita - d.Custo - d.Despesa) - d.Lucro) > 2
  );
  
  const registrosComMargemInconsistente = dataOrigem.filter(
    (d) => d.Receita > 0 && Math.abs((d.Lucro / d.Receita) * 100 - d.Margem) > 1
  );

  const totalInconsistencias = registrosComLucroInconsistente.length + registrosComMargemInconsistente.length;

  return (
    <div className="space-y-4 font-sans text-slate-850 dark:text-slate-150 animate-fade-in" id="central-dados-container">
      {/* Upper header summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded">
              <Database size={16} />
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider">Central de Fontes e Carga de Dados (Sauron Gateway DB)</h2>
          </div>
          <p className="text-slate-400 text-[10px] mt-1 pr-4 max-w-2xl leading-relaxed">
            Consolide dados de múltiplos CNPJs, marcas e filiais. Sauron conecta-se localmente ou via túnel privado VPN diretamente a bancos legados sem alterar informações originais.
          </p>
        </div>
        <div className="bg-slate-800/80 border border-slate-705 p-3 rounded-xl min-w-[200px]">
          <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-widest">Fonte Ativa Atualmente</span>
          <p className="text-xs font-bold text-blue-400 mt-1 truncate max-w-[220px]">{currentSource}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-705 text-[10px] font-mono">
            <span className="text-slate-400">Total Registros:</span>
            <span className="text-emerald-400 font-bold">{dataOrigem.length}</span>
          </div>
        </div>
      </div>

      {/* Selector subtabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-0">
        <button
          onClick={() => setActiveSubTab("visualizar")}
          className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeSubTab === "visualizar"
              ? "border-blue-600 text-blue-650 dark:text-blue-405 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Visão Geral da Origem e Qualidade dos Dados
        </button>
        <button
          onClick={() => setActiveSubTab("conectar")}
          className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeSubTab === "conectar"
              ? "border-blue-600 text-blue-650 dark:text-blue-405 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-705 dark:hover:text-slate-300"
          }`}
        >
          Conectar Novo Banco (Postgres, MySQL, CSV, APIs...)
        </button>
      </div>

      {activeSubTab === "conectar" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <DatabaseConnector onDataLoaded={onDataLoaded} currentSource={currentSource} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main audit KPI card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm md:col-span-2 space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cpu size={14} className="text-blue-500" />
                <span>Rastreabilidade e Integridade do Dataset Corporativo</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Qualidade Geral</span>
                <p className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {totalInconsistencias === 0 ? "100%" : `${Math.max(0, Math.round(100 - (totalInconsistencias / dataOrigem.length) * 100))}%`}
                </p>
                <div className="text-[9px] text-slate-405 mt-0.5">Métrica de ausência de erros matemáticos</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Campos Disponíveis</span>
                <p className="text-lg font-mono font-black text-blue-600 dark:text-blue-400 mt-1">
                  {12 - (camposAusentes?.length || 0)} <span className="text-xs text-slate-400">/ 12</span>
                </p>
                <div className="text-[9px] text-slate-405 mt-0.5">Colunas identificadas e mapeadas</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Erros Estruturais</span>
                <p className={`text-lg font-mono font-black mt-1 ${totalInconsistencias > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {totalInconsistencias}
                </p>
                <div className="text-[9px] text-slate-405 mt-0.5">Sistemas e contas com valores conflitantes</div>
              </div>
            </div>

            {/* Inconsistencies detailed panel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Discrepâncias Encontradas (Auditáveis)</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">Última leitura: Recorrente</span>
              </div>

              {totalInconsistencias === 0 ? (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 p-4 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                  <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-450">Dataset com 100% de integridade estrutural!</p>
                  <p className="text-[10px] text-slate-500">Nenhum erro de arredondamento, cálculo de margens ou contas de lucros foi detectado pelas engines do Sauron.</p>
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden max-h-[220px] overflow-y-auto">
                  {registrosComLucroInconsistente.slice(0, 10).map((reg, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs bg-amber-500/5 dark:bg-amber-400/5 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={11} className="text-amber-500" />
                          <span className="font-bold text-slate-700 dark:text-white">{reg.Empresa} ({reg.Mês})</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">Modulo: {reg.Razão} | Conta: {reg.Categoria}</p>
                      </div>
                      <div className="text-right font-mono text-[10px]">
                        <span className="text-slate-400">Declarado: R$ {reg.Lucro.toLocaleString()}</span>
                        <div className="text-amber-600 dark:text-amber-400 font-bold">Real calculado: R$ {(reg.Receita - reg.Custo - reg.Despesa).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar info */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm text-xs space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Canais de Integração Habilitados</h4>
              
              <div className="space-y-2">
                {[
                  { name: "Banco Relacional SQL (Prod)", type: "Postgres / MySQL", encrypted: true },
                  { name: "Banco de dados NoSQL", type: "MongoDB Atlas Cloud", encrypted: true },
                  { name: "APIs Públicas de Fechamento", type: "REST API Endpoint", encrypted: true },
                  { name: "Planilhas de Trabalho (Tutor)", type: "CSV / Excel Loader", encrypted: false },
                  { name: "Google Sheets Privado", type: "OAuth Workspace Integration", encrypted: true }
                ].map((channel, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-805">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-white leading-tight">{channel.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{channel.type}</p>
                    </div>
                    {channel.encrypted ? (
                      <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono text-[8px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                        <ShieldCheck size={9} />
                        SECURE
                      </span>
                    ) : (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[8px] px-1.5 py-0.5 rounded">
                        OFFLINE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-850 border border-blue-200/40 dark:border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="text-blue-500" />
                <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">Garantia OS Compartilhada</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Nossos conectores utilizam pooling de conexões de leitura de forma assíncrona. Nenhum comando de alteração (INSERT, UPDATE, DELETE) é executado na origem do cliente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
