import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Database } from "@/lib/supabase/types";

type Office = Database["public"]["Tables"]["offices"]["Row"];

export default function Offices() {
    const [offices, setOffices] = useState<Office[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentOffice, setCurrentOffice] = useState<Office | null>(null);
    const [officeName, setOfficeName] = useState("");
    const [officeMobile, setOfficeMobile] = useState("");
    const [officeAddress, setOfficeAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchOffices();
    }, []);

    const fetchOffices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("offices")
                .select("*")
                .order("name");

            if (error) throw error;
            setOffices(data || []);
        } catch (err: any) {
            console.error("Error fetching offices:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredOffices = offices.filter((office) =>
        office.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddOffice = async () => {
        setSubmitting(true);
        try {
            const { error } = await supabase.from("offices").insert([
                {
                    name: officeName,
                    mobile_no: officeMobile.trim() || null,
                    address: officeAddress.trim() || null,
                },
            ]);

            if (error) throw error;

            await fetchOffices();
            setIsAddDialogOpen(false);
            resetForm();
        } catch (err: any) {
            console.error("Error adding office:", err);
            if (err.code === "23505") {
                setError("Office name already exists. Please choose a different name.");
            } else {
                setError(err.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditOffice = async () => {
        if (!currentOffice) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("offices")
                .update({
                    name: officeName,
                    mobile_no: officeMobile.trim() || null,
                    address: officeAddress.trim() || null,
                })
                .eq("id", currentOffice.id);

            if (error) throw error;

            await fetchOffices();
            setIsEditDialogOpen(false);
            resetForm();
        } catch (err: any) {
            console.error("Error updating office:", err);
            if (err.code === "23505") {
                setError("Office name already exists. Please choose a different name.");
            } else {
                setError(err.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteOffice = async () => {
        if (!currentOffice) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("offices")
                .delete()
                .eq("id", currentOffice.id);

            if (error) throw error;

            await fetchOffices();
            setIsDeleteDialogOpen(false);
            setCurrentOffice(null);
        } catch (err: any) {
            console.error("Error deleting office:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setOfficeName("");
        setOfficeMobile("");
        setOfficeAddress("");
        setCurrentOffice(null);
    };

    const openEditDialog = (office: Office) => {
        setCurrentOffice(office);
        setOfficeName(office.name);
        setOfficeMobile(office.mobile_no ?? "");
        setOfficeAddress(office.address ?? "");
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (office: Office) => {
        setCurrentOffice(office);
        setIsDeleteDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Offices</h1>
                    <p className="text-muted-foreground">
                        Manage office locations in your system.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsAddDialogOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Office
                </Button>
            </div>

            {error && (
                <Alert
                    variant="destructive"
                >
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search offices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="w-[100px] text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="space-y-2">
{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
</div>
                                </TableCell>
                            </TableRow>
                        ) : filteredOffices.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-10 text-muted-foreground"
                                >
                                    {searchQuery
                                        ? "No offices match your search."
                                        : "No offices found. Add one to get started."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOffices.map((office, idx) => (
                                <TableRow key={office.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>{office.name}</TableCell>
                                    <TableCell>
                                        {office.mobile_no || (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {office.address || (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => openEditDialog(office)}
                                                className="h-8 w-8 text-muted-foreground"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => openDeleteDialog(office)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

            {/* Add Office Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Office</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Office Name</Label>
                            <Input
                                id="name"
                                value={officeName}
                                onChange={(e) => setOfficeName(e.target.value)}
                                placeholder="Enter office name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile Number (optional)</Label>
                            <Input
                                id="mobile"
                                value={officeMobile}
                                onChange={(e) => setOfficeMobile(e.target.value)}
                                placeholder="Enter mobile number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address (optional)</Label>
                            <Input
                                id="address"
                                value={officeAddress}
                                onChange={(e) => setOfficeAddress(e.target.value)}
                                placeholder="Enter address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddOffice}
                            disabled={!officeName.trim() || submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Office"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Office Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Office</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Office Name</Label>
                            <Input
                                id="edit-name"
                                value={officeName}
                                onChange={(e) => setOfficeName(e.target.value)}
                                placeholder="Enter office name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-mobile">Mobile Number (optional)</Label>
                            <Input
                                id="edit-mobile"
                                value={officeMobile}
                                onChange={(e) => setOfficeMobile(e.target.value)}
                                placeholder="Enter mobile number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Address (optional)</Label>
                            <Input
                                id="edit-address"
                                value={officeAddress}
                                onChange={(e) => setOfficeAddress(e.target.value)}
                                placeholder="Enter address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditOffice}
                            disabled={!officeName.trim() || submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Office"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Office Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Office</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            Are you sure you want to delete the office "{currentOffice?.name}"?
                        </p>
                        <p className="text-destructive mt-2">This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteOffice}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Office"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}