import { SessionIntent } from '../types/SessionIntent.js';

export class IntentAggregator {
  public aggregate(intents: SessionIntent[]): { dominantIntent?: string; intents: SessionIntent[] } {
    if (intents.length === 0) return { intents: [] };

    const countMap = new Map<string, number>();
    for (const intent of intents) {
      countMap.set(intent.type, (countMap.get(intent.type) ?? 0) + 1);
    }

    let dominant: string | undefined;
    let maxCount = 0;
    for (const [type, count] of countMap.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominant = type;
      }
    }

    return { dominantIntent: dominant, intents };
  }
}
