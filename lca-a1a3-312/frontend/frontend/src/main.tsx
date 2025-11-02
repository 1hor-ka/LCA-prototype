import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ping } from "./api";

// Wake up backend before rendering
async function init() {
  try {
    await ping();
    console.log("✅ Backend API is awake");
  } catch (err) {
    console.warn("⚠️ Failed to wake backend:", err);
  }

  const rootElement = document.getElementById("root") as HTMLElement | null;
  if (!rootElement) {
    throw new Error("Root element #root not found in index.html");
  }

  ReactDOM.createRoot(rootElement as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

init();
