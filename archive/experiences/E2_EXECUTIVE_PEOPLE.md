# EXPERIENCE E2 — EXECUTIVE PEOPLE INTELLIGENCE

## 1. CONCEITO & PROPÓSITO

A experiência **Executive People Intelligence** do **Sauron OS** transforma a gestão de pessoal de um simples departamento de RH ou folha de pagamento em um ambiente de inteligência gerencial e governança de remuneração.

O propósito central é dar à liderança executiva e aos consultores seniores total visibilidade sobre quem conduz as operações do negócio na ponta do varejo (concessionárias, showrooms, pós-vendas) e como cada colaborador é remunerado por seu desempenho tático.

Diferente de sistemas de folha de pagamento tradicionais, esta experiência foca em **rentabilidade, rastreabilidade, PDI (Plano de Desenvolvimento Individual), e comissionamento determinístico auditável**.

---

## 2. PILARES DA EXPERIÊNCIA

### A. People Hub (Hub de Pessoas)
Substitui listas brutas de pessoal por uma interface executiva de segmentação e agregação:
*   **Filtros Multidimensionais**: Filtragem por Departamento, Unidade de Showroom, Gestor Direto, Status de Trabalho e Cargos.
*   **Agrupamento Dinâmico**: Reorganiza a visualização do quadro operacional dinamicamente (ex: visualizar por Gestores ou por Showroom) de forma instantânea sem alterações de dados no banco físico.
*   **Acesso Direto ao Dossiê**: Clicar em qualquer registro do hub redireciona o usuário diretamente para o Dossiê Executivo individual.

### B. Executive Dossier (Dossiê Executivo)
Um raio-x gerencial de cada colaborador dividido em 10 seções estratégicas integradas e unificadas:
1.  **Identificação**: Dados cadastrais consolidados (cargo, equipe, gestor, contato, data de admissão).
2.  **Performance**: Coleta direta de métricas de vendas, faturamento geral de acessórios, peças e faturamento bruto.
3.  **Evolução**: Linha do tempo profissional do colaborador (promoções, transferências de equipe, treinamentos).
4.  **Metas**: Lista de objetivos profissionais táticos definidos no PDI.
5.  **Indicadores**: Status de satisfação (CSAT) e integridade de propostas (taxa de cancelamento).
6.  **Comissão**: Detalhamento preciso da remuneração calculada pelo motor.
7.  **Feedbacks**: Anotações gerenciais e diagnósticos periódicos efetuados pelo consultor.
8.  **Planos de Desenvolvimento**: Metas e competências táticas ativas.
9.  **Histórico**: Timeline unificada de conquistas e marcos históricos de performance.
10. **Documentos**: Auditoria de arquivos digitais, acordos de metas selados e termos de compliance.

### C. Compensation Engine (Motor de Remuneração)
Um motor de cálculo parametrizável estritamente determinístico que não depende de IA e garante reprodutibilidade matemática completa:
*   **Parâmetros de Política**: Permite cadastrar e simular diferentes políticas de comissionamento (ex: *Premium Elite* vs. *Standard Popular*).
*   **Componentes de Cálculo**:
    *   *Salário Base*: Fixo de contrato de trabalho.
    *   *Comissão Geral Base*: Percentual sob faturamento geral de vendas de veículos.
    *   *Taxa de Acessórios*: Percentual extra incentivando venda de agregados de alta margem.
    *   *Taxa de Autopeças*: Percentual focado em giro de estoque de pós-vendas.
    *   *Bônus de Faixa*: Prêmios em dinheiro ao atingir metas brutas (ex: superar R$ 600k de vendas).
    *   *Multiplicador de Segmento*: Fatores de acréscimo baseados no segmento de veículos vendidos.
    *   *Bônus de Campanhas*: Acordos sazonais ou incentivos de propostas ativas.
    *   *Penalidades*: Descontos em comissões por descumprimento de metas de qualidade (ex: CSAT abaixo do limite ou cancelamentos acima do aceitável).

### D. Explicação do Cálculo & Linhagem de Dados (Data Lineage)
Mecanismo de transparência contábil obrigatório para cada repasse calculado:
*   Exibe a seção **"Como chegamos neste valor"** detalhando a fórmula matemática exata e os passos para a remuneração final.
*   Selo de **Data Lineage**: Cada valor é acompanhado por um badge de linhagem indicando o arquivo físico de origem e a célula da planilha de onde o dado operacional foi extraído (ex: `FATURAMENTO!B10`).

### E. Premium Printable Document (PDF Executivo)
Rendimento visual sofisticado pronto para impressão para fins de auditoria de metas, assinaturas físicas e acordos de compliance:
*   Visual de alta fidelidade e contraste em folha de papel.
*   QR Code visual de autenticidade contábil.
*   Data, hora e número de versão do documento unificados para integridade de controle de versão.
*   Campos dedicados para assinatura manuscrita do Colaborador e do Gestor Responsável.

---

## 3. ARQUITETURA TÉCNICA

A experiência é implementada utilizando uma separação rígida de responsabilidades conforme o **Sauron Software Development Lifecycle (SDL)**:

1.  **Camada de Regras de Negócio (Engines & Services)**:
    *   `src/core/compensation/CompensationEngine.ts`: Controla a matemática determinística e as políticas de comissão. Sem estado interno do React.
    *   `src/core/compensation/ExecutivePeopleService.ts`: Centraliza o repositório de dossiês operacionais, históricos e timelines.
2.  **Camada de Apresentação (React & Sauron SDK)**:
    *   `src/components/PeopleIntelligenceTab.tsx`: Renderiza a interface do Hub de Pessoas e do Dossiê. Consome exclusivamente componentes de UI e de Domínio do Sauron SDK.
3.  **Camada de Testes de Qualidade**:
    *   `src/core/compensation/CompensationEngine.test.ts`: Testa as regras de cálculo, aplicação de penalidades, e correspondência de data lineage.
