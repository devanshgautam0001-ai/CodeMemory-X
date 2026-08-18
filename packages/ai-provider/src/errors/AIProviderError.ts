export type AIProviderErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'INVALID_REQUEST'
  | 'MODEL_NOT_FOUND'
  | 'UNSUPPORTED_CAPABILITY'
  | 'INVALID_RESPONSE'
  | 'ABORTED'
  | 'UNKNOWN';

export interface AIProviderErrorParams {
  providerId: string;
  code: AIProviderErrorCode;
  message: string;
  retryable?: boolean;
  statusCode?: number;
  correlationId?: string;
  cause?: unknown;
}

export class AIProviderError extends Error {
  public readonly providerId: string;
  public readonly code: AIProviderErrorCode;
  public readonly retryable: boolean;
  public readonly statusCode?: number;
  public readonly correlationId?: string;

  constructor(params: AIProviderErrorParams) {
    // Sanitize error message to ensure secrets/keys are never leaked
    const sanitizedMessage = AIProviderError.sanitizeText(params.message);
    super(`[${params.providerId}] ${params.code}: ${sanitizedMessage}`);

    this.name = 'AIProviderError';
    this.providerId = params.providerId;
    this.code = params.code;
    this.retryable = params.retryable ?? false;
    this.statusCode = params.statusCode;
    this.correlationId = params.correlationId;

    if (params.cause) {
      this.cause = params.cause;
    }
  }

  public static sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/sk-[a-zA-Z0-9_-]{20,}/g, 'sk-***REDACTED***')
      .replace(/x-api-key:[^\s\n,]+/gi, 'x-api-key:***REDACTED***')
      .replace(/key=[a-zA-Z0-9_-]{20,}/g, 'key=***REDACTED***')
      .replace(/Bearer\s+[a-zA-Z0-9_.-]{20,}/gi, 'Bearer ***REDACTED***');
  }
}
