import { lazy } from "react";
import { createHashRouter, Navigate } from "react-router-dom";

import Layout from "@/app/Layout";
import { ProtectedRoute } from "@/components/custom/ProtectedRoute";

const AddParcel = lazy(() => import("@/pages/AddParcel"));
const Buses = lazy(() => import("@/pages/Buses"));
const BusDriverAssignments = lazy(() => import("@/pages/BusDriverAssignments"));
const LocalData = lazy(() => import("@/pages/LocalData"));
const Cities = lazy(() => import("@/pages/Cities"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Drivers = lazy(() => import("@/pages/Drivers"));
const EditParcel = lazy(() => import("@/pages/EditParcel"));
const ListParcels = lazy(() => import("@/pages/ListParcels"));
const Login = lazy(() => import("@/pages/Login"));
const PrintParcel = lazy(() => import("@/pages/PrintParcel"));
const Reports = lazy(() => import("@/pages/Reports"));

const router = createHashRouter([
  {
    path: "/auth/login",
    element: <Login />,
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
