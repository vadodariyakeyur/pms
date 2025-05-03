import { useEffect, useState } from "react";
import { Search, Loader2, RefreshCw } from "lucide-react";
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
import customerDB from "@/db/db";
import { Alert, AlertDescription } from "../components/ui/alert";
import { supabase } from "@/lib/supabase/client";
import { Customer } from "@/db/db.types";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerDB.getAllCustomers().then((dbCustomers) => {
      setCustomers(dbCustomers);
    });
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase.rpc("get_latest_customer_contacts");
      if (error) throw error;

      Promise.all(
        (data || []).map((cus) =>
          customerDB.addOrUpdateCustomer(cus.customer_name, cus.mobile_no)
        )
      ).then(() => {
        customerDB.getAllCustomers().then((dbCustomers) => {
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

  const filteredCustomers = customers.filter(
    (cus) =>
      cus.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cus.mobile_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-gray-400">Your Customers List</p>
        </div>
        <Button
          onClick={fetchCustomers}
          className="bg-gray-800 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Customers
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
            placeholder="Search customers/mobile no's..."
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
              <TableHead className="w-[100px] text-right text-gray-300">
                Mobile No.
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
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-gray-400"
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
                  className="hover:bg-gray-800"
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
  );
}
