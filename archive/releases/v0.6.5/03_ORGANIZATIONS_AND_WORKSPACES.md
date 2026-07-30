# Release v0.6.5 — Organizations and Workspaces

## 1. Relational Layout
Instead of isolated projects, Sauron OS implements a nested parent-child layout:
- **Organization**: The top-level legal entity or group (e.g., "Consultoria Arcanjo" or "Grupo Topázio"). Contains workspaces, members, and teams.
- **Workspace**: A dedicated space representing a specific project or environment. Includes companies, brands, stores, allowed users, cost centers, active presentations, action plans, meetings, and data sources.

## 2. Seeded Environments
Two standard environments are configured to demonstrate the separation:
1. **Consultoria Arcanjo** (`org_arcanjo`):
   - Internal planning workspace.
   - Restricted to consultants and super administrators.
2. **Grupo Topázio** (`org_client_topazio`):
   - External collaborative workspace for the automotive retail group.
   - Includes actual retail branches (Nissan Feira, Fiat Centro).
   - Grants multi-role access (Directors, Managers, Auditors, Finance).
