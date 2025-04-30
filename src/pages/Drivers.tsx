import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
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
import { Database } from "@/lib/supabase/types";
import { supabase } from "@/lib/supabase/client";

type Driver = Database["public"]["Tables"]["drivers"]["Row"];

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [driverName, setDriverName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDriver = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("drivers")
        .insert([{ name: driverName }]);

      if (error) throw error;

      await fetchDrivers();
      setIsAddDialogOpen(false);
      setDriverName("");
    } catch (err: any) {
      console.error("Error adding driver:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDriver = async () => {
    if (!currentDriver) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("drivers")
        .update({ name: driverName })
        .eq("id", currentDriver.id);

      if (error) throw error;

      await fetchDrivers();
      setIsEditDialogOpen(false);
      setCurrentDriver(null);
      setDriverName("");
    } catch (err: any) {
      console.error("Error updating driver:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!currentDriver) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("drivers")
        .delete()
        .eq("id", currentDriver.id);

      if (error) throw error;

      await fetchDrivers();
      setIsDeleteDialogOpen(false);
      setCurrentDriver(null);
    } catch (err: any) {
      console.error("Error deleting driver:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (driver: Driver) => {
    setCurrentDriver(driver);
    setDriverName(driver.name);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (driver: Driver) => {
    setCurrentDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
          <p className="text-gray-400">Manage your bus drivers.</p>
        </div>
        <Button
          onClick={() => {
            setDriverName("");
            setIsAddDialogOpen(true);
          }}
          className="bg-gray-800 hover:bg-gray-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
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
            placeholder="Search drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800"
          />
        </div>
      </div>

      <div className="rounded-md border border-gray-800 bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="px-4 hover:bg-gray-900">
              <TableHead className="text-gray-300">#</TableHead>
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="w-[100px] text-right text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-10">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDrivers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center py-10 text-gray-400"
                >
                  {searchQuery
                    ? "No drivers match your search."
                    : "No drivers found. Add one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredDrivers.map((driver, idx) => (
                <TableRow key={driver.id} className="hover:bg-gray-800">
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(driver)}
                        className="h-8 w-8 text-gray-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDeleteDialog(driver)}
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

      {/* Add Driver Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Driver Name</Label>
              <Input
                id="name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
                className="bg-gray-800 border-gray-700"
              />
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
              type="submit"
              onClick={handleAddDriver}
              disabled={!driverName.trim() || submitting}
              className="bg-gray-700 hover:bg-gray-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Driver Name</Label>
              <Input
                id="edit-name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
                className="bg-gray-800 border-gray-700"
              />
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
              onClick={handleEditDriver}
              disabled={!driverName.trim() || submitting}
              className="bg-gray-700 hover:bg-gray-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Driver Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the driver "{currentDriver?.name}
              "?
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
              onClick={handleDeleteDriver}
              disabled={submitting}
              className="bg-red-900 hover:bg-red-800 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
