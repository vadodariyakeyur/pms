import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Calendar,
  Bus,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/lib/supabase/types";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type BusDriverAssignment =
  Database["public"]["Tables"]["bus_driver_assignments"]["Row"] & {
    buses: { registration_no: string } | null;
    drivers: { name: string } | null;
  };

type Bus = Database["public"]["Tables"]["buses"]["Row"];
type Driver = Database["public"]["Tables"]["drivers"]["Row"];

export default function BusDriverAssignments() {
  const [assignments, setAssignments] = useState<BusDriverAssignment[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] =
    useState<BusDriverAssignment | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchBuses();
    fetchDrivers();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bus_driver_assignments")
        .select(
          `
          *,
          buses (registration_no),
          drivers (name)
        `
        )
        .order("assignment_date", { ascending: false });

      if (error) throw error;

      setAssignments(data || []);
    } catch (err: any) {
      console.error("Error fetching assignments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
    try {
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .order("registration_no");

      if (error) throw error;

      setBuses(data || []);
    } catch (err: any) {
      console.error("Error fetching buses:", err);
      setError(err.message);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("name");

      if (error) throw error;

      setDrivers(data || []);
    } catch (err: any) {
      console.error("Error fetching drivers:", err);
      setError(err.message);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      assignment.drivers?.name.toLowerCase().includes(searchLower) ||
      assignment.buses?.registration_no.toLowerCase().includes(searchLower) ||
      format(new Date(assignment.assignment_date), "dd/MM/yyyy").includes(
        searchLower
      )
    );
  });

  const handleAddAssignment = async () => {
    if (!selectedBusId || !selectedDriverId || !selectedDate) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("bus_driver_assignments").insert([
        {
          bus_id: selectedBusId,
          driver_id: selectedDriverId,
          assignment_date: format(selectedDate, "yyyy-MM-dd"),
        },
      ]);

      if (error) throw error;

      await fetchAssignments();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error adding assignment:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAssignment = async () => {
    if (
      !currentAssignment ||
      !selectedBusId ||
      !selectedDriverId ||
      !selectedDate
    )
      return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("bus_driver_assignments")
        .update({
          bus_id: selectedBusId,
          driver_id: selectedDriverId,
          assignment_date: format(selectedDate, "yyyy-MM-dd"),
        })
        .eq("id", currentAssignment.id);

      if (error) throw error;

      await fetchAssignments();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error updating assignment:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!currentAssignment) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("bus_driver_assignments")
        .delete()
        .eq("id", currentAssignment.id);

      if (error) throw error;

      await fetchAssignments();
      setIsDeleteDialogOpen(false);
      setCurrentAssignment(null);
    } catch (err: any) {
      console.error("Error deleting assignment:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedBusId(null);
    setSelectedDriverId(null);
    setSelectedDate(new Date());
    setCurrentAssignment(null);
  };

  const openEditDialog = (assignment: BusDriverAssignment) => {
    setCurrentAssignment(assignment);
    setSelectedBusId(assignment.bus_id);
    setSelectedDriverId(assignment.driver_id);
    setSelectedDate(new Date(assignment.assignment_date));
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (assignment: BusDriverAssignment) => {
    setCurrentAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bus & Driver Assignments
          </h1>
          <p className="text-gray-400">
            Manage your bus and driver assignments.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="bg-gray-800 hover:bg-gray-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      {error && (
        <Alert
          variant="destructive"
          className="bg-red-900 border-red-800 text-red-200"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-800"
          />
        </div>
      </div>

      <div className="rounded-md border bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-900">
              <TableHead className="text-gray-300">#</TableHead>
              <TableHead className="text-gray-300">Bus</TableHead>
              <TableHead className="text-gray-300">Driver Name</TableHead>
              <TableHead className="text-gray-300">Assignment Date</TableHead>
              <TableHead className="w-[100px] text-right text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAssignments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-gray-400"
                >
                  {searchQuery
                    ? "No assignments match your search."
                    : "No assignments found. Add one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAssignments.map((assignment, idx) => (
                <TableRow key={assignment.id} className="hover:bg-gray-800">
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-gray-400" />
                      {assignment.buses?.registration_no}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {assignment.drivers?.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {format(
                        new Date(assignment.assignment_date),
                        "dd/MM/yyyy"
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(assignment)}
                        className="h-8 w-8 text-gray-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDeleteDialog(assignment)}
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Assignment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bus">Bus</Label>
              <Select
                value={selectedBusId?.toString() || ""}
                onValueChange={(value) => setSelectedBusId(Number(value))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select bus" />
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

            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Select
                value={selectedDriverId?.toString() || ""}
                onValueChange={(value) => setSelectedDriverId(Number(value))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Assignment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="bg-gray-800"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAssignment}
              disabled={
                !selectedBusId ||
                !selectedDriverId ||
                !selectedDate ||
                submitting
              }
              className="bg-gray-700 hover:bg-gray-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Assignment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-bus">Bus</Label>
              <Select
                value={selectedBusId?.toString() || ""}
                onValueChange={(value) => setSelectedBusId(Number(value))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select bus" />
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

            <div className="space-y-2">
              <Label htmlFor="edit-driver">Driver</Label>
              <Select
                value={selectedDriverId?.toString() || ""}
                onValueChange={(value) => setSelectedDriverId(Number(value))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Assignment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="bg-gray-800"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditAssignment}
              disabled={
                !selectedBusId ||
                !selectedDriverId ||
                !selectedDate ||
                submitting
              }
              className="bg-gray-700 hover:bg-gray-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Assignment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the assignment for bus "
              {currentAssignment?.buses?.registration_no}" with driver "
              {currentAssignment?.drivers?.name}"?
            </p>
            <p className="text-red-400 mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAssignment}
              disabled={submitting}
              className="bg-red-900 hover:bg-red-800 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Assignment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
