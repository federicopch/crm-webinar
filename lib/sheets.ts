import "server-only";
import { GoogleSpreadsheet, type GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import {
  type Opportunity,
  type Stage,
  type Product,
  isStage,
  parseProductos,
  serializeProductos,
} from "./types";

const SHEET_TITLE = "Oportunidades";
const HEADERS = ["id", "contacto", "empresa", "monto", "etapa", "productos"] as const;
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getAuth(): JWT {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // La private key viene con \n escapados desde las env vars: los convertimos a saltos reales.
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Faltan credenciales de Google. Definí GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY."
    );
  }

  return new JWT({ email, key, scopes: SCOPES });
}

async function getSheet(): Promise<GoogleSpreadsheetWorksheet> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("Falta GOOGLE_SHEET_ID en las variables de entorno.");
  }

  const doc = new GoogleSpreadsheet(sheetId, getAuth());
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle[SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: SHEET_TITLE,
      headerValues: [...HEADERS],
    });
    return sheet;
  }

  // Backfill: si el Sheet ya existía sin la columna "productos", la agregamos
  // al final sin reordenar (reordenar desalinearía los datos existentes).
  await sheet.loadHeaderRow().catch(() => {});
  const headers = sheet.headerValues ?? [];
  if (headers.length > 0 && !headers.includes("productos")) {
    await sheet.setHeaderRow([...headers, "productos"]);
  }

  return sheet;
}

function parseMonto(raw: unknown): number {
  const n = parseInt(String(raw ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Devuelve todas las oportunidades del Sheet. */
export async function listOpportunities(): Promise<Opportunity[]> {
  const sheet = await getSheet();
  const rows = await sheet.getRows();

  return rows
    .map((row): Opportunity | null => {
      const id = String(row.get("id") ?? "").trim();
      if (!id) return null;
      const etapaRaw = String(row.get("etapa") ?? "").trim();
      const etapa: Stage = isStage(etapaRaw) ? etapaRaw : "Lead";
      return {
        id,
        contacto: String(row.get("contacto") ?? "").trim(),
        empresa: String(row.get("empresa") ?? "").trim(),
        monto: parseMonto(row.get("monto")),
        etapa,
        productos: parseProductos(row.get("productos")),
      };
    })
    .filter((o): o is Opportunity => o !== null);
}

/** Crea una nueva oportunidad y devuelve el registro creado. */
export async function createOpportunity(input: {
  contacto: string;
  empresa: string;
  monto: number;
  etapa: Stage;
  productos: Product[];
}): Promise<Opportunity> {
  const sheet = await getSheet();
  const opportunity: Opportunity = {
    id: crypto.randomUUID(),
    contacto: input.contacto,
    empresa: input.empresa,
    monto: input.monto,
    etapa: input.etapa,
    productos: input.productos,
  };

  await sheet.addRow({
    id: opportunity.id,
    contacto: opportunity.contacto,
    empresa: opportunity.empresa,
    monto: String(opportunity.monto),
    etapa: opportunity.etapa,
    productos: serializeProductos(opportunity.productos),
  });

  return opportunity;
}

/** Actualiza los campos provistos de una oportunidad por id. */
export async function updateOpportunity(
  id: string,
  patch: Partial<Omit<Opportunity, "id">>
): Promise<Opportunity | null> {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => String(r.get("id") ?? "").trim() === id);
  if (!row) return null;

  if (patch.contacto !== undefined) row.set("contacto", patch.contacto);
  if (patch.empresa !== undefined) row.set("empresa", patch.empresa);
  if (patch.monto !== undefined) row.set("monto", String(patch.monto));
  if (patch.etapa !== undefined) row.set("etapa", patch.etapa);
  if (patch.productos !== undefined)
    row.set("productos", serializeProductos(patch.productos));

  await row.save();

  return {
    id,
    contacto: String(row.get("contacto") ?? "").trim(),
    empresa: String(row.get("empresa") ?? "").trim(),
    monto: parseMonto(row.get("monto")),
    etapa: (isStage(row.get("etapa")) ? row.get("etapa") : "Lead") as Stage,
    productos: parseProductos(row.get("productos")),
  };
}

/** Elimina una oportunidad por id. Devuelve true si existía. */
export async function deleteOpportunity(id: string): Promise<boolean> {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => String(r.get("id") ?? "").trim() === id);
  if (!row) return false;
  await row.delete();
  return true;
}
