import { describe, it, expect } from 'vitest';
import { parseRequirements } from '../../src/analyzers/requirement-parser';

describe('parseRequirements — JSON array', () => {
  it('should parse flat JSON array', () => {
    const json = JSON.stringify([
      {
        id: 'REQ-001',
        title: 'Login',
        description: 'User login flow',
        priority: 'high',
        acceptanceCriteria: ['User can login', 'Error shown for invalid creds'],
      },
      {
        id: 'REQ-002',
        title: 'Logout',
        description: 'User logout',
        priority: 'medium',
        acceptanceCriteria: ['Session cleared'],
      },
    ]);

    const reqs = parseRequirements(json);
    expect(reqs).toHaveLength(2);
    expect(reqs[0].id).toBe('REQ-001');
    expect(reqs[0].priority).toBe('high');
    expect(reqs[0].acceptanceCriteria).toHaveLength(2);
  });

  it('should parse nested requirements key', () => {
    const json = JSON.stringify({
      requirements: [
        { title: 'Dashboard', description: 'Show metrics', criteria: ['Chart visible'] },
      ],
    });

    const reqs = parseRequirements(json);
    expect(reqs).toHaveLength(1);
    expect(reqs[0].title).toBe('Dashboard');
    expect(reqs[0].acceptanceCriteria).toContain('Chart visible');
  });

  it('should auto-generate IDs when missing', () => {
    const json = JSON.stringify([{ title: 'Feature A' }, { title: 'Feature B' }]);
    const reqs = parseRequirements(json);
    expect(reqs[0].id).toBe('REQ-001');
    expect(reqs[1].id).toBe('REQ-002');
  });

  it('should normalize priority aliases', () => {
    const json = JSON.stringify([
      { title: 'A', priority: 'p0' },
      { title: 'B', priority: 'p1' },
      { title: 'C', priority: 'p3' },
      { title: 'D', priority: 'critical' },
      { title: 'E', priority: 'unknown' },
    ]);

    const reqs = parseRequirements(json);
    expect(reqs[0].priority).toBe('critical');
    expect(reqs[1].priority).toBe('high');
    expect(reqs[2].priority).toBe('low');
    expect(reqs[3].priority).toBe('critical');
    expect(reqs[4].priority).toBe('medium'); // unknown defaults to medium
  });

  it('should handle name field as title fallback', () => {
    const json = JSON.stringify([{ name: 'My Feature', body: 'Some description' }]);
    const reqs = parseRequirements(json);
    expect(reqs[0].title).toBe('My Feature');
    expect(reqs[0].description).toBe('Some description');
  });
});

describe('parseRequirements — Markdown', () => {
  it('should parse markdown with headings and bullets', () => {
    const md = `## User Login
Users should be able to log in with email and password.
- User can login with valid credentials
- Error message shown for invalid password
- Account locked after 5 failed attempts

## User Registration
New users can create an account.
- Form validates email format
- Password requires 8+ characters`;

    const reqs = parseRequirements(md);
    expect(reqs).toHaveLength(2);
    expect(reqs[0].title).toBe('User Login');
    expect(reqs[0].acceptanceCriteria).toHaveLength(3);
    expect(reqs[0].acceptanceCriteria[0]).toContain('valid credentials');
    expect(reqs[1].title).toBe('User Registration');
    expect(reqs[1].acceptanceCriteria).toHaveLength(2);
  });

  it('should extract description from non-bullet lines', () => {
    const md = `## Shopping Cart
Allows users to add and manage items before checkout.
- Add items to cart
- Remove items from cart`;

    const reqs = parseRequirements(md);
    expect(reqs[0].description).toContain('manage items');
  });

  it('should assign sequential IDs', () => {
    const md = `## Feat A\n- Criteria A\n## Feat B\n- Criteria B\n## Feat C\n- Criteria C`;
    const reqs = parseRequirements(md);
    expect(reqs[0].id).toBe('REQ-001');
    expect(reqs[1].id).toBe('REQ-002');
    expect(reqs[2].id).toBe('REQ-003');
  });

  it('should default priority to medium for markdown', () => {
    const md = `## Feature\n- Works`;
    const reqs = parseRequirements(md);
    expect(reqs[0].priority).toBe('medium');
  });
});

describe('parseRequirements — edge cases', () => {
  it('should return empty for empty string', () => {
    expect(parseRequirements('')).toHaveLength(0);
  });

  it('should handle plain text as single section', () => {
    // Plain text without ## headings splits on ## — the whole content becomes one section
    const reqs = parseRequirements('just plain text without headings');
    // The markdown parser treats the whole block as one "section"
    expect(reqs.length).toBeLessThanOrEqual(1);
  });

  it('should handle requirements with empty criteria', () => {
    const json = JSON.stringify([{ title: 'No criteria', acceptanceCriteria: [] }]);
    const reqs = parseRequirements(json);
    expect(reqs[0].acceptanceCriteria).toHaveLength(0);
  });
});
