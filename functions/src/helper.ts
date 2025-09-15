import tzLookup from "tz-lookup";

/**
 * Openweather helper.
 * @param {string} zip ZIP code.
 * @param {string} country Country code.
 * @return {
 * Promise<{lat: string, lon: string, timezone: string, tzOffsetSec: number}>
 * }
 *  Resolves with location and timezone info.
 */
export async function resolveZip(zip: string, country = "US") {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENWEATHER_API_KEY");

  // Current weather by ZIP gives coord + timezone (offset seconds)
  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(zip)},${country}&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenWeather error (${res.status}): ${text}`);
  }
  const data: any = await res.json();
  const lat = data?.coord?.lat;
  const lon = data?.coord?.lon;
  const tzOffsetSec = data?.timezone;

  if (typeof lat !== "number" || typeof lon !== "number") {
    throw new Error("Could not resolve coordinates from ZIP.");
  }

  // IANA timezone from lat/lon
  const timezone = tzLookup(lat, lon);
  return {lat, lon, timezone, tzOffsetSec: Number(tzOffsetSec ?? 0)};
}
