import { describe, it, expect } from 'vitest';
import { Entity } from '../domain/Entity.js';
import { ValueObject } from '../domain/ValueObject.js';

interface TestProps {
  name: string;
}

class SampleEntity extends Entity<TestProps> {
  getName(): string {
    return this.props.name;
  }
}

class SampleValueObject extends ValueObject<TestProps> {}

describe('DDD Base Abstractions', () => {
  it('should evaluate entity equality by identity ID', () => {
    const e1 = new SampleEntity('id_1', { name: 'Alpha' });
    const e2 = new SampleEntity('id_1', { name: 'Beta' });
    const e3 = new SampleEntity('id_2', { name: 'Alpha' });

    expect(e1.equals(e2)).toBe(true);
    expect(e1.equals(e3)).toBe(false);
  });

  it('should evaluate value object equality by structural properties', () => {
    const vo1 = new SampleValueObject({ name: 'CodeMemory' });
    const vo2 = new SampleValueObject({ name: 'CodeMemory' });
    const vo3 = new SampleValueObject({ name: 'Git' });

    expect(vo1.equals(vo2)).toBe(true);
    expect(vo1.equals(vo3)).toBe(false);
  });
});
