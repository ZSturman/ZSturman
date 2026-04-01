// WakaTime data-fetching layer.
// Fetches coding activity stats from the WakaTime API.
// Gracefully returns null if the API key is missing or the request fails.

const WAKATIME_API_BASE = "https://wakatime.com/api/v1";

/**
 * Fetch WakaTime stats for the given time range.
 * @param {"last_7_days"|"last_30_days"|"last_6_months"|"last_year"} range
 * @returns {object|null} stats data or null on failure
 */
async function fetchWakaTimeStats(range = "last_7_days") {
  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) {
    console.log("WakaTime skipped — no WAKATIME_API_KEY");
    return null;
  }

  try {
    const auth = Buffer.from(apiKey + ":").toString("base64");
    const url = `${WAKATIME_API_BASE}/users/current/stats/${range}`;
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.ok) {
      console.warn(`WakaTime API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    return json.data || null;
  } catch (err) {
    console.warn(`WakaTime fetch failed: ${err.message}`);
    return null;
  }
}

module.exports = { fetchWakaTimeStats };
