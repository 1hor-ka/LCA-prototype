import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ping } from "./api";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found in index.html");

// Wake up backend once before rendering the app
async function init() {
  try {
    await ping();
    console.log("✅ Backend API is awake");
  } catch (err) {
    console.warn("⚠️ Failed to wake backend:", err);
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

init();
