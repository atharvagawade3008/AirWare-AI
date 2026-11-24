import type { Question, Section } from '../types/indoor';

/**
 * Questionnaire definition — the single source of truth for both the UI and the
 * scoring engine.
 *
 * `risk` values are relative contributions (0–1) used only to build an
 * indicative index. They are not concentrations, probabilities or medical risk.
 * Keep them explainable: a higher value means "this answer describes a stronger
 * known indoor pollution pathway".
 */

export const SECTIONS: Section[] = [
  {
    id: 'cooking',
    title: 'Cooking & kitchen ventilation',
    shortTitle: 'Cooking',
    description:
      'Cooking is often the largest indoor particle source in a home, especially when smoke is not captured at the stove.',
    icon: 'flame',
  },
  {
    id: 'activities',
    title: 'Indoor activities & combustion',
    shortTitle: 'Activities',
    description:
      'Smoking, incense, mosquito coils and candles release fine particles and gases directly into the room.',
    icon: 'sparkles',
  },
  {
    id: 'dust',
    title: 'Dust & cleanliness',
    shortTitle: 'Dust',
    description:
      'Settled dust and soft furnishings hold particles that are re-suspended when the home is cleaned or used.',
    icon: 'wind',
  },
  {
    id: 'moisture',
    title: 'Moisture & dampness',
    shortTitle: 'Moisture',
    description:
      'Persistent dampness can support mould growth and dust-mite activity, and often signals a building problem worth fixing.',
    icon: 'droplets',
  },
  {
    id: 'circulation',
    title: 'Air circulation',
    shortTitle: 'Circulation',
    description:
      'Fresh-air exchange dilutes indoor pollutants — but only when the outdoor air is cleaner than the indoor air.',
    icon: 'refresh',
  },
  {
    id: 'equipment',
    title: 'Filtration & maintenance',
    shortTitle: 'Equipment',
    description:
      'A well-maintained filter can reduce indoor particles. Equipment only helps when it is the right type and is serviced.',
    icon: 'settings',
  },
];

