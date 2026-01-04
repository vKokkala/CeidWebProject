import "./App.css";
import Menu from "./components/Menu/Menu";
import Router from "./navigation/Router";

function App() {
  return (
    <div className="wrapper">
      <div className="menu-wrapper">
        <Menu />
      </div>

      <div className="main-screen-wrapper ">
        <Router />
      </div>
    </div>
  );
}

export default App;
