"use client";

import { useDroppable } from "@dnd-kit/core";
import { type Opportunity, type Stage } from "@/lib/types";
import { formatARS } from "@/lib/format";
import Card from "./Card";

interface ColumnProps {
  stage: Stage;
  opportunities: Opportunity[];
  onCardClick: (o: Opportunity) => void;
}

const STAGE_ACCENT: Record<Stage, string> = {
  Lead: "bg-slate-400",
  Contactado: "bg-sky-500",
  Propuesta: "bg-amber-500",
  Cerrado: "bg-emerald-500",
};

export default function Column({ stage, opportunities, onCardClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = opportunities.reduce((sum, o) => sum + o.monto, 0);

  return (
    <div className="flex w-full min-w-[260px] flex-col rounded-xl bg-slate-100/80">
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${STAGE_ACCENT[stage]}`} />
          <h2 className="text-sm font-semibold text-slate-700">{stage}</h2>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
            {opportunities.length}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-500">{formatARS(total)}</span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "kanban-scroll flex min-h-[140px] flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-2 transition-colors",
          isOver ? "bg-sky-100/70 ring-2 ring-inset ring-sky-300" : "bg-transparent",
        ].join(" ")}
      >
        {opportunities.map((o) => (
          <Card key={o.id} opportunity={o} onClick={onCardClick} />
        ))}
        {opportunities.length === 0 && (
          <p className="select-none px-2 py-6 text-center text-xs text-slate-400">
            Sin oportunidades
          </p>
        )}
      </div>
    </div>
  );
}
