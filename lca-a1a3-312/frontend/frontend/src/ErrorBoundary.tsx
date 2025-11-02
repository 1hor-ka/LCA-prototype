import React from "react";

/**
 * Catches runtime errors in React tree and renders a readable message
 * instead of showing a blank page.
 */
type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Also log to console for stack traces
    console.error("UI crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h1 style={{ color: "#b91c1c", marginBottom: 8 }}>Something went wrong</h1>
          <pre style={{ background: "#fee2e2", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
            {String(this.state.error)}
          </pre>
          <p>Open DevTools → Console to see the full stack trace.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
