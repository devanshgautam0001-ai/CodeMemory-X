export interface AIProviderMetadata {
  id: string;
  name: string;
  vendor: string;
  defaultModel: string;
  supportedModels: string[];
  isLocal: boolean;
}
