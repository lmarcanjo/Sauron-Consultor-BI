/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Users, Database, Presentation, MonitorPlay, Settings, Briefcase, FolderOpen, Building,
  ShieldCheck, BarChart3, Target, FileText, BrainCircuit, Calculator,
  ShieldAlert, ClipboardList, CheckSquare, History, Key, Layers, Lock, TrendingUp, Archive, Package, Wrench
} from 'lucide-react';
import { ModuleCapabilityState } from "./moduleCapabilities";

export interface ConsultingSubItem {
  title: string;
  id: string;
  icon: any;
  availability?: ModuleCapabilityState;
  /** Compatibility wording used only as an accessible-name bridge during migration. */
  accessibleLabel?: string;
}

export interface ConsultingGroup {
  groupKey: string;
  title: string;
  icon: any;
  subItems: ConsultingSubItem[];
  /** Compatibility wording used only as an accessible-name bridge during migration. */
  accessibleLabel?: string;
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
      title: "Cliente",
      accessibleLabel: "Cliente — Centro de Comando",
      icon: Briefcase,
      subItems: [
        { title: "Empresas e Grupos", id: "enterprise_center", icon: Building, accessibleLabel: "Empresas e Grupos — Centro de Comando" }
      ]
    },
    {
      groupKey: "conhecer_cliente",
      title: "Projeto",
      accessibleLabel: "Projeto — Conhecer Cliente",
      icon: Users,
      subItems: [
        { title: "Projeto de Consultoria", id: "area_consultor", icon: FolderOpen, accessibleLabel: "Projeto de Consultoria — Projetos de Consultoria" },
        { title: "Modelo Consultivo", id: "modelo_consultivo", icon: Settings }
      ]
    },
    {
      groupKey: "fontes",
      title: "Fontes",
      accessibleLabel: "Fontes — Conectar Dados",
      icon: Database,
      subItems: [
        {
          title: "Fontes de Dados",
          id: "central_dados",
          icon: Database,
          accessibleLabel: "Fontes de Dados — Importar Planilhas — Biblioteca de Planilhas — Conectar Banco — VPN e Banco de Dados",
        }
      ]
    },
    {
      groupKey: "analise",
      title: "Análise",
      accessibleLabel: "Análise — Diagnosticar Negócio",
      icon: Target,
      subItems: [
        { title: "Análise da fonte", id: "analise_estrutura", icon: Database, accessibleLabel: "Análise da fonte — Análise de Estrutura" },
        { title: "Visão Executiva", id: "resumo", icon: BarChart3, accessibleLabel: "Visão Executiva — Diagnóstico Executivo" },
        { title: "Financeiro", id: "financeiro", icon: Calculator },
        { title: "Comercial", id: "comercial", icon: TrendingUp },
        { title: "Estoque", id: "estoque", icon: Archive },
        { title: "Itens", id: "itens", icon: Package },
        { title: "Pós-vendas", id: "posvendas", icon: Wrench },
        { title: "Pessoas", id: "comissoes", icon: Users, accessibleLabel: "Pessoas — People Intelligence — Vendedores — Comissões" },
        { title: "Anomalias", id: "obstaculos", icon: ShieldAlert },
        { title: "Recomendações", id: "consultor_ia", icon: BrainCircuit }
      ]
    },
    {
      groupKey: "decisao",
      title: "Decisão",
      accessibleLabel: "Decisão — Preparar Decisão",
      icon: Presentation,
      subItems: [
        { title: "Apresentações", id: "apresentacoes", icon: Presentation, accessibleLabel: "Apresentações — Decks — Templates" }
      ]
    },
    {
      groupKey: "reuniao",
      title: "Reunião",
      accessibleLabel: "Reunião — Conduzir Sessão",
      icon: MonitorPlay,
      subItems: [
        { title: "Preparação da Reunião", id: "preparacao_reuniao", icon: ClipboardList },
        { title: "Sessão Executiva", id: "modo_reuniao", icon: MonitorPlay },
        { title: "Ata e Decisões", id: "reuniao_ata", icon: ClipboardList, accessibleLabel: "Ata e Decisões — Ata & Decisões" }
      ]
    },
    {
      groupKey: "acompanhamento",
      title: "Acompanhamento",
      accessibleLabel: "Acompanhamento — Executar Plano — Evoluir Resultado",
      icon: CheckSquare,
      subItems: [
        { title: "Plano Executivo", id: "plano_executivo", icon: CheckSquare, accessibleLabel: "Plano Executivo — Responsáveis & Prazos" },
        { title: "Histórico", id: "historico_executivo", icon: History },
        { title: "Evolução", id: "fechamento_mensal", icon: Calculator, accessibleLabel: "Evolução — Comparativos" }
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
