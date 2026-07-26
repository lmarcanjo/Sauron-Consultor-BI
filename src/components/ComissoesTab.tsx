import React from "react";
import { Sparkles, Sliders, Volume2, Save, Trash2, Shield, Play } from "lucide-react";
import { MetricasConsolidadas } from "../types";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";

interface ComissoesTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (v: number) => string;
  calculatedCommissions: {
    regraAtiva: string;
    totalGeralComissao: number;
    detailsByCnpj: any[];
    detalhePorConta: any[];
  };
  segmentoCliente: string;
  setSegmentoCliente: (v: string) => void;
  observacaoGerente: string;
  setObservacaoGerente: (v: string) => void;
  faturamentoOffset: number;
  setFaturamentoOffset: (v: number) => void;
  despesaOffset: number;
  setDespesaOffset: (v: number) => void;
  narrarFeedback: boolean;
  setNarrarFeedback: (v: boolean) => void;
  comissaoFormula: string;
  setComissaoFormula: (v: string) => void;
  percentualComissaoBase: number;
  setPercentualComissaoBase: (v: number) => void;
  taxaComissaoAcessorios: number;
  setTaxaComissaoAcessorios: (v: number) => void;
  taxaComissaoItens: number;
  setTaxaComissaoItens: (v: number) => void;
  triggerSystemBackup: () => void;
  userRole?: "consultor" | "diretor" | "gerente" | "analista" | string;
}

