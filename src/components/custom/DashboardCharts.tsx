import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
  bookings: number;
  collected: number;
  pending: number;
};
export type NameCount = { name: string; count: number };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const dayTick = (v: string) => format(new Date(v), "d MMM");

const trendConfig = {
  bookings: { label: "Bookings", color: "var(--chart-1)" },
  collected: { label: "Collected", color: "var(--chart-3)" },
} satisfies ChartConfig;
const moneyConfig = {
  collected: { label: "Collected", color: "var(--chart-1)" },
  pending: { label: "Pending", color: "var(--chart-5)" },
} satisfies ChartConfig;
const countConfig = {
  count: { label: "Parcels", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Props = {
  loading: boolean;
  daily: DayPoint[];
  topCities: NameCount[];
  byBus: NameCount[];
};

export default function DashboardCharts({
  loading,
  daily,
  topCities,
  byBus,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="gap-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base">Bookings & revenue trend</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <Skeleton className="aspect-video w-full" />
          ) : (
            <ChartContainer config={trendConfig} className="w-full">
              <AreaChart data={daily} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickFormatter={dayTick}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
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
                            {trendConfig[name as keyof typeof trendConfig]
                              ?.label ?? name}
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {name === "collected"
                              ? inr(Number(value))
                              : Number(value).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  yAxisId="left"
                  dataKey="bookings"
                  type="monotone"
                  stroke="var(--color-bookings)"
                  fill="var(--color-bookings)"
                  fillOpacity={0.15}
                />
                <Area
                  yAxisId="right"
                  dataKey="collected"
                  type="monotone"
                  stroke="var(--color-collected)"
                  fill="var(--color-collected)"
                  fillOpacity={0.15}
                />
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
          <CardTitle className="text-base">Top destination cities</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <Skeleton className="aspect-video w-full" />
          ) : topCities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No data yet.
            </p>
          ) : (
            <ChartContainer config={countConfig} className="w-full">
              <BarChart
                data={topCities}
                layout="vertical"
                margin={{ left: 4, right: 12 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base">Bookings by bus</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <Skeleton className="aspect-video w-full" />
          ) : byBus.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No data yet.
            </p>
          ) : (
            <ChartContainer config={countConfig} className="w-full">
              <BarChart data={byBus} margin={{ left: 4, right: 4 }}>
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
