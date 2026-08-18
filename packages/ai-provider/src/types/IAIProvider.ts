import { Result } from '@codememory/shared';
import { IAIRequest, StreamingChunk } from './IAIRequest.js';
import { IAIResponse } from './IAIResponse.js';
import { AIProviderCapabilities } from './AIProviderCapabilities.js';
import { AIProviderMetadata } from './AIProviderMetadata.js';

export interface IAIProvider {
  readonly metadata: AIProviderMetadata;
  readonly capabilities: AIProviderCapabilities;

  generate(request: IAIRequest): Promise<Result<IAIResponse>>;
  generateStream(request: IAIRequest): AsyncIterableIterator<StreamingChunk>;
}
