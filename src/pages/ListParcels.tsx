import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Trash2,
  Filter,
  X,
  Settings,
  Printer,
  CalendarIcon,
} from "lucide-react";
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
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchParcels, 500);
  }, [page, PAGE_SIZE, searchTerm, fromCityId, toCityId, billNo, dateRange]);

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
        .select("*", { count: "exact", head: true });

      // 2. Apply filters to the count query
      if (searchTerm) {
        countQuery = countQuery.or(
          `sender_name.ilike.%${searchTerm}%,receiver_name.ilike.%${searchTerm}%,sender_mobile_no.ilike.%${searchTerm}%,receiver_mobile_no.ilike.%${searchTerm}%`
        );
      }

      const updatedBillNo = billNo.toLowerCase().startsWith("r")
        ? billNo.slice(1)
        : billNo;
      if (updatedBillNo) {
        countQuery = countQuery.eq("bill_no", parseInt(updatedBillNo));
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
        `);

      // 6. Apply the SAME filters to the data query
      if (searchTerm) {
        dataQuery = dataQuery.or(
          `sender_name.ilike.%${searchTerm}%,receiver_name.ilike.%${searchTerm}%,sender_mobile_no.ilike.%${searchTerm}%,receiver_mobile_no.ilike.%${searchTerm}%`
        );
      }

      if (updatedBillNo) {
        dataQuery = dataQuery.eq("bill_no", parseInt(updatedBillNo));
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

  const handlePrintParcel = (billNo: number) => {
    navigate(`/parcel/${billNo}/print`);
  };

  const handleEditParcel = (billNo: number) => {
    navigate(`/parcel/${billNo}/edit`);
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
          <p className="text-gray-400">
            Manage parcels with search and filter capabilities
          </p>
        </div>
        <Button
          onClick={() => navigate("/parcels/add")}
          className="bg-gray-700 hover:bg-gray-600"
        >
          Add New Parcel
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card className="bg-gray-900 border-gray-800">
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
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700"
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
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Input
                  placeholder="Bill No."
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="w-32 bg-gray-800 border-gray-700"
                />
              </div>
              <Button
                onClick={resetFilters}
                variant="outline"
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
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
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Any city" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
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
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Any city" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
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
                          className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            format(dateRange.from, "PPP")
                          ) : (
                            <span className="text-gray-400">
                              Pick start date
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-gray-800 border-gray-700"
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
                          className="bg-gray-800"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-report-end-date">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? (
                            format(dateRange.to, "PPP")
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
                          selected={dateRange.to}
                          onSelect={(endDate) =>
                            setDateRange((prev) => ({
                              ...prev,
                              to: endDate,
                            }))
                          }
                          className="bg-gray-800"
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
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Parcels List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : parcels.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No parcels found matching your criteria.</p>
            </div>
          ) : (
            <div className="rounded-md border border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-900">
                    <TableHead className="text-gray-300">Bill No.</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">From</TableHead>
                    <TableHead className="text-gray-300">To</TableHead>
                    <TableHead className="text-gray-300">Mokalnar</TableHead>
                    <TableHead className="text-gray-300">Lenar</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcels.map((parcel) => (
                    <TableRow key={parcel.id} className="hover:bg-gray-800">
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
                        <div className="text-xs text-gray-400">
                          {parcel.sender_mobile_no}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{parcel.receiver_name}</div>
                        <div className="text-xs text-gray-400">
                          {parcel.receiver_mobile_no}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{parcel.amount?.toFixed(2)}</div>
                        {parcel.amount_remaining > 0 && (
                          <div className="text-xs text-red-400">
                            Due: {parcel.amount_remaining?.toFixed(2)}
                          </div>
                        )}
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
                            className="bg-gray-800 border-gray-700"
                          >
                            <DropdownMenuItem
                              onClick={() => handlePrintParcel(parcel.bill_no)}
                              className="cursor-pointer hover:bg-gray-700"
                            >
                              <Printer className="mr-2 h-4 w-4" /> Print
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditParcel(parcel.bill_no)}
                              className="cursor-pointer hover:bg-gray-700"
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDeleteParcel(parcel.id)}
                              className="cursor-pointer text-red-400 hover:bg-gray-700 focus:text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <div className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
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
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this parcel? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteParcel}
              className="bg-red-900 hover:bg-red-800"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
