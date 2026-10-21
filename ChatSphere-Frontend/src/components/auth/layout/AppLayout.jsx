import { Outlet } from "react-router-dom";
import Sidebar from "../chat/Sidebar";

function AppLayout() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-gray-100 md:flex-row">

      {/* Sidebar stays on every page */}
      <Sidebar />

      {/* Only this section changes */}
      <main className="min-h-0 min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>

    </div>
  );
}

export default AppLayout;