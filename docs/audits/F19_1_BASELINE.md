# F19.1 — Baseline

**Data:** 2026-07-18  
**Hora:** início das 20h39 (horário local, UTC-3)  
**Responsável:** Agente Antigravity (inspeção automatizada)  
**Escopo:** Human Validation & Accessibility Closure  

---

## 1. Estado técnico antes das correções F19.1

### typecheck
```
npm run typecheck → ✅ 0 erros (tsc --noEmit)
```

### Vitest
```
npx vitest run → ✅ 369/369 testes passando
76 arquivos de teste | duração: 169s
```

### Build
```
A ser executado na validação final (Bloco 12)
```

### Playwright (último resultado conhecido)
```
Suíte anterior F19: 27/27 — 3,0 min
Novo spec F19.1 (f19-1-human-accessibility-closure.spec.ts): a executar
```

### git diff --check
```
A executar na validação final
```

---

## 2. Documentos de referência lidos

| Documento | Status |
|---|---|
| `F19_HUMAN_USABILITY_BASELINE.md` | ✅ Lido |
| `F19_HUMAN_OBSERVATION_REPORT.md` | ✅ Lido — sessão humana pendente |
| `F19_ACCESSIBILITY_AUDIT.md` | ✅ Lido — audit formal pendente |
| `F19_CONSULTANT_DELIGHT_CERTIFICATION.md` | ✅ Lido |

---

## 3. Problemas de acessibilidade identificados antes das correções

### P0 — critical (WCAG 1.3.1 / 4.1.2)

| ID | Tela | Problema | Regra WCAG |
|---|---|---|---|
| A1 | Login (ambos os forms) | Inputs sem `<label>` associado — apenas `placeholder` | 1.3.1 / 4.1.2 |
| A2 | Login | Ícones decorativos sem `aria-hidden="true"` lidos por AT | 1.1.1 |
| A3 | Login | Mensagens de erro sem `role="alert"` | 4.1.3 |
| A4 | Login | `<h3>` usado como título de form sem hierarquia correta | 1.3.1 |

### P1 — serious

| ID | Tela | Problema |
|---|---|---|
| A5 | Forms | Inputs sem `autoComplete` correto (senha, e-mail) |
| A6 | Botão login | `aria-busy` ausente durante submissão |
| A7 | Modais | Sem verificação de focus trap e retorno de foco |
| A8 | Focus | `focus:outline-none` sem substituto visível em vários inputs |

### P2 — moderate

| ID | Tela | Problema |
|---|---|---|
| A9 | Todos | Foco `outline-none` sem ring visível em vários elementos |
| A10 | Sidebar | Grupos de nav sem `aria-label` próprio |

---

## 4. Correções aplicadas nesta sessão (antes da validação)

### LoginScreen.tsx — A1, A2, A3, A4, A5, A6, A7, A8

| Correção | Evidência |
|---|---|
| `<label htmlFor="...">` com `className="sr-only"` adicionado a todos inputs | Inputs `boot-fullname`, `boot-email`, `boot-password`, `boot-confirm-password`, `boot-org-name`, `login-email`, `login-password` |
| `aria-hidden="true"` nos ícones decorativos Lucide | AlertCircle, Mail, Lock, User, Building, Shield, ChevronRight |
| `role="alert"` nas divs de erro (`loginError`, `bootError`, `isExpired`) | Lido imediatamente por screen readers |
| `aria-labelledby` nos forms (boot-form-title, login-form-title) | Vinculação semântica form → heading |
| `<h3>` → `<h2>` com `id` para heading de nível correto | boot-form-title, login-form-title |
| `autoComplete` correto em todos inputs | `name`, `email`, `new-password`, `current-password`, `organization` |
| `aria-busy={isSubmitting}` no botão de submit | Estado de carregamento semântico |
| `focus:ring-2 focus:ring-blue-500` substituindo `focus:outline-none` sem substituto | Anel de foco visível em todos inputs |
| `aria-live="polite"` no texto de carregamento | Lido por AT ao mudar |

---

## 5. Arquivos novos criados

| Arquivo | Propósito |
|---|---|
| `tests/e2e/f19-1-human-accessibility-closure.spec.ts` | Suíte de regressão axe/WCAG + teclado + zoom + jornada |
| `docs/audits/F19_1_BASELINE.md` | Este documento |
| `docs/audits/F19_HUMAN_OBSERVATION_REPORT.md` | Atualizado nesta sessão |
| `docs/audits/F19_ACCESSIBILITY_AUDIT.md` | Atualizado nesta sessão |
| `docs/audits/F19_1_FINAL_CERTIFICATION.md` | A ser criado na validação final |

---

## 6. Estado da sessão humana

> **BLOQUEADOR DOCUMENTADO:** A sessão humana prevista no BLOCO 1 não pode ser executada por agente de IA.
> 
> O Bloco 1 exige:
> - Uma pessoa real (consultor experiente, não técnico)
> - Ambiente limpo
> - Observador em silêncio
> - Registro literal de hesitações, dúvidas e erros
>
> O agente de IA **não substitui** essa sessão.
> O presente documento registra o baseline técnico, as correções de acessibilidade formais (axe/WCAG), e os relatórios de teclado/zoom automatizados.
>
> **O parecer F19.1 permanece condicionado à sessão humana real.**

---

## 7. Critérios técnicos verificados

| Critério | Status |
|---|---|
| typecheck (tsc --noEmit) | ✅ 0 erros |
| Vitest 369/369 | ✅ passando |
| Build | ⏳ a executar |
| Playwright 27/27 (anterior) | ✅ histórico |
| Novo E2E F19.1 | ⏳ a executar |
| axe critical = 0 | ⏳ dependente do E2E |
| axe serious = 0 | ⏳ dependente do E2E |
| Inputs com label | ✅ corrigido (LoginScreen) |
| Foco visível (ring) | ✅ corrigido (LoginScreen) |
| role=alert em erros | ✅ corrigido (LoginScreen) |
| aria-hidden em ícones | ✅ corrigido (LoginScreen) |
| Sessão humana | ❌ pendente |

---

## 8. Limitação formal

Este baseline **não autoriza** o parecer `APROVADO PARA TESTE HUMANO AMPLIADO`.

Autoriza a continuação das correções técnicas e execução formal da suíte axe E2E.

O parecer final só pode ser emitido após:
1. Sessão humana real concluída com registro de evidências
2. axe critical = 0, serious = 0 em todas as telas auditadas
3. Playwright F19.1 passando
4. typecheck + build aprovados
