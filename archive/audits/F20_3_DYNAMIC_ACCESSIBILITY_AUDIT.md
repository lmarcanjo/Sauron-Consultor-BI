# F20.3 Dynamic Accessibility Audit

## Scope

The audit covers the dynamic area route, the model configuration area, archive
and delete dialogs, trash recovery controls, blueprint preview, loading/empty
states and the sidebar entry generated from Project DNA.

## Controls implemented

- dynamic routes use stable `custom_area_<areaId>` identities;
- lifecycle and delete dialogs expose `role="dialog"`, `aria-modal` and
  labelled headings;
- toast feedback uses a polite live region;
- buttons have action labels, including archive and close controls;
- dynamic rows are bounded and do not force the complete workbook into the
  React tree;
- keyboard-visible native controls are used for fields, permissions and
  confirmations;
- a dynamic area without access exposes no name, fields, metrics or records.

## Evidence

The focused F20.3 Playwright route test validates reload and invalid deep-link
fallback. The existing F19 axe suite remains the cross-screen accessibility
gate. The final certification records the last complete axe and Playwright
results; no passing status is inferred from typecheck alone.

## Remaining gate

The full certification is approved only when the dynamic route axe run reports
zero `critical` and `serious` violations and the complete Playwright suite has
no browser errors, warnings or duplicate-key warnings.
