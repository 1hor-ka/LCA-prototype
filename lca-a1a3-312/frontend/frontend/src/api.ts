// Single-origin API: same domain as the app (served by FastAPI).
const API_BASE = ""; // empty => fetch('/calculate') hits the same origin

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
      const delay = 1500 * Math.pow(2, 4 - retries);
      await new Promise((r) => setTimeout(r, delay));
      retries -= 1;
    }
  }
}

export async function ping(): Promise<void> {
  try { await fetchWithRetry(`${API_BASE}/`, {}, 1, 20000); } catch {}
}

export async function calculate(body: unknown) {
  const res = await fetchWithRetry(`${API_BASE}/calculate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}
