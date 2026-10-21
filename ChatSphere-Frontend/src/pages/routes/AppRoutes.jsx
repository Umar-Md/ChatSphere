import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "../Login";
import Register from "../Register";

import Chat from "../Chat";
import Profile from "../Profile";
import Settings from "../Settings";

import ProtectedRoute from "../../components/auth/ProtectedRoute";
import PublicRoute from "../../components/auth/PublicRoute";

import AppLayout from "../../components/auth/layout/AppLayout";


function AppRoutes() {

  return (
    <Routes>

      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/login" />}
      />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Application */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/chat"
          element={<Chat />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

      </Route>

    </Routes>
  );
}

export default AppRoutes;