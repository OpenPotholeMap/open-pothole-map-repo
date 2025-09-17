import "@/App.css";
import { Route, BrowserRouter as Routers, Routes } from "react-router-dom";
import HomePage from "@/components/pages/home/homePage";
import LoginPage from "@/components/pages/auth/loginPage";
import SignupPage from "@/components/pages/auth/signupPage";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "./context/authContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "./components/ui/appLayout";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routers>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>
            </Routes>
          </Routers>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
