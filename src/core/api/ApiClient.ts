/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class ApiClient {
  public static async get<T>(url: string, config?: any): Promise<{ data: T }> {
    return { data: null as any };
  }

  public static async post<T, R>(url: string, data?: T, config?: any): Promise<{ data: R }> {
    return { data: null as any };
  }

  public static async delete<T>(url: string, config?: any): Promise<{ data: T }> {
    return { data: null as any };
  }
}
