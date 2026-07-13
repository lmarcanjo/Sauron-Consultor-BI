/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, RefreshCw, Home, Settings } from "lucide-react";

interface BoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onActionClick?: () => void;
  actionText?: string;
}

interface BoundaryState {
  hasError: boolean;
  error: any;
}

class BaseErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(`[ErrorBoundary] Captured crash:`, error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onActionClick) {
      this.props.onActionClick();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto mt-12 backdrop-blur-xs">
          <AlertTriangle size={36} className="text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            {this.props.fallbackTitle || "Não foi possível carregar esta área."}
          </h4>
          <p className="text-xs text-slate-400 font-medium">
            Ocorreu uma inconsistência de dados ou falha de renderização temporária em runtime.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <RefreshCw size={11} />
              <span>{this.props.actionText || "Tentar Novamente"}</span>
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("sauron:navigate-home"));
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-black uppercase tracking-wider transition-colors border border-slate-800 cursor-pointer"
            >
              <Home size={11} />
              <span>Voltar ao Início</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const GlobalAppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Falha Crítica no Sistema Sauron OS.">
    {children}
  </BaseErrorBoundary>
);

export const SidebarErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Painel de Navegação indisponível.">
    {children}
  </BaseErrorBoundary>
);

export const MainContentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Conteúdo principal falhou ao carregar.">
    {children}
  </BaseErrorBoundary>
);

export const EnterpriseCenterErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Não foi possível carregar o Enterprise Center.">
    {children}
  </BaseErrorBoundary>
);

export const DataLibraryErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Não foi possível carregar a Central de Dados.">
    {children}
  </BaseErrorBoundary>
);

export const DashboardErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Não foi possível renderizar a Dashboard Executiva.">
    {children}
  </BaseErrorBoundary>
);

export const PresentationErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Não foi possível montar os slides da Apresentação.">
    {children}
  </BaseErrorBoundary>
);

export const MeetingErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Não foi possível iniciar o Painel de Reunião.">
    {children}
  </BaseErrorBoundary>
);

export const SettingsErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseErrorBoundary fallbackTitle="Não foi possível carregar as Configurações de Acesso.">
    {children}
  </BaseErrorBoundary>
);
