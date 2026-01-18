import "./App.css";
import Menu from "./components/Menu/Menu";
import Router from "./navigation/router";
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";

const LoggedInApp = () => {
  return (
    <>
      <div className="menu-wrapper">
        <Menu />
      </div>

      <div className="main-screen-wrapper ">
        <Router />
      </div>
    </>
  );
};

const AppContent = () => {
  const { user, login } = useAuth();

  return (
    <div className="wrapper">
      {user ? <LoggedInApp /> : <LoginScreen onLogin={login} />}
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
