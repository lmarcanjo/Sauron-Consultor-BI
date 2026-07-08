/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityScore, PlatformUser } from "./types";
import { userManager } from "./UserManager";
import { invitationManager } from "./InvitationManager";
import { auditEngine } from "../audit/AuditEngine";

export class SecurityScoreEngine {
  private static instance: SecurityScoreEngine;

  private constructor() {}

  public static getInstance(): SecurityScoreEngine {
    if (!SecurityScoreEngine.instance) {
      SecurityScoreEngine.instance = new SecurityScoreEngine();
    }
    return SecurityScoreEngine.instance;
  }

  /**
   * Calculates the security maturity score dynamically for the organization or whole platform.
   */
  public calculateMaturityScore(organizationId?: string): SecurityScore {
    const allUsers = userManager.getUsers();
    const orgUsers = organizationId 
      ? allUsers.filter(u => u.organizationId === organizationId)
      : allUsers;

    const totalUsersCount = orgUsers.length;

    // 1. MFA Adoption Rate (weight: 20%)
    // Since our mock profiles don't have a strict MFA boolean yet, we simulate MFA adoption:
    // Super Admins, Consultant Admins, and any users who have simulated MFA sessions have MFA enabled.
    const mfaUsers = orgUsers.filter(u => 
      u.role === "Super Admin" || 
      u.role === "Consultant Admin" || 
      u.profile.email.endsWith("@arcanjoconsulting.com")
    );
    const mfaAdoptionRate = totalUsersCount > 0 
      ? Math.round((mfaUsers.length / totalUsersCount) * 100) 
      : 100;

    // 2. Password Policy (weight: 15%)
    // Represented as enabled across the platform
    const passwordPolicyEnabled = true;

    // 3. Idle/Inactive Users (> 90 days) (weight: 15%)
    // Check users who haven't updated or loaded active state recently.
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const idleUsers = orgUsers.filter(u => {
      const lastActive = new Date(u.updatedAt);
      return lastActive < ninetyDaysAgo;
    });
    const idleUsersCount = idleUsers.length;

    // 4. Expired Invitations (weight: 10%)
    const allInvites = invitationManager.getInvitations();
    const orgInvites = organizationId 
      ? allInvites.filter(i => i.organizationId === organizationId)
      : allInvites;
    const expiredInvitationsCount = orgInvites.filter(i => i.status === "expired").length;

    // 5. Excessive Administrators Ratio (weight: 10%)
    // Best practice is to have < 20% of the workspace as admins. If higher, we penalize.
    const admins = orgUsers.filter(u => u.role === "Super Admin" || u.role === "Consultant Admin");
    const adminsCount = admins.length;
    const adminRatio = totalUsersCount > 0 ? (adminsCount / totalUsersCount) : 0;

    // 6. Audit Logging Rate (weight: 15%)
    // Read total logged events to ensure transparency is operational.
    const auditEvents = auditEngine.getLogs();
    const auditActivityRate = auditEvents.length > 5 ? 100 : auditEvents.length * 20;

    // 7. SSO (Single Sign-On) (weight: 15%)
    // Standard Enterprise configuration
    const ssoEnabled = organizationId === "org_arcanjo"; // enabled for the main consulting holding

    // 8. Session Timeout Policy (weight: 10%)
    const sessionStrictTimeout = true;

    // --- WEIGHTED SCORE CALCULATION ---
    let score = 0;

    // MFA: 20% max
    score += (mfaAdoptionRate / 100) * 20;

    // Password Policy: 15%
    if (passwordPolicyEnabled) score += 15;

    // Idle Users Penalty: max 15%. Deduct 3% per idle user, down to 0.
    const idlePenalty = Math.min(15, idleUsersCount * 3);
    score += (15 - idlePenalty);

    // Expired Invitations Penalty: max 10%. Deduct 2% per expired invitation, down to 0.
    const expiredPenalty = Math.min(10, expiredInvitationsCount * 2);
    score += (10 - expiredPenalty);

    // Admin Ratio Penalty: max 10%. If ratio > 30%, deduct points proportionately.
    if (adminRatio > 0.3) {
      score += 5; // heavily penalized
    } else {
      score += 10; // optimal administrative surface
    }

    // Audit rate: 15% max
    score += (auditActivityRate / 100) * 15;

    // SSO: 15%
    if (ssoEnabled) score += 15;

    // Strict Session timeout: 10%
    if (sessionStrictTimeout) score += 10;

    // Round the final result
    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    return {
      score: finalScore,
      criteria: {
        mfaAdoptionRate,
        passwordPolicyEnabled,
        idleUsersCount,
        expiredInvitationsCount,
        adminsCount,
        auditActivityRate,
        ssoEnabled,
        sessionStrictTimeout
      },
      lastEvaluatedAt: now.toISOString()
    };
  }
}

export const securityScoreEngine = SecurityScoreEngine.getInstance();
export default securityScoreEngine;
