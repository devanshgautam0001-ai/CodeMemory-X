import { describe, it, expect } from 'vitest';
import { DatabaseProvider } from '../database/DatabaseProvider.js';

describe('DatabaseProvider Re-initialization', () => {
  it('should return existing database instance when initialize() is called twice without re-allocating', async () => {
    const provider = new DatabaseProvider();
    const res1 = await provider.initialize();
    expect(res1.isSuccess).toBe(true);
    const db1 = res1.value;

    const res2 = await provider.initialize();
    expect(res2.isSuccess).toBe(true);
    const db2 = res2.value;

    expect(db1).toBe(db2);
    provider.close();
  });
});
