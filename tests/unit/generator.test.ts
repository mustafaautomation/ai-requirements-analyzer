import { describe, it, expect } from 'vitest';
import { TestCaseGenerator, MockLLMClient } from '../../src/generators/test-case-generator';
import { Requirement } from '../../src/core/types';

const mockReq: Requirement = {
  id: 'REQ-001',
  title: 'User Login',
  description: 'Users can log in',
  acceptanceCriteria: ['Email field works', 'Password validated'],
  priority: 'critical',
};

describe('TestCaseGenerator', () => {
  it('should generate test cases from a requirement', async () => {
    const gen = new TestCaseGenerator(new MockLLMClient());
    const cases = await gen.generateForRequirement(mockReq);
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].requirementId).toBe('REQ-001');
  });

  it('should generate report with coverage', async () => {
    const gen = new TestCaseGenerator(new MockLLMClient());
    const report = await gen.generateFromRequirements([mockReq]);
    expect(report.totalTestCases).toBeGreaterThan(0);
    expect(report.coverage.coveragePercentage).toBe(100);
    expect(report.coverage.uncoveredRequirements).toHaveLength(0);
  });

  it('should generate multiple test types', async () => {
    const gen = new TestCaseGenerator(new MockLLMClient());
    const cases = await gen.generateForRequirement(mockReq);
    const types = new Set(cases.map((tc) => tc.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it('should handle multiple requirements', async () => {
    const gen = new TestCaseGenerator(new MockLLMClient());
    const reqs = [mockReq, { ...mockReq, id: 'REQ-002', title: 'Search' }];
    const report = await gen.generateFromRequirements(reqs);
    expect(report.requirements).toHaveLength(2);
    expect(report.coverage.coveredRequirements).toBe(2);
  });

  it('should compute coverage analysis correctly', () => {
    const gen = new TestCaseGenerator(new MockLLMClient());
    const coverage = gen.analyzeCoverage(
      [mockReq, { ...mockReq, id: 'REQ-002' }],
      [
        {
          id: 'TC-1',
          requirementId: 'REQ-001',
          title: 'T',
          type: 'functional',
          priority: 'medium',
          preconditions: [],
          steps: [],
          expectedResult: '',
          tags: [],
        },
      ],
    );
    expect(coverage.coveredRequirements).toBe(1);
    expect(coverage.uncoveredRequirements).toEqual(['REQ-002']);
    expect(coverage.coveragePercentage).toBe(50);
  });
});

describe('TestCaseGenerator - additional', () => {
  it('should include test IDs with requirement reference', () => {
    const gen = new TestCaseGenerator(new MockLLMClient());
    const report = gen.analyzeCoverage(
      [
        {
          id: 'REQ-005',
          title: 'X',
          description: '',
          acceptanceCriteria: [],
          priority: 'high' as const,
        },
      ],
      [
        {
          id: 'TC-REQ-005-1',
          requirementId: 'REQ-005',
          title: 'T',
          type: 'functional' as const,
          priority: 'medium' as const,
          preconditions: [],
          steps: [],
          expectedResult: '',
          tags: [],
        },
      ],
    );
    expect(report.coveragePercentage).toBe(100);
    expect(report.testsByType.functional).toBe(1);
  });

  it('should count tests by priority', () => {
    const gen = new TestCaseGenerator(new MockLLMClient());
    const coverage = gen.analyzeCoverage(
      [mockReq],
      [
        {
          id: 'TC-1',
          requirementId: 'REQ-001',
          title: 'T',
          type: 'functional' as const,
          priority: 'critical' as const,
          preconditions: [],
          steps: [],
          expectedResult: '',
          tags: [],
        },
        {
          id: 'TC-2',
          requirementId: 'REQ-001',
          title: 'T',
          type: 'negative' as const,
          priority: 'high' as const,
          preconditions: [],
          steps: [],
          expectedResult: '',
          tags: [],
        },
      ],
    );
    expect(coverage.testsByPriority.critical).toBe(1);
    expect(coverage.testsByPriority.high).toBe(1);
  });
});
