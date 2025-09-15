
export default function tzLookup(lat: number, lon: number): string {
  // trivial mapping for tests
  if (lat > 0 && lon < 0) return 'America/New_York';
  if (lat > 0 && lon > 0) return 'Europe/Berlin';
  return 'UTC';
}
