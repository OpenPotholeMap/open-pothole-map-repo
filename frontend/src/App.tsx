import "@/App.css";
import { Route, BrowserRouter as Routers, Routes } from "react-router-dom";
import HomePage from "@/components/pages/home/homePage";
import LoginPage from "@/components/pages/auth/loginPage";
import SignupPage from "@/components/pages/auth/signupPage";
import { ThemeProvider } from "@/context/theme";
import { AuthProvider } from "@/context/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "@/components/ui/appLayout";
import MapPage from "@/components/pages/map/mapPage";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <Routers>
          <AuthProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/map" element={<MapPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </Routers>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
