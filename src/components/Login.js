import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const { data } = await axios.post("https://chatapp-backend-v6a6.onrender.com/auth/login", {
        username,
        password,
      });
      setUser(data);

      // Persist user in localStorage
      localStorage.setItem("user", JSON.stringify(data));
    } catch (error) {
      console.error(error.response?.data?.message || "Error logging in");
      if (!error.response) {
        window.alert(
          "Unable to login. Please check your connection and try again."
        );
        return;
      }
      const status = error.response.status;
      const msg = String(error.response?.data?.message ?? "").toLowerCase();
      const looksLikeWrongPassword =
        status === 401 ||
        status === 403 ||
        msg.includes("password") ||
        msg.includes("incorrect") ||
        msg.includes("invalid credentials") ||
        msg.includes("wrong password");
      if (looksLikeWrongPassword) {
        window.alert("Incorrect password.");
      } else {
        window.alert(
          error.response?.data?.message || "Incorrect password."
        );
      }
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h1>Welcome back</h1>
        <p>Sign in with your username and password.</p>
      </div>
      <div className="auth-card-body">
        <div className="auth-form-group">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            placeholder="Enter your username"
            value={username}
            className="form-control"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="auth-form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            className="form-control"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-auth-primary"
          onClick={handleLogin}
        >
          Sign in
        </button>
        <p className="auth-footer mb-0">
          Not a user yet? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
