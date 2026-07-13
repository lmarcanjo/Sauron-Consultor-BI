/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sparkles,
  Info,
  Layers,
  Component,
  Database,
  ArrowRight,
  Plus,
  Play,
  Settings,
  Trash2,
} from "lucide-react";
import { SauronButton } from "../sauron-sdk/ui/SauronButton";
import { showToast } from "./Toast";
import { SauronCard } from "../sauron-sdk/ui/SauronCard";
import { SauronBadge } from "../sauron-sdk/ui/SauronBadge";
import { SauronInput } from "../sauron-sdk/ui/SauronInput";
import { SauronSelect } from "../sauron-sdk/ui/SauronSelect";
import { SauronTextarea } from "../sauron-sdk/ui/SauronTextarea";
import { SauronTable } from "../sauron-sdk/ui/SauronTable";
import { SauronTabs } from "../sauron-sdk/ui/SauronTabs";
import { SauronTooltip } from "../sauron-sdk/ui/SauronTooltip";
import { SauronEmptyState } from "../sauron-sdk/ui/SauronEmptyState";
import { SauronSkeleton } from "../sauron-sdk/ui/SauronSkeleton";
import { SauronKpiCard } from "../sauron-sdk/ui/SauronKpiCard";
import { SauronMetric } from "../sauron-sdk/ui/SauronMetric";
import { SauronTimeline } from "../sauron-sdk/ui/SauronTimeline";
import { SauronProgress } from "../sauron-sdk/ui/SauronProgress";
import { SauronCommandItem } from "../sauron-sdk/ui/SauronCommandItem";
import { SauronDrawer } from "../sauron-sdk/ui/SauronDrawer";

// Domain components
import { SauronCaseHeader } from "../sauron-sdk/domain/SauronCaseHeader";
import { SauronCaseBreadcrumb } from "../sauron-sdk/domain/SauronCaseBreadcrumb";
import { SauronExecutiveBrief } from "../sauron-sdk/domain/SauronExecutiveBrief";
import { SauronDecisionCard } from "../sauron-sdk/domain/SauronDecisionCard";
import { SauronActionCard } from "../sauron-sdk/domain/SauronActionCard";
import { SauronChapterCard } from "../sauron-sdk/domain/SauronChapterCard";
import { SauronMeetingNote } from "../sauron-sdk/domain/SauronMeetingNote";
import { SauronAgendaItem } from "../sauron-sdk/domain/SauronAgendaItem";
import { SauronDataStatus } from "../sauron-sdk/domain/SauronDataStatus";
import { SauronLineageBadge } from "../sauron-sdk/domain/SauronLineageBadge";
import { SauronUserContext } from "../sauron-sdk/domain/SauronUserContext";
import { SauronPermissionBadge } from "../sauron-sdk/domain/SauronPermissionBadge";
import { SauronPeopleCard } from "../sauron-sdk/domain/SauronPeopleCard";
import { SauronDossierSection } from "../sauron-sdk/domain/SauronDossierSection";

export interface SDLStudioProps {
  onExit?: () => void;
}

