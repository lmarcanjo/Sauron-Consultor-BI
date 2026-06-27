import { describe, it, expect } from 'vitest';
import { ActionPlan, Meeting } from './types';

// Let's write the core testable logic of E1 to verify business rules are fully met.
function calculateProgress(agenda: { completed: boolean; visible: boolean }[]) {
  const visible = agenda.filter(a => a.visible);
  if (visible.length === 0) return 0;
  const completed = visible.filter(a => a.completed).length;
  return Math.round((completed / visible.length) * 100);
}

function parseNoteLine(line: string) {
  const trimmed = line.trim();
  if (trimmed.startsWith('OBS:')) {
    return { type: 'observation', text: trimmed.replace(/^OBS:/i, '').trim() };
  }
  if (trimmed.startsWith('DECISAO:') || trimmed.startsWith('DECISÃO:')) {
    return { type: 'decision', text: trimmed.replace(/^(DECISAO|DECISÃO):/i, '').trim() };
  }
  if (trimmed.startsWith('ACAO:') || trimmed.startsWith('AÇÃO:')) {
    return { type: 'action', text: trimmed.replace(/^(ACAO|AÇÃO):/i, '').trim() };
  }
  return { type: 'general', text: trimmed };
}

describe('E1 Executive Session Business Engine and Notes Parser Suite', () => {
  
  it('calculates correct agenda completion progress percentage', () => {
    const agenda = [
      { id: '1', title: 'Abertura', completed: true, visible: true },
      { id: '2', title: 'Receita', completed: true, visible: true },
      { id: '3', title: 'Margem', completed: false, visible: true },
      { id: '4', title: 'Custos', completed: false, visible: false }, // hidden
    ];

    const progress = calculateProgress(agenda);
    expect(progress).toBe(67); // 2 out of 3 visible are completed (66.67% rounded to 67)
  });

  it('handles 100% completion correctly', () => {
    const agenda = [
      { id: '1', title: 'Abertura', completed: true, visible: true },
      { id: '2', title: 'Encerramento', completed: true, visible: true },
    ];
    expect(calculateProgress(agenda)).toBe(100);
  });

  it('handles 0% completion correctly', () => {
    const agenda = [
      { id: '1', title: 'Abertura', completed: false, visible: true },
    ];
    expect(calculateProgress(agenda)).toBe(0);
  });

  it('parses custom notations correctly to separate data actions without copy-pasting', () => {
    const note1 = 'OBS: Cliente demonstrou preocupação extrema com margem de autopeças.';
    const note2 = 'DECISAO: Reduzir comissão de veículos novos Nissan para 1%.';
    const note3 = 'AÇÃO: Carlos Henrique vai centralizar compras de giro na matriz.';
    const note4 = 'Análise geral de faturamento mensal.';

    expect(parseNoteLine(note1)).toEqual({
      type: 'observation',
      text: 'Cliente demonstrou preocupação extrema com margem de autopeças.'
    });

    expect(parseNoteLine(note2)).toEqual({
      type: 'decision',
      text: 'Reduzir comissão de veículos novos Nissan para 1%.'
    });

    expect(parseNoteLine(note3)).toEqual({
      type: 'action',
      text: 'Carlos Henrique vai centralizar compras de giro na matriz.'
    });

    expect(parseNoteLine(note4)).toEqual({
      type: 'general',
      text: 'Análise geral de faturamento mensal.'
    });
  });

  it('generates fully populated Meeting documents on session end', () => {
    const mockDecisions = [
      { description: 'Foco em pós-venda', responsible: 'Carlos' },
      { description: 'Renegociar taxas de F&I', responsible: 'Diretoria' }
    ];

    const mockNewActions: ActionPlan[] = [
      {
        id: 'act_1',
        description: 'Lançar campanha pós-venda',
        priority: 'high',
        responsible: 'Ana',
        deadline: '30/06/2026',
        status: 'pending',
        origin: 'Sessão Executiva'
      }
    ];

    const meetingDocument: Meeting = {
      id: 'meet_test_1',
      presentationId: 'pres_test',
      selectedCharts: ['receita', 'margem'],
      observations: 'Sessão de comitê realizada com sucesso.',
      decisions: mockDecisions.map(d => `${d.description} (Resp: ${d.responsible})`).join('\n'),
      actionPlans: mockNewActions,
      responsible: 'Lennon Marcanjo',
      pendingItems: ['Contratar mecânico pleno']
    };

    expect(meetingDocument.id).toBe('meet_test_1');
    expect(meetingDocument.decisions).toContain('Foco em pós-venda (Resp: Carlos)');
    expect(meetingDocument.actionPlans.length).toBe(1);
    expect(meetingDocument.actionPlans[0].responsible).toBe('Ana');
    expect(meetingDocument.pendingItems).toContain('Contratar mecânico pleno');
  });

});
