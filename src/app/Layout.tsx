import { Suspense, useEffect, useState } from "react";
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
  Database,
  Boxes,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import router from "@/app/router";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Database as DatabaseType } from "@/lib/supabase/types";
import { OfficeContext } from "@/hooks/use-office";

const menuGroups = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", link: "/dashboard", Icon: LayoutDashboard },
      { title: "Add Parcel", link: "/parcels/add", Icon: PackagePlus },
      { title: "View Parcels", link: "/parcels", Icon: Package },
      { title: "Reports", link: "/reports", Icon: FileText },
    ],
  },
  {
    label: "Master Data",
    items: [
      { title: "Drivers", link: "/drivers", Icon: Users },
      { title: "Buses", link: "/buses", Icon: Bus },
      { title: "Cities", link: "/cities", Icon: Building },
      { title: "Offices", link: "/offices", Icon: MapPinned },
      { title: "Bus & Driver", link: "/assignments", Icon: LinkIcon },
    ],
  },
  {
    label: "System",
    items: [{ title: "Local Data", link: "/local-data", Icon: Database }],
  },
];

type Office = DatabaseType["public"]["Tables"]["offices"]["Row"];

export default function Layout() {
  const location = useLocation();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.navigate("/auth/login");
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-1 py-1.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-4" />
            </div>
            <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">PMS</span>
              <span className="text-xs text-sidebar-foreground/70">
                Parcel Management
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {menuGroups.map(({ label, items }) => (
            <SidebarGroup key={label}>
              <SidebarGroupLabel>{label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(({ title, link, Icon }) => (
                    <SidebarMenuItem key={link}>
                      <SidebarMenuButton
                        asChild
                        tooltip={title}
                        isActive={location.pathname === link}
                      >
                        <Link to={link}>
                          <Icon />
                          <span>{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="h-svh overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-1 !h-5" />
            <h1 className="text-sm font-semibold sm:text-base">
              Pramukhraj Travels &amp; Cargo
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedOffice?.id.toString()}
              onValueChange={handleOfficeChange}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select Office" />
              </SelectTrigger>
              <SelectContent>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id.toString()}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Suspense
              key={location.pathname}
              fallback={
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              }
            >
              {selectedOffice ? (
                <OfficeContext.Provider value={selectedOffice}>
                  <Outlet />
                </OfficeContext.Provider>
              ) : (
                <p className="py-24 text-center text-muted-foreground">
                  Please select the office you are operating from.
                </p>
              )}
            </Suspense>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
