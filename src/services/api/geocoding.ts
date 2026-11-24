export interface CityLocation {
  id: number;
  name: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const POPULAR_INDIAN_CITIES: CityLocation[] = [
  { id: 1, name: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
  { id: 2, name: 'Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
  { id: 3, name: 'Navi Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0330, longitude: 73.0297 },
  { id: 4, name: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567 },
  { id: 5, name: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { id: 6, name: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639 },
  { id: 7, name: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707 },
  { id: 8, name: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867 },
  { id: 9, name: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714 },
  { id: 10, name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', latitude: 26.8467, longitude: 80.9462 },
  { id: 11, name: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873 },
  { id: 12, name: 'Chandigarh', state: 'Chandigarh', country: 'India', latitude: 30.7333, longitude: 76.7794 },
];

export async function searchCities(query: string): Promise<CityLocation[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) {
    return POPULAR_INDIAN_CITIES;
  }

  // Check matching popular cities first
  const localMatches = POPULAR_INDIAN_CITIES.filter(c => 
    c.name.toLowerCase().includes(trimmed) || 
    (c.state && c.state.toLowerCase().includes(trimmed))
  );

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding HTTP error: ${res.status}`);
    const data = await res.json();
    
    if (data.results && Array.isArray(data.results)) {
      const results: CityLocation[] = data.results.map((item: any) => ({
        id: item.id,
        name: item.name,
        state: item.admin1,
        country: item.country || 'India',
        latitude: item.latitude,
        longitude: item.longitude,
      }));

      // Merge and deduplicate
      const seen = new Set<string>();
      const combined = [...localMatches, ...results].filter(item => {
        const key = `${item.name}-${item.latitude.toFixed(2)}-${item.longitude.toFixed(2)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return combined;
    }
  } catch (err) {
    console.warn('Geocoding search failed, returning local catalog:', err);
  }

  return localMatches;
}
