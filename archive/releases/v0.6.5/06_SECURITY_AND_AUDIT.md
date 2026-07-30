# Release v0.6.5 — Security and Audit

## 1. Traceability
Every security-critical event in the identity and collaboration modules is logged to Sauron's central, queryable audit trail ledger using the `AuditEngine`.

## 2. Tracked Events
The system registers the following standard events:
- `USER_INVITED`: When an administrator issues a workspace invitation.
- `USER_ROLE_CHANGED`: When a user is promoted or demoted.
- `USER_ACCESS_GRANTED` / `USER_ACCESS_REVOKED`: When workspace or org-level access is updated.
- `WORKSPACE_ACCESSED`: Tracked when a user switches context or views a dashboard.
- `SHARE_LINK_CREATED` / `SHARE_LINK_REVOKED`: Tracking generation of public sharing tokens.
- `PERMISSION_DENIED`: Triggered on unauthorized access attempts.
- `DIGITAL_TWIN_UPDATED`: Tracks updates to CNPJs, stores, and headcounts.
