import { Result } from '@codememory/shared';

export interface IStoragePort {
  initialize(): Promise<Result<void>>;
  close(): Promise<Result<void>>;
  saveRecord(table: string, data: Record<string, unknown>): Promise<Result<void>>;
  queryRecords<T>(query: string, params?: unknown[]): Promise<Result<T[]>>;
}
