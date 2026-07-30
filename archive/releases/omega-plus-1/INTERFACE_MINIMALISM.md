# Sprint Ω+1.2 — Release Note: Interface Minimalista, Navegação Compacta e Data Drawer Real

## 1. Visão Geral
Este documento registra as decisões de design e as transformações arquiteturais implementadas na **Sprint Ω+1.2**. O objetivo central foi erradicar a poluição visual ("ERP-feel"), ocultar detalhes puramente técnicos da interface principal do consultor/cliente, e consolidar os fluxos de conectividade e governança em controles imersivos em formato Drawer.

---

## 2. Decisões Arquiteturais

### A. Compactação Extrema do Identity Control
A antiga barra de identidade e simulação (`IdentitySimulationBar`) ocupava uma grande faixa no topo com botões espalhados de compartilhamento, permissões e convites. 
- **Solução**: Transformada em uma linha de seleção compacta de alta densidade no formato:
  `Usuário • Organização • Caso • Papel`
- **Controle**: Os botões acessórios foram removidos, restando seletores transparentes embutidos e discretos que preservam 100% o isolamento do `IdentityEngine`.

### B. Consolidação Técnica: O Data Drawer Real
Os cards de conexão, validação técnica, modo demonstração/banco de dados, e console master criavam fricção cognitiva na visualização do cockpit executivo.
- **Solução**: Foram consolidados e embutidos dentro da `CentralDadosDrawer` (atuando como a Central de Controle Tático de Dados).
- **Escopo do Drawer**:
  1. Escolha de Fonte Ativa (Demonstração vs Dados Reais)
  2. Ajuste de Modelo Industrial de Segmento (Automotivo vs Geral)
  3. Cargas de Dados: Upload de planilhas locais e sincronização ativa
  4. Integração do painel de banco de dados (`DatabaseConnector` interno)
  5. Status de VPN e APIs Externas (Saudável / Ativa)
  6. Validação de integridade do banco (exibindo a mensagem de validação oficial) e console log de auditoria técnica.

### C. DataStatusStrip Compacto
- Substituição dos múltiplos blocos amarelos, verdes e vermelhos no topo das páginas por um único **DataStatusStrip** de uma linha, que exibe o micro-status da conexão (`Demonstração controlada` vs `Dados Reais Conectados`) e rastro do total de filtros ativos, além de oferecer um atalho simples para expandir a Central de Dados.

---

## 3. Rastreabilidade de Alterações
- `src/components/IdentitySimulationBar.tsx`: Compactado em uma única linha elegante com seletores inline.
- `src/components/CentralDadosDrawer.tsx`: Expandido para abrigar a validação do banco, logs técnicos, e incorporar dinamicamente o `DatabaseConnector`.
- `src/App.tsx`: Incorporou o `DataStatusStrip`, limpou múltiplos blocos de alerta e console técnicos, e integrou eventos globais para ativação rápida via Command Palette.
- `src/components/CommandPalette.tsx`: Atalhos de comando unificados para abrir gavetas de dados e filtros.
