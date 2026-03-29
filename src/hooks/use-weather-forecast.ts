import { useState, useEffect } from "react";

export interface WeatherDay {
  high: number;
  low: number;
  condition: string;
}

export type WeatherForecast = Record<string, WeatherDay>; // keyed by YYYY-MM-DD

interface UseWeatherForecastResult {
  forecast: WeatherForecast;
  loading: boolean;
  permissionDenied: boolean;
}

function wmoToCondition(code: number): string {
  if (code === 0) return "Sunny";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow";
  return "Stormy";
}

async function fetchWeatherForCoords(lat: number, lon: number): Promise<WeatherForecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
    `&temperature_unit=fahrenheit&timezone=auto&forecast_days=14`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  const data = await res.json();
  const result: WeatherForecast = {};
  (data.daily.time as string[]).forEach((date, i) => {
    result[date] = {
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      condition: wmoToCondition(data.daily.weathercode[i]),
    };
  });
  return result;
}

// zipCode: if provided, forward-geocode it to coordinates instead of requesting geolocation.
export function useWeatherForecast(zipCode?: string): UseWeatherForecastResult {
  const [forecast, setForecast] = useState<WeatherForecast>({});
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPermissionDenied(false);

    if (zipCode) {
      // Forward-geocode the stored zip code — no geolocation needed.
      (async () => {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipCode)}&format=json&limit=1&countrycodes=us`,
            { headers: { "Accept-Language": "en" } }
          );
          if (!geoRes.ok) throw new Error("geocode failed");
          const geoData = await geoRes.json();
          if (!geoData.length) throw new Error("zip not found");
          const lat = parseFloat(geoData[0].lat);
          const lon = parseFloat(geoData[0].lon);
          const result = await fetchWeatherForCoords(lat, lon);
          if (!cancelled) {
            setForecast(result);
            setLoading(false);
          }
        } catch {
          if (!cancelled) setLoading(false);
        }
      })();
    } else {
      // No zip stored yet — fall back to geolocation (first visit only).
      if (!navigator.geolocation) {
        setLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const result = await fetchWeatherForCoords(latitude, longitude);
            if (!cancelled) {
              setForecast(result);
              setLoading(false);
            }
          } catch {
            if (!cancelled) setLoading(false);
          }
        },
        () => {
          if (!cancelled) {
            setPermissionDenied(true);
            setLoading(false);
          }
        },
        { timeout: 8000 }
      );
    }

    return () => { cancelled = true; };
  }, [zipCode]);

  return { forecast, loading, permissionDenied };
}