export const ComissoesTab: React.FC<ComissoesTabProps> = ({
  metrics,
  formatCurrency,
  calculatedCommissions,
  segmentoCliente,
  setSegmentoCliente,
  observacaoGerente,
  setObservacaoGerente,
  faturamentoOffset,
  setFaturamentoOffset,
  despesaOffset,
  setDespesaOffset,
  narrarFeedback,
  setNarrarFeedback,
  comissaoFormula,
  setComissaoFormula,
  percentualComissaoBase,
  setPercentualComissaoBase,
  taxaComissaoAcessorios,
  setTaxaComissaoAcessorios,
  taxaComissaoItens,
  setTaxaComissaoItens,
  triggerSystemBackup,
  userRole = "consultor"
}) => {
  const hasRealDataset = !!activeDatasetStore.getActiveDataset();
  const isAnalista = userRole === "analista";
  const isGerente = userRole === "gerente";
  
  // Only consultor or diretor may edit calculation rules
  const canEditComissionsFormula = userRole === "consultor" || userRole === "diretor";
  
  // Only consultor, diretor or gerente may edit tactical offsets
  const canEditOffsets = userRole === "consultor" || userRole === "diretor" || userRole === "gerente";

  if (!hasRealDataset) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <Sparkles className="text-slate-400 w-12 h-12" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Nenhuma fonte de dados ativa.</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Importe uma planilha real para configurar e calcular comissões.
        </p>
      </div>
    );
  }

  if (hasRealDataset) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <Sparkles className="text-emerald-500 w-12 h-12" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Configure vendedor, venda, lucro, comissão e regra remuneratória antes de calcular comissões reais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-150">
      
      {/* Upper bar: Save State inside isolated system */}
      <div className="bg-slate-900 border border-slate-950 p-3 rounded-xl flex items-center justify-between text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400" />
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-blue-300">Central de Governança Contábil &amp; Remuneração</h4>
            <p className="text-[10px] text-slate-400">Ajustar taxas, registrar diretrizes do gerente e simular desvios em tempo real de forma blindada</p>
          </div>
        </div>
        {!isAnalista ? (
          <button
            onClick={triggerSystemBackup}
            className="px-3.5 py-1 text-[10px] bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-750 font-black uppercase text-white tracking-widest rounded-lg cursor-pointer transition shadow"
          >
            Gravar no Banco Sistema
          </button>
        ) : (
          <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 font-bold rounded-lg uppercase tracking-wider">
            Sessão Somente Leitura (Analista)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left col: Off-memory dynamic adjustments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Sliders size={14} className="text-blue-500" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-white">Filtros Táticos &amp; Desvios (Modo Gerente)</h4>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest block">Segmento de Negócio do Cliente:</label>
            <select
              value={segmentoCliente}
              onChange={(e) => setSegmentoCliente(e.target.value)}
              disabled={!canEditOffsets}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-3 py-1.5 rounded focus:outline-none focus:border-blue-500 font-sans cursor-pointer disabled:opacity-60"
            >
              <option value="Operação Padrão">Operação Padrão</option>
              <option value="Operação Premium">Operação Premium</option>
              <option value="Distribuição de Produtos">Distribuição de Produtos</option>
              <option value="Grupo Multunidade">Grupo Multiunidade</option>
              <option value="Serviços Especializados">Serviços Especializados</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest block">Diretriz Personalizada (Gerente):</label>
            <textarea
              value={observacaoGerente}
              onChange={(e) => setObservacaoGerente(e.target.value)}
              disabled={!canEditOffsets}
              placeholder="Digite conselhos gerenciais e notas para o cliente. Essas informações serão integradas no resumo de IA..."
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-3 py-1.5 rounded resize-none focus:outline-none focus:border-blue-500 font-sans disabled:opacity-60"
            />
          </div>

          <div className="bg-amber-50/40 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/30 p-3 rounded-lg space-y-2">
            <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest block">⚠️ Ajustes Manuais Temporários de Balanço (Sem interferir no Banco)</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Desvio Faturamento:</span>
                <input
                  type="number"
                  step="10000"
                  value={faturamentoOffset}
                  onChange={(e) => setFaturamentoOffset(Number(e.target.value))}
                  disabled={!canEditOffsets}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1 rounded disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Desvio Despesas:</span>
                <input
                  type="number"
                  step="500"
                  value={despesaOffset}
                  onChange={(e) => setDespesaOffset(Number(e.target.value))}
                  disabled={!canEditOffsets}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1 rounded disabled:opacity-60"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-[9px] text-amber-700 dark:text-amber-500 pt-1">
              <span>Mecanismo offline de modelagem de margem em tempo real</span>
              {canEditOffsets && (
                <button
                  onClick={() => {
                    setFaturamentoOffset(0);
                    setDespesaOffset(0);
                  }}
                  className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 text-amber-800 dark:text-amber-300 rounded font-bold uppercase text-[8px] transition cursor-pointer"
                >
                  Resetar
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="checkbox"
              id="ttsComissoes"
              checked={narrarFeedback}
              onChange={(e) => setNarrarFeedback(e.target.checked)}
              disabled={isAnalista}
              className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer disabled:opacity-60"
            />
            <label htmlFor="ttsComissoes" className="text-[11px] font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none flex items-center gap-1">
              <Volume2 size={13} className="text-blue-500 shrink-0" />
              <span>Apresentar Relatório de IA Narrado por Voz por Padrão</span>
            </label>
          </div>
        </div>

        {/* Right col: Real-time dynamic commissions setup */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-white">Cálculo e Taxas de Comissionamento</span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold px-1.5 py-0.5 rounded">Fórmula Ativa</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Fórmula de Cálculo:</span>
              <select
                value={comissaoFormula}
                onChange={(e) => setComissaoFormula(e.target.value)}
                disabled={!canEditComissionsFormula}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1.5 rounded focus:outline-none focus:border-blue-500 font-sans cursor-pointer disabled:opacity-60"
              >
                <option value="simplificado">Geral Simplificado (Rate Único das Vendas)</option>
                <option value="acessorios_vendas">Regra por Categoria Comercial</option>
                <option value="maquinas_agricolas">Regra por Linhas de Produto e Serviço</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 block">Comissão Base:</span>
                <input
                  type="number"
                  step="0.1"
                  value={percentualComissaoBase}
                  onChange={(e) => setPercentualComissaoBase(Number(e.target.value))}
                  disabled={!canEditComissionsFormula}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1 rounded disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 block">Categoria Rate:</span>
                <input
                  type="number"
                  step="0.5"
                  value={taxaComissaoAcessorios}
                  onChange={(e) => setTaxaComissaoAcessorios(Number(e.target.value))}
                  disabled={!canEditComissionsFormula}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1 rounded disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 block">Itens Rate:</span>
                <input
                  type="number"
                  step="0.5"
                  value={taxaComissaoItens}
                  onChange={(e) => setTaxaComissaoItens(Number(e.target.value))}
                  disabled={!canEditComissionsFormula}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white px-2 py-1 rounded disabled:opacity-60"
                />
              </div>
            </div>
            {!canEditComissionsFormula && (
              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">As taxas de comissionamento são configuradas exclusivamente pelo Consultor ou Diretor.</p>
            )}
          </div>

          <div className="mt-4 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Payable (Folha de Comissão Estimada):</span>
            <p className="text-xl font-mono font-black text-blue-600 dark:text-blue-400 mt-0.5">R$ {calculatedCommissions.totalGeralComissao.toLocaleString("pt-BR")}</p>
            <p className="text-[9px] text-slate-400 mt-1">Estimativa de repasse calculada sob regras da comissão ativa.</p>
          </div>
        </div>
      </div>

      {/* Corporate Unit Breakdown List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2.5">Repasse de Comissionamento Detalhado por Empresa</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {calculatedCommissions.detailsByCnpj.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/60">
              <div>
                <p className="font-extrabold text-slate-705 dark:text-slate-100">{item.empresa}</p>
                <p className="text-[9px] text-slate-400 font-mono font-bold">CNPJ: {item.cnpj}</p>
              </div>
              <div className="text-right font-mono">
                <p className="font-bold text-blue-600 dark:text-blue-400">Comissão: R$ {item.comissao.toLocaleString("pt-BR")}</p>
                <p className="text-[9px] text-slate-450">Fatur.: R$ {Math.round(item.receita / 1000)}k</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
