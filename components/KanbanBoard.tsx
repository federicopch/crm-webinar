"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { STAGES, type Opportunity, type Stage, isStage } from "@/lib/types";
import { formatARS } from "@/lib/format";
import Column from "./Column";
import Card from "./Card";
import OpportunityModal, { type OpportunityFormValues } from "./OpportunityModal";

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; opportunity: Opportunity };

export default function KanbanBoard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/opportunities", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudieron cargar las oportunidades.");
      }
      setOpportunities(await res.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(
    () => opportunities.reduce((sum, o) => sum + o.monto, 0),
    [opportunities]
  );

  const byStage = useMemo(() => {
    const map: Record<Stage, Opportunity[]> = {
      Lead: [],
      Contactado: [],
      Propuesta: [],
      Cerrado: [],
    };
    for (const o of opportunities) map[o.etapa].push(o);
    return map;
  }, [opportunities]);

  const activeOpportunity = activeId
    ? opportunities.find((o) => o.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const id = String(active.id);
    const target = String(over.id);
    if (!isStage(target)) return;

    const current = opportunities.find((o) => o.id === id);
    if (!current || current.etapa === target) return;

    const previousStage = current.etapa;

    // Update optimista
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, etapa: target } : o))
    );

    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: target }),
      });
      if (!res.ok) throw new Error("PATCH failed");
    } catch {
      // Revertir si falla
      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? { ...o, etapa: previousStage } : o))
      );
    }
  }

  async function handleCreate(values: OpportunityFormValues) {
    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "No se pudo crear la oportunidad.");
    }
    const created: Opportunity = await res.json();
    setOpportunities((prev) => [...prev, created]);
    setModal({ mode: "closed" });
  }

  async function handleUpdate(id: string, values: OpportunityFormValues) {
    const res = await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "No se pudo actualizar la oportunidad.");
    }
    const updated: Opportunity = await res.json();
    setOpportunities((prev) => prev.map((o) => (o.id === id ? updated : o)));
    setModal({ mode: "closed" });
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "No se pudo eliminar la oportunidad.");
    }
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    setModal({ mode: "closed" });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 py-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pipeline de Oportunidades
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Total del pipeline:{" "}
            <span className="font-semibold text-emerald-600">{formatARS(total)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            📊 Dashboard
          </Link>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            + Nueva oportunidad
          </button>
        </div>
      </header>

      {loadError && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <button
            onClick={load}
            className="font-medium underline underline-offset-2 hover:text-red-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s) => (
            <div
              key={s}
              className="h-72 animate-pulse rounded-xl bg-slate-100/80"
              aria-hidden
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid flex-1 grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                opportunities={byStage[stage]}
                onCardClick={(o) => setModal({ mode: "edit", opportunity: o })}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOpportunity ? (
              <Card opportunity={activeOpportunity} onClick={() => {}} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {modal.mode === "create" && (
        <OpportunityModal
          opportunity={null}
          onClose={() => setModal({ mode: "closed" })}
          onSave={handleCreate}
        />
      )}

      {modal.mode === "edit" && (
        <OpportunityModal
          opportunity={modal.opportunity}
          onClose={() => setModal({ mode: "closed" })}
          onSave={(values) => handleUpdate(modal.opportunity.id, values)}
          onDelete={() => handleDelete(modal.opportunity.id)}
        />
      )}
    </div>
  );
}
