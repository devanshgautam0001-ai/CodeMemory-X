import { BaseAIProvider } from './BaseAIProvider.js';
import { AIProviderMetadata } from '../types/AIProviderMetadata.js';
import { AIProviderCapabilities } from '../types/AIProviderCapabilities.js';
import { IAIRequest } from '../types/IAIRequest.js';
import { IAIResponse } from '../types/IAIResponse.js';
import { ToolCall } from '../types/ToolTypes.js';
import { ToolValidator } from '../validation/ToolValidator.js';
import { HttpTransportOptions } from '../transport/HttpTransport.js';

function formatOpenAITools(request: IAIRequest) {
  const formattedTools = request.tools && request.tools.length > 0
    ? request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))
    : undefined;

  let formattedToolChoice: any;
  if (request.toolChoice) {
    if (typeof request.toolChoice === 'string') {
      formattedToolChoice = request.toolChoice;
    } else if (request.toolChoice.type === 'function') {
      formattedToolChoice = {
        type: 'function',
        function: { name: request.toolChoice.name },
      };
    }
  }

  return { formattedTools, formattedToolChoice };
}

function parseOpenAIToolResponse(data: any, model: string, providerId: string): IAIResponse {
  const choice = data.choices?.[0];
  const rawToolCalls = choice?.message?.tool_calls;
  let parsedToolCalls: ToolCall[] | undefined;

  if (Array.isArray(rawToolCalls) && rawToolCalls.length > 0) {
    parsedToolCalls = rawToolCalls.map((tc: any) => ({
      id: tc.id,
      name: tc.function?.name ?? '',
      arguments: ToolValidator.parseArguments(tc.function?.arguments, providerId),
    }));
  }

  return {
    id: data.id ?? `${providerId}_${Date.now()}`,
    model: data.model ?? model,
    content: choice?.message?.content ?? '',
    toolCalls: parsedToolCalls,
    finishReason: parsedToolCalls && parsedToolCalls.length > 0 ? 'tool_calls' : (choice?.finish_reason ?? 'stop'),
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
          totalTokens: data.usage.total_tokens ?? 0,
        }
      : undefined,
    rawResponse: data,
  };
}

