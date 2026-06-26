# SAURON RELEASE GATES
## O Sistema de Portais de Qualidade e Governança Técnica

Este documento estabelece as diretrizes de qualidade obrigatórias que toda e qualquer nova implementação na plataforma **Sauron** deve cumprir antes de ser considerada concluída e elegível para fusão no ramo principal (`main`) ou implantação em produção.

---

### Gate 1 — Architecture Review (Revisão Arquitetural)
Toda alteração de código ou funcionalidade introduzida na plataforma deve respeitar rigorosamente os limites arquiteturais estabelecidos no Manifesto de Engenharia.

- **Respeito aos Core Engines**: A lógica de cálculo ou operação pertence aos engines?
- **Desacoplamento Visual (React)**: Foi criada lógica de negócio complexa ou processamento financeiro dentro de componentes de UI? *(Lembre-se: Componentes React apenas renderizam dados e reagem a eventos).*
- **Não Duplicação de Estado**: Os dados consumidos vêm de uma única fonte de verdade centralizada ou há estados duplicados e dessincronizados no cliente?
- **Reutilização de Serviços**: Foi desenvolvido um novo serviço, helper ou manager quando alguma estrutura existente (como o `ConsultantWorkspaceManager` ou `DataSourceManager`) poderia ser reutilizada?
- **Prevenção de Débito Técnico**: A alteração implementada aumenta ou diminui o custo de manutenção do código para os próximos 5 anos?

---

### Gate 2 — Data Governance Review (Governança de Dados)
O Sauron é um software baseado em confiança absoluta dos números. A integridade dos dados não é negociável.

- **Uso do DataSourceManager**: Todas as fontes de dados consumidas estão registradas e são validadas através do `DataSourceManager`?
- **Isolamento de Dados de Demonstração (DEMO_DATA)**: Lógicas de mock, simulações ou dados fictícios estão restritos a `src/data/demoData.ts`? Algum fallback de mock foi incluído dentro de rotinas reais de banco ou planilhas?
- **Preservação da Origem**: O sistema é capaz de comprovar de onde cada número em exibição veio?
- **Trilha de Auditoria (AuditEngine)**: Ações operacionais críticas, como mudanças de projetos, cargas de planilhas ou falhas de segurança, disparam eventos de registro detalhados no `AuditEngine`?
- **Rastreabilidade (Data Lineage)**: Os KPIs exibidos em telas e apresentações mantêm o vínculo visível com seus snapshots de ingestão?

---

### Gate 3 — Security Review (Segurança)
A proteção dos ativos e dados corporativos dos clientes da consultoria é prioridade enterprise.

- **Banco Estritamente Read-Only**: A aplicação continua operando de forma 100% livre de queries destrutivas? O Sauron realiza apenas queries de leitura?
- **Prevenção de SQL Injection**: Todas as queries enviadas para bancos de dados externos passam por rotinas de sanitização, prevenção de injeção e validação estrita de identificadores?
- **Proteção de Credenciais**: Há alguma chave de API, segredo ou credencial sensível hardcoded em arquivos sob versionamento? *(Chaves devem estar apenas em ambientes e arquivos de ambiente documentados).*
- **Context Isolation (Multi-Tenant)**: Os filtros contextuais (CNPJ, Grupo, Empresa) estão encapsulados de forma a impossibilitar o vazamento de informações de um cliente ou filial para outro?

---

### Gate 4 — Product Review (Adequação de Produto)
O software deve servir para resolver gargalos reais da jornada consultiva de negócios.

- **Facilitação do Trabalho do Consultor**: O recurso resolve um problema operacional de campo do consultor ou apenas adiciona ruído/complexidade?
- **Otimização de Reuniões Executivas**: A funcionalidade auxilia a tomada de decisão em fechamentos estratégicos mensais?
- **Redução de Esforço Manual**: Houve redução nítida do trabalho de consolidação de dados ou montagem de apresentações para o consultor?
- **Alinhamento com a Release Atual**: O escopo executado pertence à release em desenvolvimento constante no Roadmap?

---

### Gate 5 — UX Review (Experiência do Usuário)
A simplicidade sofisticada é a nossa assinatura visual e interativa.

- **Linguagem Humana e Executiva**: Foram removidos termos puramente técnicos, pseudocientíficos, larping de telemetria ("CORE ONLINE", "PING STABLE") e jargões exagerados?
- **Interface Limpa e Sem Clutter**: Há excesso de elementos visuais concorrendo pela atenção do consultor? O foco analítico foi preservado?
- **Acessibilidade de Clique**: Os botões e ações de interface cumprem o tamanho recomendado de touch targets (mínimo de 44px de área clicável)?
- **Visual Elegante**: O padrão de espaçamento, hierarquia tipográfica (com Inter ou Grotesk) e harmonia estética de contraste foi respeitado em concordância com as regras de design?

---

### Gate 6 — QA Review (Garantia de Qualidade)
Código sem testes é código quebrado por definição.

- **Cobertura de Testes Unitários**: Novos engines, regras ou managers possuem testes que cobrem sucessos, limites e cenários de erros em Vitest?
- **Zero Regressões Críticas**: Os testes unitários das sprints anteriores continuam passando com sucesso?
- **Robustez de Erro**: O sistema falha graciosamente se houver falta de internet, arquivos malformados ou bancos de dados fora do ar? Há alertas visuais informativos e humanos em vez de crash de tela?

---

### Gate 7 — Documentation Review (Revisão de Documentação)
A documentação do Sauron deve evoluir junto com suas ferramentas.

- **Arquitetura Atualizada**: Novos engines ou mudanças estruturais foram documentados na pasta `docs/architecture/`?
- **Atualização de Manuais**: Se houver alteração de fluxo do usuário, o guia do consultor reflete a nova operação?
- **Transparência Técnica**: As decisões tomadas, riscos mapeados e premissas foram devidamente registrados de forma limpa?

---

### Checklist Final (Definition of Done do Sauron)

Uma tarefa só pode ser movida para "Concluída" se passar com sucesso pelo checklist obrigatório abaixo:

- [ ] **Typecheck Completo**: O comando `npm run lint` ou similar é executado com sucesso e não retorna qualquer erro de compilação ou inconsistência de tipos.
- [ ] **Testes Passando**: Todos os testes unitários da plataforma rodam com sucesso (`npx vitest run`).
- [ ] **Sucesso de Build**: O comando de compilação geral (`npm run build`) gera o build de produção sem problemas ou warnings críticos.
- [ ] **Ausência de Comentários TODO**: Não existem notas residuais de tarefas pendentes em arquivos finais de produção.
- [ ] **Sem `any` Injustificado**: Toda tipagem estrutural foi especificada, sem atalhos que enfraquecem a estabilidade do TypeScript.
- [ ] **Sem Lógica de Negócio em React**: Componentes visuais limitados estritamente à apresentação e controle fino de fluxo visual.
- [ ] **Isolamento de Dados Fictícios**: Todo dado mockado permanece unicamente dentro da barreira do arquivo `demoData.ts`.
- [ ] **Sem `Math.random()` Crítico**: IDs e dados gerados em lógicas ou engines utilizam alternativas determinísticas (`crypto.randomUUID()` ou hashes de transações), mitigando problemas de rastreabilidade.
