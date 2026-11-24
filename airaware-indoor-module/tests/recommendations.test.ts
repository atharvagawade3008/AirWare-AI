import { buildAssessment } from '../src';
import {
  cleanOutdoor,
  pollutedOutdoor,
  scenarioA,
  scenarioB,
  scenarioC,
  unavailableOutdoor,
} from './fixtures';

const NOW = new Date('2026-11-24T09:30:00.000Z');

function build(answers: Parameters<typeof buildAssessment>[0], outdoorContext?: typeof cleanOutdoor) {
  return buildAssessment(answers, {
    now: NOW,
    ...(outdoorContext ? { outdoorContext } : {}),
  });
}

describe('recommendation selection', () => {
  it('orders actions immediate → low-cost → long-term → avoid', () => {
    const order = { immediate: 0, 'low-cost': 1, 'long-term': 2, avoid: 3 } as const;
    const { recommendations } = build(scenarioC);

    const indices = recommendations.map((item) => order[item.category]);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it('returns unique recommendation ids', () => {
    const { recommendations } = build(scenarioA);
    expect(new Set(recommendations.map((item) => item.id)).size).toBe(recommendations.length);
  });

  it('selects damp, dust and cleaning actions for a damp, dusty home', () => {
    const ids = build(scenarioC).recommendations.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'remove-mould-safely',
        'fix-leaks-quickly',
        'lower-indoor-humidity',
        'steady-cleaning-schedule',
        'manage-soft-furnishings',
        'pet-dander-routine',
      ]),
    );
  });

  it('keeps a good home plan short and non-alarmist', () => {
    const { recommendations } = build(scenarioB, cleanOutdoor);
    const actionable = recommendations.filter((item) => item.category !== 'avoid');
    expect(actionable.length).toBeLessThanOrEqual(3);
    expect(recommendations.some((item) => item.id === 'remove-mould-safely')).toBe(false);
  });

  it('does not produce confident guidance for skipped sections', () => {
    const empty = build({});
    const ids = empty.recommendations.map((item) => item.id);

    expect(ids).not.toContain('make-home-smoke-free');
    expect(ids).not.toContain('remove-mould-safely');
    expect(ids).not.toContain('choose-hepa-purifier');
    expect(ids).toEqual(expect.arrayContaining(['avoid-ozone-generators']));
    expect(ids).toContain('check-outdoor-before-ventilating');
  });

  it('falls back to a safe baseline plan when few actions are triggered', () => {
    const ids = build(scenarioB, cleanOutdoor).recommendations.map((item) => item.id);
    expect(ids).toContain('keep-a-simple-air-routine');
  });
});

describe('outdoor-sensitive ventilation recommendations', () => {
  it('recommends ventilating now when outdoor air is clean', () => {
    const { recommendations } = build(scenarioB, cleanOutdoor);
    const ids = recommendations.map((item) => item.id);

    expect(ids).toContain('ventilate-now');
    expect(ids).not.toContain('keep-windows-closed');
    const ventilate = recommendations.find((item) => item.id === 'ventilate-now');
    expect(ventilate?.outdoorSensitive).toBe(true);
  });

  it('suppresses ventilation advice and prioritises filtration when outdoor AQI is high', () => {
    const { recommendations } = build(scenarioC, pollutedOutdoor);
    const ids = recommendations.map((item) => item.id);

    expect(ids).toContain('keep-windows-closed');
    expect(ids).toContain('filter-indoor-air-today');
    expect(ids).not.toContain('ventilate-now');
    expect(ids).not.toContain('ventilate-briefly');

    const keepClosed = recommendations.find((item) => item.id === 'keep-windows-closed');
    expect(keepClosed?.category).toBe('immediate');
    expect(keepClosed?.description).toMatch(/closed/i);
  });

  it('asks the user to check outdoor conditions when data is unavailable', () => {
    const { recommendations } = build(scenarioB, unavailableOutdoor);
    const ids = recommendations.map((item) => item.id);

    expect(ids).toContain('check-outdoor-before-ventilating');
    expect(ids).not.toContain('ventilate-now');
  });

  it('keeps the same indoor recommendations regardless of outdoor context', () => {
    const indoorIds = (outdoor?: typeof cleanOutdoor) =>
      build(scenarioA, outdoor)
        .recommendations.filter((item) => !item.outdoorSensitive)
        .map((item) => item.id);

    expect(indoorIds(cleanOutdoor)).toEqual(indoorIds(pollutedOutdoor));
  });
});

describe('safety constraints in recommendation copy', () => {
  const allRecommendations = [
    ...build(scenarioC, pollutedOutdoor).recommendations,
    ...build(scenarioA).recommendations,
    ...build(scenarioB, cleanOutdoor).recommendations,
  ];
  const allText = allRecommendations
    .map((item) => `${item.title} ${item.description}`)
    .join(' ');
  const textExcludingOzoneAdvice = allRecommendations
    .filter((item) => item.id !== 'avoid-ozone-generators')
    .map((item) => `${item.title} ${item.description}`)
    .join(' ');

  it('never recommends ozone generators as an air-cleaning option', () => {
    expect(allText).toMatch(/do not use ozone generators/i);
    expect(textExcludingOzoneAdvice).not.toMatch(/ozone/i);
  });

  it('does not claim houseplants replace filtration', () => {
    const plants = build(scenarioA).recommendations.find(
      (item) => item.id === 'plants-do-not-replace-filtration',
    );
    expect(plants?.description).toMatch(/do not provide meaningful particle filtration/i);
  });

  it('never presents any action as a medical treatment or measured reading', () => {
    expect(allText).not.toMatch(/cures?|treats? asthma|medical(ly)? proven/i);
    expect(allText).not.toMatch(/measured (aqi|pm2\.5)/i);
  });
});
