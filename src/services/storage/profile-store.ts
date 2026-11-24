import { HouseholdProfile, DEFAULT_PROFILE } from '../../types/profile.ts';

const PROFILE_STORAGE_KEY = 'airaware_user_household_profile';
const SELECTED_CITY_STORAGE_KEY = 'airaware_selected_city';

export function getStoredProfile(): HouseholdProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed reading profile from localStorage:', e);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile: HouseholdProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed saving profile to localStorage:', e);
  }
}

export function getStoredCity(): { name: string; state?: string; lat: number; lon: number } {
  try {
    const raw = localStorage.getItem(SELECTED_CITY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed reading city from localStorage:', e);
  }
  return { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 };
}

export function saveStoredCity(city: { name: string; state?: string; lat: number; lon: number }): void {
  try {
    localStorage.setItem(SELECTED_CITY_STORAGE_KEY, JSON.stringify(city));
  } catch (e) {
    console.warn('Failed saving city to localStorage:', e);
  }
}
