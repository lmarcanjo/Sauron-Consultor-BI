/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmployeeProfile, PerformanceProfile, CommissionConfig, Payslip, ExecutiveDossier } from "./types";

class PeopleManager {
  private employees: Map<string, EmployeeProfile> = new Map();
  private performances: Map<string, PerformanceProfile> = new Map();
  private commissions: Map<string, CommissionConfig> = new Map();
  private payslips: Payslip[] = [];
  private dossiers: ExecutiveDossier[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData(): void {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      // Seed deterministic profiles only for isolated unit tests.
      const emp1: EmployeeProfile = {
        id: "emp_1",
        fullName: "Carlos Santos",
        role: "Gerente Comercial",
        department: "Vendas",
        branch: "Unidade Real",
        baseSalary: 8500,
        hireDate: "2024-03-15",
        status: "active"
      };

      const emp2: EmployeeProfile = {
        id: "emp_2",
        fullName: "Ana Paula Silva",
        role: "Coordenadora Operacional",
        department: "Operações",
        branch: "Unidade Real",
        baseSalary: 5200,
        hireDate: "2025-01-10",
        status: "active"
      };

      this.employees.set(emp1.id, emp1);
      this.employees.set(emp2.id, emp2);

      this.performances.set(emp1.id, {
        employeeId: emp1.id,
        score: 92,
        goalsAchieved: 105,
        evaluations: [
          { date: "2026-05-10", evaluator: "Gestor Responsável", feedback: "Excelente liderança no time comercial, superando metas do período." }
        ]
      });

      this.commissions.set(emp1.id, {
        employeeId: emp1.id,
        rate: 0.015, // 1.5% commission
        bonusThreshold: 500000
      });
    }
  }

  /**
   * Get employee by ID.
   */
  public getEmployee(id: string): EmployeeProfile | undefined {
    return this.employees.get(id);
  }

  /**
   * Get all active employees.
   */
  public getAllEmployees(): EmployeeProfile[] {
    return Array.from(this.employees.values());
  }

  /**
   * Calculate payslip for an employee.
   */
  public calculatePayslip(employeeId: string, period: string, grossSales: number): Payslip {
    const employee = this.getEmployee(employeeId);
    if (!employee) throw new Error("Employee not found");

    const commConfig = this.commissions.get(employeeId);
    const baseVal = employee.baseSalary;
    let commVal = 0;

    if (commConfig) {
      commVal = grossSales * commConfig.rate;
      if (grossSales >= commConfig.bonusThreshold) {
        commVal += 2000; // Stretch goal achievement bonus
      }
    }

    const deductions = baseVal * 0.11 + 500; // Simulated INSS + benefits deductions
    const netPay = baseVal + commVal - deductions;

    const newPayslip: Payslip = {
      id: `pay_${Date.now()}_${employeeId}`,
      employeeId,
      period,
      grossSalary: baseVal,
      commissions: commVal,
      deductions,
      netPay
    };

    this.payslips.push(newPayslip);
    return newPayslip;
  }

  /**
   * Generate an Executive Dossier based on performance indicators.
   */
  public generateExecutiveDossier(targetId: string, type: "individual" | "department" | "company", author: string): ExecutiveDossier {
    const kpis: Record<string, number> = {};
    const recommendations: string[] = [];

    if (type === "individual") {
      const emp = this.getEmployee(targetId);
      const perf = this.performances.get(targetId);
      if (emp) {
        kpis["assiduidade"] = 98;
        kpis["eficiencia"] = perf?.score || 85;
        kpis["metas_atingidas"] = perf?.goalsAchieved || 100;
        
        recommendations.push(
          `Promover treinamento de precificação dinâmica para apoiar ${emp.fullName} no atingimento de metas.`,
          `Estruturar bônus variável atrelado à satisfação do cliente.`
        );
      }
    } else {
      kpis["eficiencia_geral"] = 89;
      recommendations.push("Implementar ritos de feedback semanais baseados em faturamento diário.");
    }

    const dossier: ExecutiveDossier = {
      id: `dossier_${Date.now()}`,
      targetId,
      type,
      generatedAt: new Date().toISOString(),
      author,
      kpis,
      recommendations
    };

    this.dossiers.push(dossier);
    return dossier;
  }

  /**
   * Get generated dossiers.
   */
  public getDossiers(): ExecutiveDossier[] {
    return [...this.dossiers];
  }
}

export const peopleManager = new PeopleManager();
export default peopleManager;
