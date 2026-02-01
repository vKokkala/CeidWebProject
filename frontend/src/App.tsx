import "./App.css";
import Menu from "./components/Menu/Menu";
import Router from "./navigation/router";
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { User } from "./types";
import { useLocation, useNavigate, useRoutes } from "react-router";
import { useEffect } from "react";
import AnnouncementsScreen from "./screens/AnnouncementsScreen/AnnouncementsScreen";

export type LoggedInAppProps = {
  user: User;
  logout: () => void;
};

const LoggedInApp = ({ user, logout }: LoggedInAppProps) => {
  return (
    <>
      <div className="menu-wrapper">
        <Menu userRole={user.role} onLogout={logout} />
      </div>

      <div className="main-screen-wrapper">
        <Router />
      </div>
    </>
  );
};

const AppContent = () => {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  
  if (location.pathname === "/announcements") {
    return (
      <div className="wrapper">
        <AnnouncementsScreen />
      </div>
    );
  }

  return (
    <div className="wrapper">
      {user ? (
        <LoggedInApp user={user} logout={logout} />
      ) : (
        <LoginScreen onLogin={login} />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
