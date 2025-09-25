import { Outlet } from "react-router-dom";
import { Navbar } from "./navbar";
import { APIProvider } from "@vis.gl/react-google-maps";

const AppLayout = () => {
  return (
    <div className="h-screen overflow-hidden bg-background">
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