export class AzureOpenAIProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'azure',
    name: 'Azure OpenAI Provider',
    vendor: 'Microsoft Azure',
    defaultModel: 'gpt-4o',
    supportedModels: ['gpt-4o', 'gpt-4-turbo'],
    isLocal: false,
  };

  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    toolCalling: true,
    jsonMode: true,
    vision: true,
    reasoning: true,
    embeddings: true,
    functionCalling: true,
    contextLength: 128000,
    supportsTemperature: true,
    maxTokens: 16384,
  };

  protected buildHttpOptions(request: IAIRequest, model: string, stream: boolean): HttpTransportOptions {
    const baseUrl = this.config.baseUrl ?? 'https://my-azure.openai.azure.com';
    const { formattedTools, formattedToolChoice } = formatOpenAITools(request);

    return {
      url: `${baseUrl}/openai/deployments/${model}/chat/completions?api-version=2024-02-15-preview`,
      headers: {
        'api-key': `${this.config.apiKey}`,
        ...this.config.customHeaders,
      },
      body: {
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream,
        ...(formattedTools ? { tools: formattedTools } : {}),
        ...(formattedToolChoice ? { tool_choice: formattedToolChoice } : {}),
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    return parseOpenAIToolResponse(data, model, this.metadata.id);
  }

  protected parseStreamChunk(line: string): string | null {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') return null;
      try {
        const json = JSON.parse(dataStr);
        return json.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export class OpenRouterProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'openrouter',
    name: 'OpenRouter Provider',
    vendor: 'OpenRouter',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    supportedModels: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro-1.5'],
    isLocal: false,
  };

  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    toolCalling: true,
    jsonMode: true,
    vision: true,
    reasoning: true,
    embeddings: false,
    functionCalling: true,
    contextLength: 200000,
    supportsTemperature: true,
    maxTokens: 8192,
  };

  protected buildHttpOptions(request: IAIRequest, model: string, stream: boolean): HttpTransportOptions {
    const baseUrl = this.config.baseUrl ?? 'https://openrouter.ai/api/v1';
    const { formattedTools, formattedToolChoice } = formatOpenAITools(request);

    return {
      url: `${baseUrl}/chat/completions`,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.config.customHeaders,
      },
      body: {
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream,
        ...(formattedTools ? { tools: formattedTools } : {}),
        ...(formattedToolChoice ? { tool_choice: formattedToolChoice } : {}),
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    return parseOpenAIToolResponse(data, model, this.metadata.id);
  }

  protected parseStreamChunk(line: string): string | null {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') return null;
      try {
        const json = JSON.parse(dataStr);
        return json.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export class DeepSeekProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'deepseek',
    name: 'DeepSeek Provider',
    vendor: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    supportedModels: ['deepseek-chat', 'deepseek-reasoner'],
    isLocal: false,
  };

  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    toolCalling: true,
    jsonMode: true,
    vision: false,
    reasoning: true,
    embeddings: false,
    functionCalling: true,
    contextLength: 64000,
    supportsTemperature: true,
    maxTokens: 8192,
  };

  protected buildHttpOptions(request: IAIRequest, model: string, stream: boolean): HttpTransportOptions {
    const baseUrl = this.config.baseUrl ?? 'https://api.deepseek.com';
    const { formattedTools, formattedToolChoice } = formatOpenAITools(request);

    return {
      url: `${baseUrl}/chat/completions`,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.config.customHeaders,
      },
      body: {
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream,
        ...(formattedTools ? { tools: formattedTools } : {}),
        ...(formattedToolChoice ? { tool_choice: formattedToolChoice } : {}),
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    return parseOpenAIToolResponse(data, model, this.metadata.id);
  }

  protected parseStreamChunk(line: string): string | null {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') return null;
      try {
        const json = JSON.parse(dataStr);
        return json.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export class GroqProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'groq',
    name: 'Groq LPU Provider',
    vendor: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    supportedModels: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    isLocal: false,
  };

  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    toolCalling: true,
    jsonMode: true,
    vision: false,
    reasoning: false,
    embeddings: false,
    functionCalling: true,
    contextLength: 128000,
    supportsTemperature: true,
    maxTokens: 8192,
  };

  protected buildHttpOptions(request: IAIRequest, model: string, stream: boolean): HttpTransportOptions {
    const baseUrl = this.config.baseUrl ?? 'https://api.groq.com/openai/v1';
    const { formattedTools, formattedToolChoice } = formatOpenAITools(request);

    return {
      url: `${baseUrl}/chat/completions`,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.config.customHeaders,
      },
      body: {
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream,
        ...(formattedTools ? { tools: formattedTools } : {}),
        ...(formattedToolChoice ? { tool_choice: formattedToolChoice } : {}),
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    return parseOpenAIToolResponse(data, model, this.metadata.id);
  }

  protected parseStreamChunk(line: string): string | null {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') return null;
      try {
        const json = JSON.parse(dataStr);
        return json.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export class MistralProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'mistral',
    name: 'Mistral AI Provider',
    vendor: 'Mistral',
    defaultModel: 'mistral-large-latest',
    supportedModels: ['mistral-large-latest', 'pixtral-12b-2409', 'codestral-latest'],
    isLocal: false,
  };

  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    toolCalling: true,
    jsonMode: true,
    vision: true,
    reasoning: false,
    embeddings: true,
    functionCalling: true,
    contextLength: 128000,
    supportsTemperature: true,
    maxTokens: 8192,
  };

  protected buildHttpOptions(request: IAIRequest, model: string, stream: boolean): HttpTransportOptions {
    const baseUrl = this.config.baseUrl ?? 'https://api.mistral.ai/v1';
    const { formattedTools, formattedToolChoice } = formatOpenAITools(request);

    return {
      url: `${baseUrl}/chat/completions`,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.config.customHeaders,
      },
      body: {
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream,
        ...(formattedTools ? { tools: formattedTools } : {}),
        ...(formattedToolChoice ? { tool_choice: formattedToolChoice } : {}),
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    return parseOpenAIToolResponse(data, model, this.metadata.id);
  }

  protected parseStreamChunk(line: string): string | null {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') return null;
      try {
        const json = JSON.parse(dataStr);
        return json.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}
