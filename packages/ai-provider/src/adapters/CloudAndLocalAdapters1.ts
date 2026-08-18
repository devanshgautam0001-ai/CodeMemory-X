import { BaseAIProvider } from './BaseAIProvider.js';
import { AIProviderMetadata } from '../types/AIProviderMetadata.js';
import { AIProviderCapabilities } from '../types/AIProviderCapabilities.js';
import { IAIRequest, StreamingChunk } from '../types/IAIRequest.js';
import { IAIResponse } from '../types/IAIResponse.js';
import { ToolCall } from '../types/ToolTypes.js';
import { ToolValidator } from '../validation/ToolValidator.js';
import { HttpTransportOptions } from '../transport/HttpTransport.js';

export class OpenAIProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'openai',
    name: 'OpenAI Provider',
    vendor: 'OpenAI',
    defaultModel: 'gpt-4o',
    supportedModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini'],
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
    const baseUrl = this.config.baseUrl ?? 'https://api.openai.com';
    const messages = [...request.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.name ? { name: m.name } : {}),
      ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
    }))];

    if (request.toolResults && request.toolResults.length > 0) {
      for (const res of request.toolResults) {
        messages.push({
          role: 'tool',
          tool_call_id: res.toolCallId,
          content: typeof res.content === 'string' ? res.content : JSON.stringify(res.content),
        } as any);
      }
    }

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

    return {
      url: `${baseUrl}/v1/chat/completions`,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        ...(this.config.organizationId ? { 'OpenAI-Organization': this.config.organizationId } : {}),
        ...this.config.customHeaders,
      },
      body: {
        model,
        messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stop: request.stopSequences,
        stream,
        ...(formattedTools ? { tools: formattedTools } : {}),
        ...(formattedToolChoice ? { tool_choice: formattedToolChoice } : {}),
        ...(request.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    const choice = data.choices?.[0];
    const rawToolCalls = choice?.message?.tool_calls;
    let parsedToolCalls: ToolCall[] | undefined;

    if (Array.isArray(rawToolCalls) && rawToolCalls.length > 0) {
      parsedToolCalls = rawToolCalls.map((tc: any) => ({
        id: tc.id,
        name: tc.function?.name ?? '',
        arguments: ToolValidator.parseArguments(tc.function?.arguments, this.metadata.id),
      }));
    }

    return {
      id: data.id ?? `res_${Date.now()}`,
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

  protected parseStreamChunk(line: string): string | null {
    const chunkObj = this.parseStreamChunkObject(line);
    return chunkObj?.contentDelta ?? null;
  }

  protected override parseStreamChunkObject(line: string): StreamingChunk | null {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') return null;
      try {
        const json = JSON.parse(dataStr);
        const choice = json.choices?.[0];
        const delta = choice?.delta;

        const contentDelta = delta?.content ?? '';
        let toolCallDelta: any;

        if (delta?.tool_calls && delta.tool_calls.length > 0) {
          const tc = delta.tool_calls[0];
          toolCallDelta = {
            index: tc.index ?? 0,
            id: tc.id,
            name: tc.function?.name,
            argumentsDelta: tc.function?.arguments,
          };
        }

        if (contentDelta || toolCallDelta || choice?.finish_reason) {
          return {
            contentDelta,
            toolCallDelta,
            finishReason: choice?.finish_reason ?? null,
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

export class ClaudeProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'claude',
    name: 'Anthropic Claude Provider',
    vendor: 'Anthropic',
    defaultModel: 'claude-3-5-sonnet-20241022',
    supportedModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
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
    const baseUrl = this.config.baseUrl ?? 'https://api.anthropic.com';
    const systemMsg = request.messages.find((m) => m.role === 'system');
    const userMessages: any[] = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    if (request.toolResults && request.toolResults.length > 0) {
      userMessages.push({
        role: 'user',
        content: request.toolResults.map((r) => ({
          type: 'tool_result',
          tool_use_id: r.toolCallId,
          content: typeof r.content === 'string' ? r.content : JSON.stringify(r.content),
          ...(r.isError ? { is_error: true } : {}),
        })),
      });
    }

    const formattedTools = request.tools && request.tools.length > 0
      ? request.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        }))
      : undefined;

    let toolChoice: any;
    if (request.toolChoice) {
      if (request.toolChoice === 'auto') toolChoice = { type: 'auto' };
      else if (request.toolChoice === 'none') toolChoice = { type: 'none' };
      else if (request.toolChoice === 'required') toolChoice = { type: 'any' };
      else if (typeof request.toolChoice === 'object' && request.toolChoice.type === 'function') {
        toolChoice = { type: 'tool', name: request.toolChoice.name };
      }
    }

    return {
      url: `${baseUrl}/v1/messages`,
      headers: {
        'x-api-key': `${this.config.apiKey}`,
        'anthropic-version': '2023-06-01',
        ...this.config.customHeaders,
      },
      body: {
        model,
        messages: userMessages,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature,
        stream,
        ...(formattedTools ? { tools: formattedTools } : {}),
        ...(toolChoice ? { tool_choice: toolChoice } : {}),
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    let textContent = '';
    const parsedToolCalls: ToolCall[] = [];

    if (Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text') {
          textContent += block.text ?? '';
        } else if (block.type === 'tool_use') {
          parsedToolCalls.push({
            id: block.id,
            name: block.name,
            arguments: ToolValidator.parseArguments(block.input, this.metadata.id),
          });
        }
      }
    }

    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;

    return {
      id: data.id ?? `claude_${Date.now()}`,
      model: data.model ?? model,
      content: textContent,
      toolCalls: parsedToolCalls.length > 0 ? parsedToolCalls : undefined,
      finishReason: parsedToolCalls.length > 0 ? 'tool_calls' : (data.stop_reason ?? 'end_turn'),
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      rawResponse: data,
    };
  }

  protected parseStreamChunk(line: string): string | null {
    const chunkObj = this.parseStreamChunkObject(line);
    return chunkObj?.contentDelta ?? null;
  }

  protected override parseStreamChunkObject(line: string): StreamingChunk | null {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      try {
        const json = JSON.parse(dataStr);
        if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
          return { contentDelta: json.delta.text, finishReason: null };
        }
        if (json.type === 'content_block_start' && json.content_block?.type === 'tool_use') {
          return {
            contentDelta: '',
            toolCallDelta: {
              index: json.index,
              id: json.content_block.id,
              name: json.content_block.name,
            },
            finishReason: null,
          };
        }
        if (json.type === 'content_block_delta' && json.delta?.type === 'input_json_delta') {
          return {
            contentDelta: '',
            toolCallDelta: {
              index: json.index,
              argumentsDelta: json.delta.partial_json,
            },
            finishReason: null,
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

export class GeminiProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'gemini',
    name: 'Google Gemini Provider',
    vendor: 'Google',
    defaultModel: 'gemini-1.5-pro',
    supportedModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
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
    contextLength: 2000000,
    supportsTemperature: true,
    maxTokens: 8192,
  };

  protected buildHttpOptions(request: IAIRequest, model: string, stream: boolean): HttpTransportOptions {
    const baseUrl = this.config.baseUrl ?? 'https://generativelanguage.googleapis.com';
    const action = stream ? 'streamGenerateContent' : 'generateContent';
    const url = `${baseUrl}/v1beta/models/${model}:${action}?key=${this.config.apiKey}`;

    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (request.toolResults && request.toolResults.length > 0) {
      for (const r of request.toolResults) {
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: r.toolCallId,
              response: typeof r.content === 'object' ? r.content : { result: r.content },
            },
          } as any],
        });
      }
    }

    const tools = request.tools && request.tools.length > 0
      ? [{
          functionDeclarations: request.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        }]
      : undefined;

    return {
      url,
      headers: {
        ...this.config.customHeaders,
      },
      body: {
        contents,
        ...(tools ? { tools } : {}),
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
        },
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    const candidate = data.candidates?.[0];
    let text = '';
    const parsedToolCalls: ToolCall[] = [];

    if (Array.isArray(candidate?.content?.parts)) {
      for (const part of candidate.content.parts) {
        if (part.text) text += part.text;
        if (part.functionCall) {
          parsedToolCalls.push({
            id: `${part.functionCall.name}_${Date.now()}`,
            name: part.functionCall.name,
            arguments: ToolValidator.parseArguments(part.functionCall.args, this.metadata.id),
          });
        }
      }
    }

    const usage = data.usageMetadata;

    return {
      id: `gemini_${Date.now()}`,
      model,
      content: text,
      toolCalls: parsedToolCalls.length > 0 ? parsedToolCalls : undefined,
      finishReason: parsedToolCalls.length > 0 ? 'tool_calls' : (candidate?.finishReason ?? 'STOP'),
      usage: usage
        ? {
            promptTokens: usage.promptTokenCount ?? 0,
            completionTokens: usage.candidatesTokenCount ?? 0,
            totalTokens: usage.totalTokenCount ?? 0,
          }
        : undefined,
      rawResponse: data,
    };
  }

  protected parseStreamChunk(line: string): string | null {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      try {
        const json = JSON.parse(dataStr);
        return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export class OllamaProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'ollama',
    name: 'Ollama Local Provider',
    vendor: 'Ollama',
    defaultModel: 'llama3.1',
    supportedModels: ['llama3.1', 'qwen2.5-coder', 'deepseek-r1', 'mistral-nemo'],
    isLocal: true,
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
    maxTokens: 8192,
  };

  protected buildHttpOptions(request: IAIRequest, model: string, stream: boolean): HttpTransportOptions {
    const baseUrl = this.config.baseUrl ?? 'http://127.0.0.1:11434';
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

    return {
      url: `${baseUrl}/api/chat`,
      headers: {
        ...this.config.customHeaders,
      },
      body: {
        model,
        messages: request.messages,
        stream,
        ...(formattedTools ? { tools: formattedTools } : {}),
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      },
      timeoutMs: this.config.timeoutMs ?? 30000,
      providerId: this.metadata.id,
    };
  }

  protected parseHttpResponse(data: any, model: string): IAIResponse {
    const rawToolCalls = data.message?.tool_calls;
    let parsedToolCalls: ToolCall[] | undefined;

    if (Array.isArray(rawToolCalls) && rawToolCalls.length > 0) {
      parsedToolCalls = rawToolCalls.map((tc: any, index: number) => ({
        id: `ollama_tc_${index}_${Date.now()}`,
        name: tc.function?.name ?? '',
        arguments: ToolValidator.parseArguments(tc.function?.arguments, this.metadata.id),
      }));
    }

    return {
      id: `ollama_${Date.now()}`,
      model: data.model ?? model,
      content: data.message?.content ?? '',
      toolCalls: parsedToolCalls,
      finishReason: parsedToolCalls && parsedToolCalls.length > 0 ? 'tool_calls' : (data.done ? 'stop' : 'length'),
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
      rawResponse: data,
    };
  }

  protected parseStreamChunk(line: string): string | null {
    try {
      const json = JSON.parse(line);
      return json.message?.content ?? null;
    } catch {
      return null;
    }
  }
}

export class LMStudioProvider extends BaseAIProvider {
  readonly metadata: AIProviderMetadata = {
    id: 'lmstudio',
    name: 'LM Studio Local Provider',
    vendor: 'LMStudio',
    defaultModel: 'local-model',
    supportedModels: ['local-model'],
    isLocal: true,
  };

  readonly capabilities: AIProviderCapabilities = {
    streaming: true,
    toolCalling: true,
    jsonMode: true,
    vision: false,
    reasoning: false,
    embeddings: true,
    functionCalling: true,
    contextLength: 32768,
    supportsTemperature: true,
    maxTokens: 4096,
  };

  protected buildHttpOptions(request: IAIRequest, model: string, stream: boolean): HttpTransportOptions {
    const baseUrl = this.config.baseUrl ?? 'http://127.0.0.1:1234/v1';
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

    return {
      url: `${baseUrl}/chat/completions`,
      headers: {
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
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
    const choice = data.choices?.[0];
    const rawToolCalls = choice?.message?.tool_calls;
    let parsedToolCalls: ToolCall[] | undefined;

    if (Array.isArray(rawToolCalls) && rawToolCalls.length > 0) {
      parsedToolCalls = rawToolCalls.map((tc: any) => ({
        id: tc.id,
        name: tc.function?.name ?? '',
        arguments: ToolValidator.parseArguments(tc.function?.arguments, this.metadata.id),
      }));
    }

    return {
      id: data.id ?? `lmstudio_${Date.now()}`,
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
