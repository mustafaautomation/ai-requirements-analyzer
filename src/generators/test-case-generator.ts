import {
  Requirement,
  GeneratedTestCase,
  TestType,
  CoverageAnalysis,
  AnalysisReport,
} from '../core/types';

export interface LLMClient {
  generate(prompt: string): Promise<string>;
}

export class TestCaseGenerator {
  private client: LLMClient;

  constructor(client: LLMClient) {
    this.client = client;
  }

  async generateFromRequirements(requirements: Requirement[]): Promise<AnalysisReport> {
    const allTestCases: GeneratedTestCase[] = [];

    for (const req of requirements) {
      const testCases = await this.generateForRequirement(req);
      allTestCases.push(...testCases);
    }

    const coverage = this.analyzeCoverage(requirements, allTestCases);

    return {
      timestamp: new Date().toISOString(),
      requirements,
      testCases: allTestCases,
      coverage,
      totalTestCases: allTestCases.length,
    };
  }

  async generateForRequirement(req: Requirement): Promise<GeneratedTestCase[]> {
    const prompt = buildPrompt(req);
    const response = await this.client.generate(prompt);
    return parseTestCases(response, req.id);
  }

  analyzeCoverage(requirements: Requirement[], testCases: GeneratedTestCase[]): CoverageAnalysis {
    const coveredIds = new Set(testCases.map((tc) => tc.requirementId));
    const uncovered = requirements.filter((r) => !coveredIds.has(r.id)).map((r) => r.id);

    const testsByType: Record<TestType, number> = {
      functional: 0,
      'edge-case': 0,
      negative: 0,
      performance: 0,
      security: 0,
      accessibility: 0,
    };
    const testsByPriority: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const tc of testCases) {
      testsByType[tc.type]++;
      testsByPriority[tc.priority]++;
    }

    return {
      totalRequirements: requirements.length,
      coveredRequirements: coveredIds.size,
      coveragePercentage:
        requirements.length > 0 ? Math.round((coveredIds.size / requirements.length) * 100) : 0,
      uncoveredRequirements: uncovered,
      testsByType,
      testsByPriority,
    };
  }
}

function buildPrompt(req: Requirement): string {
  const criteria = req.acceptanceCriteria.map((c) => `- ${c}`).join('\n');
  return `Generate test cases for this requirement:

Title: ${req.title}
Description: ${req.description}
Priority: ${req.priority}
Acceptance Criteria:
${criteria}

Return a JSON array of test cases. Each test case should have:
- title (string)
- type: "functional" | "edge-case" | "negative" | "performance" | "security"
- preconditions (string array)
- steps (string array)
- expectedResult (string)
- tags (string array)

Generate at least: 1 functional, 1 edge-case, 1 negative test case.
Return ONLY valid JSON array.`;
}

function parseTestCases(response: string, requirementId: string): GeneratedTestCase[] {
  let json = response.trim();
  if (json.startsWith('```')) {
    const lines = json.split('\n');
    lines.shift();
    if (lines[lines.length - 1]?.trim() === '```') lines.pop();
    json = lines.join('\n');
  }

  try {
    const parsed = JSON.parse(json);
    const cases = Array.isArray(parsed) ? parsed : [];
    return cases.map((tc: Record<string, unknown>, i: number) => ({
      id: `TC-${requirementId}-${i + 1}`,
      requirementId,
      title: String(tc.title || `Test ${i + 1}`),
      type: (tc.type as TestType) || 'functional',
      priority: 'medium' as const,
      preconditions: Array.isArray(tc.preconditions) ? tc.preconditions.map(String) : [],
      steps: Array.isArray(tc.steps) ? tc.steps.map(String) : [],
      expectedResult: String(tc.expectedResult || ''),
      tags: Array.isArray(tc.tags) ? tc.tags.map(String) : [],
    }));
  } catch {
    return [];
  }
}

/**
 * Mock LLM client for demos without API key.
 */
export class MockLLMClient implements LLMClient {
  async generate(_prompt: string): Promise<string> {
    return JSON.stringify([
      {
        title: 'Verify happy path',
        type: 'functional',
        preconditions: ['User is logged in', 'Feature is enabled'],
        steps: ['Navigate to feature page', 'Perform the action', 'Verify result'],
        expectedResult: 'Action completes successfully',
        tags: ['smoke', 'regression'],
      },
      {
        title: 'Verify with empty input',
        type: 'edge-case',
        preconditions: ['User is logged in'],
        steps: ['Navigate to form', 'Submit without filling fields'],
        expectedResult: 'Validation errors displayed',
        tags: ['validation'],
      },
      {
        title: 'Verify unauthorized access',
        type: 'negative',
        preconditions: ['User is NOT logged in'],
        steps: ['Navigate directly to protected page'],
        expectedResult: 'Redirected to login page',
        tags: ['security'],
      },
    ]);
  }
}
