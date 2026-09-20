import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit2, AlertCircle, X, Building2, Archive, RotateCcw } from 'lucide-react';
import { consultantWorkspaceManager } from '../modules/consultant-workspace/ConsultantWorkspaceManager';
import { ClientEntity, WorkspaceProject } from '../modules/consultant-workspace/types';
import { identityEngine } from '../core/identity/IdentityEngine';

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEngagementCreated?: (engagement: WorkspaceProject) => void;
  initialClientId?: string;
}

export const EngagementModal: React.FC<EngagementModalProps> = ({
  isOpen,
  onClose,
  onEngagementCreated,
  initialClientId
}) => {
  const [clients, setClients] = useState<ClientEntity[]>([]);
  const [engagements, setEngagements] = useState<WorkspaceProject[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [name, setName] = useState<string>('');
  const [segment, setSegment] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = identityEngine.getCurrentUser();

  const loadClientsAndEngagements = async () => {
    setLoading(true);
    setError(null);
    try {
      const clientList = await consultantWorkspaceManager.clientService.listClientEntities(currentUser);
      setClients(clientList);

      const targetClientId = selectedClientId || (clientList.length > 0 ? clientList[0].id : '');
      if (targetClientId) {
        if (!selectedClientId) setSelectedClientId(targetClientId);
        const engList = await consultantWorkspaceManager.engagementService.listEngagementsByClient(targetClientId, currentUser);
        setEngagements(engList);
      } else {
        setEngagements([]);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar engajamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadClientsAndEngagements();
      resetForm();
    }
  }, [isOpen, selectedClientId]);

  const resetForm = () => {
    setName('');
    setSegment('');
    setIsEditing(false);
    setEditingId(null);
    setError(null);
  };

  const handleOpenEdit = (eng: WorkspaceProject) => {
    setIsEditing(true);
    setEditingId(eng.id);
    setName(eng.group || eng.client);
    setSegment(eng.segment || '');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClientId) {
      setError('Selecione um Cliente válido.');
      return;
    }

    const matchedClient = clients.find(c => c.id === selectedClientId);

    try {
      if (isEditing && editingId) {
        await consultantWorkspaceManager.engagementService.updateEngagement(
          editingId,
          { name, segment, clientId: selectedClientId, clientName: matchedClient?.legalName },
          currentUser
        );
      } else {
        const created = await consultantWorkspaceManager.engagementService.createEngagement(
          {
            name,
            clientId: selectedClientId,
            clientName: matchedClient?.legalName || 'Cliente',
            segment: segment || matchedClient?.segment || 'Serviços'
          },
          currentUser
        );

        if (onEngagementCreated) {
          onEngagementCreated(created);
        }
        onClose();
      }
      resetForm();
      await loadClientsAndEngagements();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar o Engajamento.');
    }
  };

  const handleToggleArchive = async (eng: WorkspaceProject) => {
    try {
      await consultantWorkspaceManager.engagementService.archiveEngagement(eng.id, !eng.isArchived, currentUser);
      await loadClientsAndEngagements();
    } catch (err: any) {
      setError(err.message || 'Falha ao alterar estado de arquivamento.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
            <Briefcase size={20} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg">Gestão de Engajamentos</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* Formulário */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              {isEditing ? <Edit2 size={14} /> : <Plus size={14} />}
              <span>{isEditing ? 'Editar Engajamento' : 'Novo Engajamento'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 size={12} /> Cliente Responsável *
                </label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.legalName} {c.document ? `(${c.document})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Engajamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reestruturação Operacional 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Segmento / Área de Atuação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Varejo, Indústria, Financeiro"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {isEditing ? 'Salvar Engajamento' : 'Criar Engajamento'}
                </button>
              </div>
            </form>
          </div>

          {/* Listagem */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Engajamentos do Cliente ({engagements.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-xs text-slate-400">Carregando engajamentos...</div>
            ) : engagements.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                Nenhum engajamento cadastrado para este cliente.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {engagements.map((eng) => (
                  <div
                    key={eng.id}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 transition-all ${
                      eng.isArchived 
                        ? 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          {eng.canonicalState || 'NO_SOURCE'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {eng.group || eng.client}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Segmento: {eng.segment} | Status: {eng.isArchived ? 'Arquivado' : 'Ativo'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(eng)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Editar Engajamento"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(eng)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                        title={eng.isArchived ? 'Reativar Engajamento' : 'Arquivar Engajamento'}
                      >
                        {eng.isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
