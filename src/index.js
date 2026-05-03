import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { UnreadMessagesProvider  } from './contexts/UnreadMessagesContext'

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <UnreadMessagesProvider  >
      <App />
      </UnreadMessagesProvider>
    </BrowserRouter>
  </React.StrictMode>
);
