# Sprint 17 — Registro de Consolidação UX

Data: 2026-07-24

## Removido

- Rota visual da Biblioteca de Planilhas como destino independente.
- Rota visual de VPN e Banco de Dados como destino independente.
- `src/components/WorkbookLibraryTab.tsx`.
- `src/components/VpnGatewayTab.tsx`.
- Acesso ao configurador de campos dentro dos módulos de resultado.
- Agregador ad-hoc e cards estáticos de `ReportsPage`.
- Entradas duplicadas de Templates, notas, decisões, perguntas, responsáveis,
  prazos e pendências no menu principal.
- Rota duplicada `executive_workspace` do fluxo consultivo.

## Absorvido

| Superfície anterior | Destino único | Justificativa |
| --- | --- | --- |
| Importar Planilhas | Fontes de Dados | importação e ativação têm o mesmo contexto de fonte |
| Biblioteca de Planilhas | Fontes de Dados | seleção, versões e vínculo precisam ser vistos juntos |
| VPN e Banco de Dados | Fontes de Dados | conexão SQL não exige biblioteca distinta |
| Painel de campos de Financeiro/Comercial/Pessoas/DRE | Análise da fonte | a confirmação é da fonte, não do módulo |
| Dossiês/Relatórios estáticos | Resultados disponíveis | um resultado só aparece quando os pré-requisitos existem |
| Diagnóstico Executivo | Visão Executiva | um único destino para o resumo inicial |
| Pessoas/Comissões/Vendedores | Pessoas | detalhes continuam em abas internas quando aplicáveis |

## Estados vazios

Todo resultado sem interpretação aponta para `Análise da fonte` com a ação
`Revisar análise da fonte`. Quando não há fonte, a ação principal é `Abrir
Fontes de Dados`. O texto não promete valores e não abre um segundo fluxo de
configuração.

## Termos de interface

O shell usa `Fontes de Dados`, `Análise da fonte`, `Visão confirmada`,
`Informações selecionadas` e `Resultados disponíveis`. Os nomes técnicos
continuam somente nos contratos e no código.

## Compatibilidade

Os nomes antigos permanecem apenas como parte do nome acessível transitório
dos botões durante a certificação dos fluxos existentes. Não são títulos
visuais, itens distintos ou rotas registradas no menu.
