/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MessageSquare, Sparkles, CheckCircle2, RefreshCw, Send, ChevronRight, HelpCircle, Layers, HelpCircle as QuestionIcon } from "lucide-react";
import { BLUEPRINTS, PREDEFINED_QUESTIONS, projectDNAManager, ProjectDNA, PredefinedQuestion } from "../core/business-intelligence/ProjectDNA";

interface SauronArchitectPanelProps {
  workspaceId: string;
  companyId?: string;
  onApplied?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "assistant" | "user";
  text: string;
  options?: Array<{ label: string; value: string }>;
}

export const SauronArchitectPanel: React.FC<SauronArchitectPanelProps> = ({
  workspaceId,
  companyId,
  onApplied
}) => {
  const [step, setStep] = useState<"welcome" | "blueprint" | "questions" | "terminology" | "confirm">("welcome");
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("financeiro");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(["q_seller_sales"]);
  const [customTerminology, setCustomTerminology] = useState<Record<string, string>>({
    people: "Colaboradores",
    commission: "Comissões"
  });

  const handleApplyDNA = () => {
    const blueprint = BLUEPRINTS.find(b => b.id === selectedBlueprintId) || BLUEPRINTS[0];
    
    // Build custom metrics based on answered questions
    const customMetrics = PREDEFINED_QUESTIONS.filter(q => selectedQuestions.includes(q.id)).map(q => {
      // Find the physical column matching the expected role from active fields, or fallback
      let fieldId = q.expectedFieldRole; // fallback to expected role name
      try {
        const rawConfig = localStorage.getItem(`sauron_consulting_model_${workspaceId}_${companyId || "group_default"}`);
        if (rawConfig) {
          const config = JSON.parse(rawConfig);
          // Look for a field mapped to the expected role
          const found = Object.values(config.selectedFields || {}).find((f: any) => f.use === "group_results" || f.detectedType === "numeric");
          if (found) {
            fieldId = (found as any).physicalName;
          }
        }
      } catch (e) {}

      return {
        id: `custom_metric_${q.id}`,
        name: q.text,
        fieldId,
        operation: q.targetOperation,
        format: q.format,
        visibleIn: ["dashboard", "presentation", "meeting"]
      };
    });

    const dna: ProjectDNA = {
      projectId: `${workspaceId}_${companyId || "default"}`,
      consultingMethod: blueprint.name,
      terminology: {
        ...blueprint.terminology,
        ...customTerminology
      },
      visualIdentity: blueprint.visualIdentity,
      businessAreas: blueprint.businessAreas,
      presentationStyle: "clean",
      meetingStyle: "formal",
      permissions: ["READ", "WRITE"],
      customMetrics,
      customDashboards: [],
      customReports: [],
      aiBehavior: "analytical"
    };

    projectDNAManager.saveDNA(dna);
    if (onApplied) onApplied();
    setStep("welcome"); // reset for next use
  };

  return (
    <div className="bg-slate-950/40 dark:bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Visual Orbital Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">SAURON Architect</h3>
            <p className="text-[10px] font-semibold text-slate-500">Desenhe o DNA estratégico do seu projeto</p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Plataforma de Consultoria
        </span>
      </div>

      {/* Chat Container */}
      <div className="p-5 min-h-[300px] flex flex-col justify-between">
        
        {/* Welcome Step */}
        {step === "welcome" && (
          <div className="space-y-4 my-auto text-center py-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/5 border border-blue-500/15 flex items-center justify-center mx-auto text-blue-400">
              <MessageSquare size={24} />
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h4 className="text-sm font-black text-slate-200 uppercase tracking-wide">Construa o DNA do Projeto</h4>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                Olá! Sou o assistente de configuração. Juntos vamos desenhar as áreas, perguntas chave e visual do projeto do seu cliente de forma personalizada.
              </p>
            </div>
            <button
              onClick={() => setStep("blueprint")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-900/20 cursor-pointer"
            >
              <span>Vamos começar</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Step 1: Industry Blueprint selection */}
        {step === "blueprint" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-blue-400 font-bold">Passo 1 de 4</span>
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Que tipo de empresa ou metodologia analisaremos?</h4>
              <p className="text-[10px] font-semibold text-slate-500">Isso define o escopo inicial e sugestões de áreas.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BLUEPRINTS.map(bp => (
                <button
                  key={bp.id}
                  onClick={() => setSelectedBlueprintId(bp.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedBlueprintId === bp.id
                      ? "border-blue-500 bg-blue-500/5 text-blue-300"
                      : "border-slate-800 bg-slate-900/20 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <Layers size={16} className="mt-0.5 shrink-0 text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">{bp.name}</p>
                    <p className="text-[10px] leading-relaxed mt-1 text-slate-500">{bp.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep("questions")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                <span>Próximo</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Selecting Business Questions */}
        {step === "questions" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-blue-400 font-bold">Passo 2 de 4</span>
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Quais perguntas de negócio deseja responder?</h4>
              <p className="text-[10px] font-semibold text-slate-500">Selecione as metas cruciais para o dashboard e relatórios.</p>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {PREDEFINED_QUESTIONS.map(q => {
                const isSelected = selectedQuestions.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestions(prev => isSelected ? prev.filter(id => id !== q.id) : [...prev, q.id])}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/5 text-blue-300"
                        : "border-slate-850 bg-slate-900/10 hover:border-slate-800 text-slate-400"
                    }`}
                  >
                    <QuestionIcon size={14} className="mt-0.5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">{q.text}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{q.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep("blueprint")}
                className="text-[11px] font-black uppercase text-slate-500 hover:text-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep("terminology")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                <span>Próximo</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Terminology */}
        {step === "terminology" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-blue-400 font-bold">Passo 3 de 4</span>
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Como deseja chamar os conceitos no menu lateral?</h4>
              <p className="text-[10px] font-semibold text-slate-500">Defina nomes familiares para o seu cliente.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Pessoas / Equipe</label>
                <input
                  type="text"
                  value={customTerminology.people}
                  onChange={(e) => setCustomTerminology(prev => ({ ...prev, people: e.target.value }))}
                  placeholder="Ex: Consultores, Vendedores, Produtores"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/20 px-3 py-2 text-xs text-slate-100 font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Comissão / Remuneração</label>
                <input
                  type="text"
                  value={customTerminology.commission}
                  onChange={(e) => setCustomTerminology(prev => ({ ...prev, commission: e.target.value }))}
                  placeholder="Ex: Incentivos, Prêmio de Produção, Bônus"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/20 px-3 py-2 text-xs text-slate-100 font-bold focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep("questions")}
                className="text-[11px] font-black uppercase text-slate-500 hover:text-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                <span>Revisar</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Apply */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase text-blue-400 font-bold">Passo 4 de 4</span>
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Tudo pronto para desenhar o DNA!</h4>
              <p className="text-[10px] font-semibold text-slate-500">Revise a configuração do projeto antes de homologar.</p>
            </div>

            <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-850 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Metodologia:</span>
                <span className="font-bold text-slate-300">{BLUEPRINTS.find(b => b.id === selectedBlueprintId)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dicionário customizado:</span>
                <span className="font-bold text-slate-300">
                  {customTerminology.people} &bull; {customTerminology.commission}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Perguntas a responder:</span>
                <span className="font-bold text-slate-300">{selectedQuestions.length} habilitadas</span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep("terminology")}
                className="text-[11px] font-black uppercase text-slate-500 hover:text-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={handleApplyDNA}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-750 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-900/20 cursor-pointer"
              >
                <CheckCircle2 size={13} />
                <span>Aplicar DNA ao Projeto</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default SauronArchitectPanel;
