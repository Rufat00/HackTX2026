import { describe, it, expect, vi } from 'vitest';
import {
  analyzeComposition,
  validateComposition,
  FixtureCompositionProvider,
  type CompositionProvider,
} from './composition';
const input = {
  title: 'Concert',
  contentRevision: 3,
  items: [
    { id: 'a', contributorId: 'alex', contributorName: 'Alex', text: 'Stage' },
    { id: 'b', contributorId: 'maya', contributorName: 'Maya', text: 'Walk' },
  ],
};
const valid = {
  clusters: [
    { id: 'one', title: 'Concert', description: '', itemIds: ['a', 'b'] },
  ],
  suggestedLinks: [],
};
describe('composition validation', () => {
  it('accepts a complete partition', () =>
    expect(validateComposition(input, valid)).toEqual(valid));
  it.each([
    [
      'invented ID',
      {
        ...valid,
        clusters: [{ ...valid.clusters[0], itemIds: ['a', 'invented'] }],
      },
    ],
    [
      'missing membership',
      { ...valid, clusters: [{ ...valid.clusters[0], itemIds: ['a'] }] },
    ],
    [
      'duplicate membership',
      {
        ...valid,
        clusters: [{ ...valid.clusters[0], itemIds: ['a', 'a', 'b'] }],
      },
    ],
    [
      'self link',
      {
        ...valid,
        suggestedLinks: [{ a: 'a', b: 'a', confidence: 0.5, reason: 'x' }],
      },
    ],
    [
      'out of range confidence',
      {
        ...valid,
        suggestedLinks: [{ a: 'a', b: 'b', confidence: 2, reason: 'x' }],
      },
    ],
    [
      'duplicate pair',
      {
        ...valid,
        suggestedLinks: [
          { a: 'a', b: 'b', confidence: 0.5, reason: 'x' },
          { a: 'b', b: 'a', confidence: 0.5, reason: 'x' },
        ],
      },
    ],
  ])('rejects %s', (_name, value) =>
    expect(() => validateComposition(input, value)).toThrow(),
  );
  it('rejects more than three semantic links for one item', () => {
    const many = {
      ...input,
      items: Array.from({ length: 5 }, (_, i) => ({
        ...input.items[0]!,
        id: `item-${i}`,
      })),
    };
    const output = {
      clusters: [
        {
          id: 'one',
          title: 'Memories',
          description: '',
          itemIds: many.items.map((i) => i.id),
        },
      ],
      suggestedLinks: many.items.slice(1).map((i) => ({
        a: 'item-0',
        b: i.id,
        confidence: 0.5,
        reason: 'Possible related setting',
      })),
    };
    expect(() => validateComposition(many, output)).toThrow();
  });
  it('retries invalid output then reports a labeled fallback', async () => {
    const compose = vi.fn().mockResolvedValue({});
    const provider: CompositionProvider = { model: 'broken', compose };
    const analysis = await analyzeComposition(input, provider);
    expect(compose).toHaveBeenCalledTimes(2);
    expect(analysis.label).toBe('Basic grouping used');
    expect(analysis.inputContentRevision).toBe(3);
    expect(analysis.fallbackReason).toBeTruthy();
  });
  it('has deterministic contributor grouping for up to eight people', async () => {
    const fixture = new FixtureCompositionProvider();
    const many = {
      ...input,
      items: Array.from({ length: 8 }, (_, i) => ({
        id: `item-${i}`,
        contributorId: `person-${i}`,
        contributorName: `Name ${i}`,
        text: '',
      })),
    };
    const a = await fixture.compose(many),
      b = await fixture.compose({ ...many, items: [...many.items].reverse() });
    expect(a).toEqual(b);
    expect(() => validateComposition(many, a)).not.toThrow();
    expect(a.clusters.length).toBeLessThanOrEqual(5);
  });
  it('bounds providers even if they ignore abort signals', async () => {
    vi.useFakeTimers();
    try {
      const promise = analyzeComposition(input, {
        model: 'hang',
        compose: () => new Promise(() => {}),
      });
      await vi.advanceTimersByTimeAsync(40001);
      expect((await promise).fallbackReason).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
  it('uses successful provider output and records versions', async () => {
    const result = await analyzeComposition(input, {
      model: 'test',
      compose: async () => valid,
    });
    expect(result.model).toBe('test');
    expect(result.schemaVersion).toBe('composition-v1');
    expect(result.fallbackReason).toBeNull();
  });
});
