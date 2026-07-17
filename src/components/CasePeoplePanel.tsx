/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PeopleIntelligenceTab } from "./PeopleIntelligenceTab";

interface CasePeoplePanelProps {
  filteredData: any[];
  formatCurrency: (value: number) => string;
  metrics: any;
}

export const CasePeoplePanel: React.FC<CasePeoplePanelProps> = ({
  filteredData,
  formatCurrency,
  metrics,
}) => {
  // States for PeopleIntelligenceTab moved from CaseHub to keep it slim & modular
  const [clientSegment, setClientSegment] = useState<string>("Geral");
  const [managerNotes, setManagerNotes] = useState<string>("");
  const [faturamentoOffset, setFaturamentoOffset] = useState<number>(0);
  const [despesaOffset, setDespesaOffset] = useState<number>(0);
  const [narrarFeedback, setNarrarFeedback] = useState<boolean>(true);
  const [comissaoFormula, setComissaoFormula] = useState<string>("Configuração pendente");
  const [comissaoGeral, setComissaoGeral] = useState<number>(0);
  const [comissaoAcessorios, setComissaoAcessorios] = useState<number>(0);
  const [comissaoItens, setComissaoItens] = useState<number>(0);

  return (
    <PeopleIntelligenceTab 
      dataOrigem={filteredData} 
      formatCurrency={formatCurrency} 
      metrics={metrics}
      calculatedCommissions={{
        regraAtiva: comissaoFormula,
        totalGeralComissao: 0,
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
      taxaComissaoItens={comissaoItens}
      setTaxaComissaoItens={setComissaoItens}
      triggerSystemBackup={() => {}}
    />
  );
};
