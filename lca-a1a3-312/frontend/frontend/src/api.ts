/**
 * API wrapper with retry & timeout to handle Render free-tier cold starts.
 * Backend URL comes from VITE_API_BASE (set in Render Static Site env).
 */
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8000";

async function fetchWithRetry(
  url: string,
  opts: RequestInit = {},
  retries = 4,
  timeoutMs = 90000
): Promise<Response> {
  while (true) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...opts,
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(opts.headers || {}),
        },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (retries <= 0) throw err;
      const delay = 1500 * Math.pow(2, 4 - retries); // 1.5s -> 3s -> 6s -> 12s
      await new Promise((r) => setTimeout(r, delay));
      retries -= 1;
    }
  }
}

/** Call once on app load */
export async function ping(): Promise<void> {
  try {
    await fetchWithRetry(`${API_BASE}/`, {}, 1, 20000);
  } catch {}
}

/** Main calculation call */
export async function calculate(body: any) {
  const res = await fetchWithRetry(`${API_BASE}/calculate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}
