import { useState, useEffect, useRef } from "react";
import { Loader2, User, Phone, Receipt, Save } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Database } from "@/lib/supabase/types";
import localDb from "@/db/db";
import AutocompleteInput from "@/components/ui/autocomplete";

// Define types
type City = Database["public"]["Tables"]["cities"]["Row"];
export type BusDriverAssignment =
  Database["public"]["Tables"]["bus_driver_assignments"]["Row"] & {
    buses: { registration_no: string } | null;
    drivers: { name: string } | null;
  };

type ParcelItem = {
  from_city_id: number | null;
  to_city_id: number | null;
  description: string;
  qty: number | null;
  remark: string;
  amount: number | null;
};

export type ParcelFormData = {
  nextBillNo: number;
  parcelDate: Date;
  busDriverAssignment: BusDriverAssignment | null;
  senderName: string;
  senderMobile: string;
  receiverName: string;
  receiverMobile: string;
  parcelItem: ParcelItem;
  amountGiven: number | null;
};

type ParcelFormProps = {
  formData: ParcelFormData;
  setFormData: React.Dispatch<React.SetStateAction<ParcelFormData>>;
  isProcessing?: boolean;
  onSubmit?: VoidFunction;
  actionButton?: string;
};

export default function ParcelForm({
  formData,
  setFormData,
  isProcessing,
  actionButton: buttonText,
  onSubmit,
}: ParcelFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<BusDriverAssignment[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [suggestions, setSuggestions] = useState({
    senderMobile: [],
    receiverMobile: [],
    description: [],
    remark: [],
  });
  const formRef = useRef(document.createElement("div"));

  const amountRemaining =
    (formData.parcelItem.amount || 0) - (formData.amountGiven || 0);

  useEffect(() => {
    fetchBusDriverAssignments();
    fetchCities();
  }, []);

  const fetchBusDriverAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("bus_driver_assignments")
        .select(
          `
            *,
            buses (id, registration_no),
            drivers (id, name)
          `
        )
        .order("assignment_date", { ascending: false });

      if (error) throw error;

      setAssignments(data || []);

      // Set default assignment (first one)
      if (!formData.busDriverAssignment && data && data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          busDriverAssignment: data[0],
        }));
      }
    } catch (err: any) {
      console.error("Error fetching assignments:", err);
      setError(err.message);
    }
  };

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (error) throw error;

      setCities(data || []);

      // Find default FROM and TO cities
      const fromCity =
        formData.parcelItem.from_city_id ||
        data?.find((city) => city.is_default_from)?.id;
      const toCity =
        formData.parcelItem.to_city_id ||
        data?.find((city) => city.is_default_to)?.id;

      // Update the first parcel item with default cities
      if (fromCity || toCity) {
        setFormData((prev) => ({
          ...prev,
          parcelItem: {
            ...prev.parcelItem,
            from_city_id: fromCity || null,
            to_city_id: toCity || null,
          },
        }));
      }
    } catch (err: any) {
      console.error("Error fetching cities:", err);
      setError(err.message);
    }
  };

  const updateParcelItem = (field: keyof ParcelItem, value: any) => {
    if (["description", "remark"].includes(field)) {
      if (typeof value === "string" && value.trim().length >= 1) {
        const searchFn =
          field === "description"
            ? localDb.searchDescriptions
            : localDb.searchRemarks;
        searchFn(value).then((values) => {
          setSuggestions((prev) => ({
            ...prev,
            [field]: values,
          }));
        });
      } else {
        setSuggestions((prev) => ({
          ...prev,
          [field]: [],
        }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      parcelItem: {
        ...prev.parcelItem,
        [field]: value,
      },
    }));
  };

  const handleAmountGivenChange = (value: string) => {
    const amountGiven = parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, amountGiven }));
  };

  const handleMobileNumberChange =
    (field: "senderMobile" | "receiverMobile") => (value: string) => {
      if (value.length >= 3) {
        localDb.searchMobileNos(value).then((matches) => {
          setSuggestions((prev) => ({
            ...prev,
            [field]: matches,
          }));
        });
      } else {
        setSuggestions((prev) => ({
          ...prev,
          [field]: [],
        }));
      }

      if (value.length <= 10) {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
    };

  const handleMobileNumberBlur =
    (field: "senderMobile" | "receiverMobile") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const keyToSet = field === "senderMobile" ? "senderName" : "receiverName";
      if (value.length) {
        localDb.getCustomerNameByMobileNo(value).then((cus) => {
          setFormData((prev) => ({
            ...prev,
            [keyToSet]: cus?.customer_name,
          }));
        });
      }
    };

  const handleSubmit = async () => {
    const {
      busDriverAssignment,
      senderName,
      senderMobile,
      receiverName,
      receiverMobile,
      parcelItem,
    } = formData;

    if (!busDriverAssignment) {
      setError("Please select a bus and driver assignment");
      return;
    }

    if (!senderName || !senderMobile || !receiverName || !receiverMobile) {
      setError("Please fill in all sender and receiver details");
      console.error(
        `Passed details ${JSON.stringify({
          senderName,
          senderMobile,
          receiverName,
          receiverMobile,
        })}`
      );
      return;
    }

    const hasInvalidItems =
      !parcelItem.from_city_id ||
      !parcelItem.to_city_id ||
      !parcelItem.description ||
      (parcelItem.qty || 0) <= 0;

    if (hasInvalidItems) {
      setError("Please fill in all parcel item details");
      return;
    }

    try {
      localDb.addOrUpdateCustomer(senderName, senderMobile);
      localDb.addOrUpdateCustomer(receiverName, receiverMobile);
      localDb.addDescription(parcelItem.description);
      localDb.addRemark(parcelItem.remark);
      onSubmit?.();
    } catch (err: any) {
      console.error("Error adding parcel:", err);
      setError(err.message);
    }
  };

  // Specialized requirement, Tab -> Enter
  const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (e) => {
    if (e.key === "Enter") {
      const formElement = e.target as HTMLElement;
      if (!formElement.dataset.index) return;
      const index = parseInt(formElement.dataset.index);

      const elements = Array.from(
        formRef.current.querySelectorAll("[data-index]")
      ) as HTMLElement[];

      if (elements[index] && index != elements.length) {
        e.preventDefault();
        elements[index - 1]?.blur?.();
        elements[index].focus();

        if (
          elements[index] instanceof HTMLInputElement ||
          elements[index] instanceof HTMLTextAreaElement
        ) {
          elements[index].select?.();
        }
      }
    }
  };

  return (
    <div ref={formRef}>
      {error && (
        <Alert
          variant="destructive"
          className="bg-red-900 border-red-800 text-red-200 mb-2"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="gap-2 mb-4 py-4 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Parcel Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bill Number and Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bill-no">Bill No.</Label>
              <Input
                id="bill-no"
                value={formData.nextBillNo ? `R${formData.nextBillNo}` : ""}
                data-index={1}
                onKeyDown={handleKeyDown}
                readOnly
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="flex items-center gap-6 justify-between">
              <div className="flex-1 space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      data-index={2}
                      onKeyDown={handleKeyDown}
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.parcelDate ? (
                        format(formData.parcelDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                    <CalendarComponent
                      mode="single"
                      selected={formData.parcelDate}
                      onSelect={(parcelDate) =>
                        parcelDate &&
                        setFormData((prev) => ({ ...prev, parcelDate }))
                      }
                      initialFocus
                      className="bg-gray-800"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Bus and Driver Row */}
              <div className="space-y-2">
                <Label htmlFor="bus-driver">Bus & Driver</Label>
                <Select
                  value={formData.busDriverAssignment?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const busDriverAssignment = assignments.find(
                      (a) => a.id === parseInt(value)
                    );
                    if (busDriverAssignment)
                      setFormData((prev) => ({ ...prev, busDriverAssignment }));
                  }}
                >
                  <SelectTrigger
                    data-index={3}
                    onKeyDown={handleKeyDown}
                    className="bg-gray-800 border-gray-700"
                  >
                    <SelectValue placeholder="Select bus & driver" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {assignments.map((assignment) => (
                      <SelectItem
                        key={assignment.id}
                        value={assignment.id.toString()}
                      >
                        {assignment.buses?.registration_no} -{" "}
                        {assignment.drivers?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sender-mobile">
                <Phone className="h-4 w-4 inline mr-1" /> Mokalnar Mobile
              </Label>
              <AutocompleteInput
                id="sender-mobile"
                autoFocus
                type="number"
                value={formData.senderMobile}
                onBlur={handleMobileNumberBlur("senderMobile")}
                onChange={handleMobileNumberChange("senderMobile")}
                data-index={4}
                onKeyDown={handleKeyDown}
                suggestions={suggestions["senderMobile"]}
                placeholder="Enter sender mobile number"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender-name">
                <User className="h-4 w-4 inline mr-1" /> Mokalnar Name
              </Label>
              <Input
                id="sender-name"
                value={formData.senderName}
                data-index={5}
                onKeyDown={handleKeyDown}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    senderName: e.target.value,
                  }))
                }
                placeholder="Enter sender name"
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          {/* Receiver Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="receiver-mobile">
                <Phone className="h-4 w-4 inline mr-1" /> Lenar Mobile
              </Label>
              <AutocompleteInput
                id="receiver-mobile"
                type="number"
                maxLength={10}
                value={formData.receiverMobile}
                onBlur={handleMobileNumberBlur("receiverMobile")}
                onChange={handleMobileNumberChange("receiverMobile")}
                data-index={6}
                onKeyDown={handleKeyDown}
                suggestions={suggestions["receiverMobile"]}
                placeholder="Enter receiver mobile number"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiver-name">
                <User className="h-4 w-4 inline mr-1" /> Lenar Name
              </Label>
              <Input
                id="receiver-name"
                value={formData.receiverName}
                data-index={7}
                onKeyDown={handleKeyDown}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    receiverName: e.target.value,
                  }))
                }
                placeholder="Enter receiver name"
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-2 mb-4 py-4 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Parcel Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-800 ">
            <Table>
              <TableHeader>
                <TableRow className="hover:">
                  <TableHead className="text-gray-300">From</TableHead>
                  <TableHead className="text-gray-300">To</TableHead>
                  <TableHead className="text-gray-300">Description</TableHead>
                  <TableHead className="text-gray-300 w-[80px]">Qty</TableHead>
                  <TableHead className="text-gray-300">Remark</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-gray-800">
                  <TableCell>
                    <Select
                      value={formData.parcelItem.from_city_id?.toString() || ""}
                      onValueChange={(value) =>
                        updateParcelItem("from_city_id", parseInt(value))
                      }
                    >
                      <SelectTrigger
                        className="bg-gray-800 border-gray-700 h-8"
                        data-index={8}
                        onKeyDown={handleKeyDown}
                      >
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={formData.parcelItem.to_city_id?.toString() || ""}
                      onValueChange={(value) =>
                        updateParcelItem("to_city_id", parseInt(value))
                      }
                    >
                      <SelectTrigger
                        className="bg-gray-800 border-gray-700 h-8"
                        data-index={9}
                        onKeyDown={handleKeyDown}
                      >
                        <SelectValue placeholder="To" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <AutocompleteInput
                      type="text"
                      value={formData.parcelItem.description}
                      onChange={(value) =>
                        updateParcelItem("description", value)
                      }
                      data-index={10}
                      onKeyDown={handleKeyDown}
                      suggestions={suggestions["description"]}
                      placeholder="Description"
                      className="bg-gray-800 border-gray-700 h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.parcelItem.qty || ""}
                      onChange={(e) => {
                        let value: string | number = e.target.value;
                        if (value) {
                          value = parseInt(value);
                        }
                        updateParcelItem("qty", value);
                      }}
                      data-index={11}
                      onKeyDown={handleKeyDown}
                      className="bg-gray-800 border-gray-700 h-8"
                      min={1}
                    />
                  </TableCell>
                  <TableCell>
                    <AutocompleteInput
                      type="text"
                      value={formData.parcelItem.remark}
                      onChange={(value) => updateParcelItem("remark", value)}
                      data-index={12}
                      onKeyDown={handleKeyDown}
                      suggestions={suggestions["remark"]}
                      placeholder="Remark"
                      className="bg-gray-800 border-gray-700 h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.parcelItem.amount || ""}
                      onChange={(e) =>
                        updateParcelItem(
                          "amount",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="0"
                      data-index={13}
                      onKeyDown={handleKeyDown}
                      className="bg-gray-800 border-gray-700 h-8"
                      min={0}
                      step={0.01}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-2 mb-4 py-4 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="amount-given">
                <Receipt className="h-4 w-4 inline mr-1" /> Jama Rs.
              </Label>
              <Input
                id="amount-given"
                type="number"
                value={formData.amountGiven || ""}
                onChange={(e) => handleAmountGivenChange(e.target.value)}
                placeholder="0"
                data-index={14}
                onKeyDown={handleKeyDown}
                className="bg-gray-800 border-gray-700"
                min={0}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount-remaining">
                <Receipt className="h-4 w-4 inline mr-1" /> Baki Rs.
              </Label>
              <Input
                id="amount-remaining"
                type="number"
                data-index={15}
                onKeyDown={handleKeyDown}
                value={amountRemaining}
                readOnly
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
        </CardContent>
        {buttonText && (
          <CardFooter className="flex justify-end">
            <Button
              data-index={16}
              onKeyDown={handleKeyDown}
              onClick={handleSubmit}
              disabled={isProcessing}
              className="bg-gray-700 hover:bg-gray-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {buttonText}
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
