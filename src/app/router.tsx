import { createHashRouter, Navigate } from "react-router-dom";

import Layout from "@/app/Layout";
import Login from "@/pages/Login";
import { ProtectedRoute } from "@/components/custom/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Drivers from "@/pages/Drivers";
import Cities from "@/pages/Cities";
import Buses from "@/pages/Buses";
import BusDriverAssignments from "@/pages/BusDriverAssignments";
import AddParcel from "@/pages/AddParcel";
import PrintParcel from "@/pages/PrintParcel";
import ListParcels from "@/pages/ListParcels";
import Reports from "@/pages/Reports";
import EditParcel from "@/pages/EditParcel";

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
        index: true,
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
      //   {
      //     path: "add-parcel",
      //     element: <AddParcel />,
      //   },
      //   {
      //     path: "view-parcels",
      //     element: <ViewParcels />,
      //   },
      //   {
      //     path: "report",
      //     element: <Report />,
      //   },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" />,
  },
]);

export default router;
