/**
 * Script de seed OPCIONAL.
 * Inserta 6 oportunidades de ejemplo en la pestaña "Oportunidades".
 *
 * Uso:
 *   1. Configurá .env.local con las 3 variables de Google.
 *   2. npm run seed
 *
 * Nota: este script SOLO corre cuando vos lo ejecutás. La app nunca
 * inserta datos automáticamente.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const SHEET_TITLE = "Oportunidades";
const HEADERS = ["id", "contacto", "empresa", "monto", "etapa", "productos"];

const SEED = [
  { contacto: "Juan Pérez", empresa: "Distri Sur", monto: 1500000, etapa: "Lead", productos: "Procesos" },
  { contacto: "Ana Gómez", empresa: "New Flex", monto: 3200000, etapa: "Contactado", productos: "Estrategia" },
  { contacto: "Carlos Ruiz", empresa: "Baigún Realty", monto: 850000, etapa: "Propuesta", productos: "Procesos,Estrategia" },
  { contacto: "Laura Méndez", empresa: "Grupo Avenew", monto: 5400000, etapa: "Lead", productos: "Estrategia" },
  { contacto: "Diego Torres", empresa: "Escribanía Reyes", monto: 1200000, etapa: "Contactado", productos: "Procesos" },
  { contacto: "Sofía Castro", empresa: "San Joaquín", monto: 2750000, etapa: "Cerrado", productos: "Procesos,Estrategia" },
];

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !key || !sheetId) {
    throw new Error(
      "Faltan variables de entorno. Definí GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY y GOOGLE_SHEET_ID en .env.local"
    );
  }

  const auth = new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle[SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({ title: SHEET_TITLE, headerValues: HEADERS });
  }

  for (const row of SEED) {
    await sheet.addRow({
      id: crypto.randomUUID(),
      contacto: row.contacto,
      empresa: row.empresa,
      monto: String(row.monto),
      etapa: row.etapa,
      productos: row.productos,
    });
    console.log(`+ ${row.contacto} (${row.empresa})`);
  }

  console.log(`\n✅ ${SEED.length} oportunidades insertadas en "${SHEET_TITLE}".`);
}

main().catch((err) => {
  console.error("❌ Error en el seed:", err.message);
  process.exit(1);
});
