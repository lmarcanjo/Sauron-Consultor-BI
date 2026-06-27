/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EmployeeProfile {
  id: string;
  fullName: string;
  role: string;
  department: string;
  branch: string;
  baseSalary: number;
  hireDate: string;
  status: "active" | "leave" | "terminated";
}

export interface PerformanceProfile {
  employeeId: string;
  score: number; // 0 to 100
  goalsAchieved: number; // percentage
  evaluations: Array<{ date: string; evaluator: string; feedback: string }>;
}

export interface CommissionConfig {
  employeeId: string;
  rate: number; // percentage e.g., 2% -> 0.02
  bonusThreshold: number; // sales amount required for extra bonus
}

export interface Payslip {
  id: string;
  employeeId: string;
  period: string; // e.g. "2026-06"
  grossSalary: number;
  commissions: number;
  deductions: number;
  netPay: number;
}

export interface ExecutiveDossier {
  id: string;
  targetId: string; // employee ID, department name, or company ID
  type: "individual" | "department" | "company";
  generatedAt: string;
  author: string;
  kpis: Record<string, number>;
  recommendations: string[];
}
