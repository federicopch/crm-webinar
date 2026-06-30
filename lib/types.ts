export const STAGES = ["Lead", "Contactado", "Propuesta", "Cerrado"] as const;

export type Stage = (typeof STAGES)[number];

export interface Opportunity {
  id: string;
  contacto: string;
  empresa: string;
  monto: number;
  etapa: Stage;
}

export function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}
