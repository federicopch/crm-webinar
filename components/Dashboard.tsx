"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  STAGES,
  PRODUCTS,
  type Opportunity,
  type Stage,
  type Product,
} from "@/lib/types";
import { formatARS } from "@/lib/format";

const STAGE_COLOR: Record<Stage, string> = {
  Lead: "bg-slate-400",
  Contactado: "bg-sky-500",
  Propuesta: "bg-amber-500",
  Cerrado: "bg-emerald-500",
};

const PRODUCT_COLOR: Record<Product, string> = {
  Procesos: "bg-indigo-500",
  Estrategia: "bg-violet-500",
};

function KpiCard({
  label,
  value,
  hint,
  accent = "text-slate-900",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function BarRow({
  label,
  count,
  value,
  pct,
  color,
}: {
  label: string;
  count: number;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-700">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          {label}
          <span className="rounded-full bg-slate-100 px-1.5 text-xs font-medium text-slate-500">
            {count}
          </span>
        </span>
        <span className="font-semibold text-slate-900">{formatARS(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const m = useMemo(() => {
    const total = opportunities.reduce((s, o) => s + o.monto, 0);
    const count = opportunities.length;
    const avg = count ? Math.round(total / count) : 0;

    const byStage = STAGES.map((stage) => {
      const items = opportunities.filter((o) => o.etapa === stage);
      return {
        stage,
        count: items.length,
        value: items.reduce((s, o) => s + o.monto, 0),
      };
    });
    const maxStageValue = Math.max(1, ...byStage.map((s) => s.value));
    const cerrado = byStage.find((s) => s.stage === "Cerrado") ?? {
      count: 0,
      value: 0,
    };

    const byProduct = PRODUCTS.map((product) => {
      const items = opportunities.filter((o) => o.productos.includes(product));
      return {
        product,
        count: items.length,
        value: items.reduce((s, o) => s + o.monto, 0),
      };
    });
    const sinProductoItems = opportunities.filter((o) => o.productos.length === 0);
    const sinProducto = {
      count: sinProductoItems.length,
      value: sinProductoItems.reduce((s, o) => s + o.monto, 0),
    };
    const maxProductValue = Math.max(
      1,
      ...byProduct.map((p) => p.value),
      sinProducto.value
    );

    const top = [...opportunities].sort((a, b) => b.monto - a.monto).slice(0, 5);

    return {
      total,
      count,
      avg,
      byStage,
      maxStageValue,
      cerrado,
      byProduct,
      sinProducto,
      maxProductValue,
      top,
    };
  }, [opportunities]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-4 py-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumen de {m.count} oportunidad{m.count === 1 ? "" : "es"}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          ← Tablero
        </Link>
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* KPI cards */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Pipeline total"
              value={formatARS(m.total)}
              accent="text-emerald-600"
              hint="Suma de todas las etapas"
            />
            <KpiCard label="Oportunidades" value={String(m.count)} />
            <KpiCard
              label="Ticket promedio"
              value={formatARS(m.avg)}
              hint="Monto / oportunidad"
            />
            <KpiCard
              label="Cerrado"
              value={formatARS(m.cerrado.value)}
              accent="text-emerald-600"
              hint={`${m.cerrado.count} oportunidad${m.cerrado.count === 1 ? "" : "es"} ganada${m.cerrado.count === 1 ? "" : "s"}`}
            />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Por etapa */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">
                Pipeline por etapa
              </h2>
              <div className="flex flex-col gap-4">
                {m.byStage.map((s) => (
                  <BarRow
                    key={s.stage}
                    label={s.stage}
                    count={s.count}
                    value={s.value}
                    pct={(s.value / m.maxStageValue) * 100}
                    color={STAGE_COLOR[s.stage]}
                  />
                ))}
              </div>
            </section>

            {/* Por producto */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">
                Pipeline por producto
              </h2>
              <p className="mb-4 -mt-2 text-xs text-slate-400">
                Una oportunidad puede contar en ambos productos.
              </p>
              <div className="flex flex-col gap-4">
                {m.byProduct.map((p) => (
                  <BarRow
                    key={p.product}
                    label={p.product}
                    count={p.count}
                    value={p.value}
                    pct={(p.value / m.maxProductValue) * 100}
                    color={PRODUCT_COLOR[p.product]}
                  />
                ))}
                {m.sinProducto.count > 0 && (
                  <BarRow
                    label="Sin producto"
                    count={m.sinProducto.count}
                    value={m.sinProducto.value}
                    pct={(m.sinProducto.value / m.maxProductValue) * 100}
                    color="bg-slate-300"
                  />
                )}
              </div>
            </section>
          </div>

          {/* Top oportunidades */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Top oportunidades
            </h2>
            {m.top.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Todavía no hay oportunidades.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {m.top.map((o, i) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-5 shrink-0 text-sm font-semibold text-slate-400">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {o.contacto}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {o.empresa} · {o.etapa}
                          {o.productos.length > 0 && ` · ${o.productos.join(", ")}`}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-600">
                      {formatARS(o.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
