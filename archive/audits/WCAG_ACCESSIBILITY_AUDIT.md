# WCAG Accessibility Audit

Date: 2026-07-16
Status: PENDING FORMAL AUTOMATED AUDIT.

## Scope

The required surfaces are Login, Empresas e Grupos, Importacao, Biblioteca,
Configuracao, Context Selector, DRE, Dashboard, Apresentacao, Ata and Plano.

The RC-3 journey uses native buttons, labels, selects and headings for the
multi-company path. Keyboard navigation and browser console cleanliness are
part of the focused Playwright journey. The product still does not include an
axe-core dependency or a CI axe run, so this document is not an assertion of
WCAG conformance.

## Required next evidence

- axe scan with zero critical and serious violations;
- visible focus through the complete modal flow;
- Tab, Enter and Escape coverage;
- focus return after closing dialogs;
- 200% zoom review;
- non-color-only status communication.

Until those checks are automated and recorded, the accessibility gate remains
open.
