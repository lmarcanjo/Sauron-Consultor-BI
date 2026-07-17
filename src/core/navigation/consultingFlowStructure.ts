/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Users, Database, Presentation, MonitorPlay, Settings, Briefcase, FolderOpen, Building,
  ShieldCheck, BarChart3, Target, FileText, BrainCircuit, Calculator,
  Network, ShieldAlert, ClipboardList, CheckSquare, History, Key, Layers, Lock, TrendingUp
} from 'lucide-react';
import { ModuleCapabilityState } from "./moduleCapabilities";

export interface ConsultingSubItem {
  title: string;
  id: string;
  icon: any;
  availability?: ModuleCapabilityState;
}

export interface ConsultingGroup {
  groupKey: string;
  title: string;
  icon: any;
  subItems: ConsultingSubItem[];
}

export interface ConsultingStructureOptions {
  domainId?: string;
  terminology?: Record<string, string>;
  capabilities?: Record<string, ModuleCapabilityState>;
}

/**
 * Returns the structured menu matching the 9 flows of consulting.
 * Removes segment-specific terminology from defaults, using neutral terms unless specified.
 * Supports legacy boolean argument for backward compatibility in tests.
 */
export function getConsultingFlowStructure(options?: ConsultingStructureOptions | boolean): ConsultingGroup[] {
  let domainId = "neutral";
  let terminology: Record<string, string> = {};

  if (typeof options === "boolean") {
    domainId = options ? "automotive" : "neutral";
  } else if (options) {
    domainId = options.domainId || "neutral";
    terminology = options.terminology || {};
  }

  // Custom term resolutions if provided, otherwise neutral defaults
  const orgTerm = terminology.organization || "Organização";
  const groupTerm = terminology.group || "Grupo";
  const empTerm = terminology.enterprise || "Empresa";
  const unitTerm = terminology.unit || "Unidade";

  const structure: ConsultingGroup[] = [
    {
      groupKey: "centro_comando",
      title: "Centro de Comando",
      icon: Briefcase,
      subItems: [
        { title: "Empresas e Grupos", id: "enterprise_center", icon: Building },
        { title: "Centro de Comando", id: "executive_workspace", icon: Briefcase }
      ]
    },
    {
      groupKey: "conhecer_cliente",
      title: "Conhecer Cliente",
      icon: Users,
      subItems: [
        { title: "Gêmeo Digital", id: "digital_twin", icon: Network },
        { title: "Projetos de Consultoria", id: "area_consultor", icon: FolderOpen }
      ]
    },
    {
      groupKey: "conectar_dados",
      title: "Conectar Dados",
      icon: Database,
      subItems: [
        { title: "Importar Planilhas", id: "importacao", icon: FileText },
        { title: "Biblioteca de Planilhas", id: "biblioteca_workbooks", icon: FolderOpen }
      ]
    },
    {
      groupKey: "diagnosticar_negocio",
      title: "Diagnosticar Negócio",
      icon: Target,
      subItems: [
        { title: "Diagnóstico Executivo", id: "resumo", icon: BarChart3 },
        { title: "KPIs & DRE", id: "dre_inteligente", icon: Target },
        { title: "Financeiro", id: "financeiro", icon: Calculator },
        { title: "Comercial", id: "comercial", icon: TrendingUp },
        { title: "Anomalias", id: "obstaculos", icon: ShieldAlert },
        { title: "Recomendações", id: "consultor_ia", icon: BrainCircuit },
        { title: "Dossiês", id: "relatorios", icon: FileText }
      ]
    },
    {
      groupKey: "preparar_decisao",
      title: "Preparar Decisão",
      icon: Presentation,
      subItems: [
        { title: "Narrativa Executiva", id: "narrativa_executiva", icon: FileText },
        { title: "Decks", id: "apresentacoes", icon: Presentation },
        { title: "Templates", id: "apresentacoes_templates", icon: Layers }
      ]
    },
    {
      groupKey: "conduzir_sessao",
      title: "Conduzir Sessão",
      icon: MonitorPlay,
      subItems: [
        { title: "Preparação da Reunião", id: "preparacao_reuniao", icon: ClipboardList },
        { title: "Sessão Executiva", id: "modo_reuniao", icon: MonitorPlay },
        { title: "Ata & Decisões", id: "reuniao_ata", icon: ClipboardList },
        { title: "Notas", id: "reuniao_notes", icon: FileText }
      ]
    },
    {
      groupKey: "executar_plano",
      title: "Executar Plano",
      icon: CheckSquare,
      subItems: [
        { title: "Plano Executivo", id: "plano_executivo", icon: CheckSquare },
        { title: "Responsáveis & Prazos", id: "plano_responsaveis", icon: Users },
        { title: "People Intelligence", id: "comissoes", icon: Users }
      ]
    },
    {
      groupKey: "evoluir_resultado",
      title: "Evoluir Resultado",
      icon: History,
      subItems: [
        { title: "Histórico", id: "historico_executivo", icon: History },
        { title: "Comparativos", id: "comparativos_mensais", icon: Layers },
        { title: "Evolução", id: "fechamento_mensal", icon: Calculator }
      ]
    },
    {
      groupKey: "administracao",
      title: "Administração",
      icon: Settings,
      subItems: [
        { title: "Usuários", id: "usuarios_twin", icon: Users },
        { title: "Organizações", id: "organizacao_twin", icon: ShieldCheck },
        { title: "Permissões", id: "permissões_twin", icon: Key },
        { title: "Configurações", id: "perfis", icon: Settings },
        { title: "Auditoria", id: "auditoria_logs", icon: History },
        { title: "Segurança", id: "admin_security", icon: Lock }
      ]
    }
  ];

  return structure.map(group => ({
    ...group,
    subItems: group.subItems.map(item => ({
      ...item,
      availability: options && typeof options !== "boolean" ? options.capabilities?.[item.id] : undefined,
    })),
  }));
}
