import { Suspense, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Building,
  Bus,
  MapPinned,
  Link as LinkIcon,
  PackagePlus,
  Package,
  FileText,
  Loader2,
  ChevronRight,
  Database,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import router from "@/app/router";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Database as DatabaseType } from "@/lib/supabase/types";
import { OfficeContext } from "@/hooks/use-office";

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
    title: "Offices",
    link: "/offices",
    Icon: MapPinned,
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
    title: "Local Data",
    link: "/local-data",
    Icon: Database,
  },
];

type Office = DatabaseType["public"]["Tables"]["offices"]["Row"];

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navbarHoverRef = useRef<NodeJS.Timeout>(null);

  // Office dropdown state
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<Office>();

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      const { data, error } = await supabase
        .from("offices")
        .select("*")
        .order("name");

      if (error) throw error;

      const officeList = data || [];
      setOffices(officeList);

      // Set default office if none is selected
      const savedOfficeId = localStorage.getItem("selectedOfficeId");
      if (
        (!savedOfficeId && officeList.length > 0) ||
        (savedOfficeId && officeList.length > 0 && !officeList.some(ofc => ofc.id.toString() == savedOfficeId))
      ) {
        const firstOffice = officeList[0];
        setSelectedOffice(firstOffice);
        localStorage.setItem("selectedOfficeId", firstOffice.id.toString());
      } else if (savedOfficeId) {
        setSelectedOffice(officeList.find(ofc => ofc.id.toString() == savedOfficeId));
      }
    } catch (err) {
      console.error("Error fetching offices:", err);
    }
  };

  const handleOfficeChange = (officeId: string) => {
    setSelectedOffice(offices.find(ofc => ofc.id.toString() == officeId));
    localStorage.setItem("selectedOfficeId", officeId);
  };

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
            <h1 className="text-lg font-medium">Pramukhraj Travels & Cargo</h1>
            <div className="flex items-center gap-4">
              {/* Office Dropdown */}
              <Select value={selectedOffice?.id.toString()} onValueChange={handleOfficeChange}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue placeholder="Select Office" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {offices.map((office) => (
                    <SelectItem
                      key={office.id}
                      value={office.id.toString()}
                      className="text-gray-300 hover:bg-gray-700"
                    >
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {selectedOffice ? (
              <OfficeContext.Provider value={selectedOffice}>
                <Outlet />
              </OfficeContext.Provider>
            ) : "Please select Office you are operating from"}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
