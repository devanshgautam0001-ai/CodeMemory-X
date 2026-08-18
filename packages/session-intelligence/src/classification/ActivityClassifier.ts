import { ActivityLevel } from '../types/SessionTypes.js';

export interface ActivityThresholds {
  idleMinutes: number;   // default 15
  lowEventCount: number; // default 2
  activeEventCount: number; // default 9
}

export class ActivityClassifier {
  constructor(
    private readonly thresholds: ActivityThresholds = {
      idleMinutes: 15,
      lowEventCount: 2,
      activeEventCount: 9,
    }
  ) {}

  public classify(
    lastActivityIso: string,
    recentEventCount: number,
    nowIso = new Date().toISOString()
  ): ActivityLevel {
    const last = new Date(lastActivityIso).getTime();
    const now = new Date(nowIso).getTime();

    if (!isNaN(last) && !isNaN(now)) {
      const minutesInactive = (now - last) / (1000 * 60);
      if (minutesInactive >= this.thresholds.idleMinutes) {
        return 'IDLE';
      }
    }

    if (recentEventCount <= this.thresholds.lowEventCount) {
      return 'LOW';
    }
    if (recentEventCount <= this.thresholds.activeEventCount) {
      return 'ACTIVE';
    }
    return 'HIGH';
  }
}
