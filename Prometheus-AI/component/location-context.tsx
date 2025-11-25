
'use client';

import React, { createContext, useState, ReactNode } from 'react';

export type LocationState = {
  city: string | null;
  status: 'loading' | 'loaded' | 'blocked' | 'error';
};

export type WeatherState = {
    temperature: number;
    weatherCode: number;
} | null;

export interface LocationContextType {
  location: LocationState;
  setLocation: React.Dispatch<React.SetStateAction<LocationState>>;
  weather: WeatherState;
  setWeather: React.Dispatch<React.SetStateAction<WeatherState>>;
  hour: number;
  setHour: React.Dispatch<React.SetStateAction<number>>;
}

export const LocationContext = createContext<LocationContextType>({
  location: { status: 'loading', city: null },
  setLocation: () => {},
  weather: null,
  setWeather: () => {},
  hour: new Date().getHours(),
  setHour: () => {},
});

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationState>({ status: 'loading', city: null });
  const [weather, setWeather] = useState<WeatherState>(null);
  const [hour, setHour] = useState<number>(new Date().getHours());

  return (
    <LocationContext.Provider value={{ location, setLocation, weather, setWeather, hour, setHour }}>
      {children}
    </LocationContext.Provider>
  );
};
