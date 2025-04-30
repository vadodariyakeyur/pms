// src/pages/Buses.tsx
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

type Bus = Database["public"]["Tables"]["buses"]["Row"];

export default function Buses() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [registrationNo, setRegistrationNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const filteredBuses = buses.filter((bus) =>
    bus.registration_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBus = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("buses")
        .insert([{ registration_no: registrationNo }]);

      if (error) throw error;

      await fetchBuses();
      setIsAddDialogOpen(false);
      setRegistrationNo("");
    } catch (err: any) {
      console.error("Error adding bus:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBus = async () => {
    if (!currentBus) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("buses")
        .update({ registration_no: registrationNo })
        .eq("id", currentBus.id);

      if (error) throw error;

      await fetchBuses();
      setIsEditDialogOpen(false);
      setCurrentBus(null);
      setRegistrationNo("");
    } catch (err: any) {
      console.error("Error updating bus:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBus = async () => {
    if (!currentBus) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("buses")
        .delete()
        .eq("id", currentBus.id);

      if (error) throw error;

      await fetchBuses();
      setIsDeleteDialogOpen(false);
      setCurrentBus(null);
    } catch (err: any) {
      console.error("Error deleting bus:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (bus: Bus) => {
    setCurrentBus(bus);
    setRegistrationNo(bus.registration_no);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (bus: Bus) => {
    setCurrentBus(bus);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buses</h1>
          <p className="text-gray-400">Manage your bus fleet.</p>
        </div>
        <Button
          onClick={() => {
            setRegistrationNo("");
            setIsAddDialogOpen(true);
          }}
          className="bg-gray-800 hover:bg-gray-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bus
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
            placeholder="Search buses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800"
          />
        </div>
      </div>

      <div className="rounded-md border border-gray-800 bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-900">
              <TableHead className="text-gray-300">#</TableHead>
              <TableHead className="text-gray-300">Registration No</TableHead>
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
            ) : filteredBuses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center py-10 text-gray-400"
                >
                  {searchQuery
                    ? "No buses match your search."
                    : "No buses found. Add one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredBuses.map((bus, idx) => (
                <TableRow key={bus.id} className="hover:bg-gray-800">
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{bus.registration_no}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(bus)}
                        className="h-8 w-8 text-gray-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDeleteDialog(bus)}
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

      {/* Add Bus Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="registration-no">Registration Number</Label>
              <Input
                id="registration-no"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="Enter bus registration number"
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
              onClick={handleAddBus}
              disabled={!registrationNo.trim() || submitting}
              className="bg-gray-700 hover:bg-gray-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Bus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bus Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-registration-no">Registration Number</Label>
              <Input
                id="edit-registration-no"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="Enter bus registration number"
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
              onClick={handleEditBus}
              disabled={!registrationNo.trim() || submitting}
              className="bg-gray-700 hover:bg-gray-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Bus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bus Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Bus</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the bus with registration number "
              {currentBus?.registration_no}"?
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
              onClick={handleDeleteBus}
              disabled={submitting}
              className="bg-red-900 hover:bg-red-800 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Bus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
