import { describe, it, expect } from 'vitest';
import { parseRequirements } from '../../src/analyzers/requirement-parser';

describe('parseRequirements', () => {
  it('should parse JSON array format', () => {
    const json = JSON.stringify([
      {
        id: 'R1',
        title: 'Login',
        description: 'User can log in',
        acceptanceCriteria: ['Form works'],
        priority: 'high',
      },
    ]);
    const reqs = parseRequirements(json);
    expect(reqs).toHaveLength(1);
    expect(reqs[0].id).toBe('R1');
    expect(reqs[0].title).toBe('Login');
    expect(reqs[0].priority).toBe('high');
  });

  it('should parse JSON with requirements key', () => {
    const json = JSON.stringify({
      requirements: [{ title: 'Feature A', description: 'Does A' }],
    });
    const reqs = parseRequirements(json);
    expect(reqs).toHaveLength(1);
    expect(reqs[0].id).toBe('REQ-001');
  });

  it('should parse markdown headings', () => {
    const md =
      '## Login Feature\nUsers can log in\n- Email field works\n- Password field works\n\n## Search\nFind products\n- Results update';
    const reqs = parseRequirements(md);
    expect(reqs).toHaveLength(2);
    expect(reqs[0].title).toBe('Login Feature');
    expect(reqs[0].acceptanceCriteria).toHaveLength(2);
    expect(reqs[1].title).toBe('Search');
  });

  it('should normalize priority values', () => {
    const json = JSON.stringify([
      { title: 'A', priority: 'P0' },
      { title: 'B', priority: 'P1' },
      { title: 'C', priority: 'P3' },
      { title: 'D', priority: 'unknown' },
    ]);
    const reqs = parseRequirements(json);
    expect(reqs[0].priority).toBe('critical');
    expect(reqs[1].priority).toBe('high');
    expect(reqs[2].priority).toBe('low');
    expect(reqs[3].priority).toBe('medium');
  });

  it('should generate IDs when missing', () => {
    const json = JSON.stringify([{ title: 'No ID' }]);
    const reqs = parseRequirements(json);
    expect(reqs[0].id).toBe('REQ-001');
  });

  it('should handle empty input', () => {
    expect(parseRequirements('[]')).toHaveLength(0);
    expect(parseRequirements('')).toHaveLength(0);
  });
});

describe('parseRequirements - additional', () => {
  it('should handle requirements with criteria key instead of acceptanceCriteria', () => {
    const json = JSON.stringify([{ title: 'Login', criteria: ['Works', 'Fast'] }]);
    const reqs = parseRequirements(json);
    expect(reqs[0].acceptanceCriteria).toEqual(['Works', 'Fast']);
  });

  it('should handle name field as fallback for title', () => {
    const json = JSON.stringify([{ name: 'Search Feature' }]);
    const reqs = parseRequirements(json);
    expect(reqs[0].title).toBe('Search Feature');
  });

  it('should handle body field as fallback for description', () => {
    const json = JSON.stringify([{ title: 'X', body: 'Some body text' }]);
    const reqs = parseRequirements(json);
    expect(reqs[0].description).toBe('Some body text');
  });
});
