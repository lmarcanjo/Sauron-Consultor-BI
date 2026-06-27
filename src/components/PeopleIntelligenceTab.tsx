import React, { useState } from "react";
import { Users, TrendingUp, Award, Target, Coins, ShieldAlert, Sparkles, FileText, ClipboardList, Lightbulb, Search, User, ShieldCheck } from "lucide-react";
import { LancamentoFinanceiro, MetricasConsolidadas } from "../types";
import { VendedoresTab } from "./VendedoresTab";
import { ComissoesTab } from "./ComissoesTab";

interface PeopleIntelligenceTabProps {
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
  metrics: MetricasConsolidadas;
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
  taxaComissaoPecas: number;
  setTaxaComissaoPecas: (v: number) => void;
  triggerSystemBackup: () => void;
  userRole?: string;
}

export const PeopleIntelligenceTab: React.FC<PeopleIntelligenceTabProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<"colaboradores" | "performance" | "comissoes" | "dossies" | "impressoes">("colaboradores");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDossier, setSelectedDossier] = useState("João Silva");

  const colaboradores = [
    { name: "João Silva", role: "Consultor de Vendas Senior", department: "Comercial Novos", status: "Ativo", email: "joao.silva@alphagroup.com" },
    { name: "Maria Santos", role: "Especialista em F&I (Financiamento)", department: "Administração", status: "Ativo", email: "maria.santos@alphagroup.com" },
    { name: "Pedro Oliveira", role: "Consultor de Vendas Pleno", department: "Comercial Seminovos", status: "Ativo", email: "pedro.oliveira@alphagroup.com" },
    { name: "Lucas Souza", role: "Técnico Especialista Nissan", department: "Pós-Vendas (Oficina)", status: "Ativo", email: "lucas.souza@alphagroup.com" },
    { name: "Ana Costa", role: "Recepcionista Consultiva", department: "Pós-Vendas", status: "Ativo", email: "ana.costa@alphagroup.com" },
    { name: "Carlos Rodrigues", role: "Vendedor de Peças", department: "Peças & Acessórios", status: "Ativo", email: "carlos.rodrigues@alphagroup.com" },
    { name: "Bruna Pereira", role: "Coordenadora de Entrega", department: "Qualidade & Logística", status: "Ativo", email: "bruna.pereira@alphagroup.com" },
    { name: "Gabriel Alves", role: "Gerente Comercial Adjunto", department: "Diretoria", status: "Ativo", email: "gabriel.alves@alphagroup.com" }
  ];

  const filteredColaboradores = colaboradores.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dossiersData: Record<string, any> = {
    "João Silva": {
      name: "João Silva",
      role: "Consultor de Vendas Senior",
      department: "Comercial Novos",
      hireDate: "12/03/2021",
      experience: "8 anos de mercado automotivo premium.",
      achievements: "Recordista de margem bruta no showroom Alpha Nissan por 3 trimestres consecutivos.",
      strengths: "Excelente conversão de propostas digitais, fidelização de carteira e negociação de seminovos de entrada.",
      weaknesses: "Foco excessivo em veículos de alta gama, negligenciando ocasionalmente o giro de modelos populares.",
      impressions: "Profissional extremamente focado em metas de rentabilidade. Apresenta excelente inteligência negocial e alinhamento com a diretoria."
    },
    "Maria Santos": {
      name: "Maria Santos",
      role: "Especialista em F&I (Financiamento)",
      department: "Administração",
      hireDate: "05/01/2023",
      experience: "5 anos em finanças corporativas e crédito bancário.",
      achievements: "Aumento de 24% na penetração de financiamentos e produtos financeiros da concessionária.",
      strengths: "Relacionamento com múltiplos agentes financeiros, agilidade na aprovação de crédito de risco moderado.",
      weaknesses: "Processo operacional excessivamente manual na conferência final de contratos.",
      impressions: "Peça estratégica na manutenção de receitas de F&I. Essencial para alavancar comissões indiretas de crédito."
    },
    "Pedro Oliveira": {
      name: "Pedro Oliveira",
      role: "Consultor de Vendas Pleno",
      department: "Comercial Seminovos",
      hireDate: "19/07/2024",
      experience: "4 anos de vendas de seminovos multimarcas.",
      achievements: "Liderança de volume absoluto de vendas em maio de 2026.",
      strengths: "Altíssimo dinamismo, forte presença em mídias sociais e captação ativa de leads de varejo.",
      weaknesses: "Margem média de lucro unitário ligeiramente abaixo da média corporativa recomendada pelo método Sauron.",
      impressions: "Vendedor de alta energia e excelente entrega de volume. Precisa de orientação tática para focar em produtos com maiores margens de comissão."
    }
  };

  const selectedDossierData = dossiersData[selectedDossier] || dossiersData["João Silva"];

  return (
    <div className="space-y-5 font-sans" id="people-intelligence-container">
      
      {/* 1. Header Hero Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Users size={160} />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10 relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-600 rounded-xl text-white">
                <Users size={22} className="animate-pulse" />
              </span>
              <h1 className="text-xl font-black tracking-tight uppercase">People Intelligence Dashboard</h1>
            </div>
            <p className="text-slate-400 text-xs mt-2 max-w-2xl leading-relaxed">
              Módulo unificado de gestão operacional de faturamento por pessoa. Gerencie colaboradores, avalie a performance individual, parametrize regras e desvios de comissões, acesse dossiês profissionais e anote impressões de liderança.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Sub-Navigation Selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab("colaboradores")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "colaboradores"
              ? "bg-blue-600 text-white shadow"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <Users size={14} />
          Colaboradores
        </button>
        <button
          onClick={() => setActiveSubTab("performance")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "performance"
              ? "bg-blue-600 text-white shadow"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <TrendingUp size={14} />
          Performance Individual
        </button>
        <button
          onClick={() => setActiveSubTab("comissoes")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "comissoes"
              ? "bg-blue-600 text-white shadow"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <Coins size={14} />
          Comissões &amp; Regras
        </button>
        <button
          onClick={() => setActiveSubTab("dossies")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "dossies"
              ? "bg-blue-600 text-white shadow"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <FileText size={14} />
          Dossiês do Colaborador
        </button>
        <button
          onClick={() => setActiveSubTab("impressoes")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "impressoes"
              ? "bg-blue-600 text-white shadow"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <Lightbulb size={14} />
          Impressões de Consultoria
        </button>
      </div>

      {/* 3. Render Area Based on Active Sub-Tab */}
      <div className="min-h-[400px]">
        {/* TAB 1: COLABORADORES */}
        {activeSubTab === "colaboradores" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">Quadro de Colaboradores e Cargos</h2>
                <p className="text-xs text-slate-400 mt-0.5">Listagem unificada do corpo operacional e seus respectivos departamentos.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3">Nome</th>
                    <th className="py-2.5 px-3">Cargo</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3">E-mail</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredColaboradores.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                          {col.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        {col.name}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">{col.role}</td>
                      <td className="py-3 px-3 font-medium text-slate-500">{col.department}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-450">{col.email}</td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                          {col.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PERFORMANCE */}
        {activeSubTab === "performance" && (
          <VendedoresTab 
            dataOrigem={props.dataOrigem}
            formatCurrency={props.formatCurrency}
          />
        )}

        {/* TAB 3: COMISSOES */}
        {activeSubTab === "comissoes" && (
          <ComissoesTab 
            metrics={props.metrics}
            formatCurrency={props.formatCurrency}
            calculatedCommissions={props.calculatedCommissions}
            segmentoCliente={props.segmentoCliente}
            setSegmentoCliente={props.setSegmentoCliente}
            observacaoGerente={props.observacaoGerente}
            setObservacaoGerente={props.setObservacaoGerente}
            faturamentoOffset={props.faturamentoOffset}
            setFaturamentoOffset={props.setFaturamentoOffset}
            despesaOffset={props.despesaOffset}
            setDespesaOffset={props.setDespesaOffset}
            narrarFeedback={props.narrarFeedback}
            setNarrarFeedback={props.setNarrarFeedback}
            comissaoFormula={props.comissaoFormula}
            setComissaoFormula={props.setComissaoFormula}
            percentualComissaoBase={props.percentualComissaoBase}
            setPercentualComissaoBase={props.setPercentualComissaoBase}
            taxaComissaoAcessorios={props.taxaComissaoAcessorios}
            setTaxaComissaoAcessorios={props.setTaxaComissaoAcessorios}
            taxaComissaoPecas={props.taxaComissaoPecas}
            setTaxaComissaoPecas={props.setTaxaComissaoPecas}
            triggerSystemBackup={props.triggerSystemBackup}
            userRole={props.userRole}
          />
        )}

        {/* TAB 4: DOSSIES */}
        {activeSubTab === "dossies" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {/* Left side: Selector List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm h-fit">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Selecionar Colaborador</h3>
              <div className="space-y-1.5">
                {Object.keys(dossiersData).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDossier(key)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${
                      selectedDossier === key
                        ? "bg-blue-600 text-white font-extrabold shadow-md"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400"
                    }`}
                  >
                    <div>
                      <p className="font-extrabold truncate uppercase tracking-tight">{key}</p>
                      <p className={`text-[10px] truncate ${selectedDossier === key ? "text-blue-100" : "text-slate-400"}`}>
                        {dossiersData[key].role}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Detailed Dossier Sheet */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 relative">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    {selectedDossierData.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-tight">Dossiê: {selectedDossierData.name}</h2>
                    <p className="text-xs text-slate-400">{selectedDossierData.role} • {selectedDossierData.department}</p>
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-400">
                  <p>Admissão: <strong className="text-slate-700 dark:text-slate-300">{selectedDossierData.hireDate}</strong></p>
                  <p className="text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Perfil de Confiança Sauron</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed">
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Histórico de Mercado</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedDossierData.experience}</p>
                </div>

                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Principais Conquistas</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedDossierData.achievements}</p>
                </div>

                <div className="space-y-1.5 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-150/50">
                  <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider block">Pontos Fortes (Talentos)</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedDossierData.strengths}</p>
                </div>

                <div className="space-y-1.5 p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-150/50">
                  <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider block">Gargalos Operacionais</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedDossierData.weaknesses}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-950 rounded-xl space-y-1.5 text-xs">
                <strong className="font-extrabold uppercase text-[10px] tracking-wide block flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                  <Lightbulb size={13} />
                  Diagnóstico e Parecer Estratégico do Consultor
                </strong>
                <p className="text-slate-700 dark:text-slate-300 font-medium italic leading-relaxed">
                  "{selectedDossierData.impressions}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: IMPRESSOES */}
        {activeSubTab === "impressoes" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Lightbulb className="text-blue-500" size={18} />
              <h2 className="text-sm font-black uppercase text-slate-750 dark:text-white">Impressões Gerais sobre a Saúde Organizacional</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Alinhamento Negocial e Cultura
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  A equipe comercial demonstra alto engajamento operacional e alinhamento com os novos indicadores propostos pelo método de faturamento do Sauron. Houve adesão integral às parametrizações de bônus, reduzindo gargalos de comissões indevidas em carros populares e redirecionando esforços de venda para agregados de alta margem (ex: taxas, acessórios de embelezamento, etc.).
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-500" />
                  Gargalo de Liderança Operacional
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Detecta-se uma dispersão moderada no aproveitamento de leads digitais na ponta do varejo por vendedores juniores. A coordenação deve estabelecer pareamento semanal e auditoria ativa no funil de negociações para garantir que os benchmarks recomendados pelo plano de ação sejam mantidos.
                </p>
              </div>
            </div>

            <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-150 rounded-2xl p-4 space-y-2 text-xs">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-blue-700 dark:text-blue-450 block">Parecer de Governança Final da Consultoria</span>
              <p className="text-slate-650 dark:text-slate-350 leading-relaxed">
                As remunerações estão calibradas em total conformidade com a DRE operacional. Recomenda-se a formalização do novo modelo de comissões na ata de reunião do conselho executivo para selar as regras aprovadas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
