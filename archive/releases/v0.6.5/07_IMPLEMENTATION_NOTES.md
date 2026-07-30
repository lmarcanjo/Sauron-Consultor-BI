# Release v0.6.5 — Implementation Notes

## 1. Local Storage Sync
All identity, organization, invitation, digital twin, and share link data is fully persisted inside browser `localStorage` under distinct namespace keys:
- `sauron_identity_users`
- `sauron_identity_organizations`
- `sauron_identity_workspaces`
- `sauron_identity_teams`
- `sauron_identity_invitations`
- `sauron_identity_share_links`
- `sauron_digital_twin_group`

This ensures that active simulation state is persistent across developer hot reloads.

## 2. Backward Compatibility
The `ConsultantWorkspaceManager` continues to read and write projects. The new `IdentityEngine` bridges this by mapping active workspace ids (like `ws_topazio`) to existing data, allowing consultants to keep existing spreadsheets, meetings, and plans intact.

## 3. Contextual Headers
The global layout is updated to display a Simulation Context switcher. This lets users instantly simulate different roles (e.g., viewing as "Carlos Loja Nissan", "Ana Financeiro", or "Silvia Auditora") to see the immediate effect of access policies and scopes in action.
