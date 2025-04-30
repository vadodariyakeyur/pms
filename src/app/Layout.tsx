import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Building,
  Bus,
  Link as LinkIcon,
  PackagePlus,
  Package,
  FileText,
} from "lucide-react";
import router from "@/app/router";
import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.navigate("/login");
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.navigate("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.navigate("/auth/login");
  };

  return (
    <div className="flex h-screen bg-black text-gray-100">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <div className="text-xl font-bold">PMS Inc.</div>
        </div>

        {/* Menu Items */}
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link
              to="/drivers"
              className="flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              <Users className="h-4 w-4 mr-2" />
              Drivers
            </Link>
            <Link
              to="/cities"
              className="flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              <Building className="h-4 w-4 mr-2" />
              Cities
            </Link>
            <Link
              to="/buses"
              className="flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              <Bus className="h-4 w-4 mr-2" />
              Buses
            </Link>
            <Link
              to="/assignments"
              className="flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Bus & Driver
            </Link>
            <Link
              to="/parcels/add"
              className="flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              <PackagePlus className="h-4 w-4 mr-2" />
              Add Parcel
            </Link>
            <Link
              to="/parcels"
              className="flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              <Package className="h-4 w-4 mr-2" />
              View Parcels
            </Link>
            <Link
              to="/reports"
              className="flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="flex items-center justify-between px-6 h-16">
            <h1 className="text-lg font-medium">Shree Pramukhraj Travels</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-300 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
