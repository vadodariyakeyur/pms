import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import router from "@/app/router";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" theme="dark" />
    </>
  );
}

export default App;
