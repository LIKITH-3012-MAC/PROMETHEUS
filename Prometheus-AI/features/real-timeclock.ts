
'use client';

import { useState, useEffect, useContext } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { LocationContext } from '@/context/location-context';


// Function to map WMO weather codes to emojis and descriptions
const getWeatherInfo = (code: number): { emoji: string; description: string } => {
    const weatherMap: { [key: number]: { emoji: string; description: string } } = {
        0: { emoji: '☀️', description: 'Clear sky' },
        1: { emoji: '🌤️', description: 'Mainly clear' },
        2: { emoji: '🌥️', description: 'Partly cloudy' },
        3: { emoji: '☁️', description: 'Overcast' },
        45: { emoji: '🌫️', description: 'Fog' },
        48: { emoji: '🌫️', description: 'Depositing rime fog' },
        51: { emoji: '🌦️', description: 'Light drizzle' },
        53: { emoji: '🌦️', description: 'Moderate drizzle' },
        55: { emoji: '🌦️', description: 'Dense drizzle' },
        61: { emoji: '💧', description: 'Slight rain' },
        63: { emoji: '💧', description: 'Moderate rain' },
        65: { emoji: '💧', description: 'Heavy rain' },
        80: { emoji: '🌧️', description: 'Slight rain showers' },
        81: { emoji: '🌧️', description: 'Moderate rain showers' },
        82: { emoji: '🌧️', description: 'Violent rain showers' },
        95: { emoji: '⛈️', description: 'Thunderstorm' },
    };
    return weatherMap[code] || { emoji: '...', description: '...' };
};


export function RealTimeClock() {
  const { location, weather, setLocation, setWeather, setHour } = useContext(LocationContext);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on mount (client-side only)
    const now = new Date();
    setCurrentTime(now);
    setHour(now.getHours());

    const timerId = setInterval(() => {
      const updatedNow = new Date();
      setCurrentTime(updatedNow);
      setHour(updatedNow.getHours());
    }, 1000);

    return () => clearInterval(timerId);
  }, [setHour]);

  useEffect(() => {
    const fetchLocationAndWeather = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Fetch City
            try {
              const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const geoData = await geoResponse.json();
              const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Unknown';
              setLocation({ status: 'loaded', city: city === 'Calcutta' ? 'Kolkata' : city });
            } catch (e) {
               console.error("Error fetching city from coordinates:", e);
               setLocation({ status: 'error', city: 'Unknown Location' });
            }
            
            // Fetch Weather
            try {
                const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
                const weatherData = await weatherResponse.json();
                 if (weatherData.current) {
                    setWeather({
                        temperature: Math.round(weatherData.current.temperature_2m),
                        weatherCode: weatherData.current.weather_code,
                    });
                }
            } catch (e) {
                 console.error("Error fetching weather data:", e);
                 setWeather(null);
            }

          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setLocation({ status: 'blocked', city: 'Location Blocked' });
            } else {
              console.error("Geolocation error:", error);
              setLocation({ status: 'error', city: 'Unknown Location' });
            }
          }
        );
      } else {
        // Fallback for browsers that don't support geolocation
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let cityMatch = timeZone.split('/').pop()?.replace(/_/g, ' ');
        if (cityMatch === 'Calcutta') cityMatch = 'Kolkata';
        setLocation({ status: 'loaded', city: cityMatch || 'Unknown' });
      }
    };
    
    fetchLocationAndWeather();
  }, [setLocation, setWeather]);


  if (!currentTime) {
      return (
        <div className="flex items-start gap-1 p-1" aria-live="polite" aria-atomic="true">
          <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="max-w-[100px] break-words">
            <div className="text-sm font-bold text-foreground tracking-wider transition-all duration-300 ease-in-out text-glow">
              --:--:-- --
            </div>
            <div className="text-xs text-muted-foreground">
                📍 Loading...
            </div>
          </div>
        </div>
      );
  }

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(currentTime);

  const cityText = location.status === 'loaded' ? location.city : location.city;
  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode) : null;

  return (
    <div className="flex items-start gap-1 p-1" aria-live="polite" aria-atomic="true">
      <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
      <div className="max-w-[150px] break-words">
        <div 
          className={cn(
            "text-sm font-bold text-foreground tracking-wider",
            "transition-all duration-300 ease-in-out text-glow"
          )}
          aria-label={`Current Time: ${formattedTime}`}
        >
          {formattedTime}
        </div>
        {location.status !== 'loading' && cityText && (
            <div 
                className="text-xs text-muted-foreground"
                aria-label={`Location: ${cityText}`}
            >
                📍 {cityText}
            </div>
        )}
        {weather && weatherInfo && (
            <div 
                className="text-xs text-muted-foreground mt-0.5"
                aria-label={`Weather: ${weather.temperature}°C, ${weatherInfo.description}`}
            >
               <span>{weatherInfo.emoji} {weather.temperature}°C, {weatherInfo.description}</span>
            </div>
        )}
      </div>
    </div>
  );
}
