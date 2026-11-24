import { AirQualityContext, AQICategory } from '../../types/air-quality.ts';
import { HouseholdProfile } from '../../types/profile.ts';
import { WeatherContext } from '../../types/weather.ts';
import { 
  DailyGuidanceSummary, 
  ExposurePlannerSlot, 
  RecommendationItem 
} from '../../types/recommendation.ts';
import { assessVulnerability } from '../risk/health-risk.ts';

export function generatePersonalizedRecommendations(
  airQuality: AirQualityContext,
  profile: HouseholdProfile,
  weather?: WeatherContext
): {
  guidanceSummary: DailyGuidanceSummary;
  exposurePlanner: ExposurePlannerSlot[];
  actionItems: RecommendationItem[];
} {
  const category: AQICategory = airQuality.aqiCategory || 'Satisfactory';
  const aqi = airQuality.aqi || 85;
  const vulnerability = assessVulnerability(category, airQuality.pollutants, profile, weather);

  const actionItems: RecommendationItem[] = [];
  const routineAdjustments: string[] = [];

  // 1. CHILDREN RECOMMENDATIONS
  if (profile.hasChildren) {
    if (category === 'Severe' || category === 'Very Poor') {
      actionItems.push({
        id: 'child-play-restricted',
        category: 'children',
        priority: 'urgent',
        title: 'Move Children Outdoor Play Indoors',
        description: 'Vigorous physical outdoor play during Very Poor or Severe AQI multiplies child pulmonary inhalation volume, depositing deeply into alveolar zones.',
        actionableStep: 'Keep children indoors between 7 AM - 10 AM and after sunset. Replace outdoor games with active indoor games.',
        evidenceBasis: 'CPCB / Indian Academy of Pediatrics Air Pollution Advisory'
      });
      routineAdjustments.push('Substitute outdoor school playtime with indoor activities.');
    } else if (category === 'Poor') {
      actionItems.push({
        id: 'child-play-moderate',
        category: 'children',
        priority: 'high',
        title: 'Limit Prolonged Outdoor Exertion for Children',
        description: 'Children playing intensely outdoors for >60 mins may develop cough or eye irritation.',
        actionableStep: 'Cap outdoor physical activities to under 45 minutes; prefer late afternoons when atmospheric dispersion is higher.',
        evidenceBasis: 'CPCB Public Health Advisory'
      });
    } else {
      actionItems.push({
        id: 'child-play-safe',
        category: 'children',
        priority: 'info',
        title: 'Children Outdoor Activities Favourable',
        description: `Current air quality in ${airQuality.location} (${category}) is safe for standard school travel and outdoor recreation.`,
        actionableStep: 'Encourage active physical sports. Maintain hydration.',
        evidenceBasis: 'WHO Air Quality Guidelines'
      });
    }
  }

  // 2. SENIOR CITIZENS / ELDERLY
  if (profile.hasElderly) {
    if (category === 'Severe' || category === 'Very Poor' || category === 'Poor') {
      actionItems.push({
        id: 'elderly-walk-reschedule',
        category: 'elderly',
        priority: 'urgent',
        title: 'Avoid Early Morning & Night Senior Walks',
        description: 'Ground-level temperature inversion peaks around sunrise, trapping dense particulates at elderly chest level. This elevates acute cardiac and hypertension risks.',
        actionableStep: 'Shift senior morning walks to an enclosed corridor or wait until after 11 AM when sunlight breaks the inversion layer.',
        evidenceBasis: 'Cardiological Society of India Environmental Advisory'
      });
      routineAdjustments.push('Elderly household members should avoid outdoor morning walks.');
    }
  }

  // 3. RESPIRATORY SENSITIVE (ASTHMA / ALLERGIES)
  if (profile.hasRespiratorySensitive) {
    if (category !== 'Good' && category !== 'Satisfactory') {
      actionItems.push({
        id: 'respiratory-inhaler-alert',
        category: 'sensitive',
        priority: 'urgent',
        title: 'Keep Reliever Inhalers Accessible & Wear N95',
        description: 'PM2.5 and nitrogen dioxide can trigger sudden bronchial hyper-reactivity even on short outdoor errands.',
        actionableStep: 'Carry rescue medication when leaving home. Wear a well-fitted N95 / FFP2 respirator outdoors (cloth masks do not block sub-micron PM2.5).',
        evidenceBasis: 'Global Initiative for Asthma (GINA) & CPCB NAQI Health Impacts'
      });
    }
  }

  // 4. COMMUTE PERSONALIZATION
  if (['two_wheeler', 'bicycle', 'walk'].includes(profile.commuteType)) {
    if (category === 'Severe' || category === 'Very Poor') {
      actionItems.push({
        id: 'commute-high-exposure',
        category: 'commute',
        priority: 'high',
        title: `Protect Against Direct Exhaust on ${profile.commuteType.replace('_', ' ')} Commute`,
        description: `Traveling ${profile.commuteDistanceKm} km via open transport exposes you to tailpipe emission spikes that can be 3x higher than ambient monitoring stations.`,
        actionableStep: 'Switch to metro, AC bus, or carpool if possible. If riding, wear an N95 mask with an exhalation seal.',
        evidenceBasis: 'Urban Exposure Analysis - Clean Air Asia'
      });
      routineAdjustments.push(`Consider transit alternative over open ${profile.commuteType.replace('_', ' ')}.`);
    }
  } else if (profile.commuteType === 'car_solo') {
    actionItems.push({
      id: 'commute-cabin-recirc',
      category: 'commute',
      priority: 'medium',
      title: 'Set Vehicle AC to Air Recirculation Mode',
      description: 'Fresh-air mode draws in bumper-to-bumper diesel exhaust from preceding trucks and buses into your cabin.',
      actionableStep: 'Keep car windows closed in slow-moving traffic and switch the HVAC button to internal recirculation mode.',
      evidenceBasis: 'Automotive In-Cabin Air Quality Research'
    });
  }

  // 5. INDOOR AIR & VENTILATION RECOMMENDATIONS
  if (!profile.hasAirPurifier) {
    if (category === 'Severe' || category === 'Very Poor') {
      actionItems.push({
        id: 'indoor-seal-advise',
        category: 'indoor',
        priority: 'high',
        title: 'Seal Windows During Peak Commute Hours',
        description: 'Ambient outdoor pollution infiltrates indoors through loose window frames and doorways.',
        actionableStep: 'Keep doors/windows shut during 7-10 AM and 6-9 PM. Wet-mop floors instead of dry broom sweeping to avoid re-suspending settled PM10.',
        evidenceBasis: 'CPCB Residential Air Hygiene Standards'
      });
    } else {
      actionItems.push({
        id: 'indoor-natural-vent',
        category: 'indoor',
        priority: 'info',
        title: 'Optimal Window Ventilation Window: Mid-Afternoon',
        description: 'Sunlight and thermal updrafts disperse ground pollutants between 1 PM and 4 PM.',
        actionableStep: 'Open opposite windows for 20-30 minutes mid-afternoon to flush indoor carbon dioxide and cooking fumes.',
        evidenceBasis: 'CPCB Ventilation Timing Guidelines'
      });
    }
  }

  // 6. HEADLINE & SUMMARY
  let headline = '';
  let summary = '';
  let riskSeverity: DailyGuidanceSummary['riskSeverity'] = 'low';

  if (category === 'Good') {
    headline = 'Clean Air Day — Ideal for All Outdoor Activities';
    summary = `Air quality in ${airQuality.location} is pristine with AQI ${aqi}. No lifestyle or routine restrictions needed today for any age group.`;
    riskSeverity = 'low';
  } else if (category === 'Satisfactory') {
    headline = 'Acceptable Air — Minor Impact for Highly Sensitive Individuals';
    summary = `AQI is ${aqi} in ${airQuality.location}. Safe for general public. Vulnerable individuals may notice slight respiratory tickle after prolonged intense activity.`;
    riskSeverity = 'low';
  } else if (category === 'Moderately Polluted') {
    headline = 'Moderate Pollution Alert — Sensitive Family Members Beware';
    summary = `AQI is ${aqi} in ${airQuality.location} (${category}). May cause breathing discomfort to people with lung disease, asthma, and heart conditions.`;
    riskSeverity = 'moderate';
  } else if (category === 'Poor') {
    headline = 'Poor Air Quality — Limit Prolonged Outdoor Exertion';
    summary = `AQI is ${aqi} in ${airQuality.location}. Breathing discomfort to most people on prolonged exposure. Protect children and seniors during morning and night hours.`;
    riskSeverity = 'elevated';
  } else if (category === 'Very Poor') {
    headline = 'Very Poor Air Quality — Respiratory Illness Risk';
    summary = `AQI is ${aqi} in ${airQuality.location}. Significant risk of respiratory distress on prolonged exposure. Cancel strenuous outdoor sports and shift workouts indoors.`;
    riskSeverity = 'critical';
  } else {
    headline = 'Severe Air Quality Emergency — Maximize Protective Measures';
    summary = `Severe AQI ${aqi} in ${airQuality.location}. Affects healthy people and seriously impacts those with existing diseases. Stay indoors, wear N95 if outdoors, keep air purifiers running.`;
    riskSeverity = 'critical';
  }

  // 7. TIME-BASED EXPOSURE PLANNER (Morning, Afternoon, Evening, Night)
  const exposurePlanner: ExposurePlannerSlot[] = [
    {
      timeOfDay: 'morning',
      title: 'Morning Window',
      hours: '06:00 AM – 11:00 AM',
      expectedRisk: (category === 'Severe' || category === 'Very Poor') ? 'Severe' : category === 'Poor' ? 'High' : category === 'Moderately Polluted' ? 'Moderate' : 'Low',
      generalGuidance: 'Ground-level temperature inversion and traffic rush hour result in peak morning particulate accumulation.',
      householdTailoredGuidance: [
        profile.hasElderly ? 'Cancel senior morning outdoor walks; exercise indoors.' : 'Joggers: defer outdoor cardio until late afternoon.',
        profile.hasChildren ? 'Send school children with N95 masks if commuting in open transport.' : 'Commuters: close vehicle windows.'
      ],
      suggestedAction: 'Keep main windows closed; prepare breakfast with kitchen exhaust fan turned on.',
      avoidAction: 'Avoid strenuous outdoor running or open cycling on main arterial roads.'
    },
    {
      timeOfDay: 'afternoon',
      title: 'Afternoon Window',
      hours: '12:00 PM – 04:00 PM',
      expectedRisk: category === 'Severe' ? 'High' : (category === 'Very Poor' || category === 'Poor') ? 'Moderate' : 'Low',
      generalGuidance: 'Solar heating lifts the atmospheric boundary layer, promoting maximum vertical pollutant dispersion.',
      householdTailoredGuidance: [
        'Best window of the day for brief cross-ventilation of the home.',
        profile.hasChildren ? 'Safest window for outdoor school break playtime if AQI is below 250.' : 'Convenient window for running necessary errands.'
      ],
      suggestedAction: 'Ventilate home briefly (15-20 mins) if outdoor AQI is below 200.',
      avoidAction: 'Avoid leaving windows open directly facing highway construction or industrial zones.'
    },
    {
      timeOfDay: 'evening',
      title: 'Evening Commute Window',
      hours: '05:00 PM – 08:30 PM',
      expectedRisk: (category === 'Severe' || category === 'Very Poor' || category === 'Poor') ? 'High' : 'Moderate',
      generalGuidance: 'Evening rush-hour traffic causes sharp spikes in Nitrogen Dioxide (NO2) and Carbon Monoxide (CO).',
      householdTailoredGuidance: [
        `Commute: ${profile.commuteType === 'two_wheeler' ? 'Wear N95 mask while riding in peak traffic.' : 'Use cabin air recirculation in cars.'}`,
        profile.hasChildren ? 'Wrap up outdoor playground activities before dark as air cools.' : 'Plan grocery trips to avoid peak bottleneck hours.'
      ],
      suggestedAction: 'Use AC transit or carpool routes rather than congested corridors.',
      avoidAction: 'Do not idle vehicle engine while waiting at schools, shops, or signals.'
    },
    {
      timeOfDay: 'night',
      title: 'Night & Sleep Window',
      hours: '09:00 PM – 06:00 AM',
      expectedRisk: (category === 'Severe' || category === 'Very Poor') ? 'High' : category === 'Poor' ? 'Moderate' : 'Low',
      generalGuidance: 'Night cooling lowers the boundary layer again; nocturnal diesel freight traffic increases fine particulate density.',
      householdTailoredGuidance: [
        profile.hasAirPurifier ? 'Run bedroom air purifier on auto/silent mode throughout the night.' : 'Keep bedroom doors & windows shut to maintain a low-dust sleeping sanctuary.',
        'Avoid burning mosquito coils or incense sticks before sleeping; use electric liquid vaporizers instead.'
      ],
      suggestedAction: 'Close bedroom windows; keep water carafe nearby to prevent dry throat irritation.',
      avoidAction: 'Never sleep in an enclosed room with burning biomass or incense.'
    }
  ];

  return {
    guidanceSummary: {
      headline,
      summary,
      riskSeverity,
      topActionItems: actionItems.slice(0, 4),
      routineAdjustments
    },
    exposurePlanner,
    actionItems
  };
}
