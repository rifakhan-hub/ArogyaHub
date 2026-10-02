import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Analytics } from "@/api/types";
import { formatDay, formatShortDate } from "@/lib/dates";
import { formatNumber } from "@/lib/format";

// Recharts takes colours as props, so point at the CSS variables in theme.css (dark mode keeps working).
// The three series colours were checked for colour-blind separation on light and dark backgrounds.
const chartColors = {
  primary: "var(--chart-1)",
  info: "var(--chart-2)",
  accent: "var(--chart-3)",
  grid: "var(--chart-grid)",
  axis: "var(--text-subtle)",
  surface: "var(--surface)",
};

type Series = { key: string; label: string; color: string };

/** Legend always present for 2+ series, so identity is never colour alone. */
export function ChartLegend({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-muted">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  formatLabel,
}: {
  active?: boolean;
  payload?: readonly { dataKey?: unknown; value?: unknown }[];
  label?: unknown;
  series: Series[];
  formatLabel: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
  return (
    <div className="min-w-44 rounded-md border border-border bg-surface px-3 py-2.5 text-small shadow-2">
      <p className="mb-1.5 font-semibold text-text">{formatLabel(String(label))}</p>
      <ul className="flex flex-col gap-1">
        {series.map((s) => {
          const p = payload.find((x) => x.dataKey === s.key);
          return (
            <li key={s.key} className="flex items-center gap-2 text-muted">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
              <span className="ml-auto pl-4 font-semibold text-text tabular">{formatNumber(Number(p?.value ?? 0))}</span>
            </li>
          );
        })}
      </ul>
      {series.length > 1 && (
        <p className="mt-1.5 flex justify-between border-t border-border pt-1.5 text-muted">
          Total <span className="font-semibold text-text tabular">{formatNumber(total)}</span>
        </p>
      )}
    </div>
  );
}

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: chartColors.axis, fontSize: 12, fontFamily: "inherit" },
} as const;

/** Stacked bars: consultations per day by outcome, 30 days. */
export function ConsultationsChart({ data }: { data: Analytics["consultations_per_day"] }) {
  const series: Series[] = [
    { key: "completed", label: "Completed", color: chartColors.primary },
    { key: "cancelled", label: "Cancelled", color: chartColors.info },
    { key: "no_show", label: "No-show", color: chartColors.accent },
  ];
  const day = formatShortDate;
  const longDay = formatDay;

  return (
    <figure className="flex flex-col gap-4">
      <ChartLegend series={series} />
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={chartColors.grid} />
            <XAxis dataKey="date" {...axisProps} tickFormatter={day} interval="preserveStartEnd" minTickGap={24} />
            <YAxis {...axisProps} allowDecimals={false} width={40} />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)" }}
              content={(p) => (
                <ChartTooltip active={p.active} payload={p.payload} label={p.label} series={series} formatLabel={longDay} />
              )}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="outcome"
                fill={s.color}
                // 2px surface gap between stacked segments
                stroke={chartColors.surface}
                strokeWidth={1}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={20}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">Last 30 days, by outcome</figcaption>
      <table className="sr-only">
        <caption>Consultations</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th scope="row">{longDay(d.date)}</th>
              <td>{d.completed}</td>
              <td>{d.cancelled}</td>
              <td>{d.no_show}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Grouped bars: new patient and doctor sign-ups per week. */
export function SignupsChart({ data }: { data: Analytics["new_users_per_week"] }) {
  const series: Series[] = [
    { key: "patient", label: "Patient", color: chartColors.primary },
    { key: "doctor", label: "Doctor", color: chartColors.info },
  ];
  const week = formatShortDate;
  const longWeek = (d: string) => `Week of ${formatShortDate(d)}`;

  return (
    <figure className="flex flex-col gap-4">
      <ChartLegend series={series} />
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barGap={2} barCategoryGap="24%">
            <CartesianGrid vertical={false} stroke={chartColors.grid} />
            <XAxis dataKey="week" {...axisProps} tickFormatter={week} interval="preserveStartEnd" minTickGap={20} />
            <YAxis {...axisProps} allowDecimals={false} width={40} />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)" }}
              content={(p) => (
                <ChartTooltip active={p.active} payload={p.payload} label={p.label} series={series} formatLabel={longWeek} />
              )}
            />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>New patients and doctors per week</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.week}>
              <th scope="row">{longWeek(d.week)}</th>
              <td>{d.patient}</td>
              <td>{d.doctor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Single-series ranking: HTML bars with direct value labels (no legend needed). */
export function SpecialityBars({ data }: { data: Analytics["top_specializations"] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ul className="flex flex-col gap-3.5">
      {data.map((d) => (
        <li key={d.name} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2 text-small">
            <span className="truncate text-text">{d.name}</span>
            <span className="font-semibold text-text tabular">{formatNumber(d.count)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
            <div className="h-full rounded-full bg-chart-1" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
