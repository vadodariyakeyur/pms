import { lazy, Suspense, useEffect, useState } from "react";
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

import { supabase } from "@/lib/supabase/client";
import { useOffice } from "@/hooks/use-office";
import PageHeader from "@/components/custom/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DayPoint, NameCount } from "@/components/custom/DashboardCharts";
import { eachDayOfInterval, format, subDays } from "date-fns";

const DashboardCharts = lazy(
  () => import("@/components/custom/DashboardCharts")
);

const ChartsFallback = () => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="aspect-video w-full" />
    ))}
  </div>
);

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
      <Suspense fallback={<ChartsFallback />}>
        <DashboardCharts
          loading={loading}
          daily={daily}
          topCities={topCities}
          byBus={byBus}
        />
      </Suspense>

      {/* Quick actions */}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Quick actions</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickActions.map(({ title, description, link, Icon }) => (
          <Link
            key={link}
            to={link}
            className="group rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Card className="h-full gap-0 py-5 transition-[transform,border-color,box-shadow] duration-fast ease-spring hover:border-primary/50 hover:shadow-md active:scale-[var(--press-scale)]">
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
