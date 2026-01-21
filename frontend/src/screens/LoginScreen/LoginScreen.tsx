import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../api/client";
import "./LoginScreen.css";
import type { User } from "../../types";

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = Object.fromEntries(new FormData(e.currentTarget));

    try {
      const { data } = await api.post("/login", formData);
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
      <form className="login-card" onSubmit={handleLogin}>
        <p className="login-title">Welcome</p>

        <div className="input-label-component">
          <label>Username</label>
          <input name="username" type="text" required placeholder="Alice" />
        </div>

        <div className="input-label-component">
          <label>Password</label>
          <input
            name="password"
            type="password"
            required
            placeholder="**********"
          />

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="login-error">{error}</p>}
        </div>
      </form>
    </div>
  );
};

export default LoginScreen;
