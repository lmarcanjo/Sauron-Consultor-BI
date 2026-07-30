# SAURON QUALITY STANDARD
## O Manual de Padronização de Qualidade de Código e de Engenharia

Este documento detalha os padrões técnicos, regras estritas de sintaxe, testes e princípios de usabilidade que mantêm o desenvolvimento do **Sauron** coeso, legível e robusto frente a times de desenvolvimento de alto desempenho e agentes de inteligência artificial.

---

### 1. Padrões de TypeScript (TS)
- **Forte Tipagem**: O uso do tipo `any` é **terminantemente proibido**, a menos que haja justificativa técnica documentada aprovada pela arquitetura. Utilize genéricos, uniões e interseções de tipos.
- **Imports no Topo**: Todos os `import` devem ser listados de forma unificada no topo do arquivo. Nunca utilize imports dinâmicos dentro de escopos locais de funções para códigos transversais do sistema.
- **Importação de Tipos**: Não use `import type` para importar classes que possuem construtores invocáveis no arquivo ou de arquivos que declarem enums, pois isso resulta em quebras graves no build final.
- **Enumerações**: Utilize apenas enums explícitos padrão (e.g., `enum Color { Red = "red" }`). O uso de `const enum` é terminantemente proibido devido a limitações de compilação em múltiplos bundlers.

---

### 2. Padrões de React (UI)
- **Purismo de Componentização**: Componentes React devem conter exclusivamente lógica visual e interface de usuário. Lógicas de negócio pertencem a arquivos e classes puras `.ts` estruturadas como engines ou managers.
- **Ícones Unificados**: Toda a iconografia do sistema deve vir única e exclusivamente de `lucide-react`. O uso de SVGs embutidos complexos ou arquivos PNG para ícones menores de status é proibido para garantir a coesão visual.
- **Prevenção de Re-renders Infinitos**:
  - Evite passar arrays de dependências em `useEffect` compostos de objetos ou funções declaradas diretamente dentro do corpo do componente que se recriam em cada render.
  - Utilize tipos primitivos (strings, numbers, booleans) em dependências de efeito sempre que possível.
  - Estabilize callbacks reativos usando `useCallback` e cálculos pesados com `useMemo`.

---

### 3. Padrões de Testes Automatizados

#### Testes Unitários e de Integração (Vitest)
- **Localização**: Arquivos de teste em Vitest devem ser mantidos adjacentes ao arquivo do código-fonte correspondente sob validação (utilizando o padrão `*.test.ts`).
- **Isolamento de Estado**: Testes devem limpar o ambiente pós-execução (`afterEach`), mockar o `localStorage` se dependerem do navegador e não interferir em outros arquivos de teste executados de forma paralela.
- **Foco em Cálculo**: Motores matemáticos de análise e consolidadores financeiros devem possuir cobertura de testes que simulem sucesso e cenários extremos de dados zerados ou inconsistentes.

#### Testes de Interface de Ponta a Ponta (Playwright)
- **Roteamento de Teste**: Testes e2e devem residir isolados na pasta `/tests/e2e/`.
- **Previsibilidade**: Playwright deve buscar seletores estáveis baseados em identificadores estáveis (`id` ou `data-testid`), evitando depender estritamente da estrutura do DOM (como posições de divs).

---

### 4. Padrões de Segurança
- **Leitura Segura (Read-Only)**: Nenhuma query construída ou transmitida pelo aplicativo pode ter privilégios de escrita nos ERPs dos clientes conectados.
- **Sanitização de Inputs**: Todo campo de texto, planilha de upload ou parâmetro em consultas SQL deve sofrer validação agressiva contra SQL Injection ou Cross-Site Scripting (XSS).
- **Sem Segredos Hardcoded**: Credenciais, chaves ou hosts não podem ser expostos no código público. Use variáveis de ambiente e documente-as no `.env.example`.

---

### 5. Padrões de Usabilidade e UX
- **Consistência do Tema**: O Sauron adota uma paleta corporativa elegante de tons neutros, grafites profundos, cinzas de alta legibilidade e off-whites confortáveis. O uso de temas muito coloridos, neon ou poluídos é vetado.
- **Combate à Telemetria Larping**: Proibido colocar logs falsos, terminais fictícios, barras de carregamento sem real conexão, ou textos informativos redundantes que não agreguem valor real de negócio para o consultor ou seu cliente.
- **Espaço Negativo Proposital**: Use margens generosas e ritmo visual. A informação financeira é complexa; a interface de apresentação deve dar espaço para o tomador de decisão respirar e focar nos KPIs certos.
- **Áreas de Toque Confortáveis**: Alvos e elementos clicáveis devem respeitar o padrão de área de toque de, no mínimo, 44px de tamanho lateral.
