import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';
import { consultantWorkspaceManager } from '../modules/consultant-workspace/ConsultantWorkspaceManager';
import { ClientEntity } from '../modules/consultant-workspace/types';
import { identityEngine } from '../core/identity/IdentityEngine';

interface ClientManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelected?: (client: ClientEntity) => void;
}

export const ClientManagementModal: React.FC<ClientManagementModalProps> = ({
  isOpen,
  onClose,
  onClientSelected
}) => {
  const [clients, setClients] = useState<ClientEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Formulário de Cadastro / Edição
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [legalName, setLegalName] = useState<string>('');
  const [tradeName, setTradeName] = useState<string>('');
  const [document, setDocument] = useState<string>('');
  const [segment, setSegment] = useState<string>('');

  const currentUser = identityEngine.getCurrentUser();

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultantWorkspaceManager.clientService.listClientEntities(currentUser);
      setClients(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar a lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadClients();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsEditing(false);
    setSelectedClientId(null);
    setLegalName('');
    setTradeName('');
    setDocument('');
    setSegment('');
    setError(null);
  };

  const handleOpenEdit = (client: ClientEntity) => {
    setIsEditing(true);
    setSelectedClientId(client.id);
    setLegalName(client.legalName);
    setTradeName(client.tradeName || '');
    setDocument(client.document);
    setSegment(client.segment || '');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isEditing && selectedClientId) {
        await consultantWorkspaceManager.clientService.updateClient(
          selectedClientId,
          { legalName, tradeName, document, segment },
          currentUser
        );
      } else {
        const created = await consultantWorkspaceManager.clientService.createClient(
          { legalName, tradeName, document, segment },
          currentUser
        );
        if (onClientSelected) {
          onClientSelected(created);
        }
      }
      resetForm();
      await loadClients();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar dados do cliente.');
    }
  };

  const filteredClients = clients.filter(c => 
    c.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.document.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.tradeName && c.tradeName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
            <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg">Gestão de Clientes</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensagem de Erro / Alerta */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* Formulário (4 cols no lg) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              {isEditing ? <Edit2 size={14} /> : <Plus size={14} />}
              <span>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ACME Indústria S.A."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  placeholder="Ex: ACME Corp"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ / Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 00.000.000/0001-00"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Segmento de Atuação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Varejo, Indústria, Serviços"
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
                  {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>

          {/* Listagem (7 cols no lg) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Clientes Cadastrados ({filteredClients.length})
              </h3>
              <div className="relative w-48">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-xs text-slate-400">Carregando clientes...</div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                Nenhum cliente cadastrado atende aos critérios.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredClients.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{c.legalName}</span>
                        {c.tradeName && <span className="text-[10px] font-normal text-slate-500">({c.tradeName})</span>}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        CNPJ: <span className="font-medium text-slate-700 dark:text-slate-300">{c.document}</span> | Segmento: {c.segment || 'Geral'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Editar cliente"
                      >
                        <Edit2 size={14} />
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