export const QUESTIONS: Question[] = [
  /* ----------------------------- Cooking ------------------------------ */
  {
    id: 'cookingFuel',
    section: 'cooking',
    prompt: 'What fuel does the household mainly cook with?',
    helpText: 'Solid and liquid fuels produce far more smoke than gas or electricity.',
    allowSkip: true,
    options: [
      { value: 'electric', label: 'Electric / induction', risk: 0, finding: 'Electric cooking produces no combustion smoke.' },
      { value: 'pipedGas', label: 'Piped natural gas', risk: 0.5, finding: 'Piped gas cooking releases combustion by-products at the stove.' },
      { value: 'lpg', label: 'LPG cylinder', risk: 0.6, finding: 'LPG cooking releases combustion by-products at the stove.' },
      { value: 'biomass', label: 'Wood, coal or dung', risk: 1, finding: 'Biomass or coal cooking is a major source of indoor fine particles and carbon monoxide.' },
      { value: 'kerosene', label: 'Kerosene', risk: 0.95, finding: 'Kerosene cooking releases fine particles and gases indoors.' },
    ],
  },
  {
    id: 'kitchenExhaust',
    section: 'cooking',
    prompt: 'Is there an exhaust fan or chimney over the stove?',
    helpText: 'Capture at the stove is the most effective way to keep cooking smoke out of the home.',
    allowSkip: true,
    options: [
      { value: 'chimney', label: 'Chimney / ducted hood', risk: 0.05, finding: 'A ducted chimney is present over the stove.' },
      { value: 'exhaustFan', label: 'Exhaust fan', risk: 0.3, finding: 'An exhaust fan is available in the kitchen.' },
      { value: 'windowOnly', label: 'Only an open window', risk: 0.7, finding: 'Cooking relies on an open window rather than mechanical exhaust.' },
      { value: 'none', label: 'No exhaust at all', risk: 1, finding: 'There is no exhaust fan or chimney to capture cooking smoke.' },
    ],
  },
  {
    id: 'smokeSpread',
    section: 'cooking',
    prompt: 'Does cooking smoke reach other rooms?',
    helpText: 'Smoke drifting through the home means the whole household is exposed, not just the kitchen.',
    allowSkip: true,
    options: [
      { value: 'never', label: 'Never', risk: 0 },
      { value: 'sometimes', label: 'Sometimes', risk: 0.45, finding: 'Cooking smoke sometimes drifts into living areas.' },
      { value: 'often', label: 'Often', risk: 0.95, finding: 'Cooking smoke frequently spreads into other rooms.' },
    ],
  },
  {
    id: 'kitchenVentilation',
    section: 'cooking',
    prompt: 'How would you describe the kitchen ventilation while cooking?',
    allowSkip: true,
    options: [
      { value: 'good', label: 'Good — air clears quickly', risk: 0 },
      { value: 'fair', label: 'Fair — some lingering smoke or smell', risk: 0.4, finding: 'Kitchen ventilation is only partly effective.' },
      { value: 'poor', label: 'Poor — smoke or smell stays', risk: 0.95, finding: 'Kitchen ventilation is poor: smoke or cooking smell lingers.' },
      { value: 'unsure', label: 'Not sure', risk: 0.45, description: 'We will treat this as a possible gap.' },
    ],
  },

  /* ---------------------------- Activities ----------------------------- */
  {
    id: 'indoorSmoking',
    section: 'activities',
    prompt: 'Does anyone smoke inside the home?',
    helpText: 'Smoking indoors is the single most concentrated source of indoor fine particles besides solid-fuel cooking.',
    allowSkip: true,
    options: [
      { value: 'none', label: 'No indoor smoking', risk: 0 },
      { value: 'occasional', label: 'Occasionally', risk: 0.6, finding: 'Someone occasionally smokes indoors.' },
      { value: 'daily', label: 'Daily', risk: 1, finding: 'Indoor smoking happens daily, exposing everyone in the home.' },
    ],
  },
  {
    id: 'incenseCoils',
    section: 'activities',
    prompt: 'Are incense sticks or mosquito coils burned indoors?',
    helpText: 'Mosquito coils and incense produce substantial smoke even in small quantities.',
    allowSkip: true,
    options: [
      { value: 'none', label: 'Not used', risk: 0 },
      { value: 'occasionally', label: 'Occasionally', risk: 0.4, finding: 'Incense or mosquito coils are burned indoors occasionally.' },
      { value: 'frequently', label: 'Frequently', risk: 0.9, finding: 'Incense or mosquito coils are burned indoors frequently.' },
      { value: 'coilsNightly', label: 'Mosquito coils almost nightly', risk: 1, finding: 'Mosquito coils are burned indoors almost every night.' },
    ],
  },
  {
    id: 'candles',
    section: 'activities',
    prompt: 'Are candles or other open flames used indoors?',
    allowSkip: true,
    options: [
      { value: 'none', label: 'Not used', risk: 0 },
      { value: 'occasionally', label: 'Occasionally', risk: 0.3, finding: 'Candles or open flames are used indoors occasionally.' },
      { value: 'frequently', label: 'Frequently', risk: 0.65, finding: 'Candles or open flames are used indoors often.' },
    ],
  },

  /* ------------------------------ Dust -------------------------------- */
  {
    id: 'cleaningFrequency',
    section: 'dust',
    prompt: 'How often is the home cleaned (dusting, sweeping or mopping)?',
    allowSkip: true,
    options: [
      { value: 'daily', label: 'Daily', risk: 0 },
      { value: 'fewTimesWeek', label: 'A few times a week', risk: 0.3 },
      { value: 'weekly', label: 'About once a week', risk: 0.55, finding: 'Cleaning happens roughly once a week.' },
      { value: 'rarely', label: 'Rarely', risk: 0.85, finding: 'The home is cleaned rarely, allowing dust to build up.' },
    ],
  },
  {
    id: 'visibleDust',
    section: 'dust',
    prompt: 'Is visible dust frequently present on surfaces?',
    allowSkip: true,
    options: [
      { value: 'no', label: 'No', risk: 0 },
      { value: 'sometimes', label: 'Sometimes', risk: 0.45, finding: 'Visible dust appears on surfaces from time to time.' },
      { value: 'often', label: 'Often', risk: 0.85, finding: 'Visible dust is often present on surfaces.' },
    ],
  },
  {
    id: 'carpetsCurtains',
    section: 'dust',
    prompt: 'Are there carpets, rugs or heavy curtains?',
    helpText: 'Soft furnishings collect dust and can keep re-releasing it into the air.',
    allowSkip: true,
    options: [
      { value: 'none', label: 'None', risk: 0 },
      { value: 'some', label: 'A few', risk: 0.35, finding: 'Some carpets, rugs or heavy curtains are present.' },
      { value: 'many', label: 'Many / wall-to-wall', risk: 0.7, finding: 'There are many soft furnishings that can hold dust.' },
    ],
  },
  {
    id: 'pets',
    section: 'dust',
    prompt: 'Are pets kept indoors?',
    allowSkip: true,
    options: [
      { value: 'none', label: 'No pets', risk: 0 },
      { value: 'one', label: 'One pet', risk: 0.3, finding: 'One indoor pet adds hair and dander to household dust.' },
      { value: 'multiple', label: 'More than one', risk: 0.55, finding: 'Multiple indoor pets add hair and dander to household dust.' },
    ],
  },

  /* ---------------------------- Moisture ------------------------------ */
  {
    id: 'dampness',
    section: 'moisture',
    prompt: 'Is there visible dampness on walls or floors?',
    allowSkip: true,
    options: [
      { value: 'no', label: 'No', risk: 0 },
      { value: 'minor', label: 'A little, occasionally', risk: 0.55, finding: 'Some damp patches appear occasionally.' },
      { value: 'significant', label: 'Yes, in several places', risk: 1, finding: 'Visible dampness affects several areas of the home.' },
    ],
  },
  {
    id: 'mould',
    section: 'moisture',
    prompt: 'Is mould visible anywhere indoors?',
    helpText: 'Mould usually means moisture has been trapped long enough for growth to start.',
    allowSkip: true,
    options: [
      { value: 'no', label: 'No', risk: 0 },
      { value: 'smallPatches', label: 'Small patches', risk: 0.6, finding: 'Small mould patches are visible indoors.' },
      { value: 'widespread', label: 'Yes, widespread', risk: 1, finding: 'Mould is widespread indoors.' },
    ],
  },
  {
    id: 'leakage',
    section: 'moisture',
    prompt: 'Are there persistent leaks or moisture problems?',
    helpText: 'Think about leaking pipes, seepage, a damp bathroom wall or water entering during rain.',
    allowSkip: true,
    options: [
      { value: 'no', label: 'No', risk: 0 },
      { value: 'occasional', label: 'Occasional', risk: 0.45, finding: 'There are occasional leaks or moisture problems.' },
      { value: 'persistent', label: 'Persistent', risk: 1, finding: 'Persistent leakage or seepage is affecting the home.' },
    ],
  },

  /* --------------------------- Circulation ---------------------------- */
  {
    id: 'windowOpening',
    section: 'circulation',
    prompt: 'How often are windows opened to air the home?',
    allowSkip: true,
    options: [
      { value: 'daily', label: 'Daily', risk: 0.05 },
      { value: 'fewTimesWeek', label: 'A few times a week', risk: 0.4, finding: 'Windows are opened only a few times a week.' },
      { value: 'rarely', label: 'Rarely', risk: 0.8, finding: 'Windows are rarely opened, limiting fresh-air exchange.' },
      { value: 'never', label: 'Never', risk: 1, finding: 'Windows are never opened, so the home has little fresh-air exchange.' },
    ],
  },
  {
    id: 'windowSafety',
    section: 'circulation',
    prompt: 'Can windows be opened safely?',
    helpText: 'Bars, security screens, noise, street dust or safety concerns can limit opening windows.',
    allowSkip: true,
    options: [
      { value: 'safe', label: 'Yes, without difficulty', risk: 0 },
      { value: 'restricted', label: 'Only partly / with difficulty', risk: 0.5, finding: 'Opening windows is restricted.' },
      { value: 'none', label: 'No, they cannot be opened', risk: 1, finding: 'Windows cannot be opened safely, so ventilation options are limited.' },
    ],
  },
  {
    id: 'ventilationRestriction',
    section: 'circulation',
    prompt: 'How much does the home rely on sealed windows and air conditioning?',
    allowSkip: true,
    options: [
      { value: 'none', label: 'Not at all — natural ventilation most of the time', risk: 0 },
      { value: 'partly', label: 'Partly — some rooms stay sealed', risk: 0.45, finding: 'Some rooms stay sealed with air conditioning.' },
      { value: 'sealed', label: 'Mostly sealed with AC', risk: 0.85, finding: 'The home is mostly sealed and air-conditioned, with little natural ventilation.' },
    ],
  },

  /* ---------------------------- Equipment ----------------------------- */
  {
    id: 'airPurifier',
    section: 'equipment',
    prompt: 'Is an air purifier used in the home?',
    helpText: 'A true HEPA purifier sized for the room can reduce indoor particles; mesh or ion-only units do not.',
    allowSkip: true,
    options: [
      { value: 'hepaMaintained', label: 'Yes — HEPA, maintained', risk: 0.05 },
      { value: 'hepaNeglected', label: 'Yes — HEPA, rarely serviced', risk: 0.4, finding: 'An air purifier is present but is rarely serviced.' },
      { value: 'nonHepa', label: 'Yes — but not a true HEPA unit', risk: 0.55, finding: 'The purifier is not a true HEPA unit, so fine-particle capture is limited.' },
      { value: 'none', label: 'No purifier', risk: 0.7, finding: 'No air purifier is available in the home.' },
    ],
  },
  {
    id: 'filterMaintenance',
    section: 'equipment',
    prompt: 'How regularly are filters or exhaust vents cleaned?',
    allowSkip: true,
    options: [
      { value: 'regular', label: 'Regularly, as recommended', risk: 0.05 },
      { value: 'irregular', label: 'Irregularly', risk: 0.5, finding: 'Filter and vent cleaning is irregular.' },
      { value: 'never', label: 'Never', risk: 0.85, finding: 'Filters and exhaust vents are never cleaned.' },
      { value: 'notApplicable', label: 'No filters or exhaust to maintain', risk: 0.5, finding: 'There are no filters or mechanical exhaust to maintain.' },
    ],
  },
];

export const QUESTION_MAP: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((question) => [question.id, question]),
);

export const TOTAL_QUESTIONS = QUESTIONS.length;

export function getQuestionsForSection(sectionId: Section['id']): Question[] {
  return QUESTIONS.filter((question) => question.section === sectionId);
}

export function getSection(sectionId: Section['id']): Section {
  const section = SECTIONS.find((candidate) => candidate.id === sectionId);
  if (!section) throw new Error(`Unknown questionnaire section: ${sectionId}`);
  return section;
}
