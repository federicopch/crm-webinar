"use client";

import { useEffect, useState } from "react";
import { PRODUCTS, STAGES, type Opportunity, type Product, type Stage } from "@/lib/types";

export interface OpportunityFormValues {
  contacto: string;
  empresa: string;
  monto: number;
  etapa: Stage;
  productos: Product[];
}

interface OpportunityModalProps {
  /** Si se pasa una oportunidad, el modal está en modo edición. */
  opportunity: Opportunity | null;
  defaultStage?: Stage;
  onClose: () => void;
  onSave: (values: OpportunityFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function OpportunityModal({
  opportunity,
  defaultStage = "Lead",
  onClose,
  onSave,
  onDelete,
}: OpportunityModalProps) {
  const isEdit = Boolean(opportunity);
  const [contacto, setContacto] = useState(opportunity?.contacto ?? "");
  const [empresa, setEmpresa] = useState(opportunity?.empresa ?? "");
  const [monto, setMonto] = useState<string>(
    opportunity ? String(opportunity.monto) : ""
  );
  const [etapa, setEtapa] = useState<Stage>(opportunity?.etapa ?? defaultStage);
  const [productos, setProductos] = useState<Product[]>(opportunity?.productos ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const montoNum = parseInt(monto.replace(/[^\d-]/g, ""), 10);
    if (!contacto.trim() || !empresa.trim()) {
      setError("Contacto y empresa son obligatorios.");
      return;
    }
    if (!Number.isFinite(montoNum) || montoNum < 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        contacto: contacto.trim(),
        empresa: empresa.trim(),
        monto: montoNum,
        etapa,
        productos,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm("¿Eliminar esta oportunidad? Esta acción no se puede deshacer."))
      return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
      setDeleting(false);
    }
  }

  function toggleProducto(p: Product) {
    setProductos((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  const busy = saving || deleting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Editar oportunidad" : "Nueva oportunidad"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contacto
            </label>
            <input
              type="text"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              placeholder="Nombre del contacto"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Empresa
            </label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              placeholder="Nombre de la empresa"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Monto (ARS)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Etapa
            </label>
            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value as Stage)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Productos
            </span>
            <div className="flex flex-wrap gap-2">
              {PRODUCTS.map((p) => {
                const active = productos.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProducto(p)}
                    aria-pressed={active}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {active ? "✓ " : ""}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
