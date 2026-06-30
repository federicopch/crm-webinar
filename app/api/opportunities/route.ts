import { NextResponse } from "next/server";
import { createOpportunity, listOpportunities } from "@/lib/sheets";
import { isStage, normalizeProductos } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/opportunities -> lista todas las oportunidades
export async function GET() {
  try {
    const opportunities = await listOpportunities();
    return NextResponse.json(opportunities);
  } catch (err) {
    console.error("GET /api/opportunities", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al leer las oportunidades" },
      { status: 500 }
    );
  }
}

// POST /api/opportunities -> crea una oportunidad
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contacto = String(body?.contacto ?? "").trim();
    const empresa = String(body?.empresa ?? "").trim();
    const monto = parseInt(String(body?.monto ?? "").replace(/[^\d-]/g, ""), 10);
    const etapa = body?.etapa;

    if (!contacto || !empresa) {
      return NextResponse.json(
        { error: "Contacto y empresa son obligatorios." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(monto) || monto < 0) {
      return NextResponse.json({ error: "Monto inválido." }, { status: 400 });
    }
    if (!isStage(etapa)) {
      return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
    }
    const productos = normalizeProductos(body?.productos);

    const created = await createOpportunity({ contacto, empresa, monto, etapa, productos });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/opportunities", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear la oportunidad" },
      { status: 500 }
    );
  }
}
