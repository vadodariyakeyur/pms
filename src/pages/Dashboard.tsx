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
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { useOffice } from "@/hooks/use-office";
import PageHeader from "@/components/custom/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DayPoint,
  NameCount,
  OfficeCity,
  OfficeDayPoint,
} from "@/components/custom/DashboardCharts";
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
    prev: { bookings: 0, qty: 0, collected: 0, pending: 0 },
  });
  const [daily, setDaily] = useState<DayPoint[]>([]);
  const [officeTotals, setOfficeTotals] = useState<NameCount[]>([]);
  const [officeCities, setOfficeCities] = useState<OfficeCity[]>([]);
  const [byWeekday, setByWeekday] = useState<NameCount[]>([]);
  const [officeDaily, setOfficeDaily] = useState<OfficeDayPoint[]>([]);
  const [officeNames, setOfficeNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const end = new Date();
        const start = subDays(end, 29);
        const today = format(end, "yyyy-MM-dd");
        const startStr = format(start, "yyyy-MM-dd");

        const [{ data, error }, { data: allOfficeRows, error: officeError }] =
          await Promise.all([
            supabase
              .from("parcels")
              .select(
                "parcel_date, amount, amount_given, qty, to_city:cities!parcels_to_city_id_fkey(name)"
              )
              .eq("office_id", office.id)
              .gte("parcel_date", startStr)
              .lte("parcel_date", today),
            // Every office, so revenue can be compared day by day and split
            // by destination city.
            supabase
              .from("parcels")
              .select(
                "parcel_date, amount, offices(name), to_city:cities!parcels_to_city_id_fkey(name)"
              )
              .gte("parcel_date", startStr)
              .lte("parcel_date", today),
          ]);

        if (error) throw error;
        if (officeError) throw officeError;

        const rows = data || [];
        const yesterday = format(subDays(end, 1), "yyyy-MM-dd");
        const sum = (day: string) => {
          const dayRows = rows.filter((r) => r.parcel_date === day);
          return {
            bookings: dayRows.length,
            qty: dayRows.reduce((a, r) => a + (r.qty || 0), 0),
            collected: dayRows.reduce((a, r) => a + (r.amount_given || 0), 0),
            pending: dayRows.reduce(
              (a, r) => a + ((r.amount || 0) - (r.amount_given || 0)),
              0
            ),
          };
        };

        setStats({ ...sum(today), prev: sum(yesterday) });

        // Daily money — fill every day in the window so gaps still render.
        const byDay = new Map<string, DayPoint>();
        for (const d of eachDayOfInterval({ start, end })) {
          const key = format(d, "yyyy-MM-dd");
          byDay.set(key, { date: key, collected: 0, pending: 0 });
        }
        for (const r of rows) {
          const p = byDay.get(r.parcel_date);
          if (!p) continue;
          p.collected += r.amount_given || 0;
          p.pending += (r.amount || 0) - (r.amount_given || 0);
        }
        setDaily(Array.from(byDay.values()));

        // Bookings by weekday, to show which days need more staff.
        const dow = Array.from({ length: 7 }, (_, i) => ({
          name: format(new Date(2024, 0, 7 + i), "EEE"),
          count: 0,
        }));
        for (const r of rows) {
          dow[new Date(r.parcel_date).getDay()].count += 1;
        }
        setByWeekday(dow);

        // Daily parcel value per office, as one row per day with a column
        // per office. Days with no bookings stay 0 so the lines don't break.
        const officeNames = Array.from(
          new Set(
            (allOfficeRows || [])
              .map((r) => r.offices?.name)
              .filter((n): n is string => !!n)
          )
        ).sort();
        const blankDay = Object.fromEntries(officeNames.map((n) => [n, 0]));
        const officeByDay = new Map<string, OfficeDayPoint>();
        for (const d of eachDayOfInterval({ start, end })) {
          const key = format(d, "yyyy-MM-dd");
          officeByDay.set(key, { date: key, ...blankDay });
        }
        for (const r of allOfficeRows || []) {
          const name = r.offices?.name;
          const day = officeByDay.get(r.parcel_date);
          if (!name || !day) continue;
          day[name] = (Number(day[name]) || 0) + (r.amount || 0);
        }
        setOfficeNames(officeNames);
        setOfficeDaily(Array.from(officeByDay.values()));

        // Two-level pie: office (inner) → destination city (outer). Outer
        // slices stay grouped in inner-ring order so the rings line up.
        const perOffice = new Map<string, Map<string, number>>();
        for (const r of allOfficeRows || []) {
          const officeName = r.offices?.name;
          const city = r.to_city?.name;
          if (!officeName || !city) continue;
          const cities = perOffice.get(officeName) ?? new Map<string, number>();
          cities.set(city, (cities.get(city) || 0) + 1);
          perOffice.set(officeName, cities);
        }
        setOfficeTotals(
          officeNames.map((name) => ({
            name,
            count: Array.from(perOffice.get(name)?.values() || []).reduce(
              (a, c) => a + c,
              0
            ),
          }))
        );
        setOfficeCities(
          officeNames.flatMap((name, i) =>
            Array.from(perOffice.get(name) || [], ([city, count]) => ({
              name: city,
              count,
              office: name,
              officeIndex: i,
            }))
          )
        );
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [office.id]);

  // No percentage is meaningful against a zero baseline.
  const delta = (now: number, prev: number) =>
    prev === 0 ? null : ((now - prev) / prev) * 100;

  const tiles = [
    {
      label: "Today's bookings",
      value: stats.bookings.toLocaleString("en-IN"),
      change: delta(stats.bookings, stats.prev.bookings),
      Icon: Package,
    },
    {
      label: "Items booked today",
      value: stats.qty.toLocaleString("en-IN"),
      change: delta(stats.qty, stats.prev.qty),
      Icon: Boxes,
    },
    {
      label: "Collected today",
      value: inr(stats.collected),
      change: delta(stats.collected, stats.prev.collected),
      Icon: IndianRupee,
    },
    {
      label: "Pending today",
      value: inr(stats.pending),
      change: delta(stats.pending, stats.prev.pending),
      Icon: Wallet,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${office.name} · ${format(new Date(), "EEEE, d MMMM yyyy")}`}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, change, Icon }) => (
          <Card key={label} className="gap-0 py-5">
            <CardContent className="flex items-center justify-between px-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                {loading ? (
                  <Skeleton className="mt-2 h-7 w-20" />
                ) : (
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-2xl font-semibold">{value}</p>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        change === null
                          ? "text-muted-foreground"
                          : change >= 0
                            ? "text-emerald-600"
                            : "text-destructive"
                      }`}
                    >
                      {change === null ? (
                        "—"
                      ) : (
                        <>
                          {change >= 0 ? (
                            <TrendingUp className="size-3.5" />
                          ) : (
                            <TrendingDown className="size-3.5" />
                          )}
                          {Math.abs(change).toFixed(1)}%
                        </>
                      )}
                    </span>
                  </div>
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
          officeDaily={officeDaily}
          officeNames={officeNames}
          currentOffice={office.name}
          officeTotals={officeTotals}
          officeCities={officeCities}
          byWeekday={byWeekday}
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
