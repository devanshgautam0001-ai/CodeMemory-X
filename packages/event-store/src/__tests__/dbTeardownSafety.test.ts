import { describe, it, expect } from 'vitest';
import { DatabaseProvider } from '../database/DatabaseProvider.js';

describe('DatabaseProvider Teardown Safety Suite', () => {
  it('1. saveToDisk() returns gracefully without throwing if called after database close()', async () => {
    const provider = new DatabaseProvider();
    await provider.initialize();

    // Close the database connection
    provider.close();

    // Invoking saveToDisk after closure should NOT throw 'DatabaseProvider not initialized' error
    expect(() => {
      provider.saveToDisk();
    }).not.toThrow();
  });
});
