import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerationSuccess, setRegistrationSuccess] = useState(null);

  const handleRegister = async () => {
    try {
      await axios.post("https://chatapp-backend-v6a6.onrender.com/auth/register", {
        username,
        password,
      });

      window.alert("Register successfully. Please login.");
      navigate("/login");
    } catch (error) {
      console.error(error.response?.data?.message || "Error registering user");
      setRegistrationSuccess(
        error.response?.data?.message || "Error registering user"
      );
    } finally {
      setTimeout(() => setRegistrationSuccess(null), 2000);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h1>Create an account</h1>
        <p>Choose a username and password to join.</p>
      </div>
      <div className="auth-card-body">
        <div className="auth-form-group">
          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            placeholder="Pick a username"
            value={username}
            className="form-control"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="auth-form-group">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            className="form-control"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-auth-primary"
          onClick={handleRegister}
        >
          Create account
        </button>
        {registerationSuccess && (
          <p className="auth-error mb-0" role="alert">
            {registerationSuccess}
          </p>
        )}
        <p className="auth-footer mb-0">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
