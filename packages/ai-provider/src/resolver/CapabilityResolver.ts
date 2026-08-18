import { IAIProvider } from '../types/IAIProvider.js';
import { AIProviderCapabilities } from '../types/AIProviderCapabilities.js';

export class CapabilityResolver {
  public filterByCapability(
    providers: IAIProvider[],
    requirements: Partial<AIProviderCapabilities>
  ): IAIProvider[] {
    return providers.filter((p) => {
      const caps = p.capabilities;
      for (const [key, reqVal] of Object.entries(requirements)) {
        const capKey = key as keyof AIProviderCapabilities;
        if (typeof reqVal === 'boolean' && reqVal && !caps[capKey]) {
          return false;
        }
        if (typeof reqVal === 'number' && typeof caps[capKey] === 'number') {
          if ((caps[capKey] as number) < reqVal) return false;
        }
      }
      return true;
    });
  }
}
