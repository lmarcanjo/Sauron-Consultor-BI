import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Database, Layers, Save, X } from 'lucide-react';
import type { PreliminaryFinancialAnalysisArtifact } from '../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts';
import type { ModuleActivationProjection, ModuleConfigurationRecord, ModuleId } from '../core/module-activation';
import { moduleConfigurationContextFromArtifact, moduleConfigurationService } from '../core/module-activation';

interface ModuleActivationWizardProps {
  moduleId: ModuleId;
  moduleLabel: string;
  engagementId: string;
  dataSourceId: string;
  currentUserId: string;
  artifact: PreliminaryFinancialAnalysisArtifact;
  projection: ModuleActivationProjection;
  onSaved: (configuration: ModuleConfigurationRecord) => void;
  onClose: () => void;
}

const STEPS = ['Fonte', 'Campos encontrados', 'Associação', 'Métricas', 'Dimensões', 'Filtros', 'Revisão', 'Ativar'];

export const ModuleActivationWizard: React.FC<ModuleActivationWizardProps> = ({
  moduleId,
  moduleLabel,
  engagementId,
  dataSourceId,
  currentUserId,
  artifact,
  projection,
  onSaved,
  onClose,
}) => {
  const [step, setStep] = useState(0);
  const initialFields = useMemo(() => Array.from(new Set(
    projection.requirements
      .filter(requirement => requirement.status === 'SATISFIED')
      .flatMap(requirement => requirement.matchingPhysicalFields)
  )), [projection.requirements]);
  const [selectedFields, setSelectedFields] = useState<string[]>(initialFields);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([...projection.availableMetrics]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([...projection.availableDimensions]);
  const [savedConfiguration, setSavedConfiguration] = useState<ModuleConfigurationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const activate = async () => {
    setError(null);
    try {
      const saved = await moduleConfigurationService.saveConfiguration({
        moduleId,
        engagementId,
        dataSourceId,
        schemaVersionNumber: artifact.schemaVersionNumber,
        selectedFields,
        selectedMetrics,
        selectedDimensions,
        createdBy: currentUserId,
        sourceFingerprint: moduleConfigurationContextFromArtifact(moduleId, artifact).sourceFingerprint,
      });
      setSavedConfiguration(saved);
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a configuração.');
    }
  };

  const renderStep = () => {
    if (step === 0) {
      return <div className="space-y-3"><p className="text-sm text-slate-200">A configuração será aplicada somente à fonte abaixo.</p><div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"><div className="flex items-center gap-2 text-sm font-bold"><Database size={15} className="text-emerald-400" />{artifact.sourceFileName}</div><p className="text-xs text-slate-400 mt-2">Engajamento: {engagementId} · {artifact.columnCount} campos · {artifact.dataRowCount.toLocaleString('pt-BR')} registros</p></div></div>;
    }
    if (step === 1) {
      return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{projection.requirements.map(requirement => <div key={requirement.requirementId} className="rounded-lg border border-slate-700 bg-slate-800/60 p-3"><p className="text-xs font-bold text-white">{requirement.label}</p><p className="text-[11px] text-slate-400 mt-1">{requirement.status === 'SATISFIED' ? requirement.matchingPhysicalFields.join(', ') : requirement.status === 'MISSING' ? 'Não identificado na fonte' : 'Opcional'}</p></div>)}</div>;
    }
    if (step === 2) {
      return <OptionList title="Escolha os campos que alimentam o módulo" options={initialFields} selected={selectedFields} onToggle={value => toggle(setSelectedFields, value)} />;
    }
    if (step === 3) {
      return <OptionList title="Métricas disponíveis na análise" options={projection.availableMetrics} selected={selectedMetrics} onToggle={value => toggle(setSelectedMetrics, value)} />;
    }
    if (step === 4) {
      return <OptionList title="Dimensões disponíveis na análise" options={projection.availableDimensions} selected={selectedDimensions} onToggle={value => toggle(setSelectedDimensions, value)} emptyLabel="Nenhuma dimensão agregada foi encontrada." />;
    }
    if (step === 5) {
      return <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"><p className="text-sm font-semibold text-white">Filtros</p><p className="text-xs text-slate-400 mt-1">Nenhum filtro foi definido. O módulo começará com todos os registros da fonte.</p></div>;
    }
    if (step === 6) {
      return <div className="space-y-3"><p className="text-sm text-slate-200">Revise a configuração antes de ativar.</p><SummaryRow label="Campos" value={selectedFields.join(', ') || 'Nenhum selecionado'} /><SummaryRow label="Métricas" value={selectedMetrics.join(', ') || 'Nenhuma'} /><SummaryRow label="Dimensões" value={selectedDimensions.join(', ') || 'Nenhuma'} /></div>;
    }
    return savedConfiguration ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5"><p className="flex items-center gap-2 text-emerald-300 font-bold"><Check size={16} /> {moduleLabel} ativado para esta fonte.</p><p className="text-xs text-emerald-200/70 mt-2">A configuração foi salva e será recuperada após recarregar a aplicação.</p></div> : <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5"><p className="text-sm font-semibold text-white">Pronto para ativar {moduleLabel}.</p><p className="text-xs text-slate-300 mt-1">A fonte original não será alterada.</p></div>;
  };

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="module-activation-title" data-testid="module-activation-wizard">
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-800 p-5"><div><p className="text-[10px] uppercase tracking-widest text-indigo-300">Configuração do módulo</p><h2 id="module-activation-title" className="text-lg font-black mt-1">Ativar {moduleLabel}</h2></div><button type="button" onClick={onClose} aria-label="Fechar configuração" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"><X size={18} /></button></header>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800 px-5 py-3">{STEPS.map((label, index) => <span key={label} className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${index === step ? 'bg-indigo-600 text-white' : index < step ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>{index + 1}. {label}</span>)}</div>
      <main className="space-y-5 p-5"><div className="min-h-[180px]">{renderStep()}</div>{error && <p role="alert" className="rounded-lg bg-rose-950/30 border border-rose-500/30 p-3 text-xs text-rose-200">{error}</p>}<footer className="flex justify-between gap-3 border-t border-slate-800 pt-4"><button type="button" onClick={() => setStep(current => Math.max(0, current - 1))} disabled={step === 0 || Boolean(savedConfiguration)} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 disabled:opacity-40"><ArrowLeft size={14} /> Voltar</button>{savedConfiguration ? <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white"><Check size={14} /> Concluir</button> : step === STEPS.length - 1 ? <button type="button" onClick={() => void activate()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white"><Save size={14} /> Ativar módulo</button> : <button type="button" onClick={() => setStep(current => Math.min(STEPS.length - 1, current + 1))} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white">Avançar <ArrowRight size={14} /></button>}</footer></main>
    </div>
  </div>;
};

const OptionList: React.FC<{ title: string; options: readonly string[]; selected: readonly string[]; onToggle: (value: string) => void; emptyLabel?: string }> = ({ title, options, selected, onToggle, emptyLabel = 'Nenhum campo encontrado.' }) => <div className="space-y-3"><p className="text-sm font-semibold text-white">{title}</p>{options.length === 0 ? <p className="text-xs text-slate-400">{emptyLabel}</p> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{options.map(option => <label key={option} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-xs font-bold text-slate-200"><input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />{option}</label>)}</div>}</div>;
const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3"><span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span><p className="text-xs font-semibold text-slate-200 mt-1 break-words">{value}</p></div>;
