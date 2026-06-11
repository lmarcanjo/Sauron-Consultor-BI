/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Coins,
  ChevronDown,
  Building,
  BarChart3,
  GitBranch,
  Search,
  BookOpen,
  Info,
  Calendar,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

import { LancamentoFinanceiro, FiltrosDashboard, MetricasConsolidadas } from "./types";
import { gerarDadosSimulados, exportToCSV } from "./utils/dataGenerator";
import { parseCSV } from "./utils/csvParser";
import { KpiCard } from "./components/KpiCard";
import { SidebarFilters } from "./components/SidebarFilters";
import { ChartsGrid } from "./components/ChartsGrid";
import { TraceabilityPanel } from "./components/TraceabilityPanel";
import { StreamlitExporter } from "./components/StreamlitExporter";

export default function App() {
  // --- STATE ---
  const [dataOrigem, setDataOrigem] = useState<LancamentoFinanceiro[]>([]);
  const [nomeFonte, setNomeFonte] = useState<string>("Dados Simulados de Concessionárias de Voo");
  const [camposAusentes, setCamposAusentes] = useState<string[]>([]);
  
  // Active selected filters
  const [filtros, setFiltros] = useState<FiltrosDashboard>({
    grupos: [],
    cnpjs: [],
    marcas: [],
    meses: [],
    razoes: []
  });

  // Table pagination and sorting
  const [sortField, setSortField] = useState<keyof LancamentoFinanceiro>("Receita");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reportLevel, setReportLevel] = useState<"completo" | "cnpj" | "marca">("completo");
  const [margemLimite, setMargemLimite] = useState<number>(10);

  // AI Consulting section states
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiSource, setAiSource] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Start with realistic pre-calculated simulated data
    const simulated = gerarDadosSimulados();
    setDataOrigem(simulated);
  }, []);

  // Set default filters whenever original data changes
  useEffect(() => {
    if (dataOrigem.length > 0) {
      const uniqueGrupos = Array.from(new Set(dataOrigem.map(d => d.Grupo))).sort();
      const uniqueCnpjs = Array.from(new Set(dataOrigem.map(d => d.CNPJ))).sort();
      const uniqueMarcas = Array.from(new Set(dataOrigem.map(d => d.Marca))).sort();
      const uniqueMeses = Array.from(new Set(dataOrigem.map(d => d.Mês)));
      const uniqueRazoes = Array.from(new Set(dataOrigem.map(d => d.Razão))).sort();

      setFiltros({
        grupos: uniqueGrupos,
        cnpjs: uniqueCnpjs,
        marcas: uniqueMarcas,
        meses: uniqueMeses,
        razoes: uniqueRazoes
      });
    }
  }, [dataOrigem]);

  // Unique elements for Sidebar choice indicators
  const availableFilters = useMemo<FiltrosDashboard>(() => {
    if (dataOrigem.length === 0) {
      return { grupos: [], cnpjs: [], marcas: [], meses: [], razoes: [] };
    }
    return {
      grupos: Array.from(new Set(dataOrigem.map(d => d.Grupo))).sort(),
      cnpjs: Array.from(new Set(dataOrigem.map(d => d.CNPJ))).sort(),
      marcas: Array.from(new Set(dataOrigem.map(d => d.Marca))).sort(),
      meses: Array.from(new Set(dataOrigem.map(d => d.Mês))),
      razoes: Array.from(new Set(dataOrigem.map(d => d.Razão))).sort()
    };
  }, [dataOrigem]);

  // --- DATA FLOW & FILTERING ---
  const filteredData = useMemo(() => {
    return dataOrigem.filter((item) => {
      const matchGrupo = filtros.grupos.includes(item.Grupo);
      const matchCnpj = filtros.cnpjs.includes(item.CNPJ);
      const matchMarca = filtros.marcas.includes(item.Marca);
      const matchMes = filtros.meses.includes(item.Mês);
      const matchRazao = filtros.razoes.includes(item.Razão);
      return matchGrupo && matchCnpj && matchMarca && matchMes && matchRazao;
    });
  }, [dataOrigem, filtros]);

  // Compute aggregated KPI telemetry & distributions for chart rendering
  const metrics = useMemo<MetricasConsolidadas>(() => {
    if (filteredData.length === 0) {
      return {
        receitaTotal: 0,
        custoTotal: 0,
        despesaTotal: 0,
        lucroTotal: 0,
        margemMedia: 0,
        porMarca: [],
        porCnpj: [],
        porRazao: [],
        porMes: []
      };
    }

    const receitaTotal = filteredData.reduce((acc, curr) => acc + curr.Receita, 0);
    const custoTotal = filteredData.reduce((acc, curr) => acc + curr.Custo, 0);
    const despesaTotal = filteredData.reduce((acc, curr) => acc + curr.Despesa, 0);
    const lucroTotal = filteredData.reduce((acc, curr) => acc + curr.Lucro, 0);
    const margemMedia = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;

    // Dist por Marca (Receita, Lucro)
    const marcasMap: Record<string, { receita: number; lucro: number }> = {};
    filteredData.forEach((d) => {
      if (!marcasMap[d.Marca]) marcasMap[d.Marca] = { receita: 0, lucro: 0 };
      marcasMap[d.Marca].receita += d.Receita;
      marcasMap[d.Marca].lucro += d.Lucro;
    });
    const porMarca = Object.keys(marcasMap).map((m) => {
      const rec = marcasMap[m].receita;
      const luc = marcasMap[m].lucro;
      return {
        marca: m,
        receita: Math.round(rec * 100) / 100,
        lucro: Math.round(luc * 100) / 100,
        margem: rec > 0 ? (luc / rec) * 100 : 0
      };
    }).sort((a, b) => b.receita - a.receita);

    // Dist por CNPJ (Lucro)
    const cnpjsMap: Record<string, { empresa: string; receita: number; lucro: number }> = {};
    filteredData.forEach((d) => {
      if (!cnpjsMap[d.CNPJ]) cnpjsMap[d.CNPJ] = { empresa: d.Empresa, receita: 0, lucro: 0 };
      cnpjsMap[d.CNPJ].receita += d.Receita;
      cnpjsMap[d.CNPJ].lucro += d.Lucro;
    });
    const porCnpj = Object.keys(cnpjsMap).map((c) => {
      const rec = cnpjsMap[c].receita;
      const luc = cnpjsMap[c].lucro;
      return {
        cnpj: c,
        empresa: cnpjsMap[c].empresa,
        receita: Math.round(rec * 100) / 100,
        lucro: Math.round(luc * 100) / 100,
        margem: rec > 0 ? (luc / rec) * 100 : 0
      };
    }).sort((a, b) => b.lucro - a.lucro);

    // Dist por Razão (Despesa) - Foco principal solicitado
    const razoesMap: Record<string, number> = {};
    filteredData.forEach((d) => {
      if (!razoesMap[d.Razão]) razoesMap[d.Razão] = 0;
      razoesMap[d.Razão] += d.Despesa;
    });
    const porRazao = Object.keys(razoesMap).map((r) => {
      const desp = razoesMap[r];
      return {
        razao: r,
        despesa: Math.round(desp * 100) / 100,
        participacao: despesaTotal > 0 ? (desp / despesaTotal) * 100 : 0
      };
    }).sort((a, b) => b.despesa - a.despesa);

    // Dist por Mês (Evolução)
    const mesesOrdem: Record<string, number> = {
      "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6,
      "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12
    };
    const mesesMap: Record<string, { lucro: number; receita: number }> = {};
    filteredData.forEach((d) => {
      if (!mesesMap[d.Mês]) mesesMap[d.Mês] = { lucro: 0, receita: 0 };
      mesesMap[d.Mês].lucro += d.Lucro;
      mesesMap[d.Mês].receita += d.Receita;
    });
    const porMes = Object.keys(mesesMap).map((m) => {
      return {
        mes: m,
        lucro: Math.round(mesesMap[m].lucro * 100) / 100,
        receita: Math.round(mesesMap[m].receita * 100) / 100,
        ordem: mesesOrdem[m] || 99
      };
    }).sort((a, b) => a.ordem - b.ordem);

    return {
      receitaTotal,
      custoTotal,
      despesaTotal,
      lucroTotal,
      margemMedia,
      porMarca,
      porCnpj,
      porRazao,
      porMes
    };
  }, [filteredData]);

  // Trigger dynamic Consulting Analysis from Backend (Gemini or Advanced Fallback)
  const handleTriggerAnalysis = async () => {
    try {
      setAiLoading(true);
      setAiError("");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: {
            receitaTotal: metrics.receitaTotal,
            custoTotal: metrics.custoTotal,
            despesaTotal: metrics.despesaTotal,
            lucroTotal: metrics.lucroTotal,
            margemMedia: metrics.margemMedia,
            porMarca: metrics.porMarca,
            porCnpj: metrics.porCnpj,
            porRazao: metrics.porRazao
          },
          selectedFilters: {
            grupos: filtros.grupos,
            marcas: filtros.marcas,
            cnpjs: filtros.cnpjs,
            meses: filtros.meses
          }
        })
      });

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }
      setAiAnalysis(resData.analysis);
      setAiSource(resData.source);
    } catch (err: any) {
      console.error(err);
      setAiError("Ops, houve um contratempo ao gerar o diagnóstico inteligente. Mas nosso motor analítico tático offline foi engatilhado em redundância.");
    } finally {
      setAiLoading(false);
    }
  };

  // Run initial report on first mount / original data set
  useEffect(() => {
    if (metrics.receitaTotal > 0 && !aiAnalysis && !aiLoading) {
      handleTriggerAnalysis();
    }
  }, [metrics, aiAnalysis]);

  // Reset filtering state
  const handleResetFilters = () => {
    setFiltros({
      grupos: [...availableFilters.grupos],
      cnpjs: [...availableFilters.cnpjs],
      marcas: [...availableFilters.marcas],
      meses: [...availableFilters.meses],
      razoes: [...availableFilters.razoes]
    });
  };

  // --- EXPORT & FILE UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const { data, missingFields } = parseCSV(text);
        if (data.length > 0) {
          setDataOrigem(data);
          setNomeFonte(file.name);
          setCamposAusentes(missingFields);
          setAiAnalysis(""); // Clear stale analysis to trigger a fresh context
        } else {
          alert("Nenhuma linha válida pôde ser estruturada do arquivo CSV.");
        }
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Group levels configuration inside Table Exporter section (Requirement 9)
  const reportData = useMemo(() => {
    if (reportLevel === "completo") {
      // Group by Empresa/Grupo and Month
      const gps: Record<string, any> = {};
      filteredData.forEach(d => {
        const key = `${d.Grupo}_${d.Empresa}_${d.Mês}`;
        if (!gps[key]) {
          gps[key] = {
            Grupo: d.Grupo,
            Empresa: d.Empresa,
            Mês: d.Mês,
            Receita: 0,
            Custo: 0,
            Despesa: 0,
            Lucro: 0
          };
        }
        gps[key].Receita += d.Receita;
        gps[key].Custo += d.Custo;
        gps[key].Despesa += d.Despesa;
        gps[key].Lucro += d.Lucro;
      });
      return Object.values(gps).map((item: any) => ({
        ...item,
        Receita: Math.round(item.Receita * 100) / 100,
        Custo: Math.round(item.Custo * 100) / 100,
        Despesa: Math.round(item.Despesa * 100) / 100,
        Lucro: Math.round(item.Lucro * 100) / 100,
        Margem: item.Receita > 0 ? Math.round((item.Lucro / item.Receita) * 10000) / 100 : 0
      }));
    } else if (reportLevel === "cnpj") {
      // Group by CNPJ, Empresa and Month
      const gps: Record<string, any> = {};
      filteredData.forEach(d => {
        const key = `${d.CNPJ}_${d.Mês}`;
        if (!gps[key]) {
          gps[key] = {
            CNPJ: d.CNPJ,
            Empresa: d.Empresa,
            Mês: d.Mês,
            Receita: 0,
            Custo: 0,
            Despesa: 0,
            Lucro: 0
          };
        }
        gps[key].Receita += d.Receita;
        gps[key].Custo += d.Custo;
        gps[key].Despesa += d.Despesa;
        gps[key].Lucro += d.Lucro;
      });
      return Object.values(gps).map((item: any) => ({
        ...item,
        Receita: Math.round(item.Receita * 100) / 100,
        Custo: Math.round(item.Custo * 100) / 100,
        Despesa: Math.round(item.Despesa * 100) / 100,
        Lucro: Math.round(item.Lucro * 100) / 100,
        Margem: item.Receita > 0 ? Math.round((item.Lucro / item.Receita) * 10000) / 100 : 0
      }));
    } else {
      // Group by Marca and Month
      const gps: Record<string, any> = {};
      filteredData.forEach(d => {
        const key = `${d.Marca}_${d.Mês}`;
        if (!gps[key]) {
          gps[key] = {
            Marca: d.Marca,
            Empresa: d.Empresa,
            Mês: d.Mês,
            Receita: 0,
            Custo: 0,
            Despesa: 0,
            Lucro: 0
          };
        }
        gps[key].Receita += d.Receita;
        gps[key].Custo += d.Custo;
        gps[key].Despesa += d.Despesa;
        gps[key].Lucro += d.Lucro;
      });
      return Object.values(gps).map((item: any) => ({
        ...item,
        Receita: Math.round(item.Receita * 100) / 100,
        Custo: Math.round(item.Custo * 100) / 100,
        Despesa: Math.round(item.Despesa * 100) / 100,
        Lucro: Math.round(item.Lucro * 100) / 100,
        Margem: item.Receita > 0 ? Math.round((item.Lucro / item.Receita) * 10000) / 100 : 0
      }));
    }
  }, [filteredData, reportLevel]);

  // Sorted report lines
  const sortedReportData = useMemo(() => {
    return [...reportData].sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }
      return sortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [reportData, sortField, sortOrder]);

  const itensAbaixoDoLimite = useMemo(() => {
    return sortedReportData.filter((row: any) => row.Margem < margemLimite).length;
  }, [sortedReportData, margemLimite]);

  const toggleSort = (field: any) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleDownloadReport = () => {
    const csvContent = exportToCSV(sortedReportData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_agrupado_${reportLevel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper formatting values
  const formatCurrencyValue = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col antialiased">
      {/* HEADER SECTION - High Density Style */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 md:px-6 shrink-0 shadow-sm z-20 sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">Sauron</span>
              <span className="text-[11px] text-slate-400 font-medium">Dashboard Consultivo</span>
              <span className="text-slate-300">/</span>
            </div>
            <h1 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Building className="text-blue-600 shrink-0" size={16} />
              <span>Visão Consolidada Corporativa</span>
            </h1>
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            
            <button
              onClick={triggerFileSelect}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer"
            >
              <Upload size={12} className="text-slate-500" />
              <span>Importar CSV</span>
            </button>

            <button
              onClick={handleTriggerAnalysis}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all rounded text-[10px] uppercase tracking-wide font-extrabold cursor-pointer shadow-sm"
            >
              {aiLoading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>Reanalisar com IA</span>
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA - High Density Compact Spacing */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-5 flex-1 flex flex-col lg:flex-row gap-5">
        {/* SIDEBAR FILTERS (SPAN 4 COLS) */}
        <section className="w-full lg:w-64 shrink-0 lg:sticky lg:top-[68px] h-fit">
          <SidebarFilters
            available={availableFilters}
            selected={filtros}
            onChange={setFiltros}
            onReset={handleResetFilters}
          />
        </section>

        {/* ANALYTICS CONTAINER (SPAN 8 COLS) */}
        <section className="flex-1 space-y-4 overflow-hidden">
          
          {/* MONITOR DE MARGEM OPERACIONAL - CONTROL BAR */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans hover:shadow-md transition-shadow duration-150">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 text-red-600 rounded">
                <AlertTriangle size={15} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Monitor de Margem Operacional</h4>
                <p className="text-[10px] text-slate-400">Destaque visual automático para eficiência abaixo da meta definida</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Slider & Label */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Alerta de Margem:</span>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="0.5"
                  value={margemLimite}
                  onChange={(e) => setMargemLimite(Number(e.target.value))}
                  className="w-20 sm:w-28 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <span className="text-[11px] font-mono font-extrabold text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-0.5">
                  &lt; {margemLimite.toFixed(1)}%
                </span>
              </div>

              {/* Presets */}
              <div className="flex gap-1">
                {[5, 10, 15, 20].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setMargemLimite(preset)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                      margemLimite === preset
                        ? "bg-red-50 border-red-200 text-red-600 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              {/* Status Indicator */}
              {itensAbaixoDoLimite > 0 ? (
                <div className="text-[10px] font-extrabold text-white bg-red-600 px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
                  <span>{itensAbaixoDoLimite} {itensAbaixoDoLimite === 1 ? 'alerta' : 'alertas'}</span>
                </div>
              ) : (
                <div className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md">
                  Conforme
                </div>
              )}
            </div>
          </div>

          {/* KPI TELEMETRY SEGMENT */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard
              title="Faturamento Bruto"
              value={formatCurrencyValue(metrics.receitaTotal)}
              subtitle="Receitas comerciais brutas"
              icon={Coins}
            />
            <KpiCard
              title="Custo Operacional"
              value={formatCurrencyValue(metrics.custoTotal)}
              subtitle="Custo de faturamento (CMV)"
              type="negative"
              icon={Building}
            />
            <KpiCard
              title="Gastos &amp; Despesas"
              value={formatCurrencyValue(metrics.despesaTotal)}
              subtitle="Operacional e centros fixos"
              type="negative"
              icon={GitBranch}
            />
            <KpiCard
              title="Resultado Líquido"
              value={formatCurrencyValue(metrics.lucroTotal)}
              subtitle="Margens reais de lucro"
              type={metrics.lucroTotal >= 0 ? "positive" : "negative"}
              icon={TrendingUp}
            />
            <KpiCard
              title="Retorno Líquido"
              value={`${metrics.margemMedia.toFixed(2)}%`}
              subtitle={metrics.margemMedia < margemLimite ? "Margem crítica atingida" : "Margem saudável do grupo"}
              isAlert={metrics.margemMedia < margemLimite}
              type={metrics.margemMedia >= margemLimite ? "positive" : "negative"}
              icon={BarChart3}
            />
          </section>

          {/* DYNAMIC METRIC CHARTS GRID */}
          <section>
            <ChartsGrid metrics={metrics} />
          </section>

          {/* AI CONSULTING INSIGHTS */}
          <section className="bg-slate-900 border border-slate-950 rounded-xl shadow-md overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400">
                    <span>Análise Consultiva Agent OS</span>
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">Diagnósticos e diretrizes geradas dinamicamente com base nas visões filtradas</p>
                </div>
              </div>
              
              {aiSource && (
                <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-blue-300 rounded px-2 py-0.5 shrink-0">
                  {aiSource}
                </span>
              )}
            </div>

            <div className="p-4 relative min-h-[160px] bg-slate-900 text-slate-300">
              {aiLoading ? (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col justify-center items-center p-4 gap-2 z-10 rounded-b-xl border-t border-slate-850/40">
                  <div className="relative">
                    <div className="w-9 h-9 border-3 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={13} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-white animate-pulse">Agente BI está estruturando auditoria financeira...</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 italic max-w-md">Analisando rubricas de despesas, taxas operacionais de marcas e gerando recomendações consultivas em tempo real.</p>
                  </div>
                </div>
              ) : null}

              {aiError && (
                <div className="mb-3 p-2.5 bg-rose-950/40 text-rose-300 text-[11px] rounded border border-rose-900/50 flex items-start gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-400" />
                  <p>{aiError}</p>
                </div>
              )}

              {aiAnalysis ? (
                <div className="prose prose-invert max-w-none text-[11px] leading-relaxed font-sans space-y-3">
                  {/* Styled markdown content rendering */}
                  <div className="markdown-body text-slate-200">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Sparkles size={20} className="text-slate-600 mb-1.5" />
                  <p className="text-[11px] text-center font-medium">Nenhum relatório consultivo ativo. Clique em "Reanalisar com IA" para mobilizar o agente.</p>
                </div>
              )}
            </div>
          </section>

          {/* CENTRAL DE EXPORTACAO - TAB DATA LIST (Requirement 9) */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 hover:shadow-md transition-all duration-150">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Central de Agrupamento & Exportação</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Gere demonstrativos táticos em múltiplos agrupamentos operacionais</p>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center w-full sm:w-auto justify-end">
                <select
                  value={reportLevel}
                  onChange={(e) => setReportLevel(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 px-2 py-1 rounded focus:outline-none focus:border-blue-500 font-sans cursor-pointer shrink-0"
                >
                  <option value="completo">Relatório Completo do Grupo</option>
                  <option value="cnpj">Relatório Individual por CNPJ</option>
                  <option value="marca">Relatório Individual por Marca</option>
                </select>

                <button
                  onClick={handleDownloadReport}
                  className="px-2.5 py-1 bg-slate-800 text-slate-100 hover:bg-slate-900 transition-colors text-[10px] uppercase tracking-wide font-extrabold rounded cursor-pointer shrink-0"
                >
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* DEMONSTRATIVO TABLE */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-64 custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 text-[9px] font-sans">
                    {reportLevel === "cnpj" && (
                      <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("CNPJ")}>
                        CNPJ
                      </th>
                    )}
                    {reportLevel === "marca" && (
                      <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Marca")}>
                        Marca
                      </th>
                    )}
                    {reportLevel === "completo" && (
                      <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Grupo")}>
                        Grupo
                      </th>
                    )}
                    <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Empresa")}>
                      Empresa
                    </th>
                    <th className="py-2 px-3.5 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Mês")}>
                      Competência
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Receita")}>
                      Receita Bruta
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Custo")}>
                      Custo (CMV)
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Despesa")}>
                      Gastos/Despesas
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Lucro")}>
                      Retorno Líquido
                    </th>
                    <th className="py-2 px-3.5 text-right cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("Margem")}>
                      Eficiência
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white font-sans text-slate-600">
                  {sortedReportData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-400 italic text-[11px]">
                        Nenhum registro ativo sob as seleções dos filtros corporativos.
                      </td>
                    </tr>
                  ) : (
                    sortedReportData.map((row: any, idx: number) => {
                      const isPositive = row.Lucro >= 0;
                      const isRowAlert = row.Margem < margemLimite;
                      return (
                        <tr 
                          key={idx} 
                          className={`text-[11px] h-8 transition-colors ${
                            isRowAlert 
                              ? "bg-red-50/60 hover:bg-red-100/75 border-l-2 border-l-red-500 text-red-955" 
                              : "hover:bg-slate-50/50 text-slate-600"
                          }`}
                        >
                          {reportLevel === "cnpj" && (
                            <td className={`py-1 px-3.5 font-mono font-bold ${isRowAlert ? "text-red-900" : "text-slate-700"}`}>
                              {row.CNPJ}
                            </td>
                          )}
                          {reportLevel === "marca" && (
                            <td className={`py-1 px-3.5 font-bold ${isRowAlert ? "text-red-900" : "text-slate-800"}`}>
                              {row.Marca}
                            </td>
                          )}
                          {reportLevel === "completo" && (
                            <td className={`py-1 px-3.5 font-medium ${isRowAlert ? "text-slate-800" : "text-slate-500"}`}>
                              {row.Grupo}
                            </td>
                          )}
                          <td className="py-1 px-3.5 truncate max-w-[130px] font-sans" title={row.Empresa}>{row.Empresa}</td>
                          <td className="py-1 px-3.5 text-slate-500 font-medium">{row.Mês}</td>
                          <td className="py-1 px-3.5 text-right font-mono text-slate-700 font-medium">{formatCurrencyValue(row.Receita)}</td>
                          <td className="py-1 px-3.5 text-right font-mono text-slate-400">{formatCurrencyValue(row.Custo)}</td>
                          <td className="py-1 px-3.5 text-right font-mono text-slate-400">{formatCurrencyValue(row.Despesa)}</td>
                          <td className={`py-1 px-3.5 text-right font-mono font-bold ${isPositive && !isRowAlert ? "text-blue-600" : "text-red-600"}`}>
                            {formatCurrencyValue(row.Lucro)}
                          </td>
                          <td className={`py-1 px-3.5 text-right font-mono font-bold ${isPositive && !isRowAlert ? "text-blue-600" : "text-red-600"}`}>
                            <div className="flex items-center justify-end gap-1">
                              {isRowAlert && <AlertTriangle size={11} className="text-red-500 animate-pulse shrink-0" />}
                              <span>{row.Margem.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PYTHON CORE EXPORTER / EXECUTABLE EXCISE SEGMENT */}
          <section>
            <StreamlitExporter />
          </section>

          {/* TRACEABILITY AND INTEGRITY AUDITOR */}
          <section>
            <TraceabilityPanel
              totalImported={dataOrigem.length}
              totalFiltered={filteredData.length}
              missingFields={camposAusentes}
              sourceName={nomeFonte}
            />
          </section>

        </section>
      </main>

      {/* FOOTER AREA - Compact High Density */}
      <footer className="bg-slate-900 border-t border-slate-950 text-slate-500 py-4 text-center text-[10px] shrink-0 font-sans leading-normal">
        <p className="font-semibold text-slate-400">Sauron &copy; 2026</p>
        <p className="text-slate-600 mt-0.5">Ambiente corporativo de alta confiabilidade operacional e rastreabilidade financeira auditada.</p>
      </footer>
    </div>
  );
}
