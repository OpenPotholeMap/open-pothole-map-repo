import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./navbar";
import { APIProvider } from "@vis.gl/react-google-maps";

const AppLayout = () => {
  const location = useLocation();
  const isMapPage = location.pathname === "/map";

  return (
    <div
      className={
        isMapPage
          ? "h-screen overflow-hidden bg-background"
          : "min-h-screen bg-background"
      }>
      <APIProvider
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={["places"]}>
        <Navbar />
        <Outlet />
      </APIProvider>
    </div>
  );
};

export default AppLayout;
