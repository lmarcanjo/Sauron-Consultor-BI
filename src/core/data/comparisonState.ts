export interface ComparisonState<T> {
  hasComparison: boolean;
  left: T | null;
  right: T | null;
  message: string;
}

export function resolveComparison<T>(
  left: T | null | undefined,
  right: T | null | undefined,
): ComparisonState<T> {
  const hasComparison = left != null && right != null;
  return {
    hasComparison,
    left: left ?? null,
    right: right ?? null,
    message: hasComparison ? "Comparação disponível" : "Selecione dois registros para comparar",
  };
}
