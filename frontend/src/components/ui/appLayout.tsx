import { Outlet } from "react-router-dom";
import { Navbar } from "./navbar";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default AppLayout;
