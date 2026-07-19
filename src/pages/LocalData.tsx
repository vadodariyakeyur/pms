import { useEffect, useState } from "react";
import { Search, Loader2, RefreshCw, UploadIcon } from "lucide-react";
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
import localDB from "@/db/db";
import { Alert, AlertDescription } from "../components/ui/alert";
import { supabase } from "@/lib/supabase/client";
import { Customer } from "@/db/db.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LocalData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [remarks, setRemarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localDB.getAllCustomers().then((dbCustomers) => {
      setCustomers(dbCustomers);
    });
    localDB.getAllDescriptions().then((descriptionList) => {
      setDescriptions(descriptionList);
    });
    localDB.getAllRemark().then((remarkList) => {
      setRemarks(remarkList);
    });
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase.rpc("get_latest_customer_contacts");
      if (error) throw error;

      Promise.all(
        (data || []).map((cus) =>
          localDB.addOrUpdateCustomer(cus.customer_name, cus.mobile_no)
        )
      ).then(() => {
        localDB.getAllCustomers().then((dbCustomers) => {
          setCustomers(dbCustomers);
        });
      });
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDescriptionsAndRemarks = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase.rpc(
        "get_unique_descriptions_and_remarks"
      );
      if (error) throw error;

      Promise.all(
        (data?.["descriptions"] || [])
          .map((desc) => localDB.addDescription(desc))
          .concat(
            (data?.["remarks"] || []).map((remark) => localDB.addRemark(remark))
          )
      );
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (cus) =>
      cus.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cus.mobile_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Data</h1>
          <p className="text-muted-foreground">
            Data stored in your browser for auto completions
          </p>
        </div>
        <Button
          onClick={localDB.exportDB}
        >
          <UploadIcon className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Tabs
        defaultValue="customer"
        className="w-full"
        onSelect={(...event) => console.log(event)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="description">Description & Remark</TabsTrigger>
        </TabsList>

        {error && (
          <Alert
            variant="destructive"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="customer">
          <div className="mt-4 space-y-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers/mobile no's..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={fetchCustomers}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Customers
              </Button>
            </div>

            <div className="max-h-140 overflow-y-auto rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Mobile No.
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-10">
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-10 text-muted-foreground"
                      >
                        {searchQuery
                          ? "No customers match your search."
                          : "No customers found. Click Refresh Customers."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer, idx) => (
                      <TableRow
                        key={customer.mobile_no}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{customer.customer_name}</TableCell>
                        <TableCell>{customer.mobile_no}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="description">
          <div className="mt-4 space-y-6">
            <div className="flex items-center gap-2">
              <Button
                className="ml-auto"
                onClick={fetchDescriptionsAndRemarks}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Descriptions & Remarks
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="max-h-140 overflow-y-auto flex-1 rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>#</TableHead>
                      <TableHead>
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-10">
                          <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      descriptions.map((desc, idx) => (
                        <TableRow
                          key={`${desc}-${idx}`}
                        >
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{desc}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="max-h-140 overflow-y-auto flex-1 rounded-lg border bg-card">
                <Table className="max-h-64 overflow-y-auto">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>#</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="max-h-10 overflow-y-auto">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-10">
                          <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      remarks.map((remark, idx) => (
                        <TableRow
                          key={`${remark}-${idx}`}
                        >
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{remark}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
