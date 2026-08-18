export interface DecayConfig {
  distance0: number; // default 1.00
  distance1: number; // default 0.85
  distance2: number; // default 0.65
  distance3: number; // default 0.45
  distanceDefault: number; // default 0.25
}

export class DistanceDecay {
  private config: DecayConfig;

  constructor(customConfig?: Partial<DecayConfig>) {
    this.config = {
      distance0: 1.00,
      distance1: 0.85,
      distance2: 0.65,
      distance3: 0.45,
      distanceDefault: 0.25,
      ...customConfig,
    };
  }

  public getFactor(distance: number): number {
    if (distance <= 0) return this.config.distance0;
    if (distance === 1) return this.config.distance1;
    if (distance === 2) return this.config.distance2;
    if (distance === 3) return this.config.distance3;
    return this.config.distanceDefault;
  }
}
