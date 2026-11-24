export type CommuteType = 
  | 'walk'
  | 'bicycle'
  | 'two_wheeler'
  | 'car_solo'
  | 'carpool'
  | 'public_transit'
  | 'work_from_home';

export type OutdoorExerciseTime = 
  | 'none'
  | 'early_morning'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night';

export type IndoorCookingFuel = 
  | 'lpg'
  | 'induction'
  | 'piped_gas'
  | 'biomass'
  | 'kerosene';

export interface HouseholdProfile {
  id: string;
  name: string;
  city: string;
  householdSize: number;
  hasChildren: boolean;
  childrenAges?: string;
  hasElderly: boolean;
  hasRespiratorySensitive: boolean; // Asthma, COPD, allergies
  isWorkingProfessional: boolean;
  isStudent: boolean;
  commuteType: CommuteType;
  commuteDistanceKm: number;
  outdoorExerciseTime: OutdoorExerciseTime;
  indoorCookingFuel: IndoorCookingFuel;
  hasAirPurifier: boolean;
  dailyOutdoorHours: number;
}

export const DEFAULT_PROFILE: HouseholdProfile = {
  id: 'default',
  name: 'My Household',
  city: 'Mumbai',
  householdSize: 4,
  hasChildren: true,
  childrenAges: '7, 11',
  hasElderly: false,
  hasRespiratorySensitive: false,
  isWorkingProfessional: true,
  isStudent: false,
  commuteType: 'public_transit',
  commuteDistanceKm: 12,
  outdoorExerciseTime: 'morning',
  indoorCookingFuel: 'piped_gas',
  hasAirPurifier: false,
  dailyOutdoorHours: 3
};
