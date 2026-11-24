import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IndoorAirDoctor } from '../src';
import type { IndoorAssessment } from '../src';
import { pollutedOutdoor } from './fixtures';

async function advanceToResults(user: ReturnType<typeof userEvent.setup>) {
  for (let step = 0; step < 5; step += 1) {
    await user.click(screen.getByRole('button', { name: 'Continue' }));
  }
  await user.click(screen.getByRole('button', { name: /see my assessment/i }));
}

describe('Indoor Air Doctor UI', () => {
  it('introduces the assessment without claiming to measure indoor air', () => {
    render(<IndoorAirDoctor />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/understand your indoor air/i);
    expect(screen.getByText(/Indoor Air Risk Assessment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start household check/i })).toBeInTheDocument();
    expect(screen.getByText(/does not measure indoor AQI/i)).toBeInTheDocument();
    expect(screen.getByText(/No indoor sensors required/i)).toBeInTheDocument();
  });

  it('runs the questionnaire, reports the assessment and supports retaking it', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<IndoorAirDoctor onAssessmentComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: /start household check/i }));
    expect(screen.getByRole('heading', { name: 'Household check' })).toBeInTheDocument();

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '0');

    await user.click(screen.getByText('LPG cylinder'));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');

    await advanceToResults(user);

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0] as IndoorAssessment;
    expect(result.answeredQuestions).toBe(1);
    expect(result.totalQuestions).toBe(20);
    expect(['low', 'moderate', 'high']).toContain(result.overallRisk);
    expect(result.disclaimer).toMatch(/not a measurement/i);

    expect(
      screen.getByRole('heading', { name: /indicative risk profile/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Not a measured AQI/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Time ventilation with local outdoor conditions/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/do not use ozone generators/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retake assessment/i }));

    expect(screen.getByRole('heading', { name: 'Household check' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /lpg cylinder/i })).toBeChecked();
  });

  it('handles a completely skipped questionnaire without implying clean air', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<IndoorAirDoctor onAssessmentComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: /start household check/i }));
    for (let step = 0; step < 5; step += 1) {
      await user.click(screen.getByRole('button', { name: /skip section/i }));
    }
    await user.click(screen.getByRole('button', { name: /skip remaining/i }));

    const result = onComplete.mock.calls[0][0] as IndoorAssessment;
    expect(result.answeredQuestions).toBe(0);
    expect(result.identifiedFactors).toHaveLength(0);
    expect(result.confidence).toBe('low');
    expect(result.riskScore).toBeGreaterThan(0);

    expect(screen.getByRole('note')).toHaveTextContent(/You answered 0 of 20 questions/i);
    expect(screen.getByRole('note')).toHaveTextContent(/never as evidence of clean air/i);
    expect(screen.getByText(/Limited confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/No section had enough answers/i)).toBeInTheDocument();
  });

  it('adapts ventilation advice to a polluted outdoor context', async () => {
    const user = userEvent.setup();
    render(<IndoorAirDoctor outdoorContext={pollutedOutdoor} />);

    expect(screen.getByText(/AQI 186/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start household check/i }));
    await advanceToResults(user);

    expect(
      screen.getByText(/Keep windows closed while outdoor air is polluted/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Reported outdoor AQI 186/i)).toBeInTheDocument();
    expect(screen.getByText(/Outdoor data: Recent/i)).toBeInTheDocument();
    expect(screen.queryByText(/Outdoor air looks suitable for ventilation/i)).toBeNull();
  });

  it('resets to the introduction when starting over', async () => {
    const user = userEvent.setup();
    render(<IndoorAirDoctor />);

    await user.click(screen.getByRole('button', { name: /start household check/i }));
    await advanceToResults(user);
    await user.click(screen.getByRole('button', { name: 'Start over' }));

    expect(screen.getByRole('button', { name: /start household check/i })).toBeInTheDocument();
  });

  it('accepts restored answers through initialAnswers', async () => {
    const user = userEvent.setup();
    render(<IndoorAirDoctor initialAnswers={{ cookingFuel: 'lpg' }} />);

    await user.click(screen.getByRole('button', { name: /start household check/i }));
    expect(screen.getByRole('radio', { name: /lpg cylinder/i })).toBeChecked();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
  });
});