export const SDLStudio: React.FC<SDLStudioProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState("primitives");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [progressVal, setProgressVal] = useState(65);

  const mockTableData = [
    { id: "1", client: "Alpha Nissan", city: "Feira de Santana", status: "Crítico" },
    { id: "2", client: "Safira Calçados", city: "Campina Grande", status: "Sincronizado" },
    { id: "3", client: "Grupo Arcanjo", city: "Salvador", status: "Pendente" },
  ];

  const mockTimelineEvents = [
    { id: "1", title: "Ritual de Abertura Concluído", timestamp: "10:15", description: "Alinhamento de cronograma de auditoria" },
    { id: "2", title: "Análise de CMVs e Faturamento", timestamp: "11:30", description: "Identificação de anomalias na filial Feira de Santana" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Dev Tools / Super Admin
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white uppercase font-sans flex items-center gap-2">
            <Component size={24} className="text-blue-600" />
            Sauron Design Language Studio (SDL)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans max-w-2xl leading-relaxed">
            Catálogo interativo oficial contendo todos os primitivos de interface e componentes de domínio do Sauron OS. Use-os para estender telas e manter conformidade arquitetural absoluta.
          </p>
        </div>
        {onExit && (
          <SauronButton variant="outline" size="sm" onClick={onExit}>
            Sair do Studio
          </SauronButton>
        )}
      </div>

      {/* Selector Tabs */}
      <SauronTabs
        activeTabId={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: "primitives", label: "UI Primitives" },
          { id: "domain", label: "Domain Components" },
          { id: "interactive", label: "Interactive Tests" },
        ]}
      />

      {activeTab === "primitives" && (
        <div className="space-y-10">
          {/* Section: Buttons */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              1. Buttons (SauronButton)
            </h2>
            <div className="flex flex-wrap gap-3">
              <SauronButton variant="filled">Filled (Primary)</SauronButton>
              <SauronButton variant="outline">Outline (Secondary)</SauronButton>
              <SauronButton variant="ghost">Ghost (Neutral)</SauronButton>
              <SauronButton variant="success">Success</SauronButton>
              <SauronButton variant="danger">Danger</SauronButton>
              <SauronButton variant="filled" size="sm">Small size</SauronButton>
              <SauronButton variant="filled" loading>Loading Button</SauronButton>
              <SauronButton variant="filled" disabled>Disabled Button</SauronButton>
            </div>
          </div>

          {/* Section: Badges */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              2. Badges (SauronBadge)
            </h2>
            <div className="flex flex-wrap gap-2">
              <SauronBadge type="primary">Primary Badge</SauronBadge>
              <SauronBadge type="success">Success Badge</SauronBadge>
              <SauronBadge type="warning">Warning Badge</SauronBadge>
              <SauronBadge type="danger">Danger Badge</SauronBadge>
              <SauronBadge type="neutral">Neutral Badge</SauronBadge>
            </div>
          </div>

          {/* Section: Cards */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              3. Cards (SauronCard)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SauronCard
                title="Card Padrão"
                subtitle="Exemplo de cabeçalho unificado"
                actions={<SauronBadge type="success">Ativo</SauronBadge>}
              >
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                  Os cards do Sauron OS possuem espaçamentos proporcionais estruturados, cantos arredondados amplos (2xl) e divisórias extremamente discretas.
                </p>
              </SauronCard>
              <SauronCard
                title="Card de Carregamento"
                subtitle="Estado de skeleton nativo"
                loading
              >
                Este conteúdo não será visível pois o card está em modo de carregamento.
              </SauronCard>
            </div>
          </div>

          {/* Section: Forms */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              4. Form Fields (Inputs, Selects, Textareas)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SauronInput
                label="Nome do Consultor"
                placeholder="Ex: Lennon Marcanjo"
                helperText="Digite seu nome completo conforme cadastro"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <SauronInput
                label="Faturamento Mínimo"
                placeholder="Campo com erro de validação"
                error
                errorMessage="Faturamento deve ser maior que zero."
              />
              <SauronSelect
                label="Selecione o Ritual"
                options={[
                  { value: "reuniao", label: "Sessão de Comitê" },
                  { value: "auditoria", label: "Análise DRE" },
                ]}
                helperText="Escolha a estrutura de reunião ativa"
              />
            </div>
            <div className="w-full">
              <SauronTextarea
                label="Observações Finais"
                placeholder="Insira as minutas táticas da sessão executiva aqui..."
              />
            </div>
          </div>

          {/* Section: Tables */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              5. Tables (SauronTable)
            </h2>
            <SauronTable
              data={mockTableData}
              keyExtractor={(r) => r.id}
              columns={[
                { header: "ID", accessor: (r) => <span className="font-mono">{r.id}</span> },
                { header: "Cliente", accessor: (r) => <strong className="font-bold">{r.client}</strong> },
                { header: "Cidade", accessor: (r) => <span>{r.city}</span> },
                {
                  header: "Status",
                  accessor: (r) => (
                    <SauronBadge type={r.status === "Crítico" ? "danger" : r.status === "Sincronizado" ? "success" : "warning"}>
                      {r.status}
                    </SauronBadge>
                  ),
                },
              ]}
              actionsBuilder={(r) => (
                <div className="flex gap-1">
                  <SauronButton variant="outline" size="sm">
                    Ver
                  </SauronButton>
                </div>
              )}
            />
          </div>

          {/* Section: Tooltips, Progress, Timelines */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              6. Visual Indicators (Progress, Timeline, Tooltip, CommandItem)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SauronCard title="Indicador de Progresso e Tooltip">
                <div className="space-y-5">
                  <SauronProgress value={progressVal} label="Progresso de Resolução Tática" />
                  <div className="flex gap-4 items-center">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-450">Passe o mouse no indicador:</span>
                    <SauronTooltip content="Alerta: 3 planos em atraso">
                      <SauronBadge type="danger">Verificar Anomalias</SauronBadge>
                    </SauronTooltip>
                  </div>
                </div>
              </SauronCard>

              <SauronCard title="Timeline de Auditoria">
                <SauronTimeline events={mockTimelineEvents} />
              </SauronCard>
            </div>
          </div>
        </div>
      )}

      {activeTab === "domain" && (
        <div className="space-y-10">
          {/* Case Header & Breadcrumb */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              1. Case Header & Breadcrumbs
            </h2>
            <SauronCaseBreadcrumb paths={["Casos", "Auditoria", "Grupo Sauron"]} />
            <SauronCaseHeader
              title="Grupo Sauron Concessionárias"
              category="Caso Estratégico"
              status="active"
              onActionClick={() => {}}
              actionLabel="Abrir Dossiê"
            />
          </div>

          {/* Executive Brief */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              2. Executive Brief
            </h2>
            <SauronExecutiveBrief
              objective="Recuperação de 3.5% na Margem de Peças até Dezembro de 2026."
              scope="Reestruturação de canais de suprimentos, alteração de comissionamento de vendas e auditoria de compras de giro."
              nextRitual="28/06/2026 15:30 - Comitê de Resultados"
            />
          </div>

          {/* Decision and Action Cards */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              3. Decision & Action Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SauronDecisionCard
                description="Reduzir a comissão de novos veículos Nissan de 1.5% para 1% para balancear EBITDA."
                responsible="Ana Cláudia (Diretoria)"
                meetingTitle="Ritual de Comitê Semanal"
                timestamp="Hoje 14:15"
              />
              <SauronActionCard
                description="Negociar reajuste de taxa fixa de pós-venda com a montadora."
                responsible="Carlos Henrique"
                deadline="30/06/2026"
                priority="high"
                status="in_progress"
              />
            </div>
          </div>

          {/* Data Status & Lineage */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              4. Data Status & Lineage Badges
            </h2>
            <div className="space-y-3">
              <SauronDataStatus
                sourceType="spreadsheet"
                isLocked={true}
                onRefresh={() => showToast("info", "Sincronizando planilha...")}
              />
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Rastreamento de Origem do EBITDA:</span>
                <SauronLineageBadge sourceCell="F28" sheetName="DRE Consolidador" />
              </div>
            </div>
          </div>

          {/* Security & Identity Simulation */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
              5. Security and Simulation Context
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SauronUserContext
                name="Maria Convidada"
                role="Guest"
                organization="Grupo Sauron Nissan"
              />
              <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase block font-mono">
                  Matriz de Autorizações Ativas
                </span>
                <div className="flex gap-2">
                  <SauronPermissionBadge permission="workspace.view" isGranted={true} />
                  <SauronPermissionBadge permission="data.import" isGranted={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "interactive" && (
        <div className="space-y-6">
          <SauronCard title="Teste de Gaveta de Contexto" subtitle="Interação em tempo real do Drawer">
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                Clique no botão abaixo para abrir o <strong>SauronDrawer</strong>. O componente Drawer gerencia o backdrop desfocado, foco de teclado, fechamento ao clicar fora e na tecla Escape nativamente.
              </p>
              <SauronButton variant="filled" onClick={() => setIsDrawerOpen(true)}>
                <Play size={12} /> Testar Abertura de Drawer
              </SauronButton>
            </div>
          </SauronCard>

          <SauronDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Dossiê Grupo Sauron"
            subtitle="Detalhamento operacional da holding"
            footer={
              <div className="flex gap-2">
                <SauronButton variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                  Voltar
                </SauronButton>
                <SauronButton variant="filled" onClick={() => {
                  showToast("success", "Ação executada com sucesso.");
                  setIsDrawerOpen(false);
                }}>
                  Sincronizar
                </SauronButton>
              </div>
            }
          >
            <div className="space-y-6">
              <SauronUserContext name="Lennon Marcanjo" role="Super Admin" organization="Sauron Platform" />
              <SauronExecutiveBrief
                objective="Análise de DRE e CMVs com metas de EBITDA."
                scope="Auditoria financeira corporativa."
              />
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase font-mono block">
                  Ações de Auditoria
                </span>
                <SauronCommandItem icon={<Settings size={14} />}>Configurar Linhas de Metas</SauronCommandItem>
                <SauronCommandItem icon={<Trash2 size={14} />} disabled>Deletar Históricos</SauronCommandItem>
              </div>
            </div>
          </SauronDrawer>
        </div>
      )}
    </div>
  );
};
