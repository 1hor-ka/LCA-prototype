import { Suspense, lazy } from "react";
import ErrorBoundary from "./ErrorBoundary";

// Keep heavy app code in a separate module to avoid hard crashes.
const AppInner = lazy(() => import("./AppInner"));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <AppInner />
      </Suspense>
    </ErrorBoundary>
  );
}
