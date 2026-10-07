export type WeatherState = 'CLEAR' | 'OVERCAST' | 'RAIN' | 'FOG' | 'STORM';

export type WeatherProfile = {
  state: WeatherState;
  visibility: number;
  movement: number;
  airSupport: number;
};

export const WEATHER: Record<WeatherState, WeatherProfile> = {
  CLEAR: { state: 'CLEAR', visibility: 1, movement: 1, airSupport: 1 },
  OVERCAST: { state: 'OVERCAST', visibility: 0.9, movement: 1, airSupport: 0.9 },
  RAIN: { state: 'RAIN', visibility: 0.72, movement: 0.86, airSupport: 0.7 },
  FOG: { state: 'FOG', visibility: 0.42, movement: 1, airSupport: 0.55 },
  STORM: { state: 'STORM', visibility: 0.28, movement: 0.7, airSupport: 0.25 },
};

export function cycleWeather(current: WeatherState): WeatherState {
  const order: WeatherState[] = ['CLEAR', 'OVERCAST', 'RAIN', 'FOG', 'STORM'];
  return order[(order.indexOf(current) + 1) % order.length];
}
