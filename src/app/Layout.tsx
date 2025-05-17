import { Suspense, useEffect } from "react";
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
  Contact,
  Loader2,
} from "lucide-react";
import router from "@/app/router";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    link: "/dashboard",
    Icon: LayoutDashboard,
  },
  {
    title: "Drivers",
    link: "/drivers",
    Icon: Users,
  },
  {
    title: "Cities",
    link: "/cities",
    Icon: Building,
  },
  {
    title: "Buses",
    link: "/buses",
    Icon: Bus,
  },
  {
    title: "Bus & Driver",
    link: "/assignments",
    Icon: LinkIcon,
  },
  {
    title: "Add Parcel",
    link: "/parcels/add",
    Icon: PackagePlus,
  },
  {
    title: "View Parcels",
    link: "/parcels",
    Icon: Package,
  },
  {
    title: "Reports",
    link: "/reports",
    Icon: FileText,
  },
  {
    title: "Customers",
    link: "/customers",
    Icon: Contact,
  },
];

export default function Layout() {
  const location = useLocation();

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
            {menuItems.map(({ title, link, Icon }) => (
              <Link
                to={link}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition",
                  location.pathname === link && "bg-gray-800"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {title}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="flex items-center justify-between px-6 h-16">
            <h1 className="text-lg font-medium">Shree Nathji Travels</h1>
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
          <Suspense fallback={<Loader2 />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
