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

export function useWeatherForecast(): UseWeatherForecastResult {
  const [forecast, setForecast] = useState<WeatherForecast>({});
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}&longitude=${longitude}` +
            `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
            `&temperature_unit=fahrenheit&timezone=auto&forecast_days=14`;

          const res = await fetch(url);
          if (!res.ok) throw new Error("weather fetch failed");
          const data = await res.json();

          if (!cancelled) {
            const result: WeatherForecast = {};
            (data.daily.time as string[]).forEach((date, i) => {
              result[date] = {
                high: Math.round(data.daily.temperature_2m_max[i]),
                low: Math.round(data.daily.temperature_2m_min[i]),
                condition: wmoToCondition(data.daily.weathercode[i]),
              };
            });
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

    return () => { cancelled = true; };
  }, []);

  return { forecast, loading, permissionDenied };
}
