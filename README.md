# CRM Webinar — Pipeline de Oportunidades

Tablero Kanban de oportunidades comerciales con backend en Google Sheets.
Sin autenticación, listo para deploy en Vercel.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **@dnd-kit** para drag & drop
- **google-spreadsheet v4** + **google-auth-library** (service account)

## Funcionalidades

- Tablero con 4 columnas fijas: **Lead → Contactado → Propuesta → Cerrado**
- Cada tarjeta muestra contacto, empresa y monto (formateado en ARS)
- Drag & drop entre columnas → persiste el cambio de etapa en el Sheet (update optimista + revert si falla)
- Crear, editar y eliminar oportunidades vía modal
- Header con el total del pipeline

## Modelo de datos (Google Sheets)

- Pestaña: **`Oportunidades`**
- Columnas (header en fila 1): `id | contacto | empresa | monto | etapa`
- `etapa`: uno de `Lead | Contactado | Propuesta | Cerrado`
- `monto`: número entero (se formatea solo en la UI)

Si la pestaña no existe, la app la crea automáticamente con sus headers.

## Arquitectura

Las credenciales del service account **nunca** llegan al cliente. Toda lectura/escritura
pasa por API Routes de Next.js:

| Método  | Endpoint                      | Acción            |
| ------- | ----------------------------- | ----------------- |
| GET     | `/api/opportunities`          | Lista todas       |
| POST    | `/api/opportunities`          | Crea              |
| PATCH   | `/api/opportunities/[id]`     | Actualiza         |
| DELETE  | `/api/opportunities/[id]`     | Elimina           |

## Variables de entorno

Creá un archivo `.env.local` (o cargalas en Vercel) con estas 3 claves:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=el-id-del-spreadsheet
```

> `GOOGLE_PRIVATE_KEY` va con los `\n` escapados; en runtime se reemplazan por saltos reales.
> Acordate de **compartir el Google Sheet** con el email del service account (permiso de Editor).

Ver `.env.example`.

## Correr local

```bash
npm install
cp .env.example .env.local   # y completá las 3 variables
npm run dev
```

Abrí http://localhost:3000

### Seed opcional (datos de ejemplo)

Inserta 6 oportunidades de ejemplo en el Sheet. La app **no** inserta datos sola.

```bash
npm run seed
```

## Deploy en Vercel

1. Subí el repo a GitHub e importalo en Vercel.
2. En **Settings → Environment Variables** cargá las 3 claves:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (pegá la key con los `\n` escapados, entre comillas)
   - `GOOGLE_SHEET_ID`
3. Deploy. Vercel detecta Next.js automáticamente.
