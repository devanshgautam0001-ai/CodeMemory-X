export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  defaultModel?: string;
  timeoutMs?: number;
  maxRetries?: number;
  customHeaders?: Record<string, string>;
}
