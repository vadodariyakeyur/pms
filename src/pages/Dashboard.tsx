import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  PackagePlus,
  FileText,
  Boxes,
  IndianRupee,
  Wallet,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/lib/supabase/client";
import { useOffice } from "@/hooks/use-office";
import PageHeader from "@/components/custom/PageHeader";
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
import { eachDayOfInterval, format, subDays } from "date-fns";

const quickActions = [
  {
    title: "Add Parcel",
    description: "Create a new parcel booking and print the receipt.",
    link: "/parcels/add",
    Icon: PackagePlus,
  },
  {
    title: "View Parcels",
    description: "Search, edit and manage all parcel records.",
    link: "/parcels",
    Icon: Package,
  },
  {
    title: "Reports",
    description: "Generate daily, monthly and date-range reports.",
    link: "/reports",
    Icon: FileText,
  },
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type DayPoint = { date: string; bookings: number; collected: number; pending: number };
type NameCount = { name: string; count: number };

export default function Dashboard() {
  const office = useOffice();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    bookings: 0,
    qty: 0,
    collected: 0,
    pending: 0,
  });
  const [daily, setDaily] = useState<DayPoint[]>([]);
  const [topCities, setTopCities] = useState<NameCount[]>([]);
  const [byBus, setByBus] = useState<NameCount[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const end = new Date();
        const start = subDays(end, 29);
        const today = format(end, "yyyy-MM-dd");
        const startStr = format(start, "yyyy-MM-dd");

        const { data, error } = await supabase
          .from("parcels")
          .select(
            "parcel_date, amount, amount_given, qty, to_city:cities!parcels_to_city_id_fkey(name), buses(registration_no)"
          )
          .eq("office_id", office.id)
          .gte("parcel_date", startStr)
          .lte("parcel_date", today);

        if (error) throw error;

        const rows = data || [];
        const todayRows = rows.filter((r) => r.parcel_date === today);

        setStats({
          bookings: todayRows.length,
          qty: todayRows.reduce((a, r) => a + (r.qty || 0), 0),
          collected: todayRows.reduce((a, r) => a + (r.amount_given || 0), 0),
          pending: todayRows.reduce(
            (a, r) => a + ((r.amount || 0) - (r.amount_given || 0)),
            0
          ),
        });

        // Daily trend — fill every day in the window so gaps still render.
        const byDay = new Map<string, DayPoint>();
        for (const d of eachDayOfInterval({ start, end })) {
          const key = format(d, "yyyy-MM-dd");
          byDay.set(key, { date: key, bookings: 0, collected: 0, pending: 0 });
        }
        for (const r of rows) {
          const p = byDay.get(r.parcel_date);
          if (!p) continue;
          p.bookings += 1;
          p.collected += r.amount_given || 0;
          p.pending += (r.amount || 0) - (r.amount_given || 0);
        }
        setDaily(Array.from(byDay.values()));

        // Top destination cities and bookings by bus.
        const cityCounts = new Map<string, number>();
        const busCounts = new Map<string, number>();
        for (const r of rows) {
          const city = r.to_city?.name;
          if (city) cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
          const bus = r.buses?.registration_no;
          if (bus) busCounts.set(bus, (busCounts.get(bus) || 0) + 1);
        }
        const toSorted = (m: Map<string, number>, limit?: number) => {
          const arr = Array.from(m, ([name, count]) => ({ name, count })).sort(
            (a, b) => b.count - a.count
          );
          return limit ? arr.slice(0, limit) : arr;
        };
        setTopCities(toSorted(cityCounts, 7));
        setByBus(toSorted(busCounts, 7));
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [office.id]);

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

  const dayTick = (v: string) => format(new Date(v), "d MMM");

  const tiles = [
    { label: "Today's bookings", value: stats.bookings.toLocaleString("en-IN"), Icon: Package },
    { label: "Items booked today", value: stats.qty.toLocaleString("en-IN"), Icon: Boxes },
    { label: "Collected today", value: inr(stats.collected), Icon: IndianRupee },
    { label: "Pending today", value: inr(stats.pending), Icon: Wallet },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${office.name} · ${format(new Date(), "EEEE, d MMMM yyyy")}`}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, Icon }) => (
          <Card key={label} className="gap-0 py-5">
            <CardContent className="flex items-center justify-between px-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                {loading ? (
                  <Skeleton className="mt-2 h-7 w-20" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold">{value}</p>
                )}
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics */}
      <h2 className="mb-3 mt-8 text-lg font-semibold">
        Analytics · last 30 days
      </h2>
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

      {/* Quick actions */}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Quick actions</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickActions.map(({ title, description, link, Icon }) => (
          <Link key={link} to={link} className="group">
            <Card className="h-full gap-0 py-5 transition-colors hover:border-primary/50">
              <CardContent className="px-5">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <p className="flex items-center gap-1 font-semibold">
                  {title}
                  <ArrowRight className="size-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
