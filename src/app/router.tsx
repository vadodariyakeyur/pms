import { lazy } from "react";
import { createHashRouter, Navigate } from "react-router-dom";

import Layout from "@/app/Layout";
import { ProtectedRoute } from "@/components/custom/ProtectedRoute";

const load = {
  AddParcel: () => import("@/pages/AddParcel"),
  Buses: () => import("@/pages/Buses"),
  BusDriverAssignments: () => import("@/pages/BusDriverAssignments"),
  LocalData: () => import("@/pages/LocalData"),
  Cities: () => import("@/pages/Cities"),
  Dashboard: () => import("@/pages/Dashboard"),
  Drivers: () => import("@/pages/Drivers"),
  EditParcel: () => import("@/pages/EditParcel"),
  ListParcels: () => import("@/pages/ListParcels"),
  Login: () => import("@/pages/Login"),
  Offices: () => import("@/pages/Offices"),
  PrintParcel: () => import("@/pages/PrintParcel"),
  Reports: () => import("@/pages/Reports"),
  ViewReciept: () => import("@/pages/ViewReciept"),
};

/** Warm every route chunk once the browser is idle, so navigation is instant. */
export function prefetchPages() {
  const run = () => Object.values(load).forEach((f) => void f().catch(() => {}));
  if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 2000); // Safari < 17 has no requestIdleCallback
}

const AddParcel = lazy(load.AddParcel);
const Buses = lazy(load.Buses);
const BusDriverAssignments = lazy(load.BusDriverAssignments);
const LocalData = lazy(load.LocalData);
const Cities = lazy(load.Cities);
const Dashboard = lazy(load.Dashboard);
const Drivers = lazy(load.Drivers);
const EditParcel = lazy(load.EditParcel);
const ListParcels = lazy(load.ListParcels);
const Login = lazy(load.Login);
const Offices = lazy(load.Offices);
const PrintParcel = lazy(load.PrintParcel);
const Reports = lazy(load.Reports);
const ViewReciept = lazy(load.ViewReciept);

const router = createHashRouter([
  {
    path: "/auth/login",
    element: <Login />,
  },
  {
    path: "/reciept/:billNo",
    element: <ViewReciept />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <Navigate to="/dashboard" />,
        index: true,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "drivers",
        element: <Drivers />,
      },
      {
        path: "cities",
        element: <Cities />,
      },
      {
        path: "offices",
        element: <Offices />,
      },
      {
        path: "buses",
        element: <Buses />,
      },
      {
        path: "assignments",
        element: <BusDriverAssignments />,
      },
      {
        path: "parcels/add",
        element: <AddParcel />,
      },
      {
        path: "/parcel/:billNo/edit",
        element: <EditParcel />,
      },
      {
        path: "/parcel/:billNo/print",
        element: <PrintParcel />,
      },
      {
        path: "/parcels",
        element: <ListParcels />,
      },
      {
        path: "/reports",
        element: <Reports />,
      },
      {
        path: "/local-data",
        element: <LocalData />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" />,
  },
]);

export default router;
