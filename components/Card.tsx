"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { type Opportunity } from "@/lib/types";
import { formatARS } from "@/lib/format";

interface CardProps {
  opportunity: Opportunity;
  onClick: (o: Opportunity) => void;
  /** Cuando se renderiza dentro del DragOverlay no se le aplica el listener de drag. */
  overlay?: boolean;
}

export default function Card({ opportunity, onClick, overlay = false }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    data: { etapa: opportunity.etapa },
    disabled: overlay,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(opportunity)}
      className={[
        "group w-full rounded-lg border border-slate-200 bg-white p-3 text-left",
        "shadow-card transition-shadow",
        overlay ? "shadow-cardHover rotate-2 cursor-grabbing" : "cursor-grab hover:shadow-cardHover active:cursor-grabbing",
        isDragging && !overlay ? "opacity-40" : "opacity-100",
      ].join(" ")}
    >
      <p className="text-sm font-semibold text-slate-900">{opportunity.contacto}</p>
      <p className="mt-0.5 text-xs text-slate-500">{opportunity.empresa}</p>
      <p className="mt-2 text-base font-bold tracking-tight text-emerald-600">
        {formatARS(opportunity.monto)}
      </p>
    </button>
  );
}
