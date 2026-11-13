// Fechas "día" (YYYY-MM-DD) de los filtros: validación compartida y sin dependencias (la usan
// Análisis, Gráficos y format.ts).

const DIA_VALIDO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Una fecha real: "2026-02-30" no (Date la convertiría en el 2 de marzo), ni "2026-13-45" o
 * "9999-99-99" (Date inválido, que hace fallar toISOString).
 */
export function esDia(s: string | null | undefined): s is string {
  if (!s || !DIA_VALIDO.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
