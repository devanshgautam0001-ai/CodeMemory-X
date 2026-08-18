export class SessionBoundaryDetector {
  constructor(private readonly inactivityThresholdMs = 30 * 60 * 1000) {} // 30 minutes

  public isNewSession(
    lastActivityIso: string,
    currentActivityIso: string
  ): boolean {
    const last = new Date(lastActivityIso).getTime();
    const curr = new Date(currentActivityIso).getTime();

    if (isNaN(last) || isNaN(curr)) return false;
    return curr - last >= this.inactivityThresholdMs;
  }
}
