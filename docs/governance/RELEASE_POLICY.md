# SAURON RELEASE POLICY
## A Política Oficial de Ciclo de Vida e Lançamento de Software

Este documento normatiza o fluxo completo que rege o nascimento, validação e implantação de uma Release na plataforma **Sauron**. Toda e qualquer atualização estrutural ou acréscimo de escopo funcional deve seguir rigorosamente as etapas deste processo unificado.

---

### Ciclo de Vida do Desenvolvimento (SDLC)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ Planning │ ──> │ Arch. Review │ ──> │  Implem. &   │ ──> │ QA & Dev │
│          │     │    (Gates)   │     │ Refatoração  │     │  Build   │
└──────────┘     └──────────────┘     └──────────────┘     └──────────┘
                                                                │
                                                                ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Post   │ <── │   Release    │ <── │  Acceptance  │ <── │  Tests   │
│  Review  │     │              │     │  (CTO / PO)  │     │ (Vitest) │
└──────────┘     └──────────────┘     └──────────────┘     └──────────┘
```

---

### Fases do Fluxo de Lançamento

#### 1. Planning (Planejamento)
- **Definição**: O Product Owner (PO) e os arquitetos sêniores selecionam o escopo da release com base no documento estratégico `SAURON_PRODUCT_ROADMAP.md`.
- **Atividades**:
  - Escrita dos critérios de aceite funcionais de forma detalhada e objetiva.
  - Alinhamento de escopo técnico, identificando dependências com outros componentes ou plugins de segmentos existentes.

#### 2. Architecture Review (Revisão Arquitetural)
- **Definição**: Validação preliminar do design de software proposto para as novas funcionalidades da release.
- **Atividades**:
  - Aplicação imediata das verificações descritas no `SAURON_RELEASE_GATES.md` (Gate 1 e Gate 2).
  - Validação de que a proposta de design não acopla lógicas financeiras em componentes visuais React, mantendo a pureza funcional dos engines.

#### 3. Implementation (Implementação)
- **Definição**: Desenvolvimento ativo do código em TypeScript.
- **Atividades**:
  - Escrita de código limpo, autoexplicativo, estruturado e tipado de forma estrita (sem o uso inadequado do tipo `any`).
  - Utilização estrita dos ícones integrados da biblioteca `lucide-react`.
  - Garantia de que dados de demonstração fictícios continuam residindo unicamente em seu espaço físico delimitado (`src/data/demoData.ts`).

#### 4. QA (Quality Assurance & Verificação Automatizada)
- **Definição**: Execução de todas as baterias de testes unitários e de integração de forma automatizada no ambiente do workspace de desenvolvimento.
- **Atividades**:
  - Rodagem completa e sem falhas do linter da aplicação (`npm run lint` ou `lint_applet`).
  - Execução total dos testes unitários através do Vitest (`npx vitest run`).
  - Execução bem-sucedida do build de produção (`npm run build` ou `compile_applet`).

#### 5. Acceptance (Homologação e Aceite)
- **Definição**: Validação final de negócios conduzida pelo CTO ou Product Owner da Sauron.
- **Atividades**:
  - Verificação de conformidade total com as jornadas dos usuários e personas descritas na Bíblia do Produto.
  - Avaliação de conformidade com os critérios de UX: hierarquia elegante, alvos de toque confortáveis e livre de ruídos de telemetria desnecessários.

#### 6. Release (Implantação e Distribuição)
- **Definição**: Lançamento oficial dos artefatos em produção.
- **Atividades**:
  - Atualização automática ou manual do `metadata.json` para refletir as permissões e nomes consistentes do applet.
  - Empacotamento estático e deploy do servidor integrado Express e seus assets estáticos compilados para a infraestrutura de contêineres do Cloud Run.

#### 7. Post Release Review (Avaliação de Aprendizado)
- **Definição**: Análise retrospectiva do impacto técnico e de negócios do lançamento.
- **Atividades**:
  - Monitoramento de erros ou exceções não mapeadas nas primeiras 48 horas pós-deploy.
  - Registro de possíveis débitos técnicos identificados durante a aceleração da entrega no `TECH_DEBT_REGISTRY.md`.
  - Atualização dos guias estruturais e diagramas de arquitetura no diretório `docs/`.
