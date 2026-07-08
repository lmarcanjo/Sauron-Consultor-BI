# Release v0.6.5 — Collaboration Model

## 1. Invitation Lifecycle
Collaborators are onboarded using the `InvitationManager`:
- **Created**: An invitation is registered with an email, a target role, scope boundaries, and a target workspace.
- **Expiry**: Invitations automatically expire after a predefined duration (e.g. 7 days).
- **Cancelled**: Administrators can cancel pending invitations at any time.
- **Accepted**: Accepting an invitation assigns the user to the organization, provisions workspace-level security policies, and configures their active profile.

## 2. Temporary Secure Sharing
External third parties or board members can view specific assets (like active presentations or action plans) via temporary share tokens managed by `ShareLinkManager`:
- Requires an expiry duration in hours.
- Restricts view access using custom security permissions (e.g. `presentation.view`).
- Can be revoked instantly.
- Handled safely inside iframe environments without full account creation.
