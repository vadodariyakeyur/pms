import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Filter,
  X,
  Settings,
  Printer,
  CalendarIcon,
  IndianRupeeIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Database } from "@/lib/supabase/types";
import router from "@/app/router";
import { cn } from "@/lib/utils";
import { useOffice } from "@/hooks/use-office";

// Define types
type Parcel = Database["public"]["Tables"]["parcels"]["Row"] & {
  buses?: { registration_no: string } | null;
  drivers?: { name: string } | null;
  from_city?: { name: string } | null;
  to_city?: { name: string } | null;
};

type City = Database["public"]["Tables"]["cities"]["Row"];

const PAGE_SIZE = 10;

export default function ListParcels() {
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [parcelToDelete, setParcelToDelete] = useState<number | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [fromCityId, setFromCityId] = useState<number | null>(null);
  const [toCityId, setToCityId] = useState<number | null>(null);
  const [billNo, setBillNo] = useState("");
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: new Date(),
    to: new Date(),
  });
  const debounceRef = useRef<NodeJS.Timeout>(null);

  const office = useOffice()

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchParcels, 500);
  }, [page, PAGE_SIZE, searchTerm, fromCityId, toCityId, billNo, dateRange, office]);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (error) throw error;

      setCities(data || []);
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  };

  const fetchParcels = async () => {
    setLoading(true);
    try {
      // 1. Construct the base query for counting
      let countQuery = supabase
        .from("parcels")
        .select("*", { count: "exact", head: true })
        .eq('office_id', office.id);

      const updatedBillNo = billNo.toLowerCase().startsWith("r")
        ? billNo.slice(1)
        : billNo;
      if (updatedBillNo) {
        countQuery = countQuery.eq("bill_no", parseInt(updatedBillNo));
      } else {
        // 2. Apply filters to the count query
        if (searchTerm) {
          countQuery = countQuery.or(
            `sender_name.ilike.%${searchTerm}%,receiver_name.ilike.%${searchTerm}%,sender_mobile_no.ilike.%${searchTerm}%,receiver_mobile_no.ilike.%${searchTerm}%`
          );
        }

        if (fromCityId) {
          countQuery = countQuery.eq("from_city_id", fromCityId);
        }

        if (toCityId) {
          countQuery = countQuery.eq("to_city_id", toCityId);
        }

        if (dateRange.from && dateRange.to) {
          const fromDate = format(dateRange.from, "yyyy-MM-dd");
          const toDate = format(dateRange.to, "yyyy-MM-dd");
          countQuery = countQuery
            .gte("parcel_date", fromDate)
            .lte("parcel_date", toDate);
        }
      }

      // 3. Execute the count query
      const { error: countError, count } = await countQuery;

      if (countError) {
        throw countError;
      }

      if (count === null) {
        setTotalPages(1);
        setParcels([]);
        return;
      }

      // 4. Calculate total pages
      setTotalPages(Math.ceil(count / PAGE_SIZE));

      // 5. Construct the query for fetching paginated data
      let dataQuery = supabase.from("parcels").select(`
          *,
          buses (registration_no),
          drivers (name),
          from_city:cities!parcels_from_city_id_fkey (name),
          to_city:cities!parcels_to_city_id_fkey (name)
        `)
        .eq('office_id', office.id);

      // 6. Apply the SAME filters to the data query
      if (updatedBillNo) {
        dataQuery = dataQuery.eq("bill_no", parseInt(updatedBillNo));
      } else {
        if (searchTerm) {
          dataQuery = dataQuery.or(
            `sender_name.ilike.%${searchTerm}%,receiver_name.ilike.%${searchTerm}%,sender_mobile_no.ilike.%${searchTerm}%,receiver_mobile_no.ilike.%${searchTerm}%`
          );
        }

        if (fromCityId) {
          dataQuery = dataQuery.eq("from_city_id", fromCityId);
        }

        if (toCityId) {
          dataQuery = dataQuery.eq("to_city_id", toCityId);
        }

        if (dateRange.from && dateRange.to) {
          const fromDate = format(dateRange.from, "yyyy-MM-dd");
          const toDate = format(dateRange.to, "yyyy-MM-dd");
          dataQuery = dataQuery
            .gte("parcel_date", fromDate)
            .lte("parcel_date", toDate);
        }

        // 7. Apply pagination and order to the data query
        dataQuery = dataQuery
          .order("parcel_date", { ascending: false })
          .order("bill_no", { ascending: false })
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      }

      // 8. Execute the data query
      const { data, error: dataError } = await dataQuery;

      if (dataError) {
        throw dataError;
      }

      setParcels(data || []);
    } catch (err) {
      console.error("Error fetching parcels:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintParcel = (id: number) => {
    router.navigate(`/parcel/${id}/print`);
  };

  const handleEditParcel = (id: number) => {
    router.navigate(`/parcel/${id}/edit`);
  };

  const confirmDeleteParcel = (id: number) => {
    setParcelToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteParcel = async () => {
    if (!parcelToDelete) return;

    try {
      const { error } = await supabase
        .from("parcels")
        .delete()
        .eq("id", parcelToDelete);

      if (error) throw error;

      // Refresh the list
      fetchParcels();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting parcel:", err);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFromCityId(null);
    setToCityId(null);
    setBillNo("");
    setDateRange({
      from: new Date(),
      to: new Date(),
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">View Parcels</h1>
          <p className="text-muted-foreground">
            Manage parcels with search and filter capabilities
          </p>
        </div>
        <Button
          onClick={() => router.navigate("/parcels/add")}
        >
          Add New Parcel
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <Collapsible open={showFilters} className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Search Parcels</CardTitle>
              <CollapsibleTrigger
                asChild
                onClick={() => setShowFilters(!showFilters)}
              >
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by sender/receiver name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Bill No."
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button
                onClick={resetFilters}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <CollapsibleContent>
              <div className="mt-6 gap-6 grid grid-cols-1 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>From City</Label>
                  <Select
                    value={fromCityId?.toString() || ""}
                    onValueChange={(value) =>
                      setFromCityId(value ? parseInt(value) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any city</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>To City</Label>
                  <Select
                    value={toCityId?.toString() || ""}
                    onValueChange={(value) =>
                      setToCityId(value ? parseInt(value) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any city</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-2 col-span-2">
                  <div className="space-y-2">
                    <Label htmlFor="date-report-start-date">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            format(dateRange.from, "PPP")
                          ) : (
                            <span className="text-muted-foreground">
                              Pick start date
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(startDate) =>
                            setDateRange((prev) => ({
                              ...prev,
                              from: startDate,
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2 !mt-0">
                    <Label htmlFor="date-report-end-date">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? (
                            format(dateRange.to, "PPP")
                          ) : (
                            <span className="text-muted-foreground">Pick end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(endDate) =>
                            setDateRange((prev) => ({
                              ...prev,
                              to: endDate,
                            }))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>

      {/* Parcels List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parcels List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Mokalnar</TableHead>
                  <TableHead>Lenar</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="space-y-2">
{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
</div>
                    </TableCell>
                  </TableRow>
                ) : parcels.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No parcels found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {parcels.map((parcel) => (
                      <TableRow key={parcel.id}>
                        <TableCell className="font-medium">
                          R{parcel.bill_no}
                        </TableCell>
                        <TableCell>
                          {format(new Date(parcel.parcel_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{parcel.from_city?.name}</TableCell>
                        <TableCell>{parcel.to_city?.name}</TableCell>
                        <TableCell>
                          <div>{parcel.sender_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {parcel.sender_mobile_no}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{parcel.receiver_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {parcel.receiver_mobile_no}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              parcel.amount - parcel.amount_given > 0
                                ? "text-destructive"
                                : "text-green-400"
                            )}
                          >
                            <IndianRupeeIcon className="h-4 w-4" />
                            {parcel.amount.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  handlePrintParcel(parcel.id)
                                }
                                className="cursor-pointer"
                              >
                                <Printer className="mr-2 h-4 w-4" /> Print
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditParcel(parcel.id)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => confirmDeleteParcel(parcel.id)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this parcel? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteParcel}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
