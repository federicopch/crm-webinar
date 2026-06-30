/** Formatea un número entero como pesos argentinos: 1250000 -> "$1.250.000" */
export function formatARS(monto: number): string {
  const value = Number.isFinite(monto) ? monto : 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
