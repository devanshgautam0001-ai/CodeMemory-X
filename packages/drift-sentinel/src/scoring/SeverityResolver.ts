import { DriftSeverity } from '../types/DriftTypes.js';

export class SeverityResolver {
  public resolve(score: number): DriftSeverity {
    const s = Math.max(0.0, Math.min(1.0, score));

    if (s >= 0.80) return 'CRITICAL';
    if (s >= 0.60) return 'HIGH';
    if (s >= 0.40) return 'MEDIUM';
    if (s >= 0.20) return 'LOW';
    return 'INFO';
  }
}
