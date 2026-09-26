import { useState } from "react";
import { Loader2, RotateCcw, Download, Upload, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { supabase } from "@/lib/supabase/client";
import {
    exportAllTablesToZip,
    restoreFromZip,
    failedRowsToCsv,
    type RestoreSummary,
    type RestoreRowError,
} from "@/lib/backupRestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Settings() {
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupProgress, setBackupProgress] = useState<string | null>(null);
    const [backupFrom, setBackupFrom] = useState<Date | undefined>();
    const [backupTo, setBackupTo] = useState<Date | undefined>();

    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [restorePassword, setRestorePassword] = useState("");
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreProgress, setRestoreProgress] = useState<string | null>(null);
    const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);
    const [restoreErrors, setRestoreErrors] = useState<RestoreRowError[]>([]);

    const handleResetBillNo = async () => {
        setSubmitting(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user?.email) throw new Error("Not logged in.");

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password,
            });
            if (authError) throw new Error("Incorrect password.");

            const { error } = await supabase.rpc("reset_bill_no");

            if (error) throw error;

            setSuccess("Bill number has been reset. The next parcel will be R1.");
            setIsResetDialogOpen(false);
            setPassword("");
        } catch (err: any) {
            console.error("Error resetting bill number:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        setError(null);
        setSuccess(null);
        try {
            const blob = await exportAllTablesToZip(
                (table, done, total) => {
                    setBackupProgress(`Exporting ${table}: ${done} / ${total}`);
                },
                backupFrom && backupTo
                    ? {
                          from: format(backupFrom, "yyyy-MM-dd"),
                          to: format(backupTo, "yyyy-MM-dd"),
                      }
                    : undefined
            );
            downloadBlob(blob, `backup-${format(new Date(), "yyyy-MM-dd")}.zip`);
            setSuccess("Backup downloaded.");
        } catch (err: any) {
            console.error("Error creating backup:", err);
            setError(err.message);
        } finally {
            setIsBackingUp(false);
            setBackupProgress(null);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile) return;
        setIsRestoring(true);
        setError(null);
        setRestoreSummary(null);
        setRestoreErrors([]);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user?.email) throw new Error("Not logged in.");

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: restorePassword,
            });
            if (authError) throw new Error("Incorrect password.");

            const { summary, errors } = await restoreFromZip(
                restoreFile,
                (table, done, total) => {
                    setRestoreProgress(`Restoring ${table}: ${done} / ${total}`);
                }
            );
            setRestoreSummary(summary);
            setRestoreErrors(errors);
            setRestorePassword("");
        } catch (err: any) {
            console.error("Error restoring backup:", err);
            setError(err.message);
        } finally {
            setIsRestoring(false);
            setRestoreProgress(null);
        }
    };

    const handleDownloadFailedRows = () => {
        const csv = failedRowsToCsv(restoreErrors);
        downloadBlob(
            new Blob([csv], { type: "text/csv" }),
            `restore-failures-${format(new Date(), "yyyy-MM-dd")}.csv`
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage system-wide settings.
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <div className="rounded-lg border bg-card p-6 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Bill Number</h2>
                    <p className="text-muted-foreground text-sm">
                        Restart bill numbering from R1. Existing parcels keep their
                        current bill numbers and may end up with duplicates after
                        reset.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => {
                        setError(null);
                        setSuccess(null);
                        setIsResetDialogOpen(true);
                    }}
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset Bill Number to 1
                </Button>
            </div>

            <div className="rounded-lg border bg-card p-6 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Backup & Restore</h2>
                    <p className="text-muted-foreground text-sm">
                        Download a full backup of all data as a zip of CSV files, or
                        restore data from a previously downloaded backup. Optionally
                        limit parcels to a date range; all other tables are always
                        backed up in full.
                    </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-2">
                        <Label htmlFor="backup-from">Parcels from</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="backup-from"
                                    variant="outline"
                                    className="w-[240px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {backupFrom ? (
                                        format(backupFrom, "PPP")
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Pick start date
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={backupFrom}
                                    onSelect={setBackupFrom}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="backup-to">Parcels to</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="backup-to"
                                    variant="outline"
                                    className="w-[240px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {backupTo ? (
                                        format(backupTo, "PPP")
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Pick end date
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={backupTo}
                                    onSelect={setBackupTo}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    {(backupFrom || backupTo) && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setBackupFrom(undefined);
                                setBackupTo(undefined);
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleBackup} disabled={isBackingUp}>
                        {isBackingUp ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {backupProgress ?? "Exporting..."}
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Download Backup
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setError(null);
                            setSuccess(null);
                            setRestoreSummary(null);
                            setRestoreErrors([]);
                            setIsRestoreDialogOpen(true);
                        }}
                    >
                        <Upload className="h-4 w-4" />
                        Restore from Backup
                    </Button>
                </div>
            </div>

            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reset Bill Number</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            This will restart bill numbering from R1. Existing parcels
                            and their bill numbers are unaffected and may be duplicated
                            after this reset.
                        </p>
                        <p className="text-destructive mt-2">
                            This action cannot be undone.
                        </p>
                        <div className="space-y-1.5 mt-4">
                            <Label htmlFor="confirm-password">
                                Confirm your password
                            </Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsResetDialogOpen(false);
                                setPassword("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetBillNo}
                            disabled={submitting || !password}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Reset Bill Number"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isRestoreDialogOpen}
                onOpenChange={(open) => {
                    setIsRestoreDialogOpen(open);
                    if (!open) {
                        setRestoreFile(null);
                        setRestorePassword("");
                        setRestoreSummary(null);
                        setRestoreErrors([]);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Restore from Backup</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p>
                            Upload a backup zip file. Matching records will be updated
                            with the values from the backup; records not present in the
                            backup are left unchanged.
                        </p>
                        <p className="text-destructive">
                            This action cannot be undone.
                        </p>
                        <div className="space-y-1.5">
                            <Label htmlFor="restore-file">Backup file</Label>
                            <Input
                                id="restore-file"
                                type="file"
                                accept=".zip"
                                onChange={(e) =>
                                    setRestoreFile(e.target.files?.[0] ?? null)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="restore-password">
                                Confirm your password
                            </Label>
                            <Input
                                id="restore-password"
                                type="password"
                                value={restorePassword}
                                onChange={(e) => setRestorePassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        {isRestoring && restoreProgress && (
                            <p className="text-muted-foreground text-sm">
                                {restoreProgress}
                            </p>
                        )}
                        {restoreSummary && (
                            <div className="space-y-1 text-sm">
                                {restoreSummary.map((s) => (
                                    <p key={s.table}>
                                        {s.table}: {s.restored} restored
                                        {s.failed > 0 ? `, ${s.failed} failed` : ""}
                                    </p>
                                ))}
                                {restoreErrors.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadFailedRows}
                                    >
                                        Download failed rows ({restoreErrors.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRestoreDialogOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRestore}
                            disabled={isRestoring || !restoreFile || !restorePassword}
                        >
                            {isRestoring ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                "Restore"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
