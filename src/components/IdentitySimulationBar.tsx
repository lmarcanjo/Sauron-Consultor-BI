/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Shield, Sparkles, User, LogOut, Check } from "lucide-react";
import { identityEngine } from "../core/identity/IdentityEngine";
import { PlatformUser } from "../core/identity/types";

interface IdentitySimulationBarProps {
  onContextChanged: () => void;
}

export const IdentitySimulationBar: React.FC<IdentitySimulationBarProps> = ({ onContextChanged }) => {
  const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  const isQaUrl = typeof window !== "undefined" && window.location.search.includes("qa=true");
  const isQaMode = isDev || isQaUrl; // Active in dev or with url param

  const [activeOverride, setActiveOverride] = useState<PlatformUser | null>(identityEngine.getQaUserOverride());

  if (!isQaMode) {
    return null;
  }

  // Create temporary in-memory QA identities (No banned words, completely temporary)
  const qaUsers: PlatformUser[] = [
    {
      id: "qa_super_admin",
      profile: {
        id: "qa_super_admin",
        fullName: "Super Admin (QA)",
        email: "qa.admin@consultoria.local",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=qaadmin"
      },
      role: "SUPER_ADMIN",
      organizationId: "org_qa_temp",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "qa_consultant",
      profile: {
        id: "qa_consultant",
        fullName: "Consultor Técnico (QA)",
        email: "qa.consultor@consultoria.local",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=qaconsultor"
      },
      role: "CONSULTANT",
      organizationId: "org_qa_temp",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const handleSimulate = (user: PlatformUser) => {
    identityEngine.setQaUserOverride(user);
    setActiveOverride(user);
    onContextChanged();
  };

  const handleClearOverride = () => {
    identityEngine.setQaUserOverride(null);
    setActiveOverride(null);
    onContextChanged();
  };

  return (
    <div id="simulation-bar" className="w-full bg-amber-600 text-white py-2 px-4 sticky top-0 z-30 shadow-md font-sans text-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="animate-pulse" />
        <span className="font-extrabold uppercase tracking-wider">Modo QA Ativo</span>
        <span className="bg-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium">Identidades Temporárias em Memória</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-amber-100 font-semibold">Simular Identidade:</span>
        <div className="flex items-center gap-1.5">
          {qaUsers.map(u => {
            const isSelected = activeOverride?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => handleSimulate(u)}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer flex items-center gap-1 ${isSelected ? "bg-white text-amber-700 shadow-sm" : "bg-amber-700 hover:bg-amber-800 text-white border border-amber-500/20"}`}
              >
                <User size={11} />
                <span>{u.profile.fullName}</span>
                {isSelected && <Check size={11} className="stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {activeOverride && (
          <button
            onClick={handleClearOverride}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors cursor-pointer text-[10px] uppercase"
            title="Sair do modo de simulação em memória"
          >
            <LogOut size={11} />
            <span>Desativar</span>
          </button>
        )}
      </div>
    </div>
  );
};
