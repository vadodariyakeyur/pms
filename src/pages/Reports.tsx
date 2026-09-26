import { useState, useEffect } from "react";
import { Printer, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, getYear, getMonth, setMonth } from "date-fns";

import { toast } from "sonner";

import { supabase } from "@/lib/supabase/client";
import { findForReport } from "@/lib/parcels";
import {
  monthlyReportHtml,
  recordReportHtml,
} from "@/lib/report-document";
import { monthNames, resolvePeriod } from "@/lib/report-period";
import type { Bus, City } from "@/lib/domain";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useOffice } from "@/hooks/use-office";

function openPrintDialog(printContent: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Popup blocked — allow popups for this site to print reports.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

export default function Reports() {
  // --- Common State ---
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Date Report State
  // Replace single dateReportDate with start and end dates
  const [dateReportStartDate, setDateReportStartDate] = useState<
    Date | undefined
  >(new Date());
  const [dateReportEndDate, setDateReportEndDate] = useState<Date | undefined>(
    new Date()
  );
  const [dateReportBusId, setDateReportBusId] = useState<string>("");

  // City selections (shared across report types)
  const [fromCityId, setFromCityId] = useState<string>("");
  const [toCityId, setToCityId] = useState<string>("");

  // Daily Report State
  const [dailyReportDate, setDailyReportDate] = useState<Date | undefined>(
    new Date()
  );

  // Monthly Report State
  const [monthlyReportMonth, setMonthlyReportMonth] = useState<string>(
    `${monthNames[getMonth(new Date())]}-${getYear(new Date())}` // Format: MonthName-YYYY
  );

  const office = useOffice()

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingDefaults(true);
    try {
      const [
        { data: citiesData, error: citiesError },
        { data: busesData, error: busesError },
        { data: assignmentData, error: assignmentError },
      ] = await Promise.all([
        supabase.from("cities").select("*").order("name"),
        supabase.from("buses").select("*").order("registration_no"),
        supabase
          .from("bus_driver_assignments")
          .select("bus_id")
          .order("assignment_date", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (citiesError) throw citiesError;
      if (busesError) throw busesError;
      if (assignmentError) throw assignmentError;

      // Find default cities
      const defaultFrom = citiesData?.find((c) => c.is_default_from);
      const defaultTo = citiesData?.find((c) => c.is_default_to);

      // Set default city IDs for filters
      const fromIdStr = defaultFrom?.id.toString() || "";
      const toIdStr = defaultTo?.id.toString() || "";

      const firstBusId = assignmentData?.bus_id || busesData?.[0]?.id || null;

      setCities(citiesData || []);
      setBuses(busesData || []);
      setFromCityId(fromIdStr);
      setToCityId(toIdStr);
      setDateReportBusId(firstBusId?.toString() || "");
    } catch (err) {
      console.error("Error fetching initial report data:", err);
      toast.error("Failed to load cities and buses.");
    } finally {
      setLoadingDefaults(false);
    }
  };

  const fetchReport = async (reportType: "date" | "daily" | "monthly") => {
    if (!validateReportInputs(reportType)) {
      return;
    }

    setIsReportLoading(true);
    try {
      const dateParams = getDateParameters(reportType);
      if (!dateParams) {
        console.error(
          `cannot get date params from getDateParameters for REPORT TYPE: ${reportType}`
        );
        toast.error("Invalid date selection. Please pick the date again.");
        return;
      }

      const fromCity = cities.find((city) => city.id === parseInt(fromCityId));
      const toCity = cities.find((city) => city.id === parseInt(toCityId));

      if (reportType === "monthly") {
        if (
          !dateParams.startDate ||
          !dateParams.endDate ||
          !fromCity?.name ||
          !toCity?.name
        ) {
          toast.error("Please select all fields for Monthly Report.");
          return;
        }

        const { data, error } = await supabase.rpc(
          "get_parcels_aggregated_by_date",
          {
            p_bus_id: parseInt(dateReportBusId),
            p_from_city_id: parseInt(fromCityId),
            p_to_city_id: parseInt(toCityId),
            p_start_date: dateParams.startDate,
            p_end_date: dateParams.endDate,
          }
        );
        if (error) throw error;

        openPrintDialog(
          monthlyReportHtml(data || [], {
            fromCity: fromCity.name,
            toCity: toCity.name,
            date: monthlyReportMonth,
          })
        );
        return;
      }

      let reportDateString = format(new Date(), "dd/MM/yyyy");
      if (reportType === "date") {
        if (dateReportStartDate && dateReportEndDate) {
          reportDateString = `${format(
            dateReportStartDate,
            "dd/MM/yyyy"
          )} - ${format(dateReportEndDate, "dd/MM/yyyy")}`;
        }
      } else if (dateParams.date) {
        reportDateString = `${format(dateParams.date, "dd/MM/yyyy")}`;
      }

      const data = await findForReport({
        officeId: office.id,
        busId: parseInt(dateReportBusId),
        fromCityId: parseInt(fromCityId),
        toCityId: parseInt(toCityId),
        date: reportType === "date" ? undefined : dateParams.date,
        startDate: reportType === "date" ? dateParams.startDate : undefined,
        endDate: reportType === "date" ? dateParams.endDate : undefined,
      });

      if (fromCity && toCity) {
        openPrintDialog(
          recordReportHtml(data || [], {
            fromCity: fromCity.name,
            toCity: toCity.name,
            date: reportDateString,
          })
        );
      } else {
        console.error(
          `Cities with ID FROM:${fromCityId} and TO:${toCityId} not found`
        );
        toast.error("Selected city not found. Please reselect From and To cities.");
      }
    } catch (err) {
      console.error(`Error fetching ${reportType} report:`, err);
      toast.error(`Failed to generate ${reportType} report.`);
    } finally {
      setIsReportLoading(false);
    }
  };

  // Helper to validate inputs for each report type
  const validateReportInputs = (
    reportType: "date" | "daily" | "monthly"
  ): boolean => {
    switch (reportType) {
      case "date":
        if (
          !dateReportStartDate ||
          !dateReportEndDate ||
          !dateReportBusId ||
          !fromCityId ||
          !toCityId
        ) {
          toast.error("Please select all fields for Date Report.");
          return false;
        }
        if (dateReportEndDate < dateReportStartDate) {
          toast.error("End date cannot be before start date.");
          return false;
        }
        break;
      case "daily":
        if (!dailyReportDate || !dateReportBusId || !fromCityId || !toCityId) {
          toast.error("Please select all fields for Daily Report.");
          return false;
        }
        break;
      case "monthly":
        if (
          !monthlyReportMonth ||
          !dateReportBusId ||
          !fromCityId ||
          !toCityId
        ) {
          toast.error("Please select all fields for Monthly Report.");
          return false;
        }
        break;
    }
    return true;
  };

  // Date-range resolution lives in report-period.ts, where it is tested.
  const getDateParameters = (reportType: "date" | "daily" | "monthly") =>
    resolvePeriod({
      reportType,
      startDate: dateReportStartDate,
      endDate: dateReportEndDate,
      dailyDate: dailyReportDate,
      monthKey: monthlyReportMonth,
    });

  // Function to render city selector (reused in multiple places)
  const renderCitySelector = (
    label: string,
    id: string,
    value: string,
    onChange: (value: string) => void
  ) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id.toString()}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Function to render bus selector (reused in multiple places)
  const renderBusSelector = () => (
    <div className="space-y-1">
      <Label htmlFor="report-bus">Bus</Label>
      <Select value={dateReportBusId} onValueChange={setDateReportBusId}>
        <SelectTrigger id="report-bus">
          <SelectValue placeholder="Select Bus" />
        </SelectTrigger>
        <SelectContent>
          {buses.map((bus) => (
            <SelectItem key={bus.id} value={bus.id.toString()}>
              {bus.registration_no}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Function to render date picker
  const renderDatePicker = (
    label: string,
    id: string,
    value: Date | undefined,
    onChange: (date: Date | undefined) => void
  ) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "PPP")
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  // Render the print button
  const renderPrintButton = (onClick: () => void) => (
    <Button
      onClick={onClick}
      disabled={isReportLoading}
      className="w-full"
    >
      {isReportLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      Print Report
    </Button>
  );

  // Loading state
  if (loadingDefaults) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Loading initial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      <p className="text-muted-foreground">
        Generate reports based on date, daily summary, or monthly activity.
      </p>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          <TabsTrigger value="date">Date Report</TabsTrigger>
        </TabsList>

        {/* Daily Report Tab */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Report</CardTitle>
              <CardDescription className="text-muted-foreground">
                View all parcels for a specific date and route.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {renderDatePicker(
                  "Date",
                  "daily-report-date",
                  dailyReportDate,
                  setDailyReportDate
                )}
                {renderBusSelector()}
                {renderCitySelector(
                  "From City",
                  "daily-report-from",
                  fromCityId,
                  setFromCityId
                )}
                {renderCitySelector(
                  "To City",
                  "daily-report-to",
                  toCityId,
                  setToCityId
                )}
                {renderPrintButton(() => fetchReport("daily"))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Report Tab */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Report</CardTitle>
              <CardDescription className="text-muted-foreground">
                View all parcels for a specific month and route.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {/* Month/Year Picker */}
                <div className="space-y-1">
                  <Label htmlFor="monthly-report-month">Month</Label>
                  <Select
                    value={monthlyReportMonth}
                    onValueChange={setMonthlyReportMonth}
                  >
                    <SelectTrigger
                      id="monthly-report-month"
                    >
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 18 }).map((_, i) => {
                        const date = setMonth(
                          new Date(),
                          getMonth(new Date()) - 12 + i
                        );
                        const year = getYear(date);
                        const month = getMonth(date);
                        const value = `${monthNames[month]}-${year}`;
                        const label = `${monthNames[month]} ${year}`;
                        return (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {renderBusSelector()}
                {renderCitySelector(
                  "From City",
                  "monthly-report-from",
                  fromCityId,
                  setFromCityId
                )}
                {renderCitySelector(
                  "To City",
                  "monthly-report-to",
                  toCityId,
                  setToCityId
                )}
                {renderPrintButton(() => fetchReport("monthly"))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Date Report Tab */}
        <TabsContent value="date">
          <Card>
            <CardHeader>
              <CardTitle>Date Report</CardTitle>
              <CardDescription className="text-muted-foreground">
                View parcels for a specific date, bus, and route.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {renderDatePicker(
                  "Start Date",
                  "date-report-start-date",
                  dateReportStartDate,
                  setDateReportStartDate
                )}
                {renderDatePicker(
                  "End Date",
                  "date-report-end-date",
                  dateReportEndDate,
                  setDateReportEndDate
                )}
                {renderBusSelector()}
                {renderCitySelector(
                  "From City",
                  "date-report-from",
                  fromCityId,
                  setFromCityId
                )}
                {renderCitySelector(
                  "To City",
                  "date-report-to",
                  toCityId,
                  setToCityId
                )}
                {renderPrintButton(() => fetchReport("date"))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
