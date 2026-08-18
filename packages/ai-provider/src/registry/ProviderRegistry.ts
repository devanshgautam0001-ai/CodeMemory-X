import { IAIProvider } from '../types/IAIProvider.js';
import { ILogger } from '@codememory/logging';

export class ProviderRegistry {
  private providers = new Map<string, IAIProvider>();

  constructor(private readonly logger?: ILogger) {}

  public register(provider: IAIProvider): void {
    const id = provider.metadata.id.toLowerCase();
    this.providers.set(id, provider);
    this.logger?.info(`[ProviderRegistry] Registered AI provider: ${provider.metadata.name} (${id})`);
  }

  public get(providerId: string): IAIProvider | undefined {
    return this.providers.get(providerId.toLowerCase());
  }

  public has(providerId: string): boolean {
    return this.providers.has(providerId.toLowerCase());
  }

  public listProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }

  public clear(): void {
    this.providers.clear();
  }
}
