import { useState } from "react";
import { isAxiosError } from "axios";
import api from "../../api/client";
import "./LoginScreen.css";
import type { User } from "../../types";

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/login", { username, password });
      onLogin(data);
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError(err.response.data.error || "Login failed");
      } else {
        setError("Failed to connect to server");
      }
    } finally {
      setLoading(false);
    }
  };

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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="input-label-component">
          <label>Password</label>

          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="**********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="login-button"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="login-error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
