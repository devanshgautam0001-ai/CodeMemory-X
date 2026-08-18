import { Result, ok, fail } from '@codememory/shared';
import { IAIProvider } from '../types/IAIProvider.js';
import { IAIRequest, StreamingChunk } from '../types/IAIRequest.js';
import { IAIResponse } from '../types/IAIResponse.js';
import { AIProviderCapabilities } from '../types/AIProviderCapabilities.js';
import { AIProviderMetadata } from '../types/AIProviderMetadata.js';
import { ProviderConfig } from '../types/ProviderConfig.js';
import { HttpTransport, HttpTransportOptions } from '../transport/HttpTransport.js';
import {
  DefaultRetryPolicy,
  DefaultCircuitBreaker,
  DefaultRateLimiter,
  DefaultTokenAccounting,
  DefaultRequestLogger,
} from '../resilience/DefaultResilience.js';
import { AIProviderError } from '../errors/AIProviderError.js';
import { ToolValidator } from '../validation/ToolValidator.js';
import { ILogger } from '@codememory/logging';

export abstract class BaseAIProvider implements IAIProvider {
  abstract readonly metadata: AIProviderMetadata;
  abstract readonly capabilities: AIProviderCapabilities;

  protected readonly transport: HttpTransport;
  protected readonly retryPolicy: DefaultRetryPolicy;
  protected readonly circuitBreaker: DefaultCircuitBreaker;
  protected readonly rateLimiter: DefaultRateLimiter;
  protected readonly tokenAccounting: DefaultTokenAccounting;
  protected readonly requestLogger: DefaultRequestLogger;

  constructor(
    protected readonly config: ProviderConfig = {},
    protected readonly logger?: ILogger
  ) {
    this.transport = new HttpTransport(this.logger);
    this.retryPolicy = new DefaultRetryPolicy(config.maxRetries ?? 3, 200, this.logger);
    this.circuitBreaker = new DefaultCircuitBreaker(5, 30000, this.logger);
    this.rateLimiter = new DefaultRateLimiter(10);
    this.tokenAccounting = new DefaultTokenAccounting();
    this.requestLogger = new DefaultRequestLogger(this.logger);
  }

  public async generate(request: IAIRequest): Promise<Result<IAIResponse>> {
    try {
      this.validateConfig();
      this.validateToolsAndCapabilities(request);

      if (!this.circuitBreaker.canExecute()) {
        return fail(
          new AIProviderError({
            providerId: this.metadata.id,
            code: 'PROVIDER_UNAVAILABLE',
            message: `Circuit breaker is OPEN for provider '${this.metadata.id}'. Request rejected.`,
            retryable: true,
          })
        );
      }

      await this.rateLimiter.acquireToken();
      const model = request.model ?? this.config.defaultModel ?? this.metadata.defaultModel;
      this.requestLogger.logRequest(this.metadata.id, model, request);

      const httpOptions = this.buildHttpOptions(request, model, false);

      const responseData = await this.retryPolicy.executeWithRetry(async () => {
        return this.transport.postJson<unknown>(httpOptions);
      });

      this.circuitBreaker.onSuccess();
      const startTime = Date.now();
      this.requestLogger.logResponse(this.metadata.id, model, responseData, Date.now() - startTime);

      const normalizedResponse = this.parseHttpResponse(responseData, model);

      if (normalizedResponse.usage) {
        this.tokenAccounting.recordUsage(
          this.metadata.id,
          model,
          normalizedResponse.usage.promptTokens,
          normalizedResponse.usage.completionTokens
        );
      }

      return ok(normalizedResponse);
    } catch (err: any) {
      this.circuitBreaker.onFailure();
      if (err instanceof AIProviderError) {
        return fail(err);
      }
      return fail(
        new AIProviderError({
          providerId: this.metadata.id,
          code: 'UNKNOWN',
          message: err.message ?? 'Unknown provider error',
          cause: err,
        })
      );
    } finally {
      this.rateLimiter.releaseToken();
    }
  }

  public async *generateStream(request: IAIRequest): AsyncIterableIterator<StreamingChunk> {
    this.validateConfig();
    this.validateToolsAndCapabilities(request);

    if (!this.circuitBreaker.canExecute()) {
      throw new AIProviderError({
        providerId: this.metadata.id,
        code: 'PROVIDER_UNAVAILABLE',
        message: `Circuit breaker is OPEN for provider '${this.metadata.id}'. Streaming rejected.`,
        retryable: true,
      });
    }

    const model = request.model ?? this.config.defaultModel ?? this.metadata.defaultModel;
    const httpOptions = this.buildHttpOptions(request, model, true);

    try {
      await this.rateLimiter.acquireToken();
      const streamGenerator = this.transport.postStream<StreamingChunk>(httpOptions, (line) =>
        this.parseStreamChunkObject(line)
      );

      for await (const chunkObj of streamGenerator) {
        if (chunkObj) {
          yield chunkObj;
        }
      }
      this.circuitBreaker.onSuccess();
    } catch (err: any) {
      this.circuitBreaker.onFailure();
      if (err instanceof AIProviderError) {
        throw err;
      }
      throw new AIProviderError({
        providerId: this.metadata.id,
        code: 'UNKNOWN',
        message: err.message ?? 'Unknown streaming error',
        cause: err,
      });
    } finally {
      this.rateLimiter.releaseToken();
    }
  }

  protected validateConfig(): void {
    if (!this.metadata.isLocal && !this.config.apiKey) {
      throw new AIProviderError({
        providerId: this.metadata.id,
        code: 'CONFIGURATION_ERROR',
        message: `Missing required API key for cloud provider '${this.metadata.id}'.`,
        retryable: false,
      });
    }
  }

  protected validateToolsAndCapabilities(request: IAIRequest): void {
    const hasTools = (request.tools && request.tools.length > 0) || request.toolChoice || (request.toolResults && request.toolResults.length > 0);
    if (hasTools && !this.capabilities.toolCalling) {
      throw new AIProviderError({
        providerId: this.metadata.id,
        code: 'UNSUPPORTED_CAPABILITY',
        message: `Provider '${this.metadata.id}' does not support tool calling capability.`,
        retryable: false,
      });
    }

    if (request.tools && request.tools.length > 0) {
      ToolValidator.validateDefinitions(request.tools, this.metadata.id);
    }

    if (request.toolChoice && request.tools) {
      ToolValidator.validateChoice(request.toolChoice, request.tools, this.metadata.id);
    }
  }

  protected parseStreamChunkObject(line: string): StreamingChunk | null {
    const deltaStr = this.parseStreamChunk(line);
    if (deltaStr) {
      return {
        contentDelta: deltaStr,
        finishReason: null,
      };
    }
    return null;
  }

  protected abstract buildHttpOptions(
    request: IAIRequest,
    model: string,
    stream: boolean
  ): HttpTransportOptions;

  protected abstract parseHttpResponse(data: unknown, model: string): IAIResponse;

  protected abstract parseStreamChunk(line: string): string | null;
}
