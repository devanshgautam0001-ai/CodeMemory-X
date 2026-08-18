export class PromptBudgetManager {
  private readonly defaultMaxTokens: number;

  constructor(defaultMaxTokens = 4096) {
    this.defaultMaxTokens = defaultMaxTokens;
  }

  public getBudget(requestedMax?: number): number {
    return requestedMax && requestedMax > 0 ? requestedMax : this.defaultMaxTokens;
  }

  public estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
}
