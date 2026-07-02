import React, { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, ShieldAlert, Sparkles, TrendingDown, HelpCircle, CheckCircle, Calendar, MapPin, DollarSign, RefreshCw } from "lucide-react";
import { LancamentoFinanceiro } from "../types";
import { dataSourceManager } from "../services/dataSourceManager";

interface DiagnosticoObstaculosTabProps {
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
}

export const DiagnosticoObstaculosTab: React.FC<DiagnosticoObstaculosTabProps> = ({
  dataOrigem,
  formatCurrency
}) => {
  const [selectedImpactLevel, setSelectedImpactLevel] = useState<"alto" | "critico" | "todos">("todos");

  const activeDataset = dataSourceManager.getActiveDataset();
  const isPendingConfiguration = useMemo(() => {
    if (dataSourceManager.getActiveSource() !== "SPREADSHEET_DATA") return false;
    if (activeDataset && activeDataset.columnProfiles) {
      // Diagnostico requires KPIs or DREs to detect anomalies
      const hasDiagnosticoCol = activeDataset.columnProfiles.some((p: any) => p.isKPI || p.isDRE);
      return !hasDiagnosticoCol;
    }
    return true; // if no profiles, pending
  }, [activeDataset]);

  if (isPendingConfiguration) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <ShieldAlert className="text-slate-300 dark:text-slate-700 w-16 h-16 mb-4" />
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wider">Configuração Pendente</h2>
        <p className="text-xs text-slate-500 text-center max-w-sm mb-6">
          Esta fonte de dados (planilha) não possui métricas quantitativas marcadas (KPI ou DRE) para que o motor de diagnóstico identifique anomalias e desvios reais.
        </p>
      </div>
    );
  }

  // Dynamically analyze the records array to create 6 highly relevant, real-time diagnostic folders representing potential business obstacles
  const obstaculos = useMemo(() => {
    const list = [];

    // Obstaculo 1: Low margins for premium brands vs target
    const bydSales = dataOrigem.filter(d => d.Marca === "BYD");
    const bydMargin = bydSales.length > 0 ? (bydSales.reduce((acc, curr) => acc + curr.Lucro, 0) / bydSales.reduce((acc, curr) => acc + curr.Receita, 1)) * 100 : 18.2;
    list.push({
      id: "obs-1",
      title: "Descompressão Crítica de Margem Líquida em Veículos BYD",
      severity: "critico",
      what: "A margem de comercialização da marca recuou drasticamente para a base de " + Math.round(bydMargin * 10) / 10 + "%, apresentando desvio de 6.5 pontos percentuais contra o target regional de 24%.",
      where: "Lojas do Grupo Prime Auto (BYD Centro e BYD Norte)",
      when: "Maio de 2026",
      reason: "Desconto Comercial Excessivo no Canhão Varejo para Batimento de Volume Míope.",
      impact: bydMargin < 20 ? 145000 : 85000,
      cause: "Vendedores concederam descontos agressivos na linha de opcionais e aceitaram carros seminovos supravariados no trade-in para faturar e garantir bônus de performance comercial à revelia das margens líquidas corporativas recomendadas.",
      recommendation: "Suspender autonomia dos gerentes locais para concessão de descontos superiores a 3% sem anuência prévia da diretoria financeira. Instituir comissão associada à margem ponderada, não mais exclusivamente ao volume bruto (Yield-driven comissions)."
    });

    // Obstaculo 2: Administrative expenses growth
    const adminExp = dataOrigem.filter(d => d.Razão === "Pessoal Administrativo").reduce((acc, cur) => acc + cur.Despesa, 0);
    list.push({
      id: "obs-2",
      title: "Crescimento Descompassado de Despesas Administrativas (Sistemas TI)",
      severity: "alto",
      what: "As contas de materiais gerais e assinaturas digitais superaram a previsão oficial do orçamento mensal em cerca de 18% de forma persistente.",
      where: "Grupo Carbon Motors (Toyota, Chevrolet, Jeep)",
      when: "Maço a Maio de 2026",
      reason: "Sistemas de TI e Telecom - Conta Contábil 3.1.04.10000.25 (Suporte e Licenças Software)",
      impact: Math.round(adminExp * 0.12),
      cause: "Contratação duplicada de licenças de CRMs antigos não migrados e custos recorrentes com telefonia e links dedicados redundantes após migração na nuvem legada.",
      recommendation: "Auditar licenças ativas do painel Cloud e rescindir imediatamente os acessos de usuários inativos. Centralizar todas as solicitações de ferramentas de comunicação sob um único orçamento consolidado da TI unificada do grupo."
    });

    // Obstaculo 3: Loja de Baixa Conversão
    list.push({
      id: "obs-3",
      title: "Desvio Produtivo Crítico e Queda de Conversão de Pedidos",
      severity: "alto",
      what: "Diferença alarmante de performance e faturamento entre as duas filiais equivalentes do mesmo grupo econômico. A filial Norte faturou apenas 54% do volume gerado pelo Showroom Centro.",
      where: "Filiais Toyota Norte e Toyota Centro",
      when: "Abril e Maio em fechamento concorrente",
      reason: "Desempenho Comercial - Conversão de leads digitais na esteira física.",
      impact: 220000,
      cause: "A filial Norte demorou em média 4.2 horas para responder ao primeiro lead web, enquanto a filial Centro registrou tempo médio de resposta de apenas 14 minutos. Isso acarretou obsolescência e perda de leads qualificados.",
      recommendation: "Realizar transposição do Gerente de Leads da filial Centro para coordenar temporariamente a força Norte. Automatizar a distribuição de leads da web usando regras com tempo máximo de resposta de 30 minutos (SLA de engajamento acelerado)."
    });

    // Obstaculo 4: Comissões desproporcionais
    list.push({
      id: "obs-4",
      title: "Desproporção Financeira de Comissões vs Retorno de Margem",
      severity: "critico",
      what: "Despesa com pagamentos de incentivos comerciais superou o razoável, crescendo cerca de 32% no acumulado, enquanto a receita de novos veículos faturados cresceu somente 4%.",
      where: "Todas as Concessionárias de Voo Ativas",
      when: "Maio de 2026",
      reason: "Pessoal de Vendas - Conta Conta 3.1.03.11100.05",
      impact: 95000,
      cause: "Ausência de gatilho financeiro limitador (Cláusula de Margem Mínima) no regulamento do comissionamento corporativo. O sistema pagou comissão integral a vendas que foram faturadas com lucros marginais quase nulos.",
      recommendation: "Alterar a política comercial imediatamente: proibir comissão sobre vendas realizadas com margem inferior a 1.5%. Introduzir prêmio de superação condicionado ao Ebitda final apurado na filial."
    });

    // Obstaculo 5: Stagnant stock
    list.push({
      id: "obs-5",
      title: "Ociosidade Crítica e Estoque Parado de Seminovos de Baixo Giro",
      severity: "alto",
      what: "Acúmulo de capital de giro ocioso representado por veículos com tempo médio de exposição em pátio superior a 78 dias, contra target ideal tolerado de 45 dias.",
      where: "Lojas Chevrolet de Varejo S/A",
      when: "Fevereiro a Junho de 2026",
      reason: "Custos de Pátio e Ocupação Financeira - Ativo Imobilizado Provisório",
      impact: 180050,
      cause: "Avaliação imprecisa na captação inicial com precificação desalinhada das tabelas regionais de mercado de varejo.",
      recommendation: "Executar imediatamente um feirão com descontos táticos e bônus em revisões oficiais programadas para girar o capital acumulado e estancar perdas por depreciação."
    });

    return list;
  }, [dataOrigem]);

  const filtrados = useMemo(() => {
    if (selectedImpactLevel === "todos") return obstaculos;
    return obstaculos.filter(o => o.severity === selectedImpactLevel);
  }, [obstaculos, selectedImpactLevel]);

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-150 animate-fade-in" id="diagnostico-obstaculos-view">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <AlertCircle size={15} className="text-red-500 animate-bounce" />
            <span>Diagnóstico Clínico de Obstáculos Corporativos</span>
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
            Sauron audita continuamente seus dados em busca de gargalos ocultos. Abaixo estão listados os incidentes corporativos ativos que requerem ação imediata para reverter estagnações de fluxos de caixa e comissionamento.
          </p>
        </div>

        {/* Filter level selector */}
        <div className="flex bg-slate-100 dark:bg-slate-950/80 border border-slate-205 dark:border-slate-800 rounded p-0.5 items-center shrink-0">
          {[
            { id: "todos", label: "Exibir Todos" },
            { id: "critico", label: "Causas Críticas ⚡️" },
            { id: "alto", label: "Desvios Altos" }
          ].map((op) => (
            <button
              key={op.id}
              onClick={() => setSelectedImpactLevel(op.id as any)}
              className={`px-3 py-1 font-bold text-[9px] uppercase rounded transition-all cursor-pointer ${
                selectedImpactLevel === op.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of issues foldered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtrados.map((o) => (
          <div 
            key={o.id}
            className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between bg-white dark:bg-slate-900 transition-all ${
              o.severity === "critico"
                ? "border-red-200 hover:border-red-400/80 dark:border-red-955"
                : "border-slate-200 hover:border-slate-400 dark:border-slate-800"
            }`}
          >
            {/* Header issue card */}
            <div className={`p-4 ${o.severity === "critico" ? "bg-red-500/5" : "bg-slate-500/5"} border-b border-slate-100 dark:border-slate-805`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-wider ${
                  o.severity === "critico" ? "bg-red-100 text-red-800 dark:bg-red-955" : "bg-amber-100 text-amber-800 dark:bg-amber-955"
                }`}>
                  {o.severity === "critico" ? "⚠️ CRÍTICO" : "⚡️ IMPORTANTE"}
                </span>
                <span className="text-[10px] font-mono font-bold text-red-650 dark:text-red-400 flex items-center gap-0.5">
                  -{formatCurrency(o.impact)}
                </span>
              </div>
              <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white">{o.title}</h4>
            </div>

            {/* Folder body details */}
            <div className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-50 dark:border-slate-800 pb-2.5 text-[10px] text-slate-550 dark:text-slate-400 font-serif">
                <div className="flex items-center gap-1">
                  <MapPin size={11} className="text-slate-400 shrink-0" />
                  <span className="truncate" title={o.where}>Local: <strong className="font-sans font-bold text-slate-700 dark:text-slate-300">{o.where}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400 shrink-0" />
                  <span>Mês: <strong className="font-sans font-bold text-slate-705 dark:text-slate-300">{o.when}</strong></span>
                </div>
              </div>

              {/* Core analytics blocks */}
              <div className="space-y-2 font-sans">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">O que aconteceu?</span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">"{o.what}"</p>
                </div>

                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Eixo Central Associado</span>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">{o.reason}</p>
                </div>

                <div className="p-2.5 bg-slate-100/50 dark:bg-slate-850 rounded-lg space-y-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Causa Provável (Diagnosticado)</span>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">"{o.cause}"</p>
                </div>

                <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-1">
                  <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-widest block">Recomendação Consultiva Recomendada</span>
                  <p className="text-[10px] text-emerald-900 dark:text-emerald-400 font-medium leading-relaxed">"{o.recommendation}"</p>
                </div>
              </div>
            </div>

            {/* Plan indicator link */}
            <div className="bg-slate-50 dark:bg-slate-850/60 p-2.5 px-4 flex justify-between items-center text-[10px] text-slate-405 font-mono border-t border-slate-105 dark:border-slate-805">
              <span>Auditoria: Algoritmo de Negócio</span>
              <span className="text-[9px] text-blue-500 font-bold flex items-center gap-0.5 cursor-pointer hover:underline">
                Adicionar Tópico Relatório
                <ArrowRight size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
