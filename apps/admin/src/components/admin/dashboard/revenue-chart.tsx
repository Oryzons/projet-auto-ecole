"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrency } from "@/lib/utils";

type Point = { label: string; total: number; count: number };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: readonly { value?: unknown; payload?: Point }[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-float">
      <p className="text-xs font-medium text-muted-foreground capitalize">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(Number(payload[0].value ?? 0))}</p>
      {point && <p className="text-xs text-muted-foreground">{point.count} paiement{point.count > 1 ? "s" : ""}</p>}
    </div>
  );
}

function euroTick(value: number) {
  return value >= 100000 ? `${Math.round(value / 100000)} k€` : `${Math.round(value / 100)} €`;
}

const AXIS = { tickLine: false, axisLine: false, tick: { fill: "#5b6b82", fontSize: 12 } } as const;

/** Courbe pour les tendances mensuelles, barres pour l'activité jour par jour. */
export function RevenueChart({ data, variant = "area" }: { data: Point[]; variant?: "area" | "bar" }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e3eaf4" strokeDasharray="4 4" />
            <XAxis dataKey="label" {...AXIS} dy={8} minTickGap={16} />
            <YAxis {...AXIS} width={56} tickFormatter={euroTick} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#1e6fd9", fillOpacity: 0.06, radius: 6 }} />
            <Bar dataKey="total" fill="#1e6fd9" radius={[5, 5, 0, 0]} maxBarSize={28} minPointSize={0} animationDuration={800} animationEasing="ease-out" />
          </BarChart>
        ) : (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e6fd9" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#1e6fd9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e3eaf4" strokeDasharray="4 4" />
            <XAxis dataKey="label" {...AXIS} dy={8} />
            <YAxis {...AXIS} width={56} tickFormatter={euroTick} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#1e6fd9", strokeOpacity: 0.25, strokeWidth: 1.5 }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#1e6fd9"
              strokeWidth={2.5}
              fill="url(#revenue-fill)"
              activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff", fill: "#1e6fd9" }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
