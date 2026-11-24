import { AQICategory } from './air-quality.ts';

export type RecommendationCategory = 
  | 'general'
  | 'children'
  | 'elderly'
  | 'sensitive'
  | 'commute'
  | 'exercise'
  | 'indoor'
  | 'sustainability';

export type RecommendationPriority = 'urgent' | 'high' | 'medium' | 'info';

export interface RecommendationItem {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionableStep: string;
  badge?: string;
  evidenceBasis: string; // Transparency into CPCB/WHO basis
}

export interface ExposurePlannerSlot {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  title: string;
  hours: string;
  expectedRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  generalGuidance: string;
  householdTailoredGuidance: string[];
  suggestedAction: string;
  avoidAction: string;
}

export interface DailyGuidanceSummary {
  headline: string;
  summary: string;
  riskSeverity: 'low' | 'moderate' | 'elevated' | 'critical';
  topActionItems: RecommendationItem[];
  routineAdjustments: string[];
}
