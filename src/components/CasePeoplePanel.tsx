/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PeopleIntelligenceTab } from "./PeopleIntelligenceTab";

interface CasePeoplePanelProps {
  filteredData: any[];
  formatCurrency: (value: number) => string;
  dummyMetrics: any;
}

export const CasePeoplePanel: React.FC<CasePeoplePanelProps> = ({
  filteredData,
  formatCurrency,
  dummyMetrics,
}) => {
  // States for PeopleIntelligenceTab moved from CaseHub to keep it slim & modular
  const [clientSegment, setClientSegment] = useState<string>("Automotivo");
  const [managerNotes, setManagerNotes] = useState<string>("");
  const [faturamentoOffset, setFaturamentoOffset] = useState<number>(0);
  const [despesaOffset, setDespesaOffset] = useState<number>(0);
  const [narrarFeedback, setNarrarFeedback] = useState<boolean>(true);
  const [comissaoFormula, setComissaoFormula] = useState<string>("Fórmula Padrão");
  const [comissaoGeral, setComissaoGeral] = useState<number>(1.5);
  const [comissaoAcessorios, setComissaoAcessorios] = useState<number>(2.0);
  const [comissaoVeiculos, setComissaoVeiculos] = useState<number>(1.0);

  return (
    <PeopleIntelligenceTab 
      dataOrigem={filteredData} 
      formatCurrency={formatCurrency} 
      metrics={dummyMetrics as any}
      calculatedCommissions={{
        regraAtiva: comissaoFormula,
        totalGeralComissao: 35000,
        detailsByCnpj: [],
        detalhePorConta: []
      }}
      segmentoCliente={clientSegment}
      setSegmentoCliente={setClientSegment}
      observacaoGerente={managerNotes}
      setObservacaoGerente={setManagerNotes}
      faturamentoOffset={faturamentoOffset}
      setFaturamentoOffset={setFaturamentoOffset}
      despesaOffset={despesaOffset}
      setDespesaOffset={setDespesaOffset}
      narrarFeedback={narrarFeedback}
      setNarrarFeedback={setNarrarFeedback}
      comissaoFormula={comissaoFormula}
      setComissaoFormula={setComissaoFormula}
      percentualComissaoBase={comissaoGeral}
      setPercentualComissaoBase={setComissaoGeral}
      taxaComissaoAcessorios={comissaoAcessorios}
      setTaxaComissaoAcessorios={setComissaoAcessorios}
      taxaComissaoPecas={comissaoVeiculos}
      setTaxaComissaoPecas={setComissaoVeiculos}
      triggerSystemBackup={() => {}}
    />
  );
};
