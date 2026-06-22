import React, { useState, useEffect, useMemo } from "react";
import { User, Sparkles, Plus, Trash2, CheckCircle2, Save, FileText, Target, HelpCircle, Eye, Sliders } from "lucide-react";
import { LancamentoFinanceiro } from "../types";

interface ConsultorAreaTabProps {
  dataOrigem: LancamentoFinanceiro[];
}

export const ConsultorAreaTab: React.FC<ConsultorAreaTabProps> = ({ dataOrigem }) => {
  // Local states loaded from localstorage or defaulted
  const [anotacoes, setAnotacoes] = useState<Record<string, string>>({});
  const [metas, setMetas] = useState<Record<string, number>>({});
  const [topicosReuniao, setTopicosReuniao] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  
  // Forms states
  const [selectedEntity, setSelectedEntity] = useState<"empresa" | "loja" | "vendedor" | "razao">("vendedor");
  const [selectedEntityValue, setSelectedEntityValue] = useState("");
  const [noteText, setNoteText] = useState("");

  const [metaKey, setMetaKey] = useState("");
  const [metaValue, setMetaValue] = useState<number | "">("");

  // Populate actual list of available items for options
  const listValues = useMemo(() => {
    if (selectedEntity === "empresa") {
      return Array.from(new Set(dataOrigem.map((d) => d.Empresa))).sort();
    } else if (selectedEntity === "loja") {
      return Array.from(new Set(dataOrigem.map((d) => d.Filial))).sort();
    } else if (selectedEntity === "razao") {
      return Array.from(new Set(dataOrigem.map((d) => d.Razão))).sort();
    } else {
      // Sellers: return a pre-defined set of 20 sellers
      return [
        "João Silva", "Maria Santos", "Pedro Oliveira", "Lucas Souza", "Ana Costa",
        "Carlos Rodrigues", "Bruna Pereira", "Gabriel Alves", "Mariana Lima", "Ricardo Santos",
        "Juliana Gomes", "Vitor Fernandes", "Renata Ribeiro", "Thiago Martins", "Amanda Barbosa",
        "Felipe Castro", "Camila Azevedo", "Guilherme Cardoso", "Larissa Melo", "Paula Carvalho"
      ].sort();
    }
  }, [dataOrigem, selectedEntity]);

  useEffect(() => {
    // Sync with default options
    if (listValues.length > 0) {
      setSelectedEntityValue(listValues[0]);
    }
  }, [listValues]);

  // Load from LocalStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("sauron_consultant_notes");
    if (savedNotes) {
      try { setAnotacoes(JSON.parse(savedNotes)); } catch(e){}
    }

    const savedMetas = localStorage.getItem("sauron_consultant_metas");
    if (savedMetas) {
      try { setMetas(JSON.parse(savedMetas)); } catch(e){}
    }

    const savedTopics = localStorage.getItem("sauron_consultant_topics");
    if (savedTopics) {
      try { setTopicosReuniao(JSON.parse(savedTopics)); } catch(e){}
    } else {
      setTopicosReuniao([
        "Apresentação dos resultados consolidados",
        "Auditoria do descompasso de custos fiscais",
        "Plano de ação imediato para reverter queda de margem"
      ]);
    }
  }, []);

  // Save notes
  const handleSaveNote = () => {
    if (!selectedEntityValue || !noteText.trim()) return;
    const key = `${selectedEntity}-${selectedEntityValue}`;
    const updated = { ...anotacoes, [key]: noteText };
    setAnotacoes(updated);
    localStorage.setItem("sauron_consultant_notes", JSON.stringify(updated));
    setNoteText("");
  };

  const handleRemoveNote = (key: string) => {
    const updated = { ...anotacoes };
    delete updated[key];
    setAnotacoes(updated);
    localStorage.setItem("sauron_consultant_notes", JSON.stringify(updated));
  };

  // Save meta override
  const handleSaveMeta = () => {
    if (!metaKey || metaValue === "") return;
    const updated = { ...metas, [metaKey]: Number(metaValue) };
    setMetas(updated);
    localStorage.setItem("sauron_consultant_metas", JSON.stringify(updated));
    setMetaKey("");
    setMetaValue("");
  };

  const handleRemoveMeta = (key: string) => {
    const updated = { ...metas };
    delete updated[key];
    setMetas(updated);
    localStorage.setItem("sauron_consultant_metas", JSON.stringify(updated));
  };

  // Topics
  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    const updated = [...topicosReuniao, newTopic];
    setTopicosReuniao(updated);
    localStorage.setItem("sauron_consultant_topics", JSON.stringify(updated));
    setNewTopic("");
  };

  const handleRemoveTopic = (idx: number) => {
    const updated = topicosReuniao.filter((_, i) => i !== idx);
    setTopicosReuniao(updated);
    localStorage.setItem("sauron_consultant_topics", JSON.stringify(updated));
  };

  return (
    <div className="space-y-4 font-sans text-slate-850 dark:text-slate-150 animate-fade-in" id="area-consultor-tab-view">
      {/* Visual Indicator of isolation */}
      <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-900 rounded-xl p-3 flex items-start gap-2.5 text-xs">
        <User className="text-amber-600 dark:text-amber-400 mt-0.5" size={16} />
        <div>
          <p className="font-extrabold text-amber-800 dark:text-amber-300">Ambiente de Simulação do Consultor (Isolado)</p>
          <p className="text-[10px] text-slate-650 leading-relaxed mt-0.5">
            Os dados alterados ou criados abaixo pertencem à camada estratégica do Consultor. Eles estão fisicamente isolados e salvos localmente na base do Sauron, garantindo que o banco original de vendas e contabilidade permaneça 100% inalterado (em conformidade com regras corporativas de compliance).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Annotations & Comments Engine (span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2 mb-3">
              <Sparkles size={14} className="text-amber-500" />
              <span>Notas de Desempenho e Hipóteses Consultivas</span>
            </h3>
            <p className="text-[10px] text-slate-500">
              Associe anotações explicativas a vendedores, contas ou filiais específicas para guiar a reunião de fechamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Entidade Alvo</label>
              <select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value as any);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-705 px-2.5 py-1.5 rounded text-[11px]"
              >
                <option value="vendedor">Vendedores</option>
                <option value="loja">Filiais / Lojas</option>
                <option value="empresa">Empresas / Grupos</option>
                <option value="razao">Razão / Eixo de Análise</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Escolher Registro</label>
              <select
                value={selectedEntityValue}
                onChange={(e) => setSelectedEntityValue(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-705 px-2.5 py-1.5 rounded text-[11px]"
              >
                {listValues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Anotação Técnica / Diagnóstico Clínico</label>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ex: Teve queda recorrente no aproveitamento de leads digitais após mudanças no rodízio de plantão do Showroom..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-705 p-3 rounded text-[11px] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveNote}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase rounded transition-colors cursor-pointer"
            >
              <Save size={11} className="inline mr-1" />
              Salvar Anotação Consultiva
            </button>
          </div>

          {/* Active notes explorer list */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Lista de Anotações Arquivadas</span>
            
            {Object.keys(anotacoes).length === 0 ? (
              <div className="text-center p-6 text-slate-405 text-xs">
                Nenhuma anotação estratégica salva. Crie-as acima para enriquecer os logs.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {Object.entries(anotacoes).map(([key, text]) => {
                  const [type, value] = key.split("-");
                  return (
                    <div key={key} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-150 dark:border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded">
                            {type}
                          </span>
                          <button
                            onClick={() => handleRemoveNote(key)}
                            className="text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">{value}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">"{text}"</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Meeting agenda and metas override (span 1) */}
        <div className="space-y-4">
          {/* Metas configurator override */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-350 flex items-center gap-1">
              <Target size={13} className="text-blue-500" />
              <span>Definição de Cenários e Metas Virtuais</span>
            </h3>
            <p className="text-[9px] text-slate-405">
              Estipule metas sobrepostas ou orçamentos personalizados para realizar cruzamento de performance.
            </p>

            <div className="space-y-2 mt-2">
              <div>
                <label className="text-[8px] font-black uppercase text-slate-500 block mb-0.5">Indicador Alvo</label>
                <select
                  value={metaKey}
                  onChange={(e) => setMetaKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 px-2.5 py-1 text-[10px]"
                >
                  <option value="">-- Escolher Alvo --</option>
                  <option value="meta-comercial">Margem Comercial Geral (%)</option>
                  <option value="ticket-medio">Ticket Médio Varejo (R$)</option>
                  <option value="conversao-leads">Aproveitamento Mínimo Leads (%)</option>
                  <option value="limite-custo">Teto de Despesa de Pessoal (R$)</option>
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black uppercase text-slate-500 block mb-0.5">Valor da Meta Simulada</label>
                <input
                  type="number"
                  value={metaValue}
                  onChange={(e) => setMetaValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ex: 45000"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 px-2.5 py-1 text-[10px]"
                />
              </div>

              <button
                onClick={handleSaveMeta}
                className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[9px] uppercase rounded"
              >
                Registrar Meta Consultor
              </button>
            </div>

            {/* List of active metas */}
            <div className="pt-2 border-t border-slate-50 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Metas em Auditoria Ativa</span>
              
              {Object.keys(metas).length === 0 ? (
                <p className="text-[9px] text-slate-450 italic">Nenhum parâmetro de meta virtual ativo no momento.</p>
              ) : (
                Object.entries(metas).map(([k, val]) => (
                  <div key={k} className="p-1.5 bg-slate-50 dark:bg-slate-850 rounded border border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-600 dark:text-slate-350">{k.replace("-", " ").toUpperCase()}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-650 dark:text-blue-400">{val.toLocaleString()}</span>
                      <button onClick={() => handleRemoveMeta(k)} className="text-slate-400 hover:text-red-500 cursor-pointer">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Topics configuration for final slide show */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-705 dark:text-slate-350 flex items-center gap-1">
              <FileText size={13} className="text-emerald-500" />
              <span>Tópicos da Próxima Reunião</span>
            </h3>

            <form onSubmit={handleAddTopic} className="flex gap-1.5">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Ex: Debater reestruturação do comissionamento..."
                className="flex-1 bg-slate-50 dark:bg-slate-850 border border-slate-205 dark:border-slate-700 px-2.5 py-1 text-[10px] rounded focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-extrabold cursor-pointer"
              >
                Adicionar
              </button>
            </form>

            <div className="space-y-1 max-h-[160px] overflow-y-auto">
              {topicosReuniao.map((t, idx) => (
                <div key={idx} className="p-1.5 bg-slate-50 dark:bg-slate-850 rounded flex items-center justify-between text-[10px] leading-tight">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {idx + 1}. {t}
                  </span>
                  <button
                    onClick={() => handleRemoveTopic(idx)}
                    className="text-slate-400 hover:text-red-550 cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memo helper
import { useMemo } from "react";
