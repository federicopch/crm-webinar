import { NextResponse } from "next/server";
import { deleteOpportunity, updateOpportunity } from "@/lib/sheets";
import { isStage, normalizeProductos, type Opportunity } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/opportunities/[id] -> actualiza etapa u otros campos
export async function PATCH(req: Request, props: Params) {
  const params = await props.params;
  try {
    const body = await req.json();
    const patch: Partial<Omit<Opportunity, "id">> = {};

    if (body?.contacto !== undefined) patch.contacto = String(body.contacto).trim();
    if (body?.empresa !== undefined) patch.empresa = String(body.empresa).trim();
    if (body?.monto !== undefined) {
      const monto = parseInt(String(body.monto).replace(/[^\d-]/g, ""), 10);
      if (!Number.isFinite(monto) || monto < 0) {
        return NextResponse.json({ error: "Monto inválido." }, { status: 400 });
      }
      patch.monto = monto;
    }
    if (body?.etapa !== undefined) {
      if (!isStage(body.etapa)) {
        return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
      }
      patch.etapa = body.etapa;
    }
    if (body?.productos !== undefined) {
      patch.productos = normalizeProductos(body.productos);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
    }

    const updated = await updateOpportunity(params.id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Oportunidad no encontrada." }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/opportunities/[id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al actualizar la oportunidad" },
      { status: 500 }
    );
  }
}

// DELETE /api/opportunities/[id] -> elimina la fila
export async function DELETE(_req: Request, props: Params) {
  const params = await props.params;
  try {
    const ok = await deleteOpportunity(params.id);
    if (!ok) {
      return NextResponse.json({ error: "Oportunidad no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/opportunities/[id]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al eliminar la oportunidad" },
      { status: 500 }
    );
  }
}
