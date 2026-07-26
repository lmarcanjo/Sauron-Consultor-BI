/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Edit3,
  Eye,
  HelpCircle,
  Info,
  Layers,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { FieldInterpretation, SourceDrivenAnalysis } from "../core/chaos-data-profiling";

interface SourceDrivenInterpretationPanelProps {
  analysis: SourceDrivenAnalysis;
  onConfirmAllSuggested: () => void;
  onKeepOriginalNames: () => void;
  onUpdateInterpretation?: (fieldId: string, updatedMeaning: string) => void;
}

export const SourceDrivenInterpretationPanel: React.FC<SourceDrivenInterpretationPanelProps> = ({
  analysis,
  onConfirmAllSuggested,
  onKeepOriginalNames,
  onUpdateInterpretation,
}) => {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showEvidenceFieldId, setShowEvidenceFieldId] = useState<string | null>(null);

  const handleStartEdit = (field: FieldInterpretation) => {
    setEditingFieldId(field.fieldId);
    setEditingText(field.suggestedMeaning || field.suggestedLabel || "");
  };

  const handleSaveEdit = (fieldId: string) => {
    if (onUpdateInterpretation) {
      onUpdateInterpretation(fieldId, editingText);
    }
    setEditingFieldId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-6 shadow-sm" data-testid="source-driven-interpretation-panel">
      {/* 1. O QUE ENCONTRAMOS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Database size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            1. O que encontramos na fonte ({analysis.sourceName})
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Registros físicos</span>
            <strong className="block text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {analysis.totalRecords.toLocaleString("pt-BR")}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Campos físicos</span>
            <strong className="block text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {analysis.totalFields}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Estruturas / Abas</span>
            <strong className="block text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {analysis.structures.length}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Interpretações preparadas</span>
            <strong className="block text-sm font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
              {analysis.interpretations.length}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. CAMPOS DA FONTE — PARTINDO DE PHYSICALNAME */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            2. Campos originais e sugestão de interpretação
          </h4>
          <span className="text-[10px] text-slate-400 font-medium">O campo físico permanece imutável</span>
        </div>

        <div className="max-h-96 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
          {analysis.interpretations.map(field => (
            <div key={field.fieldId} className="p-3.5 text-xs bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {field.physicalName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">({field.originalType})</span>
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                    {Math.round(field.confidence * 100)}% confiança
                  </span>
                </div>

                {editingFieldId === field.fieldId ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      placeholder="Escreva a interpretação livre..."
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(field.fieldId)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px]"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    {field.suggestedMeaning || <span className="text-slate-400 italic">Sem interpretação atribuída (manter nome original)</span>}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEvidenceFieldId(curr => curr === field.fieldId ? null : field.fieldId)}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {showEvidenceFieldId === field.fieldId ? "Ocultar evidências" : "Evidências"}
                </button>

                <button
                  type="button"
                  onClick={() => handleStartEdit(field)}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1"
                >
                  <Edit3 size={12} /> Editar
                </button>
              </div>

              {showEvidenceFieldId === field.fieldId && (
                <div className="w-full mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  {field.evidence.map((ev, idx) => (
                    <p key={idx}>• {ev}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. ESTRUTURAS ENCONTRADAS */}
      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          3. Estruturas organizacionais encontradas
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analysis.structures.map(struct => (
            <div key={struct.structureId} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-1">
              <strong className="text-xs font-bold text-slate-800 dark:text-slate-100">{struct.title}</strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{struct.probableDomain} · {struct.recordCount.toLocaleString("pt-BR")} registros</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. AÇÕES DE CONFIRMAÇÃO */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <button
          type="button"
          onClick={onKeepOriginalNames}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
        >
          <RotateCcw size={14} /> Continuar com nomes originais
        </button>

        <button
          type="button"
          onClick={onConfirmAllSuggested}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-2"
        >
          <CheckCircle2 size={16} /> Confirmar visão interpretada
        </button>
      </div>
    </div>
  );
};

export default SourceDrivenInterpretationPanel;
