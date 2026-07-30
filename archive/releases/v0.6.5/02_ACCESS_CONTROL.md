# Release v0.6.5 — Access Control Engine

## 1. Permission Matrix
Sauron OS provides granular permission tags across different domains (workspaces, data streams, analytics, presentations, meetings, action plans, and user management).

| Domain | Permission | Description |
|---|---|---|
| Workspace | `workspace.view` | Access the primary workspace view |
| Workspace | `workspace.manage` | Modify workspace settings and policies |
| Data | `data.view` | Read imported financial data and ledger |
| Data | `data.import` | Upload spreadsheets or sync with DB |
| Data | `data.sync` | Re-run consolidation routines |
| Data | `data.approve` | Certify monthly data reconciliations |
| Presentation| `presentation.view`| Play presentations/slides |
| Presentation| `presentation.edit`| Edit titles, slide configurations |
| Users | `users.invite` | Send workspace invitations |
| Audit | `audit.view` | View core access audit ledger |

## 2. Evaluation Scopes
Permissions can be restricted to specific contextual scopes:
1. **Global**: Full system clearance.
2. **Organization**: Restricted to the user's active organization.
3. **Workspace**: Restricted to a specific workspace ID.
4. **Group**: Restricted to a customer business group.
5. **Company**: Restricted to a specific legal entity.
6. **Store**: Restricted to a specific physical branch/store.
7. **Cost Center**: Restricted to an individual financial cost center.

## 3. Usage Pattern
To check access on a specific resource (e.g. store, slide):
```typescript
import { accessControlEngine } from "./AccessControlEngine";

const userHasAccess = accessControlEngine.can(currentUser, "data.view", {
  type: "store",
  id: "Loja Nissan Feira"
});
```
