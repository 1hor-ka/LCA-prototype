import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ping } from "./api";

// Wake up backend before mounting the app (helps with Render cold starts)
async function bootstrap() {
  try {
    await ping();
    // console.log("Backend is awake");
  } catch {
    // ignore warm-up errors
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("Root element #root not found in index.html");

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
