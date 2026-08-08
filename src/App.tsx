import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import router from "@/app/router";
import OfflineBanner from "@/components/custom/OfflineBanner";
import { ThemeContext, useThemeState } from "@/hooks/use-theme";

function App() {
  const theme = useThemeState();

  return (
    <ThemeContext.Provider value={theme}>
      <OfflineBanner />
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" theme={theme.theme} />
    </ThemeContext.Provider>
  );
}

export default App;
