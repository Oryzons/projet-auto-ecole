import { formatCurrency } from "./utils";

export type FinancePeriod = "7d" | "30d" | "90d" | "12m";

export function getPeriodStart(period: FinancePeriod): Date {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    case "30d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    case "90d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
    case "12m":
      return new Date(now.getFullYear(), now.getMonth() - 11, 1);
  }
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fillDailyRevenue(
  data: { date: string; total: number; count: number }[],
  days: number,
  endOffset = 0,
) {
  const totals = new Map(
    data.map((entry) => [entry.date.slice(0, 10), entry]),
  );
  const end = new Date();
  end.setDate(end.getDate() - endOffset);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (days - 1 - index));
    const key = localDateKey(date);
    const found = totals.get(key);
    return {
      date: key,
      label: date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      total: found?.total ?? 0,
      count: found?.count ?? 0,
    };
  });
}

export function fillMonthlyRevenue(
  data: { month: string; total: number; count: number }[],
) {
  const totals = new Map(data.map((entry) => [entry.month, entry]));
  const now = new Date();
  let cumulative = 0;

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const found = totals.get(key);
    const total = found?.total ?? 0;
    cumulative += total;
    return {
      month: key,
      label: date.toLocaleDateString("fr-FR", { month: "short" }),
      total,
      count: found?.count ?? 0,
      cumulative,
    };
  });
}

export function formatChartDate(date: string | Date, mode: "day" | "month" = "day"): string {
  const d = new Date(date);
  if (mode === "month") {
    return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export const CHART_COLORS = {
  primary: "#1e6fd9",
  primaryLight: "#7fb2f0",
  secondary: "#0b3d91",
  standard: "#1e6fd9",
  partner: "#7fb2f0",
  grid: "#e3eaf4",
  muted: "#5b6b82",
};

export function buildTooltipStyle() {
  return {
    borderRadius: "12px",
    border: "1px solid #e3eaf4",
    boxShadow: "0 16px 40px -16px rgba(15,40,84,0.25)",
    fontSize: "13px",
  };
}

export function currencyTooltip(value: number | string) {
  return formatCurrency(Number(value ?? 0));
}
