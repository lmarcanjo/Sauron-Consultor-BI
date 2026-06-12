import React, { useState } from "react";
import { Shield, Coins, Sliders, BookOpen, Lock, Sparkles, Building, BarChart3, Sun, Moon } from "lucide-react";
import { getStoredProfiles, CorporateProfile } from "../utils/profileManager";

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; role: "consultor" | "diretor" | "gerente" | "analista" }) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

const roleMeta = {
  consultor: {
    icon: Shield,
    iconColor: "text-amber-500",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/85 dark:text-amber-300",
  },
  diretor: {
    icon: BarChart3,
    iconColor: "text-indigo-500",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/85 dark:text-indigo-300",
  },
  gerente: {
    icon: Sliders,
    iconColor: "text-emerald-500",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/85 dark:text-emerald-300",
  },
  analista: {
    icon: BookOpen,
    iconColor: "text-slate-500",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800/85 dark:text-slate-300",
  }
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, darkMode, setDarkMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [presets, setPresets] = useState<CorporateProfile[]>(() => getStoredProfiles());

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    const matched = presets.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() && p.password === password
    );

    if (matched) {
      onLogin({
        name: matched.name,
        email: matched.email,
        role: matched.role
      });
    } else {
      setError("Credenciais incorretas para teste seguro. Verifique ou selecione um perfil acima.");
    }
  };

  const handleSelectPreset = (p: CorporateProfile) => {
    setEmail(p.email);
    setPassword(p.password);
    setError("");
    // Instant login for super slick experience
    onLogin({
      name: p.name,
      email: p.email,
      role: p.role
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-center items-center py-10 px-4 transition-colors duration-150">
      {/* Dark mode switcher top-right */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          {darkMode ? (
            <>
              <Sun size={13} className="text-amber-500" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon size={13} className="text-indigo-500" />
              <span>Modo Escuro</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-4xl w-full space-y-6">
        {/* LOGO AREA */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-slate-900 border border-slate-750 p-1.5 rounded-lg text-white font-mono font-bold tracking-wider uppercase text-xs">
            <Shield size={14} className="text-blue-400" />
            <span>SAURON SEGURANÇA CORPORATIVA</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Portal de Acesso Consolidado
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Selecione um perfil de acesso ou digite suas credenciais para navegar. O sistema separa automaticamente a aplicação de configuração técnica da aplicação do usuário operacional.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Preset profiles quick cards */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-widest block pl-1">
              Perfis Corporativos Disponíveis para Autenticação
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map((preset) => {
                const meta = roleMeta[preset.role] || roleMeta.analista;
                const IconComponent = meta.icon;
                return (
                  <button
                    key={preset.role}
                    onClick={() => handleSelectPreset(preset)}
                    className="text-left p-4 bg-white dark:bg-slate-900 border hover:border-blue-500 hover:dark:border-blue-400 dark:border-slate-850 rounded-xl transition-all hover:shadow-md cursor-pointer flex flex-col justify-between h-52 group relative overflow-hidden"
                  >
                    {/* Decorative backdrop glow */}
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-100 dark:bg-slate-950/40 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                    
                    <div className="relative space-y-2">
                    <div className="flex justify-between items-center">
                        <div className={`p-1.5 rounded bg-slate-50 dark:bg-slate-850 ${meta.iconColor}`}>
                          <IconComponent size={16} />
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${meta.badgeColor}`}>
                          {preset.role}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono select-all font-semibold mt-0.5">
                          {preset.email}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mt-2 relative">
                      {preset.description}
                    </p>

                    <div className="pt-2 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform relative">
                      <span>Entrar neste perfil</span>
                      <span>&rarr;</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Manual Login credentials form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-xs font-extrabold uppercase text-slate-700 dark:text-white tracking-widest flex items-center gap-1">
                <Lock size={12} className="text-slate-400" />
                <span>Credenciamento Manual</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Para acessos externos ou simulação estrita de credenciais.</p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg text-[10px] font-medium text-red-700 dark:text-red-400 animate-fade-in/70">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">E-mail Corporativo:</label>
                <input
                  type="email"
                  placeholder="exemplo@sauron.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 focus:bg-white border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Senha Secreta:</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 focus:bg-white border border-slate-200 dark:border-slate-705 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase tracking-wider text-xs rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <span>Validar Acesso</span>
                <Sparkles size={12} />
              </button>
            </form>

            <div className="bg-slate-50 dark:bg-slate-1000 p-3 rounded-xl border border-slate-150 dark:border-slate-850 text-left space-y-1 text-[9px] font-mono leading-relaxed">
              <p className="font-extrabold text-slate-600 dark:text-slate-400 uppercase">INFORMAÇÃO RELEVANTE:</p>
              <p className="text-slate-500 dark:text-slate-400">
                A senha padrão para cada perfil é o nome dele seguido de "123". <br />
                Exemplo: <span className="text-blue-500 font-bold select-all">consultor@sauron.com</span> / <span className="text-blue-500 font-bold select-all">consultor123</span>.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-normal font-medium">
          Holding Sauron &copy; 2026. Auditoria de dados de Concessionárias de Voo em conformidade com padrões e governança contábil.
        </p>
      </div>
    </div>
  );
};
