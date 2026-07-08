/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function exportToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const lines = [headers.join(";")];

  data.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header];
      if (typeof val === "number") {
        return val.toString();
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(values.join(";"));
  });

  return lines.join("\n");
}
