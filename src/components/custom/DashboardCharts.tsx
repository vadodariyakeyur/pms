import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/lib/parcel-money";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type DayPoint = {
  date: string;
  collected: number;
  pending: number;
};
export type NameCount = { name: string; count: number };
/** A destination city, tagged with the office that sent to it. */
export type OfficeCity = NameCount & { office: string; officeIndex: number };
/** One day, with a rupee total per office name. */
export type OfficeDayPoint = { date: string } & Record<string, string | number>;

const dayTick = (v: string) => format(new Date(v), "d MMM");

const officeConfig = (names: string[]): ChartConfig =>
  Object.fromEntries(
    names.map((name, i) => [name, { label: name, color: sliceColor(i) }])
  );
const moneyConfig = {
  collected: { label: "Collected", color: "var(--chart-1)" },
  pending: { label: "Pending", color: "var(--chart-5)" },
} satisfies ChartConfig;
const countConfig = {
  count: { label: "Parcels", color: "var(--chart-2)" },
} satisfies ChartConfig;

// Indigo and amber lead — they read as a pair, so the first two series
// contrast most. Remaining tokens fill in behind them.
const chartOrder = [1, 3, 2, 4, 5];
const sliceColor = (i: number) => `var(--chart-${chartOrder[i % 5]})`;
const nameConfig = (cities: NameCount[]): ChartConfig =>
  Object.fromEntries(
    cities.map((c, i) => [c.name, { label: c.name, color: sliceColor(i) }]),
  );

// Inner-ring labels, drawn inside the slice. Replaces the legend, which
// recharts insists on filling with one entry per slice.
const officeLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
  name,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  name?: string;
}) => {
  if (Math.abs(endAngle - startAngle) < 25) return null;
  const rad = -midAngle * (Math.PI / 180);
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  return (
    <text
      x={cx + r * Math.cos(rad)}
      y={cy + r * Math.sin(rad)}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-white text-[11px] font-medium"
    >
      {name}
    </text>
  );
};

// Outer-ring labels, sitting just past the ring so recharts' leader lines
// reach them. Unlike the stock `label` (value only) these name the city too.
// Slices under 4° are dropped — their text would overlap a neighbour's.
const cityLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
  name,
  count,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  name?: string;
  count?: number;
}) => {
  if (Math.abs(endAngle - startAngle) < 4) return null;
  const rad = -midAngle * (Math.PI / 180);
  const x = cx + (outerRadius + 22) * Math.cos(rad);
  const y = cy + (outerRadius + 22) * Math.sin(rad);
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="fill-muted-foreground text-[10px]"
    >
      {name} ({count})
    </text>
  );
};

type Props = {
  loading: boolean;
  daily: DayPoint[];
  officeDaily: OfficeDayPoint[];
  officeNames: string[];
  currentOffice: string;
  officeTotals: NameCount[];
  officeCities: OfficeCity[];
  byWeekday: NameCount[];
};

export default function DashboardCharts({
  loading,
  daily,
  officeDaily,
  officeNames,
  currentOffice,
  officeTotals,
  officeCities,
  byWeekday,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="gap-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base">Revenue by office</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <Skeleton className="aspect-video w-full" />
          ) : officeNames.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No data yet.
            </p>
          ) : (
            <ChartContainer config={officeConfig(officeNames)} className="w-full">
              <AreaChart data={officeDaily} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickFormatter={dayTick}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(v) => inr(v)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, p) =>
                        dayTick(String(p?.[0]?.payload?.date))
                      }
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-mono font-medium tabular-nums">
                            {inr(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                {officeNames.map((name, i) => (
                  <Area
                    key={name}
                    dataKey={name}
                    type="monotone"
                    stroke={sliceColor(i)}
                    fill={sliceColor(i)}
                    fillOpacity={0.15}
                    strokeWidth={name === currentOffice ? 2.5 : 1.5}
                    dot={false}
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base">Collected vs pending</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <Skeleton className="aspect-video w-full" />
          ) : (
            <ChartContainer config={moneyConfig} className="w-full">
              <BarChart data={daily} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickFormatter={dayTick}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(v) => inr(v)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, p) =>
                        dayTick(String(p?.[0]?.payload?.date))
                      }
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {moneyConfig[name as keyof typeof moneyConfig]
                              ?.label ?? name}
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {inr(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="collected"
                  stackId="a"
                  fill="var(--color-collected)"
                  radius={[0, 0, 2, 2]}
                />
                <Bar
                  dataKey="pending"
                  stackId="a"
                  fill="var(--color-pending)"
                  radius={[2, 2, 0, 0]}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base">Office → destination city</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <Skeleton className="aspect-video w-full" />
          ) : officeCities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No data yet.
            </p>
          ) : (
            <ChartContainer
              config={nameConfig(officeTotals)}
              className="mx-auto aspect-square w-full max-h-[420px]"
            >
              <PieChart margin={{ top: 16, right: 80, bottom: 16, left: 80 }}>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="name"
                      labelFormatter={(_, p) => {
                        const d = p?.[0]?.payload as OfficeCity | undefined;
                        return d?.office ? `${d.office} → ${d.name}` : d?.name;
                      }}
                    />
                  }
                />
                <Pie
                  data={officeTotals.map((o, i) => ({
                    ...o,
                    fill: sliceColor(i),
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="50%"
                  stroke="var(--background)"
                  label={officeLabel}
                  labelLine={false}
                />
                <Pie
                  data={officeCities.map((c, i) => ({
                    ...c,
                    fill: sliceColor(i),
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  stroke="var(--background)"
                  label={cityLabel}
                  labelLine={{ stroke: "var(--muted-foreground)" }}
                />
                {/* No <ChartLegend>: recharts overrides its payload with one
                    entry per slice, and cities aren't in the config, so every
                    city rendered as an unlabelled swatch. Offices are labelled
                    on the inner ring instead. */}
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base">Busiest weekdays</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <Skeleton className="aspect-video w-full" />
          ) : (
            <ChartContainer config={countConfig} className="w-full">
              <BarChart data={byWeekday} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
