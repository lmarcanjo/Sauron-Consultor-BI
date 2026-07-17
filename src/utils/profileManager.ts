import { Shield, BarChart3, Sliders, BookOpen } from "lucide-react";

export interface CorporateProfile {
  name: string;
  email: string;
  password: string;
  role: "consultor" | "diretor" | "gerente" | "analista";
  description: string;
}

export const DEFAULT_PRESETS: CorporateProfile[] = [
  {
    name: "Consultor Técnico",
    email: "consultor@sauron.com",
    password: "consultor123",
    role: "consultor",
    description: "Responsável pela engenharia de dados. Can manage DB configuration strings, VPN tunneling, and Python/Streamlit exporter core code."
  },
  {
    name: "Diretor Regional",
    email: "diretor@sauron.com",
    password: "diretor123",
    role: "diretor",
    description: "Acesso tático completo aos KPIs. Permite visualizar todos os setores operacionais e simulações avançadas, sem expor códigos."
  },
  {
    name: "Gerente Geral",
    email: "gerente@sauron.com",
    password: "gerente123",
    role: "gerente",
    description: "Controle operacional interativo. Permite ajustar diretrizes, metas de alertas de margem operacional e visualizar relatórios setoriais."
  },
  {
    name: "Analista Financeiro",
    email: "analista@sauron.com",
    password: "analista123",
    role: "analista",
    description: "Modo leitura segura. Consulta dos demonstrativos contábeis das empresas com bloqueio absoluto de edições/gravações."
  }
];

export function getStoredProfiles(): CorporateProfile[] {
  const saved = localStorage.getItem("sauron_profiles");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_PRESETS;
    }
  }
  return DEFAULT_PRESETS;
}

export function saveStoredProfiles(profiles: CorporateProfile[]) {
  localStorage.setItem("sauron_profiles", JSON.stringify(profiles));
}

export interface LgpdLog {
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

export function auditLog(action: string, details: string, user = "Sistema Sauron (Automático)") {
  try {
    const savedLogs = localStorage.getItem("sauron_lgpd_logs");
    let logs: LgpdLog[] = [];
    if (savedLogs) {
      try {
        logs = JSON.parse(savedLogs);
      } catch (e) {
        logs = [];
      }
    }
    const newLog: LgpdLog = {
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
      ip: "192.168.3.112" // IP do dispositivo cliente do colaborador
    };
    const updated = [newLog, ...logs].slice(0, 100); // Guardar os últimos 100 eventos
    localStorage.setItem("sauron_lgpd_logs", JSON.stringify(updated));
  } catch (e) {
    console.warn("Falha no log corporativo de conformidade:", e);
  }
}
