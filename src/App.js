import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import { Chat } from "./components/Chat";
import "bootstrap/dist/js/bootstrap.min.js";
import "bootstrap/dist/css/bootstrap.min.css";

const AuthLayout = ({ children }) => (
  <div className="auth-page">
    <div className="auth-page-inner">{children}</div>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if(storedUser){
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <div className={`app-shell${user ? " app-shell--chat" : ""}`}>
      {!user && (
        <header className="auth-brand">
          <span className="auth-brand-mark" aria-hidden="true">
            ◆
          </span>
          <span>Chat App</span>
        </header>
      )}
      {!user ? (
        <Routes>
          <Route
            path="/login"
            element={
              <AuthLayout>
                <Login setUser={setUser} />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Chat user={user} />
      )}
    </div>
  );
};

export default App;
