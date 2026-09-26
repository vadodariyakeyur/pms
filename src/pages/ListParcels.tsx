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
import type { City, Parcel } from "@/lib/domain";
import router from "@/app/router";
import { cn } from "@/lib/utils";
import { isUnpaid } from "@/lib/parcel-money";
import { findPage, parseBillNo, remove } from "@/lib/parcels";
import { formatBillNo } from "@/lib/bill";
import { useOffice } from "@/hooks/use-office";
import { toast } from "sonner";

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
      const { parcels, total } = await findPage({
        filter: {
          officeId: office.id,
          searchTerm,
          fromCityId,
          toCityId,
          startDate: dateRange.from
            ? format(dateRange.from, "yyyy-MM-dd")
            : null,
          endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null,
        },
        billNo: parseBillNo(billNo),
        page,
        pageSize: PAGE_SIZE,
      });

      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      setParcels(parcels);
    } catch (err) {
      console.error("Error fetching parcels:", err);
      toast.error("Could not load parcels. Please try again.");
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
      await remove(parcelToDelete);

      // Refresh the list
      fetchParcels();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting parcel:", err);
      // Previously this failed silently and left the dialog open, so a failed
      // delete looked identical to an unresponsive button.
      toast.error("Could not delete the parcel. Please try again.");
      setDeleteDialogOpen(false);
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
                          {formatBillNo(parcel.bill_no)}
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
                              isUnpaid(parcel)
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
