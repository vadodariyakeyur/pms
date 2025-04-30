// src/pages/Cities.tsx
import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  ArrowRightLeft,
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
import { Switch } from "@/components/ui/switch";
import { Database } from "@/lib/supabase/types";

type City = Database["public"]["Tables"]["cities"]["Row"];

export default function Cities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [cityName, setCityName] = useState("");
  const [isDefaultFrom, setIsDefaultFrom] = useState(false);
  const [isDefaultTo, setIsDefaultTo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (error) throw error;

      setCities(data || []);
    } catch (err: any) {
      console.error("Error fetching cities:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCity = async () => {
    setSubmitting(true);
    try {
      // If setting as default, clear other defaults first
      if (isDefaultFrom) {
        await supabase
          .from("cities")
          .update({ is_default_from: false })
          .eq("is_default_from", true);
      }

      if (isDefaultTo) {
        await supabase
          .from("cities")
          .update({ is_default_to: false })
          .eq("is_default_to", true);
      }

      const { error } = await supabase.from("cities").insert([
        {
          name: cityName,
          is_default_from: isDefaultFrom,
          is_default_to: isDefaultTo,
        },
      ]);

      if (error) throw error;

      await fetchCities();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error adding city:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCity = async () => {
    if (!currentCity) return;

    setSubmitting(true);
    try {
      // If setting as default, clear other defaults first
      if (isDefaultFrom) {
        await supabase
          .from("cities")
          .update({ is_default_from: false })
          .eq("is_default_from", true)
          .neq("id", currentCity.id);
      }

      if (isDefaultTo) {
        await supabase
          .from("cities")
          .update({ is_default_to: false })
          .eq("is_default_to", true)
          .neq("id", currentCity.id);
      }

      const { error } = await supabase
        .from("cities")
        .update({
          name: cityName,
          is_default_from: isDefaultFrom,
          is_default_to: isDefaultTo,
        })
        .eq("id", currentCity.id);

      if (error) throw error;

      await fetchCities();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error updating city:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCity = async () => {
    if (!currentCity) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("cities")
        .delete()
        .eq("id", currentCity.id);

      if (error) throw error;

      await fetchCities();
      setIsDeleteDialogOpen(false);
      setCurrentCity(null);
    } catch (err: any) {
      console.error("Error deleting city:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCityName("");
    setIsDefaultFrom(false);
    setIsDefaultTo(false);
    setCurrentCity(null);
  };

  const openEditDialog = (city: City) => {
    setCurrentCity(city);
    setCityName(city.name);
    setIsDefaultFrom(city.is_default_from || false);
    setIsDefaultTo(city.is_default_to || false);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (city: City) => {
    setCurrentCity(city);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cities</h1>
          <p className="text-gray-400">
            Manage your cities and default locations.
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
          Add City
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
            placeholder="Search cities..."
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
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="text-gray-300">Default From</TableHead>
              <TableHead className="text-gray-300">Default To</TableHead>
              <TableHead className="w-[100px] text-right text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCities.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-gray-400"
                >
                  {searchQuery
                    ? "No cities match your search."
                    : "No cities found. Add one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCities.map((city, idx) => (
                <TableRow key={city.id} className="hover:bg-gray-800">
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{city.name}</TableCell>
                  <TableCell>
                    {city.is_default_from ? (
                      <span className="inline-flex items-center rounded-full bg-green-900/20 px-2 py-1 text-xs font-medium text-green-400">
                        Default
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {city.is_default_to ? (
                      <span className="inline-flex items-center rounded-full bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-400">
                        Default
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(city)}
                        className="h-8 w-8 text-gray-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDeleteDialog(city)}
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

      {/* Add City Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">City Name</Label>
              <Input
                id="name"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Enter city name"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="default-from" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Set as Default FROM City
              </Label>
              <Switch
                id="default-from"
                checked={isDefaultFrom}
                onCheckedChange={setIsDefaultFrom}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="default-to" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Set as Default TO City
              </Label>
              <Switch
                id="default-to"
                checked={isDefaultTo}
                onCheckedChange={setIsDefaultTo}
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
              onClick={handleAddCity}
              disabled={!cityName.trim() || submitting}
              className="bg-gray-700 hover:bg-gray-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add City"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit City Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">City Name</Label>
              <Input
                id="edit-name"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Enter city name"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="edit-default-from"
                className="flex items-center gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Set as Default FROM City
              </Label>
              <Switch
                id="edit-default-from"
                checked={isDefaultFrom}
                onCheckedChange={setIsDefaultFrom}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="edit-default-to"
                className="flex items-center gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Set as Default TO City
              </Label>
              <Switch
                id="edit-default-to"
                checked={isDefaultTo}
                onCheckedChange={setIsDefaultTo}
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
              onClick={handleEditCity}
              disabled={!cityName.trim() || submitting}
              className="bg-gray-700 hover:bg-gray-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update City"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete City Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete City</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the city "{currentCity?.name}"?
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
              onClick={handleDeleteCity}
              disabled={submitting}
              className="bg-red-900 hover:bg-red-800 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete City"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
