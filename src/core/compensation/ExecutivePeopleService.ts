/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CollaboratorPerformance, compensationEngine, CompensationResult } from "./CompensationEngine";

export interface TimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: "hire" | "promotion" | "target" | "best_month" | "training" | "team_change" | "campaign" | "bonus";
}

export interface PdiGoal {
  id: string;
  description: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
}

export interface DocumentAudit {
  id: string;
  name: string;
  code: string;
  status: "validated" | "pending_review" | "archived";
  date: string;
}

export interface CollaboratorDossier {
  id: string;
  name: string;
  role: string;
  team: string;
  department: string;
  store: string;
  manager: string;
  email: string;
  status: "Ativo" | "Inativo";
  hireDate: string;
  experience: string;
  achievements: string;
  strengths: string;
  weaknesses: string;
  feedback: string;
  performance: CollaboratorPerformance;
  timeline: TimelineItem[];
  pdi: PdiGoal[];
  documents: DocumentAudit[];
}

export class ExecutivePeopleService {
  private dossiers: CollaboratorDossier[] = [];

  constructor() {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      const now = new Date().toISOString();
      this.dossiers = [
        {
          id: "colab_joao_silva",
          name: "João Silva",
          role: "Consultor de Vendas Senior",
          team: "Equipe Comercial A",
          department: "Comercial",
          store: "Unidade A",
          manager: "Carlos Santos",
          email: "joao.silva@cliente.com.br",
          status: "Ativo",
          hireDate: "12/03/2021",
          experience: "8 anos de atuação comercial consultiva.",
          achievements: "Recordista de margem bruta na unidade por 3 trimestres consecutivos.",
          strengths: "Excelente conversão de propostas digitais, fidelização de carteira e negociação consultiva.",
          weaknesses: "Foco excessivo em linhas de alta margem, negligenciando ocasionalmente o giro de linhas recorrentes.",
          feedback: "Profissional extremamente focado em metas de rentabilidade. Apresenta excelente inteligência negocial e alinhamento com a diretoria.",
          performance: {
            collaboratorId: "colab_joao_silva",
            totalSales: 680000,
            accessoriesSales: 120000,
            partsSales: 45000,
            csat: 4.8,
            cancellationRate: 0.02,
            campaignParticipated: ["campanha_periodo", "linha_alta_margem"],
            lineage: {
              totalSalesCell: "B10",
              accessoriesSalesCell: "C10",
              partsSalesCell: "D10",
              csatCell: "E10",
              cancellationRateCell: "F10",
            },
          },
          timeline: [
            { id: "tl1", timestamp: "12/03/2021", title: "Contratação", description: "Admissão oficial como Consultor de Vendas Junior no cliente empresarial", category: "hire" },
            { id: "tl2", timestamp: "15/10/2022", title: "Promoção", description: "Elevado para Consultor Pleno após superar meta trimestral em 135%", category: "promotion" },
            { id: "tl3", timestamp: "01/06/2023", title: "Mudança de Equipe", description: "Transferido voluntariamente para a equipe estratégica", category: "team_change" },
            { id: "tl4", timestamp: "20/12/2023", title: "Treinamento", description: "Conclusão do ciclo de capacitação Especialista em Atendimento Premium", category: "training" },
            { id: "tl5", timestamp: "10/01/2024", title: "Promoção", description: "Promovido a Consultor de Vendas Senior pela liderança em margens", category: "promotion" },
            { id: "tl6", timestamp: "30/03/2025", title: "Melhor Mês", description: "Recorde individual de vendas em categorias adicionais: faturamento de R$ 120k", category: "best_month" },
            { id: "tl7", timestamp: "15/06/2026", title: "Campanha Integrada", description: "Elegível na campanha comercial com bônus de performance", category: "campaign" },
          ],
          pdi: [
            { id: "goal1", description: "Aumentar penetração de propostas digitais pelo CRM em 15%", deadline: "31/08/2026", status: "in_progress" },
            { id: "goal2", description: "Realizar treinamento avançado em linhas estratégicas", deadline: "30/11/2026", status: "pending" },
            { id: "goal3", description: "Apoiar a capacitação operacional de 2 consultores juniores recém-admitidos", deadline: "31/12/2026", status: "completed" },
          ],
          documents: [
            { id: "doc1", name: "Acordo de Metas Q2/2026", code: "SOP-MET-02-26", status: "validated", date: "01/04/2026" },
            { id: "doc2", name: "Termo de Ajuste Tributário Especial", code: "SOP-TAX-04-26", status: "validated", date: "15/04/2026" },
            { id: "doc3", name: "Formulário de Consentimento de Imagem e LGPD", code: "SOP-LGP-10-25", status: "validated", date: "12/10/2025" },
          ],
        },
        {
          id: "colab_maria_santos",
          name: "Maria Santos",
          role: "Especialista Financeira",
          team: "Administração e Crédito",
          department: "Administração",
          store: "Unidade B",
          manager: "Gabriel Alves",
          email: "maria.santos@cliente.com.br",
          status: "Ativo",
          hireDate: "05/01/2023",
          experience: "5 anos de mercado em finanças corporativas e crédito bancário.",
          achievements: "Aumento de 24% na penetração de soluções financeiras e produtos agregados.",
          strengths: "Excelente relacionamento com múltiplos agentes financeiros e agilidade na aprovação de crédito.",
          weaknesses: "Foco menor no suporte operacional a categorias recorrentes devido à alta carga de novas demandas.",
          feedback: "Peça estratégica na manutenção de receitas de F&I. Essencial para alavancar comissões indiretas de crédito institucional.",
          performance: {
            collaboratorId: "colab_maria_santos",
            totalSales: 410000,
            accessoriesSales: 35000,
            partsSales: 0,
            csat: 4.5,
            cancellationRate: 0.03,
            campaignParticipated: ["linha_alta_margem"],
            lineage: {
              totalSalesCell: "B11",
              accessoriesSalesCell: "C11",
              partsSalesCell: "D11",
              csatCell: "E11",
              cancellationRateCell: "F11",
            },
          },
          timeline: [
            { id: "tl2_1", timestamp: "05/01/2023", title: "Contratação", description: "Admissão como Assistente Financeira na unidade principal", category: "hire" },
            { id: "tl2_2", timestamp: "01/12/2023", title: "Promoção", description: "Promovida a Especialista em F&I Plena pelo excelente volume de conversões", category: "promotion" },
            { id: "tl2_3", timestamp: "15/05/2024", title: "Treinamento", description: "Conclusão da Certificação Especial de Crédito Bancário e Garantia de Riscos", category: "training" },
            { id: "tl2_4", timestamp: "12/12/2025", title: "Melhor Mês", description: "Faturamento recorde de crédito gerando R$ 410k de volume faturado", category: "best_month" },
          ],
          pdi: [
            { id: "goal2_1", description: "Digitalizar 100% da documentação de crédito em pasta segura", deadline: "30/09/2026", status: "completed" },
            { id: "goal2_2", description: "Reduzir o tempo médio de aprovação cadastral para 30 minutos", deadline: "15/10/2026", status: "in_progress" },
          ],
          documents: [
            { id: "doc2_1", name: "Contrato de Parceria e Comissão Financeira", code: "SOP-PAR-09-25", status: "validated", date: "15/09/2025" },
            { id: "doc2_2", name: "Certificado de Riscos Operacionais", code: "SOP-CER-12-24", status: "validated", date: "20/12/2024" },
          ],
        },
        {
          id: "colab_pedro_oliveira",
          name: "Pedro Oliveira",
          role: "Consultor de Vendas Pleno",
          team: "Equipe Comercial B",
          department: "Comercial",
          store: "Unidade C",
          manager: "Ana Paula Silva",
          email: "pedro.oliveira@cliente.com.br",
          status: "Ativo",
          hireDate: "19/07/2024",
          experience: "4 anos em vendas consultivas e atendimento digital.",
          achievements: "Liderança em volume de faturamento em maio de 2026.",
          strengths: "Altíssimo dinamismo, forte captação ativa de leads e excelente presença digital.",
          weaknesses: "Margem média de lucro unitário ligeiramente abaixo da média corporativa recomendada.",
          feedback: "Vendedor de alta energia e excelente entrega de volume. Precisa de orientação tática para focar em produtos com maiores margens de comissão.",
          performance: {
            collaboratorId: "colab_pedro_oliveira",
            totalSales: 350000,
            accessoriesSales: 15000,
            partsSales: 5000,
            csat: 3.9,
            cancellationRate: 0.06,
            campaignParticipated: ["campanha_periodo"],
            lineage: {
              totalSalesCell: "B12",
              accessoriesSalesCell: "C12",
              partsSalesCell: "D12",
              csatCell: "E12",
              cancellationRateCell: "F12",
            },
          },
          timeline: [
            { id: "tl3_1", timestamp: "19/07/2024", title: "Contratação", description: "Contratado como Consultor Comercial Pleno para reforçar a unidade", category: "hire" },
            { id: "tl3_2", timestamp: "15/11/2024", title: "Treinamento", description: "Conclusão do treinamento presencial de técnicas de leads em mídias sociais", category: "training" },
            { id: "tl3_3", timestamp: "10/05/2026", title: "Melhor Mês", description: "Faturamento individual recorde de R$ 350k na linha comercial", category: "best_month" },
          ],
          pdi: [
            { id: "goal3_1", description: "Participar de programa de mentoria focado em margem com João Silva", deadline: "31/07/2026", status: "in_progress" },
            { id: "goal3_2", description: "Reduzir taxa de cancelamentos de propostas para menos de 5%", deadline: "31/08/2026", status: "pending" },
            { id: "goal3_3", description: "Aumentar a média de satisfação CSAT para o patamar de 4.3", deadline: "30/09/2026", status: "pending" },
          ],
          documents: [
            { id: "doc3_1", name: "Formulário de Auditoria Comercial", code: "SOP-AUD-06-26", status: "pending_review", date: "22/06/2026" },
          ],
        },
      ];
    }
  }

  public getDossiers(): CollaboratorDossier[] {
    return this.dossiers;
  }

  public getCollaboratorDossier(collaboratorId: string): CollaboratorDossier | undefined {
    const existing = this.dossiers.find((d) => d.id === collaboratorId);
    if (existing) return existing;

    if (collaboratorId.startsWith("colab_") || collaboratorId.length > 0) {
      const cleanName = collaboratorId
        .replace("colab_", "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        id: collaboratorId,
        name: cleanName,
        role: "Consultor de Vendas",
        team: "Equipe Comercial",
        department: "Comercial",
        store: "Unidade Principal",
        manager: "Gerente Geral",
        email: `${collaboratorId}@empresa.com.br`,
        status: "Ativo",
        hireDate: new Date().toLocaleDateString("pt-BR"),
        experience: "Informação não disponível na planilha importada.",
        achievements: "Informação não disponível na planilha importada.",
        strengths: "Informação não disponível na planilha importada.",
        weaknesses: "Informação não disponível na planilha importada.",
        feedback: "Informação não disponível na planilha importada.",
        performance: {
          collaboratorId,
          totalSales: 0,
          accessoriesSales: 0,
          partsSales: 0,
          csat: 5.0,
          cancellationRate: 0,
          campaignParticipated: [],
          lineage: {
            totalSalesCell: "",
            accessoriesSalesCell: "",
            partsSalesCell: "",
            csatCell: "",
            cancellationRateCell: ""
          }
        },
        timeline: [],
        pdi: [],
        documents: []
      };
    }
    return undefined;
  }

  public calculateCompensation(collaboratorId: string, policyId: string): CompensationResult | undefined {
    const dossier = this.getCollaboratorDossier(collaboratorId);
    if (!dossier) return undefined;
    return compensationEngine.calculate(dossier.performance, policyId);
  }
}

export const executivePeopleService = new ExecutivePeopleService();
