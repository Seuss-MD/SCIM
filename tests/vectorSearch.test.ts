import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  cosineSimilarity,
  parseEmbedding,
  rankBySimilarity,
} from '../components/vectorSearch.ts';

describe('parseEmbedding', () => {
  it('parses a JSON number array', () => {
    assert.deepEqual(parseEmbedding('[0.1, 0.2, 0.3]'), [0.1, 0.2, 0.3]);
  });

  it('returns null for empty, malformed, or non-numeric input', () => {
    assert.equal(parseEmbedding(null), null);
    assert.equal(parseEmbedding(''), null);
    assert.equal(parseEmbedding('not json'), null);
    assert.equal(parseEmbedding('{"a":1}'), null);
    assert.equal(parseEmbedding('[]'), null);
    assert.equal(parseEmbedding('[1, "two", 3]'), null);
  });
});

describe('cosineSimilarity', () => {
  it('is 1 for identical direction and -1 for opposite', () => {
    assert.equal(cosineSimilarity([1, 2, 3], [2, 4, 6]), 1);
    assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
  });

  it('is 0 for orthogonal vectors', () => {
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  });

  it('returns null when vectors cannot be compared', () => {
    assert.equal(cosineSimilarity([1, 2], [1, 2, 3]), null);
    assert.equal(cosineSimilarity([], []), null);
    assert.equal(cosineSimilarity([0, 0], [1, 1]), null);
  });
});

describe('rankBySimilarity', () => {
  const rows = [
    { name: 'hammer', embedding: '[1, 0, 0]' },
    { name: 'screwdriver', embedding: '[0.9, 0.1, 0]' },
    { name: 'blanket', embedding: '[0, 0, 1]' },
    { name: 'no embedding yet', embedding: null },
    { name: 'opposite', embedding: '[-1, 0, 0]' },
  ];

  it('orders matches best first and skips rows without embeddings', () => {
    const ranked = rankBySimilarity(rows, [1, 0, 0], (r) => r.embedding);
    assert.deepEqual(
      ranked.map((r) => r.name),
      ['hammer', 'screwdriver', 'blanket']
    );
    assert.equal(ranked[0].similarity, 1);
  });

  it('respects limit and minSimilarity', () => {
    const ranked = rankBySimilarity(rows, [1, 0, 0], (r) => r.embedding, {
      limit: 5,
      minSimilarity: 0.5,
    });
    assert.deepEqual(ranked.map((r) => r.name), ['hammer', 'screwdriver']);

    const top1 = rankBySimilarity(rows, [1, 0, 0], (r) => r.embedding, { limit: 1 });
    assert.equal(top1.length, 1);
  });
});
