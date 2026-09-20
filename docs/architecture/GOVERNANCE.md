# ASTERION — Governança e Qualidade da Plataforma

Este documento define as regras de governança, gates de qualidade e critérios de aceite da plataforma ASTERION.

---

## 1. Quality Gates
- **Typecheck**: Zero erros no `npx tsc --noEmit`.
- **Testes Unitários e Integração**: 100% dos testes da suíte passando sem falhas.
- **Build de Produção**: `npm run build` limpo e finalizado com sucesso.

---

## 2. Definition of Ready (DoR)
- Especificação de UX / Constituição aprovada.
- Modelo de Domínio e Invariantes definidos.
- ADR registrado para mudanças de arquitetura relevantes.

---

## 3. Definition of Done (DoD)
- Código implementado seguindo Arquitetura Hexagonal.
- Suíte de testes isolada criada em Vitest.
- Emissão dos eventos de auditoria oficiais configurada.
- Validações de typecheck e build aprovadas.
