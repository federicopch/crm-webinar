export const STAGES = ["Lead", "Contactado", "Propuesta", "Cerrado"] as const;

export type Stage = (typeof STAGES)[number];

export const PRODUCTS = ["Procesos", "Estrategia"] as const;

export type Product = (typeof PRODUCTS)[number];

export interface Opportunity {
  id: string;
  contacto: string;
  empresa: string;
  monto: number;
  etapa: Stage;
  productos: Product[];
}

export function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}

export function isProduct(value: unknown): value is Product {
  return typeof value === "string" && (PRODUCTS as readonly string[]).includes(value);
}

/** Convierte el valor crudo del Sheet ("Procesos,Estrategia") en un array validado. */
export function parseProductos(raw: unknown): Product[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isProduct);
}

/** Normaliza un array de entrada quedándose solo con productos válidos y sin duplicados. */
export function normalizeProductos(input: unknown): Product[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<Product>();
  for (const item of input) {
    if (isProduct(item)) seen.add(item);
  }
  return PRODUCTS.filter((p) => seen.has(p));
}

/** Serializa los productos para guardarlos en una celda del Sheet. */
export function serializeProductos(productos: Product[]): string {
  return productos.join(",");
}
