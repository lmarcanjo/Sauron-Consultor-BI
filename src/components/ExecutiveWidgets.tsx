/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Award, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Activity, 
  Sparkles, Check, Clock, Play, FileText, ChevronRight, ListTodo, Database, AlertCircle 
} from "lucide-react";
import { DesignSystem } from "../design-system";
import { WidgetContext } from "../core/widgets/WidgetEngine";
import { auditEngine } from "../core/audit/AuditEngine";

// ────────────────────────────────────────────────────────────────────────
// 1. EXECUTIVE BRIEF WIDGET
// ────────────────────────────────────────────────────────────────────────
export const ExecutiveBriefWidget: React.FC<{ context: WidgetContext }> = ({ context }) => {
  const { filteredData, formatCurrency, onSelectTab } = context;

  // Derive stats
  const revenue = filteredData && filteredData.length > 0 
    ? filteredData.reduce((acc, d) => acc + Number(d.Valor || d.valor || d.Total || 0), 0)
    : 3850000;

  return (
    <div className="bg-gradient-to-r from-blue-900/10 via-indigo-950/5 to-transparent border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h4 className={DesignSystem.Typography.titleMedium}>
            Dossiê de Desempenho Ativo
          </h4>
          <p className={DesignSystem.Typography.body}>
            Consolidação do faturamento geral aponta para <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(revenue)}</strong>.
          </p>
        </div>
        <button
          onClick={() => onSelectTab("modo_reuniao")}
          className={DesignSystem.Button.build("filled", "sm")}
        >
          Board Room <Play size={10} />
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// 2. HEALTH CENTER / MATURITY WIDGET
// ────────────────────────────────────────────────────────────────────────
export const HealthCenterWidget: React.FC<{ context: WidgetContext }> = ({ context }) => {
  const [activeDimension, setActiveDimension] = useState<string | null>("dados");

  const checklistItems: Record<string, string[]> = {
    dados: [
      "Ingestão automatizada ativa",
      "Mascaramento LGPD em conformidade",
      "Validação de contas concluída"
    ],
    kpis: [
      "Margem mínima por segmento homologada",
      "Meta de vendas Q3 definida",
      "Aprovação do CMV alvo"
    ],
    rituais: [
      "Ata de diretoria homologada",
      "Ritual de faturamento ativo",
      "Dossiê preparado para Conselho"
    ]
  };

  return (
    <div className={DesignSystem.Card.container}>
      <div className={DesignSystem.Card.header}>
        <span className={DesignSystem.Typography.titleSmall}>
          Maturidade Operacional (Health Score)
        </span>
        <span className={DesignSystem.Badge.build("success")}>Score: 88/100</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(checklistItems).map((dim) => (
            <button
              key={dim}
              onClick={() => setActiveDimension(dim)}
              className={`p-2 rounded-xl text-center border transition-all text-[10px] font-black uppercase ${
                activeDimension === dim 
                  ? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400" 
                  : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-100"
              }`}
            >
              {dim}
            </button>
          ))}
        </div>

        {activeDimension && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
            {checklistItems[activeDimension].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// 3. CLIENT PULSE WIDGET
// ────────────────────────────────────────────────────────────────────────
export const ClientPulseWidget: React.FC<{ context: WidgetContext }> = ({ context }) => {
  const { filteredData, formatCurrency } = context;

  const revenue = filteredData && filteredData.length > 0 
    ? filteredData.reduce((acc, d) => acc + Number(d.Valor || d.valor || d.Total || 0), 0)
    : 3850000;

  return (
    <div className={DesignSystem.Card.container}>
      <div className={DesignSystem.Card.header}>
        <span className={DesignSystem.Typography.titleSmall}>
          Client Pulse — Saúde de Resultados
        </span>
        <span className={DesignSystem.Badge.build("primary")}>Consolidado</span>
      </div>
      <div className="p-4 space-y-4">
        {/* KPI Row 1 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Margem Comercial</span>
            <span className="text-[10px] text-emerald-500 font-black flex items-center gap-0.5 font-mono">
              <TrendingUp size={10} /> +12%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "84%" }} />
          </div>
          <p className="text-[10px] text-slate-500 font-mono flex justify-between">
            <span>Alvo: R$ 4.5M</span>
            <span>Realizado: {formatCurrency(revenue)}</span>
          </p>
        </div>

        {/* KPI Row 2 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">CMV Alvo de Peças</span>
            <span className="text-[10px] text-amber-500 font-black flex items-center gap-0.5 font-mono">
              <TrendingDown size={10} /> -0.4pp
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "72%" }} />
          </div>
          <p className="text-[10px] text-slate-500 font-mono flex justify-between">
            <span>Alvo: 14.5%</span>
            <span>Média: 13.8%</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// 4. DECISION CENTER WIDGET
// ────────────────────────────────────────────────────────────────────────
export const DecisionCenterWidget: React.FC<{ context: WidgetContext }> = () => {
  const [decisions, setDecisions] = useState([
    { id: "d1", title: "Redução de CMV por compras integradas", impact: "Alto (+R$ 42k/m)", status: "pending" },
    { id: "d2", title: "Reenquadramento tributário autopeças", impact: "Médio (+R$ 18k/m)", status: "pending" }
  ]);

  const handleResolve = (id: string, status: "approved" | "archived") => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    const item = decisions.find(d => d.id === id);
    if (item) {
      auditEngine.logEvent(
        "DECISION_RESOLVED",
        `Decisão [${item.title}] resolvida como ${status.toUpperCase()}`,
        "WARNING"
      );
    }
  };

  return (
    <div className={DesignSystem.Card.container}>
      <div className={DesignSystem.Card.header}>
        <span className={DesignSystem.Typography.titleSmall}>
          Decision Center — Deliberações
        </span>
        <span className={DesignSystem.Badge.build("warning")}>2 Pendentes</span>
      </div>
      <div className="p-4 space-y-3">
        {decisions.map((dec) => (
          <div 
            key={dec.id} 
            className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
              dec.status === "approved" ? "border-emerald-500/20 bg-emerald-500/5 opacity-70" :
              dec.status === "archived" ? "border-slate-200/40 bg-slate-100/10 opacity-50" :
              "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{dec.title}</p>
              <span className="text-[9px] font-mono text-emerald-500 font-extrabold">{dec.impact}</span>
            </div>
            {dec.status === "pending" ? (
              <div className="flex gap-1">
                <button
                  onClick={() => handleResolve(dec.id, "approved")}
                  className={DesignSystem.Button.build("filled", "sm")}
                >
                  Aprovar
                </button>
                <button
                  onClick={() => handleResolve(dec.id, "archived")}
                  className={DesignSystem.Button.build("outline", "sm")}
                >
                  Arquivar
                </button>
              </div>
            ) : (
              <span className="text-[9px] font-mono font-black uppercase text-slate-400">
                {dec.status === "approved" ? "Aprovado" : "Arquivado"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// 5. ACTION BOARD / TIMELINE WIDGET
// ────────────────────────────────────────────────────────────────────────
export const ActionBoardWidget: React.FC<{ context: WidgetContext }> = () => {
  const [plans, setPlans] = useState([
    { id: "p1", desc: "Ajuste de comissão de técnicos da Oficina", resp: "Roberto Consultor", status: "completed" },
    { id: "p2", desc: "Renegociação de recebíveis banco Nissan", resp: "Ana Finanças", status: "pending" }
  ]);

  const toggleStatus = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: p.status === "completed" ? "pending" : "completed" } : p));
  };

  return (
    <div className={DesignSystem.Card.container}>
      <div className={DesignSystem.Card.header}>
        <span className={DesignSystem.Typography.titleSmall}>
          Action Board — Planos Operacionais
        </span>
        <span className={DesignSystem.Badge.build("neutral")}>Ciclo Q2</span>
      </div>
      <div className="p-4 space-y-3">
        {plans.map((p) => (
          <div key={p.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition">
            <button 
              onClick={() => toggleStatus(p.id)}
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer ${
                p.status === "completed" ? "bg-blue-500/10 border-blue-500 text-blue-600" : "bg-white dark:bg-slate-900 border-slate-200 text-transparent"
              }`}
            >
              {p.status === "completed" && <Check size={12} strokeWidth={3} />}
            </button>
            <div>
              <p className={`text-xs font-bold leading-tight ${p.status === "completed" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>
                {p.desc}
              </p>
              <p className="text-[9px] font-mono text-slate-400 mt-0.5">Resp: {p.resp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// 6. DATA HEALTH / METADATA WIDGET
// ────────────────────────────────────────────────────────────────────────
export const DataHealthWidget: React.FC<{ context: WidgetContext }> = () => {
  return (
    <div className={DesignSystem.Card.container}>
      <div className={DesignSystem.Card.header}>
        <span className={DesignSystem.Typography.titleSmall}>
          Sauron Ledger & Data Health
        </span>
        <span className={DesignSystem.Badge.build("neutral")}>Ledger OK</span>
      </div>
      <div className="p-4 space-y-3 text-xs">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-medium">
          <span className="flex items-center gap-1.5"><Database size={13} className="text-blue-500" /> Banco Cloud:</span>
          <span className="font-mono text-[10px] text-emerald-500">Conectado (PostgreSQL)</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-medium">
          <span className="flex items-center gap-1.5"><FileText size={13} className="text-blue-500" /> Dicionário de Dados:</span>
          <span className="font-mono text-[10px] text-slate-400">12 Tabelas Indexadas</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-medium">
          <span className="flex items-center gap-1.5"><AlertCircle size={13} className="text-amber-500" /> Qualidade de Dados:</span>
          <span className="font-mono text-[10px] text-emerald-500">Score 98.4%</span>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// REGISTRY INITIALIZATION (SELF-LOADING DESIGN)
// ────────────────────────────────────────────────────────────────────────
import { widgetRegistry } from "../core/widgets/WidgetEngine";

widgetRegistry.registerWidget({
  id: "executive_brief",
  title: "Apresentação e Resumo Executivo",
  category: "meta",
  defaultSize: "full",
  component: ExecutiveBriefWidget
});

widgetRegistry.registerWidget({
  id: "health_center",
  title: "Índice de Maturidade Operacional",
  category: "analytics",
  defaultSize: "lg",
  component: HealthCenterWidget
});

widgetRegistry.registerWidget({
  id: "client_pulse",
  title: "Client Pulse - Saúde Operacional",
  category: "analytics",
  defaultSize: "md",
  component: ClientPulseWidget
});

widgetRegistry.registerWidget({
  id: "decision_center",
  title: "Decision Center - Deliberações Recomendadas",
  category: "decisions",
  defaultSize: "lg",
  component: DecisionCenterWidget
});

widgetRegistry.registerWidget({
  id: "executive_timeline",
  title: "Action Board - Linha do Tempo e Planos",
  category: "operations",
  defaultSize: "md",
  component: ActionBoardWidget
});

widgetRegistry.registerWidget({
  id: "data_health",
  title: "Sauron Ledger - Data Health",
  category: "meta",
  defaultSize: "sm",
  component: DataHealthWidget
});

