import { ProviderRegistry } from '../registry/ProviderRegistry.js';
import { CapabilityResolver } from '../resolver/CapabilityResolver.js';
import { IAIProvider } from '../types/IAIProvider.js';
import { ProviderConfig } from '../types/ProviderConfig.js';
import { OpenAIProvider, ClaudeProvider, GeminiProvider, OllamaProvider, LMStudioProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { AzureOpenAIProvider, OpenRouterProvider, DeepSeekProvider, GroqProvider, MistralProvider } from '../adapters/CloudAndLocalAdapters2.js';
import { Result, ok, fail } from '@codememory/shared';
import { ILogger } from '@codememory/logging';

export class AIProviderFactory {
  private registry: ProviderRegistry;
  private resolver: CapabilityResolver;

  constructor(private readonly logger?: ILogger) {
    this.registry = new ProviderRegistry(this.logger);
    this.resolver = new CapabilityResolver();
    this.registerDefaultProviders();
  }

  private registerDefaultProviders(): void {
    this.registry.register(new OpenAIProvider({}, this.logger));
    this.registry.register(new ClaudeProvider({}, this.logger));
    this.registry.register(new GeminiProvider({}, this.logger));
    this.registry.register(new OllamaProvider({}, this.logger));
    this.registry.register(new LMStudioProvider({}, this.logger));
    this.registry.register(new AzureOpenAIProvider({}, this.logger));
    this.registry.register(new OpenRouterProvider({}, this.logger));
    this.registry.register(new DeepSeekProvider({}, this.logger));
    this.registry.register(new GroqProvider({}, this.logger));
    this.registry.register(new MistralProvider({}, this.logger));
  }

  public getProvider(providerId: string, config?: ProviderConfig): Result<IAIProvider> {
    const pId = providerId.toLowerCase();
    let provider = this.registry.get(pId);

    if (!provider) {
      return fail(new Error(`Unknown AI Provider: ${providerId}`));
    }

    if (config) {
      provider = this.createConfiguredProvider(pId, config);
    }

    return ok(provider);
  }

  public getRegistry(): ProviderRegistry {
    return this.registry;
  }

  public getResolver(): CapabilityResolver {
    return this.resolver;
  }

  private createConfiguredProvider(pId: string, config: ProviderConfig): IAIProvider {
    switch (pId) {
      case 'openai': return new OpenAIProvider(config, this.logger);
      case 'claude': return new ClaudeProvider(config, this.logger);
      case 'gemini': return new GeminiProvider(config, this.logger);
      case 'ollama': return new OllamaProvider(config, this.logger);
      case 'lmstudio': return new LMStudioProvider(config, this.logger);
      case 'azure': return new AzureOpenAIProvider(config, this.logger);
      case 'openrouter': return new OpenRouterProvider(config, this.logger);
      case 'deepseek': return new DeepSeekProvider(config, this.logger);
      case 'groq': return new GroqProvider(config, this.logger);
      case 'mistral': return new MistralProvider(config, this.logger);
      default:
        throw new Error(`Unsupported provider id: ${pId}`);
    }
  }
}
