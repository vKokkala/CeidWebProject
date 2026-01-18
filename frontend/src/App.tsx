import { useState } from "react";
import "./App.css";
import Menu from "./components/Menu/Menu";
import Router from "./navigation/router";
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import type { User } from "./types";

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

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  return (
    <div className="wrapper">
      {user ? <LoggedInApp /> : <LoginScreen onLogin={handleLogin} />}
    </div>
  );
};

export default App;
