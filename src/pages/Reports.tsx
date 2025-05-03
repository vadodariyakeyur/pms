import { useState, useEffect } from "react";
import { Printer, Loader2, Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  getYear,
  getMonth,
  setMonth,
  setYear,
} from "date-fns";

import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";
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

// Define types
type City = Database["public"]["Tables"]["cities"]["Row"];
type Bus = Database["public"]["Tables"]["buses"]["Row"];
type ParcelReportItem = Database["public"]["Tables"]["parcels"]["Row"] & {
  buses?: { registration_no: string } | null;
  from_city?: { name: string } | null;
  to_city?: { name: string } | null;
};

// Helper to generate month options
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const printReport = (
  data: ParcelReportItem[],
  from_city: string,
  to_city: string,
  date: string
) => {
  // Create the HTML content for the print window
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Parcel Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { position: relative; text-align: center; margin-bottom: 20px; }
        .city { position: absolute; top: -34px; left: 4px }
        .date { position: absolute; top: -34px; right: 4px }
        .signature-cell { height: 40px; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <button onclick="window.print();" style="float: right; padding: 8px 16px; background: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px;">Print Report</button>
      <table>
        <thead>
          <tr>
            <th colspan="11">
              <div class="header">
                <h2>Shree Nathji Travels & Cargo</h2>
                <p class="city">
                  From ${from_city} to ${to_city}
                </p>
                <p class="date">Date: ${date}</p>
              </div>
            </th>
          </tr>
          <tr>
            <th>ક્રમ</th>
            <th>મોકલનાર</th>
            <th>મોકલનાર<br/>મોબાઈલ</th>
            <th>લેનાર</th>
            <th>લેનાર<br/>મોબાઈલ</th>
            <th>બિલ નં</th>
            <th>જથ્થો</th>
            <th>વર્ણન</th>
            <th>જમા</th>
            <th>બાકી</th>
            <th>સહી</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (parcel, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${parcel.sender_name || ""}</td>
              <td>${parcel.sender_mobile_no || ""}</td>
              <td>${parcel.receiver_name || ""}</td>
              <td>${parcel.receiver_mobile_no || ""}</td>
              <td>R${parcel.bill_no || ""}</td>
              <td>${parcel.qty || ""}</td>
              <td>${parcel.description || ""}</td>
              <td>${parcel.amount_given || "0"}</td>
              <td>${parcel.amount_remaining || "0"}</td>
              <td class="signature-cell"></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create a new window for printing
  const printWindow = window.open("", "_blank");

  // Write the content to the new window and trigger printing
  printWindow?.document.open();
  printWindow?.document.write(printContent);
  printWindow?.print();
  printWindow?.document.close();
};

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
    `${monthNames[getMonth(new Date())]}-${getYear(new Date())}` // Format: YYYY-M
  );

  // --- Fetch Initial Data (Cities, Buses, Defaults) ---
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
    } finally {
      setLoadingDefaults(false);
    }
  };

  // --- Report Fetching Functions ---
  const fetchReport = async (reportType: "date" | "daily" | "monthly") => {
    // Input validation
    if (!validateReportInputs(reportType)) {
      return;
    }

    setIsReportLoading(true);
    try {
      // Prepare date parameters based on report type
      const dateParams = getDateParameters(reportType);
      if (!dateParams) {
        console.error(
          `cannot get date params from getDateParameters for REPORT TYPE: ${reportType}`
        );
        return;
      }

      // Common query parameters
      const baseQuery = supabase
        .from("parcels")
        .select(
          `
          *,
          buses (registration_no),
          from_city:cities!parcels_from_city_id_fkey (name),
          to_city:cities!parcels_to_city_id_fkey (name)
        `
        )
        .eq("bus_id", parseInt(dateReportBusId))
        .eq("from_city_id", parseInt(fromCityId))
        .eq("to_city_id", parseInt(toCityId))
        .order("created_at", { ascending: false });

      // Apply date filters based on report type
      let query = baseQuery;
      let reportDateString = format(new Date(), "dd/MM/yyyy");
      if (reportType === "date" || reportType === "monthly") {
        if (dateReportStartDate && dateReportEndDate) {
          reportDateString = `${format(
            dateReportStartDate,
            "dd/MM/yyyy"
          )} - ${format(dateReportEndDate, "dd/MM/yyyy")}`;
        }

        query = query
          .gte("parcel_date", dateParams.startDate)
          .lte("parcel_date", dateParams.endDate);

        if (reportType === "monthly") {
          reportDateString = monthlyReportMonth;
          query = query.order("parcel_date", { ascending: true });
        }
      } else if (dateParams.date) {
        // Daily report
        reportDateString = `${format(dateParams.date, "dd/MM/yyyy")}`;
        query = query.eq("parcel_date", dateParams.date);
      }

      const { data, error } = await query;
      if (error) throw error;

      const fromCity = cities.find((city) => city.id === parseInt(fromCityId));
      const toCity = cities.find((city) => city.id === parseInt(toCityId));

      if (fromCity && toCity) {
        printReport(data || [], fromCity.name, toCity.name, reportDateString);
      } else {
        console.error(
          `Cities with ID FROM:${fromCityId} and TO:${toCityId} not found`
        );
      }
    } catch (err) {
      console.error(`Error fetching ${reportType} report:`, err);
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
          console.warn("Please select all fields for Date Report.");
          return false;
        }
        if (dateReportEndDate < dateReportStartDate) {
          console.warn("End date cannot be before start date.");
          return false;
        }
        break;
      case "daily":
        if (!dailyReportDate || !dateReportBusId || !fromCityId || !toCityId) {
          console.warn("Please select all fields for Daily Report.");
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
          console.warn("Please select all fields for Monthly Report.");
          return false;
        }
        break;
    }
    return true;
  };

  // Helper to get date parameters for each report type
  const getDateParameters = (reportType: "date" | "daily" | "monthly") => {
    switch (reportType) {
      case "date":
        return {
          startDate: format(dateReportStartDate!, "yyyy-MM-dd"),
          endDate: format(dateReportEndDate!, "yyyy-MM-dd"),
        };
      case "daily":
        return { date: format(dailyReportDate!, "yyyy-MM-dd") };
      case "monthly": {
        const [month, year] = monthlyReportMonth.split("-");
        const startDate = startOfMonth(
          setYear(
            setMonth(new Date(), monthNames.indexOf(month) + 1),
            parseInt(year)
          )
        );
        const endDate = endOfMonth(startDate);
        return {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        };
      }
      default:
        return null;
    }
  };

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
        <SelectTrigger id={id} className="bg-gray-800 border-gray-700">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
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
        <SelectTrigger id="report-bus" className="bg-gray-800 border-gray-700">
          <SelectValue placeholder="Select Bus" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
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
            className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "PPP")
            ) : (
              <span className="text-gray-400">Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-gray-800 border-gray-700"
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className="bg-gray-800"
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  // Create a new renderDateRangePicker function
  const renderDateRangePicker = (
    startLabel: string,
    endLabel: string,
    startValue: Date | undefined,
    endValue: Date | undefined,
    onStartChange: (date: Date | undefined) => void,
    onEndChange: (date: Date | undefined) => void
  ) => (
    <>
      <div className="space-y-1">
        <Label htmlFor="date-report-start-date">{startLabel}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startValue ? (
                format(startValue, "PPP")
              ) : (
                <span className="text-gray-400">Pick start date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-gray-800 border-gray-700"
            align="start"
          >
            <Calendar
              mode="single"
              selected={startValue}
              onSelect={onStartChange}
              initialFocus
              className="bg-gray-800"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1">
        <Label htmlFor="date-report-end-date">{endLabel}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endValue ? (
                format(endValue, "PPP")
              ) : (
                <span className="text-gray-400">Pick end date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-gray-800 border-gray-700"
            align="start"
          >
            <Calendar
              mode="single"
              selected={endValue}
              onSelect={onEndChange}
              initialFocus
              className="bg-gray-800"
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );

  // Render the print button
  const renderPrintButton = (onClick: () => void) => (
    <Button
      onClick={onClick}
      disabled={isReportLoading}
      className="bg-gray-700 hover:bg-gray-600 w-full"
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
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="ml-2 text-gray-400">Loading initial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      <p className="text-gray-400">
        Generate reports based on date, daily summary, or monthly activity.
      </p>

      <Tabs
        defaultValue="daily"
        className="w-full"
        onSelect={(...event) => console.log(event)}
      >
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          <TabsTrigger value="date">Date Report</TabsTrigger>
        </TabsList>

        {/* Daily Report Tab */}
        <TabsContent value="daily">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Daily Report</CardTitle>
              <CardDescription className="text-gray-400">
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
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Monthly Report</CardTitle>
              <CardDescription className="text-gray-400">
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
                      className="bg-gray-800 border-gray-700"
                    >
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
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
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Date Report</CardTitle>
              <CardDescription className="text-gray-400">
                View parcels for a specific date, bus, and route.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {renderDateRangePicker(
                  "Start Date",
                  "End Date",
                  dateReportStartDate,
                  dateReportEndDate,
                  setDateReportStartDate,
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
