import "./App.css";
import Menu from "./components/Menu/Menu";
import Router from "./navigation/router";
import LoginScreen from "./screens/LoginScreen/LoginScreen";

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
  const isLoggedIn = true;

  return (
    <div className="wrapper">
      {isLoggedIn ? <LoggedInApp /> : <LoginScreen />}
    </div>
  );
};

export default App;
