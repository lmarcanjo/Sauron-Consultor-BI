import { BusinessMeetingTemplate } from "../BusinessDomainTypes";

export const meeting: BusinessMeetingTemplate = {
  subjectOrder: ["Acompanhamento do Clima e Solo", "Progresso do Plantio/Colheita", "Produtividade por Talhão", "Custo Operacional e Insumos", "Logística de Exportação"],
  mandatoryKpis: ["PRODUCTION", "PRODUCTIVITY", "COST_HECTARE"],
  optionalKpis: ["AGRO_REVENUE", "AGRO_MARGIN", "EXPORT", "HARVEST"],
  suggestedQuestions: [
    "O rendimento por hectare superou a estimativa inicial da safra?",
    "Quais talhões apresentaram maior custo de insumo?",
    "A logística do packing house está com gargalo de escoamento?"
  ],
  riscos: ["Atraso na colheita por intempéries climáticas", "Flutuação severa no preço internacional da commodity"],
  acoes: ["Contratação preventiva de maquinário extra para colheita rápida", "Hedge financeiro para travar preço da saca"]
};
