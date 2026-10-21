import { Link, Outlet } from "react-router-dom";

function Dashboard() {
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-indigo-600 text-white p-5">
        <h1 className="text-2xl font-bold mb-10">
          Chatsphere
        </h1>

        <nav className="space-y-4">
          <Link
            to="/dashboard/profile"
            className="block hover:bg-indigo-700 p-2 rounded"
          >
            👤 Profile
          </Link>

          <Link
            to="/dashboard/settings"
            className="block hover:bg-indigo-700 p-2 rounded"
          >
            ⚙️ Settings
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="flex-1 bg-gray-100 p-10">
        <Outlet />
      </div>
    </div>
  );
}

export default Dashboard;