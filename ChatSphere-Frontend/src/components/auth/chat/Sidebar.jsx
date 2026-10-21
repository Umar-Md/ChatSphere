import { NavLink, useNavigate } from "react-router-dom";
import { usePreferences } from "../../../context/AppPreferences";

function Sidebar() {
  const navigate = useNavigate();
  const { t } = usePreferences();

  const logout = () => {
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition md:justify-start ${
      isActive ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-indigo-50"
    }`;

  return (
    <aside className="w-full shrink-0 bg-white border-b flex items-center app-surface md:w-48 md:border-r md:border-b-0 md:flex-col md:h-full xl:w-64">
      <div className="hidden w-full p-5 border-b md:block">
        <h1 className="text-2xl font-extrabold text-indigo-600">ChatSphere</h1>
        <p className="text-xs text-gray-500">{t("connect")}</p>
      </div>
      <nav className="flex min-w-0 flex-1 gap-1 p-1 text-xs sm:text-sm md:block md:w-full md:space-y-2 md:p-4">
        <NavLink to="/chat" className={linkClass}>💬 {t("chats")}</NavLink>
        <NavLink to="/profile" className={linkClass}>👤 {t("profile")}</NavLink>
        <NavLink to="/settings" className={linkClass}>⚙️ {t("settings")}</NavLink>
      </nav>
      <div className="shrink-0 p-1 md:w-full md:p-4 md:border-t">
        <button onClick={logout} className="w-full px-2 py-3 text-xs sm:text-sm md:px-4 rounded-xl text-red-600 hover:bg-red-50 text-left">
          🚪 {t("logout")}
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
