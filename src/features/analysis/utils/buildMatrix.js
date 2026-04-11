/**
 * Helpers for correlation matrix rendering.
 */
export function getMatrixCell(matrix, rowId, colId) {
  const i = matrix.ids.indexOf(rowId);
  const j = matrix.ids.indexOf(colId);
  if (i < 0 || j < 0) return null;
  return matrix.values[i][j];
}
