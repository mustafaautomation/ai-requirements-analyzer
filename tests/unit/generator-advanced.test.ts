import { describe, it, expect } from 'vitest';
import { TestCaseGenerator, MockLLMClient } from '../../src/generators/test-case-generator';
import { Requirement } from '../../src/core/types';

const mockClient = new MockLLMClient();
const generator = new TestCaseGenerator(mockClient);

const sampleReqs: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'User Login',
    description: 'Users can log in with email and password',
    acceptanceCriteria: ['Valid login succeeds', 'Invalid shows error'],
    priority: 'high',
  },
  {
    id: 'REQ-002',
    title: 'User Logout',
    description: 'Users can log out',
    acceptanceCriteria: ['Session cleared on logout'],
    priority: 'medium',
  },
];

describe('TestCaseGenerator — generateFromRequirements', () => {
  it('should generate test cases for all requirements', async () => {
    const report = await generator.generateFromRequirements(sampleReqs);
    expect(report.requirements).toHaveLength(2);
    expect(report.testCases.length).toBeGreaterThan(0);
    expect(report.totalTestCases).toBe(report.testCases.length);
  });

  it('should include timestamp in report', async () => {
    const report = await generator.generateFromRequirements(sampleReqs);
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('should link test cases to requirement IDs', async () => {
    const report = await generator.generateFromRequirements(sampleReqs);
    const reqIds = new Set(report.testCases.map((tc) => tc.requirementId));
    expect(reqIds.has('REQ-001')).toBe(true);
    expect(reqIds.has('REQ-002')).toBe(true);
  });
});

describe('TestCaseGenerator — generateForRequirement', () => {
  it('should generate at least 3 test cases per requirement', async () => {
    const testCases = await generator.generateForRequirement(sampleReqs[0]);
    expect(testCases.length).toBeGreaterThanOrEqual(3);
  });

  it('should assign unique IDs to test cases', async () => {
    const testCases = await generator.generateForRequirement(sampleReqs[0]);
    const ids = testCases.map((tc) => tc.id);
    expect(new Set(ids).size).toBe(ids.length); // all unique
  });

  it('should include functional, edge-case, and negative types', async () => {
    const testCases = await generator.generateForRequirement(sampleReqs[0]);
    const types = testCases.map((tc) => tc.type);
    expect(types).toContain('functional');
    expect(types).toContain('edge-case');
    expect(types).toContain('negative');
  });

  it('should include steps and expected result', async () => {
    const testCases = await generator.generateForRequirement(sampleReqs[0]);
    for (const tc of testCases) {
      expect(tc.steps.length).toBeGreaterThan(0);
      expect(tc.expectedResult).toBeTruthy();
    }
  });

  it('should include tags', async () => {
    const testCases = await generator.generateForRequirement(sampleReqs[0]);
    const hasTags = testCases.some((tc) => tc.tags.length > 0);
    expect(hasTags).toBe(true);
  });
});

describe('TestCaseGenerator — analyzeCoverage', () => {
  it('should calculate 100% coverage when all reqs covered', async () => {
    const report = await generator.generateFromRequirements(sampleReqs);
    expect(report.coverage.coveragePercentage).toBe(100);
    expect(report.coverage.uncoveredRequirements).toHaveLength(0);
  });

  it('should detect uncovered requirements', () => {
    const coverage = generator.analyzeCoverage(sampleReqs, [
      {
        id: 'TC-REQ-001-1',
        requirementId: 'REQ-001',
        title: 'Test',
        type: 'functional',
        priority: 'medium',
        preconditions: [],
        steps: ['step'],
        expectedResult: 'result',
        tags: [],
      },
    ]);
    expect(coverage.coveredRequirements).toBe(1);
    expect(coverage.uncoveredRequirements).toContain('REQ-002');
    expect(coverage.coveragePercentage).toBe(50);
  });

  it('should count test cases by type', async () => {
    const report = await generator.generateFromRequirements(sampleReqs);
    const { testsByType } = report.coverage;
    expect(testsByType.functional).toBeGreaterThan(0);
    expect(testsByType['edge-case']).toBeGreaterThan(0);
    expect(testsByType.negative).toBeGreaterThan(0);
  });

  it('should handle empty requirements', () => {
    const coverage = generator.analyzeCoverage([], []);
    expect(coverage.totalRequirements).toBe(0);
    expect(coverage.coveragePercentage).toBe(0);
  });
});

describe('MockLLMClient', () => {
  it('should return valid JSON', async () => {
    const client = new MockLLMClient();
    const response = await client.generate('test prompt');
    const parsed = JSON.parse(response);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('should return test cases with all required fields', async () => {
    const client = new MockLLMClient();
    const response = await client.generate('test');
    const cases = JSON.parse(response);
    for (const tc of cases) {
      expect(tc.title).toBeTruthy();
      expect(tc.type).toBeTruthy();
      expect(tc.steps).toBeInstanceOf(Array);
      expect(tc.expectedResult).toBeTruthy();
    }
  });
});
