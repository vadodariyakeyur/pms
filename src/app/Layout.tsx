import { Suspense, useEffect, useRef, useState } from "react";
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
  ChevronRight,
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
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navbarHoverRef = useRef<NodeJS.Timeout>(null);

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

  const onMouseEnter = () => {
    if (navbarHoverRef.current) clearTimeout(navbarHoverRef.current);
    navbarHoverRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 300);
  };

  const onMouseLeave = () => {
    if (navbarHoverRef.current) clearTimeout(navbarHoverRef.current);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.navigate("/auth/login");
  };

  return (
    <div className="flex h-screen bg-black text-gray-100">
      {/* Sidebar */}
      <div
        className={cn(
          "transition-all border-r border-gray-800",
          isOpen ? "w-64" : "w-22"
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <div className="text-xl font-bold">PMS</div>
        </div>

        {/* Menu Items */}
        <nav className="mt-6 relative">
          <ChevronRight
            className={cn(
              "transition-all cursor-pointer absolute -right-3 top-2 h-6 w-6 bg-gray-800 rounded-full p-1 border border-gray-600",
              isOpen && "rotate-180"
            )}
            onClick={() => setIsOpen((prev) => !prev)}
          />
          <div className="px-4 space-y-2">
            {menuItems.map(({ title, link, Icon }, idx) => (
              <Link
                key={`${title}-${link}-${idx}`}
                to={link}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition",
                  location.pathname === link && "bg-gray-800"
                )}
              >
                <Icon className={cn("h-5 w-5", isOpen && "mr-2")} />
                <div
                  className={cn(
                    "whitespace-nowrap transition-all",
                    isOpen ? "w-fit" : "w-0 overflow-hidden"
                  )}
                >
                  {title}
                </div>
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
        <main className="flex-1 overflow-auto bg-gray-950 p-5">
          <Suspense
            key={location.pathname}
            fallback={
              <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin w-12 h-12" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
