import { describe, it, expect } from 'vitest';
import { 
  calculateProfit, 
  calculateMargin, 
  buildSellerRanking,
  isQueryReadOnly,
  isMockAllowed,
  validateFormula,
  validateTraceability
} from './calculations';
import { LancamentoFinanceiro } from '../types';

describe('Financial Calculations', () => {
  it('calculates profit correctly', () => {
    expect(calculateProfit(100, 20, 10)).toBe(70);
    expect(calculateProfit(50, 60, 0)).toBe(-10);
  });

  it('calculates margin correctly', () => {
    expect(calculateMargin(50, 100)).toBe(50);
    expect(calculateMargin(33.33, 100)).toBe(33.33);
    expect(calculateMargin(10, 0)).toBe(0);
  });

  it('builds seller ranking correctly grouped', () => {
    const mockData: LancamentoFinanceiro[] = [
      { id: '1', Grupo: 'A', Empresa: 'B', Marca: 'C', Categoria: 'Venda', CNPJ: '1', Mês: 'Jan', Razão: 'Venda', Vendedor: 'João', Receita: 100, Despesa: 0, Custo: 0, Lucro: 100, Margem: 100 },
      { id: '2', Grupo: 'A', Empresa: 'B', Marca: 'C', Categoria: 'Venda', CNPJ: '1', Mês: 'Jan', Razão: 'Venda', Vendedor: 'Maria', Receita: 200, Despesa: 50, Custo: 0, Lucro: 150, Margem: 75 },
      { id: '3', Grupo: 'A', Empresa: 'B', Marca: 'C', Categoria: 'Venda', CNPJ: '1', Mês: 'Jan', Razão: 'Devolução', Vendedor: 'João', Receita: 0, Despesa: 20, Custo: 0, Lucro: -20, Margem: 0 },
    ];

    const ranking = buildSellerRanking(mockData);
    
    expect(ranking.length).toBe(2);
    expect(ranking[0].vendedor).toBe('Maria');
    expect(ranking[0].lucro).toBe(150);
    
    expect(ranking[1].vendedor).toBe('João');
    expect(ranking[1].lucro).toBe(80);
    expect(ranking[1].receitas).toBe(100);
    expect(ranking[1].despesas).toBe(20);
  });

  it('verifies that SQL queries are read-only (SELECT only)', () => {
    expect(isQueryReadOnly('SELECT * FROM faturamento')).toBe(true);
    expect(isQueryReadOnly('select name, revenue from clients where id = 1')).toBe(true);
    expect(isQueryReadOnly('INSERT INTO clients (name) VALUES ("Error")')).toBe(false);
    expect(isQueryReadOnly('UPDATE clients SET name = "Error"')).toBe(false);
    expect(isQueryReadOnly('DELETE FROM clients')).toBe(false);
    expect(isQueryReadOnly('DROP TABLE faturamento')).toBe(false);
    expect(isQueryReadOnly('ALTER TABLE users ADD column role text')).toBe(false);
    expect(isQueryReadOnly('CREATE TABLE new_table (id int)')).toBe(false);
    expect(isQueryReadOnly('TRUNCATE table logs')).toBe(false);
  });

  it('verifies mock visibility based on activeDataSource', () => {
    expect(isMockAllowed('DEMO_DATA')).toBe(true);
    expect(isMockAllowed('SPREADSHEET_DATA')).toBe(false);
    expect(isMockAllowed('DATABASE_DATA')).toBe(false);
    expect(isMockAllowed('CONSULTANT_DATA')).toBe(false);
  });

  it('validates consultant / calculated formulas format', () => {
    expect(validateFormula('[Receita] - [Custo]')).toBe(true);
    expect(validateFormula('([Faturamento] * 0.1) - [Impostos]')).toBe(true);
    expect(validateFormula('Receita - Custo')).toBe(false);
  });

  it('validates spreadsheet row metadata traceability fields', () => {
    const validRow = {
      Grupo: 'Grupo Delta',
      CNPJ: '11.111.111/0001-11',
      arquivo: 'DRE_Maio.xlsx',
      aba: 'Aba Executiva',
      linha: 14,
      coluna: 12,
      dataImportacao: new Date().toISOString(),
      usuario: 'Lennon Marcanjo'
    };
    
    const invalidRow = {
      Grupo: 'Grupo Delta',
      CNPJ: '11.111.111/0001-11'
    };

    expect(validateTraceability(validRow)).toBe(true);
    expect(validateTraceability(invalidRow)).toBe(false);
  });
});
