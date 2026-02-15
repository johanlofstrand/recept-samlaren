import { onRequest } from "firebase-functions/v2/https";

const DAILY_LIMIT = 50;
let callCount = 0;
let lastReset = Date.now();

function checkRateLimit(): boolean {
  const now = Date.now();
  // Reset counter every 24 hours
  if (now - lastReset > 24 * 60 * 60 * 1000) {
    callCount = 0;
    lastReset = now;
  }
  callCount++;
  return callCount <= DAILY_LIMIT;
}

export const fetchRecipePage = onRequest({
  region: "europe-west1",
  memory: "128MiB",
  timeoutSeconds: 15,
  maxInstances: 1,
  cors: true,
}, async (request, response) => {
  if (!checkRateLimit()) {
    response.status(429).json({ error: "Daglig gräns nådd. Försök igen imorgon." });
    return;
  }

  const url = request.query.url as string | undefined;

  if (!url) {
    response.status(400).json({ error: "Missing url parameter" });
    return;
  }

  try {
    new URL(url);
  } catch {
    response.status(400).json({ error: "Invalid URL" });
    return;
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      response.status(502).json({ error: `Upstream returned ${res.status}` });
      return;
    }

    const html = await res.text();
    response.json({ contents: html });
  } catch {
    response.status(502).json({ error: "Failed to fetch the page" });
  }
});
