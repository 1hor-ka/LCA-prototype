/**
 * Simple API wrapper for the backend LCA endpoint.
 * Adjust API_BASE if your backend runs elsewhere.
 */
const API_BASE = "http://127.0.0.1:8000";

export async function calculate(body: any) {
  const res = await fetch(`${API_BASE}/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  return res.json();
}
