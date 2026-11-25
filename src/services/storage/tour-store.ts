export type TourStatus = 'completed' | 'skipped';

const TOUR_KEY = 'airaware_tour_status';

export function getTourStatus(): TourStatus | null {
  try {
    const saved = localStorage.getItem(TOUR_KEY);
    if (saved === 'completed' || saved === 'skipped') return saved;
  } catch {
    // localStorage can be blocked (private mode); the tour simply offers itself again.
  }
  return null;
}

export function saveTourStatus(status: TourStatus): void {
  try {
    localStorage.setItem(TOUR_KEY, status);
  } catch {
    // Persisting is best-effort; closing the tour still works for this session.
  }
}
