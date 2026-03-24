import type { WeatherDay } from "@/hooks/use-weather-forecast";

interface DayWeatherSummaryProps {
  weather: WeatherDay;
}

const DayWeatherSummary = ({ weather }: DayWeatherSummaryProps) => (
  <div className="flex flex-col items-center mt-1">
    <span className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground leading-none">
      {weather.condition}
    </span>
    <span className="text-[9px] leading-none mt-0.5 text-foreground/70">
      {weather.high}°&thinsp;<span className="text-muted-foreground">{weather.low}°</span>
    </span>
  </div>
);

export default DayWeatherSummary;
