# Release v0.6.5 — Core Identity Model

## 1. Overview
The Core Identity module shifts Sauron OS from an individual consulting tool to a multi-tenant, collaborative operating platform. 

It defines standard interfaces for representing users, roles, organizations, memberships, and teams, establishing a clear security boundary for multi-user operations.

## 2. Strong Types Definition

### Role
```typescript
export type Role =
  | "Super Admin"
  | "Consultant Admin"
  | "Consultant"
  | "Client Director"
  | "Client Manager"
  | "Financial User"
  | "Controller"
  | "Auditor"
  | "Viewer"
  | "Guest";
```

### Platform User & User Profile
```typescript
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface PlatformUser {
  id: string;
  profile: UserProfile;
  role: Role;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

## 3. Seeded Actors (Simulated Sessions)
The system includes predefined users for simulation testing:
- **Lennon Marcanjo (Super Admin)**: Complete unrestricted access.
- **Gabriel Arcanjo (Consultant Admin)**: Full administrative consulting controls.
- **Roberto (Consultant)**: Core consultant with write access to data and presentations.
- **Dr. Roberto Topázio (Client Director)**: Full strategic overview of Grupo Topázio.
- **Carlos (Client Manager)**: Manager of Loja Nissan Feira.
- **Ana (Financial User)**: Finance team access at Loja Nissan Feira.
- **Silvia (Auditor)**: Independent read-only audit controls.
