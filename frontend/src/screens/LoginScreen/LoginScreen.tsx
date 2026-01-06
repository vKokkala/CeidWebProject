import "./LoginScreen.css";

const LoginScreen = () => {
  return (
    <div className="screen-wrapper">
      <div className="login-card">
        <p className="login-title">Welcome</p>

        <div className="input-label-component">
          <label>Username</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            placeholder="Alice"
          ></input>
        </div>

        <div className="input-label-component">
          <label>Password</label>

          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="**********"
          ></input>

          <button className="login-button"> Login </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
